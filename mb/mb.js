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

/*
 Entry Fields
+--------------+------------+
| id           | Input      |
| xid          | Input      |
| start        | Input      |
| duration     | Input      |
| reps         | Input      |
| weight       | Input      |
| asweight     | Input      |
| bodyweight   | Input      |
| failure      | Input      |
| warmup       | Input      |
| unit         | Input      |
| exerciseName | Deprecated |
| netweight    | Derived    |
| e1rm         | Derived    |
| volume       | Derived    |
| workout      | Aggregate  |
| intensity    | Aggregate  |
| xset         | Aggregate  |
| rset         | Aggregate  |
| xvolume      | Aggregate  |
| tvolme       | Aggregate  |
| rvolume      | Aggregate  |
| xduration    | Aggregate  |
| tduration    | Aggregate  |
| prs          | Aggregate  |
+--------------+------------+

Every entry in the database is a workout "set" in the sense of "sets, reps, weight". 
Every entry of a given exercise will have both `rset` and `xset` fields.

- The `xset` field is an ordinal value representing the nth time a specific exercise was performed during a workout.
- The `xset` field starts at 1 and increments on each additional entry of the same exercise.
- The `xset` field for an entry of a particular exercise does not reset until the end of the workout.

For example: if you lift 2x5@100 (2 sets of 5 reps at 100 lbs),
that will be 2 entries, the first entry will have a `xset` field value of 1, the second "2" and so on..

	[{ workoutID: 1, xid: 723, weight: 100, reps: 5, rset: 1, xset: 1 },
		{ workoutID: 1, xid: 723, weight: 100, reps: 5, rset: 2, xset: 2 }]

Each exercise of a workout has its own set counter. 
Exercises do not need to be done consecutively, the set counter will continue to increment for each one.

	[{ workoutID: 1, xid: 723, weight: 100, reps: 5, set: 1, xset: 1 }, // Deadlift (first set)
		{ workoutID: 1, xid: 723, weight: 100, reps: 5, rset: 2, xset: 2 }, // Deadlift (second set)
		{ workoutID: 1, xid: 482, weight: 50, reps: 10, rset: 1, xset: 1 }, // Bench Press (first set)
		{ workoutID: 1, xid: 723, weight: 100, reps: 5, rset: 3, xset: 3 }, // Deadlift (third set)
		{ workoutID: 1, xid: 482, weight: 50, reps: 10, rset: 2, xset: 2 }, // Bench Press (second set)
		{ workoutID: 1, xid: 723, weight: 225, reps: 3, rset: 1, xset: 4 }] // Deadlift (fourth set)

It's important to note:

	- The xset does not reset to 1 until a new workout is started.
	- The xset does not indicate the number of sets that were performed for a specific weight or reps:
		- ie: It would be incorrect to read the last entry as 4x3@225
		- Only one set of deadlifts was done for 3 reps at 225 lbs. 
			The other sets were at a different rep range and weight.
		- In other words, the last entry's xset tells you that a deadlift was performed 4 times during this workout so far, 
			regardless of weight or reps. 
*/

let db = null;

let PR = {
	WEIGHT :"weight", 
	VOLUME :"volume", 
	SETS :"sets", 
	REPS :"reps", 
	FIRST :"first"
}

let colorPalette = [
    // Brewer Color Schemes http://www.graphviz.org/doc/info/colors.html
    "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#e5d8bd",
    "#fddaec", "#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#ccebc5", "#ffed6f", "#bc80bd", "#a6cee3",
    "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#fdbf6f", "#ff7f00",
    "#cab2d6", "#e31a1c", "#9e0142", "#d53e4f", "#f46d43", "#fdae61",
    "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd",
    "#5e4fa2", "#ffffb3"
];

function loadFromDB() {
	console.log("Loading DB...");

	let dbOpen = window.indexedDB.open("MuscleBookDatabase", 1);

	dbOpen.onerror = (event) => {
		alert(event.target.errorCode);
	};

	dbOpen.onsuccess = (event) => {
		console.log("DB loaded..");
		db = event.target.result;
		databaseReady();
	};

	dbOpen.onupgradeneeded = (event) => {
		console.log("Migrating DB");
		db = event.target.result;
		let objectStore = db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
		objectStore.createIndex("start", "start", { unique: false });
		objectStore.createIndex("xid", "xid", { unique: false });
	};
}

function metricReducer(group) {
	let reducer = reductio();
	reducer.value("intensity")
		.avg(e => e.failure ? 1.0 : Math.max(0.1, e.intensity))
		.filter(e => !e.warmup)
		.alias({
			value: d => d.avg || 0,
			formatted: d => `${(d.value() * 100).toFixed(2)}%`
		});
	reducer.value("weight")
		.avg(e => e.netweight)
		.filter(e => !e.warmup && e.intensity > 0.5)
		.alias({ 
			value: d => d.avg || 0,
			formatted: d => `${d.value().toLocaleString()}lbs`
		});
	reducer.value("rvolume")
		.max(e => e.rvolume)
		.alias({
			value: d => d.max || 0,
			formatted: d => `${(d.value() * 100).toFixed(2)}%`
		});
	reducer.value("volume")
		.max(e => e.xvolume)
		.alias({ 
			value: d => d.max || 0,
			formatted: d => `${d.value().toLocaleString()}lbs`
		});
	reducer.value("duration")
		.max(e => e.tduration)
		.alias({
			value: d => d.max || 0,
			formatted: d => formatDuration(d.value())
		});
	reducer(group);
}

function statsReducer(group) {
	let reducer = reductio();
	reducer.value("exercises")
		.exception(d => d.xid)
		.exceptionCount(true);
	reducer.value("workouts")
		.exception(d => d.workout)
		.exceptionCount(true);
	reducer.value("days")
		.exception(d => moment(d.start).format("ll"))
		.exceptionCount(true);
	reducer(group);
}

Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

if (!window.indexedDB) {
	window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

function memoize(func) {
	var memo = {};
	var slice = Array.prototype.slice;
	let f = function() {
		var args = slice.call(arguments);
		if (args in memo) return memo[args];
		else return (memo[args] = func.apply(this, args));
	}
	f.reset = function() {
		memo = {};
	}
	return f;
}

function getAllEntries(onCompleted) {
	let results = [];
	let objectStore = db.transaction(["entries"]).objectStore("entries");
	objectStore.openCursor().onsuccess = function(event) {
		let cursor = event.target.result;
		if (cursor) {
			let entry = cursor.value;
			results.push(entry);
			cursor.continue();
		} else {
			onCompleted(results);
		}
	};
}

function calculateVolume(d) {
	return calculateNetWeight(d) * d.reps;
}

function calculateNetWeight(d) {
	var total = 0;
	if (d.weight != null) total += d.weight;
	if (d.bodyweight != null) total += d.bodyweight;
	if (d.asweight != null) total -= d.asweight;
	return total;
}

function calculateE1RM(reps, weight) {
	if (reps < 0) { throw new Error("invalid reps: %s", reps); }
	if (reps === 0) { return 0; }
    if (reps == 1) { return weight; }
    if (reps < 10) { return Math.round(weight / (1.0278 - 0.0278 * reps)); }
    else { return Math.round(weight / 0.75); }
}

function calculateEntry(entry) {
	entry.netweight = calculateNetWeight(entry);
	entry.e1rm = calculateE1RM(entry.reps, entry.weight);
	entry.volume = calculateVolume(entry);
}

function fillEntry(entry, entries) {
	calculateEntry(entry);

	let exercise = exerciseLookup[entry.xid];
	entry.muscles = exercise != null 
		? displayableMuscleComponents(exercise.muscles).map(m => m.fmaID)
		: [];

	let stats = getEntryStats(entry, entries);

	if (!entry.workout) {
		let nextWorkoutCutoff = stats.prevEntry.value
			? moment(stats.prevEntry.value).add(1, "hours")
			: moment();
		
		let isNewWorkout = !moment(entry.start).isBefore(nextWorkoutCutoff)

		let prevWorkoutID = stats.prevEntry.value
			? stats.prevEntry.entry.workout
			: 0;

		entry.workout = isNewWorkout
			? prevWorkoutID + 1
			: prevWorkoutID;
	}

	entry.intensity = stats.weightMax.value > 0
		? entry.netweight / stats.weightMax.value
		: 1.0;

	entry.xset = (stats.prevEntryX.entry
		? stats.prevEntryX.entry.xset
		: 0) + 1;

	entry.rset = (stats.prevEntryR.entry
		? stats.prevEntryR.entry.rset
		: 0) + 1;

	entry.xvolume = (stats.prevEntryX.entry
		? stats.prevEntryX.entry.xvolume
		: 0) + entry.volume;

	entry.tvolume = (stats.prevEntryX.entry
		? stats.prevEntry.entry.tvolume
		: 0) + entry.volume;

	entry.rvolume = stats.xvolumeMax.value > 0
		? entry.xvolume / stats.xvolumeMax.value
		: 1.0;

	if (jQuery.isNumeric(entry.duration)) {
		entry.xduration = (stats.prevEntryX.entry
			? stats.prevEntryX.entry.xduration
			: 0) + entry.duration;

		entry.tduration = stats.firstEntryW
			? moment.duration(entry.start - stats.firstEntryW.start).asSeconds() + entry.duration
			: entry.duration;
	}

	// Update Personal Records
	entry.pr = [];
	if (entry.netweight > stats.weightMax.value) { entry.pr.push(PR.WEIGHT); }
	if (entry.reps > stats.repsMax.value) { entry.pr.push(PR.REPS); }
	if (entry.xvolume > stats.xvolumeMax.value) { entry.pr.push(PR.VOLUME); }
	if (entry.rset > stats.rsetMax.value) { entry.pr.push(PR.SETS); }

	/* 
	Sanity checks
	*/

	if (jQuery.isNumeric(entry.duration)) {
		console.assert(jQuery.isNumeric(entry.xduration) && entry.duration >= 0, 
			`Invalid xduration: ${JSON.stringify(entry)}`);
		console.assert(jQuery.isNumeric(entry.tduration) && entry.duration >= 0, 
			`Invalid tduration: ${JSON.stringify(entry)}`);
	}
	console.assert(jQuery.isNumeric(entry.weight) && entry.weight >= 0, 
		`Invalid weight: ${JSON.stringify(entry)}`);
	console.assert(jQuery.isNumeric(entry.netweight) && entry.netweight >= 0, 
		`Invalid netweight: ${JSON.stringify(entry)}`);
	console.assert(Number.isInteger(entry.xset), 
		`Invalid xset: ${JSON.stringify(entry)}`);
	console.assert(Number.isInteger(entry.rset), 
		`Invalid rset: ${JSON.stringify(entry)}`);
}

function getEntryStats(e, data) {

	let stats = {
		prevEntry: { value: null, entry: null },
		prevEntryX: { value: null, entry: null },
		prevEntryR: { value: null, entry: null },
		firstEntryW: null,
		weightMax: { value: 0, entry: null },
		repsMax: { value: 0, entry: null },
		rsetMax: { value: 0, entry: null },
		xvolumeMax: { value: 0, entry: null }
	};

	for (let d of data) {
		if (e.weight && !e.netweight) {
			throw new Error("Missing netweight: " + entry);
		}
		
		if (d.start > e.start) 
			{ break; }

		if (d.start > stats.prevEntry.value) 
			{ 
				stats.prevEntry.entry = d; 
				stats.prevEntry.value = d.start; 
			}

		if (d.start > stats.prevEntryX.value && 
			d.xid == e.xid &&
			d.workout == e.workout)
			{
				stats.prevEntryX.entry = d;
				stats.prevEntryX.value = d.start; 
			}
		
		if (stats.firstEntryW == null && d.workout == e.workout) 
			{
				stats.firstEntryW = d;
			}

		if (d.start > stats.prevEntryR.value && 
			d.xid == e.xid && 
			d.reps == e.reps && 
			d.netweight == e.netweight &&
			d.workout == e.workout)
			{ 
				stats.prevEntryR.entry = d;
				stats.prevEntryR.value = d.start; 
			}

		if (d.netweight > stats.weightMax.value && d.xid == e.xid)
			{ 
				stats.weightMax.entry = d;
				stats.weightMax.value = d.netweight; 
			}

		if (d.reps > stats.repsMax.value &&
			d.xid == e.xid && 
			d.netweight == e.netweight)
			{ 
				stats.repsMax.entry = d;
				stats.repsMax.value = d.reps; 
			}

		if (d.rset > stats.rsetMax.value &&
			d.xid == e.xid &&
			d.reps == e.reps && 
			d.netweight == e.netweight)
			{ 
				stats.rsetMax.entry = d;
				stats.rsetMax.value = d.rset; 
			}

		if (d.xvolume > stats.xvolumeMax.value && 
			d.xid == e.xid)
			{ 
				stats.xvolumeMax.entry = d;
				stats.xvolumeMax.value = d.xvolume; 
			}
	};

	return stats;
}

function progressUpdater(selector) {
	let _max;
	let _progressContainer;
	let _progressElement;
	let _element;
	let _root;
	let _alert;
	let _progressHeader;
	let _progressFooter;
	let _progressHeaderTextFn;
	let _progressFooterTextFn;

	let _progressObserver = {
		onNext(progress) {
			if (!_progressElement) {
				_progressObserver.start(100);
			}
			if (!progress.total) {
				_progressElement.attr("max", 100);
			} else if (progress.loaded > progress.total) {
				_progressElement.attr("max", progress.loaded+1);
			} else {
				_progressElement.attr("max", progress.total);
			}
			_progressElement.attr("value", progress.loaded);
			if (_progressHeaderTextFn && _progressHeader) {
				_progressHeader.text(_progressHeaderTextFn(progress));
			}
			if (_progressFooterTextFn && _progressFooter) {
				_progressFooter.text(_progressFooterTextFn(progress));
			}
		},
		onError(error) {
			_progressContainer.remove();
			_alert = _root.append("div")
				.attr("class", "alert alert-danger")
				.attr("style", "margin-top: 0.5rem")
				.attr("role", "alert")
			_alert.append("strong")
				.text("Error: %s", error);
		},
		onCompleted() {
			_progressContainer.remove();
			_alert = _root.append("div")
				.attr("class", "alert alert-success")
				.attr("style", "margin-top: 0.5rem")
				.attr("role", "alert")
			_alert.append("strong")
				.text("Success");
		}
	};

	_progressObserver.start = function(max) {
		_max = max;
		_element = d3.select(selector);
		_root = d3.select(_element.node().parentNode);
		_element.attr("hidden", "true");
		_progressContainer = _root.append("div")
			.attr("style", "margin-top: 0.5rem");
		if (_progressHeaderTextFn) {
			_progressHeader = _progressContainer
				.append("span");
		}
		_progressElement = _progressContainer.append("progress")
			.attr("class", "progress progress-striped progress-animated no-bottom-pad")
			.attr("value", "100")
			.attr("max", _max || "100");
		if (_progressFooterTextFn) {
			_progressFooter = _progressContainer
				.append("small")
				.attr("class", "text-muted pull-xs-right");
		}
	};

	_progressObserver.header = function(header) {
		if (typeof header === "function") {
             _progressHeaderTextFn = header;
        } else {
			_progressHeaderTextFn = _ => header;
		}
        return _progressObserver;
    }

	_progressObserver.footer = function(footer) {
		if (typeof footer === "function") {
             _progressFooterTextFn = footer;
        } else {
			_progressFooterTextFn = _ => footer;
		}
        return _progressObserver;
    }

	return _progressObserver;
}

function recalculateAllEntries(progressObserver) {
	let progressEvent = {};
	let store = db.transaction(["entries"], "readwrite").objectStore("entries");
	req = store.count();
	req.onsuccess = e => { progressEvent.total = e.target.result };
	let entries = [];
	let i = 0;
	store.openCursor().onsuccess = function(event) {
		let cursor = event.target.result;
		if (cursor) {
			const entry = cursor.value;

			fillEntry(entry, entries);
			entries.push(entry)
			// TODO: handle store.onerror
			store.put(entry).onsuccess = _ => {
				cursor.continue();
			};
			progressEvent.loaded = i;
			if (progressEvent.total) {
				progressObserver.onNext(progressEvent);
			}
			++i;
		} else {
			progressObserver.onCompleted();
		}
	};
}

function deleteAllEntries() {
    db.close();
    let req = indexedDB.deleteDatabase("MuscleBookDatabase");
    req.onsuccess = function () {
        alert("Deleted database successfully");
    };
    req.onerror = function () {
        alert("Couldn't delete database");
    };
    req.onblocked = function () {
        alert("Couldn't delete database due to the operation being blocked");
    };
}

function importAllEntries(entries, progressObserver) {
	let tx = db.transaction(["entries"], "readwrite");
	let store = tx.objectStore("entries");
	let progressEvent = {};
	tx.oncomplete = _ => {
		progressObserver.onCompleted();
	}
	tx.onerror = e => { 
		progressObserver.onError(e);
	}
	let i = 0;
	progressEvent.total = entries.length-1;
	putNext = _ => {
		if (i < entries.length) {
			const inentry = entries[i];
			const entry = {};
			
			/* 
			Input Fields 
			*/

			entry.id = +inentry.workset_id;
			entry.workout = +inentry.workout_id;
			entry.xid = +inentry.exercise_id;
			entry.exerciseName = inentry.exercise_name;
			entry.start = new Date(inentry.start_time);
			entry.duration = +inentry.duration;
			entry.reps = +inentry.reps;
			entry.weight = +inentry.weight;
			entry.asweight = +inentry.assistance_weight;
			entry.bodyweight = +inentry.bodyweight;
			entry.failure = +inentry.failure;
			entry.warmup = +inentry.warmup;
			entry.unit = "lbs";

			/*
			Fixup
			*/

			if (entry.duration == entry.reps) {
				entry.duration = null;
			}

			if (entry.bodyweight > 0 && entry.weight > 0 && entry.bodyweight < entry.weight) 
			{
				if (entry.id != 3231 || entry.id != 3230) {
					console.log(`Unexpected fixup id: ${entry.id}: bodyweight: ${entry.bodyweight}, weight: ${entry.weight}`);
				}
				let w = entry.weight;
				entry.weight = entry.bodyweight;
				entry.bodyweight = w;
				console.log(`Fixed id: ${entry.id}: bodyweight: ${entry.bodyweight}, weight: ${entry.weight}`);
			}

			if (entry.weight == 0) {
				if (entry.xid == 426 || // pull up w/o bodyweight
					entry.xid == 641 || // crunches
					entry.xid == 539 || // chest dip
					entry.xid == 424)   // chin up
				{
					entry.bodyweight = 180;
					console.log(`Fixed id: ${entry.id}: bodyweight: ${entry.bodyweight}, weight: ${entry.weight}`);
				}
			}

			/*
			Finally, store the entry (put, each entry must already have an entryID), 
			report progress, and continue (if there are more entries).
			*/

			store.put(entry).onsuccess = putNext;
			progressEvent.loaded = i;
			progressObserver.onNext(progressEvent);
		}
		++i;
	}
	putNext();
}

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

function orderGroup(d) {
    return d[curMetric].value() || 0;
}

function updateDateRange(range) {
    if (!range) { return; }
    $("#start-date-input").val(moment(range[0]).format("YYYY-MM-DD"));
    $("#end-date-input").val(moment(range[1]).format("YYYY-MM-DD"));
    onAnyFilterChange();
}

function valueAccessor(d) {
    if (!d.value) { return 0; }
    return d.value[curMetric].value();
}

function exportJSON() {
    let data = entries.all();
    download(JSON.stringify(data, null, 4), "workouts.json", "application/json");
}

function sizeToFitRoot(element) {
    let width = element.root()[0][0].offsetWidth;
    element.width(width);
}

function resizeAllCharts() {
    sizeToFitRoot(muscleBarChart);
    sizeToFitRoot(timeChart);
    sizeToFitRoot(dayOfWeekChart);
    sizeToFitRoot(exerciseChart);

    let calWidth = workoutCalendar.root()[0][0].offsetWidth;
    if (calWidth < 544) {
        workoutCalendar.daysBack(240);
    } else {
        workoutCalendar.daysBack(365);
    }
}

function onImportFileSelect(event) {
	let importButtonContainer = $("#import-button-container");
	let file = event.target.files[0];
	if (file != null) importButtonContainer.collapse("show");
	else importButtonContainer.collapse("hide");
}

function resetDateRangeFilter() {
    let rangeStart = moment(today).subtract(1, "week");
    timeChart.replaceFilter(dc.filters.RangedFilter(rangeStart, today));
    rangeStart = moment(today).subtract(1, "month");
    timeChart.x().domain([rangeStart, today]);
    dc.redrawAll();
    timeChart.turnOffControls();
    scaleStack = [];
}

function updateMetric(metric) {
    curMetric = metric;
    return dc;
}

function formatDuration(d) {
    //return `${d.toLocaleString()}s`;
    let dur = moment.duration(d, "seconds");
    let hours = dur.get("hours");
    let mins = dur.get("minutes");
    if (mins == 0 && hours == 0) return "?";
    if (mins == 0) return `${hours}h`;
    if (hours == 0) return `${mins}m`;
    return `${hours.toFixed(0)}h, ${mins.toFixed(0)}m`;
}

function titleForCurMetric(m,d) {
    if (!d.value) { return m; }
    let group = d.value;
    switch(curMetric) {
        case "intensity":
            let intensity = group.intensity.formatted();
            let weight = group.weight.formatted();
            return `${m}<br/>Intensity: ${intensity} (${weight})`
        case "rvolume":
            let volume = group.volume.formatted();
            let volumePercent = group.rvolume.formatted();
            return `${m}<br/>Volume: ${volume} (${volumePercent})`
        case "duration":
            let duration = group.duration.formatted();
            return `${m}<br/>Duration: ${duration}`;
    }
}

function entryFromFields() {
	let xid = d3.select("#newentry-modal")[0][0].dataset.xid
	console.assert(xid !== null, "Missing xid");
	let entry = {};
	entry.xid = xid;
	let date = this.validate("#date-input", v => moment(v, "YYYY-MM-DD"));
	let time = this.validate("#time-input", v => moment(v, "HH:mm"));
	if (date.isValid() && time.isValid()) {
		let start = moment({
			years: date.year(), 
			months: date.month(), 
			date: date.date(),
			hours: time.hour(),
			minutes: time.minute(),
			seconds: time.second(),
			milliseconds: time.millisecond()
		});
		if (start.isValid()) entry.start = start.toDate();
	}
	entry.duration = this.validate("#duration-input", v => moment.duration(v).asSeconds() > 0 ? moment.duration(v).asSeconds() / 1000 : null);
	entry.weight = this.validate("#weight-input", v => +v > 0 ? +v : null);
	entry.reps = this.validate("#reps-input", v => +v > 0 ? +v : null);
	entry.warmup = $("#warmup-input").prop("checked") ? true : false;
	entry.failure = $("#failure-input").prop("checked") ? true : false;
	if (entry.start == null || 
		entry.duration == null || 
		entry.weight == null ||
		entry.reps == null) {
		return null;
	}
	fillEntry(entry, entries.all());
	return entry;
}

function showNewEntryModal(xid) {
	let exercise = exerciseLookup[xid]
	
	let updateDateAndTimeFields = _ => {
		let start = moment(stopwatch.initialTime ? stopwatch.initialTime : new Date);
		$("#date-input").val(start.format("YYYY-MM-DD"));
		$("#time-input").val(start.format("HH:mm"));
	};

	stopwatch.onStart = updateDateAndTimeFields;

	updateDateAndTimeFields();

	d3.select("#newentry-modal")
		.attr("data-xid", xid);

	d3.select("#exercise-title")
		.text(exercise.name)
		.append("a")
		.attr("class", "pull-xs-right")
		.html("&#x24D8;")
		.attr("href", d => "exercise.html?xid=" + xid);
	
	let inputOpts = exercise.inputs.map(d => "entry-input-opt-" + d);
	d3.select(".entry-inputs")
		.selectAll(".input-group")
		.filter(".opt")
		.data(inputOpts, function(d) { return d || this.id; })
		.attr("hidden", null)
		.exit().attr("hidden", "true");
}

function saveEntry() {
	let entry = this.entryFromFields();
	if (!entry) { return; }
	let store = db.transaction("entries", "readwrite").objectStore("entries");
	let req = store.add(entry);
	entries.add([entry]);
	req.onsuccess = function (evt) {
		$("#newentry-modal").modal("hide");
		stopwatch.reset();
		console.log(entries.size());
		console.log(entries.all());
		console.log(dateGroup.all());
        $("#weight-input").val("");
        $("#reps-input").val("");
        $("#warmup-input").val("");
        $("#failure-input").val("");
		dc.redrawAll();
	};
	req.onerror = function() {
		alert("addPublication error", this.error);
	};
}

function importSelectedFile() {
	let fileInput = $("input:file");
	let file = $fileInput.get(0).files[0];
	let reader = new FileReader();
	reader.onload = e => { 
		console.log(e.target.result);
		let data = d3.csv.parse(e.target.result);
		importAllEntries(data, 
			progressUpdater(".replace-on-import")
				.header("Importing...")
				.footer(e => e.loaded + " of " + e.total));
	}
	reader.readAsText(file);
}

function recalculateAllEntriesWithProgress() {
	recalculateAllEntries(progressUpdater("#calculate-all-button")
		.header("Recalculating...")
		.footer(e => e.loaded + " of " + e.total));
}

function validate(field, fx=(v => v)) {
	let value = fx($(field).val());
	if (!value) {
		$(field).addClass("form-control-danger")
		$(field).closest(".input-group").addClass("has-danger")
	} else {
		$(field).removeClass("form-control-danger")
		$(field).closest(".input-group").removeClass("has-danger")
	}
	return value;
}

function onAnyFilterChange() {
    let stats = d3.select("#statistics");
    stats.selectAll("li").remove();

    // statistics
    // Max Weight     305 lbs
    // Ave Intensity  
    // Total Volume   21,000 lbs
    // Total Duration 6.9 hours
    // Total Rest     5.1 hours
    // Total Active   1.8 hours
    // Active:Rest    1:3.8
    // Workouts       10
    // Exercises      6
    // Days           14

    stats
        .append("li")
            .attr("class", "list-group-item")
        .append("span")
            .text("Exercises")
        .append("span")
            .attr("class", "pull-xs-right")
            .text(allEntriesGroup.value().exercises.exceptionCount);
    stats
        .append("li")
            .attr("class", "list-group-item")
        .append("span")
            .text("Workouts")
        .append("span")
            .attr("class", "pull-xs-right")
            .text(allEntriesGroup.value().workouts.exceptionCount);
    stats
        .append("li")
            .attr("class", "list-group-item")
        .append("span")
            .text("Days")
        .append("span")
            .attr("class", "pull-xs-right")
            .text(allEntriesGroup.value().days.exceptionCount);
}

function loadFromRemoteData(url) {
	d3.json(url, function(data) {
		for (entry of data) {
			entry.start = new Date(entry.start);
		}
		dataReady(data);
	});
}

function databaseReady() {
	getAllEntries(dataReady);
}

function dataReady(data) {
	minDate = moment(d3.min(data, d => d.start)).startOf('day');
	entries.add(data);
	dc.renderAll();
	console.log(entries.size());
	console.log(entries.all());
	console.log(dateGroup.all());
}

let windowWidth = window.innerWidth;
let daysOfTheWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let today = moment(new Date()).endOf('day');
let oneMonthAgo = moment(today).subtract(1, "month");
let oneWeekAgo = moment(today).subtract(1, "week");

let curMetric = "intensity";
let minDate = null;
var stopwatch = new Stopwatch();
let scaleStack = [];

let colors = colorbrewer.OrRd[5];
colors[0] = "#f5f5f5";
let colorScales = {
    intensity: d3
        .scale
        .threshold()
        .domain([0.1, 0.5, 0.8, 1.0])
        .range(colors),
    rvolume: d3
        .scale
        .threshold()
        .domain([0.1, 0.5, 0.8, 1.0])
        .range(colors),
    duration: d3
        .scale
        .threshold()
        .domain([1, 3600, 5400, 7200])
        .range(colors)
};

var colorScaleProxy = new Proxy(function() {}, {
    get (_, key) {
        return colorScales[curMetric][key];
    },
    apply (_, pthis, args) {
        return colorScales[curMetric](args);
    }
});

let entries = crossfilter([]);
let dateDimension = entries.dimension(d => d.start);
let muscleDimension = entries.dimension(d => d.muscles, true);
let prDimension = entries.dimension(d => d.pr, true);
let excerciseDimension = entries.dimension(d => d.xid);

let dayOfWeek = entries.dimension(d => {
    let day = d.start.getDay();
    return day + '.' + daysOfTheWeek[day];
});

let dateGroup = dateDimension.group(d3.time.day);
metricReducer(dateGroup);
dateGroup.order(orderGroup);

let muscleGroup = muscleDimension.group();
metricReducer(muscleGroup);
muscleGroup.order(orderGroup);

let excerciseGroup = excerciseDimension.group();
metricReducer(excerciseGroup);
excerciseGroup.order(orderGroup);

let dayOfWeekGroup = dayOfWeek.group();
metricReducer(dayOfWeekGroup);
dayOfWeekGroup.order(orderGroup);

let allEntriesGroup = entries.groupAll();
statsReducer(allEntriesGroup);

let workoutCalendar = dc.calendarGraph("#cal-graph")
    .valueAccessor(valueAccessor)
    .margins({top: 30, right: 0, bottom: 20, left: 25})
    .group(dateGroup)
    .dimension(dateDimension)
    .colors(colorScaleProxy)
    .title(d => titleForCurMetric(moment(d.key).format("ddd, MMM D, YYYY"), d))
    .tip("#cal-tip");

//let yExtent = d3.extent(dateGroup.all(), d => d.value.value === 0 ? null : d.value.value);

let timeChart = dc.barChart("#time-chart")
    .valueAccessor(valueAccessor)
    .height(130)
    .gap(1)
    .transitionDuration(1000)
    .margins({top: 20, right: 20, bottom: 20, left: 38})
    .dimension(dateDimension)
    .group(dateGroup)
    .colorDomain(colorbrewer.Reds[3])
    .x(d3.time.scale().domain([oneMonthAgo, today]))
    //.y(d3.scale.pow().exponent(3))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .turnOffControls()
    .on("filtered", (chart, filter) => {
        updateDateRange(filter);
    });

let rangeStart = moment(today).subtract(1, "week");
timeChart.filter(dc.filters.RangedFilter(rangeStart, today));
timeChart.xAxis().ticks(3);
timeChart.yAxis().ticks(3, ",.1s");
// https://github.com/dc-js/dc.js/issues/991
timeChart._disableMouseZoom = function() {};

let muscleBarChart = dc.rowChart("#muscle-bar-chart")
    .valueAccessor(valueAccessor)
    .height(260)
    .margins({top: 20, left: 20, right: 20, bottom: 20})
    .group(muscleGroup)
    .dimension(muscleDimension)
    .cap(11)
    .gap(1)
    .othersGrouper(false)
    .ordering(d => -d.value.value)
    .ordinalColors(colorbrewer.Reds[3].slice(-1))
    .label(d => {
        var ex = muscleLookup[d.key]; 
        if (ex != null) {
            return ex.name
        }
        return d.key
    })
    .title(d => valueAccessor(d).toFixed(2))
    .elasticX(true)
    .on("filtered", onAnyFilterChange);

muscleBarChart.xAxis().ticks(2);

let dayOfWeekChart = dc.rowChart("#day-of-week-chart")
    .valueAccessor(valueAccessor)
    .height(200)
    .margins({top: 20, left: 20, right: 20, bottom: 20})
    .group(dayOfWeekGroup)
    .gap(1)
    .dimension(dayOfWeek)
    .ordinalColors(colorbrewer.Reds[3].slice(-1))
    .label( d => d.key.split('.')[1] )
    .title( d => d.value.value )
    .elasticX(true)
    .on("filtered", onAnyFilterChange);

dayOfWeekChart.xAxis().ticks(4);

let exerciseChart =  dc.rowChart("#exercise-chart")
    .valueAccessor(valueAccessor)
    .height(260)
    .margins({top: 20, left: 20, right: 20, bottom: 20})
    .group(excerciseGroup)
    .dimension(excerciseDimension)
    .cap(10)
    .gap(1)
    .othersGrouper(false)
    .ordering(function(d){return -d.value.value;})
    .ordinalColors(colorbrewer.Reds[3].slice(-1))
    .label(function (d) {
        var ex = exerciseLookup[d.key]; 
        if (ex != null) {
            return ex.name
        }
        return d.key
    })
    .title(function (d) { return d.value.value; })
    .elasticX(true)
    .on("filtered", onAnyFilterChange);

exerciseChart.xAxis().ticks(3);

let anteriorDiagram = dc.anatomyDiagram("#anatomy-diagram-left")
    .anterior()
    .valueAccessor(valueAccessor)
    .group(muscleGroup)
    .dimension(muscleDimension)
    .colors(colorScaleProxy)
    .title(d => titleForCurMetric(muscleLookup[d.key].name, d))
    .on("filtered", onAnyFilterChange)
    .tip("#anatomy-tip");

let posteriorDiagram = dc.anatomyDiagram("#anatomy-diagram-right")
    .posterior()
    .valueAccessor(valueAccessor)
    .group(muscleGroup)
    .dimension(muscleDimension)
    .colors(colorScaleProxy)
    .title(d => titleForCurMetric(muscleLookup[d.key].name, d))
    .on("filtered", onAnyFilterChange)
    .tip("#anatomy-tip");

let exerciseListItem = d3.select("#exercise-list")
	.selectAll("a")
	.data(d3.entries(exerciseLookup))
	.enter()
	.append("a")
	.attr("class", "list-group-item list-group-item-action")
	.attr("role", "button")	
	.attr("data-dismiss", "modal")
	.attr("data-toggle", "modal")
	.attr("data-backdrop", "static")
	.attr("data-target", "#newentry-modal")
	.attr("onclick", d => "showNewEntryModal(" + d.key + ");");	

exerciseListItem.append("a")
	.attr("href", d => { return "exercise.html?xid=" + d.key })
	.attr("class", "pull-xs-right")
	.html("&#x24D8;");

exerciseListItem.append("span")
	.attr("class", "name")
	.text(d => { return d.value.name });

resizeAllCharts();

let exerciseListList = new List("exercise-list-container", { valueNames: ["name"] });

timeChart.turnOnControls = function () {
    if (timeChart.root()) {
        var attribute = timeChart.controlsUseVisibility() ? "visibility" : "display";
        d3.selectAll("#reset-date-range").style(attribute, null);
        timeChart.selectAll(".filter").text(timeChart.filterPrinter(timeChart.filters())).style(attribute, null);
    }
    return timeChart;
};

timeChart.turnOffControls = function () {
    if (timeChart.root()) {
        var attribute = timeChart.controlsUseVisibility() ? "visibility" : "display";
        var value = timeChart.controlsUseVisibility() ? "hidden" : "none";
        d3.selectAll("#reset-date-range").style(attribute, value);
        timeChart.selectAll(".filter").style(attribute, value).text(timeChart.filter());
    }
    return timeChart;
};

timeChart.zoomIn = function(domain) {
    scaleStack.push(timeChart.x().domain());
    let filter = !arguments.length
        ? timeChart.filters()[0]
        : domain;
    timeChart.x().domain(filter);
    dc.redrawAll();
    timeChart.turnOnControls();
}

timeChart.zoomOut = function() {
    let scale = scaleStack.pop();
    if (!scale) {
        scale = [minDate, today];
    }
    timeChart.x().domain(scale);
    dc.redrawAll();
    timeChart.turnOnControls();
}

timeChart.panLeft = function() {
    let domain = timeChart.x().domain().map(d => moment(d));
    let filter = timeChart.filter().map(d => moment(d));
    let diff = filter[1] - filter[0];
    filter[0].subtract(diff, "milliseconds");
    filter[1].subtract(diff, "milliseconds");
    if (filter[0].isBefore(minDate)) {
        filter[0] = minDate;
        filter[1] = filter[0].clone();
        filter[1].add(diff, "milliseconds");
    } 
    if (filter[0].isBefore(domain[0])) {
        domain[0].subtract(diff, "milliseconds");
        if (domain[0].isBefore(minDate)) {
            domain[0] = minDate;
        } else {
            domain[1].subtract(diff, "milliseconds");
        }
        timeChart.x().domain(domain);
    }
    timeChart.brush().extent(filter);
    timeChart.replaceFilter(dc.filters.RangedFilter(filter[0], filter[1]));
    dc.redrawAll();
}

timeChart.panRight = function() {
    let domain = timeChart.x().domain().map(d => moment(d));
    let filter = timeChart.filter().map(d => moment(d));
    let diff = filter[1] - filter[0];
    filter[0].add(diff, "milliseconds");
    filter[1].add(diff, "milliseconds");
    if (filter[1].isAfter(today)) {
        filter[1] = today;
        filter[0] = filter[1].clone();
        filter[0].subtract(diff, "milliseconds");
    }
    if (filter[1].isAfter(domain[1])) {
        domain[1].add(diff, "milliseconds");
        if (domain[1].isAfter(today)) {
            domain[1] = today;
        } else {
            domain[0].add(diff, "milliseconds");
        }
        timeChart.x().domain(domain);
    }
    timeChart.replaceFilter(dc.filters.RangedFilter(filter[0], filter[1]));
    dc.redrawAll();
}

window.onresize = function(event) {
    if (windowWidth == window.innerWidth) return;
    windowWidth = window.innerWidth;
    resizeAllCharts();
    dc.renderAll();
};

function metricChanged(event) {
	if (!event.target.checked) return;
	let metric = event.target.value;
	updateMetric(metric);
	dc.redrawAll()
}

function prFilterChanged(event) {
	let types = new Set($("input:checkbox[name=pr-filter]:checked")
		.map(function(){return $(this).val()}).get());
	prDimension.filter(t => types.size > 0 ? types.has(t) : true);
	dc.redrawAll();
}

// http://stackoverflow.com/a/2880929/952123
var match,
	pl     = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query  = window.location.search.substring(1);
var urlParams = {};
while (match = search.exec(query))
	urlParams[decode(match[1])] = decode(match[2]);
var remoteData = urlParams["data"];

if (remoteData) loadFromRemoteData(remoteData);
else loadFromDB();
