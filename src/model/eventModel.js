const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
    _idDoctor: { type: String, required: true },
    _idPatient: String,
    title: { type: String, required: true },
    color: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    status: { type: String, required: true },
    value: { type: Number, required: true }, 
    type: { type: String, required: true }, 
    withdrawalStatus: String, 
    attendance: String,
    teleMedicineInfo: {
        URLDoctor: String,
        URLPatient: String
    },
    patientInfo: {
        patientAgreement: String,
        registerBy: String, 
        patientName: String, 
        patientGenre: String, 
        patientEmail: String, 
        patientPhone: String,
        patientComment: String,
        patientOpinion: { type: Boolean, default: false }
    },
    locationInfo: {
        city: String,
        state: String,
        address: String,
        number: String,
        zipCode: String
    },
    createdAt: { type: String, required: true }
})

mongoose.model('Event', EventSchema)