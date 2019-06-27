"use strict";

module.exports = middleware => {
    return (req, res, next) => {
        if(req.session.user.admin) {
            middleware(req, res, next)
        } else {
            req.session.reset()
            req.logout()
            res.status(403).render('page-login', { message: JSON.stringify('Algo deu errado') })
        }
    }
}