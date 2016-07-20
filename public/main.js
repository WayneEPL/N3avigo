//$(function() {
  // Initialize variables
  //var $window = $(window);

  // Prompt for setting a username
  
  var connected = false;

  var socket = io("ws://n3avigo.cusat.tk",{secure: false});
  
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

  // Sends a chat message
  function sendMessage (message) {
      socket.emit('new location', message);
  }

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new location', function (data) {
    console.log(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log(data.username + ' joined'); 
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    console.log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

//});