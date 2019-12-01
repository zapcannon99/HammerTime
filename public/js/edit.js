$(document).ready(function() {
	$('#save-edits').click(function(event) {
		event.preventDefault();
		$('#text-edits-form').submit();
	});

	$('#cover-button').click(function(event){
		$('#added-photos').click();
	})

	// $('#cancel-edits').click(function(event) {
	// 	window.location.href = "http://stackoverflow.com";
	// })
});
