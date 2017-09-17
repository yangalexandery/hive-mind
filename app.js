var express = require('express');
var path = require('path');

var app = express();

var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var connect = require('connect');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');

var MemoryStore = session.MemoryStore;
var sessionStore = new MemoryStore();


var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var redis = require('redis');

var client = redis.createClient(6379,'hive-mind.redis.cache.windows.net', {auth_pass: config['redis-key'], tls: {servername: 'hive-mind.redis.cache.windows.net'}});

app.use(cookieParser());
app.use(session({ store: sessionStore, secret: 'JAAAAASH' }));

server.listen(normalizePort(process.env.PORT || '3000'));

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use(express.static(path.join(__dirname, 'public')));

var index = require('./routes/index');
app.use('/', index);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.set('authorization', function(data, accept) {
  if (data.headers.cookie) {
    data.cookie = cookie.parse(data.headers.cookie);
    data.sessionID = data.cookie['express.sid'];
    sessionStore.get(data.sessionID, function (err, session) {
      if (err || !session) {
        accept('Error retrieving session', false);
      } else {
        data.session = session;
        accept(null, true);
      }
    });
  } else {
    return accept('No cookie transmitted', false);
  }
});

io.on('connection', function(socket){
  // access session data
  console.log('a user connected');
  socket.on('disconnect', function () {
    console.log('a user disconnected');
  });
  socket.on('move', function (moveData) {
    console.log('Move sent: ' + JSON.stringify(moveData));
  });
});

module.exports = app;

// vim: sw=2 sts=2
