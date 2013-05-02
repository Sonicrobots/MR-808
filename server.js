/* global require, process, console, setTimeout */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    express = require('express'),
    app = require('express')(),
    cookieParser = express.cookieParser(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(3000);

var clockCount = 0;

// global variable to store state
var pattern = {
  tracks: [
    { id: "0", name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "1", name: "rattle", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "2", name: "hats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "3", name: "snare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "4", name: "hands", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "5", name: "cym", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "6", name: "hb", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "7", name: "clap", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "8", name: "cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
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

function clockLoop() {
  setTimeout(function() {
    var step = clockCount % 16;
    readOnlySockets.emit("clock-event", { step: "step-" + clockCount % 16 });

    clockCount++;
    clockLoop();
  }, 300);
};

clockLoop();
