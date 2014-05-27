MR-808: Collaborative Sequencer 
===============================

# Abstract #

Collaborative, web-based MIDI sequencer application. Program beats
together, in a Browser! 

# Features #

Supported Browsers: Firefox & Chromium, possibly others. 

# Requirements #

* node.js [http://nodejs.org](http://nodejs.org)
* socket.io [http://socket.io/](http://socket.io/)

# Services #

Starting: 

```
service mr808-node start
service mr808-sc start
```

Stopping: 

```
service mr808-node stop
service mr808-sc stop
```

Restarting:

```
service mr808-node restart
service mr808-sc restart
```

# Usage #

Change to project directory and install dependencies with:

    npm install
    
Start the server application with:

    node server.js

Navigate to

    http://localhost:3000

and enter a nickname to identify yourself to other participants. Start
fiddling with the buttons.

# TODO #

* command-line arguments for web server port
