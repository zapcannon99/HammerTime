var removedPhotos = [];

$(document).ready(() => {
	$(".photo-remove").on("click", function() {
		removedPhotos.push(this.value);
	});


	$("#submit").on("click", function(){
		var id = $("#submit").val();
		$.ajax({
			method: "PUT",
			url: "/listings/" + id,
			data: {test: "this is testing"}
		}).done(function(){

		});
	});
});
