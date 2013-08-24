#!/usr/bin/sh

BASE_DIR=/tmp/mr808		# this is where the pids & sockets will go
SEQ_MIDI_DEVICE=/dev/midi1	# midi device to use
NODE_PID_FILE=$RUN_DIR/server.pid # pid file for node
SEQ_PID_FILE=$RUN_DIR/seq.pid	  # sequencer pid file
CLOCK_SOCKET=/tmp/mr808/clock-socket # socket for clock communication
SONG_UPDATE_SOCKET=/tmp/mr808/song-update-socket # socket for updates from web clients

mkdir -p $BASE_DIR

/usr/bin/node server.js & echo $! > $NODE_PID_FILE

echo "Waiting for MR-808 server to start."
while true;
do 
    if [ -S $CLOCK_SOCKET ] && [ -S $SONG_UPDATE_SOCKET ];
    then
	echo "Done starting MR-808 server. Starting Sequencer.";
	/usr/bin/chicken_seq & echo $! > $SEQ_PID_FILE
	break;
    fi
    sleep 1;
done

exit 0;
