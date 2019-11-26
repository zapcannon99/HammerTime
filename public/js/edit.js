var removedPhotos = [];

$(document).ready(() => {
	$(".photo-remove").on("click", function() {
		console.log($(this).val());
		removedPhotos.push(this.value);
		console.log(removedPhotos);
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