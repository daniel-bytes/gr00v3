var DrumSynth = function(audiolet, options) {
    this.audiolet = audiolet;
    AudioletGroup.apply(this, [this.audiolet, 1, 2]);
    
    // setup objects
    this.fmInParam = new ParameterNode(this.audiolet, options.fmIn);
    this.freqParam = new ParameterNode(this.audiolet, options.frequency);
    this.gainParam = new ParameterNode(this.audiolet, options.gain);
    this.triggerNode = new TriggerControl(this.audiolet);
    this.sineNode = new Sine(this.audiolet, options.frequency);
    this.gainNode = new Gain(this.audiolet, options.gain);
    this.envelopeNode = new PercussiveEnvelope(this.audiolet, 1, options.attack, options.release);
    this.envMult = new Multiply(this.audiolet);
    this.fmInMult = new Multiply(this.audiolet);
    
    // setup parameters
    this.fmIn = this.fmInParam.parameter;
    this.gain = this.gainParam.parameter;
    this.frequency = this.freqParam.parameter;
    this.attack = this.envelopeNode.attack;
    this.release = this.envelopeNode.release;
    
    // connect nodes
    this.inputs[0].connect(this.fmInMult);
    this.fmInParam.connect(this.fmInMult, 0, 1);
    this.fmInMult.connect(this.sineNode);
    
    this.freqParam.connect(this.sineNode);
    this.gainParam.connect(this.envMult);

    this.triggerNode.connect(this.envelopeNode);
    this.envelopeNode.connect(this.envMult, 0, 1);    
    this.envMult.connect(this.gainNode, 0, 1);
    this.sineNode.connect(this.gainNode);
    this.gainNode.connect(this.outputs[0]);
    this.sineNode.connect(this.outputs[1]);
}
extend(DrumSynth, AudioletGroup);

DrumSynth.prototype.trigger = function() {
    this.triggerNode.trigger.setValue(1);
}
