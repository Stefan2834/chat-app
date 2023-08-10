var express = require('express');
var router = express.Router();
const { Messages } = require('./Schema.js')



router.post('/', async function (req, res, next) {
  const { currentLength } = req.body
  try {
    const total = 10;
    const messages = await Messages.find({})
    .sort({ createdAt: -1, _id: -1 })
    .skip(currentLength)
    .limit(total);
    const messagesTotal = await Messages.find({}).countDocuments()
    res.json({ success: true, messages: messages, hasMoreMessages: messagesTotal > currentLength + total ? true : false })
  } catch (err) {
    console.log(err)
    res.json({ success: false, message: err })
  }
});

module.exports = router;
