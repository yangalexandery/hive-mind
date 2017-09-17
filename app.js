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


var sleep = require('system-sleep');
var chess = require('chess');


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
client.FLUSHDB(function (err, success) {
  if (err) {
    console.log("Failed to clear Redis DB - this is probably a bad sign");
  } else {
    console.log("Cleared old Redis data");
  }
});
var redlock = new RedLock(
  [client],
  {
    retryCount: 10,
    retryDelay: 200
  }
);
var REDLOCK_RESOURCES = {
  CREATE_ROOM: "create-room-resource"
}


var phaseOneDelay = 45;
var phaseTwoDelay = 15;

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

/*********************
 * BEGIN SOCKET CODE *
 *********************/

var sid_to_sockets = {}; // session ID to array of all sockets
var sid_to_sub_sockets = {}; // session ID to subscription-sockets. This is one-to-one.
var socket_to_sid = {}; // sockets to session ID

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
    if (data.sessionID in sid_to_sockets) {
      return accept('Rejecting duplicate socket', false);
    }
    console.log('Session cookie: ' + data.sessionID);
    sessionStore.get(data.sessionID, function (err, session) {
      if (err || !session) {
        console.log('Error retrieving session');
        accept('Error retrieving session', false);
      } else {
        data.session = session;
        console.log("User authorization accepted.");
        accept(null, true);
      }
    });
  } else {
    console.log('No cookies');
    return accept('No cookie transmitted', false);
  }
});

var game = chess.create();
var sgc = chess.createSimple();
var move_record = {};
var red_to_move = true;

var isMoveValid = function (src, dest, validMoves) {
  'use strict';

  var i = 0,
    isFound = function (expr, sq) {
      return ((typeof expr === 'string' && sq.file + sq.rank === expr) ||
        (expr.rank && expr.file &&
          sq.file === expr.file && sq.rank === expr.rank));
    },
    squares = [];

  for (i = 0; i < validMoves.length; i++) {
    if (isFound(src, validMoves[i].src)) {
      squares = validMoves[i].squares;
    }
  }

  if (squares && squares.length > 0) {
    for (i = 0; i < squares.length; i++) {
      if (isFound(dest, squares[i])) {
        return true;
      }
    }
  }

  return false;
};
// var sgc = require('simpleGameClient');
// var gc = chess.simpleGameClient.create();

io.on('connection', function(socket){
  var ROOM_KEY = "current-loading-room";
  var sessionID;
  // access session data
  console.log('a user connected');

  if (socket.handshake.headers.cookie) {
    var cookie_data = cookie.parse(socket.handshake.headers.cookie);
    var sessionID = cookie_data['connect.sid'].substring(2).split('.')[0];
    console.log("Socket connection sessionID: " + sessionID);
    sessionStore.get(sessionID, function(err, session) {
      if (err || !session) {
        console.log('Error retrieving session');
        if (err) {
          console.log(err);
        } else {
          console.log('Session not found.');
        }
      } else {
        // main sockets in this block of logic
        socket_to_sid[socket.id] = sessionID;
        console.log("BLAAAH " + socket_to_sid[socket.id]);
        if (!sid_to_sockets[sessionID]) {
          sid_to_sockets[sessionID] = [];
        }
        sid_to_sockets[sessionID].push(socket);
        console.log('Socket registered: ' + socket.id);


        socket.on('move', function (moveData) {
          console.log('Move sent: ' + JSON.stringify(moveData));
        });


        socket.on('register subscribe-socket', function (data) {
          sid_data = socket_to_sid[socket.id];
          if (sid_data) {
            console.log('subscribe socket registered from: ' + sid_data);

            if (!sid_to_sub_sockets[sid_data]) {
              sid_to_sub_sockets[sid_data] = [];
            }
            sid_to_sub_sockets[sid_data].push(socket);
          } else {
            console.log("oh man oh geez this really shouldn't happen. tell alex: no socket.id found for subscribe-socket");
          }
        });


        socket.on('client-to-server move', function (data) {
          sid_data = socket_to_sid[socket.id];
          console.log(data.from + " " + data.to);
          var validMoves = sgc.getStatus().validMoves;

          var is_valid = isMoveValid(data.from, data.to, sgc.validMoves);
          if (is_valid) {
            console.log('move is valid');
            var move_hash = data.from + " " + data.to;
            if (!move_record[move_hash]) {
              move_record[move_hash] = 0;
            }
            move_record[move_hash]++;
            // TODO: record move here
          } else {
            console.log('move is not valid');
          }
          // tmp_move = game.move(data.source, data.dest, false);
          // receives coordinates of piece's source and destination.
        });


        socket.on('disconnect', function(data) {
          console.log('a user disconnected');

          var sid_data = socket_to_sid[socket.id];
          if (sid_data) {
            var s_index = sid_to_sub_sockets[sid_data] ? sid_to_sub_sockets[sid_data].indexOf(socket) : -1;
            if (s_index > -1) {
              sid_to_sub_sockets[sid_data].splice(s_index, 1);
              console.log('subscription socket removed');
            }

            s_index = sid_to_sockets[sid_data] ? sid_to_sockets[sid_data].indexOf(socket) : -1;
            if (s_index > -1) {
              sid_to_sockets[sid_data].splice(s_index, 1);
              console.log('general socket removed');
            }
            delete socket_to_sid[socket.id];
          } else {
            console.log("oh man oh geez this really shouldn't happen. tell alex: no socket.id found for disconnect.");
          }
        });
      }
    });
  } else {
    console.log('No cookie transmitted');
    return;
  }
  // add the sockets to global data structures

  // check if a room already exists
  joinOrCreateRoom(ROOM_KEY, sessionID);
});

function joinOrCreateRoom(roomKey, uid) {
  client.EXISTS(roomKey, function (err, result) {
    console.log("result: " + result);
    if (err) {
      console.log("Everything went to shit");
      console.log(err);
      return;
    }
    if (result) {
      console.log('Room has already been created - register self with this room');
      joinRoom(roomKey, uid);
    } else {
      LOCK_TIMEOUT = 5000;
      console.log('Room does not exist yet - attempt to acquire lock and create room');
      redlock.lock(REDLOCK_RESOURCES.CREATE_ROOM, LOCK_TIMEOUT).then(
        function (lock) {
          console.log("Acquired lock - creating new room");
          joinRoom(roomKey, uid);
          // TODO: fork the managing daemon
          startDaemon();
          return lock.unlock()
          .catch(function (err) {
            console.log("Died while unlocking - this is fine");
          });
        },
        function (err) {
          // hopefully someone else is creating the room
          console.log("Failed to acquire lock - retrying room connection in 5 seconds");
          setTimeout(function () {joinOrCreateRoom(roomKey, uid);}, LOCK_TIMEOUT);
        }
      );

    }
  });
}

function joinRoom(roomKey, uid) {
  client.SADD(roomKey, uid, function (err, result) {
    if (err) {
      console.log("Failed to join room");
    }
  });
}

var countdown_init_ts = Math.floor(Date.now());

function daemonPhaseOne() {
  // this is a child process
  game = chess.create();
  countdown_init_ts = Math.floor(Date.now());
  // sleep.sleep(phaseOneDelay);
  // tell all room subscribers to move to phase two
  daemonPhaseTwo();
}

function daemonPhaseTwo() {
  // sleep.sleep(phaseTwoDelay);
  // pull from redis
  // process redis data
  // update board state
  // reset redis poll data
  // publish to room subscribers
}

var ChildProcess = require('child_process');
var count = 0;

function startDaemon() {
  game = chess.create();
  countdown_init_ts = Math.floor(Date.now());
  var intern1 = ChildProcess.fork('./intern.js', ['phase-one']);
  intern1.on('message', (m) => {
    // intern1.send({a: 'd'});
    console.log(m);
    if (m['a'] === 'a') {
      console.log("Phase 1 message");
      // tell all room subscribers to move to phase two
      var intern2 = ChildProcess.fork('./intern.js', ['phase-two']);
      intern2.on('message', (m) => {
        if (m['a'] === 'b') {
          console.log("Phase 2 message");
          var move_string = ""
          var max_val = 0;
          for (key in move_record) {
            if (move_record[key] > max_val) {
              max_val = move_record[key];
              move_string = key;
            }
          }
          red_to_move = !red_to_move;
          move_record = {};

          if (move_string) {
            // publish the move
            console.log("Move made: " + move_string);
            var move_from = move_string.substring(0, move_string.indexOf(" "));
            var move_to = move_string.substring(move_string.indexOf(" ") + 1);
            for (sid in sid_to_sockets) {
              // console.log(sid_to_sockets[sid]);
              var tmp = sid_to_sockets[sid];
              // console.log(tmp[0]);
              for (var i = 0; i < tmp.length; i++) {
              // for (var sockey in tmp) {
                var sockey = tmp[i];
                console.log(sockey);
                console.log(sockey.id);
                if (typeof sockey.id != 'undefined') {
                  console.log(sockey.id);
                  sockey.emit('server-to-client move', {
                    from: move_from,
                    to: move_to,
                    promotion: 'q'
                  });
                } // this needs to be cleaned up later
              }
            }
          }
          // if (!move_string || (someone lost))

          // count++;
          // if (count >= 4) {
          //   intern2.send({a: 'c'});
          // }
        }
      });
    }
  });
}

console.log("past the thing");

module.exports = app;

// vim: sw=2 sts=2
