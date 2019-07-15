"use strict";

const mongoose = require('mongoose')
const User = mongoose.model('User')
const Event = mongoose.model('Event')
const Question = mongoose.model('Question')
const Attendance = mongoose.model('Attendance')

module.exports = app => {
    const {
        existOrError,
        tooSmall
    } = app.src.api.validation

    const viewPatientPanel = (req, res) => {
        res.status(200).render('cliente-painel', { message: null, user: req.session.user })
    }

    const viewPatientHistory = (req, res) => {
        res.status(200).render('cliente-historico', { page: 'Histórico', message: null, user: req.session.user })
    }

    const viewPatientProfile = (req, res) => {
        res.status(200).render('cliente-perfil', { message: null, user: req.session.user })
    }

    const viewPatientQuestions = async (req, res) => {
        await Question.find({ _idWhoAsked: req.session.user._id }).then(async questions => {
            let question = []

            if(questions.length) {
                for(let i = 0; i < questions.length; i++) {
                    await User.findOne({ _id: questions[i]._idWhoReceived }).then(doctor => {
                        question.push({ 
                            fromDoctor: {
                                _idDoctor: doctor._id,
                                name: doctor.name,
                                profilePicture: doctor.profilePicture
                            },
                            question: questions[i].question,
                            answer: questions[i].answer || null
                        })
                    })
                }

                res.status(200).render('cliente-perguntas', {
                    message: null,
                    user: req.session.user,
                    question
                })
            } else {
                res.status(200).render('cliente-perguntas', {
                    message: null,
                    user: req.session.user,
                    question
                })
            }
        }).catch(_ => res.status(500).render('500'))
    }

    const viewPatientScheduling = async (req, res) => {
        await User.findOne({ _id: req.session.user._id }).then(async user => {
            user.password = undefined
            await Event.find({ _idPatient: user._id }).then(async events => {
                let doctors = []
                if(events.length) {
                    for(let i = 0; i < events.length; i++) {
                        await User.findOne({ _id: events[i]._idDoctor }).then(doctor => {
                            doctor.password = undefined
                            doctors.push(doctor)    
                        })
                    }
                }

                res.status(200).render('cliente-horarios', {
                    page: 'Horários',
                    user,
                    events,
                    doctors,
                    message: null
                })
            })
        }).catch(_ => res.status(500).render('500'))
    }

    const viewPatientEvaluation = async (req, res) => {
        const eventId = req.query.eventId

        await Event.findOne({ _id: eventId }).then(event => {
            if(event._idPatient === req.session.user._id) {
                return res.status(200).render('cliente-avaliacao', {
                    page: 'Avaliação',
                    user: req.session.user,
                    eventId: event._id,
                    message: null
                })
            } else {
                return res.status(500).render('500')
            }
        }).catch(_ => res.status(500).render('500'))
    }

    const postPatientEvaluation = async (req, res) => {
        const patientOpinion = { ...req.body }

        try {
            existOrError(patientOpinion.vote, 'Escolha se o atendimento foi positivo ou negativo')
            existOrError(patientOpinion.opinion, 'Digite sua opinião sobre o atendimento')
            tooSmall(patientOpinion.opinion, 'Digite uma opinião maior')
        } catch(msg) {
            return res.status(400).render('cliente-avaliacao', {
                page: 'Avaliação',
                user: req.session.user,
                eventId: patientOpinion.eventId,
                message: JSON.stringify(msg)
            })
        }

        await Attendance.findOne({ _idEvent: patientOpinion.eventId }).then(async attendance => {
            if(attendance._idPatient == req.session.user._id) {
                await Event.findOne({ _id: patientOpinion.eventId }).then(event => {
                    event.patientInfo.patientOpinion = true
                    attendance.patientOpinion.vote = patientOpinion.vote
                    attendance.patientOpinion.opinion = patientOpinion.opinion
                    
                    event.save().then(_ => attendance.save()).then(_ => res.status(200).redirect('/cliente-horarios'))                    
                })
            } else {
                res.status(500).render('500')
            }
        }).catch(_ => res.status(500).render('500'))
    }

    return {
        viewPatientPanel,
        viewPatientProfile,
        viewPatientQuestions,
        viewPatientHistory,
        viewPatientScheduling,
        viewPatientEvaluation,
        postPatientEvaluation
    }
}