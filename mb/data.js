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

/** Muscle Book Entry Object Structure
 
Each entry represents a single "set" of a workout.

	{
		// Unique ID for this entry
		id: Number,

		// Start date+time
		start: Date, 

		// Active duration in seconds
		duration: null || Number,

		// Number of reps performed
		reps: null || Number,

		// Weight lifted
		weight: Number,

		// Assistance weight
		asweight: null || Number,

		// Body weight
		bodyweight: null || Number,

		// Was this set work-to-failure?
		failure: Boolean,

		// Was this a warmup set?
		warmup: Boolean,

		// Workout ID (used for grouping workouts)
		workout: Number,

		// Unit for weight, asweight and bodyweight (lbs or kg)
		unit: String,

		// Exercise
		// Contains data related to the exercise performed for this entry
		exercise: {

			// Unique identifier for this exercise
			// If the exercise does not exist in the exercise DB, the name of the exercise can be any 
			// arbitrary string set by the user.
			id: null || Number,

			// Human-readable name for this exercise
			name: String,

			// List of FMA IDs representing muscles used in this exercise
			muscles: [Number]
		},

		// Derived from the main fields above and/or past entries
		derived: null || {

			// Net weight moved
			// Derived from: [
			//     cur(weight),
			//     cur(asweight), 
			//     cur(bodyweight) // if exercise is bodyweight-based
			// ]
			netweight: Number,

			// Estimated one-rep max
			// Derived from: [
			//     cur(reps), 
			//     cur(derived.netweight)
			// ]
			e1rm: Number,

			// List of PR types 
			// The value of the type string matches the path to the property for which the PR is based on.
			// For example: A set which hit PRs for weight and total volume would contain the following prs property:
			//
			//      prs: ['derived.netweight', 'derived.volume.total']
			//
			// Derived from: [
			//     max(reps).filter(exercise.id),
			//     max(derived.volume.total).filter(exercise.id),
			//     max(derived.netweight).filter(exercise.id),
			//     max(derived.e1rm).filter(exercise.id),
			//     max(derived.set.n).filter(),
			//     max(derived.set.x).filter(exercise.id),
			//     max(derived.set.xrw).filter(exercise.id,reps,derived.netweight),
			// ]
			prs: [String],

			// Volume calculations (total weight moved)
			volume: {

				// Volume for this specific set 
				// Derived from: [
				//     cur(reps), 
				//     cur(derived.netweight)
				// ]
				value: Number,

				// Running total volume of all sets in this workout for this exercise 
				// Derived from: [
				//     sum(derived.volume.value).filter(exercise.id,workout)
				// ]
				total: Number,

				// Percent of the max total for this exercise
				// Derived from: [
				//     cur(derived.volume.total),
				//     max(derived.volume.total).filter(exercise.id)
				// ]
				percentMax: Number
			},

			// Intensity (percentage of past top performance) 
			intensity: {

				// Intensity based on actual recorded 1rm
				// Derived from: [
				//     cur(derived.netweight),
				//     max(derived.netweight).filter(exercise.id)
				// ]
				actual: Number,

				// Intensity based on estimated 1rm
				// Derived from: [
				//     cur(derived.e1rm),
				//     max(derived.e1rm).filter(exercise.id)
				// ]
				estimated: Number
			},

			// Number of sets
			set: {

				// Set number per workout
				// Derived from: [
				//     count().filter(workout)
				// ]
				n: Number,

				// Set number per exercise per workout
				// Derived from: [
				//     count().filter(workout,exercise.id)
				// ]
				x: Number,

				// Set number per exercise, reps, netweight combination per workout
				// Derived from: [
				//     count().filter(workout,exercise.id,reps,derived.netweight)
				// ]
				xrw: Number
			},

			// Duration values
			duration: null || {

				// Rest duration before this set took place
				// Derived from: [
				//     prev(start),
				//     prev(duration),
				//     cur(start)
				// ]
				rest: Number,

				// Combined rest + active duration
				// Derived from: [
				//     prev(start),
				//     prev(duration),
				//     cur(start),
				//     cur(duration)
				// ]
				combined: Number
			}
		}
	}

Example Entry:

	{
		id: 3844,
		start: 'Wed Nov 02 2016 20:46:00 GMT-0700 (PDT)', 
		duration: 24.765,
		reps: 1,
		weight: 140,
		asweight: null,
		bodyweight: null,
		failure: false,
		warmup: false,
		workout: 220,
		unit: lbs,
		exercise: {
			id: 28,
			name: 'Barbell Military Press',
			muscles: [83003,34687,37692,37694,83006,32556,32555,32557]
		},
		derived: {
			netweight: 140,
			e1rm: 140,
			prs: ['derived.netweight'],
			volume: {
				value: 140,
				total: 3510,
				percentMax: 0.6
			},
			intensity: {
				actual: 1.037,
				estimated: 0.998
			},
			set: {
				n: 9,
				x: 9,
				xrw: 1
			},
			duration: {
				rest: 204,
				combined: 228.765
			}
		}
	}

 */

/**
 * Data namespace for muscle book data access.
 * This abstracts away the database access from the other parts of the app.
 */
var mb = mb || {};

mb.data = (function(d3, Dexie, moment, util) {

let db = null;

/**
 * Update entry with workout, exercise and derived data
 */
const fillEntry = Dexie.async(function*(entry) {
	const workout = yield entryWorkout(entry);
	const exercise = yield entryExercise(entry);
	entry.workout = workout;
	entry.exercise = exercise;
	const derived = yield entryDerivedData(entry);
	entry.derived = derived;
	db.entries.update(primKey, { workout, exercise, derived });
});

/**
 * Generate exercise property for entry
 */
const entryExercise = Dexie.async(function*(entry) {
	if (!entry.exercise.id) return entry.exercise;
	const exercise = yield db.exercises.get(+entry.exercise.id);
	if (!exercise) return entry.exercise;
	const result = {};
	result.id = exercise.id;
	result.name = exercise.name;
	result.muscles = exercise.displayableMuscleIDs();
	return result;
});

/**
 * Generate workout property for entry
 */
const entryWorkout = Dexie.async(function*(entry) {
	const prevEntry = yield db.entries
		.orderBy('start')
		.last();
	
	if (entry.workout) return entry.workout;

	const nextWorkoutCutoff = prevEntry.start
		? moment(prevEntry.start).add(1, "hours")
		: moment();
	const isNewWorkout = !moment(entry.start).isBefore(nextWorkoutCutoff);
	const prevWorkoutID = prevEntry.start
		? prevEntry.entry.workout
		: 0;
	return isNewWorkout
		? prevWorkoutID + 1
		: prevWorkoutID;
});

/**
 * Generate derived data property for the provided entry
 */
const entryDerivedData = Dexie.async(function*(entry) {
	const curWorkout = yield db.entries
		.where('workout')
		.equals(entry.workout)
		.sortBy('start')
		.toArray();
	const entriesForExercise = yield db.entries
		.where('exercise.id')
		.equals(entry.exercise.id)
		.filter(e => e.start < entry.start)
		.sortBy('start')
		.toArray();
	const prevEntryForWorkout = curWorkout.length > 0 
		? curWorkout[curWorkout.length - 1] 
		: null;

	// Populate derived.volume

	const netweight = mb.util.calculateNetWeight(entry.weight, entry.bodyweight, entry.asweight);
	const curWorkoutForExercise = entriesForExercise.filter(e => e.exercise.id === entry.exercise.id);
	const value = entry.reps * netweight;
	const total = d3.sum(curWorkoutForExercise, e => e.derived.volume.value);
	const maxTotalVolume = d3.max(entriesForExercise, e => e.derived.volume.total);
	const percentMax = total / maxTotalVolume;
	const volume = { value, total, percentMax };

	// Populate derived.intensity
	
	const e1rm = mb.util.calculateE1RM(entry.reps, netweight);
	const maxReps = d3.max(entriesForExercise, e => e.reps);
	const maxWeight = d3.max(entriesForExercise, e => e.derived.netweight);
	const maxE1rm = d3.max(entriesForExercise, e => e.derived.e1rm);
	const actual = netweight / maxWeight;
	const estimated = e1rm / maxE1rm;
	const intensity = { actual, estimated };

	// Populate derived.set

	const n = curWorkout.length + 1;
	const x = curWorkoutForExercise.length + 1;
	const xrw = curWorkoutForExercise
		.filter(e => {
			return e => e.reps == entry.reps && 
				e.derived.netweight === netweight
		})
		.length + 1;
	const set = { n, x, xrw };

	// Populate derived.duration

	const hasDuration = prevEntryForWorkout && prevEntryForWorkout.duration && entry.duration;
	const rest = hasDuration
		? moment.duration(entry.start - prevEntryForWorkout.start).asSeconds() - prevEntryForWorkout.duration 
		: null;
	const combined = hasDuration ? rest + entry.duration : null;
	const duration = { rest, combined };

	// Populate PRs

	const maxN = d3.max(entriesForExercise, e => e.derived.set.n);
	const maxX = d3.max(entriesForExercise, e => e.derived.set.x);
	const maxXRW = d3.max(entriesForExercise, e => e.derived.set.xrw);
	const prs = [];
	if (entry.reps > maxReps) derived.prs.push('reps');
	if (value > maxTotalVolume) derived.prs.push('derived.volume.total');
	if (netweight > maxWeight) derived.prs.push('derived.netweight');
	if (e1rm > maxE1rm) derived.prs.push('derived.e1rm');
	if (n > maxN) derived.prs.push('derived.set.n');
	if (x > maxX) derived.prs.push('derived.set.x');
	if (xrw > maxXRW) derived.prs.push('derived.set.xrw');

	return { netweight, e1rm, prs, volume, intensity, set, duration };
});

const loadFromLocalDB = function() {
	console.log('Loading db...');
	db = new Dexie('MuscleBookDatabase');
	// Schema migration 1 (initial schema)
	db.version(1)
		.stores({
			entries: '++id,start,exercise.id,workout',
			exercises: 'id,equipment,type,force,mechanics,name,*nameWords'
		});
	// Setup full-text search index
    db.exercises.hook('creating', function(primKey, obj, trans) {
        if (typeof obj.name == 'string') obj.nameWords = util.splitWords(obj.name);
    });
    db.exercises.hook('updating', function(mods, primKey, obj, trans) {
        if (mods.hasOwnProperty('name')) {
            if (typeof mods.name == 'string') return { nameWords: util.splitWords(mods.name) };
            else return { nameWords: [] };
        }
    });
	// Fill `derived` property for new/updated entry
    db.entries.hook('creating', function(primKey, entry, transaction) {
		fillEntry(entryClone)
			.catch (e => {
				throw new Error(`Failed to fill derived entry data. ${e}`);
			});
    });
	// hookKey is a random key used to identify changes triggered in the updating hook
	const hookKey = Math.random().toString();
    db.entries.hook('updating', function(mods, primKey, entry, transaction) {
		// If hookKey is true then we're the one triggering this change, so ignore it.
		// Failure to do this will result in perpetually responding to our own changes.
		if (Dexie.Promise.PSD[hookKey]) return;

		// entry hasn't been modified yet, so make the changes that will eventually take place.
		// Note this must be done on a clone wince we are not allowed to modify the passed-in
		// entry in any way.
		var entryClone = Dexie.deepClone(entry);
		Object.keys(mods).forEach(keyPath => {
			if (mods[keyPath] === undefined) Dexie.delByKeyPath(entryClone, keyPath);
			else Dexie.setByKeyPath(entryClone, keyPath, mods[keyPath]);
		});

		// Finally, we fill the entry. Filling an entry involves
		//     1. Setting a workout ID, if it hasn't already been set.
		//     2. Filling in the `exercise` object if it has an `id`.
		//     3. Generating and setting the `derived` object. 
		Dexie.Promise.newPSD(()=>{
			Dexie.Promise.PSD[hookKey] = true;
			fillEntry(entryClone)
				.catch (e => {
					throw new Error(`Failed to fill derived entry data. ${e}`);
				});
		});
    });
	// Pre-populate exercise data. This only happens once.
    db.on('ready', () => {
        return db.exercises.count(count => {
            if (count > 0) return;
			console.log('Populating exercise DB...');
			return new Dexie.Promise((resolve, reject) => {
				d3.json('mb/exercises.json', (error, data) => {
					if (error) reject(error);
					else resolve(data);
				});
			}).then(data => {
				return db.transaction('rw', db.exercises, () => {
					data.forEach(item => {
						db.exercises.add(item);
					});
				});
			}).then(() => {
				console.log('Done populating exercise data.');
			});
		});
	});
	db.exercises.mapToClass(mb.Exercise);
	return db.open()
		.then(() => db.entries.toArray());
};

const loadFromURL = (url) => {
	d3.json(url, data => {
		for (entry of data) {
			entry.start = new Date(entry.start);
		}
		dataReady(data);
	});
};

mb.Exercise.search = (text) => {
	const words = util.splitWords(text);
	return db.exercises
		.where('nameWords')
		.startsWithAnyOfIgnoreCase(words)
		.limit(100)
		.toArray();
};

mb.Exercise.all = () => {
	return db.exercises.toArray();
};

return { db: () => db, loadFromLocalDB, loadFromURL }; 

})(d3, Dexie, moment, mb.util);