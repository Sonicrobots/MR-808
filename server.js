/* global require, process */

var path = require('path'),
    url = require('url'),
    fs = require('fs'),
    express = require('express'),
    app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(3000);

var clockCount = 0;

// TODO:
// the session: should/could this live in a
// redis store so app can be scaled horizontally?
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

// root route
app.get("/", function(request, response) {
  response.sendfile(path.join(process.cwd(), "index.html"));
});
// static content served from here
app.use("/img", express.static( path.join( process.cwd(), "img")));
app.use("/css", express.static( path.join( process.cwd(), "css")));
app.use("/fonts", express.static( path.join( process.cwd(), "fonts")));
app.use("/js", express.static( path.join( process.cwd(), "js")));

// handle client updates
io.sockets.on('connection', function (socket) {
  // when a new client connects, it should receive current state
  socket.emit("initialize", pattern);
  // register callback for updates from this client
  socket.on('client-step-update', function (data) {
    // first, we store new state
    for(track = 0; track < pattern.tracks.length; track++) {
      if(pattern.tracks[track].name == data.trackName) {
        // put the state update into the right place
        pattern.tracks[track].steps[data.step] = data.state;
      }
    }
    // and push it on to other peers
    socket.broadcast.emit("group-step-update", data);
  });
});


function clockLoop() {
  setTimeout(function() {
    var step = clockCount % 16;
    io.sockets.emit("clock-event", { step: "step-" + clockCount % 16 });

    clockCount++;
    clockLoop();
  }, 300);
};

clockLoop();
