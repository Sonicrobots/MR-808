MIDIClient.init;

~lightlatency = 100;					// ms
~lightduration = 10;							// ms

~clock = TempoClock.new(queueSize: 8192);
~clock.tempo_(128/60);
~step = 0;

// address of node.js server for clock updates
~node = NetAddr.new("127.0.0.1", 7771);

// global pattern object
~pattern = (
	\0: ( snote: 61, latency: 60, duration: 80, lnote: 0, name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\1: ( snote: 62, latency: 64, duration: 50, lnote: 85, name: "topsnare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\2: ( snote: 63, latency: 74, duration: 50, lnote: 85, name: "bottomsnare", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\3: ( snote: 64, latency: 47, duration: 100, lnote: 0, name: "small-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\4: ( snote: 65, latency: 47, duration: 100, lnote: 0, name: "medium-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\5: ( snote: 66, latency: 47, duration: 100, lnote: 0, name: "large-cong", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\6: ( snote: 67, latency: 27, duration: 80, lnote: 81, name: "claves", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\7: ( snote: 68, latency: 67, duration: 100, lnote: 0, name: "tophats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\8: ( snote: 70, latency: 80, duration: 100, lnote: 0, name: "bottomhats", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\9: ( snote: 71, latency: 31, duration: 100, lnote: 83, name: "claps", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\10: ( snote: 73, latency: 83, duration: 40, lnote: 82, name: "carabassa", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\11: ( snote: 77, latency: 77, duration: 50, lnote: 74, name: "cym", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
	\12: ( snote: 78, latency: 30, duration: 70, lnote: 84, name: "cowbell", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] )
);

~routine = {
	~pattern.do({ |data, track|
		var step_value = data.at('steps').at(~step),
		latency = data.at('latency'),
		duration = data.at('duration');
		if(step_value.asInteger === 1) {
			~clock.schedAbs(~clock.secs2beats(~clock.seconds + (latency/1000)), r { 

				~midiout.noteOn(0, data.at('snote'), 76);
				(duration/1000).wait;
				~midiout.noteOn(0, data.at('snote'), 0);
			});

			if( data.at('lnote') != 0 ) {
				~clock.schedAbs(~clock.secs2beats(~clock.seconds + ~lightlatency), r { 
					~midiout.noteOn(0, data.at('lnote'), 76);
					(~lightduration/1000).wait;
					~midiout.noteOn(0, data.at('lnote'), 0);
				});
			}

		}
	});
	~node.sendMsg("/clock", ~step);
	~step = (~step + 1) % 16;
	0.25;
};

~resp = OSCresponderNode(nil, '/song_update', { |t, r, msg| 
	var id, steps, parsed = msg.last.asString.interpret;
	if(parsed.at(\type) == "track") {
		id = parsed.at(\id);
		steps = parsed.at(\data);
		~pattern.at(id.asSymbol).put('steps',steps);
	}
}).add;

~resp = OSCresponderNode(nil, '/transport', { |t, r, msg| 
	var id, steps, parsed = msg.last.asInteger;
	if(parsed === 0) {
		~clock.clear;
		~pattern.do({ |data,track|
			var note = data.at('snote');
			~midiout.noteOn(0,note,0);
		});
	} {
		~step = 0;
		~clock.play(~routine);
	}
}).add;

~node.sendMsg("/init","please");

// MIDIClient.destinations.do({
// 	arg endpoint;
// 	[endpoint.name,endpoint.uid].postln;
// });

// moes midi interface
//o = MIDIOut.new(1,1310720);

~midiout = MIDIOut.new(1); 				// use the MIDI Through Port
~midiout.connect(1,1);							

~clock.play(~routine);
