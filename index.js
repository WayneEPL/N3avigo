// Setup basic express server
var fs = require('fs');
var express = require('express');
var app = express();
var options = {
    key: fs.readFileSync('/etc/ssl/rtloc.tk/private.key'),
    cert: fs.readFileSync('/etc/ssl/rtloc.tk/public.crt'),
    ca: fs.readFileSync('/etc/ssl/rtloc.tk/ca.pem')
}
var server = require('https').createServer(options,app);
var io = require('socket.io')(server);
var sPort = 443;//process.env.PORT || 443;
var nPort = 80;//process.env.PORT || 80;
var http = require('http');

var allusers = new Array();

server.listen(sPort, function () {
  console.log('Server listening at port %d', sPort);
});

var httpserver = http.createServer(function(req, res) {
  var output = "<html>";
  switch(req.url){
    case '/track' :
    case '/track/' :
      output +=('<table style="width:100%">');
      output +=('<tr><th>Username</th><th>Latitude</th><th>Longitude</th></tr>');
      for ( var tuser in allusers ){
        output +=('<tr>');
        output +=('<td>' + allusers[tuser].unm + '</td>');
        output +=('<td>' + allusers[tuser].lat + '</td>');
        output +=('<td>' + allusers[tuser].lng + '</td>');
        output +=('</tr>');
      }
      output +=('</table>');
      fs.writeFile('public/logs/' + new Date().getTime() + '.log', output, 'utf8');
      res.write(output);
    break;
    case '/logs' :
    case '/logs/' :
    console.log(__dirname+'/public/logs/');
      fs.readdir(__dirname+'/public/logs/', function(err, items) {
          output +=('<table style="width:100%">');
          output +=('<tr><th>Sl No</th><th>Item</th></tr>');
          for (var i=0; i<items.length; i++) {
            output +=('<tr>');
            output +=('<td>' + (i+1) + '</td>');
            output +=('<td><a href="'+items[i]+'">'+items[i]+'</td>');
            output +=('</tr>');              
          }
          output +=('</table>');
          console.log(output);
          res.write(output);
      });     
    break; 
    default :
      res.writeHead(302, {'Location': 'https://rtloc.tk' + req.url});
    break;
  }
  res.end();
});

httpserver.listen(nPort, function () {
  console.log('Server listening at port %d', nPort);
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
      uname: data.uname,
      tyLat: data.tyLat,
      tyLng: data.tyLng
    });
    //console.log(data.uname+"@"+data.tyLat+","+data.tyLng);
    if(!( data.uname in allusers )){
      console.log("Creating " + data.uname + "...");
      allusers[data.uname] = new Object();
      allusers[data.uname].lat = data.tyLat;
      allusers[data.uname].lng = data.tyLng;
      allusers[data.uname].unm = data.uname;
      //allusers[data.uname] = node;
    }else{
      allusers[data.uname].lat = data.tyLat;
      allusers[data.uname].lng = data.tyLng;
    }
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
