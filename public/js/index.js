function toGame(color){
	console.log(color)
	if(color=="random"){
		color = "red"
	}
	// var data = {}
	// data.color= color
	$.ajax({
    url: '/game',
    method: 'get',
    data: {
    	color: color
    },
    success: function (data) {
    	window.location.href="/game?color="+color;
    },
    error: function(xhr, status, error) {
      console.log(error);
    },
 		async: false
  });
}