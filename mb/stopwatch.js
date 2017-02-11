/*
Copyright (C) 2016  Cristian Filipov

This file is part of MuscleBook.

MuscleBook is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

MuscleBook is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with MuscleBook.  If not, see <http://www.gnu.org/licenses/>.
*/

function Stopwatch() {
	let _display = document.querySelector(".stopwatch-display");
	let _toggleButton = document.querySelector(".stopwatch-toggle");
	let	_timeStart = 0;
	let _timeStop = 0;
	let _totalDuration = 0;
	let _timer = null;

	this.initialTime = null;

	this.onStart = function() { };

	this.onStop = function() { };

	this.toggle = function() {
		if (!this.running()) this.start();
		else this.stop();
	};

	this.now = function() {
		return new Date();
	};

	this.start = function() {
		let t = this.now();
		if (this.initialTime === null) this.initialTime = t;
		_timeStart = t;
		_timeStop = 0;
		_timer = setInterval(_ => this.update(), 1);
		_toggleButton.innerHTML = "&#9724;";
		this.onStart();
	};

	this.stop = function() {
		clearInterval(_timer);
		_timeStop = this.now();
		_timer = null; 
		_toggleButton.innerHTML = "&#9658;";
		_totalDuration += (_timeStop - _timeStart);
		this.onStop();
	};

	this.now = function() {
		return new Date();
	};

	this.reset = function() {
		this.initialTime = null;
		_timeStart = _timeStop = _totalDuration = 0;
		this.update();
	};

	this.duration = function() {
		return _timer ? (this.now() - _timeStart) + _totalDuration : _totalDuration;
	};

	this.running = function() {
		return _timer !== null;
	};

	this.zero = function() {
		return this.initialTime == null;
	};

	this.update = function() {
		_display.value = formatTime(this.duration());
	};

	_toggleButton.addEventListener("click", _ => this.toggle());
	this.update();
}

function pad(num, size) {
    var s = "0000" + num;
    return s.substr(s.length - size);
}

function formatTime(time) {
    var h = m = s = ms = 0;
    var newTime = '';

    h = Math.floor( time / (60 * 60 * 1000) );
    time = time % (60 * 60 * 1000);
    m = Math.floor( time / (60 * 1000) );
    time = time % (60 * 1000);
    s = Math.floor( time / 1000 );
    ms = time % 1000;

    newTime = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + '.' + pad(ms, 3);
    return newTime;
}