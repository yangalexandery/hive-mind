function toGame(color){
	$.ajax({
    url: '/game',
    method: 'GET',
    // data: dataField,
    success: function (data) {
      window.location.reload(true);
    }
  });
	if(color=="red"){

	}else if (color=="blue"){

	}else{

	}
}