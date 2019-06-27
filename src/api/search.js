"use strict";

const mongoose = require('mongoose')
const User = mongoose.model('User')
const Financial = mongoose.model('Financial')
const uniqueRandomArray = require('unique-random-array')
const moment = require('moment')

module.exports = app => {
    const viewResult = async (req, res) => {
        Financial.find().then(financial => {
            let banner = []
            if(financial.length) {
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(financial[0].productReport[i].banner && financial[0].productReport[i].status === 'concluído') {
                        banner.push({
                            userId: financial[0].productReport[i]._idUser,
                            banner: financial[0].productReport[i].banner
                        })
                    }
                }
            }
            
            if(!banner.length) banner = null
            else banner = uniqueRandomArray(banner)()

            res.status(200).render('page-resultado', {  
                page: 'Pesquisa',
                message: null,
                user: req.session.user,
                result: null,
                location: null,
                moment,
                search: null,
                banner
            })
        }).catch(err => console.log(err))
    }

    const simpleSearch = async (req, res) => {
        const search = { ...req.body }
        const result = []
        
        await User.find().then(user => {
            for(let i = 0; i < user.length; i++) {
                if(!user[i].admin) {
                    if(search.speciality) {
                        for(let j = 0; j < user[i].speciality.length; j++) {
                            if(user[i].speciality[j].title === search.speciality) {
                                if(search.radio) {
                                    if(user[i].usertype === search.radio) {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                } else {
                                    if(user[i].usertype !== 'PACIENTE') {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                }
                            }
                        }   
                    }
                    
                    if(search.city) {
                        for(let j = 0; j < user[i].location.length; j++) {
                            if(user[i].location[j].city === search.city) {
                                if(search.radio) {
                                    if(user[i].usertype === search.radio) {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                } else {
                                    if(user[i].usertype !== 'PACIENTE') {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                }
                            }
                        }
                    }

                    if(search.state) {
                        for(let j = 0; j < user[i].location.length; j++) {
                            if(user[i].location[j].state === search.state) {
                                if(search.radio) {
                                    if(user[i].usertype === search.radio) {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                } else {
                                    if(user[i].usertype !== 'PACIENTE') {
                                        user[i].password = undefined
                                        result.push(user[i])
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }).catch(_ => res.status(500).render('500'))

        let banner = []
        await Financial.find().then(financial => {
            if(financial.length) {
                for(let i = 0; i < financial[0].productReport.length; i++) {
                    if(financial[0].productReport[i].banner && financial[0].productReport[i].status === 'concluído') {
                        banner.push({
                            userId: financial[0].productReport[i]._idUser,
                            banner: financial[0].productReport[i].banner
                        })
                    }
                }
            }
        }).catch(_ => res.status(500).render('500'))

        if(!banner.length) banner = null
        else banner = uniqueRandomArray(banner)()

        if(!result.length) {
            res.status(400).render('page-resultado', { 
                page: 'Pesquisa simples',
                message: null,
                user: req.session.user,
                result: null,
                seach: null,
                moment,
                location: search.city.toUpperCase(),
                banner
            })
        } else {
            const cleanResult = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))
            res.status(200).render('page-resultado', {
                page: 'Pesquisa simples',
                message: null,
                user: req.session.user,
                search,
                moment,
                result: cleanResult(result),
                banner
            })
        }
    }
    
    const viewAdvancedSearch = (req, res) => {
        res.status(200).render('page-pesquisa-avancada', {  
            page: 'Pesquisa avançada',
            message: null,
            user: req.session.user,
            result: null,
            location: null
        })
    }

    const advancedSearch = async (req, res) => {
        const search = { ...req.body }
        let result = []

        if(search.name) {
            await User.find({ $text: { $search: search.name }}, {  score: { $meta: 'textScore' }})
            .sort({ score: { $meta: 'textScore' }}).then(user => {
                if(user.length)
                    for(let i = 0; i < user.length; i++)
                        if(user.usertype !== 'PACIENTE') {
                            user[i].password = undefined
                            result.push(user[i])
                        }
            }).catch(_ => res.status(500).render('500'))

            if(!result.length) {
                await User.findOne({ name: search.name }).then(user => {
                    if(user && user.usertype !== 'PACIENTE') {
                        user.password = undefined
                        result.push(user)
                    }
                }).catch(_ => res.status(500).render('500'))
            }
        }

        if(search.city) {
            await User.find().then(user => {
                for(let i = 0; i < user.length; i++) {
                    for(let j = 0; j < user[i].location.length; j++) {
                        if(user[i].location[j].city === search.city) {
                            if(search.usertype) {
                                if(user[i].usertype === search.usertype) {
                                    user[i].password = undefined
                                    result.push(user[i])
                                }
                            } else {
                                if(user[i].usertype !== 'PACIENTE') {
                                    user[i].password = undefined
                                    result.push(user[i])
                                }
                            }
                        }
                    }
                }
            }).catch(_ => res.status(500).render('500'))
        }

        if(search.state) {
            await User.find().then(user => {
                for(let i = 0; i < user.length; i++) {
                    for(let j = 0; j < user[i].location.length; j++) {
                        if(user[i].location[j].state === search.state) {
                            if(search.usertype) {
                                if(user[i].usertype === search.usertype) {
                                    user[i].password = undefined
                                    result.push(user[i])
                                }
                            } else {
                                if(user[i].usertype !== 'PACIENTE') {
                                    user[i].password = undefined
                                    result.push(user[i])
                                }
                            }
                        }
                    }
                }
            }).catch(_ => res.status(500).render('500'))
        }

        if(search.speciality) {
            await User.find({ speciality: search.speciality }).then(user => {
                if(user.length)
                    for(let i = 0; i < user.length; i++)
                        if(user.usertype !== 'PACIENTE') {
                            user[i].password = undefined
                            result.push(user[i])
                        }
            }).catch(_ => res.status(500).render('500'))
        }

        if(!result.length) {
            res.status(400).render('page-resultado', { 
                page: 'Pesquisa avançada',
                message: null,
                user: req.session.user,
                result: null,
                search: null,
                moment,
                location: search.city.toUpperCase()
            })
        } else {
            const cleanResult = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s))
            res.status(200).render('page-resultado', {
                page: 'Pesquisa avançada',
                message: null,
                user: req.session.user,
                search,
                moment,
                result: cleanResult(result),
            })
        }
    }

    return {
        viewResult,
        simpleSearch,
        viewAdvancedSearch,
        advancedSearch
    }
}