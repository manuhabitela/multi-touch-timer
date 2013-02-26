var Timer = function() {
	this.reset(true);
	this.stop(true);
};
Timer.prototype = {
	start: function(silent) {
		silent = silent || false;
		var that = this;
		if (this.remaining.time <= 0)
			return false;
		this.goal = new Date().getTime()/1000 + this.remaining.time;
		this._playingInterval = setInterval(function() {
			that._tick();
			if (!silent) that.trigger('tick', that.remaining);
			if (that.playing && that.remaining.time === 0) {
				that.stop();
				that.reset();
			}
		}, 1000);

		if (!silent) this.trigger('start');
		if (!silent && !this.playing)
			this.trigger('stateChange', !this.playing);
		this.playing = true;
	},

	stop: function(silent) {
		console.log('stop');
		silent = silent || false;
		if (!silent && this.playing)
			this.trigger('stateChange', !this.playing);
		this.playing = false;
		clearInterval(this._playingInterval);
		this._playingInterval = null;
		if (!silent) this.trigger('stop');
	},

	reset: function(silent) {
		silent = silent || false;
		this.goal = 0;
		this.remaining = {
			hours: 0,
			min: 0,
			secs: 0,
			time: 0
		};
		if (!silent) this.trigger('reset');
		if (!silent) this.trigger('timeChange');
	},

	setRemaining: function(secs, silent) {
		silent = silent || false;
		this.remaining.time = secs;
		this._updateTimeDetails(silent);
	},

	_tick: function(silent) {
		silent = silent || false;
		if (!this.playing) return false;

		var now = new Date().getTime()/1000;
		this.setRemaining(this.goal - now, silent);
		if (this.goal - now <= 0 && !silent) {
			this.trigger('done');
		}
	},

	_updateTimeDetails: function(silent) {
		silent = silent || false;
		if (this.remaining.time < 0) {
			this.remaining = { hours: 0, min: 0, secs: 0, time: 0 };
		} else {
			this.remaining.hours = Math.floor( (this.remaining.time)/3600);
			this.remaining.min = Math.floor( ((this.remaining.time)%3600)/60);
			this.remaining.secs = Math.floor((this.remaining.time)%60);
		}
		if (!silent) this.trigger('timeChange');
	},

	_timeToSecs: function(hours, min, secs) {
		return ( ( ( (hours * 60) + min) * 60) + secs);
	}
};