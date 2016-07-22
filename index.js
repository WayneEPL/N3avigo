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
  var output = '<html><a href="save/">Snapshot</a>';
  var save = false;
  switch(req.url){
    case '/track/save':
    case '/track/save/':
      save = true;
    case '/track' :
    case '/track/' :
      output +=('<table border="1" style="width:100%">');
      output +=('<tr><th>Username</th><th>Latitude</th><th>Longitude</th></tr>');
      for ( var tuser in allusers ){
        output +=('<tr>');
        output +=('<td>' + allusers[tuser].unm + '</td>');
        output +=('<td>' + allusers[tuser].lat + '</td>');
        output +=('<td>' + allusers[tuser].lng + '</td>');
        output +=('</tr>');
      }
      output +=('</table border="1" style="width:100%"></html');
      res.write(output);
      if(save==true){
        var fname = new Date().getTime();
        fs.writeFileSync('public/logs/' + fname + '.log.html', output, 'utf8');
        var append = '<tr>';
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var cdate = new Date(fname);
        var year = cdate.getFullYear();
        var month = months[cdate.getMonth()];
        var date = cdate.getDate();
        var hour = cdate.getHours();
        var min = cdate.getMinutes();
        var sec = cdate.getSeconds();
        append += '<td>' + date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec + '</td>';
        append += '<td><a href="logs/'+fname+'.log.html">'+fname+'.log.html</td>';
        append += '</tr>';              
        fs.appendFileSync(__dirname+'/public/logs.index', append, 'utf8');
      }
    break;
    case '/logs' :
    case '/logs/' :
    console.log(__dirname+'/public/logs/');
    output +=('<table border="1" style="width:100%">');
    output +=('<tr><th>Date</th><th>Item</th></tr>');
    output += fs.readFileSync(__dirname+'/public/logs.index')
    output +=('</table>');
    //console.log(output);
    res.write(output);
    break; 
    default:
    //case '/' :
      res.writeHead(302, {'Location': 'https://rtloc.tk' + req.url});
    //break;
    //default:
      //res.write(fs.readFileSync(__dirname+'/public'+req.url));
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
