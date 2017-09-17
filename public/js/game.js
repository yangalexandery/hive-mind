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
    // $("#board").find('[class^="board-"]').css('width: 100%; height 100%;');
    TheChessBoard.resize();
    console.log(window.onresize.name);

}

window.onload = function() {
	resizeBoard();
};

function switchTab(id){
	$("#"+id).show().siblings('div').hide();
};

window.onresize = function dothething() {
    var timeout = false;
    var delta = 500;
    console.log('resize triggered');
    if (timeout === false) {
        timeout = true;
        setTimeout(resizeBoard, delta);
    }
};

$(document).ready(
	function timer() {
    var countDownDate = new Date().getTime() + 30000;

    // Update the count down every 1 second
    var x = setInterval(function() {

      // Get todays date and time
      var now = new Date().getTime();

      // Find the distance between now an the count down date
      var distance = countDownDate - now;

      // Time calculations for days, hours, minutes and seconds
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Display the result in the element with id="demo"
      document.getElementById("timer").innerHTML = seconds +1 + "s ";

      // If the count down is finished, write some text
      if (distance < 0) {
        clearInterval(x);
        timer();
      }
    }, 1000);
})

function resizeEnd() {
	resizeBoard();
	// $("#board").load("#board");
};
