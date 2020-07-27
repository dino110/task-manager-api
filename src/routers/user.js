const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const multer = require('multer')
const sharp= require('sharp')
const { sendWelcomeEmail, sendGoodByEmail } = require ('../emails/account')
const auth = require ('../middleware/auth')

// sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body)          // novu " User šprancu" puni sa podatcima iz req.body i sprema u const user

    try {
        await user.save()                       // sprema usera u bazu
        sendWelcomeEmail(user.email, user.name)   // nema potrebe za await iako je asynkrono
        const token = await user.generateAuthToken()     // generira token i opet sprema user-a u bazu (unutar generate funkcije)
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password) // nova funkcija, definirana u models/user.js
        const token = await user.generateAuthToken()
        res.send({user, token})                        //  u pozadini radi strinigfy
    } catch (e) {
        res.status(400).send()
    }
})

// logout
router.post('/users/logout', auth, async (req, res) => {   // moraš bit auth da bi mogao logout
    try {
        req.user.tokens = req.user.tokens.filter((token) => { // gledamo svaki token iz tokens, ako je raličit od req.token onda ga ostavljamo
            return token.token !== req.token                 // tj. mičemo taj === token iz tokens array-a
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// logout All
router.post('/users/logoutAll', auth, async (req, res) => {   // moraš bit auth da bi mogao logout
    try {
        req.user.tokens = [] 
        await req.user.save()
        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

// GET my profile
router.get('/users/me', auth, async (req, res) => {   // send će se odigrati samo ako middleware (auth) pozove next()
    res.send(req.user)     // u pozadini radi stringify
})

// user UPDATE
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })  // moze i shorthand syntax:  updates.forEach((update) => user[update] = req.body[update]
        
        await req.user.save()
        res.send(req.user)
        
    } catch (e) {
        res.status(400).send(e)
    }
})

// DELETE user (me)
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()   // mongoose method kao i .save() ; briše iz baze tog usera
        sendGoodByEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// UPLOAD doc
const uploadDoc = multer({
    dest: 'images',
    limits: {
    fileSize: 1000000                      // 1000000 bytes = 1 MB
    },
    fileFilter(req, file, cb) {                    // file -> info o UL fileu, cb -> callback, služi da kažemo kada je filteriranje gotovo
      if (!file.originalname.match(/\.(doc|docx)$/)) {   // $ znaci da je mora zavrstiti sa doc ili docx, da nema nista poslje
        return cb(new Error('Please upload a Word document'))
      }   
     cb(undefined, true)    // undifened -> no error, true je da ocekuje upload
    }
})

router.post('/upload', uploadDoc.single('images'), (req, res) => {
    res.send()
}, (error, req, res, next) => {            
    res.status(400).send({error: error.message})
})


const upload = multer({
    // dest: 'avatars',       // inace bi se kreirao folder i tu bi se spremili dokumenti sa upload.single('dokumenti')
    limits: {
        fileSize: 1000000                      
        },
        fileFilter(req, file, cb) {                   
          if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {   
            return cb(new Error('Please upload a jpg, jpeg or png document'))
          }   
         cb(undefined, true)    // undifened -> no error, true je da ocekuje upload
        }
})

// UPLOAD profile pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    //req.user.avatar = req.file.buffer       // slika se nalazi u req.file.buffer samo kada nemamo dest definirano

    await req.user.save()
    res.send()
}, (error, req, res, next) => {             // This call signature lets Express know the function is designed to handle errors
    res.status(400).send({error: error.message}) // The function itself sends back a JSON response with the error message from multer
})

// DELETE profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined  
    await req.user.save()
    res.send()
})

// GET profile pic
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')  // response HEADER, key/value pair
        res.send(user.avatar)                // pošalji image
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router