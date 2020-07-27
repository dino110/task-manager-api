const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dino.kotaranin@gmail.com',
        subject: 'Thanks for joinin in!',
        text: `Welcome to the app, ${name}! Let me know how you get a long with the app.`// ${name} može samo kada imamo `backtiks`, a ne ' ili "" 
    })
}

const sendGoodByEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'dino.kotaranin@gmail.com',
        subject: 'Is is time to say good by',
        text: `Hi ${name}! Let me know why are you canceled your account?` 
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByEmail
}
