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
 * UI component namespace.
 */
mb.component = {};

/**
 * Render all components.
 */
mb.component.renderAll = function() {
    dc.renderAll();
};

/**
 * Statistics component pretending to be a dc.js chart.
 */
mb.component.stats = function(selector, model) {
    const root = d3.select(selector);
    const addStat = function(value, title) {
        const col = root.append('div')
            .classed('ui column small center aligned', true)
        const stat = col.append('div')
            .classed('ui tiny statistic', true);
        stat.append('div')
            .classed('value', true)
            .text(value);
        stat.append('div')
            .classed('label', true)
            .text(title);
    };
    const filterAll = function() {};
    const focus = function() {};
    const render = function() {
        root.selectAll("div")
            .remove();
        addStat(model.group.value().volume.sum.toLocaleString(), 'lbs');
        addStat(model.group.value().weight.max || 0, 'lbs max');
        addStat(model.group.value().workouts.exceptionCount.toLocaleString(), 'workouts');
        addStat(model.group.value().reps.sum.toLocaleString(), 'reps');
        addStat(model.group.value().sets.count.toLocaleString(), 'sets');
        addStat(model.group.value().exercises.exceptionCount, 'exercises');
        addStat(model.group.value().days.exceptionCount, 'days');
        addStat(model.group.value().prs.sum.toLocaleString(), 'prs');
    };
    const redraw = render;
    const mockChart = { filterAll, focus, render, redraw };
    dc.registerChart(mockChart);
    return mockChart;
};

/**
 * Metric selection component pretending to be a dc.js chart.
 */
mb.component.metricDropdown = function(selector) {
    let $element = $(selector);
    const menu = d3.select(selector).select('.menu');
    $element.dropdown({
        onChange: function(value, text, $selectedItem) {
            mb.metric.cur(value);
            mb.component.renderAll();
        }
    });
    const filterAll = function() {};
    const focus = function() {};
    const render = function() {
        const metric = mb.metric.cur();
        menu.selectAll("div")
            .remove();
        menu.selectAll('div')
            .data(mb.metric.all)
            .enter()
            .append('div')
            .attr('data-value', d => d.name)
            .classed('item', true)
            .text(d => d.name);
        $element.dropdown('set text', mb.metric.cur().name);
    };
    const redraw = render;
    const mockChart = { filterAll, focus, render, redraw };
    dc.registerChart(mockChart);
    return mockChart;
};

/**
 * Aggregation dropdown component pretending to be a dc.js chart.
 */
mb.component.aggregationDropdown = function(selector) {
    const $element = $(selector);
    const menu = d3.select(selector).select('.menu');
    $element.dropdown({
        onChange: function(value, text, $selectedItem) {
            mb.metric.cur().aggregation(value);
            mb.component.renderAll();
        }
    });
    const filterAll = function() {};
    const focus = function() {};
    const render = function() {
        const metric = mb.metric.cur();
        menu.selectAll("div")
            .remove();
        menu.selectAll('div')
            .data(metric.aggregations)
            .enter()
            .append('div')
            .attr('data-value', d => d.key)
            .classed('item', true)
            .text(d => d.title);
        $element.dropdown('set text', metric.selectedAg.title);
    };
    const redraw = render;
    const mockChart = { filterAll, focus, render, redraw };
    dc.registerChart(mockChart);
    return mockChart;
};

/**
 * Muscle multi-selection dropdown component.
 */
mb.component.muscleDropdown = function(selector, model) {
    const $element = $(selector);
    const menu = d3.select(selector).select('.scrolling.menu');
    $element.dropdown({
        fullTextSearch: true,
        onChange: function(value, text, $selectedItem) {
            const values = value
                .split(',')
                .map(d => $.isNumeric(d) ? +d : null)
                .filter(d => d != null);
            const mids = new Set(values);
            if (values.length === 0) {
                model.dimension.filterAll();
            } else {
                model.dimension.filterFunction(d => mids.has(d));
            }
            mb.component.renderAll();
        }
    });
    const filterAll = function() {
        model.dimension.filterAll();
    };
    const focus = function() {};
    const render = function() {
        // Only create the muscle menu once
        if (menu.node().childNodes.length == 0) {
            menu.selectAll('div')
                .data(mb.Muscle.displayable())
                .enter()
                .append('div')
                .attr('data-value', d => d.key)
                .classed('item', true)
                .text(d => d.value.name);
        };
    };
    const redraw = render;
    const mockChart = { filterAll, focus, render, redraw };
    dc.registerChart(mockChart);
    return mockChart;
};

/**
 * Exercise multi-selection dropdown component.
 */
mb.component.exerciseDropdown = function(selector, model) {
    const $element = $(selector);
    const menu = d3.select(selector).select('.scrolling.menu');
    $element.dropdown({
        fullTextSearch: true,
        onChange: function(value, text, $selectedItem) {
            const values = value
                .split(',')
                .map(d => $.isNumeric(d) ? +d : null)
                .filter(d => d != null);
            const xids = new Set(values);
            if (values.length === 0) {
                model.dimension.filterAll();
            } else {
                model.dimension.filterFunction(d => xids.has(d));
            }
            mb.component.renderAll();
        }
    });
    const filterAll = function() {
        model.dimension.filterAll();
    };
    const focus = function() {};
    const render = function() {
        // Only create the exercise menu once
        if (menu.node().childNodes.length == 0) {
            mb.Exercise.all()
                .then(exercises => {
                    menu.selectAll('div')
                        .data(exercises)
                        .enter()
                        .append('div')
                        .attr('data-value', d => d.id)
                        .classed('item', true)
                        .text(d => d.name);
                });
        };
    };
    const redraw = render;
    const mockChart = { filterAll, focus, render, redraw };
    dc.registerChart(mockChart);
    return mockChart;
};

/**
 * Reps bar chart.
 */
mb.component.repsChart = function(selector, model) {
    const chart = dc.barChart(selector)
        .dimension(model.dimension)
        .group(model.group)
        .gap(1)
        .colorDomain(colorbrewer.Reds[3])
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal().domain(d3.range(0, 13, 1)))
        .title(d => {
            if (!d.value) return null;
            return `<div class="right menu"><span class="ui item">${d.value} sets</span></div>`;
        })
        .elasticY(true)
        .yAxisLabel("sets")
        .on('preRender', (chart) => {
            mb.util.sizeDcChartToFit(chart);
        });
    chart.xAxis().ticks(5);
    chart.xAxis().tickFormat(v => v == 12 ? "12+" : v);
    chart.yAxis()
        .tickFormat(d3.format('d'))
        .tickSubdivide(0);
    chart.tip = function(selector) {
        chart.on('renderlet', chart => {
            chart.svg()
                .selectAll('rect.bar')
                .on('mouseover', function (d) {
                    d3.select(selector)
                        .style("display", "initial")
                        .html(chart.title()(d.data));
                })
                .on('mouseout', function (d) {
                    d3.select(selector)
                        .style("display", "none")
                        .text(null);
                });
        });
        return chart;
    };
    return chart;
};

/**
 * Sets bar chart.
 */
mb.component.setsChart = function(selector, model) {
    const chart = dc.barChart(selector)
        .dimension(model.dimension)
        .group(model.group)
        .gap(1)
        .colorDomain(colorbrewer.Reds[3])
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal().domain(d3.range(0, 11, 1)))
        .title(d => {
            if (!d.value) return null;
            return `<div class="right menu"><span class="ui item">${d.value} workouts</span></div>`;
        })
        .elasticY(true)
        .yAxisLabel('workouts', 20)
        .on('preRender', (chart) => {
            mb.util.sizeDcChartToFit(chart);
        });
    chart.xAxis().ticks(5);
    chart.xAxis().tickFormat(v => v == 10 ? '10+' : v);
    chart.yAxis()
        .tickFormat(d3.format('d'))
        .tickSubdivide(0);
    chart.tip = function(selector) {
        chart.on('renderlet', chart => {
            chart.svg()
                .selectAll('rect.bar')
                .on('mouseover', function (d) {
                    d3.select(selector)
                        .style("display", "initial")
                        .html(chart.title()(d.data));
                })
                .on('mouseout', function (d) {
                    d3.select(selector)
                        .style("display", "none")
                        .text(null);
                });
        });
        return chart;
    };
    return chart;
};

/**
 * Weight bar chart.
 */
mb.component.weightChart = function(selector, model) {
    const prepareWeightsChart = function(chart) {
        const maxLabels = chart.width() / 25;
        const keys = model.group.all().map(d => d.key);
        const ticks = keys.length > maxLabels ? keys.filter((d,i) => !(i%2)) : keys;
        chart.xAxis().tickValues(ticks);
    };
    const chart = dc.barChart(selector)
        .dimension(model.dimension)
        .group(model.group)
        .gap(1)
        .valueAccessor(d => d.value)
        .colorDomain(colorbrewer.Reds[3])
        .elasticY(true)
        .elasticX(true)
        .xUnits(dc.units.ordinal)
        .x(d3.scale.ordinal())
        .title(d => {
            if (!d.key) return null;
            return `<div class="right menu"><span class="ui item">${d.value} sets</span><span class="ui item">${d.key} lbs</span></div>`;
        })
        .yAxisLabel("sets", 20)
        .on('preRender', (chart) => {
            mb.util.sizeDcChartToFit(chart);
            prepareWeightsChart(chart);
        })
        .on('preRedraw', chart => {
            prepareWeightsChart(chart);
            chart.render();
        });
    chart.yAxis()
        .tickFormat(d3.format("d"))
        .tickSubdivide(0);
    chart.tip = function(selector) {
        chart.on('renderlet', chart => {
            chart.svg()
                .selectAll('rect.bar')
                .on('mouseover', function (d) {
                    d3.select(selector)
                        .style("display", "initial")
                        .html(chart.title()(d.data));
                })
                .on('mouseout', function (d) {
                    d3.select(selector)
                        .style("display", "none")
                        .text(null);
                });
        });
        return chart;
    };
    return chart;
};


/**
 * A github-style calendar chart where colors represent range values of the group.
 */
mb.component.calendarChart = function(selector, model) {
    return dc.calendarGraph(selector)
        .dimension(model.dimension)
        .group(model.group)
        .valueAccessor(model.valueAccessor)
        .title(d => {
            const dateStr = moment(d.key).format('ddd, MMM D, YYYY');
            const valueStr = model.formattedValue(d);
            return `<div class="right menu"><span class="ui item">${dateStr}</span><span class="ui item">${valueStr}</span></div>`;
        })
        .on('preRender', (chart) => {
            mb.util.sizeDcChartToFit(chart);
            chart.colors(mb.util.colorThresholds(model.thresholds()));
        });
};

/**
 * An anatomy visualisation where colors represent range values of the group. 
 */
mb.component.anatomyChart = function(selector, model) {
    return dc.anatomyDiagram(selector)
        .dimension(model.dimension)
        .group(model.group)
        .valueAccessor(model.valueAccessor)
        .colorAccessor(model.valueAccessor)
        .title(d => {
            const muscleName = mb.Muscle.withID(d.key).name;
            const valueStr = model.formattedValue(d);
            return `<div class="right menu"><span class="ui item">${muscleName}</span><span class="ui item">${valueStr}</span></div>`;
        })
        .on('preRender', (chart) => {
            chart.colors(mb.util.colorThresholds(model.thresholds(), '#eee'));
        });
};

/**
 * A time-series chart displaying metric data in the y axis
 */
mb.component.timeChart = function(selector, model) {
    let today = moment().endOf('day');
    let scaleStack = [];
    const oneMonthAgo = moment(today).subtract(1, 'month');
    const oneWeekAgo = moment(today).subtract(1, 'week');
    const chart = dc.barChart(selector)
        .dimension(model.dimension)
        .group(model.group)
        .valueAccessor(model.valueAccessor)
        .colorAccessor(model.valueAccessor)
        .round(d3.time.day.round)
        .xUnits(d3.time.days)
        .x(d3.time.scale().domain([oneMonthAgo, today]))
        .elasticY(true)
        .title(d => {
            const dateStr = moment(d.key).format('ddd, MMM D, YYYY');
            const valueStr = model.formattedValue(d);
            return `<div class="right menu"><span class="ui item">${dateStr}</span><span class="ui item">${valueStr}</span></div>`;
        })
        .on('preRender', (chart) => {
            mb.util.sizeDcChartToFit(chart);
            chart.colors(mb.util.colorThresholds(model.thresholds()));
            chart.yAxisLabel(model.valueLabel());
        });
    const origFilterAll = chart.filterAll;
    // https://github.com/dc-js/dc.js/issues/991
    chart._disableMouseZoom = function() {};
    chart.xAxis().ticks(3);
    chart.yAxis().ticks(3, ",.1s");
    chart.filter(dc.filters.RangedFilter(oneWeekAgo, today));
    chart.turnOffControls();
    chart.filterAll = () => {
        chart.replaceFilter(dc.filters.RangedFilter(oneWeekAgo, today));
        chart.x().domain([oneMonthAgo, today]);
        dc.redrawAll();
        chart.turnOffControls();
        scaleStack = [];
    };
    chart.zoomIn = function(domain) {
        scaleStack.push(chart.x().domain());
        const filter = !arguments.length
            ? chart.filters()[0]
            : domain;
        chart.x().domain(filter);
        dc.redrawAll();
        chart.turnOnControls();
    };
    chart.zoomOut = function() {
        const minDate = model.minDate();
        const scale = scaleStack.pop() || [minDate, today];
        chart.x().domain(scale);
        dc.redrawAll();
        chart.turnOnControls();
    };
    chart.panLeft = function() {
        const minDate = model.minDate();
        const domain = chart.x().domain().map(d => moment(d));
        const filter = chart.filter().map(d => moment(d));
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
            chart.x().domain(domain);
        }
        chart.brush().extent(filter);
        chart.replaceFilter(dc.filters.RangedFilter(filter[0], filter[1]));
        dc.redrawAll();
    };
    chart.panRight = function() {
        const domain = chart.x().domain().map(d => moment(d));
        const filter = chart.filter().map(d => moment(d));
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
            chart.x().domain(domain);
        }
        chart.replaceFilter(dc.filters.RangedFilter(filter[0], filter[1]));
        dc.redrawAll();
    };
    chart.toggleBrush = function(event) {
        chart.brushOn(!chart.brushOn());
        chart.render();
    };
    chart.tip = function(selector) {
        chart.on('renderlet', chart => {
            chart.svg()
                .selectAll('rect.bar')
                .on('mouseover', function (d) {
                    d3.select(selector)
                        .style("display", "initial")
                        .html(chart.title()(d.data));
                })
                .on('mouseout', function (d) {
                    d3.select(selector)
                        .style("display", "none")
                        .text(null);
                });
        });
        return chart;
    };
    return chart;
};

/**
 * Table component pretending to be a dc.js chart.
 */
mb.component.dataTable = function(selector, model) {
    const chart = dc.mbDataTable(selector)
        .dimension(model.dimension)
        .group(d => `Workout ${d.workout.toLocaleString()}: ${moment(d.start).format("ddd, MMM D, YYYY")}`)
        .columns([
            {
                label: 'Exercise',
                format: d => d.exerciseName || 'unknown'
            },
            {
                label: 'Reps',
                format: d => d.reps,
                classed: d => {
                    return d.xcalc.prs.find(p => p === 'reps') ? 'negative' : null;
                }
            },
            {
                label: 'Weight',
                format: d => d.xcalc.netweight.toLocaleString(),
                classed: d => {
                    return d.xcalc.prs.find(p => p === 'weight') ? 'negative' : null;
                }
            },
            {
                label: 'Set',
                format: d => d.xcalc.rset.toLocaleString(),
                classed: d => {
                    return d.xcalc.prs.find(p => p === 'sets') ? 'negative' : null;
                }
            },
            {
                label: 'Volume',
                format: d => d.xcalc.xvolume.toLocaleString(),
                classed: d => {
                    return d.xcalc.prs.find(p => p === 'volume') ? 'negative' : null;
                }
            },
            {
                label: 'Duration',
                format: d => mb.util.formatDuration(d.duration)
            },
            {
                label: 'Rest',
                format: d => d.xcalc.restdur ? mb.util.formatDuration(d.xcalc.restdur) : null,
            },
            {
                label: 'Failure',
                format: d => d.failure ? '<i class="red checkmark icon"></i>' : null,
                classed:  d => d.failure ? 'center aligned negative' : 'center aligned'
            }
        ])
        .order(d3.descending)
        .sortBy(d => d.start)
        .size(Infinity)
        .rowFormat(d => d.warmup ? 'warning' : null)
        .on('renderlet', chart => {
            chart.root()
                .selectAll('table')
                .classed('ui celled stackable small table', true);
        });
};
