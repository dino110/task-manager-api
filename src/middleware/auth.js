const User = require ('../models/user')   // provide user model to find user in the database
const jwt = require ('jsonwebtoken') // so we can validete token provided

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')  // da dobijemo samo token string
        const decoded = jwt.verify( token,  process.env.JWT_SECRET)    // provjera token OK? token se dobije sa user._id i 'kaj god' (models/user.js)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token}) // trazimo tog usera

        if (!user) {
            throw new Error
        }

        req.token = token  // u req.token je spremljen točno taj token kod točno tog requesta (može biti više)
        req.user = user  // route hanlderu dali pristup tom useru da ne treba opet dohvatit kad je već dohvaćen
        next()

    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.'}) // error handler
    }
}

module.exports = auth