"use strict";

const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS
    }
})

module.exports = { 
    recoveryMail(email, token) {
        const mailOptions = {
            from: 'Conexão Saúde <'+process.env.MAIL_AUTH_USER+'>',
            to: email,
            subject: 'Recuperação de senha 🔒⛔',
            text: 'Você está recebendo este Email pois solicitou a redefinição da senha da sua conta.\n' +
            'Por favor, clique no link abaixo ou cole no seu navegador para completar o processo:\n\n' +
            process.env.DOMAIN_NAME + '/esqueci-minha-senha/' + token + '\n\n' +
            'Se você não solicitou isso, ignore este Email e sua senha permanecerá inalterada.\n'
        } 

        transporter.sendMail(mailOptions)
    },

    alertOfChange(email) {
        const mailOptions = {
            from: 'Conexão Saúde <'+process.env.MAIL_AUTH_USER+'>',
            to: email,
            subject: 'Alteração de senha 🔒⛔',
            text: 'Uma alteração de senha acabou de ser feita no site ' + process.env.DOMAIN_NAME + '\n\n' +
            'Se você não fez essa alteração, por favor entre em contato com o suporte.'
        } 
        transporter.sendMail(mailOptions)
    },

    indicateNewProfessional(name, email, id) {
        const mailOptions = {
            from: 'Conexão Saúde <'+process.env.MAIL_AUTH_USER+'>',
            to: email,
            subject: 'Você foi indicado para a nossa plataforma! 🤩🤩',
            html: '<b>Olá, ' + name + '. É com muito prazer que anunciamos que você foi indicado para a nossa plataforma!</b><br/><br/>'+
            'Teremos o maior prazer em recebe-lo em nossa comunidade. Por favor, acesse o link abaixo para se registrar com o código de referência:<br/>' +
            process.env.DOMAIN_NAME + '/indicado/' + id + '<br/><br/>' +
            'Em caso de dúvidas, responda a este Email.<br/>' +
            '<b>Conexão Saúde</b><br/>https://conexaos.com.br'
        }

        transporter.sendMail(mailOptions) 
    },

    newQuestion(name, doctorName, email, question) {
        const mailOptions = {
            from: 'Conexão Saúde <'+process.env.MAIL_AUTH_USER+'>',
            to: email,
            subject: 'Você tem uma nova pergunta! 🤩🤩',
            html: '<b>Olá, ' + doctorName + '. Você recebeu uma nova pergunta de: ' + name +'.</b><br/><br/>'+
            'Pergunta:<br/>' +
            '"<b>' + question + '</b>"<br/><br/>' +
            'Para responder essa pergunta, acesse:<br/>' + 
            process.env.DOMAIN_NAME + '/medico-perguntas<br/><br/>' +
            'Em caso de dúvidas, responda a este Email.<br/>' +
            '<b>Conexão Saúde</b><br/>https://conexaos.com.br'
        }

        transporter.sendMail(mailOptions) 
    }
}