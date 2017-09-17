var socket = io.connect("/");

var room = 0;

function start_game(roomId) {
    room = roomId;
}

var team = 'red';
function set_team(val) {
  console.log(team);
  if (!val) {
    return;
  }
  if (val.charAt(0) === 'r') {
    team = 'red';
  }
  if (val.charAt(0) === 'b') {
    team = 'blue';
  }
}

/*
 * Send a move to the webserver
 * from: square the piece is moving from, in chess notation
 * to: square the piece is moving to, in chess notation
 * promotion (optional): if a pawn is getting promoted, the algebraic notation
 *      for the new piece - one of QRNB
 */

// function sendMove(from, to, promote) {
//     var posRegex = /^[a-h][1-8]$/;
//     if (!from.match(posRegex)) {
//         throw "Invalid 'from' position: " + from;
//     }
//     if (!to.match(posRegex)) {
//         throw "Invalid 'to' position: " + to;
//     }
//     if ((promote !== undefined) && (!promote.match(/^[QRNB]$/))) {
//         throw "Invalid pawn promotion string: " + promote;
//     }

//     payload = {
//         "from" : from,
//         "to": to,
//         "promote": promote
//     };
//     socket.emit('move', payload);
//     socket.emit('client-to-server move', payload);
// }
function getTeam() {
  return team;// TODO: fix this
}


$.getScript('chessboardjs-0.3.0/js/chessboard-0.3.0.js', function() {
  var board,
    game = new Chess();

  var removeGreySquares = function() {
    $('#board .square-55d63').css('background', '');
  };

  var greySquare = function(square) {
    var squareEl = $('#board .square-' + square);
    
    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
      background = '#696969';
    }

    squareEl.css('background', background);
  };

  var onDragStart = function(source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
    if ((game.turn() === 'w' && getTeam() === 'blue') || (game.turn() == 'b' && getTeam() === 'red')) {
      return false;
    }
  };

  var onDrop = function(source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    console.log(move);
    socket.emit('client-to-server move', move);

    // illegal move
    if (move === null) return 'snapback';
  };
  
  function makeUL(array){
    var list= document.getElementById("historyList")
    for(var i=array.length-1; i >=0; i--){
      var item =document.createElement('li');
      item.appendChild(document.createTextNode(array[i]));
      list.appendChild(item);
    }
  }
  // makeUL(['e4', 'e5', 'f4', 'exf4'])
    //
  var endGame = function (winner, message) {
    game.over = true;
    var winner_str = winner === 'b' ? 'Blue' : 'Red';
    alert(message + ' ' + winner_str + ' wins!');
    window.location.reload();
  };

  socket.on('server-to-client move', function(data) {
    console.log('received');
    if ((getTeam() === 'red' && game.turn() === 'b') || (getTeam() === 'blue' && game.turn() === 'w' && game.history().length > 0)) {
      console.log('undoing');
      game.undo();
    }
    console.log(data.from, data.to);
    board.move(data.from + "-" + data.to);
    // game.move({
    //   from: data.from,
    //   to: data.to,
    //   promotion: 'q'
    // });
    makeUL(game.history());
  });

  socket.on('checkmate', function(data) {
    var winner = game.turn() === 'r' ? 'b' : 'r';
    endGame(winner, "Checkmate!");
  });

  socket.on('resign', function(data) {
    var winner = game.turn()
    endGame(winner, "Resignation!");
  });

  var onMouseoverSquare = function(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
      square: square,
      verbose: true
    });

    // exit if there are no moves available for this square
    if (game.over) {
        return false;
    }
    if (moves.length === 0) return;
    if ((game.turn() === 'w' && getTeam() === 'blue') || (game.turn() == 'b' && getTeam() === 'red')) {
      return false;
    }

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i].to);
    }
  };

  var onMouseoutSquare = function(square, piece) {
    removeGreySquares();
  };

  var onSnapEnd = function() {
    board.position(game.fen());
  };

  var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd
  };
  board = ChessBoard('board', cfg);

  socket.on('server-to-client move', function(data) {
    console.log('received');
    if ((getTeam() === 'red' && game.turn() === 'b') || (getTeam() === 'blue' && game.turn() === 'w' && game.history().length > 0)) {
      console.log('undoing');
      game.undo();
    }
    console.log(data.from, data.to);
    board.move(data.from + "-" + data.to);
    // game.move({
    //   from: data.from,
    //   to: data.to,
    //   promotion: 'q'
    // });
    makeUL(game.history());
  });
  window['TheChessBoard'] = board;
});
