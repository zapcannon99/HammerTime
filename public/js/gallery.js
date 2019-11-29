$(document).ready(() => {
	var listing = JSON.parse(document.getElementById('data').dataset.listing);
	var index = 0;
	console.log(listing);

	addPicture = function(index)
	{
		var element = makePicture(index);
		$("#gallery").prepend(element);
	}

	makePicture = function(index)
	{
		console.log(index+" "+listing.pictures[index]);
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
});
