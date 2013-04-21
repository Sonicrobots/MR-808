MR-808: Collaborative Sequencer 
===============================

# Abstract #

Collaboratively program the MR-808 drum robot!

FIXME, would ya....


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

and start fiddling with the buttons. Using a different browser,
navigate to the same URL.

# TODO #

Much. But specifically (not in order of importance):

* MIDI output 
* proper sequencer timing
* UI
* more detailed TODOs :)
* [Redis](http://redis.io) session & song/pattern storage?
