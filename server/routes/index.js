var express = require('express');
var router = express.Router();
const { Messages } = require('./Schema.js')



router.post('/', async function (req, res, next) {
  const { page } = req.body
  try {
    const limit = 10  
    const offset = (page - 1) * limit;
    const messages = await Messages.find({})
    .sort({ createdAt: -1, _id: -1 })
    .skip(offset)
    .limit(limit);
    res.json({ success: true, messages: messages.reverse() })
  } catch (err) {
    console.log(err)
    res.json({ success: false, message: err })
  }
});

module.exports = router;
