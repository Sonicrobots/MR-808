var app = require('http').createServer(handler), 
    path = require('path'),
    url = require('url'),
    io = require('socket.io').listen(app),
    fs = require('fs');

var clockCount = 0;

// TODO:
// the session: should/could this live in a 
// redis store so app can be scaled horizontally?
var pattern = {
  tracks: [
    { id: "0", name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "1", name: "sd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "2", name: "hh", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "3", name: "ho", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "4", name: "clp", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "5", name: "shk", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "6", name: "bass", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "7", name: "horn", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: "8", name: "tuba", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
  ]
};

app.listen(3000);

// web server for static files
function handler (request, response) {
  var uri = url.parse(request.url).pathname, 
      filename = path.join(process.cwd(), uri);
  
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
    
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
      
      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
};

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
