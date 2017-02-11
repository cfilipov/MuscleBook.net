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

Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

var mb = mb || {};

/**
 * General-use utilities namespace
 */
mb.util = {}

mb.util.formatDuration = function(d) {
	let dur = moment.duration(d, "seconds");
	if (dur.get("hours") >= 1) return `${dur.asHours().toFixed(1)}h`;
	if (dur.get("minutes") >= 1) return `${dur.asMinutes().toFixed(1)}m`;
	return `${dur.asSeconds().toFixed(1)}s`;
};

mb.util.memoize = function(func) {
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
};

mb.util.safeExtent = function(array, accessor) {
	const extent = d3.extent(array, accessor);
	extent[0] = Math.max(0.01, extent[0]);
	extent[1] = Math.max(1.0, extent[1]);
	if (extent[0] == extent[1]) extent[0] = extent[1]/2.0;
	return extent;
};

mb.util.rangeFromExtent = function(extent, steps) {
	return d3.range(extent[0], extent[1], (Math.ceil(extent[1]-extent[0])/steps));
};

mb.util.splitWords = function(text) {
	var allWordsIncludingDups = text.replace(/-|,/g, ' ').replace(/\(|\)/g, '').split(' ');
	var wordSet = allWordsIncludingDups.reduce((prev, current) => {
		prev[current] = true;
		return prev;
	}, {});
	return Object.keys(wordSet);
};

mb.util.colorThresholds = function(thresholds, min='#f1f1f1') {
	const colors = [min].concat(colorbrewer.YlOrRd[9].slice(2, 7));
	return d3
		.scale
		.threshold()
		.domain(thresholds)
		.range(colors);
};

mb.util.sizeDcChartToFit = function(chart) {
    const $parent = $(chart.root()[0]);
    chart.width($parent.width());
    chart.height($parent.height());
};

mb.util.formatDuration = function(d) {
    let dur = moment.duration(d, "seconds");
	if (dur.get("hours") >= 1) return `${dur.asHours().toFixed(1)}h`;
	if (dur.get("minutes") >= 1) return `${dur.asMinutes().toFixed(1)}m`;
	return `${dur.asSeconds().toFixed(1)}s`;
};

mb.util.calculateNetWeight = function(weight, bodyweight, asweight) {
	let total = 0;
	if (jQuery.isNumeric(weight)) total += weight;
	if (jQuery.isNumeric(bodyweight)) total += bodyweight;
	if (jQuery.isNumeric(asweight)) total -= asweight;
	return total;
};

mb.util.calculateE1RM = function(reps, weight) {
	if (reps < 0) throw new Error("invalid reps: %s", reps);
	if (reps === 0) return 0;
    if (reps == 1) return weight;
    if (reps < 10) return Math.round(weight / (1.0278 - 0.0278 * reps));
    else return Math.round(weight / 0.75);
};

mb.util.randomColors = [
	// Brewer Color Schemes http://www.graphviz.org/doc/info/colors.html
	"#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#e5d8bd",
	"#fddaec", "#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462",
	"#b3de69", "#fccde5", "#ccebc5", "#ffed6f", "#bc80bd", "#a6cee3",
	"#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#fdbf6f", "#ff7f00",
	"#cab2d6", "#e31a1c", "#9e0142", "#d53e4f", "#f46d43", "#fdae61",
	"#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd",
	"#5e4fa2", "#ffffb3"
];
