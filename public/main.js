//$(function() {
  // Initialize variables
  //var $window = $(window);

  // Prompt for setting a username
  
  var connected = false;
  var socket = io();
  var randomString = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  var username = randomString(8);
  socket.emit('add user', username);
  function findMe() {
    navigator.geolocation.getCurrentPosition(function(location) {
      socket.emit('new location',{
        uname : username,
        tyLat : location.coords.latitude,
        tyLng : location.coords.longitude
      })
      you.setPosition(new google.maps.LatLng( location.coords.latitude,location.coords.longitude ));
      //console.log(location.coords.accuracy);
    });
  }
  setInterval(findMe, 250);
  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new location', function (data) {
    console.log(data);
    him.setPosition(new google.maps.LatLng(data.tyLat,data.tyLng));
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log(data.username + ' joined'); 
    //addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    console.log(data.username + ' left');
    //addParticipantsMessage(data);
  });

//});1111