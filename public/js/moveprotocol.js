var socket = io.connect("/");

var room = 0;

function start_game(roomId) {
    room = roomId;
}

/*
 * Send a move to the webserver
 * from: square the piece is moving from, in chess notation
 * to: square the piece is moving to, in chess notation
 * promotion (optional): if a pawn is getting promoted, the algebraic notation
 *      for the new piece - one of QRNB
 */
function sendMove(from, to, promote) {
    var posRegex = /^[a-h][1-8]$/;
    if (!from.match(posRegex)) {
        throw "Invalid 'from' position: " + from;
    }
    if (!to.match(posRegex)) {
        throw "Invalid 'to' position: " + to;
    }
    if ((promote !== undefined) && (!promote.match(/^[QRNB]$/))) {
        throw "Invalid pawn promotion string: " + promote;
    }

    payload = {
        "from" : from,
        "to": to,
        "promote": promote
    };
    socket.emit('move', payload);
}

