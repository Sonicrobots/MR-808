/* global require, process, console, setTimeout */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    express = require('express'),
    app = require('express')(),
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

// configuration for all environments
app.configure(function() {
  // we need to use() bodyParser() so we have access to the nick name post data
  app.use(express.bodyParser());
  // parse Cookies
  app.use(express.cookieParser());

  // static content
  app.use("/img", express.static( path.join( process.cwd(), "img")));
  app.use("/css", express.static( path.join( process.cwd(), "css")));
  app.use("/fonts", express.static( path.join( process.cwd(), "fonts")));
  app.use("/js", express.static( path.join( process.cwd(), "js")));
});

app.configure("development", function() {
  app.use(function (req, res, next) {
    console.log(req.headers);
    next();
  });
});

// root resource
app.get("/", function(request, response) {
  response.sendfile(path.join(process.cwd(), "index.html"));
});

app.post("/login", function(request, response, next) {
  var nick = request.body["nick"];
  if(nick && nicks[nick] == undefined) {
    nicks[nick] = { "expires-by": "bla"};
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

function clockLoop() {
  setTimeout(function() {
    var step = clockCount % 16;
    readOnlySockets.emit("clock-event", { step: "step-" + clockCount % 16 });

    clockCount++;
    clockLoop();
  }, 300);
};

clockLoop();
