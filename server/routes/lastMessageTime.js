var express = require('express');
var router = express.Router();
const { Messages } = require('./Schema.js');

router.get('/', async function (req, res, next) {
  try {
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err });
  }
});

module.exports = router;