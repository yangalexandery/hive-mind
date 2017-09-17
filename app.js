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


var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var MemoryStore = require('memorystore')(session);
var sessionStore = new MemoryStore({checkPeriod: 3600000});

app.use(session({
  store: sessionStore,
  secret: config['session-secret'],
  key: 'connect.sid',
  saveUninitialized: true,
  resave: false
}));

var redis = require('redis');
var RedLock = require('redlock');
// var redisStore = require('connect-redis')(session);

var client = redis.createClient(config['redis-port'], config['redis-uri'], {auth_pass: config['redis-key'], tls: config['redis-tls']});
/* var redlock = new RedLock(
  [client],
  {
    retryCount: 10,
    retryDelay: 200
  }
);
var REDLOCK_RESOURCES = {
  CREATE_ROOM: "create-room-resource"
}
*/

app.use(cookieParser());

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
    data.sessionID = data.cookie['connect.sid'].substring(2).split('.')[0];
    console.log('Session cookie: ' + data.sessionID);
    sessionStore.get(data.sessionID, function (err, session) {
      if (err || !session) {
        console.log('Error retrieving session');
        accept('Error retrieving session', false);
      } else {
        data.session = session;
        accept(null, true);
      }
    });
  } else {
    console.log('No cookies');
    return accept('No cookie transmitted', false);
  }
});

io.on('connection', function(socket){
  var ROOM_KEY = "current-loading-room";
  // access session data
  console.log('a user connected');
  // check if a room already exists
  client.EXISTS(ROOM_KEY, function (err, result) {
    console.log("result: " + result);
    if (err) {
      console.log("Everything went to shit");
      console.log(err);
      return;
    }
    if (result) {
      console.log('Room has already been created - register self with this room');
    } else {
      console.log('Room does not exist yet - attempt to acquire lock and create room');
    }
  });
  console.log('Please end my life');
  socket.on('disconnect', function () {
    console.log('a user disconnected');
  });
  socket.on('move', function (moveData) {
    console.log('Move sent: ' + JSON.stringify(moveData));
  });
});

module.exports = app;

// vim: sw=2 sts=2
