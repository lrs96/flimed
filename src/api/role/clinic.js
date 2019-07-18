"use strict";

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Question = mongoose.model('Question')
const Event = mongoose.model('Event')
const Attendance = mongoose.model('Attendance')
const Financial = mongoose.model('Financial')
const BankStatement = mongoose.model('BankStatement')
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

    const viewClinicRegister = (req, res) => {
        res.status(200).render('clinica-cadastro',{
            page: 'Cadastro',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicPerguntas = (req, res) => {
        res.status(200).render('clinica-perguntas',{
            page: 'Perguntas',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicHistorico = (req, res) => {
        res.status(200).render('clinica-historico',{
            page: 'Histórico',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicContabilidade = (req, res) => {
        res.status(200).render('clinica-contabilidade',{
            page: 'Contabilidade',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicFinanceiro = (req, res) => {
        res.status(200).render('clinica-financeiro',{
            page: 'Financeiro',
            user: req.session.user,
            message: null
        })
    }


    const viewClinicHorarios = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            user.password = undefined
            await Event.find({ _idDoctor: user._id }).then(events => {
                res.status(200).render('clinica-horarios', {
                    page: 'Horários',
                    user,
                    events,
                    message: null
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }
    

    const clinicRegister = async (req, res) => {
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
        user.usertype = 'CLINICA'
        user.location = {
            city: user.city,
            state: user.state
        }

        await User.create(user).then(_ => res.status(200).json(successMessage))
        .catch(_ => res.status(400).json(failMessage))
    }

    const viewClinicPanel = (req, res) => {
        res.status(200).render('clinica-painel', {
            page: 'Painel',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicProfile = (req, res) => {
        res.status(200).render('clinica-perfil', {
            page: 'Clínica Perfil',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicListAttendance = (req, res) => {
        res.status(200).render('clinica-lista-atendimento', {
            page: 'Painel',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicListClient = (req, res) => {
        res.status(200).render('clinica-lista-clientes', {
            page: 'Painel',
            user: req.session.user,
            message: null
        })
    }

    const viewClinicMedicines = (req, res) => {
        res.status(200).render('clinica-medicamentos', {
            page: 'Painel',
            user: req.session.user,
            message: null
        })
    }

    return { 
        viewClinicRegister,
        clinicRegister,
        viewClinicHorarios,
        viewClinicFinanceiro,
        viewClinicContabilidade,
        viewClinicHistorico,
        viewClinicPerguntas,
        viewClinicPanel,
        viewClinicProfile,
        viewClinicListAttendance,
        viewClinicListClient,
        viewClinicMedicines
    }
}