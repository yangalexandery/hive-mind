var express = require('express');
var router = express.Router();
var redis = require('redis');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

router.get('/', function(req, res) {
  var path = require('path');
  res.sendFile(path.resolve('public/html/index.html'));
});

router.get('/game', function(req, res,next) {
  var teamName = req.query.color;
  if(teamName==undefined or teamName == "random"){
  	teamName == "red"
  }
  var data = {
  	'teamName': teamName,
  }
  res.render('game', data);
  // req.params.gameid
});

module.exports = router;
