// =====================================================================
// SuperCollider Workspace
// =====================================================================


~midiout = MIDIOut.new(1); 				// use the MIDI Through Port
~midiout.connect(1,1);							

~pattern = (
	\0: ( snote: 61, latency: 80, duration: 80, lnote: 0, name: "bd", steps: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] ),
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

~midiout.noteOn(0, 73, 120);
~midiout.noteOn(0, 73, 0);

Task({
	loop {
		~pattern.do({ |data, track|
			var note = data.at('snote');
			data.at('name').postln; 
			r {
				~midiout.noteOn(0, note, 90);
				(data.at('duration')/1000).wait;
				~midiout.noteOn(0, note, 0);
			}.play;

			0.5.wait;
		});
	};
}).play
