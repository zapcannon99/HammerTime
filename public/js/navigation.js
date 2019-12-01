$(document).ready(() => {

	var page = document.getElementById('data').dataset.page;
	var listings = JSON.parse(document.getElementById('data').dataset.listings);
	var NUM_PER_PAGE = 3;//WE CAN CHANGE THIS TO WHATEVER WE WANT
	var filtered = JSON.parse(JSON.stringify(listings));

	filter = function(){
		var category = $("#category").val();
		var searchTerm = $("#search").val();
		filtered = [];
		for(var i = 0;i<listings.length;i++)
		{
			var now = Date.now();
			var expire = Date.parse(listings[i].endTime);
			if(now < expire && listings[i].deleted == false)
			{
				if(match(listings[i].title, searchTerm))
				{
					if(category == "" || category == listings[i].category)
						filtered.push(listings[i]);
				}
			}
		}
		num_pages = Math.ceil(filtered.length / NUM_PER_PAGE);
	}

	match = function(str1, str2)
	{
		if(str2 == "")
			return true;
		var ptr = 0;
		for(var i = 0;i<str1.length;i++)
		{
			if(str1.charAt(i) == str2.charAt(ptr))
			{
				ptr++;
				if(ptr == str2.length)
					return true;
			}
		}
		return false;
	}

	removeChildren = function(){
		$("#card-container").empty();
	}

	updateDisabled = function(){
		if(page == 1)
		{
			$("#previous").attr("disabled", true);
		}else{
			$("#previous").attr("disabled", false);
		}
		if(page >= num_pages)
		{
			$("#next").attr("disabled", true);
		}else{
			$("#next").attr("disabled", false);
		}
	}

	addElements = function()
	{
		for(var i = 0;i<NUM_PER_PAGE;i++)
		{
			var index = ((page-1) * NUM_PER_PAGE) + i;
			if(index < filtered.length)
			{
				var element = makeElement(filtered[index]);
				$("#card-container").append(element);
			}
		}
	}

	makeElement = function(listing)
	{
		var elem = "";
		elem += '<div class="card grow">\n';
		elem += '<a href="/listings/'+listing._id+'"><span class="invisible-link"></span></a>\n';
		elem += '<img class = "card-image" src="./images/db/'+listing.pictures[0]+'">\n';
		elem += '<div class="block-ellipsis">'+listing.title+'</div>\n';
		elem += '<div class="price"><strong>$'+listing.currentBid+'</strong></div>\n';
		elem += '</div>\n';
		return $($.parseHTML(elem));
	}

	filter();
	addElements();
	updateDisabled();

	$("#searchSubmit").on("click", function(){
		removeChildren();
		page = 1;
		filter();
		num_pages = Math.ceil(filtered.length / NUM_PER_PAGE);
		updateDisabled();
		addElements();
	})

	$("#previous").on("click", function() {
		removeChildren();
		page--;
		updateDisabled();
		addElements();
	});


	$("#next").on("click", function(){
		removeChildren();
		page++;
		updateDisabled();
		addElements();
	});

});
