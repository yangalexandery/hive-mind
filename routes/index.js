var app = require('express')();
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.get('/', function(req, res) {
	var path = require('path');
  	res.sendFile(path.resolve('public/html/index.html'));
});

app.get('/game', function(req, res) {
	res.send();
	// req.params.gameid
});

io.on('connection', function(socket) {
    console.log('Connection received');
});

http.listen(3000, function() {
    console.log('*** Listening on 3000 ***');
});
