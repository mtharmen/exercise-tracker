var router = require('express').Router()

var Log = require('../model/log.js')
var User = require('../model/user.js')

function makeError(message, name, code) {
  var error = new Error(message)
  error.name = name
  error.httpStatusCode = code
  return error
}

router.post('/exercise/new-user', (req, res, next) => {
  var username = req.body.username
  User.findOne({ username })
    .then(user => {
      if (user) {
        let error = makeError('Username already taken', 'duplicate', 409)
        throw error
      } else {
        let newUser = User({ username })
        return newUser.save()
      }
    })
    .then(user => {
      res.json({ username: user.username, _id: user._id })
    })
    .catch(err => {
      next(err)
    })
})

router.get('/exercise/users', (req, res, next) => {
  User.find().select('_id username').exec((err, users) => {
    if (err) { next(err) }
    res.json(users)
  })
})

function validate(date) {
  return date.toString() !== 'Invalid Date' ? date : false
}

router.post('/exercise/add', (req, res, next) => {
  var userId = req.body.userId
  var duration = validate(new Date(req.body.duration * 60 * 1000), next)
  if (!duration) {
    let error = makeError('Malformed Date', 'integers only', 400)
    return next(error)
  }
  var date = req.body.date ? new Date(req.body.date) : new Date()
  date = validate(date, next)
  if (!date) {
    let error = makeError('Malformed Date', 'invalid date', 400)
    return next(error)
  }
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000)
   
  var newLog = new Log({
    userId: req.body.userId,
    description: req.body.description,
    duration: duration,
    date: date
  })

  User.findById(userId)
    .then(user => {
      if (!user) {
        let error = makeError('userId not found', 'no userId', 404)
        throw error
      } else {
        newLog.username = user.username
        return newLog.save()
      }
    })
    .then(saved => {
      res.json({
        userId: saved.userId,
        username: saved.username,
        description: saved.description,
        duration: saved.duration.getMinutes(),
        date: saved.date.toDateString()
      })
    })
    .catch(err => {
      next(err)
    })
})

router.get('/exercise/log', (req, res, next) => {
  var userId = req.query.userId
  if (!userId) {
    let error = makeError('userId required', 'need userId', 400)
    return next(error)
  }
  
  var query = { userId }
  var limit = parseInt(req.query.limit) || 0

  // Default to unix time 0 and current time for from and to respectively
  var from = req.query.from || 0
  var to = req.query.to || new Date().getTime()
  
  // Checking if from and to are valid
  from = validate(new Date(from), next)
  to = validate(new Date(to), next)

  if (!from || !to) {
    let error = makeError('Malformed Date', 'invalid date', 400)
    return next(error)
  }

  query.date = { '$gte': from, '$lt': to }

  Log.find(query).select('description duration date').limit(limit)
    .then(logs => {
      req.logs = logs
      return User.findById(userId)
    })
    .then(user => {
      if (!user) {
        let error = makeError('No User Found', 'no user', 404)
        throw error
      }
      let logs = req.logs.map(log => {
        return {
          description: log.description,
          duration: log.duration.getMinutes(),
          date: log.date.toDateString()
        }
      })
      res.json({
        userId: user._id,
        username: user.username,
        count: logs.length,
        logs: logs
      })
    })
    .catch(err => {
      next(err)
    })
})

module.exports = router