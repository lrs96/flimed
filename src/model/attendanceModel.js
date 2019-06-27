const mongoose = require('mongoose')

const BudgetSchema = new mongoose.Schema({
    procedure: String,
    value: String,
    comments: String
})

const ExamsAndProceduresSchema = new mongoose.Schema({
    date: String,
    clinicalIndication: String,
    exams: String,
    amount: String
})

const AttendanceSchema = new mongoose.Schema({
    _idDoctor: String,
    _idPatient: String,
    _idEvent: String,
    createdAt: String,
    endAt: String,
    resume: String,
    type: String,
    patientOpinion: {
        vote: String,
        opinion: String
    },
    anamnesis: {
        complaint: String,
        history: String,
        articularProblemsOrRheumatism: String,
        kidneyProblems: String,
        heartProblems: String,
        breathingProblems: String,
        gastricProblems: String,
        allergies: String,
        useOfMedications: String,
        hepatitis: Boolean,
        pregnancy: Boolean,
        diabetes: Boolean,
        healingProblems: Boolean
    },
    physicalExam: {
        height: String,
        palpation: String,
        injuries: String,
        weight: String,
        heartRate: String,
        systolicBloodPressure: String,
        diastolicBloodPressure: String,
        generalObservations: String
    },
    diagnosticHypothesis: {
        diagnosis: String,
        comments: String
    },
    evolution: String,
    budget: [BudgetSchema],
    examsAndProcedures: [ExamsAndProceduresSchema],
    prescriptions: {
        specialControlReceipt: Boolean,
        date: String,
        medication: String,
        amount: String,
        posology: String
    },
    attestations: {
        date: String,
        attestation: String
    },
    imagesOrAttachments: [{ fileName: String }]
})

mongoose.model('Attendance', AttendanceSchema)