var app = require('http').createServer(handler), 
    path = require('path'),
    url = require('url'),
    io = require('socket.io').listen(app),
    fs = require('fs');

// TODO:
// the session: should/could this live in a 
// redis store so app can be scaled horizontally?
var pattern = {
  tracks: [
    { id: "0", name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0] }
  ]
};

app.listen(3000);

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

io.sockets.on('connection', function (socket) {
  socket.emit("initialize", pattern);
  socket.on('client-step-update', function (data) {

    // store new state 
    for(track = 0; track < pattern.tracks.length; track++) {
      var track  = pattern.tracks[track];
      if(track.name == data.trackName) {
        track.steps[data.step] = data.state;
      }
    }

    // and push to other peers
    socket.broadcast.emit("group-step-update", data);
  });
});


