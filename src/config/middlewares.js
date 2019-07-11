"use strict";

const session = require("client-sessions")
const passport = require('passport')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const methodOverride = require('method-override')

module.exports = app => {
    app.use(helmet({ dnsPrefetchControl: { allow: true }}))
    app.use(cors())
    if(process.env.AMBIENT_MODE == 'PROD') { 
        app.use(session({
            cookieName: 'session',
            encryptionAlgorithm: 'aes256',
            encryptionKey: new Buffer.from(process.env.SESSION_SECRET1),
            signatureAlgorithm: 'sha256-drop128',
            signatureKey: new Buffer.from(process.env.SESSION_SECRET2, 'base64'),
            duration: 3600000,
            cookie: {
                path: '/',
                httpOnly: true,
                secure: false,
                ephemeral: false
            }
        })) 
    } else {
        app.use(session({
            cookieName: 'session',
            secret: process.env.SESSION_SECRET1,
            duration: 3600000,
            cookie: {
                path: '/',
                httpOnly: true,
                secure: false,
                ephemeral: true
            }
        })) 
        
        app.use(morgan('dev'))
    }
    app.use(passport.initialize())
    app.use(passport.session())  
    app.set('view engine', 'ejs') 
    app.use(bodyParser.urlencoded({ extended: true }))   
    app.use(bodyParser.json())   
    app.use(methodOverride(function (req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
          let method = req.body._method
          delete req.body._method
          return method
        }
    }))  
    app.use([
        '/validate',
        '/planos',
        '/addProfilePicture',
        '/resposta',
        '/get',
        '/employeeDetail',
        '/changePassword',
        '/changeProfile',
        '/add-biography',
        '/indicacao',
        '/atendimento',
        '/cliente-painel',
        '/cliente-perfil',
        '/cliente-horarios',
        '/cliente-perguntas',
        '/cliente-avaliacao',
        '/marcar-consulta',
        '/medico-painel',
        '/medico-perfil',
        '/medico-horarios',
        '/medico-financeiro',
        '/medico-contabilidade',
        '/medico-perguntas',
        '/medico-atendimento',
        '/medico-atendimento-concluir',
        '/medico-atendimento-imagem',
        '/medico-anuncios',
        '/resumo-atendimento',
        '/lista-de-pacientes',
        '/medico-atendimento-ver-atendimento',
        '/convenio',
        '/buy',
        '/success',
        '/buy-banner',
        '/success-banner',
        '/pagar-agendamento',
        '/success-agendamento',
        '/cancel',
        '/admin-painel',
        '/admin-perfil',
        '/admin-change-user',
        '/admin-financeiro',
        '/admin-paypalreport',
        '/admin-pacientes',
        '/admin-medicos',
        '/admin-clinicas',
        '/admin-detalhes',
        '/admin-logs',
        '/admin-banner',
        '/ver-lista-de-pacientes',
        '/historico-paciente',
        '/medico-historico'
    ], function (req, res, next) {
        if (!req.session || !req.session.user) {
            res.status(401).render('page-login', {
                message: JSON.stringify('Por favor, faça o login para acessar')
            })
        } else {  
            if(req.session.user.usertype === 'MEDICO' || req.session.user.usertype === 'CLINICA') {
                for(let i = 0; i < req.session.user.purchasesHistoric.plan.length; i++) {
                    if(req.session.user.purchasesHistoric.plan[i].status === 'ativo') {
                        return next()
                    }                
                }
                
                res.status(401).render('page-preco', {
                    page: 'Planos',
                    user: req.session.user,
                    message: JSON.stringify('Você precisa assinar um plano para acessar')
                })
            } else { 
                next() 
            }
        }
    })
}