const Task = require ('../models/task.js')
const express = require ('express')
const auth = require ('../middleware/auth')
const router = new express.Router()

// Create new task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({               // object
        ...req.body,                     // ES6 syntax: kopira sve iz body u ovaj novi object
        owner: req.user._id             // dodajemo novu varijablu
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=true                           // u querry je true/false zapravo string
// GET tasks?limit=10&skip=20                        // get the third page
// GET tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {           // returns array of data
    const match = {}                         // ako ne bude providean completed querry, onda treba dohvatiti SVE pa s ovim to omogućujemo
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'    // ako je isto, vraća true (ali boolean a ne string)
    }
   
    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,                               // zbog ovog mora biti boolean, tj match.completed = true / false
            options: {
                limit: parseInt(req.query.limit),   // string to integer
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)   // !!!
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        
        await task.save()        
        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if (!task) {
            res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router