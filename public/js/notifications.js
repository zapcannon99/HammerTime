$(document).ready(() => {
  dismiss = async function(event){
    var notification = ($(this).find(".dismiss")[0].dataset.notification);
    event.stopPropagation();
    await $.ajax({
      url: '/api/users/notifications/'+notification,
      method: "POST",
      data: {
        "dismissed" : 1
      },
      dataType: 'json'
    }).done(function(data) {
      console.log(data);
    });
  }

  $(".dismiss").on("click",dismiss);

  getNotifications = async function()
  {
    var element = document.getElementById('data');
    if(!element.dataset.user)
      return [];
    var user = JSON.parse(element.dataset.user);
    return $.ajax({
      url: '/api/users/notifications/'+user._id,
      method: "get",
      dataType: 'json'
    }).done(function(data) {
      if(data.success){
        return data;
      }
      return [];
    });
  }

  makeNotification = function(x){
    var element= "";
    element += '<div class="dropdown-item" style="border-bottom:1px solid grey" href="/users/account">\n';//make it link to the payment option
    element += '<div style="display:flex; flex-direction:across; align-items:center">\n';
    element += '<div class=""><div class="notify-img"><i class="fa fa-bullhorn" style="font-size: 26px; margin-right:10px;"></i></div></div>\n';
    element += '<div style="white-space:normal">\n';
    element += x.message+"\n";
    element += '</div>\n';
    element += '<i class="fa fa-times dismiss" style="align-self:flex-start" data-notification=\''+x._id+'\'></i>\n';
    element += '</div>\n';
    element += '</div>\n';
    var elem = $($.parseHTML(element));
    elem.click(dismiss);
    elem.find($(".dismiss")).click(function(){
      $(this).remove();
    })

    elem.on("click",function(event){
      elem.remove();
      event.stopPropagation();
    });
    return elem;
  }

  setNotifications = async function(){
    var notifications = await getNotifications();
    var container = $("#notification-container");
    container.empty();
    for(var i = 0;i<notifications.length;i++)
    {
      if(!notifications[i].dismissed)
        container.append(makeNotification(notifications[i]));
    }
  }

  setNotifications();

  var x = setInterval(function() {
    var adj = false;
    setNotifications();
    if(adj){
      clearInterval(x);
    }
  }, 1000);

});
