$(document).ready(() => {

  $(".dismiss").click(function(event){
    console.log("clicked");
    event.stopPropagation();
  });

});
