$(document).ready(() => {

	success = function(str, font)
	{
		toastr.success('<div style="font-size:'+font+'pt;">'+str+'</div>');
	}

	warning = function(str, font)
	{
		toastr.warning('<div style="font-size:'+font+'pt;">'+str+'</div>');
	}

	error = function(str, font)
	{
		toastr.error('<div style="font-size:'+font+'pt;">'+str+'</div>');
	}

	// $("#searchSubmit").on("click", function(){
	// 	warning("submit button clicked", 14);
	// });

});
