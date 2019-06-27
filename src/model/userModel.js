const mongoose = require('mongoose')

const LocationSchema = new mongoose.Schema({
    city: String,
    state: String,
    address: String,
    number: String,
    zipCode: String
})

const PlanSchema = new mongoose.Schema({
    _idPayment: String,
    title: String,
    status: String,
    startAt: String,
    endAt: String,
    payment: {
        paymentDay: String,
        _idCronJob: String
    }
})

const ProductSchema = new mongoose.Schema({
    _idPayment: String,
    title: String,
    status: String,
    city: String,
    specialty: String,
    daysUntilPlanIsOver: Number,
    startAt: String
})

const AppointmentSchema = new mongoose.Schema({
    _idPayment: String,
    _idEvent: String,
    title: String,
    status: String,
    value: String
})

const ReferralSchema = new mongoose.Schema({
    email: { type: String, required: true },
    status: { type: Boolean, required: true }
})

const EmployeeSchema = new mongoose.Schema({
    foto: String,
    nome: String,
    status: String,
    RG: String,
    salario: Number,
    CPF: String,
    cargo: String,
    conjugue: {
        CPF: String,
        RG: String
    },
    contaCorrente: String,
    createdAt: String,
    CNH: String,
    certificadoEscolar: String,
    cadernetaDeVacinacaoDosFilhos: String,
    certidaoDeNascimentoDosFilhos: String,
    certificadosDeCursosComplementares: String,
    comprovanteDeResidencia: String,
    certidaoDeNascimento: String,
    certidaoDeCasamento: String,
    certificadoDeReservista: String,
    atestadoDeSaudeOcupacional: String,
    tituloDeEleitor: String,
})

const AwardSchema = new mongoose.Schema({
    title: String,
    description: String
})

const SpecialitySchema = new mongoose.Schema({
    title: String,
    description: String
})

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true },
    password: String,
    phone: { type: String, required: true },
    cpf: String,
    dateOfBirth: String,
    zipCode: String,
    admin: { type: Boolean, required: true },
    createdAt: { type: String, required: true },
    deletedAt: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profilePicture: String,
    location: [LocationSchema],
    genre: { type: String, required: true },
    usertype: String,
    biography: String,
    awards: [AwardSchema],
    speciality: [SpecialitySchema],
    files: {
        type: Boolean,
        information: String
    },
    purchasesHistoric: {
        plan: [PlanSchema],
        product: [ProductSchema],
        appointment: [AppointmentSchema]
    },
    referralFrom: String,
    referral: [ReferralSchema],
    question: [{ _idQuestion: String }],
    accounting: {
        personalDepartment: [EmployeeSchema],
        attendanceValue: Number,
        bankAgency: String,
        bankNumber: String,
        bankName: String,
        bankAccountType: String
    },
    agreement: [String]
})

UserSchema.index({ location: 'text', name: 'text' })
mongoose.model('User', UserSchema)