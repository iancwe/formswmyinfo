const express = require('express')

const router = express.Router()

router.get('/watch', function (req, res) {
  res.send('Bye Ian')
})

module.exports = router
