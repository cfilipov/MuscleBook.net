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

var mb = mb || {};

/**
 * Model namespace which contains all crossfilter dimensions and groups in addition to metric objects and the state of the current metric.
 */
mb.model = (function(){

/**
 * Internal class used to represent dc.js chart models.
 */
class Model {
	constructor({ dimension, group }) {
		this.dimension = dimension;
		this.group = group;
	}
}

/**
 * Models which are based on the currently-selected metric.
 */
class MetricModel extends Model {
	constructor(obj) {
		super(obj);
		mb.metric.reduce(obj.group);
	}

	valueAccessor(d) {
		return mb.metric.cur().valueAccessor(d);
	}

	thresholds() {
		return mb.metric.cur().thresholds(this.group);
	}

	formattedValue(d) {
		return mb.metric.cur().formattedValue(d);
	}

	valueLabel() {
		return `${mb.metric.cur().name} (${mb.metric.cur().selectedAg.title})`;
	}

	metric(m) {
		const res = mb.metric.cur(m);
		return res || res.name;
	}

	aggregation(a) {
		return mb.metric.aggregation(a);
	}
}

/**
 * An instance of crossfilter for all entries.
 */
const entries = crossfilter([]);

/**
 * Any metric grouped by date
 */
const metricByDate = (function(){
	const dimension = entries.dimension(d => d.start);
	const group = dimension.group(d3.time.day);
	const model = new MetricModel({ dimension, group });
	model.minDate = function() {
		return moment(d3.min(entries.all(), d => d.start)).startOf('day');
	};
	return model;
})();

/**
 * Any metric grouped by muscle
 */
const metricByMuscle = (function(){
	const dimension = entries.dimension(d => d.xcalc.muscles, true);
	const group = dimension.group();
	return new MetricModel({ dimension, group });
})();

/**
 * Any metric grouped by PR
 */
const metricByPR = (function(){
	const dimension = entries.dimension(d => d.xcalc.prs, true);
	const group = null;
	return new Model({ dimension, group });
})();

/**
 * Any metric grouped by exercise
 */
const metricByExercise = (function(){
	const dimension = entries.dimension(d => d.xid);
	const group = dimension.group();
	return new MetricModel({ dimension, group });
})();

/**
 * Any metric grouped by day of the week (Mon, Tues, etc...)
 */
const metricByDayOfWeek = (function(){
	const daysOfTheWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const dimension = entries.dimension(d => {
		const day = d.start.getDay();
		return day + '.' + daysOfTheWeek[day];
	});
	const group = dimension.group();
	return new MetricModel({ dimension, group });
})();

/**
 * Total number of sets grouped by reps
 */
const setsByReps = (function(){
	const repsScale = d3.scale.linear().domain([1, 12]).range([1, 12]).clamp(true);
	const dimension = entries.dimension(d => repsScale(d.reps));
	const group = dimension.group();
	return new Model({ dimension, group });
})();

/**
 * Total number of sets grouped by weight
 */
const setsByWeight = (function(){
	const dimension = entries.dimension(d => d.xcalc.netweight);
	const allWeightsGroup = dimension.group().reduceCount();
	const group = {
		all: _ => {
			return allWeightsGroup.all()
				.filter(d => d.value > 0 && d.key > 0);
		}
	};
	return new Model({ dimension, group });
})();

/**
 * Total number of workouts grouped by number of sets 
 */
const workoutsBySets = (function(){
	const workoutDimension = entries.dimension(d => d.workout);
	const setsByWorkout = workoutDimension.group().reduceCount();
	const dimension = {
		filter: v => {
			if (v !== null) throw new Error(`don't know how to do this!`);
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
	const group = {
		all: () => d3.layout
			.histogram()
			.value(d => d.value || null)
			.bins(d3.range(1,12,1))(setsByWorkout.all())
			.map(b => ({ key: b.x, value: b.y }))
	};
	return new Model({ dimension, group });
})();

/**
 * Overall rest vs active time 
 */
const restVsActive = (function(){
	const dimension = null;
	const group = {
		all: _ => {
			return [
				{ key: 'Rest', value: allEntriesGroup.value().rest.sum },
				{ key: 'Active', value: allEntriesGroup.value().duration.sum }
			];
		}
	};
	return new Model({ dimension, group });
})();

/**
 * Overall statistics 
 */
const statistics = (function(){
	const dimension = null;
	const group = entries.groupAll();
	const reducer = reductio();
	reducer.value('exercises')
		.exception(d => d.xid)
		.exceptionCount(true);
	reducer.value('workouts')
		.exception(d => d.workout)
		.exceptionCount(true);
	reducer.value('days')
		.exception(d => moment(d.start).format('ll'))
		.exceptionCount(true);
	reducer.value('rest')
		.sum(d => d.duration);
	reducer.value('reps')
		.sum(d => d.reps);
	reducer.value('sets')
		.count(true);
	reducer.value('prs')
		.sum(d => d.xcalc.prs.length);
	reducer.value('duration')
		.sum(d => d.xcalc.restdur);
	reducer.value('volume')
		.sum(d => d.xcalc.volume);
	reducer.value('weight')
		.max(d => d.xcalc.netweight);
	reducer(group);
	return new Model({ dimension, group });
})();

/**
 * Public Interface
 */
return {
	entries,
	metricByDate,
	metricByMuscle,
	metricByPR,
	metricByExercise,
	metricByDayOfWeek,
	setsByReps,
	setsByWeight,
	workoutsBySets,
	restVsActive,
	statistics
};

})();