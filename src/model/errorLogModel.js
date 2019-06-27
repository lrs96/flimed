const mongoose = require('mongoose')

const ErrorLogSchema = new mongoose.Schema({
    _idUser: String,
    createdAt: String,
    errorLocation: String,
    errorDescription: String,
    errorStatus: String,
    errorMessage: String,
    level: String
})

mongoose.model('ErrorLog', ErrorLogSchema)