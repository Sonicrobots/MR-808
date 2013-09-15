/* global require, process, console, setTimeout */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    lodash = require('lodash'),
    express = require('express'),
    app = require('express')(),
    cookieParser = express.cookieParser(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    osc = require('node-osc'),
    clockServer = new osc.Server(7771,"0.0.0.0"),
    updateClient = new osc.Client("0.0.0.0", 57120),
    webServerPort, lastChangeOccurred = new Date().getTime(),
    RESET_PATTERN_TIMEOUT = 1000 * 60 * 2,
    defaultPattern = {
      tempo: 128,
      tracks: [
        { id: "0", name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "1", name: "topsnare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "2", name: "bottomsnare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "3", name: "small-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "4", name: "medium-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "5", name: "large-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "6", name: "claves", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "7", name: "tophats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "8", name: "bottomhats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "9", name: "clap", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "10", name: "carabassa", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "11", name: "cym", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { id: "12", name: "cowbell", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    };

// global variable to store state
var pattern = lodash.cloneDeep(defaultPattern);

// set up the port on which the server will run
if(process.env['SEQ_SERVER_PORT']) {
  try {
    webServerPort = parseInt(process.env['SEQ_SERVER_PORT'],10);
  }
  catch(err) {
    webServerPort = 3000;
  }
}
else {
  webServerPort = 3000;
}

// web server
server.listen(webServerPort);

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
        updateClient.send('/song_update',"(id: " + track + ", type: \"track\", data: " + JSON.stringify(pattern.tracks[track].steps) + ")");
      }
    }
    // and push it on to other peers
    readOnlySockets.emit("group-step-update", data);
    // people are still using the machine, so we extend the deadline
    lastChangeOccurred = new Date().getTime();
  });
});

// socket for receiving clock pulses + current step
clockServer.on('message', function(msg, rinfo) {
  if(msg[0] === '/init') {
    lodash.forEach(pattern.tracks, function(track) {
      // put the state update into the right place
      updateClient.send('/song_update',"(id: " + track.id + ", type: \"track\", data: " + JSON.stringify(track.steps) + ")");
    });
  }

  if(msg[0] === '/clock')
    readOnlySockets.emit("clock-event", { step: "step-" + msg[1].toString() });

  if( new Date().getTime() - lastChangeOccurred > RESET_PATTERN_TIMEOUT ) {
    pattern = lodash.cloneDeep(defaultPattern); //reset pattern
    readOnlySockets.emit('initialize', pattern); //tell every client

    lodash.forEach(pattern.tracks, function(track) {
      // put the state update into the right place
      updateClient.send('/song_update',"(id: " + track.id + ", type: \"track\", data: " + JSON.stringify(track.steps) + ")");
    });

    lastChangeOccurred = new Date().getTime();
  }
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
});
