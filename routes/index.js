var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	var path = require('path');
  	res.sendFile(path.resolve('public/html/index.html'));
})

module.exports = router;