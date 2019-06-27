"use strict";

module.exports = middleware => {
    return (req, res, next) => {
        if(req.session.user.usertype === 'CLINICA') {
            middleware(req, res, next)
        } else {
            req.session.reset()
            req.logout()
            res.status(401).redirect('/')
        }
    }
}