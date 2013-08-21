/* global require, process, console, setTimeout */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    express = require('express'),
    app = require('express')(),
    cookieParser = express.cookieParser(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    net = require('net'),
    clockSocketPath = '/tmp/clock-socket',
    songUpdateSocketPath = '/tmp/song-update-socket',
    clockSocket, songUpdateSocket, songUpdateSocketConn;

// socket for receiving clock pulses + current step
clockSocket = net.createServer(function(c) {
                c.on('data', function(data) {
                  readOnlySockets.emit("clock-event", { step: "step-" + data.toString() });
                });
              });
clockSocket.listen(clockSocketPath);

// socket for sending updates in pattern to sequencer
songUpdateSocket = net.createServer(function(c) {
                     console.log('song-update socket connected');
                     songUpdateSocketConn = c;
                   });
songUpdateSocket.listen(songUpdateSocketPath);

// web server
server.listen(3000);

// global variable to store state
var pattern = {
  tracks: [
    { id: "0", note: 48, name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "1", note: 49, name: "rattle", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "2", note: 50, name: "hats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "3", note: 51, name: "snare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "4", note: 52, name: "hands", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "5", note: 53, name: "cym", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "6", note: 54, name: "hb", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "7", note: 55, name: "clap", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "8", note: 56, name: "cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ]
};

var nicks = {};

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

// configuration for all environments
app.configure(function() {
  // we need to use() bodyParser() so we have access to the nick name post data
  app.use(express.bodyParser());
  // parse Cookies
  app.use(cookieParser);

  // static content
  app.use("/img", express.static( path.join( process.cwd(), "img")));
  app.use("/css", express.static( path.join( process.cwd(), "css")));
  app.use("/fonts", express.static( path.join( process.cwd(), "fonts")));
  app.use("/js", express.static( path.join( process.cwd(), "js")));
});

app.configure("development", function() {
  app.use(function (req, res, next) {
    next();
  });
});

// root resource
app.get("/", function(request, response) {
  response.sendfile(path.join(process.cwd(), "index.html"));
});

// login action
app.post("/login", function(request, response, next) {
  var nick = request.body["nick"];
  if(nick && nicks[nick] == undefined) {
    nicks[nick] = { nick: nick, color: getRandomColor(), "expires-by": "bla"};
    response.setHeader("X-Powered-By", "My Arse");
    response.cookie('nickname', nick, { maxAge: 900000, httpOnly: false});
    response.send(200);
  }
  else {
    // FIXME: some logic to check session timestamps
    response.cookie('nickname', "", { maxAge: 900000, httpOnly: false});
    response.send(401);
  }
});

// global authorization feature
io.configure(function(){
  io.set('authorization', function(data, accept) {

    var cookie = data.headers.cookie;
    if( cookie ) {
      var nickname = cookie.split("=")[1];
      // accept connection if nick is known
      if(nickname && nicks[nickname]) {
        accept(null, true);
      }
      // else reject it
      else {
        accept("nickname not recognized", false);
      }
    }
    // reject it if cookie is null
    else {
      accept("nickname not recognized", false);
    }
  });
});

// read only data
var readOnlySockets = io.of("/read-socket");

readOnlySockets.on('connection', function (socket) {
  // when a new client connects, it should receive current state
  socket.emit("initialize", pattern);
});

// write data
var writeSockets = io.of("/write-socket");

writeSockets.on('connection', function(socket) {
  // register callback for updates from this client
  socket.on('client-step-update', function (data) {
    var nick = socket.handshake.headers.cookie.split("=")[1];

    data.user = nicks[nick];

    // first, we store new state
    for( var track = 0; track < pattern.tracks.length; track++) {
      if(pattern.tracks[track].name == data.trackName) {
        // put the state update into the right place
        pattern.tracks[track].steps[data.step] = data.state;

        if(songUpdateSocketConn)
          songUpdateSocketConn.write(JSON.stringify(pattern.tracks[track])+"\r\n");
      }
    }
    // and push it on to other peers
    readOnlySockets.emit("group-step-update", data);
  });
});

// write data
var userSockets = io.of("/users");

userSockets.on('connection', function(socket) {
  // parse nick out of cookie
  var nick = socket.handshake.headers.cookie.split("=")[1];
  // keep track of socket id in nicks session array
  nicks[nick].id = socket.id;

  // clean up session array and send it along
  for(var user in nicks) {
    var userData = nicks[user];
    if( userSockets.sockets[userData.id] == undefined ) {
      userSockets.emit('disconnected', nicks[user]);
      delete nicks[user];
    }
  }

  // send all current nicks to socket on connection
  socket.emit('initialize', nicks);
  // then broadcast this nick's excitance to other nicks
  socket.broadcast.emit('connected', nicks[nick]);

  // tell others I left
  socket.on('disconnect', function() {
    // who disconnected?
    userSockets.emit('disconnected', nicks[nick]);
    // delete user!
    // delete nicks[nick];
  });
});


process.on('uncaughtException', function(err) {
  console.log(err);
  process.exit(1);
});

process.on('SIGINT', function() {
  process.exit(1);
});

process.on('SIGQUIT', function() {
  process.exit(1);
});

process.on('exit', function() {
  console.log('About to exit.');
  fs.unlinkSync(clockSocketPath);
  fs.unlinkSync(songUpdateSocketPath);
});