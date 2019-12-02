$(document).ready(function() {

	var elem = $("#data")[0];
	var listing = JSON.parse(elem.dataset.listing);

	$("#pay").click(async function(){
		console.log("show clicked");
		$(this).attr("value","Paid!");
		$(this).attr("disabled", "true");

		await $.ajax({
			url: '/listings/'+listing._id+'/checkout',
			method: "POST",
			data: {
				"dismissed" : 1
			},
			dataType: 'json'
		}).done(function(data) {
			console.log(data);
		});

		await $.ajax({
			url: '/api/users/notifications',
			method: "POST",
			data: {
				account: listing.owner,
				message: "Your item ("+listing.title+") has been paid!",
				dismissed : 0,
				redirect: "/listings/"+listing._id
			},
			dataType: 'json'
		}).done(function(data) {
			console.log(data);
		});

		var font = 14;
		var str = "Payment Successful!";
		toastr.success('<div style="font-size:'+font+'pt;">'+str+'</div>');
	})

	if($('#bidding-form').length > 0) {
		$('#bidding-form').submit((event) => {
			// check if the submitted bid is higher before calling the api

			var currentBid = parseFloat($('#current-bid').text());
			var newBid = parseFloat($('#new-bid').val());

			if(newBid > currentBid) {
				$.ajax({
					url: '/api/bids/submitBid',
					method: "POST",
					data: {bid: $('#new-bid').val(), listID: listID},
					dataType: 'json'
				}).done(function(data) {
					if(data.success){
						$('#current-bid').text(newBid);
						if($('#warning').length){
							$('#warning').remove();
						}
						if($('#success').length) {
							$('#success').text("Sucessful HammerTime!");
						} else {
							$("form").prepend("<p id='success' class='success'>Successful HammerTime!</p>");
						}
					} else {
						if($('#success').length){
							$('#success').remove();
						}
						$('#current-bid').text(data.currentBid);
						if($('#warning').length) {
							$('#warning').text("Sorry! Somebody just bid higher than you!");
						} else {
							$("form").prepend("<p id='warning' class='warning'>Sorry! Somebody just bid higher than you!</p>");
						}
					}
				});
			} else {
				if($('#success').length){
					$('#success').remove();
				}
				if($('#warning').length) {
					$('#warning').text("Sorry! You need to bid higher than the current bid!");
				} else {
					$("form").prepend("<p id='warning' class='warning'>Sorry! You need to bid higher than the current bid!</p>");
				}
			}
		});
	}
});
