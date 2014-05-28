# SuperCollider MIDI Sequencer for MR-808 #

This SuperCollider script serves as a replacement for the original
version written in Chicken Scheme. Its purpose is to schedule MIDIOut
events (with pre-computed latencies) accurately, without blocking on
I/O. Communication with Node.js is done via OSC.

## Usage ##

Install SuperCollider. Start the sequencer with:

     $ sclang -D path/to/seq.sc

## TODO ##

* add proper light MIDI Note information
