function checkUsername(event) {
	if($('#username').val() != '') {
		if($('#warning').length) {
			$('#warning').remove();
		}
		$.ajax({
			url: '/api/users/checkUsernameAvailability',
			method: 'POST',
			data: {username: $("#username").val()},
			dataType: 'json',
		}).done(function(data){
			console.log("data?");
			console.log(data);
			if(data.available == 0){
				if($('#warning').length) {
					$('#warning').text("Username already taken!");
					return true;
				} else {
					$("form").prepend("<p id='warning'>Username already taken!</p>");
				}
			}
		});
	} else {
		if($('#warning').length) {
			$('#warning').text("Username empty!");
		} else {
			$("form").prepend("<p id='warning'>Username empty!</p>");
		}
	}
}

function checkPassword(event) {
	var valid = true;
	var password = $('#password').val();
		if(password.length < 8 ||
			!/[a-z]/.test(password) ||
			!/[A-Z]/.test(password) ||
			!/[0-9]/.test(password)
			){
			if($('#warning').length) {
				$('#warning').text("Not a strong password");
			} else {
				$("form").prepend("<p id='warning'>Not a strong password</p>");
			}
			valid = false;
		}
	if(valid && $('#warning').length) {
		$('#warning').remove();
	}
	return valid;
}

$(document).ready(function() {
	$("#username").focusout(checkUsername);

	$("#password").focusout(checkPassword);

	$("form").submit(function(event) {
		var valid = true;

		if(!checkUsername) {
			valid = false;
		}

		if(!checkPassword) {
			valid = false;
		}

		if(valid) {
			return;
		}
		event.preventDefault();
	});
});
