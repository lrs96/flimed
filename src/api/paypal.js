"use strict";

const paypal = require('paypal-rest-sdk')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Financial = mongoose.model('Financial')
const Sell = mongoose.model('Sell')
const ErrorLog = mongoose.model('ErrorLog')
const PlanCronJob = mongoose.model('PlanCronJob')
const Event = mongoose.model('Event')
const System = mongoose.model('System')
const path = require('path')
const multer = require('multer')
const crypto = require('crypto')
const fs = require('fs')
const sharp = require('sharp')
const moment = require('moment')
moment.locale('pt-br')
const failMessage = 'Algo deu errado'

paypal.configure({
    'mode': process.env.PAYPAL_CLIENT_MODE,
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
})

async function CreateErrorLog(id, location, description, status, message, level) {
    return await new ErrorLog({
        _idUser: id,
        createdAt: moment().format('L') + ' - ' + moment().format('LT'),
        errorLocation: location,
        errorDescription: description,
        errorStatus: status,
        errorMessage: message,
        level
    }).save()
}

module.exports = app => {
    const {
        existOrError
    } = app.src.api.validation

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './public/upload')
        },
        filename: (req, file, cb) => {
            cb(null, crypto.randomBytes(10).toString('hex') + Date.now() + path.extname(file.originalname).toLowerCase())
        }
    })

    const upload = multer({ storage, fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname).toLowerCase()
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return callback(new Error())
        }

        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 5120
    }}).single('file')

    const buy = async (req, res) => {
        const order = { ...req.body }

        try {
            existOrError(order.speciality, 'Escolha sua especialidade')
            existOrError(order.start, 'Escolha a data de início')
            existOrError(order.end, 'Escolha a data final')
            existOrError(order.city, 'Escolha a cidade')
        } catch(msg) {
            return res.status(400).render('medico-anuncios', {
                page: 'Anúncios',
                user: req.session.user,
                message: JSON.stringify(msg)
            })
        }

        const daysDifference = parseInt(moment.duration(moment(order.end).diff(moment(order.start).startOf('day'))).asDays().toFixed(0))

        if(moment(order.start).format('DD') < moment().format('DD')) {
            return res.status(400).render('medico-anuncios', {
                page: 'Anúncios',
                message: JSON.stringify('A data de início não pode ser menor que a data atual'),
                user: req.session.user
            })
        }

        if(daysDifference <= 0) {
            return res.status(400).render('medico-anuncios', {
                page: 'Anúncios',
                message: JSON.stringify('A data final deve ser maior que a data atual'),
                user: req.session.user
            })
        }

        const price = await System.find().then(system => system[0].priceAdvertisementProfile)
        .catch(err => err)

        if(price instanceof Error || !price) {
            return res.status(400).render('medico-anuncios', {
                page: 'Anúncios',
                user: req.session.user,
                message: JSON.stringify(failMessage)
            })
        }

        const create_payment_json = {
            'intent': 'sale',
            'payer': {
                'payment_method': 'paypal'
            },
            'redirect_urls': {
                'cancel_url': process.env.DOMAIN_NAME + '/medico-anuncios',
                'return_url': process.env.DOMAIN_NAME + '/success'
            },
            'transactions': [{
                'item_list': {
                    'items': [{
                        'name': 'Destaque do perfil',
                        'sku': 1,
                        'price': (price / 100).toFixed(2),
                        'currency': 'BRL',
                        'quantity': daysDifference
                    }]
                },
                'amount': {
                    'currency': 'BRL',
                    'total': ((price / 100).toFixed(2) * daysDifference).toFixed(2)
                },
                'description': 'Aquisição de destaque de perfil no portal Flimed'
            }]
        }

        paypal.payment.create(create_payment_json, async (err, successPayment) => {
            if(err) {
                await CreateErrorLog(
                    req.session.user._id,
                    '/buy - POST',
                    'Failed to create payment',
                    err.httpStatusCode,
                    err,
                    'high'
                )

                return res.status(err.httpStatusCode).render('medico-anuncios', {
                    page: 'Anúncios',
                    message: JSON.stringify(failMessage),
                    user: req.session.user
                })
            } else {
                successPayment.links.forEach(async link => {
                    if(link.rel === 'approval_url') {
                        await User.findOne({ _id: req.session.user._id }).then(async user => {
                            await Financial.find().then(async financial => {
                                await new Sell(successPayment).save().then(async sell => {
                                    if(financial.length) {
                                        financial[0].productReport.push({
                                            _idUser: user._id,
                                            _idPaypalReport: sell._id,
                                            product: 'Destaque do perfil',
                                            amountPerProduct: Number((price / 100).toFixed(2)),
                                            total: Number(((price / 100).toFixed(2) * daysDifference).toFixed(2)),
                                            status: 'pendente',
                                            createdAtDay: moment().format('L'),
                                            createdAtMoment: moment().format('LTS'),
                                            startAt: moment(order.start).format('L'),
                                            endAt: moment(order.end).format('L'),
                                            totalDays: daysDifference,
                                            city: order.city,
                                            speciality: order.speciality
                                        })                            
    
                                        await financial[0].save().then(async _ => {
                                            user.purchasesHistoric.product.push({
                                                _idPayment: financial[0].productReport.slice(-1)[0]._id,
                                                title: financial[0].productReport.slice(-1)[0].product,
                                                status: financial[0].productReport.slice(-1)[0].status,
                                                city: order.city,
                                                speciality: order.speciality,
                                                daysUntilPlanIsOver: daysDifference,
                                                startAt: moment(order.start).format('L')
                                            })
    
                                            await user.save()
                                        })
                                    } else {
                                        await new Financial({
                                            productReport: [{
                                                _idUser: user._id,
                                                _idPaypalReport: sell._id,
                                                product: 'Destaque do perfil',
                                                amountPerProduct: Number((price / 100).toFixed(2)),
                                                total: Number(((price / 100).toFixed(2) * daysDifference).toFixed(2)),
                                                status: 'pendente',
                                                createdAtDay: moment().format('L'),
                                                createdAtMoment: moment().format('LTS'),
                                                startAt: moment(order.start).format('L'),
                                                endAt: moment(order.end).format('L'),
                                                totalDays: daysDifference,
                                                city: order.city,
                                                speciality: order.speciality
                                            }]
                                        }).save().then(async financial => {
                                            user.purchasesHistoric.product.push({
                                                _idPayment: financial.productReport[0]._id,
                                                title: financial.productReport[0].product,
                                                status: financial.productReport[0].status,
                                                city: order.city,
                                                speciality: order.speciality,
                                                daysUntilPlanIsOver: daysDifference,
                                                startAt: moment(order.start).format('L')
                                            })
    
                                            await user.save()
                                        })
                                    }
                                }).catch(async err => {
                                    await CreateErrorLog(
                                        req.session.user._id,
                                        '/buy - POST',
                                        'Failed to create sell report',
                                        '500',
                                        err,
                                        'high'
                                    )
        
                                    return res.status(400).render('medico-anuncios', {
                                        page: 'Anúncios',
                                        message: JSON.stringify(failMessage),
                                        user: req.session.user
                                    })
                                })
                            }).then(_ => res.redirect(link.href))
                        }).catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/buy - POST',
                                'Failed to create/update financial report',
                                '400',
                                err,
                                'medium'
                            )

                            return res.status(400).render('medico-anuncios', {
                                page: 'Anúncios',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })
                    }
                })
            }
        })
    }

    const success = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            await Financial.find().then(async financial => {
                let productReport = null, position = null
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(user.purchasesHistoric.product.slice(-1)[0]._idPayment == financial[0].productReport[i]._id) {
                        productReport = financial[0].productReport[i]
                        position = i
                        break
                    }
                }

                if(!productReport) { 
                    await CreateErrorLog(
                        req.session.user._id,
                        '/success - GET',
                        'Failed to check if user has product id',
                        '400',
                        null,
                        'low'
                    )

                    return res.status(400).render('medico-anuncios', {
                        page: 'Anúncios',
                        message: JSON.stringify(failMessage),
                        user: req.session.user
                    })
                }

                const execute_payment_json = {
                    'payer_id': req.query.PayerID,  
                    'transactions': [{
                        'amount': {
                            'currency': 'BRL',
                            'total': productReport.total.toFixed(2) 
                        }
                    }]
                }

                paypal.payment.execute(req.query.paymentId, execute_payment_json, async (err, payment) => {
                    if(err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/success - GET',
                            'Failed to execute payment',
                            err.httpStatusCode,
                            err,
                            'high'
                        )

                        return res.status(400).render('medico-anuncios', {
                            page: 'Anúncios',
                            message: JSON.stringify(failMessage),
                            user: req.session.user
                        })
                    } else {
                        if(financial[0].productReport[position]._idPaypalReport) {
                            await Sell.deleteOne({ _id: financial[0].productReport[position]._idPaypalReport })
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/success - GET',
                                    'Failed to delete old sell report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('medico-anuncios', {
                                    page: 'Anúncios',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                        }
                    
                        await new Sell(payment).save()
                        .then(payment => financial[0].productReport[position]._idPaypalReport = payment._id)
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success - GET',
                                'Failed to create new sell report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).render('medico-anuncios', {
                                page: 'Anúncios',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })
                                
                        financial[0].productReport[position].status = 'concluído'  
                        if(!financial[0].firstSale) financial[0].firstSale = moment().format('L') + ' ' + moment().format('LTS')
                        financial[0].lastSale = moment().format('L') + ' ' + moment().format('LTS')
                        if(!financial[0].salesAmount) financial[0].salesAmount = Number(productReport.total.toFixed(2))
                        else financial[0].salesAmount += Number(productReport.total.toFixed(2))
                        user.purchasesHistoric.product.slice(-1)[0].status = 'concluído'

                        await new PlanCronJob({
                            _idUser: req.session.user._id,
                            _idFinancial: financial[0].productReport[position]._id,
                            type: 'vencimento',
                            daysUntilPlanIsOver: financial[0].productReport[position].totalDays,
                            status: 'pendente'
                        }).save()
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success - GET',
                                'Failed to create cron job',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).render('medico-anuncios', {
                                page: 'Anúncios',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })

                        await financial[0].save()
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success - GET',
                                'Failed to update financial report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).render('medico-anuncios', {
                                page: 'Anúncios',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })

                        await user.save().then(_ => res.status(200).render('success'))
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success - GET',
                                'Failed to update user status',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).render('medico-anuncios', {
                                page: 'Anúncios',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })
                    }
                })
            })
        }).catch(async err => {
            await CreateErrorLog(
                req.session.user._id,
                '/success - GET',
                'Failed to find financial report',
                '400',
                err,
                'medium'
            )

            return res.status(400).render('medico-anuncios', {
                page: 'Anúncios',
                message: JSON.stringify(failMessage),
                user: req.session.user
            })
        })
    }

    const buyBanner = (req, res) => {
        upload(req, res, async function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json(failMessage)
            } else if (err) {
                return res.status(500).json(failMessage)
            } else if (!req.file) {
                return res.status(400).json('Você deve selecionar uma imagem')
            }

            const order = { ...req.body }

            try {
                existOrError(order.speciality, 'Escolha sua especialidade')
                existOrError(order.start, 'Escolha a data de início')
                existOrError(order.end, 'Escolha a data final')
                existOrError(order.city, 'Escolha a cidade')
                existOrError(order.genre, 'Escolha o gênero')
            } catch(msg) {
                return res.status(400).json(msg)
            }

            const daysDifference = parseInt(moment.duration(moment(order.end).diff(moment(order.start).startOf('day'))).asDays().toFixed(0))

            if(moment(order.start).format('DD') < moment().format('DD')) {
                return res.status(400).json('A data de início não pode ser menor que a data atual')
            }

            if(daysDifference <= 0) {
                return res.status(400).json('A data final deve ser maior que a data atual')
            }

            const price = await System.find().then(system => system[0].priceAdvertisementBanner)
            .catch(err => err)

            if(price instanceof Error || !price) {
                return res.status(400).json(failMessage)
            }

            sharp.cache(false)
            sharp('./public/upload/' + req.file.filename).resize({
                width: 1110,
                height: 120,
                fit: sharp.fit.cover,
                position: sharp.strategy.entropy
            }).toFile('./public/upload/banner/' + req.file.filename)
            .then(_ => fs.unlinkSync('./public/upload/' + req.file.filename))
            .then(_ => {
                const create_payment_json = {
                    'intent': 'sale',
                    'payer': {
                        'payment_method': 'paypal'
                    },
                    'redirect_urls': {
                        'cancel_url': process.env.DOMAIN_NAME + '/medico-anuncios',
                        'return_url': process.env.DOMAIN_NAME + '/success-banner'
                    },
                    'transactions': [{
                        'item_list': {
                            'items': [{
                                'name': 'Banner de destaque',
                                'sku': 2,
                                'price': (price / 100).toFixed(2),
                                'currency': 'BRL',
                                'quantity': daysDifference
                            }]
                        },
                        'amount': {
                            'currency': 'BRL',
                            'total': ((price / 100).toFixed(2) * daysDifference).toFixed(2)
                        },
                        'description': 'Aquisição de banner de destaque no portal Flimed'
                    }]
                }
    
                paypal.payment.create(create_payment_json, async (err, successPayment) => {
                    if(err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/buy-banner - POST',
                            'Failed to create payment',
                            err.httpStatusCode,
                            err,
                            'high'
                        )
    
                        return res.status(err.httpStatusCode).json(failMessage)
                    } else {
                        successPayment.links.forEach(async link => {
                            if(link.rel === 'approval_url') {
                                await User.findOne({ _id: req.session.user._id }).then(async user => {
                                    await Financial.find().then(async financial => {
                                        await new Sell(successPayment).save().then(async sell => {
                                            if(financial.length) {
                                                financial[0].productReport.push({
                                                    _idUser: user._id,
                                                    _idPaypalReport: sell._id,
                                                    banner: req.file.filename,
                                                    product: 'Banner de destaque',
                                                    amountPerProduct: Number((price / 100).toFixed(2)),
                                                    total: Number(((price / 100).toFixed(2) * daysDifference).toFixed(2)),
                                                    status: 'pendente',
                                                    createdAtDay: moment().format('L'),
                                                    createdAtMoment: moment().format('LTS'),
                                                    startAt: moment(order.start).format('L'),
                                                    endAt: moment(order.end).format('L'),
                                                    totalDays: daysDifference,
                                                    city: order.city,
                                                    speciality: order.speciality
                                                })                            
            
                                                await financial[0].save().then(async _ => {
                                                    user.purchasesHistoric.product.push({
                                                        _idPayment: financial[0].productReport.slice(-1)[0]._id,
                                                        title: financial[0].productReport.slice(-1)[0].product,
                                                        status: financial[0].productReport.slice(-1)[0].status,
                                                        city: order.city,
                                                        speciality: order.speciality,
                                                        daysUntilPlanIsOver: daysDifference,
                                                        startAt: moment(order.start).format('L')
                                                    })
            
                                                    await user.save()
                                                })
                                            } else {
                                                await new Financial({
                                                    productReport: [{
                                                        _idUser: user._id,
                                                        _idPaypalReport: sell._id,
                                                        banner: req.file.filename,
                                                        product: 'Banner de destaque',
                                                        amountPerProduct: Number((price / 100).toFixed(2)),
                                                        total: Number(((price / 100).toFixed(2) * daysDifference).toFixed(2)),
                                                        status: 'pendente',
                                                        createdAtDay: moment().format('L'),
                                                        createdAtMoment: moment().format('LTS'),
                                                        startAt: moment(order.start).format('L'),
                                                        endAt: moment(order.end).format('L'),
                                                        totalDays: daysDifference,
                                                        city: order.city,
                                                        speciality: order.speciality
                                                    }]
                                                }).save().then(async financial => {
                                                    user.purchasesHistoric.product.push({
                                                        _idPayment: financial.productReport[0]._id,
                                                        title: financial.productReport[0].product,
                                                        status: financial.productReport[0].status,
                                                        city: order.city,
                                                        speciality: order.speciality,
                                                        daysUntilPlanIsOver: daysDifference,
                                                        startAt: moment(order.start).format('L')
                                                    })
            
                                                    await user.save()
                                                })
                                            }
                                        }).catch(async err => {
                                            await CreateErrorLog(
                                                req.session.user._id,
                                                '/buy-banner - POST',
                                                'Failed to create sell report',
                                                '500',
                                                err,
                                                'high'
                                            )
    
                                            return res.status(err.httpStatusCode).json(failMessage)
                                        })
                                    }).then(_ => res.status(200).json({ msg: 'Sucesso!', url: link.href }))
                                }).catch(async err => {
                                    await CreateErrorLog(
                                        req.session.user._id,
                                        '/buy-banner - POST',
                                        'Failed to create/update financial report',
                                        '400',
                                        err,
                                        'medium'
                                    )
    
                                    return res.status(err.httpStatusCode).json(failMessage)
                                })
                            }
                        })
                    }
                })
            }).catch(_ => res.status(400).json(failMessage))
        })
    }

    const successBanner = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            await Financial.find().then(async financial => {
                let productReport = null, position = null
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(user.purchasesHistoric.product.slice(-1)[0]._idPayment == financial[0].productReport[i]._id) {
                        productReport = financial[0].productReport[i]
                        position = i
                        break
                    }
                }

                if(!productReport) { 
                    await CreateErrorLog(
                        req.session.user._id,
                        '/success-banner - GET',
                        'Failed to check if user has product id',
                        '400',
                        null,
                        'low'
                    )

                    return res.status(400).json(failMessage)
                }

                const execute_payment_json = {
                    'payer_id': req.query.PayerID,  
                    'transactions': [{
                        'amount': {
                            'currency': 'BRL',
                            'total': productReport.total.toFixed(2) 
                        }
                    }]
                }

                paypal.payment.execute(req.query.paymentId, execute_payment_json, async (err, payment) => {
                    if(err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/success-banner - GET',
                            'Failed to execute payment',
                            err.httpStatusCode,
                            err,
                            'high'
                        )

                        return res.status(400).json(failMessage)
                    } else {
                        if(financial[0].productReport[position]._idPaypalReport) {
                            await Sell.deleteOne({ _id: financial[0].productReport[position]._idPaypalReport })
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/success-banner - GET',
                                    'Failed to delete old sell report',
                                    '500',
                                    err,
                                    'high'
                                )

                                return res.status(400).json(failMessage)
                            })
                        }

                        await new Sell(payment).save()
                        .then(payment => financial[0].productReport[position]._idPaypalReport = payment._id)
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success-banner - GET',
                                'Failed to create new sell report',
                                '500',
                                err,
                                'high'
                            )

                            return res.status(400).json(failMessage)
                        })

                        financial[0].productReport[position].status = 'aguardando liberacao'  
                        if(!financial[0].firstSale) financial[0].firstSale = moment().format('L') + ' ' + moment().format('LTS')
                        financial[0].lastSale = moment().format('L') + ' ' + moment().format('LTS')
                        if(!financial[0].salesAmount) financial[0].salesAmount = Number(productReport.total.toFixed(2))
                        else financial[0].salesAmount += Number(productReport.total.toFixed(2))
                        user.purchasesHistoric.product.slice(-1)[0].status = 'aguardando liberacao'

                        await financial[0].save()
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success-banner - GET',
                                'Failed to update financial report',
                                '500',
                                err,
                                'high'
                            )

                            return res.status(400).json(failMessage)
                        })

                        await user.save().then(_ => res.status(200).render('success'))
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/success-banner - GET',
                                'Failed to update user status',
                                '500',
                                err,
                                'high'
                            )

                            return res.status(400).json(failMessage)
                        })
                    }
                })
            })
        }).catch(async err => {
            await CreateErrorLog(
                req.session.user._id,
                '/success-banner - GET',
                'Failed to find financial report',
                '400',
                err,
                'medium'
            )

            return res.status(400).json(failMessage)
        })
    }

    const buyNewAppointment = async (req, res) => {
        const request = { ...req.query }

        if(
            !request.patientAgreement ||
            !request.patientName ||
            !request.patientGenre ||
            !request.patientEmail ||
            !request.patientPhone ||
            !request.patientComment ||
            !request.idEvent ||
            !request.idDoctor
        ) return res.status(400).render('500')

        const checkEvent = await Event.findOne({ _id: request.idEvent }).then(event => event)
        .catch(err => new Error(err))
        if(checkEvent instanceof Error) return res.status(400).render('500')
        if(!checkEvent || checkEvent._id != request.idEvent || checkEvent._idDoctor != request.idDoctor || checkEvent.status !== 'disponível') return res.status(400).render('500')


        const create_payment_json = {
            'intent': 'sale',
            'payer': {
                'payment_method': 'paypal'
            },
            'redirect_urls': {
                'cancel_url': process.env.DOMAIN_NAME + '/marcar-consulta?eventId=' + request.idEvent + '&doctorId=' + request.idDoctor,
                'return_url': process.env.DOMAIN_NAME + '/success-agendamento?idEvent=' + request.idEvent +
                '&idDoctor=' + request.idDoctor +
                '&idPatient=' + request.idPatient +
                '&patientAgreement=' + request.patientAgreement.replace(/\s/g, '+') +
                '&patientEmail=' + request.patientEmail.replace(/\s/g, '+') +
                '&patientPhone=' + request.patientPhone.replace(/\s/g, '+') +
                '&patientGenre=' + request.patientGenre.replace(/\s/g, '+') +
                '&patientName=' + request.patientName.replace(/\s/g, '+') +
                '&patientComment=' + request.patientComment.replace(/\s/g, '+'),  
            },
            'transactions': [{
                'item_list': {
                    'items': [{
                        'name': 'Agendamento - Telemedicina',
                        'sku': checkEvent._id,
                        'price': (checkEvent.value / 100).toFixed(2),
                        'currency': 'BRL',
                        'quantity': 1
                    }]
                },
                'amount': {
                    'currency': 'BRL',
                    'total': (checkEvent.value / 100).toFixed(2)
                },
                'description': 'Agendamento no portal Flimed'
            }]
        }

        paypal.payment.create(create_payment_json, async (err, successPayment) => {
            if(err) {
                await CreateErrorLog(
                    req.session.user._id,
                    '/buyNewAppointment - POST',
                    'Failed to create payment',
                    err.httpStatusCode,
                    err,
                    'high'
                )

                return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                    doctor.password = undefined

                    res.status(err.httpStatusCode).render('page-marca-consulta', {
                        page: 'Marcar consulta',
                        user: req.session.user,
                        message: JSON.stringify(failMessage),
                        event: checkEvent,
                        doctor
                    })
                }).catch(_ => res.status(500).render('500'))
            } else {
                successPayment.links.forEach(async link => {
                    if(link.rel === 'approval_url') {
                        await User.findOne({ _id: request.idPatient }).then(async user => {
                            await Financial.find().then(async financial => {
                                await new Sell(successPayment).save().then(async sell => {
                                    if(financial.length) {
                                        financial[0].appointmentReport.push({
                                            _idPatient: user._id,
                                            _idDoctor: request.idDoctor,
                                            _idEvent: request.idEvent,
                                            _idPaypalReport: sell._id,
                                            product: 'Agendamento - Telemedicina', 
                                            total: Number((checkEvent.value / 100).toFixed(2)),
                                            status: 'pendente', 
                                            createdAtDay: moment().format('L'),
                                            createdAtMoment: moment().format('LTS')
                                        })                            
    
                                        await financial[0].save().then(async _ => {
                                            user.purchasesHistoric.appointment.push({
                                                _idPayment: financial[0].appointmentReport.slice(-1)[0]._id,
                                                _idEvent: request.idEvent,
                                                title: financial[0].appointmentReport.slice(-1)[0].product,
                                                status: financial[0].appointmentReport.slice(-1)[0].status,
                                                value: financial[0].appointmentReport.slice(-1)[0].total
                                            })
    
                                            await user.save()
                                        })
                                    } else {
                                        await new Financial({
                                            appointmentReport: [{
                                                _idPatient: user._id,
                                                _idDoctor: request.idDoctor,
                                                _idPaypalReport: sell._id,
                                                product: 'Agendamento - Telemedicina', 
                                                total: Number((checkEvent.value / 100).toFixed(2)),
                                                status: 'pendente', 
                                                createdAtDay: moment().format('L'),
                                                createdAtMoment: moment().format('LTS')
                                            }]
                                        }).save().then(async financial => {
                                            user.purchasesHistoric.appointment.push({
                                                _idPayment: financial.appointmentReport[0]._id,
                                                _idEvent: request.idEvent,
                                                title: financial.appointmentReport[0].product,
                                                status: financial.appointmentReport[0].status,
                                                value: financial.appointmentReport[0].total
                                            })
    
                                            await user.save()
                                        })
                                    }
                                }).catch(async err => {
                                    await CreateErrorLog(
                                        req.session.user._id,
                                        '/buyNewAppointment - POST',
                                        'Failed to create sell report',
                                        '500',
                                        err,
                                        'high'
                                    )

                                    return await User.findOne({ _id: request.idDoctor }).then(doctor => {
                                        doctor.password = undefined
                    
                                        res.status(err.httpStatusCode).render('page-marca-consulta', {
                                            page: 'Marcar consulta',
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage),
                                            event: checkEvent,
                                            doctor
                                        })
                                    }).catch(_ => res.status(500).render('500'))
                                })
                            }).then(_ => res.redirect(link.href))
                        }).catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/buyNewAppointment - POST',
                                'Failed to create/update financial report',
                                '400',
                                err,
                                'medium'
                            )

                            return await User.findOne({ _id: request.idDoctor }).then(doctor => {
                                doctor.password = undefined
            
                                res.status(err.httpStatusCode).render('page-marca-consulta', {
                                    page: 'Marcar consulta',
                                    user: req.session.user,
                                    message: JSON.stringify(failMessage),
                                    event: checkEvent,
                                    doctor
                                })
                            }).catch(_ => res.status(500).render('500'))
                        })
                    }
                })
            }
        })
    }

    const successNewAppointment = (req, res) => {
        const request = { ...req.query }

        if(
            !request.patientAgreement ||
            !request.patientName ||
            !request.patientGenre ||
            !request.patientEmail ||
            !request.patientPhone ||
            !request.patientComment ||
            !request.idEvent ||
            !request.idDoctor
        ) return res.status(400).render('500')

        Event.findOne({ _id: request.idEvent }).then(event => {
            if(!event) return res.status(400).render('500')
            if(event._idDoctor != request.idDoctor) return res.status(400).render('500')

            Financial.find().then(financial => {
                User.findOne({ _id: request.idPatient }).then(async user => {
                    let appointmentReport = null, position = null
                    for(let i = 0; i < user.purchasesHistoric.appointment.length; i++) {
                        if(user.purchasesHistoric.appointment[i]._idEvent == event._id) {
                            for(let j = 0; j < financial[0].appointmentReport.length; j++) {
                                if(user.purchasesHistoric.appointment[i]._idPayment == financial[0].appointmentReport[j]._id) {
                                    appointmentReport = financial[0].appointmentReport[j]
                                    position = j
                                    break
                                }
                            }
                        }
                    }
    
                    if(!appointmentReport) {
                        return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                            doctor.password = undefined
        
                            res.status(err.httpStatusCode).render('page-marca-consulta', {
                                page: 'Marcar consulta',
                                user: req.session.user,
                                message: JSON.stringify(failMessage),
                                event: checkEvent,
                                doctor
                            })
                        }).catch(_ => res.status(500).render('500'))
                    }

                    const execute_payment_json = {
                        'payer_id': request.PayerID,  
                        'transactions': [{
                            'amount': {
                                'currency': 'BRL',
                                'total': (event.value / 100).toFixed(2) 
                            }
                        }]
                    }
                    
                    paypal.payment.execute(request.paymentId, execute_payment_json, async (err, payment) => {
                        if(err) {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/successNewAppointment - GET',
                                'Failed to execute payment',
                                err.httpStatusCode,
                                err,
                                'high'
                            )
    
                            return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                doctor.password = undefined
            
                                res.status(err.httpStatusCode).render('page-marca-consulta', {
                                    page: 'Marcar consulta',
                                    user: req.session.user,
                                    message: JSON.stringify(failMessage),
                                    event: checkEvent,
                                    doctor
                                })
                            }).catch(_ => res.status(500).render('500'))
                        } else {
                            if(financial[0].appointmentReport[position]._idPaypalReport) {
                                await Sell.deleteOne({ _id: financial[0].appointmentReport[position]._idPaypalReport })
                                .catch(async err => {
                                    await CreateErrorLog(
                                        req.session.user._id,
                                        '/successNewAppointment - GET',
                                        'Failed to delete old sell report',
                                        '500',
                                        err,
                                        'high'
                                    )
    
                                    return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                        doctor.password = undefined
                    
                                        res.status(err.httpStatusCode).render('page-marca-consulta', {
                                            page: 'Marcar consulta',
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage),
                                            event: checkEvent,
                                            doctor
                                        })
                                    }).catch(_ => res.status(500).render('500'))
                                })
                            }

                            await new Sell(payment).save()
                            .then(payment => financial[0].appointmentReport[position]._idPaypalReport = payment._id)
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successNewAppointment - GET',
                                    'Failed to create new sell report',
                                    '500',
                                    err,
                                    'high'
                                )
    
                                return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                    doctor.password = undefined
                
                                    res.status(err.httpStatusCode).render('page-marca-consulta', {
                                        page: 'Marcar consulta',
                                        user: req.session.user,
                                        message: JSON.stringify(failMessage),
                                        event: checkEvent,
                                        doctor
                                    })
                                }).catch(_ => res.status(500).render('500'))
                            })

                            financial[0].appointmentReport[position].status = 'concluído'  
                            if(!financial[0].firstSale) financial[0].firstSale = moment().format('L LTS')
                            financial[0].lastSale = moment().format('L LTS')
                            if(!financial[0].salesAmount) financial[0].salesAmount = Number(appointmentReport.total.toFixed(2))
                            else financial[0].salesAmount += Number(appointmentReport.total.toFixed(2))
                            user.purchasesHistoric.appointment.slice(-1)[0].status = 'concluído'

                            console.log(request.patientGenre)
                            event._idPatient = request.idPatient
                            event.title = request.patientName
                            event.color = '#dc7d35'
                            event.status = 'pendente'
                            event.withdrawalStatus = 'pendente'                            
                            event.patientInfo = {
                                patientAgreement: request.patientAgreement,
                                registerBy: request.registerBy,
                                patientName: request.patientName,
                                patientGenre: request.patientGenre,
                                patientEmail: request.patientEmail,
                                patientPhone: request.patientPhone,
                                patientComment: request.patientComment
                            }
                            event.teleMedicineInfo.URLPatient = process.env.URL_BASE_TELEMEDICINA +
                            '/scheduling?idEvent=' +  event._id +
                            '&idUser=' + request.idPatient + 
                            '&name=' + request.patientName.replace(/\s/g, '+') +
                            '&role=patient'

                            await event.save()
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successNewAppointment - GET',
                                    'Failed to update event',
                                    '500',
                                    err,
                                    'high'
                                )
    
                                return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                    doctor.password = undefined
                
                                    res.status(err.httpStatusCode).render('page-marca-consulta', {
                                        page: 'Marcar consulta',
                                        user: req.session.user,
                                        message: JSON.stringify(failMessage),
                                        event: checkEvent,
                                        doctor
                                    })
                                }).catch(_ => res.status(500).render('500'))
                            })

                            await financial[0].save()
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successNewAppointment - GET',
                                    'Failed to update financial report',
                                    '500',
                                    err,
                                    'high'
                                )
    
                                return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                    doctor.password = undefined
                
                                    res.status(err.httpStatusCode).render('page-marca-consulta', {
                                        page: 'Marcar consulta',
                                        user: req.session.user,
                                        message: JSON.stringify(failMessage),
                                        event: checkEvent,
                                        doctor
                                    })
                                }).catch(_ => res.status(500).render('500'))
                            })
    
                            await user.save().then(_ => res.status(200).render('success'))
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successNewAppointment - GET',
                                    'Failed to update user status',
                                    '500',
                                    err,
                                    'high'
                                )
    
                                return await User.findOne({ _id: request.idDoctor }).then(async doctor => {
                                    doctor.password = undefined
                
                                    res.status(err.httpStatusCode).render('page-marca-consulta', {
                                        page: 'Marcar consulta',
                                        user: req.session.user,
                                        message: JSON.stringify(failMessage),
                                        event: checkEvent,
                                        doctor
                                    })
                                }).catch(_ => res.status(500).render('500'))
                            })
                        }
                    })
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const subscription = async (req, res) => {
        const planId = req.params.id
        const { plans } = require('../config/paypal/plans')
        let plan = null
        for(let i = 0; i < plans.length; i++) {
            if(planId === plans[i].id) {
                plan = plans[i]
                break
            }
        }

        if(req.session.user.purchasesHistoric.plan.length) {
            if(req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].title === plan.title && req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].status === 'ativo') {
                return res.status(400).render('page-preco', {
                    page: 'Planos',
                    user: req.session.user,
                    message: JSON.stringify('Você já é assinante deste plano')
                })
            }

            if(req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].title === 'Plano Plus' && req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].status === 'ativo') {
                return res.status(400).render('page-preco', {
                    page: 'Planos',
                    user: req.session.user,
                    message: JSON.stringify('Não é possível regredir para um plano menor')
                })
            }

            if(req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].title === 'Plano Advanced' && plan.title === 'Plano Medium' && req.session.user.purchasesHistoric.plan[req.session.user.purchasesHistoric.plan.length - 1].status === 'ativo') {
                return res.status(400).render('page-preco', {
                    page: 'Planos',
                    user: req.session.user,
                    message: JSON.stringify('Não é possível regredir para um plano menor')
                })
            }
        }

        if(!plan) {
            await CreateErrorLog(
                req.session.user._id,
                '/subscription - POST',
                'Failed to check if plan id exist',
                '400',
                null,
                'low'
            )

            return res.status(400).render('page-preco', {
                page: 'Planos',
                message: JSON.stringify(failMessage),
                user: req.session.user
            })
        }

        const billingPlanAttributes = {
            'name': 'Assinatura do ' + plan.title,
            'description': plan.description,
            'type': 'INFINITE',
            'merchant_preferences': {
                'auto_bill_amount': 'YES',
                'initial_fail_amount_action': 'CANCEL',
                'max_fail_attempts': '1',
                'cancel_url': process.env.DOMAIN_NAME + '/planos',
                'return_url': process.env.DOMAIN_NAME + '/successSubscription'
            },
            'payment_definitions': [{
                'amount': {
                    'currency': 'BRL',
                    'value': plan.price.toFixed(2)
                },
                'cycles': '0',
                'frequency': plan.frequency,
                'frequency_interval': plan.frequency_interval,
                'name': plan.title,
                'type': 'REGULAR'
            }]
        }
        
        const billingPlanUpdateAttributes = [{
            'op': 'replace',
            'path': '/',
            'value': {
                'state': 'ACTIVE'
            }
        }]

        let isoDate = new Date()
        isoDate.setSeconds(isoDate.getSeconds() + 10)
        isoDate.toISOString().slice(0, 19) + 'Z'
        
        const billingAgreementAttributes = {
            'name': plan.title,
            'description': plan.description,
            'start_date': isoDate,
            'plan': {
                'id': plan.id
            },
            'payer': {
                'payment_method': 'paypal'
            }
        }

        paypal.billingPlan.create(billingPlanAttributes, async function (err, billingPlan) {
            if (err) {
                await CreateErrorLog(
                    req.session.user._id,
                    '/planos - POST',
                    'Failed to create billing plan',
                    err.httpStatusCode,
                    err,
                    'high'
                )

                return res.status(err.httpStatusCode).render('page-preco', {
                    page: 'Planos',
                    message: JSON.stringify(failMessage),
                    user: req.session.user
                })
            } else {
                paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, async function (err, response) {
                    if (err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/planos - POST',
                            'Failed to update billing plan',
                            err.httpStatusCode,
                            err,
                            'high'
                        )

                        return res.status(err.httpStatusCode).render('page-preco', {
                            page: 'Planos',
                            message: JSON.stringify(failMessage),
                            user: req.session.user
                        })
                    } else {
                        billingAgreementAttributes.plan.id = billingPlan.id
                        paypal.billingAgreement.create(billingAgreementAttributes, async function (err, billingAgreement) {
                            if (err) {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/planos - POST',
                                    'Failed to create billing agreement',
                                    err.httpStatusCode,
                                    err,
                                    'high'
                                )

                                return res.status(err.httpStatusCode).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            } else {
                                for (let index = 0; index < billingAgreement.links.length; index++) {
                                    if (billingAgreement.links[index].rel === 'approval_url') {
                                        await User.findOne({ _id: req.session.user._id }).then(async user => {
                                            await Financial.find().then(async financial => {
                                                await new Sell(billingAgreement).save().then(async sell => {
                                                    if(financial.length) {
                                                        financial[0].planReport.push({
                                                            _idUser: user._id,
                                                            _idBillingAgreement: billingAgreementAttributes.plan.id,
                                                            _idPaypalReport: sell._id,
                                                            plan: plan.title,
                                                            amount: Number(plan.price.toFixed(2)),
                                                            status: 'pendente',
                                                            createdAtDay: moment().format('L'),
                                                            createdAtMoment: moment().format('LTS')
                                                        })   

                                                        user.purchasesHistoric.plan.push({ 
                                                            _idPayment: financial[0].planReport[financial[0].planReport.length - 1]._id,
                                                            status: 'pendente'
                                                        })

                                                        await financial[0].save()
                                                        await user.save()
                                                    } else {
                                                        await new Financial({
                                                            planReport: [{
                                                                _idUser: user._id,
                                                                _idBillingAgreement: billingAgreementAttributes.plan.id,
                                                                _idPaypalReport: sell._id,
                                                                plan: plan.title,
                                                                amount: Number(plan.price.toFixed(2)),
                                                                status: 'pendente',
                                                                createdAtDay: moment().format('L'),
                                                                createdAtMoment: moment().format('LTS')
                                                            }]
                                                        }).save().then(async financial => {
                                                            user.purchasesHistoric.plan.push({ 
                                                                _idPayment: financial.planReport[0]._id,
                                                                status: 'pendente'
                                                            })
                                                            
                                                            await user.save()
                                                        })
                                                    }
                                                }).catch(async err => {
                                                    await CreateErrorLog(
                                                        req.session.user._id,
                                                        '/planos - POST',
                                                        'Failed to create sell report',
                                                        '500',
                                                        err,
                                                        'high'
                                                    )
        
                                                    return res.status(500).render('page-preco', {
                                                        page: 'Planos',
                                                        message: JSON.stringify(failMessage),
                                                        user: req.session.user
                                                    })
                                                })
                                            })
                                        }).catch(async err => {
                                            await CreateErrorLog(
                                                req.session.user._id,
                                                '/planos - POST',
                                                'Failed to create/update financial report',
                                                '400',
                                                err,
                                                'medium'
                                            )

                                            return res.status(400).render('page-preco', {
                                                page: 'Planos',
                                                message: JSON.stringify(failMessage),
                                                user: req.session.user
                                            })
                                        })

                                        return res.redirect(billingAgreement.links[index].href)
                                    }
                                }
                            }
                        })
                    }
                })
            }
        })
    }

    const successSubscription = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            await Financial.find().then(async financial => {
                let planReport = null, position = null
                for(let i = 0; i < financial[0].planReport.length; i++) {
                    if(user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1]._idPayment == financial[0].planReport[i]._id) {
                        planReport = financial[0].planReport[i]
                        position = i
                        break
                    }
                }

                if(!planReport) { 
                    await CreateErrorLog(
                        req.session.user._id,
                        '/successSubscription - GET',
                        'Failed to check if user has plan id',
                        '400',
                        null,
                        'low'
                    )

                    return res.status(400).render('page-preco', {
                        page: 'Planos',
                        message: JSON.stringify(failMessage),
                        user: req.session.user
                    })
                }

                paypal.billingAgreement.execute(req.query.token, {}, async function (err, billingAgreement) {
                    if(err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/successSubscription - GET',
                            'Failed to execute billing plan',
                            err.httpStatusCode,
                            err,
                            'high'
                        )

                        return res.status(err.httpStatusCode).render('page-preco', {
                            page: 'Planos',
                            message: JSON.stringify(failMessage),
                            user: req.session.user
                        })
                    } else {
                        if(financial[0].planReport[position]._idPaypalReport) {
                            await Sell.deleteOne({ _id: financial[0].planReport[position]._idPaypalReport })
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successSubscription - GET',
                                    'Failed to delete old sell report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                        }

                        await new Sell(billingAgreement).save()
                        .then(payment => financial[0].planReport[position]._idPaypalReport = payment._id)
                        .catch(async err => {
                            await CreateErrorLog(
                                req.session.user._id,
                                '/successSubscription - GET',
                                'Failed to create new sell report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).render('page-preco', {
                                page: 'Planos',
                                message: JSON.stringify(failMessage),
                                user: req.session.user
                            })
                        })     

                        const Day = moment().format('L')
                        const Moment = moment().format('LTS')

                        financial[0].planReport[position]._idPaypalProfile = billingAgreement.id
                        financial[0].planReport[position].status = 'ativo'  
                        if(!financial[0].firstSale) financial[0].firstSale = Day + ' ' + Moment
                        financial[0].lastSale = Day + ' ' + Moment
                        if(!financial[0].totalPerMonth) financial[0].totalPerMonth = Number(planReport.amount.toFixed(2))
                        else financial[0].totalPerMonth += Number(planReport.amount.toFixed(2))
                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].status = 'ativo'
                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].title = financial[0].planReport[position].plan
                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].startAt = Day
                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].payment.paymentDay = Day

                        if(user.purchasesHistoric.plan.length > 1) {
                            for(let i = 0; i < financial[0].planReport.length; i++) {
                                if(user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2]._idPayment == financial[0].planReport[i]._id &&
                                    (user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].status === 'ativo' ||
                                    user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].status === 'pendente') &&
                                    !user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].payment._idCronJob) {
                                        
                                    const cancel_note = {
                                        'note': 'Substituição de plano'
                                    }
                                    
                                    return paypal.billingAgreement.cancel(financial[0].planReport[i]._idPaypalProfile, cancel_note, async function (err, response) {
                                        if (err) {
                                            await CreateErrorLog(
                                                req.session.user._id,
                                                '/successSubscription - GET',
                                                'Failed to cancel old plan',
                                                '400',
                                                err,
                                                'high'
                                            )
                                
                                            return res.status(400).render('page-preco', {
                                                page: 'Planos',
                                                message: JSON.stringify(failMessage),
                                                user: req.session.user
                                            })
                                        } else {
                                            return paypal.billingAgreement.get(financial[0].planReport[i]._idPaypalProfile, async function (err, billingAgreement) {
                                                if (err) {
                                                    await CreateErrorLog(
                                                        req.session.user._id,
                                                        '/successSubscription - GET',
                                                        'Failed to chech if plan is cancelled',
                                                        '400',
                                                        err,
                                                        'medium'
                                                    )
                                        
                                                    return res.status(400).render('page-preco', {
                                                        page: 'Planos',
                                                        message: JSON.stringify(failMessage),
                                                        user: req.session.user
                                                    })
                                                } else { 
                                                    if(financial[0].planReport[i]._idPaypalReport) {
                                                        await Sell.deleteOne({ _id: financial[0].planReport[i]._idPaypalReport })
                                                        .catch(async err => {
                                                            await CreateErrorLog(
                                                                req.session.user._id,
                                                                '/successSubscription - GET',
                                                                'Failed to delete old sell report',
                                                                '500',
                                                                err,
                                                                'high'
                                                            )
                                            
                                                            return res.status(400).render('page-preco', {
                                                                page: 'Planos',
                                                                message: JSON.stringify(failMessage),
                                                                user: req.session.user
                                                            })
                                                        })
                                                    }

                                                    await new Sell(billingAgreement).save()
                                                    .then(payment => financial[0].planReport[i]._idPaypalReport = payment._id)
                                                    .catch(async err => {
                                                        await CreateErrorLog(
                                                            req.session.user._id,
                                                            '/successSubscription - GET',
                                                            'Failed to create new sell report',
                                                            '500',
                                                            err,
                                                            'high'
                                                        )
                                        
                                                        return res.status(500).render('page-preco', {
                                                            page: 'Planos',
                                                            message: JSON.stringify(failMessage),
                                                            user: req.session.user
                                                        })
                                                    })

                                                    financial[0].totalPerMonth -= financial[0].planReport[i].amount
                                                    user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].endAt = Day
                                                    if(user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].status === 'pendente') {
                                                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].status = 'upgrade'
                                                        financial[0].planReport[i].status = 'upgrade'
                                                    } else {
                                                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 2].status = 'cancelado'
                                                        financial[0].planReport[i].status = 'cancelado'
                                                    }
                                                    
                                                    await financial[0].save()
                                                    .catch(async err => {
                                                        await CreateErrorLog(
                                                            req.session.user._id,
                                                            '/successSubscription - GET',
                                                            'Failed to update financial report',
                                                            '500',
                                                            err,
                                                            'high'
                                                        )
                                            
                                                        return res.status(500).render('page-preco', {
                                                            page: 'Planos',
                                                            message: JSON.stringify(failMessage),
                                                            user: req.session.user
                                                        })
                                                    })
                                                    
                                                    return await user.save().then(async user => { 
                                                        user.password = undefined
                                                        req.session.user = user
                                                        return res.status(200).render('success')
                                                    })
                                                    .catch(async err => {
                                                        await CreateErrorLog(
                                                            req.session.user._id,
                                                            '/successSubscription - GET',
                                                            'Failed to update user status',
                                                            '500',
                                                            err,
                                                            'high'
                                                        )
                                            
                                                        return res.status(500).render('page-preco', {
                                                            page: 'Planos',
                                                            message: JSON.stringify(failMessage),
                                                            user: req.session.user
                                                        })
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            }

                            await financial[0].save()
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successSubscription - GET',
                                    'Failed to update financial report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                            
                            return await user.save().then(async user => { 
                                user.password = undefined
                                req.session.user = user
                                return res.status(200).render('success')
                            })
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successSubscription - GET',
                                    'Failed to update user status',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                        } else {
                            await financial[0].save()
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successSubscription - GET',
                                    'Failed to update financial report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                            
                            await user.save().then(async user => { 
                                user.password = undefined
                                req.session.user = user
                                res.status(200).render('success')
                            })
                            .catch(async err => {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/successSubscription - GET',
                                    'Failed to update user status',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).render('page-preco', {
                                    page: 'Planos',
                                    message: JSON.stringify(failMessage),
                                    user: req.session.user
                                })
                            })
                        }        
                    }
                })
            })
        }).catch(async err => {
            await CreateErrorLog(
                req.session.user._id,
                '/successSubscription - GET',
                'Failed to create/update financial report',
                '400',
                err,
                'medium'
            )

            return res.status(400).render('page-preco', {
                page: 'Planos',
                message: JSON.stringify(failMessage),
                user: req.session.user
            })
        })
    }

    const viewCancelPlan = (req, res) => {
        res.status(200).render('page-cancelar-plano', {
            page: req.url,
            user: req.session.user,
            message: null
        })
    }

    const cancelPlan = async (req, res) => {
        return await User.findOne({ _id: req.session.user._id }).then(async user => {
            if(!user) { 
                return res.status(401).render('page-cancelar-plano', {
                    page: req.url,
                    user: req.session.user,
                    message: JSON.stringify(failMessage)
                })
            }

            return await Financial.find().then(financial => {
                if(!financial.length) { 
                    return res.status(400).render('page-cancelar-plano', {
                        page: req.url,
                        user: req.session.user,
                        message: JSON.stringify(failMessage)
                    })
                }

                let billingAgreementId = null, position = null
                for(let i = 0; i < financial[0].planReport.length; i++) {
                    if(user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1]._idPayment == financial[0].planReport[i]._id) {
                        billingAgreementId = financial[0].planReport[i]._idPaypalProfile
                        position = i
                        break
                    }
                }

                if(!billingAgreementId) { 
                    return res.status(401).render('page-cancelar-plano', {
                        page: req.url,
                        user: req.session.user,
                        message: JSON.stringify(failMessage)
                    })
                }

                const cancel_note = {
                    'note': 'Cancelamento do plano'
                }

                paypal.billingAgreement.cancel(billingAgreementId, cancel_note, async function (err, response) {
                    if (err) {
                        await CreateErrorLog(
                            req.session.user._id,
                            '/cancel - POST',
                            'Failed to cancel plan',
                            err.httpStatusCode,
                            err,
                            'high'
                        )
                        
                        return res.status(400).render('page-cancelar-plano', {
                            page: req.url,
                            user: req.session.user,
                            message: JSON.stringify(failMessage)
                        })
                    } else {
                        paypal.billingAgreement.get(billingAgreementId, async function (err, billingAgreement) {
                            if (err) {
                                await CreateErrorLog(
                                    req.session.user._id,
                                    '/cancel - GET',
                                    'Failed to check if plan is cancelled',
                                    err.httpStatusCode,
                                    err,
                                    'medium'
                                )
                                
                                return res.status(400).render('page-cancelar-plano', {
                                    page: req.url,
                                    user: req.session.user,
                                    message: JSON.stringify(failMessage)
                                })
                            } else {   
                                if(financial[0].planReport[position]._idPaypalReport) {      
                                    await Sell.deleteOne({ _id: financial[0].planReport[position]._idPaypalReport })
                                    .catch(async err => {
                                        await CreateErrorLog(
                                            req.session.user._id,
                                            '/cancel - POST',
                                            'Failed to delete old sell report',
                                            '500',
                                            err,
                                            'high'
                                        )
                            
                                        return res.status(500).render('page-cancelar-plano', {
                                            page: req.url,
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage)
                                        })
                                    })
                                }
                                
                                await new Sell(billingAgreement).save()
                                .then(payment => financial[0].planReport[position]._idPaypalReport = payment._id)
                                .catch(async err => {
                                    await CreateErrorLog(
                                        req.session.user._id,
                                        '/cancel - POST',
                                        'Failed to create new sell report',
                                        '500',
                                        err,
                                        'high'
                                    )
                        
                                    return res.status(500).render('page-cancelar-plano', {
                                        page: req.url,
                                        user: req.session.user,
                                        message: JSON.stringify(failMessage)
                                    })
                                })
                                
                                const start = moment(user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].payment.paymentDay, 'DD/MM/YYYY')
                                const end = moment(moment().format('L'), 'DD/MM/YYYY')
                                const daysUntilPlanIsOver = parseInt(moment.duration(start.diff(end)).asDays().toFixed(0))
                                
                                if(daysUntilPlanIsOver <= 0) {
                                    user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].status = 'cancelado'
                                    user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].endAt = moment().format('L')
                                    financial[0].planReport[position].status = 'cancelado'
                                    financial[0].totalPerMonth -= financial[0].planReport[position].amount
                                    financial[0].planReport[position].amount = 0

                                    await financial[0].save()
                                    .catch(async err => {
                                        await CreateErrorLog(
                                            req.session.user._id,
                                            '/cancel - POST',
                                            'Failed to update financial report',
                                            '500',
                                            err,
                                            'high'
                                        )
                            
                                        return res.status(500).render('page-cancelar-plano', {
                                            page: req.url,
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage)
                                        })
                                    })

                                    await user.save()
                                    .catch(async err => {
                                        await CreateErrorLog(
                                            req.session.user._id,
                                            '/cancel - POST',
                                            'Failed to update user status',
                                            '500',
                                            err,
                                            'high'
                                        )
                            
                                        return res.status(500).render('page-cancelar-plano', {
                                            page: req.url,
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage)
                                        })
                                    })

                                    req.session.reset()          
                                    req.logout()     
                                    return res.status(200).redirect('/')
                                } else {
                                    return await new PlanCronJob({
                                        _idUser: req.session.user._id,
                                        _idFinancial: financial[0].planReport[position]._id,
                                        type: 'cancelamento',
                                        daysUntilPlanIsOver: daysUntilPlanIsOver,
                                        status: 'pendente'
                                    }).save().then(async cronJob => {
                                        await financial[0].save()
                                        .catch(async err => {
                                            await CreateErrorLog(
                                                req.session.user._id,
                                                '/cancel - POST',
                                                'Failed to update financial report',
                                                '500',
                                                err,
                                                'high'
                                            )
                                
                                            return res.status(500).render('page-cancelar-plano', {
                                                page: req.url,
                                                user: req.session.user,
                                                message: JSON.stringify(failMessage)
                                            })
                                        })

                                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].payment._idCronJob = cronJob._id
                                        user.purchasesHistoric.plan[user.purchasesHistoric.plan.length - 1].endAt = moment(moment().format('L'), 'DD/MM/YYYY').add(cronJob.daysUntilPlanIsOver, 'days').format('L')

                                        return await user.save().then(_ => res.status(200).render('page-cancelar-plano', {
                                            page: req.url,
                                            user: req.session.user,
                                            message: JSON.stringify('Sucesso!')
                                        })).catch(async err => {
                                            await CreateErrorLog(
                                                req.session.user._id,
                                                '/cancel - POST',
                                                'Failed to update user status',
                                                '500',
                                                err,
                                                'high'
                                            )
                                
                                            return res.status(500).render('page-cancelar-plano', {
                                                page: req.url,
                                                user: req.session.user,
                                                message: JSON.stringify(failMessage)
                                            })
                                        })
                                    }).catch(async err => {
                                        await CreateErrorLog(
                                            req.session.user._id,
                                            '/cancel - POST',
                                            'Failed to create cron job',
                                            '500',
                                            err,
                                            'high'
                                        )
                            
                                        return res.status(500).render('page-cancelar-plano', {
                                            page: req.url,
                                            user: req.session.user,
                                            message: JSON.stringify(failMessage)
                                        })
                                    })
                                }
                            }
                        })
                    }
                })
            })
        }).catch(async err => {
            await CreateErrorLog(
                req.session.user._id,
                '/cancel - POST',
                'Failed to create/update financial report',
                '400',
                err,
                'medium'
            )

            return res.status(400).render('page-cancelar-plano', {
                page: req.url,
                user: req.session.user,
                message: JSON.stringify(failMessage)
            })
        })
    }

    const ipn = async (req, res) => {
        const paypalHandleIPN = { ...req.body }
        if(!paypalHandleIPN.create_time || !paypalHandleIPN.resource.agreement_details.last_payment_date) return res.status(401).end()
        
        const createTime = new Date(paypalHandleIPN.create_time)
        const lastPaymentDate = new Date(paypalHandleIPN.resource.agreement_details.last_payment_date)
        if(createTime.toString() === 'Invalid Date' || lastPaymentDate.toString() === 'Invalid Date') return res.status(401).end()
        
        return await Financial.find().then(async financial => {
            if(!financial.length) return res.status(401).end()

            let userId = null, position = null
            for(let i = 0; i < financial[0].planReport.length; i++) {
                if(paypalHandleIPN.resource.id == financial[0].planReport[i]._idBillingAgreement) {
                    userId = financial[0].planReport[i]._idUser
                    position = i
                    break
                }
            }

            if(!userId) return res.status(401).end()

            if(paypalHandleIPN.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' || paypalHandleIPN.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
                const daysUntilPlanIsOver = parseInt((moment.duration(moment(createTime).diff(moment(lastPaymentDate).startOf('day'))).asDays().toFixed(0)))
                
                if(daysUntilPlanIsOver <= 0) {
                    return await User.findOne({ _id: userId }).then(async user => {
                        if(user.purchasesHistoric.plan.length) {
                            for(let i = 0; i < user.purchasesHistoric.plan.length; i++) {
                                if(user.purchasesHistoric.plan[i]._idPayment == financial[0].planReport[position]._id) {
                                    user.purchasesHistoric.plan[i].status = 'cancelado'
                                    user.purchasesHistoric.plan[i].endAt = moment().format('L')
                                    break
                                }
                            }

                            if(financial[0].planReport[position]._idPaypalReport) {
                                await Sell.deleteOne({ _id: financial[0].planReport[position]._idPayment })
                                .catch(async err => { 
                                    await CreateErrorLog(
                                        null,
                                        '/ipn - POST',
                                        'Failed to delete old sell report',
                                        '500',
                                        err,
                                        'high'
                                    )
                        
                                    return res.status(500).end()
                                })
                            }

                            await new Sell(paypalHandleIPN).save()
                            .then(payment => financial[0].planReport[position]._idPayment = payment._id)
                            .catch(async err => { 
                                await CreateErrorLog(
                                    null,
                                    '/ipn - POST',
                                    'Failed to create new sell report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).end()
                            })

                            financial[0].planReport[position].status = 'cancelado'
                            financial[0].totalPerMonth -= financial[0].planReport[position].amount
                        
                            await user.save()
                            .catch(async err => { 
                                await CreateErrorLog(
                                    null,
                                    '/ipn - POST',
                                    'Failed update user status',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).end()
                            })

                            return await financial[0].save().then(_ => res.status(200).end())
                            .catch(async err => { 
                                await CreateErrorLog(
                                    null,
                                    '/ipn - POST',
                                    'Failed update financial report',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).end()
                            })
                        } else return res.status(401).end()
                    }).catch(async err => { 
                        await CreateErrorLog(
                            null,
                            '/ipn - POST',
                            'Failed to search user',
                            '500',
                            err,
                            'high'
                        )
            
                        return res.status(500).end()
                    })
                } else {
                    return await new PlanCronJob({
                        _idUser: userId,
                        _idFinancial: financial[0].planReport[position]._id,
                        type: 'cancelamento',
                        daysUntilPlanIsOver: 30 - daysUntilPlanIsOver,
                        status: 'pendente'
                    }).save().then(async cronJob => {
                        if(user.purchasesHistoric.plan.length) {
                            for(let i = 0; i < user.purchasesHistoric.plan.length; i++) {
                                if(user.purchasesHistoric.plan[i]._idPayment == financial[0].planReport[position]._id) {
                                    user.purchasesHistoric.plan[i].payment._idCronJob = cronJob._id
                                    user.purchasesHistoric.plan[i].endAt = moment(moment().format('L'), 'DD/MM/YYYY').add(cronJob.daysUntilPlanIsOver, 'days').format('L')
                                    break
                                }
                            }

                            return await user.save().then(_ => res.status(200).end())
                            .catch(async err => { 
                                await CreateErrorLog(
                                    null,
                                    '/ipn - POST',
                                    'Failed update user status with cron job id',
                                    '500',
                                    err,
                                    'high'
                                )
                    
                                return res.status(500).end()
                            })
                        } else return res.status(401).end()
                    })
                    .catch(async err => { 
                        await CreateErrorLog(
                            null,
                            '/ipn - POST',
                            'Failed create crojob',
                            '500',
                            err,
                            'high'
                        )
            
                        return res.status(500).end()
                    })
                }
            } else if(paypalHandleIPN.event_type === 'BILLING.SUBSCRIPTION.RE-ACTIVATED') {
                return await User.findOne({ _id: userId }).then(async user => {
                    if(user.purchasesHistoric.plan.length) {
                        for(let i = 0; i < user.purchasesHistoric.plan.length; i++) {
                            if(user.purchasesHistoric.plan[i]._idPayment == financial[0].planReport[position]._id) {
                                user.purchasesHistoric.plan[i].status = 'ativo'
                                user.purchasesHistoric.plan[i].endAt = undefined
                                user.purchasesHistoric.plan[i].payment.paymentDay = moment(paypalHandleIPN.resource.agreement_details.next_billing_date).format('DD/MM/YYYY')
                                if(user.purchasesHistoric.plan[i].payment._idCronJob) {
                                    if(user.purchasesHistoric.plan[i].payment._idCronJob) {
                                        await PlanCronJob.deleteOne({ _id: user.purchasesHistoric.plan[i].payment._idCronJob  })
                                        .catch(async err => { 
                                            await CreateErrorLog(
                                                null,
                                                '/ipn - POST',
                                                'Failed to delete cron job',
                                                '500',
                                                err,
                                                'high'
                                            )
                                
                                            return res.status(500).end()
                                        })
                                    }

                                    user.purchasesHistoric.plan[i].payment._idCronJob = undefined
                                }

                                break
                            }
                        }

                        await Sell.deleteOne({ _id: financial[0].planReport[position]._idPayment })
                        .catch(async err => { 
                            await CreateErrorLog(
                                null,
                                '/ipn - POST',
                                'Failed to delete old sell report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).end()
                        })

                        await new Sell(paypalHandleIPN).save()
                        .then(payment => financial[0].planReport[position]._idPayment = payment._id)
                        .catch(async err => { 
                            await CreateErrorLog(
                                null,
                                '/ipn - POST',
                                'Failed to create new sell report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).end()
                        })

                        financial[0].planReport[position].status = 'ativo'
                        financial[0].totalPerMonth += financial[0].planReport[position].amount
                        
                        await user.save()
                        .catch(async err => { 
                            await CreateErrorLog(
                                null,
                                '/ipn - POST',
                                'Failed update user status',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).end()
                        })

                        return await financial[0].save().then(_ => res.status(200).end())
                        .catch(async err => { 
                            await CreateErrorLog(
                                null,
                                '/ipn - POST',
                                'Failed update financial report',
                                '500',
                                err,
                                'high'
                            )
                
                            return res.status(500).end()
                        })
                    } else return res.status(401).end()
                }).catch(async err => { 
                    await CreateErrorLog(
                        null,
                        '/ipn - POST',
                        'Failed to search user',
                        '500',
                        err,
                        'high'
                    )
        
                    return res.status(500).end()
                })
            } else return res.status(401).end()
        }).catch(async err => { 
            await CreateErrorLog(
                null,
                '/ipn - POST',
                'Failed to handle IPN response from Paypal',
                '500',
                err,
                'high'
            )

            return res.status(500).end()
        })
    }

    return {
        buy,
        success,
        buyBanner,
        successBanner,
        buyNewAppointment,
        successNewAppointment,
        subscription,
        successSubscription,
        viewCancelPlan,
        cancelPlan,
        ipn
    }
}