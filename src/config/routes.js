"use strict";

const admin = require('./role/admin')
const patient = require('./role/patient')
const doctor = require('./role/doctor')
const clinic = require('./role/clinic')

module.exports = app => {
    /* ============= INDEX ============= */
    app.get('/', function(req, res) {
         if(!req.session || !req.session.user || req.session.user.usertype === 'PACIENTE') {
            res.status(200).render('index')
        } else {
            if(req.session.user.usertype === 'MEDICO') {
                res.redirect('/medico-painel')
            } else if(req.session.user.usertype === 'CLINICA') {
                res.redirect('/clinica-painel')
            } else if(req.session.user.usertype === 'ADMIN') {
                res.redirect('/admin-painel')
            } else {
               res.status(200).render('index')
            }
        }        
    })

    //#region MISCELLANEOUS
    /* ============= SIMPLE SEARCH ============= */
    app.post('/pesquisa', app.src.api.search.simpleSearch)

    /* ============= ADVANCED SEARCH ============= */
    app.get('/pesquisa-avancada', app.src.api.search.viewAdvancedSearch)
    app.post('/pesquisa-avancada', app.src.api.search.advancedSearch)

    /* ============= VIEW RESULT FROM SEARCH ============= */
    app.get('/pesquisa', app.src.api.search.viewResult)

    /* ============= VIEW PLAN PAGE ============= */
    app.get('/planos', function(req, res) {
        res.status(200).render('page-preco', { page: 'Planos', user: req.session.user,  message: null })
    })

    app.get('/precos-novos', function(req, res) {
        res.status(200).render('page-preco-novos', { page: 'novo',  message: null })
    })

    /* ============= UPLOAD / VIEW USER PROFILE PIC ============= */
    app.get('/profilePicture/:id', app.src.api.user.viewProfilePicture)
    app.route('/addProfilePicture')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.uploadProfilePicture)

    /* ============= CHANGE USER PASSWORD ============= */
    app.route('/changePassword')
        .all(app.src.config.passport.authenticate())
        .put(app.src.api.user.changePassword)

    /* ============= CHANGE USER PROFILE INFORMATION ============= */
    app.route('/changeProfile')
        .all(app.src.config.passport.authenticate())
        .put(app.src.api.user.changeProfile)
        .post(app.src.api.user.addNewlocation)
        .delete(app.src.api.user.removeLocation)

    app.route('/add-biography')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.addBiography)

    app.route('/add-award')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.addAward)     
        .delete(app.src.api.user.removeAward)   

    app.route('/add-speciality')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.addSpeciality)     
        .delete(app.src.api.user.removeSpeciality)      

    /* ============= VIEW DOCTOR PROFILE ============= */
    app.get('/medico-detalhe/:id', app.src.api.role.doctor.viewDoctorProfileFromUser)

    /* ============= POST NEW QUESTION / ANSWER QUESTION ============= */  
    app.route('/resposta')
        .all(app.src.config.passport.authenticate())
        .put(app.src.api.user.answerQuestion)  
    app.post('/pergunta', app.src.api.user.postNewQuestion)

    /* ============= REFERRAL SYSTEM ============= */
    app.route('/indicacao')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.indicateNewProfessional)
    app.route('/indicado/:id')
        .get(app.src.api.user.viewIndicatedRegister)
        .post(app.src.api.user.registerNewIndicatedUser)

    /* ============= VIEW SITEMAP ============= */
    app.get('/sitemap', function(req, res) {
        res.status(200).render('sitemap')
    })
    //#endregion

    //#region USER GENERAL
    /* ============= LOCAL LOGIN ============= */
    app.get('/login', function(req, res) {
        res.status(200).render('page-login', { message: null })
    })
    app.post('/login', app.src.api.auth.login)
    
    
    app.get('/novo-cadastro', function(req, res) {
        res.status(200).render('novo-cadastro', {message: null, page: 'novo-cadastro' })
    })


    /* ============= VALIDATE USER ============= */
    app.route('/validate')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.auth.validateToken)

    /* ============= PATIENT REGISTER ============= */
    app.get('/cliente-cadastro', function(req, res) {
        res.status(200).render('cliente-cadastro', { page: 'Cadastro', message: null, user: req.session.user })
    })
    app.post('/cliente-cadastro', app.src.api.user.registerNewUser)

    /* ============= FORGOT PASSWORD ============= */
    app.get('/esqueci-minha-senha', function(req, res) {
        res.status(200).render('page-esqueci-minha-senha', { message: null })
    })
    app.post('/esqueci-minha-senha', app.src.api.user.recoverPassword)
    app.get('/esqueci-minha-senha/:token', app.src.api.user.recoverPassword)
    app.post('/esqueci-minha-senha/:token', app.src.api.user.resetPassword)

    /* Routas de teste */
 

    /* ============= LOGOUT ============= */
    app.get('/logout', function(req, res) {
        req.session.reset()          
        req.logout()     
        res.redirect('/')
    })

    app.route('/atendimento/:id')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewAttendance)

    app.route('/get/:id/:fileName')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewAttendanceFile)

    app.route('/employeeDetail/:filename')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewEmployeeDetail)

    app.route('/bankStatement')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.bankStatement)
        .delete(app.src.api.user.removeBankStatement)

    app.route('/lista-de-pacientes')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewListOfPatient)   

    app.route('/historico-paciente/:id')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewHistoricPatient)   

    app.get('/banner/:fileName', app.src.api.user.viewBanner)

    app.route('/imprimir-resumo/:id')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.user.viewResumeAttendance)   
    //#endregion

    //#region PATIENT
    app.route('/cliente-painel')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.role.patient.viewPatientPanel))

    app.route('/cliente-perfil')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.role.patient.viewPatientProfile))

    app.route('/cliente-horarios')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.role.patient.viewPatientScheduling))

    app.route('/cliente-perguntas')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.role.patient.viewPatientQuestions))

    app.route('/cliente-avaliacao')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.role.patient.viewPatientEvaluation))
        .post(patient(app.src.api.role.patient.postPatientEvaluation))

    /* ============= VIEW / MAKE APPOINTMENT DETAILS ============= */
    app.route('/marcar-consulta')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.user.viewNewAppointment))
        .post(patient(app.src.api.user.postNewAppointment))
    //#endregion

    //#region DOCTOR
    app.route('/medico-cadastro')
        .get(app.src.api.role.doctor.viewDoctorRegister)
        .post(app.src.api.role.doctor.doctorRegister)

    app.route("/medico-historico")
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorHistory))

    app.route('/medico-painel')
    .all(app.src.config.passport.authenticate())
    .get(doctor(app.src.api.role.doctor.viewDoctorPanel))

    app.route('/medico-perfil')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorProfile))

    app.route('/medico-horarios')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorScheduling))
        .post(doctor(app.src.api.role.doctor.addDoctorSchedule))
        .delete(doctor(app.src.api.role.doctor.removeDoctorSchedule))

    app.route('/medico-perguntas')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorQuestions))

    app.route('/medico-financeiro')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorFinancial))

    app.route('/medico-contabilidade')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.user.viewAccounting))
        .post(doctor(app.src.api.user.pushNewEmployee))
        .put(doctor(app.src.api.user.addBankAccount))
        .patch(doctor(app.src.api.user.addAttendanceValue))

    app.route('/convenio')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.user.addAgreement)
        .delete(app.src.api.user.removeAgreement)

    app.route('/medico-contabilidade/:id')
        .all(app.src.config.passport.authenticate())
        .delete(doctor(app.src.api.user.removeEmployee))

    app.route('/medico-atendimento')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.user.viewAttendancePage))
        .post(doctor(app.src.api.user.startAttendance))
        .patch(doctor(app.src.api.user.endAttendance))
        .put(doctor(app.src.api.user.pushNewAttendanceInfo))       

    app.route('/medico-atendimento-imagem')
        .all(app.src.config.passport.authenticate())
        .post(doctor(app.src.api.user.pushNewAttendanceImage))

    app.route('/medico-anuncios')
        .all(app.src.config.passport.authenticate())
        .get(doctor(app.src.api.role.doctor.viewDoctorAdverts))

    app.route('/medico-atendimento-ver-atendimento')
        .all(app.src.config.passport.authenticate())
        .post(doctor(app.src.api.user.viewAttendanceFromScheduling))
    //#endregion

    //#region CLINIC
    app.route('/clinica-cadastro')
        .get(app.src.api.role.clinic.viewClinicRegister)
        .post(app.src.api.role.clinic.clinicRegister)

    app.route('/clinica-painel')
        .all(app.src.config.passport.authenticate())
        .get(clinic(app.src.api.role.clinic.viewClinicPanel))

    app.route('/clinica-perfil')
        .all(app.src.config.passport.authenticate())
        .get(clinic(app.src.api.role.clinic.viewClinicProfile))
    
    app.route('/clinica-lista-atendimento')
        .all(app.src.config.passport.authenticate())
        .get(clinic(app.src.api.role.clinic.viewClinicListAttendance))
    
    app.route('/clinica-lista-clientes')
        .all(app.src.config.passport.authenticate())
        .get(clinic(app.src.api.role.clinic.viewClinicListClient))
    
    app.route('/clinica-medicamentos')
        .all(app.src.config.passport.authenticate())
        .get(clinic(app.src.api.role.clinic.viewClinicMedicines))
    //#endregion
    
    //#region PAYPAL SYSTEM
    /* ============= BUY NORMAL PRODUCT  ============= */
    app.route('/buy-profile')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.paypal.buy)
        
    app.route('/success')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.paypal.success)

    app.route('/buy-banner')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.paypal.buyBanner)
        
    app.route('/success-banner')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.paypal.successBanner)

    app.route('/pagar-agendamento')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.paypal.buyNewAppointment))

    app.route('/success-agendamento')
        .all(app.src.config.passport.authenticate())
        .get(patient(app.src.api.paypal.successNewAppointment))        

    /* ============= BUY SUBSCRIPTION PRODUCT  ============= */
    app.route('/subscription/:id')
        .all(app.src.config.passport.authenticate())
        .post(app.src.api.paypal.subscription)
    app.route('/successSubscription')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.paypal.successSubscription)

    /* ============= CANCEL SUBSCRIPTION  ============= */
    app.route('/cancel')
        .all(app.src.config.passport.authenticate())
        .get(app.src.api.paypal.viewCancelPlan)
        .post(app.src.api.paypal.cancelPlan)

    /* ============= HANDLE RESPONSE (IPN) FROM PAYPAL  ============= */
    app.post('/ipn', app.src.api.paypal.ipn)
    //#endregion

    //#region ADMIN
    app.route('/admin-painel')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewAdminPanel))
        .post(admin(app.src.api.role.admin.changePrice))
    
    app.route('/admin-perfil')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewAdminProfile))
        .put(admin(app.src.api.role.admin.changeProfileAdmin))

    app.route('/admin-change-user/:id')
        .all(app.src.config.passport.authenticate())
        .put(admin(app.src.api.role.admin.changeUserProfile))

    app.route('/admin-financeiro')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewAdminFinancial))    

    app.route('/admin-paypalreport/:id')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewAdminPaypalReport))         

    app.route('/admin-pacientes')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewUsers))

    app.route('/admin-medicos')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewUsers))

    app.route('/admin-clinicas')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.viewUsers))
    
    app.route('/admin-detalhes/:id')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.adminViewProfileDetails))
        .delete(admin(app.src.api.role.admin.adminRemoveUser))

    app.route('/admin-logs')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.adminViewLogs))

    app.route('/admin-banner/:id')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.adminViewBanner))

    app.route('/admin-banner/:id/:status')
        .all(app.src.config.passport.authenticate())
        .get(admin(app.src.api.role.admin.adminStatusBanner))
    //#endregion

    /* ============= HANDLE ERROR  ============= */
    if(process.env.AMBIENT_MODE == 'PROD') {
        app.use(function (err, req, res, next) { 
            res.status(500).render('500')
        })

        app.get('*', function(req, res) {
            res.status(404).render('404')
        })
    } else {  
        app.use('*', function(req, res) {
            res.status(404).send('404')
        })
    }
}