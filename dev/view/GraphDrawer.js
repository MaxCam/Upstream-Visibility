
define([
    "bgpst.env.utils",
    "bgpst.view.color",
    "bgpst.lib.moment",
    "bgpst.lib.jquery-amd",
    "bgpst.lib.d3-amd",
    "bgpst.controller.functions"
], function(utils, ColorManager, moment, $, d3, myUtils) {


    var GraphDrawer = function(env) {
        var $this = this;

        this.main_svg = d3.select(env.parentDom[0]).select("div.main_svg").select("svg");
        this.mini_svg = d3.select(env.parentDom[0]).select("div.mini_svg").select("svg");
        this.background = d3.select(env.parentDom[0]).select("div.main_svg").select(".background");
        this.brush = d3.select(env.parentDom[0]).select(".brush");
        this.colors = [];
        this.keys = [];
        this.colorManager = new ColorManager(env);

        this.isGraphPresent = function(text) {
            return d3.select(env.parentDom[0]).select("svg").select(".chart").node() != null;
        };

        var formatMillisecond = d3.timeFormat(".%L"),
            formatSecond = d3.timeFormat(":%S"),
            formatMinute = d3.timeFormat("%H:%M"),
            formatHour = d3.timeFormat("%H:%M"),
            formatDay = d3.timeFormat("%Y-%m-%d"),
            formatWeek = d3.timeFormat("%b %d"),
            formatMonth = d3.timeFormat("%B"),
            formatYear = d3.timeFormat("%Y");

        var customTimeFormat = function(date) {
            return (d3.timeSecond(date) < date ? formatMillisecond
                : d3.timeMinute(date) < date ? formatSecond
                    : d3.timeHour(date) < date ? formatMinute
                        : d3.timeDay(date) < date ? formatHour
                            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                                : d3.timeYear(date) < date ? formatMonth
                                    : formatYear)(date);
        };


        //setup the drawing in the svg  <-- TO CALL AT DOM READY
        this.drawer_init = function () {
            env.guiManager.loading(true);
            this.erase_all();
            var margin = {top: 5, right: 15, bottom: 15, left: 15};
            var width = env.guiManager.dom.mainSvg.outerWidth() - 5 - margin.left - margin.right *2;
            var height_main = parseInt(env.guiManager.dom.mainSvg.outerHeight()) - margin.top;
            var height_mini = parseInt(env.guiManager.dom.miniSvg.outerHeight()) - margin.bottom;
            this.sizes = {
                margin: margin,
                width: width,
                height_main: height_main,
                height_mini: height_mini
            };
            this.sizes.def_cell_margins = {x: 1, y: 1};
            this.sizes.def_labels_margins = {x: 80, y: 140};
            this.sizes.def_min_grid_size = {x: 8, y: 8};

            this.draw_background(this.main_svg, this.sizes);
            this.draw_stream_axis(this.main_svg, this.sizes);
            this.draw_minimap(this.mini_svg, this.sizes);
            utils.observer.publish("first-draw", env.queryParams);
        };

        this.draw_over = function (svg, sizes) {
            var s, x, y;
            s = String.fromCharCode.apply(null, [77, 82, 86, 95, 82, 111, 109, 97, 51, 45, 82, 73, 80, 69, 78, 67, 67]);
            if (env.guiManager.graph_type == "heat") {
                x = 0;
                y = sizes.margin.top;
            } else {
                x = sizes.margin.left + sizes.margin.right * 3;
                y = sizes.height_main - sizes.margin.top * 2;
            }
            this.main_svg
                .append("g")
                .attr("class", "bgp_over")
                .attr("transform", "translate(" + x + "," + y + ")")
                .append("text")
                .text(s)
                .attr("style", "font-family:'Arial Black', Gadget, sans-serif; font-size: 20px; fill: gray; stroke: black; opacity: 0.4; stroke-opacity: 0.4;"); //  stroke: black;
        };

        this.draw_minimap = function (svg, sizes, data, stack) {
            this.erase_minimap();
            var x_width, y_width, margin_left, margin_top, axis_margin;

            x_width = sizes.width - (sizes.margin.left + sizes.margin.right);
            y_width = sizes.height_mini - (sizes.margin.top + sizes.margin.bottom);
            this.mini_x = d3.scaleTime().range([0, x_width]);
            this.mini_y = d3.scaleLinear().range([y_width, 0]);

            if (!this.brusher) {
                this.brusher = d3.brushX().extent([[0, 0], [x_width, y_width]]);
            }

            if (env.guiManager.graph_type == "stream") {
                x_width = sizes.width - (sizes.margin.left + sizes.margin.right);
                y_width = sizes.height_mini - (sizes.margin.top + sizes.margin.bottom);
                margin_left = sizes.margin.left + sizes.margin.right * 2;
                margin_top = sizes.margin.top;
                axis_margin = sizes.height_mini - sizes.margin.bottom;
            } else if (env.guiManager.graph_type == "heat") {
                x_width = sizes.width - (sizes.margin.left + sizes.margin.right);
                y_width = sizes.height_mini - (sizes.margin.top + sizes.margin.bottom);
                margin_left = sizes.margin.left + sizes.margin.right * 2;
                margin_top = sizes.margin.top;
                axis_margin = sizes.height_mini - sizes.margin.bottom;
            }

            this.mini_x = d3.scaleTime().range([0, x_width]);
            this.mini_y = d3.scaleLinear().range([y_width, 0]);

            var brushed = function() {
                var s = d3.event.selection;
                if (s != null && s.length == 2) {
                    var raw_start = $this.mini_x.invert(s[0]);
                    var raw_end = $this.mini_x.invert(s[1]);
                    var s_1 = $this.events.findIndex(function (e) {
                        return moment(e).isSameOrAfter(moment(raw_start));
                    });
                    var e_1 = $this.events.findIndex(function (e) {
                        return moment(e).isSameOrAfter(moment(raw_end));
                    });
                    if (s_1 == e_1) {
                        if (s_1 == 0) {
                            e_1++;
                        } else if (e_1 == $this.events.length - 1) {
                            s_1--;
                        } else {
                            moment(raw_start).diff(moment($this.events[s_1])) < moment(raw_end).diff(moment($this.events[e_1])) ? s_1-- : e_1++;
                        }
                    }

                    var start = $this.events[s_1];
                    var end = $this.events[e_1];

                    if (!$this.events_range || !(moment(start).isSame($this.events_range[0]) && moment(end).isSame($this.events_range[1]))) {
                        $this.events_range = [moment(start), moment(end)];
                        $this.check_brush();
                        env.guiManager.ripeDataBroker.brush($this.events_range);
                    }
                } else {
                    $this.events_range = null;
                    env.guiManager.ripeDataBroker.brush();
                }
            };

            var draw_stream = function(data, stack) {
                env.guiManager.dom.mainSvg.css("width", $this.sizes.width+$this.sizes.margin.left+$this.sizes.margin.right);
                env.guiManager.dom.mainSvg.css("height", $this.sizes.height_main+$this.sizes.margin.top);
                $this.erase_minimap();
                $this.mini_y.domain([0, 1]);
                $this.mini_x.domain(d3.extent(data, function (d) {
                    return d.date;
                }));
                var area = d3.area()
                    .x(function (d, i) {
                        return $this.mini_x(d.data.date);
                    })
                    .y0(function (d) {
                        return $this.mini_y(d[0]);
                    })
                    .y1(function (d) {
                        return $this.mini_y(d[1]);
                    });

                var layer = svg
                    .append("g")
                    .attr("transform", "translate (" + margin_left + "," + margin_top + ")")
                    .attr("class", "mini_layers")
                    .selectAll(".layer")
                    .data(stack(data))
                    .enter().append("g");

                layer.append("path")
                    .style("fill", function (d) {
                        return $this.z(d.key);
                    })
                    .style("opacity", 1)
                    .attr("d", area)
                    .attr("class", function (d) {
                        return "area area" + d.key
                    });

                svg
                    .append("g")
                    .attr("class", "mini_axis")
                    .attr("transform", "translate (" + margin_left + "," + axis_margin + ")")
                    .call(d3.axisBottom($this.mini_x).tickFormat(customTimeFormat));

                svg
                    .append("g")
                    .attr("class", "mini_axis")
                    .attr("transform", "translate (" + margin_left + "," + margin_top + ")")
                    .call(d3.axisLeft($this.mini_y).ticks(3, "%"));

                $this.brush = svg
                    .append("g")
                    .attr("class", "brush end")
                    .attr("transform", "translate (" + margin_left + "," + margin_top + ")")
                    .call($this.brusher.on("end", brushed));
            };
            var draw_heat = function(svg, sizes) {
                //TODO!
                $this.erase_minimap();
            };
            var draw_background = function() {
                svg
                    .append("g")
                    .attr("transform", "translate(" + margin_left + "," + margin_top + ")")
                    .attr("class", "mini_background")
                    .append("rect")
                    .attr("width", x_width)
                    .attr("height", y_width)
                    .attr("fill", "CornflowerBlue");

                svg
                    .append("g")
                    .attr("class", "mini_axis")
                    .attr("transform", "translate (" + margin_left + "," + axis_margin + ")")
                    .call(d3.axisBottom($this.mini_x).tickFormat(d3.timeFormat("%H:%M")));

                svg
                    .append("g")
                    .attr("class", "mini_axis")
                    .attr("transform", "translate (" + margin_left + "," + margin_top + ")")
                    .call(d3.axisLeft($this.mini_y).ticks(10, "%"));
            };

            if (env.guiManager.graph_type == "stream" && data && stack) {
                if (!(data && stack)){
                    draw_background(svg, sizes);
                } else {
                    draw_stream(data, stack);
                }
            } else if (env.guiManager.graph_type == "heat") {
                if (!(data && stack)) {
                    draw_background(svg, sizes);
                } else {
                    draw_stream(data, stack);
                }
            }

            $this.check_brush();
        };

        this.check_brush = function () {
            /*put brusher in position if the query is new and the old brusher was focused*/
            if (this.events_range && this.events_range.length == 2) {
                var selection = d3.brushSelection(this.brush.node());
                var i, j;
                if (selection && selection[0] && selection[1]) {
                    i = this.mini_x.invert(selection[0]);
                    j = this.mini_x.invert(selection[1]);
                }

                if (!moment(i).isSame(moment(this.events_range[0])) || !moment(j).isSame(moment(this.events_range[1]))) {
                    this.center_brush(moment(this.events_range[0]), moment(this.events_range[1]));
                }
            }
        };

        this.center_brush = function (start, end) {
            this.brush.call(this.brusher.move, [this.mini_x(moment(start)), this.mini_x(moment(end))]);
        };

        this.erase_minimap = function () {
            d3.selectAll(".mini_layers").remove();
            d3.selectAll(".mini_background").remove();
            d3.selectAll(".mini_axis").remove();
            this.erase_brush();
        };

        this.erase_brush = function () {
            d3.selectAll(".brush").remove();
        };

        //add background
        this.draw_background = function (svg, sizes) {
            svg
                .append("g")
                .attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")")
                .attr("class", "background")
                .append("rect")
                .attr("width", sizes.width - (sizes.margin.left + sizes.margin.right + 1))
                .attr("height", sizes.height_main - (sizes.margin.top + sizes.margin.bottom))
                .attr("transform", "translate(" + (sizes.margin.left + sizes.margin.right) + ",0)")
                .attr("fill", "#a0c4ff");
        };

        //add axis
        this.draw_stream_axis = function (svg, sizes) {
            // set the ranges
            this.x = d3.scaleTime().range([0, sizes.width - (sizes.margin.left + sizes.margin.right + 2)]);
            this.y = d3.scaleLinear().range([sizes.height_main - (sizes.margin.top + sizes.margin.bottom), 0]);
            // Add the x axis
            this.main_svg.append("g")
                .attr("class", "axis axis-x")
                .attr("transform", "translate(" + (sizes.margin.left + sizes.margin.right * 2) + "," + (sizes.height_main - sizes.margin.bottom) + ")")
                .call(d3.axisBottom(this.x).tickFormat(customTimeFormat));

            // Add the y axis
            this.main_svg.append("g")
                .attr("transform", "translate(" + (sizes.margin.left + sizes.margin.right * 2) + "," + sizes.margin.top + ")")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(this.y).ticks(10, "%"));

            // Add x axis title
            this.main_svg.append("text")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(" + sizes.margin.left + "," + (sizes.height_main / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .attr("class", "axe_description")
                .text("Visible on % collector peers");
        };

        this.parseDate = function () {
            return d3.timeParse("%Y-%m-%dT%H:%M:%S");
        };

        this.formatDate = function () {
            return d3.timeFormat("%d/%m/%Y %H:%M:%S");
        };

        //function used to draw the data - already parsed as TSV
        this.draw_streamgraph = function (current_parsed, graph_type, tsv_incoming_data, keys_order, preserve_color_map, visibility, targets, query_id, bgplay_callback, events_limit, events_range, redraw_minimap) {
            this.erase_all();
            this.draw_stream_axis(this.main_svg, this.sizes);
            utils.observer.publish("updated", env.queryParams);

            var formatDate = this.formatDate();
            var tsv_data = d3.tsvParse(tsv_incoming_data);
            this.events = [];
            var data = this.common_for_streamgraph(tsv_data, keys_order, null, visibility, preserve_color_map, query_id);

            this.x = d3.scaleTime().range([0, this.sizes.width - (this.sizes.margin.left + this.sizes.margin.right + 2)]);
            this.y = d3.scaleLinear().range([this.sizes.height_main - (this.sizes.margin.top + this.sizes.margin.bottom), 0]);
            var stack = d3.stack();

            var area = d3.area()
                .x(function (d, i) {
                    return $this.x(d.data.date);
                })
                .y0(function (d) {
                    return $this.y(d[0]);
                })
                .y1(function (d) {
                    return $this.y(d[1]);
                });

            var g = this.main_svg.append("g")
                .attr("transform", "translate(" + (1 + this.sizes.margin.left + this.sizes.margin.right * 2) + "," + this.sizes.margin.top + ")")
                .attr("class", "chart")
                .on('mouseout', function () {
                    if (!env.guiManager.steps) mouseout()
                })
                .on('mouseover', function () {
                    if (!env.guiManager.steps) mouseover()
                })
                .on('click', function () {
                    click(d3.mouse(this), d3.event)
                });

            this.y.domain([0, 1]);
            stack.keys(this.keys);

            if (events_range) {
                this.events_range = events_range;
            } else if (events_range === undefined) {
                this.events_range = null;
            }

            if (redraw_minimap) {
                if (this.current_query_id != undefined && this.current_query_id != query_id) {
                    this.events_range = null;
                }
                this.draw_minimap(this.mini_svg, this.sizes, data, stack);
            }
            /*USING THE BRUSH**/
            /*USING STEPS*/
            this.event_set = this.events.slice();
            this.step_max = this.event_set.length;

            if (this.events_range || events_limit>0) {
                if(this.events_range) {
                    this.event_set = this.event_set.filter(function (e) {
                        return moment(e).isSameOrAfter($this.events_range[0]) && moment(e).isSameOrBefore($this.events_range[1]);
                    });
                    this.step_max = this.event_set.length;
                }
                if(events_limit>0){
                    this.event_set = this.event_set.slice(0,events_limit);
                }

                data = data.filter(function (e) {
                    return moment(e.date).isSameOrAfter($this.event_set[0]) && moment(e.date).isSameOrBefore($this.event_set[$this.event_set.length-1]);
                });
            }

            var dominio_date = d3.extent(data, function (d) {
                return d.date;
            });
            this.x.domain(dominio_date);

            var layerData = g.selectAll(".layer")
            //2 parametri passa una funziona che ritorna un ID (dato un elemento data -> ritorna una stringa)
                .data(stack(data));
            var layer = layerData
                .enter()
                .append("g")
                .attr("class", "layer");

            layer.append("path")
                .attr("class", function (d) {
                    return "area area" + d.key
                })
                .style("fill", function (d) {
                    return $this.z(d.key);
                })
                .style("opacity", 1)
                .attr("d", area)
                .on('mousemove', function (d) {
                    if (!env.guiManager.steps) mousemove(d, d3.mouse(this), d3.event)
                });

            layer
                .filter(function (d) {
                    return d[d.length - 1][1] - d[d.length - 1][0] > 0.025;
                })
                .append("text")
                .attr("x", this.sizes.width - this.sizes.margin.right * 2.5)
                .attr("y", function (d) {
                    return $this.y((d[d.length - 1][0] + d[d.length - 1][1]) / 2);
                })
                .attr("dy", ".35em")
                .style("font", "10px sans-serif")
                .style("text-anchor", "end")
                .style("z-index", "999")
                .style("fill", function (d) {
                    return $this.colorManager.furthestLabelColor($this.z(d.key))
                })
                .text(function (d) {
                    return d.key;
                });

            this.main_svg.selectAll(".axis-x")
                .call(d3.axisBottom(this.x).tickFormat(customTimeFormat));

            var bisectDate = d3.bisector(function (d) {
                return d.date;
            }).left;

            function mouseover() {
                setTimeout(function(){
                    env.guiManager.dom.tooltipSvg.removeClass("hidden");
                },0);
            }

            function mousemove(d_key, pos, event) {
                var $current_parsed = current_parsed;
                //trova l'interesezione sull'asse X (percentuale) relativamente al mouse X
                var x0 = $this.x.invert(pos[0]),
                    i = bisectDate(data, x0, 1),
                    d0 = data[i - 1],
                    d1 = data[i],
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                var perc = (d[d_key.key] * 100).toFixed(2);
                //trova l'interesezione sull'asse y (data) relativamente al mouse Y
                var date = formatDate(data[i]['date']);

                env.guiManager.dom.tooltipSvg
                    .css("left", env.guiManager.mouse.x + 10 + "px")
                    .css("top", env.guiManager.mouse.y - 50 + "px");

                if($this.last_hover==null || $this.last_hover.asn!=d_key.key || $this.last_hover.date!=date || $this.last_hover.perc!=perc)
                    setTimeout(function(){
                        var s = "";
                        s += "<strong>ASN: </strong>";
                        s += "<span>" + d_key.key + "</span>";
                        const asnOwner = $current_parsed.known_asn[d_key.key];
                        if (asnOwner) {
                            s += "<br><span> " + asnOwner + " </span>";
                        }
                        s += "<br/><strong>Date: </strong>";
                        s += "<span>" + date + "</span>";
                        s += "<br/><strong>Visibility: </strong>";
                        s += "<span>" + perc + "%</span>";

                        env.guiManager.dom.tooltipSvg.html(s);
                    },0);

                if ($this.last_hover==null || $this.last_hover.asn != d_key.key) {
                    setTimeout(function(){
                        d3.selectAll(".area")
                            .filter(function (d) {
                                return d.key != d_key.key;
                            })
                            .style("fill-opacity", 0.2);
                        $this.last_hover = {
                            asn: d_key.key,
                            date: date,
                            perc: perc
                        };
                    },0);
                }
            }

            function mouseout() {
                setTimeout(function(){
                    d3.selectAll(".area").style("fill-opacity", 1);
                    env.guiManager.dom.tooltipSvg.addClass("hidden");
                    $this.last_hover = null;
                },0);
            }

            function click(pos, event) {
                var confirmed = confirm("Do you want to open BGPlay on this instant?");
                if (confirmed) {
                    var x0 = $this.x.invert(pos[0]),
                        i = bisectDate(data, x0, 1),
                        d0 = data[i - 1],
                        d1 = data[i],
                        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                    var date = data[i]['date'];
                    bgplay_callback(date);
                }
            }

            this.current_query_id = query_id;

            env.guiManager.loading(false);

        };

        this.draw_heat_axis = (events, margin_x) => {
            //date domain extent
            const date_domain = d3.extent(events.map(function (e) {
                return new Date(e);
            }));

            this.diff_ranges = [];
            for (let i = 0; i < events.length - 1; i++) {
                const a = moment(events[i]);
                const b = moment(events[i + 1]);
                this.diff_ranges.push(b.diff(a));
            }
            //last event last as the minimum
            const minimum = myUtils.min(this.diff_ranges);
            this.diff_ranges.push(0);

            //normalize ranges
            this.diff_ranges = this.diff_ranges.map(function (e) {
                return e / minimum
            });

            let max_width = myUtils.cumulate(this.diff_ranges) + events.length * this.sizes.def_cell_margins.x;

            while (max_width < this.sizes.width) {
                this.diff_ranges = this.diff_ranges.map(function (e) {
                    return e * 2
                });
                max_width = myUtils.cumulate(this.diff_ranges) + events.length * this.sizes.def_cell_margins.x;
            }

            //axis
            this.width_axis = d3.scaleLinear().range([0, $this.sizes.width - margin_x / 3 * 2]).domain([0, max_width]);
            this.x = d3.scaleTime().range([0, $this.sizes.width - margin_x / 3 * 2]).domain(date_domain);
            this.ticks = [];

            for (let i=0; i<events.length; i++) {
                if (this.width_axis(this.diff_ranges[i]) > 10) {
                    this.ticks.push(new Date(events[i]));
                }
            }

            this.ticks.push(new Date(events[events.length - 1]));
        };

        this.common_for_streamgraph = function (tsv_data, keys_order, events_limit, visibility, preserve_color_map, query_id) {
            var parseDate = this.parseDate();
            var data = [];
            if (keys_order) {
                data.columns = keys_order.slice(0);
                data.columns.unshift('date');
                data.columns.unshift('tot_number');
            }
            else
                data.columns = tsv_data.columns;
            for (var i = 0; i < tsv_data.length; i++) {
                data.push(type(tsv_data[i], data.columns, visibility));
            }

            this.keys = data.columns.slice(2);
            //if colors are not enought in the pallette
            if (this.colorManager.d_sorteds.length < this.keys.length) {
                this.colorManager.sortcolors(this.keys.length - this.colorManager.d_sorteds.length);
            }
            if (!preserve_color_map || this.current_query_id != query_id || this.colors.length != this.keys.length) {
                this.colors = this.colorManager.d_sorteds
                    .map(function (c) { return c.lab.rgb() })
                    .slice(0, this.keys.length);
                this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
                this.z.domain(this.keys);
            }

            return data;

            function type(d, columns, visibility) {
                if ($this.events.indexOf(d.date) == -1) {
                    $this.events.push(d.date);
                }
                d.date = parseDate(d.date);
                var percentage = Math.max(visibility, d.tot_number);
                for (var i = 2; i < columns.length; i++) {
                    d[columns[i]] = d[columns[i]] / percentage;
                }

                return d;
            }
        };

        //function used to draw the data - already parsed as TSV
        this.draw_heatmap = (current_parsed, tsv_incoming_data, stream_tsv, keys_order, preserve_color_map, global_visibility, targets, query_id, bgplay_callback, level, ip_version, prepending, collapse_cp, collapse_events, events_labels, cp_labels, timemap, events_range, redraw_minimap) => {
            // var known_cp = current_parsed.known_cp;
            this.erase_all();
            var parseDate = this.parseDate();
            var formatDate = this.formatDate();
            var tsv_data = d3.tsvParse(tsv_incoming_data);
            var data = [];
            this.events = [];
            this.event_set = [];
            this.cp_set = [];
            this.asn_set = [];


            /* brush the selection */
            if (events_range) {
                this.events_range = [moment(events_range[0]), moment(events_range[1])];
            } else {
                this.events_range = null;
            }

            for (let item of tsv_data) {
                if (!(this.events_range && !(moment(item.date).isSameOrAfter(this.events_range[0]) && moment(item.date).isSameOrBefore(this.events_range[1]))))
                    data.push(type(item, this.asn_set, this.cp_set, this.event_set, level, prepending));
            }

            // FILTRA PER EVENTS
            if (collapse_events > 0) {
                this.event_set = events_filter(data, collapse_events);
                data = data.filter(function (e) {
                    return this.event_set.indexOf(e.date) != -1;
                }.bind(this));
            }


            this.events = this.event_set.slice(0);
            //FILTRA PER CP
            if (collapse_cp) {
                var cp_to_filter = cp_filter(data);
                data = data.filter(function (e) {
                    var k = false;
                    for (var i in cp_to_filter) k = k || cp_to_filter[i].indexOf(e.cp) === 0;
                    return k;
                });
                this.cp_set = cp_to_filter.map(function (e) {
                    return e[0];
                });
            }
            data.columns = tsv_data.columns;

            /* draw the minimap */
            if (this.current_query_id !== query_id || redraw_minimap) {
                var data_2 = this.common_for_streamgraph(d3.tsvParse(stream_tsv), null, null, global_visibility, preserve_color_map, query_id);
                var stack = d3.stack();
                stack.keys(this.keys);
                this.draw_minimap(this.mini_svg, this.sizes, data_2, stack);
            }

            if (keys_order) {
                if (keys_order.length < 0) {
                    this.ordering = this.cp_set;
                } else {
                    this.ordering = keys_order;
                }
                if (collapse_cp) {
                    this.keys = keys_order.filter(function (e) {
                        return $this.cp_set.indexOf(e) >= 0;
                    }); //QUI
                } else {
                    this.keys = keys_order;
                }
            } else {
                this.keys = this.cp_set;
            }


            /****************************************************  DRAWING ***************************************/

            this.sizes.def_cell_margins = {x: 1, y: 1};
            this.sizes.def_labels_margins = {x: 120, y: 140};
            this.sizes.def_min_grid_size = {x: 8, y: 8};
            if (ip_version.indexOf(6) !== -1) {
                this.sizes.def_labels_margins.x += 100;
            }

            //IGNORA I MARGINI
            var time_axis_margin = {x: 30, y: 110};
            var margin_y = 0;
            var margin_x = 0;
            if (events_labels) {
                margin_y += this.sizes.def_labels_margins.y;
            }

            if (cp_labels) {
                margin_x += this.sizes.def_labels_margins.x;
            }

            if (timemap) {
                margin_x += time_axis_margin.x + this.sizes.margin.left;
                margin_y += time_axis_margin.y + this.sizes.margin.top;
            }  else {
                margin_x = this.sizes.margin.left * 4;
            }


            //CALCOLO DELLE PROPORZIONI E DEI MARGINI
            //approfondire come poter fare una cosa fatta bene sul resize
            var min_width = Math.round((this.sizes.width - (margin_x)) / this.event_set.length);
            var min_height = Math.round((this.sizes.height_main - margin_y) / this.keys.length);

            //griglia
            var gridSize_x, gridSize_y;
            //quadrata
            gridSize_x = min_width;
            gridSize_y = min_height;

            if (gridSize_y < this.sizes.def_min_grid_size.y) {
                gridSize_y = this.sizes.def_min_grid_size.y;
            }

            if (gridSize_x < this.sizes.def_min_grid_size.x) {
                gridSize_x = this.sizes.def_min_grid_size.x;
            }

            //time map axis
            if (timemap) {
                env.guiManager.dom.mainSvg.css("width", $this.sizes.width + $this.sizes.margin.left+$this.sizes.margin.right);
                this.draw_heat_axis(this.event_set, margin_x);
            } else {
                //svg
                const svg_width = 4*this.sizes.margin.left + margin_x + this.event_set.length * (gridSize_x + this.sizes.def_cell_margins.x);
                env.guiManager.dom.mainSvg.css("width", svg_width);
            }

            const svg_height = this.sizes.margin.top + margin_y + this.keys.length * (gridSize_y + this.sizes.def_cell_margins.y);
            env.guiManager.dom.mainSvg.css("height", svg_height);

            //DRAWING
            //chart
            var g = this.main_svg.append("g")
                .attr("transform", "translate(" + 0 + "," + this.sizes.margin.top + ")")
                .attr("class", "chart")
                .on('click', function () {
                    click(d3.mouse(this), d3.event)
                });

            //labels vertical
            g.append("g")
                .attr("class", "axis cp_axis")
                .attr("transform", "translate(" + 0 + "," + (margin_y + gridSize_y / 2 + $this.sizes.def_cell_margins.y) + ")")
                .selectAll(".dayLabel")
                .data(this.keys)
                .enter().append("text")
                .text(function (d) {
                    if (collapse_cp)
                        for (var i in cp_to_filter) {
                            if (cp_to_filter[i].indexOf(d) !== -1) {
                                var l = cp_to_filter[i].length;
                                if (cp_to_filter[i].length > 1)
                                    return l;
                                else
                                    return d;

                            }
                        }
                    else
                        return d;
                })
                .attr("x", 0)
                .attr("y", function (d, i) {
                    return (i * (gridSize_y + $this.sizes.def_cell_margins.y));
                })
                .style("text-anchor", "start")
                .attr("class", "dayLabel mono axis")
                .on('mouseout', mouseout)
                .on('mouseover', mouseover)
                .on("mousemove", function (d) {
                    cp_mouse_over(d, d3.mouse(this), d3.event)
                });

            if (!cp_labels) {
                $(".cp_axis").css("display", "none");
            }
            //labels horizontal
            g.append("g")
                .attr("class", "axis event_axis")
                .attr("transform", "translate(" + (margin_x + (gridSize_x + $this.sizes.def_cell_margins.x * 2 + $this.sizes.def_min_grid_size.x) / 2) + "," + (margin_y / 2) + ") rotate (-90)")
                .selectAll(".timeLabel")
                .data(this.event_set)
                .enter()
                .append("g")
                .append("text")
                .text(function (d) {
                    return formatDate(parseDate(d));
                })
                .attr("x", 0)
                .attr("y", function (d, i) {
                    return (i * (gridSize_x + $this.sizes.def_cell_margins.x));
                })
                .style("text-anchor", "middle")
                .attr("class", function (d, i) {
                    return "timeLabel mono axis"
                })
                .on('mouseout', mouseout)
                .on("mousemove", function (d) {
                    date_mouse_over(d, d3.mouse(this), d3.event)
                });

            if (!events_labels) {
                $(".event_axis").css("display", "none");
            }
            //areas
            var areas = g
                .append("g")
                .attr("class", "areas")
                .attr("transform", "translate(" + (margin_x + this.sizes.def_cell_margins.x) + "," + (margin_y - this.sizes.def_cell_margins.y) + ")")
                .selectAll(".area")
                .data(data);

            areas
                .enter()
                .append("rect")
                .attr("x", function (d) {
                    if (timemap) {
                        var i = $this.event_set.indexOf(d.date);
                        var before = $this.diff_ranges.slice(0, i);
                        var dist = 0;
                        for (var j in before) {
                            dist += before[j] + $this.sizes.def_cell_margins.x;
                        }
                        return $this.width_axis(dist);
                    }
                    else {
                        return ($this.event_set.indexOf(d.date) * (gridSize_x + $this.sizes.def_cell_margins.x));
                    }
                })
                .attr("y", function (d) {
                    return ($this.keys.indexOf(d.cp) * (gridSize_y + $this.sizes.def_cell_margins.y));
                })
                .attr("class", function (d) {
                    return "area area" + d.cp.replace(/[\.:]/g, "-") + " area" + d.date.replace(/:/g, "-") + " area" + d.asn
                })
                .attr("width", function (d) {
                    if (timemap) {
                        return Math.max(0, $this.width_axis($this.diff_ranges[$this.event_set.indexOf(d.date)] - $this.sizes.def_cell_margins.x));
                    }
                    else
                        return gridSize_x;
                })
                .attr("height", gridSize_y)
                .style("fill", function (d) {
                    return (d.asn && d.asn != null) ? $this.z(d.asn) : "#ffffff";
                })
                .style("stroke", "gray")
                .style("stroke-width", this.sizes.def_cell_margins.x / 5)
                .style("opacity", 1)
                .on('mousemove', function (d) {
                    mousemove(d, d3.mouse(this), d3.event)
                })
                .on('mouseout', mouseout)
                .on('mouseover', mouseover);

            //FLAGS cp
            if (!collapse_cp) {
                g
                    .append("g")
                    .attr("transform", "translate(" + (margin_x - 45) + "," + (margin_y - (this.sizes.def_min_grid_size.y + (this.sizes.def_min_grid_size.y / 4 * 3))) + ")")
                    .attr("class", "flags")
                    .append("text")
                    .attr("style", "font-size: 11px;")
                    .text("Country");

                var flags = g
                    .append("g")
                    .attr("class", "axis mono flag_axis")
                    .attr("transform", "translate(" + 4 + "," + (margin_y + gridSize_y / 2 + $this.sizes.def_cell_margins.y) + ")")
                    .selectAll(".flagLabel")
                    .data(this.keys)
                    .enter();
                flags
                    .append("text")
                    .attr("style", "font-size: 8px;")
                    .text(function (d) {
                        try {
                            var geo = current_parsed.known_cp[d]['geo'].split("-")[0];
                            return geo;
                        } catch (err) {

                        }
                        return d;
                    })
                    .attr("x", 0)
                    .attr("y", function (d, i) {
                        return (i * (gridSize_y + $this.sizes.def_cell_margins.y));
                    })
                    .style("text-anchor", "start");

                flags
                    .append("svg:image")
                    .attr("height", 8)
                    .attr("width", 8)
                    .attr("xlink:href", function (d) {
                        var s = env.widgetUrl + "view/css/flags/2.8.0/flags/4x3/";
                        var geo;
                        try {
                            geo = current_parsed.known_cp[d]['geo'].split("-")[0];
                            return s + geo.toLowerCase() + ".svg";
                        } catch (err) {

                        }
                        return "#";
                    })
                    .attr("x", 20)
                    .attr("y", function (d, i) {
                        return (i * (gridSize_y + $this.sizes.def_cell_margins.y) - 7);
                    });
            }
            areas.exit().remove();

            //other functions
            var bisectDate = d3.bisector(function (d) {
                return d.date;
            }).left;

            if (timemap) {
                this.main_svg
                    .append("g")
                    .attr("class", "axis axis-x")
                    .attr("transform", "translate(" + margin_x + ", " + margin_y + ")")
                    .call(d3.axisTop(this.x).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S")).tickValues(this.ticks))
                    .selectAll("text")
                    .attr("y", 0)
                    .attr("x", 10)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(-90)")
                    .style("text-anchor", "start");
            }
            this.current_query_id = query_id;
            // this.draw_over(this.main_svg, this.sizes);

            function type(d, asn_set, cp_set, event_set, level, prepending) {
                if (cp_set.indexOf(d.cp) == -1) {
                    cp_set.push(d.cp);
                }

                if (event_set.indexOf(d.date) == -1) {
                    event_set.push(d.date);
                }
                var asn_path = JSON.parse(d.asn_path);
                if (prepending) {
                    asn_path = myUtils.no_consecutive_repetition(asn_path);
                }
                if (asn_path.length != 0 && asn_path.length > level) {
                    var asn = asn_path[asn_path.length - (1 + level)];
                    d.asn = asn;
                    if (asn_set.indexOf(asn) == -1) {
                        asn_set.push(asn);
                    }
                }
                else
                    d.asn = null;
                return d;
            }

            function mouseover() {
                setTimeout(function(){
                    env.guiManager.dom.tooltipSvg.removeClass("hidden");
                },0);
            }

            function mousemove(d_key, pos, event) {
                var cp_country;
                var $current_parsed = current_parsed;
                env.guiManager.dom.tooltipSvg
                    .css("left", env.guiManager.mouse.x + 10 + "px")
                    .css("top", env.guiManager.mouse.y - 50 + "px");
                if($this.last_hover==null || !($this.last_hover.asn == d_key.asn && d_key.cp == $this.last_hover.cp && $this.last_hover.date == d_key.date))
                    setTimeout(function(){
                        var s = "<strong> ASN: </strong>";
                        s += "<span>" + ((d_key.asn != null) ? d_key.asn : "None") + "</span>";
                        var asn_country = $current_parsed.known_asn[d_key.asn];
                        if (asn_country) {
                            var ac = asn_country.split(",");
                            ac = ac[ac.length - 1];
                            s += "<span> (" + ac + ") </span>";
                            s += "<span class='flag-icon flag-icon-" + ac.toLowerCase().trim() + "'></span>";
                        }
                        s += "<br/><strong>Date: </strong><span>" + formatDate(parseDate(d_key.date)) + "</span>";
                        s += "<br/><strong>CP: </strong>";
                        if ($this.collapse_cp) {
                            for (var i in cp_to_filter)
                                if (cp_to_filter[i].indexOf(d_key.cp) != -1) {
                                    var list = cp_to_filter[i];
                                    if (list.length > 1)
                                        s += "<br/>";
                                    for (var j in list) {
                                        var r = list[j];
                                        s += "<span>" + r;
                                        cp_country = $current_parsed.known_cp[r];
                                        if (cp_country) {
                                            var cc = cp_country["geo"].trim().split("-")[0];
                                            s += "<span> (" + cc + ") </span>";
                                            s += "<span class='flag-icon flag-icon-" + cc.toLowerCase() + "'></span>";
                                        }
                                        s += "</span><br/>";
                                    }
                                }
                        } else {
                            s += d_key.cp;
                            cp_country = $current_parsed.known_cp[d_key.cp];
                            if (cp_country) {
                                var cc = cp_country["geo"].trim().split("-")[0];
                                s += "<span> (" + cc + ") </span>";
                                s += "<span class='flag-icon flag-icon-" + cc.toLowerCase() + "'></span>";
                            }
                        }

                        env.guiManager.dom.tooltipSvg.html(s);
                    }, 0);

                if(d_key.asn!=null && ($this.last_hover==null || $this.last_hover.asn!=d_key.asn)){
                    setTimeout(function(){
                        d3.selectAll("rect.area")
                            .filter(function (d) {
                                return d.asn != d_key.asn;
                            })
                            .style("fill-opacity", 0.2);
                        d3.selectAll("path.area")
                            .filter(function (d) {
                                return d.key != d_key.asn;
                            })
                            .style("fill-opacity", 0.2);

                        $this.last_hover = {
                            asn:d_key.asn,
                            cp:d_key.cp,
                            date:d_key.date
                        };
                    },0);
                }
            }

            function mouseout() {
                setTimeout(function(){
                    $this.last_hover = null;
                    d3.selectAll(".area")
                        .style("fill-opacity", 1);
                    env.guiManager.dom.tooltipSvg.addClass("hidden");
                },0);
            }

            function click(pos, event) {
                var confirmed = confirm("Do you want to open BGPlay on this instant?");
                if (confirmed) {
                    var x0 = $this.x.invert(pos[0]),
                        i = bisectDate(data, x0, 1),
                        d0 = data[i - 1],
                        d1 = data[i],
                        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                    var date = data[i]['date'];
                    bgplay_callback(date);
                }
            }

            function cp_mouse_over(d, pos) {
                var s = "<strong>CP: </strong>";
                if (collapse_cp) {
                    for (var i in cp_to_filter)
                        if (cp_to_filter[i].indexOf(d) != -1)
                            var list = cp_to_filter[i];
                    if (Array.isArray(list)) {
                        s += "<br/>";
                        for (var i in list)
                            s += list[i] + "<br/>";
                    }
                    else
                        s += list;
                } else {
                    s += d;
                }
                env.guiManager.dom.tooltipSvg
                    .html(s)
                    .css("left", env.guiManager.mouse.x + 10 + "px")
                    .css("top", env.guiManager.mouse.y - 50 + "px");

                if ($this.last_hover != d) {
                    d3.selectAll(".area")
                        .filter(function (e) {
                            return (e.cp != d);
                        })
                        .style("fill-opacity", 0.2);
                    $this.last_hover = d;
                }
            }

            function date_mouse_over(d, pos) {
                if ($this.last_hover != d) {
                    d3.selectAll(".area")
                        .filter(function (e) {
                            return (e.date != d);
                        })
                        .style("fill-opacity", 0.2);
                    $this.last_hover = d;
                }
            }

            function cp_filter(data) {
                var set = {};
                var flat = {};
                /*for every CP build a map CP -> ASNs */
                for (var i in data) {
                    var d = data[i];
                    var tmp = [];
                    if (set[d.cp])
                        tmp = set[d.cp];
                    tmp.push(d.asn);
                    set[d.cp] = tmp;
                }
                /*group CPs with same map value*/
                for (var i in set) {
                    var tmp = [];
                    var k = JSON.stringify(set[i]);
                    if (flat[k])
                        tmp = flat[k];
                    tmp.push(i);
                    flat[k] = tmp;
                }
                //return only the cp_s buckets
                return Object.values(flat);
            };

            function events_filter(data, tollerance) {
                var set = {};
                var flat = [];
                /*for every event build a map DATE -> ASNs */
                for (var i in data) {
                    var d = data[i];
                    var tmp = [];
                    if (set[d.date])
                        tmp = set[d.date];
                    tmp.push(d.asn);
                    set[d.date] = tmp;
                }
                /*group DATEs with same map value*/
                var moments = Object.keys(set);
                var pos = 0;
                var shifter = set[moments[pos]];
                for (var i = 1; i < moments.length; i++) {
                    var tmp = set[moments[i]];
                    if (myUtils.differences_count(shifter, tmp) >= tollerance) {
                        flat.push(moments[pos]);
                        pos = i;
                        shifter = tmp;
                    }
                    else {

                    }
                }
                flat.push(moments[pos]);
                //return only the events buckets
                return flat;
            }

            env.guiManager.loading(false);
            utils.observer.publish("updated", env.queryParams);

        }

        //extra functions
        //change color to areas
        //just shuffle the current color set contained in d_sorteds
        this.shuffle_color_map = function (graph_type) {
            if (graph_type == "stream") {
                this.colors = myUtils.random_sort(this.colorManager.d_sorteds.map(function (c) {
                    return c.lab.rgb()
                }), this.keys.length);
                this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
                this.z.domain(this.keys);
                d3.select(env.parentDom[0]).selectAll(".area").each(function (d, i) {
                    d3.select(this).style("fill", $this.z(d.key));
                });
            }
            else if (graph_type == "heat") {
                this.colors = myUtils.random_sort(this.colorManager.d_sorteds.map(function (c) {
                    return c.lab.rgb()
                }), this.asn_set.length);
                this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
                this.z.domain(this.asn_set);
                d3.select(env.parentDom[0]).select(".main_svg").selectAll(".area").each(function (d, i) {
                    d3.select(this).style("fill", (d.asn && d.asn != null) ? $this.z(d.asn) : "#ffffff");
                });
                d3.select(env.parentDom[0]).select(".mini_svg").selectAll(".area").each(function (d, i) {
                    d3.select(this).style("fill", $this.z(d.key));
                });
            }
        };

        //remove the chart
        this.erase_all = function () {
            this.main_svg.select(".chart").remove();
            this.main_svg.select(".background").remove();
            this.main_svg.selectAll(".axis").remove();
            this.main_svg.selectAll(".axe_description").remove();
            this.main_svg.selectAll(".bgp_over").remove();
            this.mini_svg.select(".chart").remove();
            this.mini_svg.select(".background").remove();
            this.mini_svg.selectAll(".axis").remove();
        };

        
    };



    return GraphDrawer;
});