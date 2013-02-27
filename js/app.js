var MultiTouchTimer = function(id, timer) {
	var that = this;
	this.timer = timer;

	this.dom = { el: document.getElementById(id) };
	this.dom.hours = this.dom.el.getElementsByClassName('hours')[0];
	this.dom.min = this.dom.el.getElementsByClassName('minutes')[0];
	this.dom.secs = this.dom.el.getElementsByClassName('seconds')[0];
	this.dom.audio = this.dom.el.getElementsByClassName('sound')[0];

	this.hammer = Hammer(document.body, {
		drag_block_horizontal: false,
		prevent_default: true,
		show_touches: true,
		drag_max_touches: 3,
		transform_always_block: true
	});
	this.hammer.on('drag', MultiTouchTimer.Utils.throttle(function(ev) {
		that.stopDaDring();
		if (that.timer.playing) //we don't allow to change the time when the timer is playing
			return false;
		var number = ev.gesture.direction == "up" ? 1 : ev.gesture.direction == "down" ?  -1 : null;
		if (!number)
			return false;
		if (ev.gesture.touches.length == 1)
			that.setTime('secs', number);
		if (ev.gesture.touches.length == 2)
			that.setTime('min', number);
		if (ev.gesture.touches.length >= 3)
			that.setTime('hours', number);
	}, 175));
	this.hammer.on('doubletap', function(ev) {
		that.toggle(ev);
	});
	this.hammer.on('pinch', MultiTouchTimer.Utils.throttle(function(ev) {
		if (ev.gesture.scale > 2)
			that.reset(ev);
	}, 175));

	this.timer.bind('timeChange', function() {
		that.updateDom();
	});
	this.timer.bind('stateChange', function(state) {
		that.updateClass(state);
	});
	this.timer.bind('done', function() {
		that.driiiiing();
	});
};

MultiTouchTimer.prototype = {
	toggle: function(ev) {
		if (this.timer.playing) this.timer.stop();
		else this.timer.start();
		this.stopDaDring();
	},

	reset: function(ev) {
		this.timer.stop();
		this.timer.reset();
		this.stopDaDring();
	},

	setTime: function(time, number) {
		//if we are scrolling with 2 or 3 fingers (minutes or hours) we don't set the time below 1min/1h
		if (time == "min")
			number = number == -1 && this.timer.remaining.time < 60 ? 0 : number*60;
		if (time == "hours")
			number = number == -1 && this.timer.remaining.time < 60*60 ? 0 : number*60*60;
		this.timer.setRemaining(this.timer.remaining.time + number);
	},

	updateDom: function() {
		this.dom.hours.innerHTML = MultiTouchTimer.Utils.leadingZeros(this.timer.remaining.hours);
		this.dom.min.innerHTML = MultiTouchTimer.Utils.leadingZeros(this.timer.remaining.min);
		this.dom.secs.innerHTML = MultiTouchTimer.Utils.leadingZeros(this.timer.remaining.secs);
	},

	updateClass: function(state) {
		if (!!state) {
			this.dom.el.className = document.body.className = 'play';
		} else {
			this.dom.el.className = document.body.className = 'pause';
		}
		if (this.dringInterval !== null) {
			this.dom.el.className = document.body.className = 'dring';
		}
	},

	stopDaDring: function() {
		clearInterval(this.dringInterval);
		this.dringInterval = null;

		if (this.dom.el.className == 'dring') {
			this.updateClass(this.timer.playing);
		}
	},

	dring: function() {
		var audio = document.createElement('audio');
		var ext = ['mp3', 'ogg'];
		for (var i = ext.length - 1; i >= 0; i--) {
			var source = document.createElement('source');
			source.src = 'sound/time.' + ext[i];
			audio.appendChild(source);
		}
		audio.play();
	},

	driiiiing: function() {
		var that = this;
		var audioOk = !!(document.createElement('audio').canPlayType);
		if (!audioOk) return false;

		this.stopDaDring();
		//we always create a new audio element so that the audio can loop
		//it's not really great but other solutions (loop=true, listening to the audio end event) didn't work at least on my ubuntu chromium
		this.dringInterval = setInterval(function() {
			that.dring();
		}, 1300); //the audio files is about 1.3sec long
		this.dring();

		this.updateClass(this.timer.playing);
	}
};

MultiTouchTimer.Utils = {
	leadingZeros: function(value) {
		if (value <= 0)
			value = '00';
		else if (value < 10)
			value = '0' + value;
		return value;
	},
	//from underscore.js
	throttle: function(func, wait) {
		var context, args, timeout, result;
		var previous = 0;
		var later = function() {
			previous = new Date();
			timeout = null;
			result = func.apply(context, args);
		};
		return function() {
			var now = new Date();
			var remaining = wait - (now - previous);
			context = this;
			args = arguments;
			if (remaining <= 0) {
				clearTimeout(timeout);
				timeout = null;
				previous = now;
				result = func.apply(context, args);
			} else if (!timeout) {
				timeout = setTimeout(later, remaining);
			}
			return result;
		};
	}
};