const express = require ('express')
require ('./db/mongoose')    //  ne želimo ništa dohvatiti nego samo pokrenuti mangoose koji će se spojiti na bazu
const userRouters = require ('./routers/user.js')
const taskRouters = require ('./routers/task.js')

const app = express()
const port = process.env.PORT


// configure express da automatski parsira primljeni JSON u object kojem pristupamo u req handlers (req.body)
app.use(express.json())
app.use(userRouters)
app.use(taskRouters)


app.listen(port, () => {
    console.log("Server is up on port " + port)
})