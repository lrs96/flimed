const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true)
mongoose.set('useFindAndModify', false)

module.exports = {
    openConn() {
        mongoose.connect(process.env.DB_HOST, { useNewUrlParser: true }).catch(_ => {
            console.log('\x1b[41m\x1b[37m', 'ERRO AO SE CONECTAR COM O BANCO DE DADOS!', '\x1b[0m')
        })
        require('../model/userModel')
        require('../model/financialModel')
        require('../model/sellModel')
        require('../model/errorLogModel')
        require('../model/planCronJobModel')
        require('../model/questionModel')
        require('../model/eventModel')
        require('../model/attendanceModel')
        require('../model/bankStatementModel')
        require('../model/systemModel')
    }
}