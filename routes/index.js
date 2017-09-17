var express = require('express');
var router = express.Router();
var redis = require('redis'),
  client = redis.createClient();
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

router.get('/', function(req, res) {
  var path = require('path');
  res.sendFile(path.resolve('public/html/index.html'));
});

router.get('/game', function(req, res,next) {
  res.render('game', {});
  // req.params.gameid
});

module.exports = router;
