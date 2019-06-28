"use strict";

const express = require('express')
const app = express()
const consign = require('consign')
const db = require('./src/config/db')
const createFolder = require('./src/config/createFolder')
require('dotenv').config()

app.use(express.static(__dirname))
createFolder()
db.openConn()
const cronJob = require('./src/config/cronJob')
consign()
    .include('./src/config/passport.js')
    .then('./src/config/middlewares.js')
    .then('./src/api/validation.js')
    .then('./src/config/mail.js')  
    .then('./src/api')
    .then('./src/config/routes.js')  
    .into(app)

cronJob.startCronJobServer()

app.listen(process.env.PORT || 8080, _ => {
    console.log(`Servidor funcionando na porta ${process.env.PORT}`)
    if(process.env.AMBIENT_MODE == 'DEV') console.log('\x1b[41m\x1b[37m', 'MODO DE DESENVOLVIMENTO ATIVADO!', '\x1b[0m')
})