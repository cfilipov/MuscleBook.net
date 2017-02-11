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
 * Metric namespace representing all reportable weight lifting metrics.
 */
mb.metric = (function($) {

/**
 * Metric class defines a weight lifting metric such as intensity, volums, weight etc... 
 * This class provides a uniform interface for working with a variety of metrics, each with different requirements.
 * Each metric may be aggregated in limited ways, defined by the `aggregations` property. 
 */
class Metric {
	constructor({ name, aggregations, thresholds, format, setupReducer }) {
		this.name = name;
		this.aggregations = aggregations;
		this.thresholds = thresholds;
		this.format = format;
		this.setupReducer = setupReducer;
		this.selectedAg = aggregations[0];
	}

	/**
	 * Given a crossfilter group item `d`, return the value representing this metric and its currently selected aggregate.
	 */
	valueAccessor(d) {
		if (d == null) return 0;
		if (d.value == null) return 0;
		return d.value[this.name][this.selectedAg.key] || 0;
	}

	/**
	 * Given a crossfilter group value object return the value for this metric and its currently selected aggregate.
	 * Note this is subtly different than `valueAccessor()` in that the value object is passed rather than the whole group item.
	 */
	groupOrdering(d) {
		return d[this.name][this.selectedAg.key] || 0;
	}

	/**
	 * Returns the value formatted as a human friendly string.
	 */
	formattedValue(d) {
		return this.format(this.valueAccessor(d));
	}

	/**
	 * Returns an array of numbers based on the group's extent.
	 */
	rangeForGroup(d, steps=5) {
		return mb.util.rangeFromExtent(mb.util.safeExtent(d.all(), d => this.valueAccessor(d)), steps);
	}

    /**
     * Get or select an aggregation by key
     */
    aggregation(str) {
        if (!arguments.length) {
            return this.selectedAg;
        }
        this.selectedAg = this.aggregations.find(a => a.key == str);
    }
}

/**
 * All available weight lifting metrics.
 */
const all = [
	new Metric({
		name: 'Intensity',
		aggregations: [
            { key: 'max', title: 'Max' }, 
            { key: 'avg', title: 'Avg' }
        ],
		thresholds: _ => [0.01, 0.7, 0.8, 1.0, 1.0001],
		format: value => `${(value * 100).toFixed(1)}%`,
		setupReducer: (reducer => reducer.value('Intensity')
			.filter(e => !e.warmup)
			.max(e => e.xcalc.intensity)
			.avg(e => e.xcalc.intensity))
	}),

	new Metric({
		name: 'Weight',
		aggregations: [
            { key: 'max', title: 'Max' }, 
            { key: 'avg', title: 'Avg' }
        ],
		thresholds: function(group) { return this.rangeForGroup(group); },
		format: value => `${value.toLocaleString()} lbs`,
		setupReducer: (reducer => reducer.value('Weight')
			.filter(e => $.isNumeric(e.xcalc.netweight))
			.max(e => e.xcalc.netweight)
			.avg(e => e.xcalc.netweight))
	}),

	new Metric({
		name: 'Volume',
		aggregations: [
            { key: 'sum', title: 'Sum' },
            { key: 'avg', title: 'Avg' },
            { key: 'max', title: 'Max' }, 
        ],
		thresholds: function(group) { return this.rangeForGroup(group); },
		format: value => `${value.toLocaleString()} lbs`,
		setupReducer: (reducer => reducer.value('Volume')
            .filter(e => $.isNumeric(e.xcalc.netweight))
            .max(e => e.xcalc.volume)
            .avg(e => e.xcalc.volume)
            .sum(e => e.xcalc.volume))
	}),

	new Metric({
		name: 'Active Duration',
		aggregations: [
            { key: 'sum', title: 'Sum' },
            { key: 'avg', title: 'Avg' },
            { key: 'max', title: 'Max' }, 
        ],
		thresholds: function(group) { return this.rangeForGroup(group); },
		format: value => mb.util.formatDuration(value),
		setupReducer: (reducer => reducer.value('Active Duration')
            .filter(e => $.isNumeric(e.duration))
            .max(e => e.duration)
            .avg(e => e.duration)
            .sum(e => e.duration))
	}),

	new Metric({
		name: 'Sets',
		aggregations: [
            { key: 'exceptionCount', title: 'Count' }
        ],
		thresholds: _ => [1, 3, 5, 10],
		format: value => `${Math.max(1, value.toFixed(0))} sets`,
		setupReducer: (reducer => reducer.value('Sets')
			.exception(e => e.id)
            .exceptionCount(true))
	}),

	new Metric({
		name: 'Reps',
		aggregations: [
            { key: 'max', title: 'Max' },
            { key: 'sum', title: 'Sum' },
            { key: 'avg', title: 'Avg' } 
        ],
		thresholds: function(group) {
			return this.selectedAg.key === 'max' ? [1, 3, 5, 10] : this.rangeForGroup(group)
		},
		format: value => `${Math.max(1, value.toFixed(0))} reps`,
		setupReducer: (reducer => reducer.value('Reps')
			.filter(e => $.isNumeric(e.reps))
            .max(e => e.reps)
            .avg(e => e.reps)
            .sum(e => e.reps))
	}),

	new Metric({
		name: 'Workouts',
		aggregations: [
            { key: 'exceptionCount', title: 'Count' }
        ],
		thresholds: function(group) { return this.rangeForGroup(group); },
		format: value => `${value} workouts`,
		setupReducer: (reducer => reducer.value('Workouts')
			.exception(e => e.workout)
            .exceptionCount(true))
	}),

	new Metric({
		name: 'Exercises',
		aggregations: [
            { key: 'exceptionCount', title: 'Count' }
        ],
		thresholds: function(group) { return this.rangeForGroup(group); },
		format: value => `${value} exercises`,
		setupReducer: (reducer => reducer.value('Exercises')
			.exception(e => e.xid)
            .exceptionCount(true))
	}),
];

/*
Current state. This mutable state tracks the currently selected metric to be used.
*/
let curMetric = all[0];

/*
Reductio function configured with all available metrics.
*/
const reducer = (function() {
    const r = reductio();
    all.forEach(m => m.setupReducer(r));
    return r;
})();

/**
 * Uses a reductio reducer function on a crossfilter group.
 * The reducer is configured with each of the metrics provided.
 */
const reduce = function(group) {
    reducer(group);
	group.order(d => curMetric.groupOrdering(d));
}

/**
 * Returns the currently-selected metric if no arguments are provided.
 * If a string is passed, sets the metric to the one whose name matches the string.
 */
const cur = function(m) {
	if (!arguments.length) {
        return curMetric;
    }
    else if (typeof m === 'string') {
        curMetric = all.find(metric => metric.name === m);
    }
    else if (m instanceof Metric) {
        curMetric = m;
    }
    return curMetric;
};

/*
Public interface
*/
return { 
    reduce, cur, all
};

})(jQuery);