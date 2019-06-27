const mongoose = require('mongoose')
const SellSchema = new mongoose.Schema({}, { strict: false })
mongoose.model('Sell', SellSchema)
