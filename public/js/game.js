// $(document).rady(function() {
// 	document.getElementById('board').style.width = '600px';
// 	document.getElementById('board').style.height = '600px';
// 	// console.log("test");
// 	$("#board").load(document.URL + ' #board');
// 	// document.getElementById('board').style.display = 'None';
// 	// document.getElementById('board').style.display = 'Block';
// });
// $(document).ready(function() {
// 	$("#board").css("width", "600px");
// });
var resizeBoard = function() {
	$("#board").width(Math.min($("#board-wrapper").width() - 1, $("#board-wrapper").height() - 1));
}

window.onload = function() {
	resizeBoard();
};

var rtime;
var timeout = false;
var delta = 500;
$(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeEnd, delta);
    }
})


function resizeEnd() {
	resizeBoard();
	$("#board").load("#board");
};