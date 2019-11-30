$(document).ready(() => {
	var listing = JSON.parse(document.getElementById('data').dataset.listing);
	var index = 0;

	addPicture = function(index)
	{
		var element = makePicture(index);
		$("#gallery").prepend(element);
	}

	makePicture = function(index)
	{
		return $($.parseHTML('<img id="picture" class="display-img" src="/images/db/' + listing.pictures[index] + '" />'));
	}

	$("#previous").on("click", function() {
		$("#picture").remove();
		index--;
		index += listing.pictures.length;
		index %= listing.pictures.length;
		addPicture(index);
	});

	$("#next").on("click", function(){
		$("#picture").remove();
		index++;
		index %= listing.pictures.length;
		addPicture(index);
	});

	// Should only be accessible when editing the page (on an edit.ejs page)

	$("#photo-delete").on("click", function(event) {
		var photo = listing.pictures[index];
		$.ajax({
			method: "POST",
			url: "/api/images/" + listing._id + "?_method=DELETE",
			data: {index: index, picture: photo},
			dataType: 'json'
		}).done((data) => {
			if(data.deleted){
				listing.pictures = data.pictures;
				$("#picture").remove();
				index = 0;
				addPicture(index);
			} else {
				// Some warning message possibly
			}
		});
	});

	$('#photo-form').submit(function(event) {
		console.log("HWELLLLOOOOOO");
		var formData = new FormData(this);
		$.ajax({
			method: "POST",
	        url: "/api/images/" + listing._id,
	        data: formData,
	        processData: false,
	        contentType: false,
	        dataType: 'json'
		}).done((data) => {
			if(data.added) {
				listing.pictures = data.pictures;
				$("#picture").remove();
				index = 0;
				addPicture(index);
			} else {
				// Some warning message possibly
			}
		});
	});

});
