$(document).ready(function() {
	$('#save-edits').click(function(event) {
		event.preventDefault();
		$('#text-edits-form').submit();
	});

	// $('#cancel-edits').click(function(event) {
	// 	window.location.href = "http://stackoverflow.com";
	// })
});
