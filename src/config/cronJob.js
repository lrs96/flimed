"use strict";

const mongoose = require('mongoose')
const User = mongoose.model('User')
const Financial = mongoose.model('Financial')
const PlanCronJob = mongoose.model('PlanCronJob')
const Event = mongoose.model('Event')
const ErrorLog = mongoose.model('ErrorLog')
const Sell = mongoose.model('Sell')
const CronJob = require('cron').CronJob
const paypal = require('paypal-rest-sdk')
const moment = require('moment')

paypal.configure({
    'mode': process.env.PAYPAL_CLIENT_MODE,
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
})

async function CreateErrorLog(id, location, description, status, message, level) {
    moment.locale('pt-br')
    return await new ErrorLog({
        _idUser: id,
        createdAt: moment().format('L') + ' - ' + moment().format('LT'),
        errorLocation: location,
        errorDescription: description,
        errorStatus: status,
        errorMessage: message,
        level
    }).save()
}

module.exports = {
    startCronJobServer() {
        const planJob = new CronJob('0 0 0 * * *', async _ => {
            await PlanCronJob.find().then(async planCronJob => {
                if(!planCronJob.length) return

                for(let i = 0; i < planCronJob.length; i++) {
                    if(planCronJob[i].status === 'pendente') {
                        if(planCronJob[i].daysUntilPlanIsOver <= 0) {
                            if(planCronJob[i].type === 'cancelamento') {
                                await User.findOne({ _id: planCronJob[i]._idUser }).then(async user => {
                                    await Financial.find().then(async financial => {
                                        for(let j = 0; j < financial[0].planReport.length; j++) {
                                            if(financial[0].planReport[j]._id == planCronJob[i]._idFinancial) {
                                                financial[0].planReport[j].status = 'cancelado'
                                                financial[0].totalPerMonth -= financial[0].planReport[j].amount
                                                for(let k = 0; k < user.purchasesHistoric.plan.length; k++) {
                                                    if(user.purchasesHistoric.plan[k]._idPayment == planCronJob[i]._idFinancial) {
                                                        user.purchasesHistoric.plan[k].status = 'cancelado'
                                                        await user.save()
                                                        break
                                                    }
                                                }

                                                await financial[0].save()
                                                break
                                            }
                                        }

                                        planCronJob[i].status = 'concluído'
                                    })
                                })
                            }

                            if(planCronJob[i].type === 'vencimento') {              
                                await Financial.find().then(async financial => {                        
                                    for(let j = 0; j < financial[0].productReport.length; j++) {
                                        if(planCronJob[i]._idFinancial == financial[0].productReport[j]._id) {
                                            financial[0].productReport[j].status = 'vencido'

                                            await User.findOne({ _id: planCronJob[i]._idUser }).then(async user => {
                                                for(let k = 0; k < user.purchasesHistoric.product.length; k++) {
                                                    if(user.purchasesHistoric.product[k]._idPayment == financial[0].productReport[j]._id) {
                                                        user.purchasesHistoric.product[k].status = 'vencido'
                                                        await user.save()
                                                        break
                                                    }
                                                }
                                            })
                                                
                                            planCronJob[i].status = 'concluído'
                                            break
                                        }
                                    }

                                    await financial[0].save()
                                }) 
                            }
                        } else {
                            planCronJob[i].daysUntilPlanIsOver--
                        }

                        await planCronJob[i].save()
                    }
                }

                return
            }).catch(async err => await CreateErrorLog(
                    null,
                    'CronJob - planJob function',
                    'Failed to cancel old plans',
                    '500',
                    err,
                    'high'
                )
            )
        })

        planJob.start()

        const eventJob = new CronJob('*/30 * * * *', async _ => {
            const dateNow = moment().format()

            return await Event.find().then(async events => {
                if(!events.length) return

                let eventsId = []
                for(let i = 0; i < events.length; i++) {
                    if(events[i].start <= dateNow && events[i].status === 'disponível') {
                        eventsId.push(events[i]._id)
                    }
                }

                return await Event.deleteMany({ _id: eventsId })
            }).catch(async err => await CreateErrorLog(
                    null,
                    'CronJob - eventJob function',
                    'Failed to deleting the old medical schedule',
                    '500',
                    err,
                    'high'
                )
            )
        })

        eventJob.start()

        const checkPlan = new CronJob('*/5 * * * *', async _ => {
            return await Financial.find().then(async financial => {
                if(!financial.length) return

                for(let i = 0; i < financial[0].planReport.length; i++) {
                    if(financial[0].planReport[i].status === 'ativo') {
                        return paypal.billingAgreement.get(financial[0].planReport[i]._idPaypalProfile, async function (err, billingAgreement) {
                            if (err) {
                                return await CreateErrorLog(
                                    financial[0].planReport[i]._idUser,
                                    'CronJob - checkPlan function',
                                    'Failed to check plan',
                                    err.httpStatusCode,
                                    err,
                                    'high'
                                )
                            } else {
                                if(parseInt(billingAgreement.agreement_details.failed_payment_count) > 0) {
                                    const cancel_note = {
                                        'note': 'Cancelamento do plano por falta de pagamento'
                                    }

                                    return paypal.billingAgreement.cancel(financial[0].planReport[i]._idPaypalProfile, cancel_note, async function (err, response) {
                                        if (err) {
                                            return await CreateErrorLog(
                                                financial[0].planReport[i]._idUser,
                                                'CronJob - checkPlan function',
                                                'Failed to cancel plan',
                                                err.httpStatusCode,
                                                err,
                                                'high'
                                            )
                                        } else {
                                            return paypal.billingAgreement.get(financial[0].planReport[i]._idPaypalProfile, async function (err, billingAgreement) {
                                                if (err) {
                                                    return await CreateErrorLog(
                                                        financial[0].planReport[i]._idUser,
                                                        'CronJob - checkPlan function',
                                                        'Failed to check if plan is cancelled',
                                                        err.httpStatusCode,
                                                        err,
                                                        'medium'
                                                    )
                                                } else {        
                                                    if(financial[0].planReport[i]._idPaypalReport) {
                                                        await Sell.deleteOne({ _id: financial[0].planReport[i]._idPaypalReport })
                                                        .catch(async err => await CreateErrorLog(
                                                                null,
                                                                'CronJob - checkPlan function',
                                                                'Failed to delete old sell report',
                                                                '500',
                                                                err,
                                                                'high'
                                                            )
                                                        )
                                                    }
                                                    
                                                    return await new Sell(billingAgreement).save()
                                                    .then(async payment => {
                                                        await User.findOne({ _id: financial[0].planReport[i]._id }).then(async user => {
                                                            for(let j = 0; j < user.purchasesHistoric.plan.length; j++) {
                                                                if(user.purchasesHistoric.plan[j]._idPayment == financial[0].planReport[i]._id) {
                                                                    moment.locale('pt-br')  
                                                                    user.purchasesHistoric.plan[j].status = 'cancelado'
                                                                    user.purchasesHistoric.plan[j].endAt = moment().format('L')
                                                                    financial[0].planReport[i]._idPaypalReport = payment._id
                                                                    financial[0].planReport[i].status = 'cancelado'

                                                                    await financial[0].save()
                                                                    return await user.save()
                                                                }
                                                            }
                                                        }).catch(async err => await CreateErrorLog(
                                                                null,
                                                                'CronJob - checkPlan function',
                                                                'Failed to update user/financial status',
                                                                '500',
                                                                err,
                                                                'high'
                                                            )
                                                        )
                                                    }).catch(async err => await CreateErrorLog(
                                                            null,
                                                            'CronJob - checkPlan function',
                                                            'Failed to create new sell report',
                                                            '500',
                                                            err,
                                                            'high'
                                                        )
                                                    )
                                                }
                                            })
                                        }
                                    })
                                }

                                if(parseInt(billingAgreement.agreement_details.cycles_completed) > 0) {
                                    await User.findOne({ _id: financial[0].planReport[i]._idUser }).then(async user => {
                                        moment.locale('pt-br')
                                        for(let j = 0; j < user.purchasesHistoric.plan.length; j++) {
                                            if(user.purchasesHistoric.plan[j]._idPayment == financial[0].planReport[i]._id) {
                                                if(user.purchasesHistoric.plan[j].payment.paymentDay != moment(billingAgreement.agreement_details.next_billing_date, 'YYYY-MM-DD').format('L')) {
                                                    user.purchasesHistoric.plan[j].payment.paymentDay = moment(billingAgreement.agreement_details.next_billing_date, 'YYYY-MM-DD').format('L')
                                                    await user.save()
                                                    .catch(async err => await CreateErrorLog(
                                                            null,
                                                            'CronJob - checkPlan function',
                                                            'Failed to update user payment day',
                                                            '500',
                                                            err,
                                                            'high'
                                                        )
                                                    )
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })
        })

        checkPlan.start()
    }
}