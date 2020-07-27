const mongoose = require('mongoose')

mongoose.connect( process.env.MONGODB_URL, {     // task-manager-api je ime baze !!!
    useNewUrlParser: true,                                        
    useCreateIndex: true                                         
})