$(document).ready(() => {
	var listing = JSON.parse(document.getElementById('data').dataset.listing);

	adjustCountdown = function(listing){
		var distance = Date.parse(listing.endTime) - Date.now();
		// Time calculations for days, hours, minutes and seconds
		var days = Math.floor(distance / (1000 * 60 * 60 * 24));
		var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		var seconds = Math.floor((distance % (1000 * 60)) / 1000);

		var elem = document.getElementById("countdown");
		if(elem != null) {
			if(days > 0)
			{
				elem.innerHTML = days+" Days, "+hours+" Hours";
			}else if(distance >= 0){
				elem.innerHTML = (hours+"").padStart(2, '0')+":"+(minutes+"").padStart(2, '0')+":"+(seconds+"").padStart(2, '0');
			}else{
				elem.innerHTML = "SOLD";
				$("#countdown").removeClass("yellow");
				$("#countdown").addClass("red");
				$("#bid").remove();
				$("#pic").remove();
				$("#money").remove();
				$("#countdown").toggleClass("hspace");
				$("#border").css("border", "2px solid red");
				return true;
			}
		}


		if(days < 1 && hours < 1)
		{
			$("#countdown").removeClass("red");
			$("#countdown").addClass("yellow");
		}

		if(days < 1 && hours < 1 &&minutes <= 2)
		{
			$("#countdown").removeClass("yellow");
			$("#countdown").addClass("red");
		}

		return false;
	}

	var sold = adjustCountdown(listing);

	if(sold)
	{

	}else{
		var x = setInterval(function() {
			var adj = adjustCountdown(listing);
			if(adj){
				clearInterval(x);
			}
		}, 1000);
	}
});
