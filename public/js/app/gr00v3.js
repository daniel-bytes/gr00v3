var Gr00v3App = function(options) {
	bufferSize = 4096;
	sampleRate = 44100;
	this.audiolet = new Audiolet(sampleRate, 2, bufferSize);
    this.synths = [];
    
    for (var i = 0; i < options.tracks.length; i++) {
        var track = options.tracks[i];
        var synth = new DrumSynth(this.audiolet, 
                                  {
                                     frequency: track.frequency,
                                     gain: track.gain,
                                     attack: track.attack,
                                     release: track.release
                                  });
        
        this.synths.push(synth);
        this.synths[i].connect(this.audiolet.output);
    }

    for (var i = 0; i < options.tracks.length; i++) {
        var idx = (i + 1) % options.tracks.length;
        if (i === idx) break;
        this.synths[i].outputs[1].connect(this.synths[idx].inputs[0]);
    }
    
    this.sequencer = new Sequencer({
                            audiolet: this.audiolet,
                            latency: 1000 * bufferSize / sampleRate,
                            canvas: options.canvas,
                            synths: this.synths,
                            bpm: options.bpm,
                            stepsPerBar: options.stepsPerBar,
                            bars: options.bars
                        });
}

Gr00v3App.prototype.start = function() {
    this.sequencer.start();
}

Gr00v3App.prototype.stop = function() {
    this.sequencer.stop();
}

Gr00v3App.prototype.setValue = function(i, prop, value) {
    console.log("setValue(%i, %s, %s)", i, prop, value)
    var synth = this.synths[i];
    synth[prop].setValue(value);
}

Gr00v3App.prototype.getValue = function(i, prop) {
    console.log("getValue(%i, %s)", i, prop)
    var synth = this.synths[i];
    return synth[prop].getValue();
}

Gr00v3App.prototype.trigger = function(i) {
    var synth = this.synths[i];
    synth.triggerNode.trigger.setValue(1);
}