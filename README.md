MR-808: Collaborative Sequencer 
===============================

# Abstract #

Collaborative, web-based MIDI sequencer application. Program beats
together, in a Browser!

# Features #

Supported Browsers: Firefox & Chromium

# Requirements #

* node.js [http://nodejs.org](http://nodejs.org)
* node-midi [https://github.com/justinlatimer/node-midi](https://github.com/justinlatimer/node-midi)
* socket.io [http://socket.io/](http://socket.io/)

# Usage #

Change to project directory and install dependencies with:

    npm install midi socket.io
    
Start the server application with:

    node server.js

Navigate to

    http://localhost:3000

and enter a nickname to identify yourself to other participants. Start
fiddling with the buttons.

# TODO #

* command-line arguments for web server port
* command-line arguments for midi interface name to choose
* a way to configure the note-numbers
* note-offs?
