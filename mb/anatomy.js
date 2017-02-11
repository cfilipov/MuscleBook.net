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

dc.anatomyDiagram = function(parent, chartGroup) {
    const _anteriorFile = "mb/anterior.svg";
    const _posteriorFile = "mb/posterior.svg";
    let _chart = dc.marginMixin(dc.colorMixin(dc.baseMixin({})));
    let _diagramFile = _anteriorFile;
    let _tipSelector = ".tip";

	_chart.diagramFile = function(_) {
		if (!arguments.length) return _diagramFile;
		_diagramFile = _;
		return _chart;
	};

    _chart.tip = function(selector) {
        if (!arguments.length) {
            return _tipSelector;
        }
        _tipSelector = selector;
        return _chart;
    };

    _chart.anterior = function(_) {
         _diagramFile = _anteriorFile;
        return _chart;
    }

    _chart.posterior = function(_) {
         _diagramFile = _posteriorFile;
        return _chart;
    }

    _chart.resetSvg = function() {
        return _chart.svg();
    };

    _chart._doRedraw = function () {
        return _chart._doRender();
    };

    _chart._doRender = function() {

        if (!_chart.svg()) {
            generateSvg(fillDiagram);
            return;
        } else {
            fillDiagram();
        }
        return _chart;
    };

    _chart.width = function(width) {
        if (!arguments.length) {
            return undefined;
        }
        return _chart;
    };

    _chart.height = function(height) {
        if (!arguments.length) {
            return undefined;
        }
        return _chart;
    };

    _chart.colorAccessor(function (d) {
        return getValue(d);
    });

    function getValue(d) {
        return _chart.valueAccessor()(d);
    }

    function fill(d, i) {
        return _chart.getColor(d, i);
    }

    function fillDiagram() {

        var div = d3.select("body").append("div")	
            .attr("class", "tooltip tooltip-bottom");

        function highlightSlice (i, whether) {
            _chart.select('g.pie-slice._' + i)
                .classed('highlight', whether);
        }

        _chart.svg()
            .selectAll("path")
            .filter(".muscle")
            .data(_chart.data(), function(d) { return (d && d.key) || d3.select(this).attr("id"); })
            .on("mouseover", function (d) {
                d3.select(this)
                    .classed("highlight", true);
                d3.select(_tipSelector)
                    .style("display", "initial")
                    .html(_chart.title()(d));
            })
            .on("mouseout", function (d) {
                d3.select(this)
                    .classed("highlight", false);
                d3.select(_tipSelector)
                    .style("display", "none")
                    .text(null);
            })
            .attr("fill", fill)
            .exit().attr("fill", "#eee");
    }

    function generateSvg(completion) {
        d3.xml(_diagramFile).mimeType("image/svg+xml").get(function(error, xml) {
			if (error) {
                throw new Error(error);
            }
            let node = _chart.root().node().appendChild(xml.documentElement);
            _chart.svg(d3.select(node));
            completion();
		});
        return _chart.svg();
    }

    return _chart.anchor(parent, chartGroup);
};
