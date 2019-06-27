const mongoose = require('mongoose')

const SystemSchema = new mongoose.Schema({
    priceAdvertisementProfile: Number,
    priceAdvertisementBanner: Number
})

mongoose.model('System', SystemSchema)