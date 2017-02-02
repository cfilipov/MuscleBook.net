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

 entry fields
+--------------+
| id           |
| xid          |
| start        |
| duration     |
| reps         |
| weight       |
| asweight     |
| bodyweight   |
| failure      |
| warmup       |
| unit         |
| exerciseName |     
| xcalc -------|-----+
+--------------+     |
                     |
 xcalc fields    <---+
+--------------+ 
| netweight    |
| e1rm         |
| volume       |
| workout      |
| intensity    |
| xset         |
| rset         |
| xvolume      |
| rvolume      |
| restdur      |
| combdur      |
| prs          |
+--------------+

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

Metrics
-------

* Workouts are broken down into _sets_ of exercises.
* Each set is associated with *exactly one* exercise.
* Each set is performed at one specific _weight_.
* Each set consists of one or more _reps_ (repetitions) of an exercise at that weight.*

For example, Alice performs a 225lbs deadlift for 5 reps. The repeats this 3 times. Thus, Alice has performed 3 sets of 5 reps at 225lbs, or 3x5@225. After those 3 sets, Alice decides to test her max, so she performs a single set at 275bs, or 1x1@275. In total, Alice performed 4 sets, 3 of them at 225lbs for 5 reps and 1 of them at 275 for a single rep.

So how did Alice do on her workouts? In weight training there are two metrics that matter most: volume and intensity. 

Volume

Volume is just the total weight moved, calculated by multiplying the reps and weight and summing that for all sets. Alice's workout had a volume of 3,650lbs (3x5x225 + 1x1x275 = 3,375 + 275 = 3,650).

Intensity

Intensity is how heavy the lift was compared to past performance. If Alice's best deadlift in the past was 270lbs, then her first three sets had an intensity of 83% (225/270x100). Her final set's intensity was 101.8%. From that point on, when calculating intensity, 101.8% will be used. For example, if Alice lifts 3x5@225 tomorrow, her intensity will be 81%, not 83%. By the way, intensity is not retroactive. When looking back at today, that 3x3@225 is still 83% because intensity is based on the max weight *up to that workout*.

Intensity is easy to understand at the level of individual sets, as we have demonstrated. But what's the intensity of a whole workout? It might be tempting to take the average to intensities of all the sets of a workout, but that would drag down the average from accessory exercises. Even if you filter out accessory and warmup sets, taking the average hides the fact that this workout involved a personal-record breaking lift, so the max intensity is a better measure. This workout thus had an intensity of 101.8%.
*/

let db = null;

const PR = {
	WEIGHT :"weight", 
	VOLUME :"volume", 
	SETS :"sets", 
	REPS :"reps", 
	FIRST :"first"
}

const colorPalette = [
    // Brewer Color Schemes http://www.graphviz.org/doc/info/colors.html
    "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#e5d8bd",
    "#fddaec", "#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
    "#b3de69", "#fccde5", "#ccebc5", "#ffed6f", "#bc80bd", "#a6cee3",
    "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#fdbf6f", "#ff7f00",
    "#cab2d6", "#e31a1c", "#9e0142", "#d53e4f", "#f46d43", "#fdae61",
    "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd",
    "#5e4fa2", "#ffffb3"
];

const migration = {
	1: db => {
		const objectStore = db.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
		objectStore.createIndex("start", "start", { unique: false });
		objectStore.createIndex("xid", "xid", { unique: false });
	},
	2: db => {
		const progressEvent = {};
		const store = db.transaction(["entries"], "readwrite").objectStore("entries");
		let prevEntry = null;
		store.openCursor().onsuccess = function(event) {
			let cursor = event.target.result;
			if (cursor) {
				const entry = cursor.value;
				if (prevEntry.workout == entry.workout && prevEntry.duration && entry.duration) {
					entry.xcalc.restdur = moment.duration(entry.start - prevEntry.start).asSeconds() - prevEntry.duration;
					entry.xcalc.combdur = entry.duration + entry.restdur;
					delete entry.xcalc.xduration;
					delete entry.xcalc.tduration;
				}
				store.put(entry).onsuccess = _ => {
					cursor.continue();
				};
				++i;
			}
		};
	}
}

function loadFromDB() {
	console.log("loading db...");

	const dbOpen = window.indexedDB.open("MuscleBookDatabase", 1);

	dbOpen.onerror = event => {
		alert(event.target.errorCode);
	};

	dbOpen.onsuccess = event => {
		console.log("db loaded.");
		db = event.target.result;
		db.onversionchange = event => {
			console.log("db version change.");
			db.close();
			alert("A new version of this page is ready. Please reload the page.");
		};
		databaseReady();
	};

	dbOpen.onupgradeneeded = event => {
		console.log("migrating db...");
		db = event.target.result;
		for (let i = event.oldVersion + 1; i <= event.newVersion; i++) {
			if (!migration[i]) continue;
			migration[i](db);
		}
	};
}

function metricAggregate(metric) {
    switch(metric) {
        case "intensity": return ["max", "avg"];
		case "weight": return ["max", "avg"];
        case "volume": return ["sum", "avg", "max"];
        case "activedur": return ["sum", "avg", "max"];
		case "restdur": return ["sum", "avg", "max"];
		case "combdur": return ["sum", "avg", "max"];
		case "sets": return ["exceptionCount"];
		case "reps": return ["max", "avg", "sum"];
		case "workouts": return ["exceptionCount"];
		case "exercises": return ["exceptionCount"];
    }
}

function metricFormat() {
	const metric = arguments.length == 2 ? arguments[0] : curMetric;
	const value = arguments.length == 2 ? arguments[1] : arguments[0];
    switch(metric) {
        case "intensity": return `${(value * 100).toFixed(2)}%`;
		case "weight": return `${value.toLocaleString()} lbs`;
        case "volume": return `${value.toLocaleString()} lbs`;
        case "activedur": return formatDuration(value);
		case "restdur": return formatDuration(value);
		case "combdur": return formatDuration(value);
		case "sets": return `${Math.max(1, value.toFixed(0))} sets`;
		case "xsets": return `${Math.max(1, value.toFixed(0))} sets`;
		case "rsets": return `${Math.max(1, value.toFixed(0))} sets`;
		case "reps": return `${Math.max(1, value.toFixed(0))} reps`;
		case "workouts": return `${value} workouts`;
		case "exercises": return `${value} exercises`;
    }
}

function toggleBrush(event) {
	const active = !event.currentTarget.classList.contains("active");
	timeChart.brushOn(active);
	timeChart.render();
}

function metricReducer(group) {
	const reducer = reductio();
	reducer.value("intensity")
		.filter(e => !e.warmup)
		.max(e => e.xcalc.intensity)
		.avg(e => e.xcalc.intensity);
	reducer.value("weight")
		.filter(e => jQuery.isNumeric(e.xcalc.netweight))
		.max(e => e.xcalc.netweight)
		.avg(e => e.xcalc.netweight);
	reducer.value("volume")
		.filter(e => jQuery.isNumeric(e.xcalc.netweight))
		.max(e => e.xcalc.volume)
		.avg(e => e.xcalc.volume)
		.sum(e => e.xcalc.volume);
	reducer.value("activedur")
		.filter(e => jQuery.isNumeric(e.duration))
		.max(e => e.duration)
		.avg(e => e.duration)
		.sum(e => e.duration);
	// reducer.value("restdur")
	// 	.max(e => e.xcalc.rduration)
	// 	.avg(e => e.xcalc.rduration)
	// 	.sum(e => e.xcalc.rduration);
	// reducer.value("combdur")
	// 	.max(e => e.duration + e.xcalc.rduration)
	// 	.avg(e => e.duration + e.xcalc.rduration)
	// 	.sum(e => e.duration + e.xcalc.rduration);
	reducer.value("sets")
		.exception(e => e.id)
		.exceptionCount(true);
	reducer.value("xsets")
		.filter(e => jQuery.isNumeric(e.xcalc.xset))
		.max(e => e.xcalc.xset);
	reducer.value("rsets")
		.filter(e => jQuery.isNumeric(e.xcalc.rset))
		.max(e => e.xcalc.rset);
	reducer.value("reps")
		.filter(e => jQuery.isNumeric(e.reps))
		.max(e => e.reps)
		.avg(e => e.reps)
		.sum(e => e.reps);
	reducer.value("workouts")
		.exception(e => e.workout)
		.exceptionCount(true);
	reducer.value("exercises")
		.exception(e => e.xid)
		.exceptionCount(true);
	reducer(group);
}

function statsReducer(group) {
	const reducer = reductio();
	reducer.value("exercises")
		.exception(d => d.xid)
		.exceptionCount(true);
	reducer.value("workouts")
		.exception(d => d.workout)
		.exceptionCount(true);
	reducer.value("days")
		.exception(d => moment(d.start).format("ll"))
		.exceptionCount(true);
	reducer.value("rest")
		.sum(d => d.duration);
	reducer.value("duration")
		.sum(d => d.xcalc.restdur);
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
	const slice = Array.prototype.slice;
	const f = function() {
		var args = slice.call(arguments);
		if (args in memo) return memo[args];
		else return (memo[args] = func.apply(this, args));
	}
	f.reset = () => {
		memo = {};
	}
	return f;
}

function getAllEntries(onCompleted) {
	const results = [];
	const objectStore = db.transaction(["entries"]).objectStore("entries");
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
	let total = 0;
	if (jQuery.isNumeric(d.weight)) total += d.weight;
	if (jQuery.isNumeric(d.bodyweight)) total += d.bodyweight;
	if (jQuery.isNumeric(d.asweight)) total -= d.asweight;
	return total;
}

function calculateE1RM(reps, weight) {
	if (reps < 0) throw new Error("invalid reps: %s", reps);
	if (reps === 0) return 0;
    if (reps == 1) return weight;
    if (reps < 10) return Math.round(weight / (1.0278 - 0.0278 * reps));
    else return Math.round(weight / 0.75);
}

function calculateEntry(entry) {
	entry.xcalc.netweight = calculateNetWeight(entry);
	entry.xcalc.e1rm = calculateE1RM(entry.reps, entry.weight);
	entry.xcalc.volume = calculateVolume(entry);
}

function fillEntry(entry, entries) {
	entry.xcalc = {};
	calculateEntry(entry);
	const exercise = exerciseLookup[entry.xid];
	entry.xcalc.muscles = exercise != null 
		? [...(new Set(displayableMuscleComponents(exercise.muscles).map(m => m.fmaID)))]
		: [];
	const stats = getEntryStats(entry, entries);

	if (!entry.workout) {
		const nextWorkoutCutoff = stats.prevEntry.value
			? moment(stats.prevEntry.value).add(1, "hours")
			: moment();
		const isNewWorkout = !moment(entry.start).isBefore(nextWorkoutCutoff);
		const prevWorkoutID = stats.prevEntry.value
			? stats.prevEntry.entry.workout
			: 0;
		entry.workout = isNewWorkout
			? prevWorkoutID + 1
			: prevWorkoutID;
	}

	entry.xcalc.intensity = stats.weightMax.value > 0
		? entry.xcalc.netweight / stats.weightMax.value
		: 1.0;

	entry.xcalc.xset = (stats.prevEntryX.entry
		? stats.prevEntryX.entry.xcalc.xset
		: 0) + 1;

	entry.xcalc.rset = (stats.prevEntryR.entry
		? stats.prevEntryR.entry.xcalc.rset
		: 0) + 1;

	entry.xcalc.xvolume = (stats.prevEntryX.entry
		? stats.prevEntryX.entry.xcalc.xvolume
		: 0) + entry.xcalc.volume;

	entry.xcalc.tvolume = (stats.prevEntryX.entry
		? stats.prevEntry.entry.xcalc.tvolume
		: 0) + entry.xcalc.volume;

	entry.xcalc.rvolume = stats.xvolumeMax.value > 0
		? entry.xcalc.xvolume / stats.xvolumeMax.value
		: 1.0;

	if (jQuery.isNumeric(entry.duration)) {
		entry.xcalc.xduration = (stats.prevEntryX.entry
			? stats.prevEntryX.entry.xcalc.xduration
			: 0) + entry.duration;

		entry.xcalc.tduration = stats.firstEntryW
			? moment.duration(entry.start - stats.firstEntryW.start).asSeconds() + entry.duration
			: entry.duration;
	}

	// Update Personal Records
	entry.xcalc.prs = [];
	if (entry.xcalc.netweight > stats.weightMax.value) entry.xcalc.prs.push(PR.WEIGHT);
	if (entry.reps > stats.repsMax.value) entry.xcalc.prs.push(PR.REPS);
	if (entry.xcalc.xvolume > stats.xvolumeMax.value) entry.xcalc.prs.push(PR.VOLUME);
	if (entry.xcalc.rset > stats.rsetMax.value) entry.xcalc.prs.push(PR.SETS);

	/* 
	Sanity checks
	*/

	if (jQuery.isNumeric(entry.duration)) {
		console.assert(jQuery.isNumeric(entry.xcalc.xduration) && entry.duration >= 0, 
			`Invalid xduration: ${JSON.stringify(entry)}`);
		console.assert(jQuery.isNumeric(entry.xcalc.tduration) && entry.duration >= 0, 
			`Invalid tduration: ${JSON.stringify(entry)}`);
	}
}

function getEntryStats(e, data) {

	const stats = {
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
		if (e.weight && !e.xcalc.netweight) throw new Error("Missing netweight: " + entry);
		if (d.start > e.start) break;

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
			d.xcalc.netweight == e.xcalc.netweight &&
			d.workout == e.workout)
			{ 
				stats.prevEntryR.entry = d;
				stats.prevEntryR.value = d.start; 
			}

		if (d.xcalc.netweight > stats.weightMax.value && 
			d.xid == e.xid)
			{ 
				stats.weightMax.entry = d;
				stats.weightMax.value = d.xcalc.netweight; 
			}

		if (d.reps > stats.repsMax.value &&
			d.xid == e.xid && 
			d.xcalc.netweight == e.xcalc.netweight)
			{ 
				stats.repsMax.entry = d;
				stats.repsMax.value = d.reps; 
			}

		if (d.xcalc.rset > stats.rsetMax.value &&
			d.xid == e.xid &&
			d.reps == e.reps && 
			d.xcalc.netweight == e.xcalc.netweight)
			{ 
				stats.rsetMax.entry = d;
				stats.rsetMax.value = d.xcalc.rset; 
			}

		if (d.xcalc.xvolume > stats.xvolumeMax.value && 
			d.xid == e.xid)
			{ 
				stats.xvolumeMax.entry = d;
				stats.xvolumeMax.value = d.xcalc.xvolume; 
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
	const progressEvent = {};
	const store = db.transaction(["entries"], "readwrite").objectStore("entries");
	req = store.count();
	req.onsuccess = e => { progressEvent.total = e.target.result };
	const entries = [];
	let i = 0;
	store.openCursor().onsuccess = function(event) {
		let cursor = event.target.result;
		if (cursor) {
			const entry = copyEntryInput(cursor.value);
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

function copyEntryInput(entry) {
	const e = {};
	e.id = +entry.id;
	e.workout = +entry.workout;
	e.xid = +entry.xid;
	e.exerciseName = entry.exerciseName;
	e.start = new Date(entry.start);
	e.duration = +entry.duration > 0 ? +entry.duration : null;
	e.reps = +entry.reps > 0 ? +entry.reps : null;
	e.weight = +entry.weight > 0 ? +entry.weight : null;
	e.asweight = +entry.asweight > 0 ? +entry.asweight : null;
	e.bodyweight = +entry.bodyweight > 0 ? +entry.bodyweight : null;
	e.failure = Boolean(entry.failure);
	e.warmup = Boolean(entry.warmup);
	e.unit = "lbs"; // only lbs for now
	return e;
}

function importAllEntries(entries, progressObserver) {
	const tx = db.transaction(["entries"], "readwrite");
	const store = tx.objectStore("entries");
	const progressEvent = {};
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
			const entry = copyEntryInput(entries[i]);
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

function orderGroup(d) {
    return d[curMetric][curAggregation] || 0;
}

function updateDateRange(range) {
    if (!range) { return; }
    $("#start-date-input").val(moment(range[0]).format("YYYY-MM-DD"));
    $("#end-date-input").val(moment(range[1]).format("YYYY-MM-DD"));
    onAnyFilterChange();
}

function curMetricValueAccessor(d) {
    if (!d.value) { return 0; }
    return d.value[curMetric][curAggregation] || 0;
}

function metricValueAccessor(metric, d) {
    if (!d.value) { return 0; }
    return d.value[metric][curAggregation] || 0;
}

function exportJSON() {
    let data = entries.all();//.map(e => copyEntryInput(e));
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
	sizeToFitRoot(workoutCalendar);
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

function formatDuration(d) {
    let dur = moment.duration(d, "seconds");
	if (dur.get("hours") >= 1) return `${dur.asHours().toFixed(1)}h`;
	if (dur.get("minutes") >= 1) return `${dur.asMinutes().toFixed(1)}m`;
	return `${dur.asSeconds().toFixed(1)}s`;
}

function titleForCurMetric(m,d) {
    if (!d.value) { return m; }
    let value = curMetricValueAccessor(d);
	if (curMetric === "intensity") {
		let weightValue = metricValueAccessor("weight", d);
		return `${m}<br/>${metricFormat(value)} (${metricFormat("weight", weightValue)})`;
	}
	return `${m}<br/>${metricFormat(value)}`;
}

function updateMetric() {
	d3.select("#aggregation")
		.selectAll("option")
		.remove();
	d3.select("#aggregation")
		.selectAll("option")
		.data(metricAggregate(curMetric))
		.enter()
		.append("option")
		.attr("value", d => d)
		.text(d => d == "exceptionCount" ? "count" : d);
	curAggregation = metricAggregate(curMetric)[0];
	updateColorScales();
	timeChart.yAxisLabel(`${curMetric} (${curAggregation})`, 20);
}

function metricChanged(event) {
	curMetric = event.target[event.target.selectedIndex].value;
	updateMetric();
	dc.renderAll();
}

function aggregationChanged(event) {
	curAggregation = event.target[event.target.selectedIndex].value;
	updateColorScales();
	timeChart.yAxisLabel(`${curMetric} (${curAggregation})`, 20);
	dc.redrawAll()
}

function prFilterChanged(event) {
	let types = new Set($("input:checkbox[name=pr-filter]:checked")
		.map(function(){return $(this).val()}).get());
	prDimension.filter(t => types.size > 0 ? types.has(t) : true);
	dc.redrawAll();
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
	entry.duration = this.validate("#duration-input", v => moment.duration(v).asSeconds() > 0 ? moment.duration(v).asSeconds() : null);
	entry.weight = this.validate("#weight-input", v => +v > 0 ? +v : null);
	entry.reps = this.validate("#reps-input", v => +v > 0 ? +v : null);
	entry.warmup = $("#warmup-input").prop("checked") ? true : false;
	entry.failure = $("#failure-input").prop("checked") ? true : false;
	// if (entry.start == null || 
	// 	entry.duration == null || 
	// 	entry.weight == null ||
	// 	entry.reps == null) {
	// 	return null;
	// }
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
		.attr("class", "float-xs-right")
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
	let entry = entryFromFields();
	if (!entry) return;
	if (demoMode) {
		entries.add([entry]);
		postSaveEntry();
		return;
	}
	let store = db.transaction("entries", "readwrite").objectStore("entries");
	let req = store.add(entry);
	req.onsuccess = function (event) {
		entry.id = event.target.result;
		entries.add([entry]);
		postSaveEntry();
	};
	req.onerror = function() {
		alert("addPublication error", this.error);
	};
}

function postSaveEntry() {
	$("#newentry-modal").modal("hide");
	stopwatch.reset();
	$("#weight-input").val("");
	$("#reps-input").val("");
	$("#warmup-input").val("");
	$("#failure-input").val("");
	dc.redrawAll();
}

function importSelectedFile() {
	let fileInput = $("input:file");
	let file = fileInput.get(0).files[0];
	let reader = new FileReader();
	reader.onload = e => { 
		let data;
		if (file.type == "text/csv") 
			data = d3.csv.parse(e.target.result);
		else if (file.type == "application/json") 
			data = JSON.parse(e.target.result);
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
    const stats = d3.select("#statistics");
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

    let li = stats.append("li")
    	.attr("class", "list-group-item");
    li.append("span")
    	.text("Exercises");
    li.append("span")
		.attr("class", "float-xs-right")
		.text(allEntriesGroup.value().exercises.exceptionCount);
    
    li = stats.append("li")
		.attr("class", "list-group-item")
	li.append("span")
        .text("Workouts")
	li.append("span")
		.attr("class", "float-xs-right")
		.text(allEntriesGroup.value().workouts.exceptionCount);
    
    li = stats.append("li")
		.attr("class", "list-group-item")
	li.append("span")
		.text("Days")
	li.append("span")
		.attr("class", "float-xs-right")
		.text(allEntriesGroup.value().days.exceptionCount);
}

function exerciseName(d) {
	return exerciseLookup[d.xid] ? exerciseLookup[d.xid].name : "unknown";
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
	updateMetric();
	onAnyFilterChange();
	dc.renderAll();
}


function dismissAndShow(event) {
	let dismissModal = $(event.target.attributes["data-dismiss-target"].value);
	let targetModal = $(event.target.attributes["data-target"].value);
	dismissModal
		.modal("hide")
		.one("hidden.bs.modal", _ => targetModal.modal("show"));
}

function extentColorScale(group) {
	let colors = ["#f1f1f1"].concat(colorbrewer.YlOrRd[9].slice(2, 7));
	let extent = d3.extent(group.all(), d => curMetricValueAccessor(d) || null);
	extent[0] = Math.max(0.01, extent[0]);
	extent[1] = Math.max(1.0, extent[1]);
	if (extent[0] == extent[1]) extent[0] = extent[1]/2.0;
	let range = d3.range(extent[0], extent[1], (Math.ceil(extent[1]-extent[0])/5));
	switch(curMetric) {
        case "intensity":  return d3
			.scale
			.threshold()
			.domain([0.01, 0.7, 0.8, 1.0, 1.0001])
			.range(colors);
		case "xsets": return d3
			.scale
			.threshold()
			.domain([1, 3, 5, 10])
			.range(colors);
		case "rsets": 
			if (curAggregation === "max") return d3
				.scale
				.threshold()
				.domain([1, 5, 8, 10, 12])
				.range(colors);
			else return d3
				.scale
				.threshold()
				.domain(range)
				.range(colors);
		case "reps":
			if (curAggregation === "max") return d3
				.scale
				.threshold()
				.domain([1, 5, 8, 10, 12])
				.range(colors);
			else return d3
				.scale
				.threshold()
				.domain(range)
				.range(colors);
		default: return d3
			.scale
			.threshold()
			.domain(range)
			.range(colors);
    }
}

/*
Special Case: ios web clip application
*/
if (("standalone" in window.navigator) && window.navigator.standalone) {
	// We're using a black-translucent status bar in iOS, so leave room in the nav for that.
	$(".navbar").css("padding-top", "20px");
	/*
	Disable overscroll on iOS

	Make it feel slightly more native. iOS will allow overscroll of the entire page body
	which reveals an unsightly gray area above the nav bar.
	*/
	$("div.scrollable")
		.css("padding-top", "54px")
		.css("position", "absolute")
		.css("overflow", "auto")
		.css("-webkit-overflow-scrolling", "touch")
		.css("top", "0")
		.css("left", "0")
		.css("bottom", "0")
		.css("right", "0");
} else {
	iNoBounce.disable();
}

// http://stackoverflow.com/a/2880929/952123
var match,
	pl     = /\+/g,  // Regex for replacing addition symbol with a space
	search = /([^&=]+)=?([^&]*)/g,
	decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
	query  = window.location.search.substring(1);
const urlParams = {};
while (match = search.exec(query))
	urlParams[decode(match[1])] = decode(match[2]);
const demoMode = urlParams["demo"] !== undefined ? true : false;
const remoteData = demoMode ? "sample-data.json" : urlParams["data"];

if (demoMode) {
	d3.selectAll(".demo-show").attr("hidden", null);
	d3.selectAll(".demo-hidden").attr("hidden", true);
}

if (remoteData) loadFromRemoteData(remoteData);
else loadFromDB();

let windowWidth = window.innerWidth;
const daysOfTheWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let today = moment(new Date()).endOf('day');
let oneMonthAgo = moment(today).subtract(1, "month");
let oneWeekAgo = moment(today).subtract(1, "week");

let curMetric = "intensity";
let curAggregation = "max";
let minDate = null;
const stopwatch = new Stopwatch();
let scaleStack = [];

function updateColorScales() {
	exerciseChart.colors(extentColorScale(excerciseGroup));
	dayOfWeekChart.colors(extentColorScale(dayOfWeekGroup));
	const muscleColorScale = extentColorScale(muscleGroup);
	anteriorDiagram.colors(muscleColorScale);
	posteriorDiagram.colors(muscleColorScale)
	muscleBarChart.colors(muscleColorScale);
	const dateColorScale = extentColorScale(dateGroup);
	workoutCalendar.colors(dateColorScale);
	timeChart.colors(dateColorScale);
}

const entries = crossfilter([]);

// Crossfilter: All Group
const allEntriesGroup = entries.groupAll();
statsReducer(allEntriesGroup);

// Crossfilter: Date
const dateDimension = entries.dimension(d => d.start);
const dateGroup = dateDimension.group(d3.time.day);
metricReducer(dateGroup);
dateGroup.order(orderGroup);

// Crossfilter: Muscle
const muscleDimension = entries.dimension(d => d.xcalc.muscles, true);
const muscleGroup = muscleDimension.group();
metricReducer(muscleGroup);
muscleGroup.order(orderGroup);

// Crossfilter: PRs
const prDimension = entries.dimension(d => d.xcalc.prs, true);

// Crossfilter: Exercise
const excerciseDimension = entries.dimension(d => d.xid);
const excerciseGroup = excerciseDimension.group();
metricReducer(excerciseGroup);
excerciseGroup.order(orderGroup);

// Crossfilter: Reps
const repsScale = d3.scale.linear().domain([1, 12]).range([1, 12]).clamp(true);
const repsDimension = entries.dimension(d => repsScale(d.reps));
const repsGroup = repsDimension.group();

const workoutDimension = entries.dimension(d => d.workout);
const setsByWorkout = workoutDimension.group().reduceCount();

// Crossfilter: Sets (fake dimension and group)
const setsDimension = {
    filter: v => {
        if (v !== null)
            throw new Error("don't know how to do this!");
        return workoutDimension.filter(null);
    },
    filterRange: r => workoutDimension.filter(v => v >= r[0] && v < r[1]),
    filterExact: e => {
		const wids = new Set();
		setsByWorkout.all().forEach(d => {
			if (e != 10 && d.value == e) wids.add(d.key);
			if (d.value >= e) wids.add(d.key);
		});
		console.log(wids);
		workoutDimension.filter(d => wids.has(d));
    },
    filterFunction: function(f) {
		const wids = new Set();
		setsByWorkout.all().forEach(d => {
			if (f(d.value)) wids.add(d.key);
		});
		console.log(wids);
		workoutDimension.filter(d => wids.has(d));
	}
};

const setsGroup = {
    all: _ => d3.layout
		.histogram()
		.value(d => d.value || null)
		.bins(d3.range(1,12,1))(setsByWorkout.all())
		.map(b => ({ key: b.x, value: b.y }))
};

// Crossfilter: Weight
const weightsDimension = entries.dimension(d => d.xcalc.netweight);
const allWeightsGroup = weightsDimension.group().reduceCount();
const binnedWeightsGroup = {
    all: _ => {
    	return allWeightsGroup.all()
    		.filter(d => d.value > 0 && d.key > 0);
    }
};

// Crossfilter: Day of Week
const dayOfWeek = entries.dimension(d => {
    const day = d.start.getDay();
    return day + '.' + daysOfTheWeek[day];
});
const dayOfWeekGroup = dayOfWeek.group();
metricReducer(dayOfWeekGroup);
dayOfWeekGroup.order(orderGroup);

// Crossfilter: Rest vs Active
const durationClassGroup = {
    all: _ => {
    	return [
    		{ key: "Rest", value: allEntriesGroup.value().rest.sum },
    		{ key: "Active", value: allEntriesGroup.value().duration.sum }
    	];
    }
};

const workoutCalendar = dc.calendarGraph("#cal-graph")
    .valueAccessor(curMetricValueAccessor)
	.height(100)
    .margins({top: 30, right: 10, bottom: 0, left: 28})
    .group(dateGroup)
    .dimension(dateDimension)
    .title(d => titleForCurMetric(moment(d.key).format("ddd, MMM D, YYYY"), d))
    .tip("#cal-tip");

//const yExtent = d3.extent(dateGroup.all(), d => d.value.value === 0 ? null : d.value.value);

const dataTable = dc.dataTable("#data-table")
    .dimension(dateDimension)
	.group(d => `Workout ${d.workout.toLocaleString()}: ${moment(d.start).format("ddd, MMM D, YYYY")}`)
    .columns([
		{
			label: "Exercise",
			format: d => exerciseName(d)
		},
		{
			label: "Reps",
			format: d => d.reps
		},
		{
			label: "Weight",
			format: d => d.xcalc.netweight.toLocaleString()
		},
		{
			label: "Duration",
			format: d => formatDuration(d.duration)
		}
	])
    .order(d3.descending)
	.size(100)
	.sortBy(d => d.start)
	.on("renderlet", chart => {
		chart.root()
			.selectAll(".dc-table-group")
			.classed("bg-inverse", true)
			.classed("text-white", true);
    });

const timeChart = dc.barChart("#time-chart")
    .valueAccessor(curMetricValueAccessor)
    .height(120)
    .gap(1)
    .transitionDuration(1000)
    .margins({top: 10, right: 10, bottom: 20, left: 30})
    .dimension(dateDimension)
    .group(dateGroup)
    .colorAccessor(curMetricValueAccessor)
    .x(d3.time.scale().domain([oneMonthAgo, today]))
    //.y(d3.scale.pow().exponent(3))
    .round(d3.time.day.round)
    .xUnits(d3.time.days)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .turnOffControls()
	.title(d => titleForCurMetric(moment(d.key).format("ddd, MMM D, YYYY"), d))
    .on("filtered", (chart, filter) => {
        updateDateRange(filter);
    })
	.on('renderlet', chart => {
		chart.svg()
			.selectAll("rect.bar")
            .on("mouseover", function (d) {
                d3.select("#time-chart-tip")
                    .attr("hidden", null)
                    .html(chart.title()(d.data));
            })
            .on("mouseout", function (d) {
                d3.select("#time-chart-tip")
                    .attr("hidden", "true")
                    .text(null);
            });
    });

const repsChart = dc.barChart("#reps-chart")
    .height(225)
    .gap(1)
    .transitionDuration(1000)
    .margins({top: 10, right: 10, bottom: 20, left: 25})
    .dimension(repsDimension)
    .group(repsGroup)
	.colorDomain(colorbrewer.Reds[3])
	.xUnits(dc.units.ordinal)
	.renderHorizontalGridLines(true)
    .x(d3.scale.ordinal().domain(d3.range(0, 13, 1)))
	.title(d => d.value || null)
	.elasticY(true)
	.yAxisLabel("sets", 20);

repsChart.xAxis().ticks(5);
repsChart.xAxis().tickFormat(v => v == 12 ? "12+" : v);
repsChart.yAxis()
	.tickFormat(d3.format("d"))
    .tickSubdivide(0);

const setsChart = dc.barChart("#sets-chart")
    .height(225)
    .gap(1)
    .transitionDuration(1000)
    .margins({top: 10, right: 10, bottom: 20, left: 25})
    .dimension(setsDimension)
    .group(setsGroup)
	.colorDomain(colorbrewer.Reds[3])
	.xUnits(dc.units.ordinal)
	.renderHorizontalGridLines(true)
    .x(d3.scale.ordinal().domain(d3.range(0, 11, 1)))
	.title(d => d.value || null)
	.elasticY(true)
	.yAxisLabel("workouts", 20);

setsChart.xAxis().ticks(5);
setsChart.xAxis().tickFormat(v => v == 10 ? "10+" : v);
setsChart.yAxis()
	.tickFormat(d3.format("d"))
    .tickSubdivide(0);

const weightsChart = dc.barChart("#weights-chart")
    .height(225)
    .gap(1)
    .valueAccessor(d => d.value)
    .transitionDuration(1000)
    .margins({top: 10, right: 10, bottom: 20, left: 25})
    .dimension(weightsDimension)
    .group(binnedWeightsGroup)
	.colorDomain(colorbrewer.Reds[3])
    .elasticY(true)
    .elasticX(true)
    .xUnits(dc.units.ordinal)
    .renderHorizontalGridLines(true)
    .x(d3.scale.ordinal())
	.title(d => d.key ? `${d.value} sets at ${d.key} lbs` : null)
	.yAxisLabel("sets", 20)
	.on('renderlet', chart => {
		chart.svg()
			.selectAll("rect.bar")
            .on("mouseover", function (d) {
                d3.select("#weights-chart-tip")
                    .attr("hidden", null)
                    .html(chart.title()(d.data));
            })
            .on("mouseout", function (d) {
                d3.select("#weights-chart-tip")
                    .attr("hidden", "true")
                    .text(null);
            });
    });

weightsChart.yAxis()
	.tickFormat(d3.format("d"))
    .tickSubdivide(0);

const durationPieChart = dc.pieChart("#duration-pie-chart")
	.height(225)
	.radius(80)
	.innerRadius(30)
	.dimension(dateDimension)
	.group(durationClassGroup);

function prepareWeightsChart(chart) {
	const keys = binnedWeightsGroup.all().map(d => d.key);
	const ticks = keys.length > 12 ? keys.filter((d,i) => !(i%10)) : keys;
	weightsChart.xAxis().tickValues(ticks);
}

weightsChart.on("preRender", chart => {
	prepareWeightsChart(chart);
});

weightsChart.on("preRedraw", chart => {
	prepareWeightsChart(chart);
	chart.render();
});

let rangeStart = moment(today).subtract(1, "week");
timeChart.filter(dc.filters.RangedFilter(rangeStart, today));
timeChart.xAxis().ticks(3);
timeChart.yAxis().ticks(3, ",.1s");
// https://github.com/dc-js/dc.js/issues/991
timeChart._disableMouseZoom = function() {};

const muscleBarChart = dc.rowChart("#muscle-bar-chart")
    .valueAccessor(curMetricValueAccessor)
    .height(225)
    .margins({top: 10, left: 10, right: 10, bottom: 10})
    .group(muscleGroup)
    .dimension(muscleDimension)
    .cap(10)
    .gap(3)
    .othersGrouper(false)
	.renderTitleLabel(true)
	.colorAccessor(curMetricValueAccessor)
    .ordering(d => -curMetricValueAccessor(d))
    .label(d => {
        var ex = muscleLookup[d.key]; 
        if (ex != null) {
            return ex.name;
        }
        return d.key
    })
    .title(d => curMetricValueAccessor(d).toFixed(2) || null)
    .elasticX(true)
    .on("filtered", onAnyFilterChange);

muscleBarChart.xAxis().ticks(5);

const dayOfWeekChart = dc.rowChart("#day-of-week-chart")
    .valueAccessor(curMetricValueAccessor)
    .height(225)
    .margins({top: 10, left: 10, right: 10, bottom: 10})
    .group(dayOfWeekGroup)
    .gap(3)
    .dimension(dayOfWeek)
    .label(d => d.key.split('.')[1])
    .colorAccessor(curMetricValueAccessor)
    .title(d => curMetricValueAccessor(d).toFixed(2))
    .elasticX(true)
	.renderTitleLabel(true)
    .on("filtered", onAnyFilterChange);

dayOfWeekChart.xAxis().ticks(5);

const exerciseChart =  dc.rowChart("#exercise-chart")
    .valueAccessor(curMetricValueAccessor)
    .height(225)
    .margins({top: 10, left: 10, right: 10, bottom: 10})
    .group(excerciseGroup)
    .dimension(excerciseDimension)
    .cap(10)
    .gap(3)
    .othersGrouper(false)
	.renderTitleLabel(true)
    .ordering(function(d){return -d.value.value;})
	.colorAccessor(curMetricValueAccessor)
    .label(function (d) {
        var ex = exerciseLookup[d.key]; 
        if (ex != null) {
            return ex.name
        }
        return d.key
    })
    .title(d => curMetricValueAccessor(d).toFixed(2))
    .elasticX(true)
    .on("filtered", onAnyFilterChange);

exerciseChart.xAxis().ticks(5);

const anteriorDiagram = dc.anatomyDiagram("#anatomy-diagram-left")
    .anterior()
    .valueAccessor(curMetricValueAccessor)
    .group(muscleGroup)
    .dimension(muscleDimension)
    .title(d => titleForCurMetric(muscleLookup[d.key].name, d))
    .on("filtered", onAnyFilterChange)
    .tip("#anatomy-tip");

const posteriorDiagram = dc.anatomyDiagram("#anatomy-diagram-right")
    .posterior()
    .valueAccessor(curMetricValueAccessor)
    .group(muscleGroup)
    .dimension(muscleDimension)
    .title(d => titleForCurMetric(muscleLookup[d.key].name, d))
    .on("filtered", onAnyFilterChange)
    .tip("#anatomy-tip");

const exerciseListItem = d3.select("#exercise-list")
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
	.attr("class", "float-xs-right")
	.html("&#x24D8;");

exerciseListItem.append("span")
	.attr("class", "name")
	.text(d => { return d.value.name });

const exerciseListList = new List("exercise-list-container", { valueNames: ["name"] });

resizeAllCharts();

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
        const attribute = timeChart.controlsUseVisibility() ? "visibility" : "display";
        const value = timeChart.controlsUseVisibility() ? "hidden" : "none";
        d3.selectAll("#reset-date-range").style(attribute, value);
        timeChart.selectAll(".filter").style(attribute, value).text(timeChart.filter());
    }
    return timeChart;
};

// muscleBarChart.turnOnControls = function () {
//     if (timeChart.root()) {
//         var attribute = timeChart.controlsUseVisibility() ? "visibility" : "display";
//         d3.selectAll("#reset-muscle").style(attribute, null);
//         timeChart.selectAll(".filter").text(timeChart.filterPrinter(timeChart.filters())).style(attribute, null);
//     }
//     return timeChart;
// };

// muscleBarChart.turnOffControls = function () {
//     if (timeChart.root()) {
//         const attribute = timeChart.controlsUseVisibility() ? "visibility" : "display";
//         const value = timeChart.controlsUseVisibility() ? "hidden" : "none";
//         d3.selectAll("#reset-muscle").style(attribute, value);
//         timeChart.selectAll(".filter").style(attribute, value).text(timeChart.filter());
//     }
//     return timeChart;
// };

timeChart.zoomIn = function(domain) {
    scaleStack.push(timeChart.x().domain());
    const filter = !arguments.length
        ? timeChart.filters()[0]
        : domain;
    timeChart.x().domain(filter);
    dc.redrawAll();
    timeChart.turnOnControls();
}

timeChart.zoomOut = function() {
    const scale = scaleStack.pop() || [minDate, today];
    timeChart.x().domain(scale);
    dc.redrawAll();
    timeChart.turnOnControls();
}

timeChart.panLeft = function() {
    const domain = timeChart.x().domain().map(d => moment(d));
    const filter = timeChart.filter().map(d => moment(d));
    const diff = filter[1] - filter[0];
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
    const domain = timeChart.x().domain().map(d => moment(d));
    const filter = timeChart.filter().map(d => moment(d));
    const diff = filter[1] - filter[0];
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
