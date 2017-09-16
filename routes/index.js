var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	var path = require('path');
  	res.sendFile(path.resolve('public/html/index.html'));
})

router.get('/game', function(req, res) {
	res.send();
	// req.params.gameid
})

module.exports = router;