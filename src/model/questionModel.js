const mongoose = require('mongoose')

const QuestionSchema = new mongoose.Schema({
    _idWhoAsked: { type: String, required: true },
    _idWhoReceived: { type: String, required: true },
    question: { type: String, required: true },
    answer: String
})

mongoose.model('Question', QuestionSchema)