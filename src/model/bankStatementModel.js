const mongoose = require('mongoose')

const BankStatementSchema = new mongoose.Schema({
    _idUser: { type: String, required: true },
    type: { type: String, required: true },
    paymentType: String,
    description: String,
    category: String,
    value: { type: Number, required: true },
    patientName: String,
    professionalName: String,
    agreement: String,
    procedure: String,
    invoiceMaturity: String,
    costCenter: String,
    receivedAt: String,
    origin: String,
    destiny: String,
    account: String,
    recurrence: String,
    occurrencesTimes: String,
    installmentInput: String,
    installmentNumber: String,
    installmentValue: String,
    createdAt: String
})

mongoose.model('BankStatement', BankStatementSchema)