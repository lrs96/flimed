"use strict";

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Financial = mongoose.model('Financial')
const Event = mongoose.model('Event')
const ErrorLog = mongoose.model('ErrorLog')
const Attendance = mongoose.model('Attendance')
const Sell = mongoose.model('Sell')
const System = mongoose.model('System')
const PlanCronJob = mongoose.model('PlanCronJob')
const paypal = require('paypal-rest-sdk')
const moment = require('moment')
moment.locale('pt-br')
const successMessage = 'Sucesso!'
const failMessage = 'Algo deu errado'

module.exports = app => {
    const {
        existOrError,
        notExistOrError,
        tooSmall,
        tooBig,
        tooBigEmail,
        equalsOrError,
        strongOrError,
        hasDigitOrError,
        hasUpperOrError,
        hasLowerOrError,
        notSpaceOrError,
        hasSpecialOrError,
        validEmailOrError
    } = app.src.api.validation
    
    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    const viewAdminPanel = async (req, res) => {
        const userQnty = await User.countDocuments()
        .catch(_ => res.status(500).render('500'))

        const aguardandoLiberacao = []
        let countSales = 0
        await Financial.find().then(financial => {
            if(financial.length) {
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    countSales++

                    if(financial[0].productReport[i].status === 'aguardando liberacao') {
                        aguardandoLiberacao.push(financial[0].productReport[i])
                    }
                }

                for(let i = 0; i < financial[0].planReport.length; i++) {
                    countSales++
                }
            }
        }).catch(_ => res.status(500).render('500'))

        const scheduleQnty = await Event.countDocuments({ status: 'concluído' })
        .catch(_ => res.status(500).render('500'))

        const errorQnty = await ErrorLog.countDocuments()
        .catch(_ => res.status(500).render('500'))

        System.find().then(system => {
            res.status(200).render('./admin/index', {
                user: req.session.user,
                page: req.url,
                userQnty,
                aguardandoLiberacao,
                countSales,
                scheduleQnty,
                errorQnty,
                system: system[0],
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const changePrice = (req, res) => {
        const request = { ...req.body }

        try {
            existOrError(request.type, 'Algo deu errado')
            existOrError(request.value)
        } catch(msg) {
            return res.status(400).json(msg)
        }

        request.value = Number((request.value * 100).toFixed(0))
        if(request.value.toString() === 'NaN') return res.status(400).json(failMessage)

        System.find().then(system => {
            if(!system.length) {
                if(request.type === 'profile') {
                    new System({
                        priceAdvertisementProfile: request.value
                    }).save().then(_ => res.status(200).json(successMessage))
                } else {
                    new System({
                        priceAdvertisementBanner: request.value
                    }).save().then(_ => res.status(200).json(successMessage))
                }
            } else {
                if(request.type === 'profile') {
                    system[0].priceAdvertisementProfile = request.value
                } else {
                    system[0].priceAdvertisementBanner = request.value
                }

                system[0].save().then(_ => res.status(200).json(successMessage))
            }
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewAdminProfile = (req, res) => {
        res.status(200).render('./admin/index', {
            user: req.session.user,
            page: req.url,
            message: null
        })
    }

    const changeProfileAdmin = async (req, res) => {
        if (!req.body.newName && !req.body.newPhone && !req.body.newEmail && !req.body.currentPassword && !req.body.newPassword && !req.body.confirmNewPassword) {
            return res.status(400).json(failMessage)
        } 

        await User.findOne({ _id: req.session.user._id }).then(async user => {
            if (req.body.newName) {
                try {
                    tooSmall(req.body.newName, 'Nome muito curto, digite um nome maior')
                    tooBig(req.body.newName, 'Nome muito longo, digite um nome menor')
                } catch (msg) {
                    return res.status(400).json(msg)
                }

                user.name = req.body.newName
            } 

            if (req.body.newPhone) {
                user.phone = req.body.newPhone
            } 

            if (req.body.newEmail) {
                try {
                    tooBigEmail(req.body.newEmail, 'Seu Email é muito longo')
                    validEmailOrError(req.body.newEmail, 'Email inválido')
                    const userFromDB = await User.findOne({ email: req.body.newEmail })
                    notExistOrError(userFromDB, 'Esse Email já está registrado')
                } catch (msg) {
                    return res.status(400).json(msg)
                }

                user.email = req.body.newEmail
            } 

            if (req.body.currentPassword || req.body.newPassword || req.body.confirmNewPassword) {
                try {
                    existOrError(req.body.currentPassword, 'Digite sua senha atual')
                    existOrError(req.body.newPassword, 'Digite sua nova senha')
                    existOrError(req.body.confirmNewPassword, 'Digite a confirmação da sua nova senha')
                    const checkUser = await User.findOne({ _id: req.session.user._id })
                    const isMatch = bcrypt.compareSync(req.body.currentPassword, checkUser.password)
                    if (!isMatch) return res.status(401).json('Senha inválida')
                    hasDigitOrError(req.body.newPassword, 'A senha deve ter pelo menos um número')
                    hasLowerOrError(req.body.newPassword, 'A senha deve ter pelo menos uma letra minúscula')
                    hasUpperOrError(req.body.newPassword, 'A senha deve ter pelo menos uma letra maiúscula')
                    notSpaceOrError(req.body.newPassword, 'A senha não deve ter espaços em branco')
                    hasSpecialOrError(req.body.newPassword, 'A senha deve ter pelo menos um caractere especial')
                    strongOrError(req.body.newPassword, 'A senha deve conter pelo menos 8 caracteres')
                    equalsOrError(req.body.newPassword, req.body.confirmNewPassword, 'A senha e confirmação da senha não são iguais')
                } catch (msg) {
                    return res.status(400).json(msg)
                }

                user.password = encryptPassword(req.body.newPassword)
            } 

            await user.save().then(user => {
                user.password = undefined
                req.session.user = user
                return res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const changeUserProfile = async (req, res) => {
        if (!req.body.newName && !req.body.newPhone && !req.body.newEmail) {
            return res.status(400).json(failMessage)
        } 

        await User.findOne({ _id: req.params.id }).then(async user => {
            if(req.session.user._id !== user._id && !user.admin) {
                if (req.body.newName) {
                    try {
                        tooSmall(req.body.newName, 'Nome muito curto, digite um nome maior')
                        tooBig(req.body.newName, 'Nome muito longo, digite um nome menor')
                    } catch (msg) {
                        return res.status(400).json(msg)
                    }

                    user.name = req.body.newName
                } 

                if (req.body.newPhone) {
                    user.phone = req.body.newPhone
                } 

                if (req.body.newEmail) {
                    try {
                        tooBigEmail(req.body.newEmail, 'Seu Email é muito longo')
                        validEmailOrError(req.body.newEmail, 'Email inválido')
                        const userFromDB = await User.findOne({ email: req.body.newEmail })
                        notExistOrError(userFromDB, 'Esse Email já está registrado')
                    } catch (msg) {
                        return res.status(400).json(msg)
                    }

                    user.email = req.body.newEmail
                } 

                await user.save().then(_ => res.status(200).json(successMessage))
            } else {
                return res.status(401).json(failMessage)
            }
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewAdminFinancial = async (req, res) => {
        await Financial.find().then(financial => {
            if(financial.length) {
                return res.status(200).render('./admin/index', {
                    user: req.session.user,
                    page: req.url,
                    financial: financial[0],
                    moment,
                    message: null
                })
            } else {
                return res.status(400).redirect('/admin-painel')
            }                  
        }).catch(_ => res.status(500).render('500'))
    }

    const viewAdminPaypalReport = async (req, res) => {
        await Sell.findOne({ _id: req.params.id }).then(sell => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify(sell, undefined, '\t'))
        }).catch(_ => {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify(failMessage))
        })
    }

    const viewUsers = async (req, res) => {
        let usertype

        if(req.url === '/admin-pacientes') {
            usertype = 'PACIENTE'
        } else if(req.url === '/admin-medicos') {
            usertype = 'MEDICO'
        } else if(req.url === '/admin-clinicas') {
            usertype = 'CLINICA'
        }

        await User.find({ usertype }).then(users => {
            for(let i = 0; i < users.length; i++) { users[i].password = undefined }

            res.status(200).render('./admin/index', {
                user: req.session.user,
                page: req.url,
                users,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const adminViewProfileDetails = async (req, res) => {
        await User.findOne({ _id: req.params.id }).then(async client => {
            client.password = undefined

            let attendance = []
            if(client.usertype === 'PACIENTE') {
                await Attendance.find({ _idPatient: req.params.id }).then(async attendanceInfo => {
                    for(let i = 0; i < attendanceInfo.length; i++) {
                        await Event.findOne({ _id: attendanceInfo[i]._idEvent }).then(async event => {
                            console.log(event._idDoctor)
                            attendance.push({
                                event: {
                                    patientInfo: event.patientInfo,
                                    doctorName: await User.findOne({ _id: event._idDoctor }).then(doctor => doctor.name),
                                    location: event.locationInfo,
                                    status: event.status
                                },
                                attendanceInfo: attendanceInfo[i]
                            })
                        })
                    }
                })
            } else { 
                await Attendance.find({ _idDoctor: req.params.id }).then(async attendanceInfo => {
                    for(let i = 0; i < attendanceInfo.length; i++) {
                        await Event.findOne({ _id: attendanceInfo[i]._idEvent }).then(async event => {
                            attendance.push({
                                event: {
                                    patientInfo: event.patientInfo,
                                    doctorName: await User.findOne({ _id: event._idDoctor }).then(doctor => doctor.name),
                                    location: event.locationInfo,
                                    status: event.status
                                },
                                attendanceInfo: attendanceInfo[i]
                            })
                        })
                    }
                })
            }

            res.status(200).render('./admin/index', {
                user: req.session.user,
                page: '/admin-detalhes',
                client,
                attendance,
                moment,
                message: null
            })
        }).catch(err => console.log(err))
    }

    const adminRemoveUser = async (req, res) => {
        await User.findOne({ _id: req.params.id }).then(async client => {
            if(client.deletedAt) client.deletedAt = undefined
            else client.deletedAt = moment().format('L')

            await client.save().then(_ => res.redirect('/admin-detalhes/' + client._id))
        }).catch(err => console.log(err))
    }

    const adminViewLogs = async (req, res) => {
        await ErrorLog.find().then(errorLog => {
            res.status(200).render('./admin/index', {
                user: req.session.user,
                page: req.url,
                errorLog,
                moment,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const adminViewBanner = (req, res) => {
        res.status(200).sendFile(req.params.id, { root: './public/upload/banner/' })
    }

    const adminStatusBanner = (req, res) => {
        if(req.params.status === 'aprovar') {
            Financial.find().then(async financial => {
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(financial[0].productReport[i]._id == req.params.id) {
                        financial[0].productReport[i].status = 'concluído'
                        await User.findOne({ _id: financial[0].productReport[i]._idUser }).then(async user => {
                            for(let j = 0; j < user.purchasesHistoric.product.length; j++) {
                                if(user.purchasesHistoric.product[j]._idPayment == financial[0].productReport[i]._id) {
                                    user.purchasesHistoric.product[j].status = 'concluído'
                                    return await new PlanCronJob({
                                        _idUser: user._id,
                                        _idFinancial: financial[0].productReport[i]._id,
                                        type: 'vencimento',
                                        daysUntilPlanIsOver: financial[0].productReport[i].totalDays,
                                        status: 'pendente'
                                    }).save()
                                    .then(financial[0].save())
                                    .then(user.save())
                                    .then(res.status(200).redirect('/admin-painel'))
                                }
                            }
                        })
                    }
                }
            }).catch(_ => res.status(500).render('500'))
        } else if(req.params.status === 'recusar') {
            Financial.find().then(async financial => {
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(financial[0].productReport[i]._id == req.params.id) {
                        await Sell.findOne({ _id: financial[0].productReport[i]._idPaypalReport }).then(sell => {
                            const data = {
                                "amount": {
                                    "currency": sell._doc.transactions[0].amount.currency,
                                    "total": sell._doc.transactions[0].amount.total
                                }
                            }

                            paypal.configure({
                                'mode': process.env.PAYPAL_CLIENT_MODE,
                                'client_id': process.env.PAYPAL_CLIENT_ID,
                                'client_secret': process.env.PAYPAL_CLIENT_SECRET
                            })

                            paypal.sale.refund(sell._doc.transactions[0].related_resources[0].sale.id, data, async (error, refund) => {
                                if (error) {
                                    return await new ErrorLog({
                                        _idUser: financial[0].productReport[i]._idUser,
                                        createdAt: moment().format('L - LTS'),
                                        errorLocation: '/admin-banner/recusar - GET',
                                        errorDescription: 'Failed to reversal payment',
                                        errorStatus: error.httpStatusCode,
                                        errorMessage: error,
                                        level: 'high'
                                    }).save().then(res.status(error.httpStatusCode).render('500'))
                                } else {
                                    Sell.deleteOne({ _id: financial[0].productReport[i]._idPaypalReport })
                                    .then(new Sell(refund).save().then(sell => financial[0].productReport[i]._idPaypalReport = sell._id))
                                    .then(async _ => {
                                        financial[0].productReport[i].status = 'cancelado'
                                        financial[0].salesAmount -= Number(financial[0].productReport[i].total.toFixed(2))
                                        await User.findOne({ _id: financial[0].productReport[i]._idUser }).then(async user => {
                                            for(let j = 0; j < user.purchasesHistoric.product.length; j++) {
                                                if(user.purchasesHistoric.product[j]._idPayment == financial[0].productReport[i]._id) {
                                                    user.purchasesHistoric.product[j].status = 'cancelado'
                                                    
                                                    return await financial[0].save()
                                                    .then(user.save())
                                                    .then(res.status(200).redirect('/admin-painel'))
                                                }
                                            }
                                        })
                                    })
                                }
                            })
                        })
                    }
                }
            }).catch(err => console.log(err))
        } else return res.status(400).redirect('/admin-painel')
    }

    return {
        viewAdminPanel,
        changePrice,
        viewAdminProfile,
        changeUserProfile,
        changeProfileAdmin,
        viewAdminFinancial,
        viewAdminPaypalReport,
        viewUsers,
        adminViewProfileDetails,
        adminRemoveUser,
        adminViewLogs,
        adminViewBanner,
        adminStatusBanner
    }
}