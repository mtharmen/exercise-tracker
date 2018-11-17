var mongoose = require('mongoose')

var logSchema = mongoose.Schema({
  userId: String,
  username: String,
  description: String,
  duration: Date,
  date: Date
})

module.exports = mongoose.model('Log', logSchema)
