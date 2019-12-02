$(document).ready(() => {
  dismiss = async function(notification){
    console.log("dismissing");
    await $.ajax({
      url: '/api/users/notifications/'+notification._id,
      method: "POST",
      data: {
        "dismissed" : 1,
        "ack" : 1,
      },
      dataType: 'json'
    }).done(function(data) {
      console.log(data);
    });
  }

  ack = async function(notification){
        console.log(notification._id);
    console.log("acking");
    await $.ajax({
      url: '/api/users/notifications/'+notification._id,
      method: "POST",
      data: {
        "ack" : 1,
        "dismissed": 0,
      },
      dataType: 'json'
    }).done(function(data) {
      console.log(data);
    });
  }

  getNotifications = async function()
  {
    var element = document.getElementById('nav-data');
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

  makeFakeNotification = function(x){
    var element= "";
    element += '<div class="dropdown-item">\n';//make it link to the payment option
    element += '<div style="display:flex; flex-direction:across; align-items:center">\n';
    element += '<div style="white-space:normal">\n';
    element += x.message+"\n";
    element += '</div>\n';
    element += '</div>\n';
    element += '</div>\n';
    var elem = $($.parseHTML(element));
    return elem;
  }

  makeNotification = function(x, border){
    var element= "";
    if(border)
      element += '<div class="dropdown-item" style="border-bottom:1px solid grey" >\n';//make it link to the payment option
    else
      element += '<div class="dropdown-item">\n';//make it link to the payment option
    element +='<a style="display:flex; flex-direction:across; align-items:center;color: #212529; text-decoration: none;" href="'+x.redirect+'">';
    element += '<div style="display:flex; flex-direction:across; align-items:center; position: relative">\n';
    element += '<div><div class="notify-img"><i class="fa fa-bullhorn" style="font-size: 26px; margin-right:10px;"></i></div></div>\n';
    element += '<div style="white-space:normal">\n';
    element += x.message+"\n";
    element += '</div>\n';
    element += '</a>';
    element += '<div style="display: flex; flex-direction: column;justify-content: flex-start">';
    element += '<i class="fa fa-times dismiss" style="align-self:flex-start" data-notification=\''+x._id+'\'></i>\n';
    if(!x.ack)
      element += '<i class="fa fa-circle" style="color:red;align-self:center" data-notification=\''+x._id+'\'></i>\n';
    element += '</div>';
    element += '</div>\n';
    element += '</div>\n';
    //console.log(element);
    var elem = $($.parseHTML(element));
    var dis = $(elem.find(".dismiss")[0]);
    console.log(dis);
    if(dis)
      dis.on("click", function(){
        console.log("click 1");
        console.log($(this));
        dismiss(x);
        $(this).parent().parent().remove();
        event.stopPropagation();
      });

    elem.on("click",function(event){
      ack(x);
    });
    return elem;
  }

  setNotifications = async function(){
    var data = await getNotifications();
    var container = $("#notification-container");
    container.empty();
    var notifications = [];
    for(var i = 0;i<data.length;i++)
    {
      if(data[i].dismissed == 0)
        notifications.push(data[i]);
    }
    var allAcked = true;
    if(notifications.length == 0)
    {
      container.append(makeFakeNotification({
        message: "no notifications to show"
      }));
    }
    for(var i = 0;i<notifications.length;i++)
    {
        console.log(notifications[i]);
        container.append(makeNotification(notifications[i], i != notifications.length - 1));
        if(!notifications[i].ack)
          allAcked = false;
    }
    if(!allAcked)
    {
      $('#dot').css("display", "inline");
    }else{
      $('#dot').css("display", "none");
    }
  }

  setNotifications();

  var x = setInterval(function() {
    setNotifications();
  }, 30000);

});
