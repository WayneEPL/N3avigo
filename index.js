// Setup basic express server
var fs = require('fs');
var express = require('express');
var app = express();
var options = {
    key: fs.readFileSync('/etc/ssl/cusat.tk/navigo/private.key'),
    cert: fs.readFileSync('/etc/ssl/cusat.tk/navigo/public.crt'),
    ca: fs.readFileSync('/etc/ssl/cusat.tk/navigo/root.ca.crt')
}
var server = require('https').createServer(options,app);
var io = require('socket.io')(server);
var port = process.env.PORT || 443;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new location', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new location', {
      tyLat: data.tyLat,
      tyLng: data.tyLng
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

});
