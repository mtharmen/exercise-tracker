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
  console.log(req.query)
  console.log(req.body)
  var username = req.body.username
  User.find({ username })
    .then(user => {
      if (!user) {
        let error = makeError('Username already taken', 'duplicate', 409)
        throw error
      } else {
        res.json(user)
      }
    })
    .catch(err => {
      next(err)
    })
})

router.get('/exercise/users', (req, res, next) => {
  User.find((err, users) => {
    if (err) { next(err) }
    res.json(users)
  })
})

function validate(date, next) {
  if (date.toString() === 'Invalid Date') {
    let error = makeError('Malformed Date', 'invalid date', 400)
    next(error)
  }
  return date
}

router.post('/exercise/add', (req, res, next) => {
  var duration = validate(new Date(req.body.duration * 60 * 1000), next)
  var date = req.body.date || new Date()
  date = validate(date, next)
   
  var newLog = new Log({
    userId: req.body.userId,
    description: req.body.description,
    duration: duration,
    date: date
  })

  Log.findById(userId)
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
      log.date = log.date.toDateString()
      log.duration = log.duration.getMinutes()
      res.json(log)
    })
    .catch(err => {
      next(err)
    })
})

router.get('/exercise/log', (req, res, next) => {
  if (!req.body.userId) {
    let error = makeError('userId required', 'need userId', 400)
    next(error)
  }
  
  var query = { _id: req.body.userId }
  var from = req.body.from
  var to = req.body.to
  var limit = parseInt(req.body.limit) || 0

  // Checking if from and to are valid
  if (from || to) {
    if (from && to) {
      from = validate(new Date(from), next)
      to = validate(new Date(to), next)
      query.date = { '$gte': from, '$lt': to }
    } else {
      let error = makeError('Need both from and to fields', 'missing pair', 400)
      next(error)
    }
  }

  Log.find(query).limit(limit)
    .then(logs => {
      req.logs = logs
      return User.findById(req.body.userId)
    })
    .then(user => {
      if (!user) {
        let error = makeError('No User Found', 'no user', 404)
        throw error
      }
      logs.forEach(log => {
        log.duration = log.duration.getMinutes()
        log.date = log.date.toDateString()
      })
      res.json({
        userId: user._id,
        username: user.username,
        count: req.logs.length,
        logs: req.logs
      })
    })
    .catch(err => {
      next(err)
    })
})

module.exports = router