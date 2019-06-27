const mongoose = require('mongoose')

const ProductReportSchema = new mongoose.Schema({
    _idUser: String,
    _idPaypalReport: String,
    banner: String,
    product: String, 
    amountPerProduct: Number,
    total: Number,
    status: String, 
    createdAtDay: String,
    createdAtMoment: String,
    startAt: String,
    endAt: String,
    totalDays: Number,
    city: String,
    specialty: String
})

const PlanReportSchema = new mongoose.Schema({
    _idUser: String,
    _idPaypalReport: String,
    _idBillingAgreement: String,
    _idPaypalProfile: String,
    plan: String, 
    amount: Number,
    status: String, 
    createdAtDay: String,
    createdAtMoment: String
})

const AppointmentReportSchema = new mongoose.Schema({
    _idPatient: String,
    _idDoctor: String,
    _idEvent: String,
    _idPaypalReport: String,
    product: String, 
    total: Number,
    status: String, 
    createdAtDay: String,
    createdAtMoment: String
})

const FinancialSchema = new mongoose.Schema({
    productReport: [ProductReportSchema],
    planReport: [PlanReportSchema],
    appointmentReport: [AppointmentReportSchema],
    firstSale: String,
    lastSale: String,
    salesAmount: Number,
    totalPerMonth: Number
})

mongoose.model('Financial', FinancialSchema)