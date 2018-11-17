require('dotenv').config()
var path = require('path')
var express = require('express')
var mongoose = require('mongoose')
var app = express()

// Connecting to database
mongoose.Promise = global.Promise

var mongodbUrl = process.env.MONGODB_URI

mongoose.connect(mongodbUrl, { useNewUrlParser: true })
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
  console.log('Connected to mthar-exercise-tracker database')
})

app.use('/', express.static(path.join(__dirname, '/views')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', require('./server/routes/api'))

app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json(err)
})

var port = process.env.PORT || 8080
app.listen(port, () => {
  console.log('Listening on port ' + port)
})

// Closes database when node server.js stops
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Closing connection to mthar-exercise-tracker database')
    process.exit(0)
  })
})
