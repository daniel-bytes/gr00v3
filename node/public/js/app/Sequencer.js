var TransportStates = {
	stopped: 0,
	paused: 1,
	running: 2
};

var Sequencer = function(options) {
    this.latency = options.latency;
    this.synths = options.synths;
    this.canvas = options.canvas;
    this.bpm = options.bpm;
	this.stepsPerBar = options.stepsPerBar;
	this.bars = options.bars;
	this.draw_context = this.canvas.getContext("2d");
	this.states = [];
	this.padding_xy = 2;
	this.padding_hw = 5;
	this.audiolet = options.audiolet;
	this.audio_objects = [];
    this.durations = [1 / (options.stepsPerBar / 4)];
	this.transport_state = TransportStates.stopped;
	this.position = 0;
	this.sequencer_events = [];
	this.audiolet.scheduler.setTempo(this.bpm);
	
	localStorage = localStorage || {};
	
	for (var o = 0; o < this.getNumRows(); o++) {
		var arr = [];
		for (var i = 0; i < this.getNumColumns(); i++) {
		    var val = localStorage["pos_" + o + "_" + i];
			arr.push(val || 0);
		}
		
		this.states.push(arr);
	}
	
    // event handlers
	var _self = this;
	var _ticks = 0;
	var _double_click_ms = 250;
	var _click_pos = { x_cell: 0, 
					   y_cell: 0,
					   x_pos: 0,
					   y_pos: 0,
					   toggle_count: 0,
					   on: new Date(),
					   active: false };

	// -- canvas/UI event handlers
	this.canvas.addEventListener('mousedown', function(evt) {
	    console.log("mousedown")
		var temp_pos = _self.getCanvasCellPosition(evt);
		
		if (temp_pos == null) return;
		
		temp_pos.active = true;
		temp_pos.initial_value = _self.states[temp_pos.y_cell][temp_pos.x_cell];
		temp_pos.toggle_count = _click_pos.toggle_count;
		
		var value = 0;
		
		if (temp_pos.initial_value === 0) value = 1.0;
		else if (temp_pos.initial_value === 1.0) value = .5;
		else value = 0;
		
		_self.states[temp_pos.y_cell][temp_pos.x_cell] = value;
		localStorage["pos_" + temp_pos.y_cell + "_" + temp_pos.x_cell] = value;
		_self.refreshCanvas();
		
		_click_pos = temp_pos;
	});
	
    this.refreshCanvas();
}

Sequencer.prototype.getNumColumns = function() {
	// all bars on same row
	return ( this.stepsPerBar * this.bars );
}

Sequencer.prototype.getNumRows = function() {
	// all bars on same row
	return this.synths.length;
}

Sequencer.prototype.getNumCells = function() {
	return this.getNumColumns() * this.getNumRows();
}

Sequencer.prototype.start = function() {
    if (this.transport_state === TransportStates.running) return;
    
    this.setup_patterns();
	this.refreshCanvas();
    this.transport_state = TransportStates.running;
}

Sequencer.prototype.stop = function() {
    if (this.transport_state !== TransportStates.running) return;
    
    this.position = 0;
    this.teardown_patterns();
	this.refreshCanvas();
	this.transport_state = TransportStates.stopped;
}


Sequencer.prototype.setup_patterns = function() {
	var _self = this;
	_self.sequencer_events[0] = _self.audiolet.scheduler.play(
		[new PSequence(_self.states[0], Infinity)],
		new PSequence(_self.durations, Infinity),
		function(p) {
			if (p > 0) {
				_self.synths[0].gain.setValue(p * p);
		    	_self.synths[0].trigger();
			}

			var latency = navigator.userAgent.indexOf("AppleWebKit") > -1 ? 0 : self.latency;

			setTimeout(function() { 
				_self.refreshCanvas(); 
				if (++_self.position >= _self.states[0].length) _self.position = 0;
			}, 
			latency);

		}
    );

	_self.sequencer_events[1] = _self.audiolet.scheduler.play(
		[new PSequence(_self.states[1], Infinity)],
		new PSequence(_self.durations, Infinity),
		function(p) {
			if (p > 0) {
				_self.synths[1].gain.setValue(p * p);
		    	_self.synths[1].trigger();
			}
		}
    );

	_self.sequencer_events[2] = _self.audiolet.scheduler.play(
		[new PSequence(_self.states[2], Infinity)],
		new PSequence(_self.durations, Infinity),
		function(p) {
			if (p > 0) {
				_self.synths[2].gain.setValue(p * p);
		    	_self.synths[2].trigger();
			}
		}
    );

	_self.sequencer_events[3] = _self.audiolet.scheduler.play(
		[new PSequence(_self.states[3], Infinity)],
		new PSequence(_self.durations, Infinity),
		function(p) {
			if (p > 0) {
				_self.synths[3].gain.setValue(p * p);
		    	_self.synths[3].trigger();
			}
		}
    );
}

Sequencer.prototype.teardown_patterns = function() {
	for (var i = 0; i < this.sequencer_events.length; i++) {
		this.audiolet.scheduler.stop(this.sequencer_events[i]);
	}
}

Sequencer.prototype.refreshCanvas = function() {
	var canv = $(this.canvas);
	var cols = this.getNumColumns();
	var rows = this.getNumRows();
	var pos = this.position;
	var width = parseInt(canv.width() / cols);
	var height = parseInt(canv.height() / rows);
	
	var ctxt = this.draw_context;
	
	ctxt.clearRect(0, 0, canv.width(), canv.height());
	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {			
			if ( col === pos ) {
				ctxt.fillStyle = "#e00";
			}
			else {
				ctxt.fillStyle = "#0e0";
			}						

			var value = this.states[row][col];
			var w = parseInt(width - this.padding_hw)
			var h = parseInt(height - this.padding_hw)
			var x = parseInt(col * width) + this.padding_xy
			var y = parseInt(row * height) + this.padding_xy
			
			var mult = (value * .8) + .2;
			var shift = (1.0 - mult) * .5;
			
			var w1 = parseInt(w * mult)
			var h1 = parseInt(h * mult)
			var x1 = parseInt(x + (w * shift))
			var y1 = parseInt(y + (h * shift))
			
			ctxt.fillRect(x1, y1, w1, h1);
			
			ctxt.lineWidth = (col % 4 == 0 ? 1 : .2);
			ctxt.strokeRect(x1, y1, w1, h1)
			
			/*// TEST ONLY : show cell #
			if ((cell % 4) == 0) {
				ctxt.fillText((row * document.cols) + col + 1, x + 2, y + 5)
			}
			*/
		}
	}
}

Sequencer.prototype.getCanvasCellPosition = function(evt) {
	var canv = $(this.canvas);
	var cols = this.getNumColumns();
	var rows = this.getNumRows();

	var offset = canv.offset();
	var pad = (this.padding_xy * 2);
	var x_click = parseInt(evt.pageX - offset.left - pad);
	var y_click = parseInt(evt.pageY - offset.top - pad);
	var width = canv.width();
	var height = canv.height();
	var cell_width = parseInt(width / cols);
	var cell_height = parseInt(height / rows);
	
	if (x_click < 0 || y_click < 0) return null; // is padding click
	
	var x = ( x_click / cell_width )
	var y = ( y_click / cell_height )
	var x_int = parseInt(x)
	var y_int = parseInt(y)

	var x_diff = (x - x_int);
	var y_diff = (y - y_int);
	
	if (x_diff >= .9) return null; // is whitespace click
	if (y_diff >= .9) return null; // ""     ""      ""
	
	return { x_cell: x_int,
			 y_cell: y_int,
			 x_pos: (x_diff / .9),
			 y_pos: (y_diff / .9),
			 on: new Date() 
		   };
}
