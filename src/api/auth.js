"use strict";

const mongoose = require('mongoose')
const User = mongoose.model('User')
const jwt = require('jwt-simple')
const bcrypt = require('bcrypt-nodejs')

module.exports = app => {
    const login = async (req, res) => {
        const {
            existOrError,
            tooBigEmail,
            validEmailOrError
        } = app.src.api.validation

        try {
            existOrError(req.body.email, 'Digite seu Email')
            tooBigEmail(req.body.email, 'Seu Email é muito longo')
            validEmailOrError(req.body.email, 'Email inválido')
            existOrError(req.body.password, 'Digite sua senha')
        } catch(msg) {
            return res.status(400).json(msg)
        }

        
        
        const user = await User.findOne({ email: req.body.email })
        .catch(_ => res.status(500).json('Algo deu errado'))
        if(!user || user.deletedAt) return res.status(401).json('Email ou senha inválidos')
        const isMatch = bcrypt.compareSync(req.body.password, user.password)
        if(!isMatch) return res.status(401).json('Email ou senha inválidos')

        const now = Math.floor(Date.now() / 1000)
        const payload = {
            id: user._id,
            iss: process.env.DOMAIN_NAME, 
            iat: now,
            exp: now + 60 * 60 * 24
        }

        user.password = undefined
        if(req.session) req.session.reset()
        req.session.user = user
        req.session.token = jwt.encode(payload, process.env.AUTH_SECRET)
        res.status(200).end()
    }

    const validateToken = async (req, res) => {
        if(req.session.user) {
            const userToken = req.session.token || null
            try {
                if (userToken) {
                    const token = jwt.decode(userToken, process.env.AUTH_SECRET)
                    if (new Date(token.exp * 1000) > new Date()) { 
                        if(req.session.user.usertype === 'PACIENTE') return res.redirect('/cliente-painel')
                        else if(req.session.user.usertype === 'MEDICO') return res.redirect('/medico-painel')
                        else if(req.session.user.usertype === 'CLINICA') return res.redirect('/clinica-painel')
                        else if(req.session.user.admin) return res.redirect('/admin-painel')
                        else return res.status(401).render('login', { message: JSON.stringify('Algo deu errado') })
                    }
                }
            } catch (err) {
                return res.status(401).render('login', { message: JSON.stringify('Algo deu errado') })
            }
        } else {
            return res.status(401).render('login', { message: JSON.stringify('Algo deu errado') })
        }
    }      

    return { login, validateToken }
}