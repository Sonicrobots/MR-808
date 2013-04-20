var app = require('http').createServer(handler), 
    path = require('path'),
    url = require('url'),
    io = require('socket.io').listen(app),
    fs = require('fs');

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
  socket.on('client-step-update', function (data) {
    socket.broadcast.emit("group-step-update", data);
  });
});
