var express = require('express');
var router = express.Router();
const { Messages } = require('./Schema.js')



router.post('/', async function (req, res, next) {
  const { currentLength } = req.body
  try {
    console.log(currentLength)
    const total = 10;
    const messages = await Messages.find({})
    .sort({ createdAt: -1, _id: -1 })
    .skip(currentLength)
    .limit(total);
    res.json({ success: true, messages: messages })
  } catch (err) {
    console.log(err)
    res.json({ success: false, message: err })
  }
});

module.exports = router;
