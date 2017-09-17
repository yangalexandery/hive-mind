function toGame(color){
	console.log(color)
	var data = {}
	data.color= color
	$.ajax({
    url: '/game',
    method: 'GET',
    // data: dataField,
    data: data,
    success: function (data) {
      window.location.href = "/game"
    },
    error: function(xhr, status, error) {
      console.log(error);
    },
 		async: false
  });
}