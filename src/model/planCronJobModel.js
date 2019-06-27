const mongoose = require('mongoose')

const PlanCronJobSchema = new mongoose.Schema({
    _idUser: { type: String, required: true },
    _idFinancial: { type: String, required: true },
    type: { type: String, required: true },
    daysUntilPlanIsOver: { type: Number, required: true },
    status: { type: String, required: true }
})

mongoose.model('PlanCronJob', PlanCronJobSchema)