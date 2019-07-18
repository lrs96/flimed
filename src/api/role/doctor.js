"use strict";

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Question = mongoose.model('Question')
const Event = mongoose.model('Event')
const Attendance = mongoose.model('Attendance')
const Financial = mongoose.model('Financial')
const BankStatement = mongoose.model('BankStatement')
const System = mongoose.model('System')
const moment = require('moment')
const path = require('path')
const multer = require('multer')
const crypto = require('crypto')
const failMessage = 'Algo deu errado'
const successMessage = 'Sucesso!'

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

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './public/upload/imagesOrAttachments')
        },
        filename: (req, file, cb) => {
            cb(null, crypto.randomBytes(10).toString('hex') + Date.now() + path.extname(file.originalname).toLowerCase())
        }
    })

    const upload = multer({ storage, fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname).toLowerCase()
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.bmp') {
            return callback(new Error())
        }

        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 2048
    }}).any()


    const viewDoctorRegister = (req, res) => {
        res.status(200).render('medico-cadastro',{
            page: 'Cadastro',
            user: req.session.user,
            message: null
        })
    }

    const viewDoctorHistory = (req, res) => {
        res.status(200).render('medico-historico',{
            page: 'Médico Histórico',
            user: req.session.user,
            message: null
        })
    }

    const doctorRegister = async (req, res) => {
        const user = { ...req.body }

        try {
            existOrError(user.genre, 'Escolha seu gênero')
            existOrError(user.city, 'Digite sua cidade')
            existOrError(user.state, 'Digite seu estado')
            existOrError(user.name, 'Digite seu nome')
            tooSmall(user.name, 'Nome muito curto, digite um nome maior')
            tooBig(user.name, 'Nome muito longo, digite um nome menor')
            existOrError(user.phone, 'Digite seu telefone')
            existOrError(user.email, 'Digite o Email')
            tooBigEmail(user.email, 'Seu Email é muito longo')
            validEmailOrError(user.email, 'Email inválido')
            const userFromDB = await User.findOne({ email: user.email })
            .catch(_ => res.status(500).render('500')) 
            notExistOrError(userFromDB, 'Esse Email já está registrado')
            existOrError(user.password, 'Digite sua senha')
            hasDigitOrError(user.password, 'A senha deve ter pelo menos um número')
            hasLowerOrError(user.password, 'A senha deve ter pelo menos uma letra minúscula')
            hasUpperOrError(user.password, 'A senha deve ter pelo menos uma letra maiúscula')
            notSpaceOrError(user.password, 'A senha não deve ter espaços em branco')
            hasSpecialOrError(user.password, 'A senha deve ter pelo menos um caractere especial')
            strongOrError(user.password, 'A senha deve conter pelo menos 8 caracteres')
            existOrError(user.confirmPassword, 'Digite a confirmação da senha')
            equalsOrError(user.password, user.confirmPassword, 'A senha e confirmação da senha não são iguais')
        } catch (msg) {
            return res.status(400).json(msg)
        }

        delete user.confirmPassword
        user.password = encryptPassword(user.password)
        user.createdAt = moment().format('L')
        user.admin = false   
        user.usertype = 'MEDICO'
        user.location = {
            city: user.city,
            state: user.state
        }

        await User.create(user).then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(400).json(failMessage))
    }

    const viewDoctorProfileFromUser = async (req, res) => {
        const userId = req.params.id
        
        await User.findOne({ _id: userId }).then(async doctor => {
            if(doctor.usertype === 'PACIENTE') return res.status(400).redirect('/')
            doctor.password = undefined
            
            const events = await Event.find({ _idDoctor: doctor._id })

            let opinions = []
            if(events.length) {
                for(let i = 0; i < events.length; i++) {
                    if(events[i].patientInfo.patientOpinion) {
                        await Attendance.findOne({ _idEvent: events[i]._id }).then(attendance => {
                            opinions.push({
                                patientName: events[i].patientInfo.patientName,
                                opinion: attendance.patientOpinion.opinion
                            })
                        })
                    }
                }
            }

            let questions = []
            if(doctor.question.length) {
                for(let i = 0; i < doctor.question.length; i++) {
                    await Question.findOne({ _id: doctor.question[i]._idQuestion }).then(question => {
                        questions.push({
                            question: question.question,
                            answer: question.answer || null
                        })
                    })
                }
            }

            res.status(200).render('page-medico-detalhe', {
                page: 'Detalhes',
                user: req.session.user,
                doctor,
                events,
                questions,
                opinions,
                message: null
            })
        }).catch(_ => res.status(400).render('page-resultado', {  
            page: 'Pesquisa simples',
            message: JSON.stringify('Algo deu errado'),
            user: req.session.user,
            result: null,
            location: null
        }))
    }

    const viewDoctorPanel = (req, res) => {
        Event.find({ _idDoctor: req.session.user._id }).then(async events => {
            const opinions = [], patientGender = []
            if(events.length) {
                for(let i = 0; i < events.length; i++) {
                    if(events[i].patientInfo.patientOpinion) {
                        await Attendance.findOne({ _idEvent: events[i]._id }).then(attendance => {
                            opinions.push(attendance.patientOpinion)
                        })
                    }

                    if(events[i].status === 'pendente' || events[i].status === 'concluído') {
                        patientGender.push(events[i].patientInfo.patientGenre)
                    }
                }
            }

            res.status(200).render('medico-painel', {
                page: 'Painel',
                user: req.session.user,
                events,
                patientGender,
                opinions,
                moment,
                message: null
            })
        }).catch(_ => res.status(400).json(failMessage))
    }

    const viewDoctorProfile = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(user => {
            res.status(200).render('medico-perfil',{
                page: 'Perfil',
                user,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewDoctorFinancial = async (req, res) => { 
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            await Financial.find().then(async hasFinancial => {
                await Event.find({ _idDoctor: user._id }).then(async events => {
                    await BankStatement.find({ _idUser: user._id }).then(async bankStatement => {
                        const financialPlan = []
                        for(let i = 0; i < hasFinancial[0].planReport.length; i++) {
                            if(hasFinancial[0].planReport[i]._idUser == user._id) {
                                financialPlan.push(hasFinancial[0].planReport[i])
                            }
                        }
                        
                        const financialProduct = []
                        for(let i = 0; i < hasFinancial[0].productReport.length; i++) {
                            if(hasFinancial[0].productReport[i]._idUser == user._id) {
                                financialProduct.push(hasFinancial[0].productReport[i])
                            }
                        }

                        console.log(financialProduct)

                        const earnings = []
                        if(events.length) {
                            for(let i = 0; i < events.length; i++) {
                                if(events[i].status === 'pendente' || events[i].status === 'concluído') {
                                    earnings.push(events[i])
                                }
                            }
                        }   
                        
                        res.status(200).render('medico-financeiro', {
                            page: 'Financeiro',
                            user,
                            financialPlan,
                            financialProduct,
                            earnings,
                            moment,
                            bankStatement,
                            message: null
                        })                         
                    })               
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewDoctorQuestions = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async doctor => {
            doctor.password = undefined
            if(doctor.question.length) {
                let questions = []
                for(let i = 0; i < doctor.question.length; i++) {
                    await Question.findOne({ _id: doctor.question[i]._idQuestion }).then(async question => {
                        await User.findOne({ _id: question._idWhoAsked }).then(user => {
                            questions.push({
                                fromUser: {
                                    _idUser: user._id,
                                    name: user.name,
                                    profilePicture: user.profilePicture
                                },
                                _idQuestion: question._id,
                                question: question.question,
                                answer: question.answer || null
                            })
                        })
                    })
                }

                res.status(200).render('page-question', {
                    page: 'Perguntas',
                    user: doctor,
                    questions,
                    message: null
                })
            } else { 
                res.status(200).render('page-question', {
                    page: 'Perguntas',
                    user: doctor,
                    questions: null,
                    message: null
                })
            }
        }).catch(_ => res.status(500).render('500'))
    }

    const viewDoctorAdverts = (req, res) => {
        System.find().then(system => {
            res.render('medico-anuncios', {
                page: 'Anúncios',
                profileValue: system[0].priceAdvertisementProfile,
                bannerValue: system[0].priceAdvertisementBanner,
                user: req.session.user,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewDoctorScheduling = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            user.password = undefined
            await Event.find({ _idDoctor: user._id }).then(events => {
                res.status(200).render('medico-horarios', {
                    page: 'Horários',
                    user,
                    events,
                    message: null
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const addDoctorSchedule = async (req, res) => {
        if(!req.session.user.accounting || !req.session.user.accounting.attendanceValue) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('Você precisa adicionar o preço do seu atendimento no menu Contabilidade')
                })
            })
        }

        const schedule = { ...req.body }

        if(!schedule.date) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('Você precisa digitar o dia em que será adicionado os horários')
                })
            })
        }

        if(parseInt(schedule.horaHorario[0]) > parseInt(schedule.horaHorario[1])) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('O horário inicial não pode ser maior que o horário final')
                })
            })
        }
        
        if((schedule.horaHorario[0] + schedule.minutoHorario[0]) === (schedule.horaHorario[1] + schedule.minutoHorario[1])) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('Você não pode colocar horários iguais')
                })
            })
        }
        
        let checkHour = schedule.horaHorario[0]
        if(parseInt(schedule.horaHorario[0]) < 10) checkHour = '0' + schedule.horaHorario[0]
        if(schedule.minutoHorario[0] === '0') schedule.minutoHorario[0] += '0'
        const checkDate = schedule.date + 'T' + checkHour + ':' + schedule.minutoHorario[0]

        if(checkDate <= moment().format()) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('Você não pode adicionar horários em dias passados')
                })
            })
        }          

        if(!schedule.type || (schedule.type !== 'presencial' && schedule.type !== 'telemedicina')) {
            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                return res.status(400).render('medico-horarios', {
                    page: 'Horários',
                    user: req.session.user,
                    events,
                    message: JSON.stringify('Escolha o tipo de atendimento')
                })
            })
        }

        let location = null
        if(schedule.type === 'presencial') {
            if(!schedule.location) {
                return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                    return res.status(400).render('medico-horarios', {
                        page: 'Horários',
                        user: req.session.user,
                        events,
                        message: JSON.stringify('Escolha o local de atendimento')
                    })
                })
            }
            
            await User.findOne({ _id: req.session.user._id }).then(user => {
                for(let i = 0; i < user.location.length; i++) {
                    if(user.location[i]._id == schedule.location) {
                        location = user.location[i]
                        break
                    }
                }
            })
    
            if(!location) {
                return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                    return res.status(400).render('medico-horarios', {
                        page: 'Horários',
                        user: req.session.user,
                        events,
                        message: JSON.stringify('Escolha o local de atendimento')
                    })
                })
            } 
        }           

        if(schedule.minutoHorario[1] === '0') schedule.minutoHorario[1] += '0'
        const differenceBetweenHours = parseInt(schedule.horaHorario[1]) - parseInt(schedule.horaHorario[0]) 

        if(differenceBetweenHours < 1) {
            if(parseInt(schedule.horaHorario[0]) < 10) schedule.horaHorario[0] = '0' + schedule.horaHorario[0]
            if(parseInt(schedule.horaHorario[1]) < 10) schedule.horaHorario[1] = '0' + schedule.horaHorario[1]

            const corretScheduleStart = schedule.date + 'T' + schedule.horaHorario[0] + ':' + schedule.minutoHorario[0] + ':00'
            const corretScheduleEnd = schedule.date + 'T' + schedule.horaHorario[1] + ':' + schedule.minutoHorario[1] + ':00'
    
            await Event.find({ _idDoctor: req.session.user._id }).then(async events => {
                if(!events.length) {
                    if(schedule.type === 'presencial') {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#007bff',
                            start: corretScheduleStart,
                            end: corretScheduleEnd,
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            locationInfo: {
                                city: location.city,
                                state: location.state,
                                address: location.address,
                                number: location.number,
                                zipCode: location.zipCode
                            },
                            createdAt: moment().format('L')
                        }).save().then(async _ => {
                            return await Event.find({ _idDoctor: req.session.user._id }).then(async events => {
                                return res.status(200).render('medico-horarios', {
                                    page: 'Horários',
                                    user: req.session.user,
                                    events,
                                    message: JSON.stringify('Sucesso!')
                                })
                            })
                        })
                    } else {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#e900ff',
                            start: corretScheduleStart,
                            end: corretScheduleEnd,
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            createdAt: moment().format('L')
                        }).save().then(async event => {
                            event.teleMedicineInfo = {
                                URLDoctor: process.env.URL_BASE_TELEMEDICINA +
                                '/scheduling?idEvent=' +  event._id +
                                '&idUser=' + req.session.user._id + 
                                '&name=' + req.session.user.name.replace(/\s/g, '+') +
                                '&role=doctor'
                            }

                            await event.save().then(_ => {
                                Event.find({ _idDoctor: req.session.user._id }).then(async events => {
                                    return res.status(200).render('medico-horarios', {
                                        page: 'Horários',
                                        user: req.session.user,
                                        events,
                                        message: JSON.stringify('Sucesso!')
                                    })
                                })
                            })
                        })
                    }
                } else {
                    const alreadyExist = await Event.find({ _idDoctor: req.session.user._id, start: corretScheduleStart })
                    if(alreadyExist.length) {
                        return await Event.find({ _idDoctor: req.session.user._id }).then(events => res.status(400).render(
                        'medico-horarios', {
                            page: 'Horários',
                            user: req.session.user,
                            events,
                            message: JSON.stringify('Horário já cadastrado')
                        }))
                    }
    
                    if(schedule.type === 'presencial') {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#007bff',
                            start: corretScheduleStart,
                            end: corretScheduleEnd,
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            locationInfo: {
                                city: location.city,
                                state: location.state,
                                address: location.address,
                                number: location.number,
                                zipCode: location.zipCode
                            },
                            createdAt: moment().format('L')
                        }).save().then(async _ => {
                            return await Event.find({ _idDoctor: req.session.user._id }).then(events => {
                                return res.status(200).render('medico-horarios', {
                                    page: 'Horários',
                                    user: req.session.user,
                                    events,
                                    message: JSON.stringify('Sucesso!')
                                })
                            })
                        })
                    } else {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#e900ff',
                            start: corretScheduleStart,
                            end: corretScheduleEnd,
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            createdAt: moment().format('L')
                        }).save().then(async event => {
                            event.teleMedicineInfo = {
                                URLDoctor: process.env.URL_BASE_TELEMEDICINA +
                                '/scheduling?idEvent=' +  event._id +
                                '&idUser=' + req.session.user._id + 
                                '&name=' + req.session.user.name.replace(/\s/g, '+') +
                                '&role=doctor'
                            }

                            await event.save().then(_ => {
                                Event.find({ _idDoctor: req.session.user._id }).then(async events => {
                                    return res.status(200).render('medico-horarios', {
                                        page: 'Horários',
                                        user: req.session.user,
                                        events,
                                        message: JSON.stringify('Sucesso!')
                                    })
                                })
                            })
                        })
                    }
                }
            }).catch(_ => res.status(500).render('500'))
        } else {
            let hour = []
            hour.push(parseInt(schedule.horaHorario[0]))
            for(let i = 1; i < differenceBetweenHours + 1; i++) 
                hour.push(parseInt(schedule.horaHorario[0]) + i)
            for(let i = 0; i < hour.length; i++) {
                hour[i] = hour[i].toString()
                if(parseInt(hour[i]) < 10) hour[i] = '0' + hour[i]
            }

            let fixedDate = []
            fixedDate[0] = schedule.date + 'T' + hour[0] + ':' + schedule.minutoHorario[0] + ':00'
            if(schedule.minutoHorario[0] === '00') fixedDate.push(schedule.date + 'T' + hour[0] + ':30:00')
            for(let i = 1; i < hour.length - 1; i++) {
                fixedDate.push(schedule.date + 'T' + hour[i] + ':00:00')
                fixedDate.push(schedule.date + 'T' + hour[i] + ':30:00')
            }
            
            if(schedule.minutoHorario[1] === '00') fixedDate.push(schedule.date + 'T' + hour[hour.length - 1] + ':00:00')
            else {
                fixedDate.push(schedule.date + 'T' + hour[hour.length - 1] + ':00:00')
                fixedDate.push(schedule.date + 'T' + hour[hour.length - 1] + ':30:00')
            }

            for(let i = 0; i < fixedDate.length - 1; i++) {
                const checkIfExist = await Event.find({ _idDoctor: req.session.user._id, start: fixedDate[i] })
                .catch(_ => res.status(500).render('500'))
                if(checkIfExist.length) { 
                    return await Event.find({ _idDoctor: req.session.user._id }).then(events => res.status(400).render(
                    'medico-horarios', {
                        page: 'Horários',
                        user: req.session.user,
                        events,
                        message: JSON.stringify('Horário já cadastrado')
                    })).catch(_ => res.status(500).render('500'))
                }
                
                if(schedule.type === 'presencial') {
                    try {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#007bff',
                            start: fixedDate[i],
                            end: fixedDate[i + 1],
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            locationInfo: {
                                city: location.city,
                                state: location.state,
                                address: location.address,
                                number: location.number,
                                zipCode: location.zipCode
                            },
                            createdAt: moment().format('L')
                        }).save()
                    } catch(err) {
                        return res.status(500).render('500')
                    }
                } else {
                    try {
                        await new Event({ 
                            _idDoctor: req.session.user._id,
                            title: 'Horário Livre',
                            color: '#e900ff',
                            start: fixedDate[i],
                            end: fixedDate[i + 1],
                            status: 'disponível',
                            type: schedule.type,
                            value: req.session.user.accounting.attendanceValue,
                            createdAt: moment().format('L')
                        }).save().then(async event => {
                            event.teleMedicineInfo = {
                                URLDoctor: process.env.URL_BASE_TELEMEDICINA +
                                '/scheduling?idEvent=' +  event._id +
                                '&idUser=' + req.session.user._id + 
                                '&name=' + req.session.user.name.replace(/\s/g, '+') +
                                '&role=doctor'
                            }

                            await event.save()
                        })
                    } catch(err) {
                        return console.log(err)
                    }
                }
            }

            await Event.find({ _idDoctor: req.session.user._id })
            .then(events => res.status(200).render('medico-horarios', {
                page: 'Horários',
                user: req.session.user,
                events,
                message: JSON.stringify('Sucesso!')
            })).catch(_ => res.status(500).render('500'))
        }
    }

    const removeDoctorSchedule = async (req, res) => {
        const eventId = req.body.eventId

        await Event.deleteOne({ _id: eventId }).then(async _ => {
            await Event.find({ _idDoctor: req.session.user._id }).then(events => res.status(200).render(
            'medico-horarios', {
                page: 'Horários',
                user: req.session.user,
                events,
                message: JSON.stringify('Sucesso!')
            })).catch(_ => res.status(500).render('500'))
        }).catch(_ => res.status(500).render('500'))
    }

    return { 
        viewDoctorRegister,
        doctorRegister,
        viewDoctorProfileFromUser,
        viewDoctorPanel,
        viewDoctorProfile,
        viewDoctorFinancial,
        viewDoctorQuestions,
        viewDoctorAdverts,
        viewDoctorScheduling,
        addDoctorSchedule,
        viewDoctorHistory,
        removeDoctorSchedule
    }
}