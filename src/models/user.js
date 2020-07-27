const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({    
    name: {                                
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {                                // ES6 definition sintax
            if (!validator.isEmail(value)) {
                throw new Error ('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error ('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {                           // ES6 definition sintax
            if (value.includes('password')) {
                throw new Error ('Password is invalid')
            }
        }

    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})
    
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if(!user) {
        throw new Error ('Unable to login')  // throw new Error zaustavlja daljnje izvođenje funkcije
    }
    
    const isMatch = await bcrypt.compare(password, user.password)
   
    if (!isMatch) {
        throw new Error ('Unable to login')
    }

    return user
}

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar // jer sada imamo link na sliku

    return userObject
}


userSchema.methods.generateAuthToken = async function () {  // koristimo this pa ne može biti arrow function
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)  // generira token od id + 'kaj god'
    
    user.tokens = user.tokens.concat({ token })        // dodaje novi token na popis tokena
    await user.save()                                   // sprema u bazu
    
    return token
}


// Hash the plain text password before saveing (middleware)
userSchema.pre('save', async function (next) { //pre=prije save, postoji i post method, 1. ime eventa, 2. funkcion(standard, not arrow) to run
    const user = this
    
    if (user.isModified('password')) {                 // provjera da ne bi hashirali password koji je već hashiran
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()      // oabezno na kraju, da zna kada je gotovo i da može save-ati
})   


// Delete user tasks when user is removed
userSchema.pre('remove', async function(next) {
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


const User = mongoose.model('User', userSchema ) // šaljemo schemu kao arg, da je object onda ne bi radio middleware

module.exports = User