"use strict";

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Question = mongoose.model('Question')
const Event = mongoose.model('Event')
const Attendance = mongoose.model('Attendance')
const BankStatement = mongoose.model('BankStatement')
const mail = require('../config/mail')
const path = require('path')
const multer = require('multer')
const ejs = require('ejs')
const pdf = require('html-pdf')
const crypto = require('crypto')
const fs = require('fs')
const sharp = require('sharp')
const moment = require('moment')
moment.locale('pt-br')
const validCpf = require('validar-cpf')
const validCep = require('cep-promise')
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

    const registerNewUser = async (req, res) => {
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
        user.usertype = 'PACIENTE'
        user.location = {
            city: user.city,
            state: user.state
        }

        await User.create(user).then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(500).json(failMessage))
    }

    const changeProfile = async (req, res) => {
        const profile = { ...req.body }
        
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            if(profile.name) {
                try {
                    tooSmall(user.name, 'Nome muito curto, digite um nome maior')
                    tooBig(user.name, 'Nome muito longo, digite um nome menor')
                } catch(msg) {
                    return res.status(400).json(msg)
                }

                user.name = profile.name
            }

            if(profile.cpf) {
                if(!validCpf(profile.cpf)) return res.status(400).json('CPF inválido')

                user.cpf = profile.cpf
            }

            if(profile.genre) {
                if(profile.genre !== user.genre) user.genre = profile.genre
            }

            if(profile.email) {
                try {
                    tooBigEmail(profile.email, 'Seu Email é muito longo')
                    validEmailOrError(profile.email, 'Email inválido')
                    const userFromDB = await User.findOne({ email: profile.email })
                    notExistOrError(userFromDB, 'Esse Email já está registrado')
                } catch(msg) {
                    return res.status(400).json(msg)
                }

                user.email = profile.email
            } 

            if(profile.phone) user.phone = profile.phone
        
            if(profile.dateOfBirth) user.dateOfBirth = profile.dateOfBirth

            await user.save().then(_ => {
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(400).json(failMessage))
    }

    const addNewlocation = async (req, res) => {
        const location = { ...req.body }

        try {
            existOrError(location.address, 'Digite o endereço')
            existOrError(location.city, 'Digite o nome da cidade')
            existOrError(location.state, 'Digite o estado')
            existOrError(location.number, 'Digite número do endereço')
            existOrError(location.zipCode, 'Digite o CEP do endereço')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        return await validCep(location.zipCode).then(async _ => {
            return await User.findOne({ _id: req.session.user._id }).then(async user => {
                user.location.push({
                    "city": location.city,
                    "state": location.state,
                    "address": location.address,
                    "number": location.number,
                    "zipCode": location.zipCode
                })

                await user.save()
    
                return res.status(200).json(successMessage)
            }).catch(_ => res.status(500).json(failMessage))
        }).catch(_ => res.status(400).json('CEP inválido'))
    }

    const recoverPassword = async (req, res) => {
        if (!req.params.token) {
            const email = req.body.email

            try {
                existOrError(email, 'Digite o Email')
                tooBigEmail(email, 'Seu Email é muito longo')
                validEmailOrError(email, 'Email inválido')
            } catch (msg) {
                return res.status(400).render('page-esqueci-minha-senha', { message: JSON.stringify(msg) })
            }

            const user = await User.findOne({ email })
            .catch(_ => res.status(500).render('500'))
            if(!user || user.deletedAt) return res.status(400).render('page-esqueci-minha-senha', { message: JSON.stringify(failMessage) })
            
            const token = crypto.randomBytes(64).toString('hex')
            user.resetPasswordToken = token
            user.resetPasswordExpires = Date.now() + 3600000
            await user.save().catch(_ => res.status(500).render('500'))
            mail.recoveryMail(user.email, token)
            res.status(200).render('page-esqueci-minha-senha', { message: JSON.stringify(successMessage) }) 
        } else {
            await User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            }).then(user => {
                if (!user || user.deletedAt) {
                    res.status(401).render('page-esqueci-minha-senha', { message: JSON.stringify('O token de redefinição de senha é inválido ou expirou') })
                } else {
                    res.status(200).render('page-reset', { token: user.resetPasswordToken, message: null })
                }
            }).catch(_ => res.status(500).render('500'))
        }
    }

    const resetPassword = async (req, res) => {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        }).catch(_ => res.status(500).render('500'))

        if (!user || user.deletedAt) {
            return res.status(401).render('page-esqueci-minha-senha', {  message: JSON.stringify('O token de redefinição de senha é inválido ou expirou') })
        }

        const newPassword = { ...req.body }
        try {
            existOrError(newPassword.password, 'Digite sua senha')
            hasDigitOrError(newPassword.password, 'A senha deve ter pelo menos um número')
            hasLowerOrError(newPassword.password, 'A senha deve ter pelo menos uma letra minúscula')
            hasUpperOrError(newPassword.password, 'A senha deve ter pelo menos uma letra maiúscula')
            notSpaceOrError(newPassword.password, 'A senha não deve ter espaços em branco')
            hasSpecialOrError(newPassword.password, 'A senha deve ter pelo menos um caractere especial')
            strongOrError(newPassword.password, 'A senha deve conter pelo menos 8 caracteres')
            existOrError(newPassword.confirmPassword, 'Digite a confirmação da senha')
            equalsOrError(newPassword.password, newPassword.confirmPassword, 'A senha e confirmação da senha não são iguais')
        } catch (msg) {
            return res.status(400).render('page-reset', { token: user.resetPasswordToken, message: JSON.stringify(msg) })
        }

        user.password = encryptPassword(newPassword.password)
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await user.save().catch(_ => res.status(500).render('500'))
        mail.alertOfChange(user.email)
        res.status(200).render('page-login', { message: JSON.stringify(successMessage) })
    }

    const uploadProfilePicture = async (req, res) => {   
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
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.bmp') {
                return callback(new Error())
            }
    
            callback(null, true)
        },
        limits: {
            limits: 1,
            fileSize: 1024 * 2048
        }}).single('file')

        await User.findOne({ _id: req.session.user._id }).then(user => {
            upload(req, res, function(err) {
                if (err instanceof multer.MulterError) {
                    return res.status(500).render('500')
                } else if (err) {
                    return res.status(500).render('500')
                } else if (!req.file) {
                    return res.status(400).render('medico-perfil', {
                        page: 'Perfil',
                        user: req.session.user,
                        message: JSON.stringify('Você deve selecionar uma imagem')
                    })
                }

                sharp.cache(false)
                sharp('./public/upload/' + req.file.filename).resize({
                    width: 150,
                    height: 150,
                    fit: sharp.fit.cover,
                    position: sharp.strategy.entropy
                }).toFile('./public/upload/profile/' + req.file.filename)
                .then(async _ => {
                    user.profilePicture = req.file.filename
                    await user.save().then(_ => {
                        fs.unlinkSync('./public/upload/' + req.file.filename)
                        req.session.user.profilePicture = req.file.filename
                        res.status(200).render('medico-perfil', {
                            page: 'Perfil',
                            user: req.session.user,
                            message: JSON.stringify(successMessage)
                        })
                    })
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewProfilePicture = async (req, res) => {
        await User.findOne({ _id: req.params.id }).then(user => {
            if(user.profilePicture) {
                return res.status(200).sendFile(user.profilePicture, { root: './public/upload/profile/' })
            } else {
                return res.status(404).end()
            }
        }).catch(_ => res.status(500).render('500'))
    }

    const viewPagePreco = (req, res) => {
        res.status(200).render('page-preco', { page: 'Planos', message: null, user: req.session.user })
    }

    const changePassword = async (req, res) => {
        const password = { ...req.body }
        if(!password) return res.status(400).json(failMessage)

        try {
            existOrError(password.currentPassword, 'Digite sua senha atual')
            existOrError(password.newPassword, 'Digite sua nova senha')
            existOrError(password.confirmNewPassword, 'Digite a confirmação da sua nova senha')
            const checkUser = await User.findOne({ _id: req.session.user._id })
            const isMatch = bcrypt.compareSync(password.currentPassword, checkUser.password)
            if (!isMatch) return res.status(401).json('Senha inválida')
            hasDigitOrError(password.newPassword, 'A senha deve ter pelo menos um número')
            hasLowerOrError(password.newPassword, 'A senha deve ter pelo menos uma letra minúscula')
            hasUpperOrError(password.newPassword, 'A senha deve ter pelo menos uma letra maiúscula')
            notSpaceOrError(password.newPassword, 'A senha não deve ter espaços em branco')
            hasSpecialOrError(password.newPassword, 'A senha deve ter pelo menos um caractere especial')
            strongOrError(password.newPassword, 'A senha deve conter pelo menos 8 caracteres')
            equalsOrError(password.newPassword, password.confirmNewPassword, 'A senha e confirmação da senha não são iguais')
        } catch (msg) {
            return res.status(400).json(msg)
        }

        return await User.findOne({ _id: req.session.user._id }).then(async user => {
            user.password = encryptPassword(password.newPassword)
            await user.save()
        }).then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(500).json(failMessage))
    }

    const indicateNewProfessional = async (req, res) => {
        return await User.findOne({ _id: req.session.user._id }).then(async user => {
            const checkIfExist = await User.findOne({ email: req.body.email })
            if(checkIfExist) return res.status(400).json(failMessage) 

            if(user.referral.length) {
                let alreadySend = false
                for(let i = 0; i < user.referral.length; i++) {
                    if(user.referral[i].email === req.body.email) {
                        alreadySend = true
                        break
                    }
                }

                if(alreadySend) return res.status(400).json('Você já enviou indicação para este Email')
            }

            mail.indicateNewProfessional(req.body.name, req.body.email, user._id)
            user.referral.push({
                email: req.body.email,
                status: false
            })

            await user.save()
            return res.status(200).json('Sucesso!')
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewIndicatedRegister = (req, res) => {
        res.status(200).render('page-cadastro', { message: null })
    }

    //TODO
    const registerNewIndicatedUser = (req, res) => {
        userId = req.params.id

        
    }

    //TODO EMAIL
    const postNewQuestion = async (req, res) => {
        if(!req.session || !req.session.user) {
            return res.status(400).json('Você deve estar logado para fazer uma pergunta')
        }

        if(req.session.user.usertype !== 'PACIENTE') {
            return res.status(400).json('Somente pacientes podem fazer perguntas')
        }

        try {
            existOrError(req.body.question, 'Você precisa digitar uma pergunta')
            tooSmall(req.body.question, 'Sua pergunta é muito curta, digite uma pergunta maior')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        await User.findOne({ _id: req.session.user._id }).then(async user => {
            await User.findOne({ _id: req.body.doctorId }).then(async doctor => {
                await new Question({
                    _idWhoAsked: user._id,
                    _idWhoReceived: doctor._id,
                    question: req.body.question
                }).save().then(async question => {
                    user.question.push({ _idQuestion: question._id })
                    doctor.question.push({ _idQuestion: question._id })
                    await user.save()
                    await doctor.save()

                    user.password = undefined
                    doctor.password = undefined

                    //mail.newQuestion(req.session.user.name, doctor.name, doctor.email, req.body.question)
                    
                    let questions = []
                    for(let i = 0; i < doctor.question.length; i++) {
                        await Question.findOne({ _id: doctor.question[i]._idQuestion }).then(question => {
                            questions.push({
                                question: question.question,
                                answer: question.answer || null
                            })
                        })
                    }

                    res.status(200).json(successMessage)
                })

            })
        }).catch(err => res.status(500).send(err))
    }

    const answerQuestion = async (req, res) => {
        if(!req.body.questionId) return res.status(400).json(failMessage)

        try {
            existOrError(req.body.answer, 'Digite a resposta')
            tooSmall(req.body.answer, 'A resposta é muito curta, digite uma resposta maior')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        await Question.findOne({ _id: req.body.questionId }).then(async question => {
            question.answer = req.body.answer
            await question.save()

            //mail.newAnswer()
            res.status(200).json(successMessage)
        })
    }

    const viewNewAppointment = async (req, res) => {
        if(!req.query.eventId || !req.query.doctorId) return res.status(400).redirect('/')

        await User.findOne({ _id: req.query.doctorId }).then(async doctor => {
            if(doctor.usertype !== 'MEDICO') return res.status(400).redirect('/')
            doctor.password = undefined

            await Event.findOne({ _id: req.query.eventId }).then(event => {
                if(doctor._id != event._idDoctor) return res.status(400).redirect('/')
                if(event._idPatient) return res.status(400).redirect('/')

                res.status(200).render('page-marca-consulta', {
                    page: 'Marcar consulta',
                    user: req.session.user,
                    message: null,
                    event,
                    doctor
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    // TODO EMAIL
    const postNewAppointment = async (req, res) => {
        const request = { ...req.body }

        try {
            existOrError(request.agreement, 'Escolha seu plano de saúde')
            existOrError(request.name, 'Digite seu nome')
            tooSmall(request.name, 'Seu nome é muito curto, digite um nome maior')
            tooBig(request.name, 'Seu nome é muito longo, digite um nome menor')
            existOrError(request.genre, 'Escolha seu gênero')
            existOrError(request.email, 'Digite seu Email')
            validEmailOrError(request.email, 'Digite um Email válido')
            tooBigEmail(request.email, 'Seu Email é muito longo, digite um Email menor')
            existOrError(request.phone, 'Digite seu telefone')
            existOrError(request.comment, 'Digite seu comentário')
            tooSmall(request.comment, 'Digite um comentário maior')
        } catch(msg) {
            return res.status(400).json(msg)
        }   

        Event.findOne({ _id: request.eventId }).then(async event => {
            if(!event) return res.status(400).json('Esse horário expirou. Volte para a página do médico e selecione outro horário')
            if(event._idDoctor != request.doctorId) return res.status(400).json(failMessage)

            if(event.type === 'presencial') {
                event._idPatient = req.session.user._id
                event.patientInfo = {
                    patientAgreement: request.agreement,
                    registerBy: req.session.user.name,
                    patientName: request.name,
                    patientGenre: request.genre,
                    patientEmail: request.email,
                    patientPhone: request.phone,
                    patientComment: request.comment
                }
                event.title = request.name
                event.color = '#dc7d35'
                event.status = 'pendente'
                //mail.NewAppointment(request, event) // send to doctor
                //mail.confirmNewAppointment(req.session.user.name, request, event) // confirm appointment with user
                await event.save().then(_ => res.status(200).json({ type: 'presencial', msg: successMessage }))
            } else {
                res.status(200).json({
                    type: 'telemedicina',
                    url: '/pagar-agendamento?idEvent=' + event._id +
                    '&idDoctor=' + request.doctorId +
                    '&idPatient=' + req.session.user._id +
                    '&patientAgreement=' + request.agreement +
                    '&registerBy=' + req.session.user.name +
                    '&patientName=' + request.name +
                    '&patientGenre=' + request.genre +
                    '&patientEmail=' + request.email +
                    '&patientPhone=' + request.phone +
                    '&patientComment=' + request.comment,                    
                    msg: successMessage
                })
            }
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewAttendance = async (req, res) => {
        await Attendance.findOne({ _id: req.params.id }).then(attendance => {
            res.status(200).render('page-prontuario', {
                page: 'Prontuário',
                user: req.session.user,
                attendance,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewAttendanceFile = async (req, res) => {
        await Attendance.findOne({ _id: req.params.id }).then(attendance => {
            if(
                req.session.user.usertype === 'MEDICO' ||
                req.session.user.usertype === 'CLINICA' ||
                req.session.user._id === attendance._idPatient ||
                req.session.user.admin
            ) {
                for(let i = 0; i < attendance.imagesOrAttachments.length; i++) {
                    if(attendance.imagesOrAttachments[i].fileName === req.params.fileName) {
                        return res.status(200).sendFile(
                            attendance.imagesOrAttachments[i].fileName, {
                                root: './public/upload/imagesOrAttachments/'
                            }
                        )
                    }
                }
            } else {
                return res.status(500).render('500')
            }
        }).catch(_ => res.status(500).render('500'))        
    }

    const viewAccounting = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(user => {
            res.status(200).render('page-contabilidade', {
                page: 'Contabilidade',
                user,
                message: null
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const pushNewEmployee = (req, res) => {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, './public/upload/employees')
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
            fileSize: 1024 * 2048
        }}).any()
 
        upload(req, res, async function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).render('500')
            } else if (err) {
                return res.status(500).render('500')
            }   

            await User.findOne({ _id: req.session.user._id }).then(async user => {
                user.accounting.personalDepartment.push({
                    nome: req.body.nome,
                    status: req.body.status,
                    RG: req.body.RG,
                    salario: parseFloat(req.body.salario),
                    cargo: req.body.cargo,
                    CPF: req.body.CPF,
                    conjugue: {
                        CPF: req.body.CPFConjugue,
                        RG: req.body.RGConjugue
                    },
                    contaCorrente: req.body.contaCorrente,
                    createdAt: moment().format('L')
                })

                for(let i = 0; i < req.files.length; i++) {
                    if(req.files[i].fieldname === 'foto')
                        user.accounting.personalDepartment.slice(-1)[0].foto = req.files[i].filename
                    else if(req.files[i].fieldname === 'CNH')
                        user.accounting.personalDepartment.slice(-1)[0].CNH = req.files[i].filename
                    else if(req.files[i].fieldname === 'certificadoEscolar')
                        user.accounting.personalDepartment.slice(-1)[0].certificadoEscolar = req.files[i].filename
                    else if(req.files[i].fieldname === 'cadernetaDeVacinacaoDosFilhos')
                        user.accounting.personalDepartment.slice(-1)[0].cadernetaDeVacinacaoDosFilhos = req.files[i].filename
                    else if(req.files[i].fieldname === 'certidaoDeNascimentoDosFilhos')
                        user.accounting.personalDepartment.slice(-1)[0].certidaoDeNascimentoDosFilhos = req.files[i].filename
                    else if(req.files[i].fieldname === 'certificadosDeCursosComplementares')
                        user.accounting.personalDepartment.slice(-1)[0].certificadosDeCursosComplementares = req.files[i].filename
                    else if(req.files[i].fieldname === 'comprovanteDeResidencia')
                        user.accounting.personalDepartment.slice(-1)[0].comprovanteDeResidencia = req.files[i].filename
                    else if(req.files[i].fieldname === 'certidaoDeNascimento')
                        user.accounting.personalDepartment.slice(-1)[0].certidaoDeNascimento = req.files[i].filename
                    else if(req.files[i].fieldname === 'certidaoDeCasamento')
                        user.accounting.personalDepartment.slice(-1)[0].certidaoDeCasamento = req.files[i].filename
                    else if(req.files[i].fieldname === 'certificadoDeReservista')
                        user.accounting.personalDepartment.slice(-1)[0].certificadoDeReservista = req.files[i].filename
                    else if(req.files[i].fieldname === 'atestadoDeSaudeOcupacional')
                        user.accounting.personalDepartment.slice(-1)[0].atestadoDeSaudeOcupacional = req.files[i].filename
                    else if(req.files[i].fieldname === 'tituloDeEleitor')
                        user.accounting.personalDepartment.slice(-1)[0].tituloDeEleitor = req.files[i].filename
                    else
                        return res.status(500).render('500')
                }

                await user.save()

                res.status(200).render('page-contabilidade', {
                    page: 'Contabilidade',
                    user: req.session.user,
                    message: JSON.stringify(successMessage)
                })
            }).catch(_ => res.status(500).render('500'))
        })    
    }

    const viewEmployeeDetail = async (req, res) => {
        return res.status(200).sendFile(req.params.filename, { root: './public/upload/employees/' })
    }

    const removeEmployee = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            for(let i = 0; i < user.accounting.personalDepartment.length; i++) {
                if(user.accounting.personalDepartment[i]._id == req.params.id) {
                    user.accounting.personalDepartment.splice(i, 1)
                    await user.save()
                    return res.status(200).render('page-contabilidade', {
                        page: 'Contabilidade',
                        user: req.session.user,
                        message: JSON.stringify(successMessage)
                    })
                }
            }

            res.status(500).render('page-contabilidade', {
                page: 'Contabilidade',
                user: req.session.user,
                message: JSON.stringify(failMessage)
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const addBankAccount = (req, res) => {
        const request = { ...req.body }

        try {
            existOrError(request.bankAgency, 'Digite o número da agência')
            existOrError(request.bankNumber, 'Digite o número da conta')
            existOrError(request.bankName, 'Dgite o nome do banco')
            existOrError(request.bankAccountType, 'Digite o tipo da conta')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        User.findOne({ _id: req.session.user._id }).then(user => {
            user.accounting.bankAgency = request.bankAgency
            user.accounting.bankNumber = request.bankNumber
            user.accounting.bankName = request.bankName
            user.accounting.bankAccountType = request.bankAccountType

            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const addAttendanceValue = (req, res) => {
        const request = { ...req.body }

        request.attendanceValue = Number((request.attendanceValue * 100).toFixed(0))
        try {
            existOrError(request.attendanceValue, 'Digite o valor de atendimento')
            if(request.attendanceValue.toString() === 'NaN') return res.status(400).json('Digite um valor válido')
            if(request.attendanceValue < 1000) return res.status(400).json('O valor deve ser maior ou igual a 10')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        User.findOne({ _id: req.session.user._id }).then(user => {
            user.accounting.attendanceValue = request.attendanceValue
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const bankStatement = (req, res) => {
        const request = { ...req.body }
        request._idUser = req.session.user._id
        request.value = Number((request.value * 100).toFixed(0))
        request.createdAt = moment().format('L')

        try {
            existOrError(request.type, 'Algo deu errado')
            existOrError(request.value, 'Digite o valor')
            if(request.value.toString() === 'NaN') return res.status(400).json(failMessage)
        } catch(msg) {
            return res.status(400).json(msg)
        }

        BankStatement.create(request).then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(500).json(failMessage))
    }

    const removeBankStatement = (req, res) => {
        BankStatement.findOneAndDelete({ _id: req.body.bankStatementId, _idUser: req.session.user._id })
        .then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(500).json(failMessage))
    }

    const removeLocation = (req, res) => {
        User.findOne({ _id: req.session.user._id }).then(user => {
            user.location.splice(req.body.position, 1)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const addBiography = (req, res) => {
        User.findOne({ _id: req.session.user._id }).then(user => {
            user.biography = req.body.biography
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const addAward = (req, res) => {
        if(!req.body.title || !req.body.description) return res.status(400).json('Digite o título e a descrição')

        User.findOne({ _id: req.session.user._id }).then(user => {
            user.awards.push(req.body)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const removeAward = (req, res) => {
        User.findOne({ _id: req.session.user._id }).then(user => {
            user.awards.splice(req.body.position, 1)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const addSpeciality = (req, res) => {
        if(!req.body.title || !req.body.description) return res.status(400).json('Digite o título e a descrição')

        User.findOne({ _id: req.session.user._id }).then(user => {
            user.speciality.push(req.body)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const removeSpeciality = (req, res) => {
        User.findOne({ _id: req.session.user._id }).then(user => {
            user.speciality.splice(req.body.position, 1)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }
    
    const addAgreement = (req, res) => {
        if(!req.body.agreement) return res.status(400).json('Digite o nome do convênio')

        User.findOne({ _id: req.session.user._id }).then(user => {
            user.agreement.push(req.body.agreement)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const removeAgreement = (req, res) => {
        User.findOne({ _id: req.session.user._id }).then(user => {
            user.agreement.splice(req.body.position, 1)
            user.save().then(user => {
                user.password = undefined
                req.session.user = user
                res.status(200).json(successMessage)
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewListOfPatient = (req, res) => {
        if(req.session.user.usertype === 'MEDICO' || req.session.user.usertype === 'CLINICA') {
            Event.find({ _idDoctor: req.session.user._id }).then(async events => {
                const attendance = []
                for(let i = 0; i < events.length; i++) {
                    if(events[i].status === 'concluído') {
                        await Attendance.findOne({ _idEvent: events[i]._id }).then(attendances => {
                            if(attendances) attendance.push(attendances)
                        })
                    }

                    if(events[i].status === 'disponível') {
                        events.splice(i, 1)
                    }
                }
    
                res.status(200).render('page-lista-de-pacientes', {
                    page: 'Lista de pacientes',
                    user: req.session.user,
                    events,
                    attendance,
                    message: null
                })
            }).catch(_ => res.status(500).render('500'))
        } else {
            res.status(400).render('500')
        }
    }

    const viewHistoricPatient = (req, res) => {
        if(req.session.user.usertype === 'MEDICO' || req.session.user.usertype === 'CLINICA') {
            Attendance.find({ _idPatient: req.params.id }).then(attendance => {
                res.status(200).render('page-historico-de-atendimento', {
                    page: 'Histórico',
                    user: req.session.user,
                    attendance,
                    message: null
                })
            }).catch(_ => res.status(500).render('500'))
        } else {
            res.status(400).render('500')
        }
    }

    const viewBanner = (req, res) => {
        res.status(200).sendFile(req.params.fileName, { root: './public/upload/banner/' })
    }

    const viewAttendancePage = async (req, res) => {
        const eventId = req.query.eventId

        await Event.findOne({ _id: eventId }).then(async event => {
            if(event._idDoctor === req.session.user._id) {
                if(event.type === 'telemedicina') {
                    const checkAttendance = await Attendance.findOne({ _idEvent: event._id })   
                    if(!checkAttendance) {
                        return await new Attendance({
                            _idDoctor: event._idDoctor,
                            _idPatient: event._idPatient,
                            _idEvent: event._id,
                            status: 'concluído',
                            createdAt: moment().format('L'),
                        }).save().then(_ => res.redirect(event.teleMedicineInfo.URLDoctor))
                    } else {
                        return res.redirect(event.teleMedicineInfo.URLDoctor)
                    }
                } else {
                    await User.findOne({ _id: event._idPatient }).then(async patient => {
                        patient.password = undefined

                        await Attendance.find({ _idPatient: patient._id }).then(attendance => {
                            res.status(200).render('medico-atendimento', {
                                user: req.session.user,
                                event,
                                patient,
                                attendance,
                                message: null
                            })
                        })  
                    }).catch(_ => res.status(500).render('500'))
                }
            } else {
                return res.status(500).render('500')
            }
        }).catch(_ => res.status(500).render('500'))
    }

    const startAttendance = async (req, res) => {
        const eventId = req.body.eventId
        const patientId = req.body.patientId

        const attendance = await Attendance.findOne({ _idPatient: patientId, _idEvent: eventId })
        .catch(_ => res.status(500).json(failMessage))

        if(!attendance) {
            new Attendance({
                _idDoctor: req.session.user._id,
                _idPatient: patientId,
                _idEvent: eventId,
                createdAt: moment().format('L - LTS'),
            }).save().then(attendance => {
                Event.findOne({ _id: eventId }).then(event => {
                    event.attendance = attendance._id
                    event.save().then(res.status(200).json(successMessage))
                })
            }).catch(err => console.log(err))
        } else {
            res.status(400).json('Esse atendimento já iniciou, atualize a página')
        }
    }

    const pushNewAttendanceInfo = async (req, res) => {
        const attendanceForm = { ...req.body }

        return await Attendance.findOne({ _idEvent: attendanceForm.eventId }).then(async attendance => {
            if(attendance._idDoctor === req.session.user._id) {
                if(attendanceForm.formType === 'anamnesis') {
                    attendance.anamnesis = {
                        complaint: attendanceForm.complaint,
                        history: attendanceForm.history,
                        articularProblemsOrRheumatism: attendanceForm.articularProblemsOrRheumatism,
                        kidneyProblems: attendanceForm.kidneyProblems,
                        heartProblems: attendanceForm.heartProblems,
                        breathingProblems: attendanceForm.breathingProblems,
                        gastricProblems: attendanceForm.gastricProblems,
                        allergies: attendanceForm.allergies,
                        useOfMedications: attendanceForm.useOfMedications,
                        hepatitis: attendanceForm.hepatitis,
                        pregnancy: attendanceForm.pregnancy,
                        diabetes: attendanceForm.diabetes,
                        healingProblems: attendanceForm.healingProblems
                    }

                } else if(attendanceForm.formType === 'physicalExam') {
                    attendance.physicalExam = {
                        height: attendanceForm.height,
                        palpation: attendanceForm.palpation,
                        injuries: attendanceForm.injuries,
                        weight: attendanceForm.weight,
                        heartRate: attendanceForm.heartRate,
                        systolicBloodPressure: attendanceForm.systolicBloodPressure,
                        diastolicBloodPressure: attendanceForm.diastolicBloodPressure,
                        generalObservations: attendanceForm.generalObservations
                    }

                } else if(attendanceForm.formType === 'diagnosticHypothesis') {
                    attendance.diagnosticHypothesis = {
                        diagnosis: attendanceForm.diagnosis,
                        comments: attendanceForm.comments
                    }
                } else if(attendanceForm.formType === 'evolution') {
                    attendance.evolution = attendanceForm.evolution

                } else if(attendanceForm.formType === 'budget') {
                    attendance.budget.push({
                        procedure: attendanceForm.procedure,
                        value: attendanceForm.value,
                        comments: attendanceForm.comments
                    })

                } else if(attendanceForm.formType === 'examsAndProcedures') { 
                    attendance.examsAndProcedures.push({
                        date: attendanceForm.date,
                        clinicalIndication: attendanceForm.clinicalIndication,
                        exams: attendanceForm.exams,
                        amount: attendanceForm.amount
                    })

                } else if(attendanceForm.formType === 'prescriptions') {
                    attendance.prescriptions = {
                        specialControlReceipt: attendanceForm.specialControlReceipt,
                        date: attendanceForm.date,
                        medication:attendanceForm.medication,
                        amount: attendanceForm.amount,
                        posology: attendanceForm.posology
                    }

                } else if(attendanceForm.formType === 'attestations') {
                    attendance.attestations = {
                        date: attendanceForm.date,
                        attestation: attendanceForm.attestation
                    }

                } else {
                    return res.status(500).json(failMessage)
                }

                return await attendance.save().then(_ => res.status(200).json('Sucesso!'))
            } else {
                return res.status(500).json(failMessage)
            }
        }).catch(_ => res.status(500).json(failMessage))
    }

    const pushNewAttendanceImage = (req, res) => {
        upload(req, res, async function(err) {
            if (err instanceof multer.MulterError) {
                return res.status(500).json(failMessage)
            } else if (err) {
                return res.status(500).json(failMessage)
            } else if (!req.files.length) {
                return res.status(500).json('Você deve selecionar ao menos uma imagem')
            }

            return await Attendance.findOne({ _idEvent: req.body.eventId }).then(async attendance => {
                if(attendance._idDoctor === req.session.user._id) {
                    for (let i = 0; i < req.files.length; i++) {
                        attendance.imagesOrAttachments.push({ fileName: req.files[i].filename })
                    }

                    return await attendance.save().then(_ => res.status(200).json('Sucesso!'))
                } else {
                    return res.status(500).json(failMessage)
                }
            }).catch(_ => res.status(500).json(failMessage))
        })
    }

    const endAttendance = (req, res) => {
        const eventId = req.body.eventId
        const patientId = req.body.patientId

        Attendance.findOne({ _idPatient: patientId, _idEvent: eventId }).then(attendance => {
            if(!attendance) return res.status(400).json('Para finalizar uma consulta, antes você deve iniciar a consulta')
            
            Event.findOne({ _id: eventId }).then(async event => {
                if(event.type === 'presencial') {
                    attendance.type = 'presencial'
        
                    async function toHTML (ejsTemplateURL, data) {
                        return await new Promise(function (resolve, reject) {
                            fs.readFile(ejsTemplateURL, 'utf8', function (error, response) {
                                if(error) {
                                    reject(error)
                                } else {
                                    resolve(ejs.render(response, data))
                                }
                            })
                        })
                    }
            
                    async function toPDF (html, options,  output) {
                        return await new Promise(function (resolve, reject) {
                            pdf.create(html, options).toFile(output, function(error, response) {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(response)
                                }
                            })
                        })
                    }

                    await toHTML('./views/templatePDF.ejs', attendance).then(async html => {
                        const options = { format: 'A4' }
                        const fileName = crypto.randomBytes(8).toString('hex') + moment().format('YYYYMMDDHHmmSS') + '.pdf'
                        attendance.resume = fileName
                        const output = './public/upload/resume/' + fileName
                    
                        await toPDF(html, options, output) 
                    }).catch(_ => res.status(400).json(failMessage))
                } else attendance.type = 'telemedicina'
                attendance.endAt = moment().format('L - LTS')
                event.color = '#48d627'
                event.status = 'concluído'

                attendance.save().then(event.save()).then(res.status(200).json(successMessage))
            })
        }).catch(_ => res.status(500).json(failMessage))
    }

    const viewResumeAttendance = (req, res) => {
        const attendanceId = req.params.id

        Attendance.findOne({ _id: attendanceId }).then(attendance => {
            res.status(200).sendFile(attendance.resume, { root: './public/upload/resume/' })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewAttendanceFromScheduling = (req, res) => {
        const eventId = req.body.eventId
        const patientId = req.body.patientId

        Attendance.findOne({ _idPatient: patientId, _idEvent: eventId }).then(attendance => {
            if(!attendance || attendance.type === 'telemedicina') return res.status(400).json(failMessage)

            res.status(200).json({ msg: successMessage, id: attendance._id })
        }).catch(err => console.log(err))
    }
    
    return {
        registerNewUser,
        changeProfile,
        addNewlocation,
        recoverPassword,
        resetPassword,
        uploadProfilePicture,
        viewProfilePicture,
        viewPagePreco,
        changePassword,
        indicateNewProfessional,
        viewIndicatedRegister,
        registerNewIndicatedUser,
        postNewQuestion,
        answerQuestion,
        viewNewAppointment,
        postNewAppointment,
        viewAttendance,
        viewAttendanceFile,
        viewAccounting,
        pushNewEmployee,
        viewEmployeeDetail,
        removeEmployee,
        addBankAccount,
        addAttendanceValue,
        bankStatement,
        removeBankStatement,
        removeLocation,
        addBiography,
        addAward,
        removeAward,
        addSpeciality,
        removeSpeciality,
        addAgreement,
        removeAgreement,
        viewListOfPatient,
        viewHistoricPatient,
        viewBanner,
        viewAttendancePage,
        startAttendance,
        pushNewAttendanceInfo,
        pushNewAttendanceImage,
        endAttendance,
        viewResumeAttendance,
        viewAttendanceFromScheduling
    }
}