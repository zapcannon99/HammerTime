$(document).ready(function() {
	$("#username").keyup(function( event ) {
		$ajax.({
			url: '/api/users/checkUsernameAvailability'
			method: 'POST',
			data: {username: $("#username").val()},
			dataType: 'json',
		}).done(function(data){
			if(data.available == 0){
				$('form').append(document.createTextNode("Username is already taken."));
			} 
		});
	});

	$
});