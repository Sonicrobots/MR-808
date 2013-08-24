#!/usr/bin/sh

export BASE_DIR=/tmp/mr808		# this is where the pids & sockets will go
export SEQ_MIDI_DEVICE=/dev/midi1	# midi device to use
export NODE_PID_FILE=$BASE_DIR/server.pid # pid file for node
export SEQ_PID_FILE=$BASE_DIR/seq.pid	  # sequencer pid file
export CLOCK_SOCKET=/tmp/mr808/clock-socket # socket for clock communication
export SONG_UPDATE_SOCKET=/tmp/mr808/song-update-socket # socket for updates from web clients

function start {
    mkdir -p $BASE_DIR

    /usr/bin/node server.js & echo $! > $NODE_PID_FILE

    echo "Waiting for MR-808 server to start."
    while true;
    do 
	if [ -S $CLOCK_SOCKET ] && [ -S $SONG_UPDATE_SOCKET ];
	then
	    echo "Done starting MR-808 server. Starting Sequencer.";
	    /usr/bin/chicken_seq & echo $! > $SEQ_PID_FILE
	    schedtool -R -p 90 $!
	    break;
	fi
	sleep 1;
    done

    exit 0;
}

function cleanup {
    rm -rf $BASE_DIR &> /dev/null
}

function stop {
    killall chicken_seq
    kill -INT `cat $SEQ_PID_FILE` &> /dev/null
    kill -INT `cat $NODE_PID_FILE` &> /dev/null
}

function status {
    echo "FIX ME :)";
    exit 1;
}

case $1 in
    start)
	stop
	cleanup
	start
	;;
    stop)
	stop
	cleanup
	;;
    restart)
	stop
	start
	;;
    status)
	status
	;;
    *)
	help
	exit 1
	;;
esac
