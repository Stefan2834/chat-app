const mongoose = require('mongoose')

const messagesSchema = new mongoose.Schema({
  user: String,
  email: String,
  time: String,
  photo: String,
  message: String
});

const Messages = mongoose.model('messages', messagesSchema);


module.exports = {
  Messages
}