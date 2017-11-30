function GraphDrawer(GuiManager) {
	console.log("== Starting GraphDrawer");
	this.main_svg = d3.select("div.main_svg").select("svg");
	this.mini_svg = d3.select("div.mini_svg").select("svg");
	this.background = d3.select("div.main_svg").select(".background");
	this.brush = d3.select(".brush");
	this.tooltip = $(".svg_tooltip");
	this.x,this.y,this.z,this.colors=[],this.keys=[];
	this.mini_x, this.mini_y;
	this.events_range;
	this.ColorManager = new ColorManager();
	this.GuiManager; //post-set
	this.current_query_id;
	this.last_hover;
	this.ordering;
	console.log("== GraphDrawer Ready");
}

//setup the drawing in the svg  <-- TO CALL AT DOM READY
GraphDrawer.prototype.drawer_init = function() {
	this.erase_all();
	var margin = {top: 15, right: 15, bottom: 15, left: 15};
	var width = $("div.main_svg").outerWidth() - margin.left - margin.right;
	var height_main = parseInt($("div.main_svg").outerHeight()) - margin.top;
	var height_mini = parseInt($("div.main_svg").outerHeight()/2) - (margin.bottom + margin.top);
	this.sizes = {
		margin: margin,
		width :width,
		height_main: height_main,
		height_mini: height_mini
	};
	this.sizes.def_cell_margins = {x: 1, y: 1};
	this.sizes.def_labels_margins = {x:80, y:140};
	this.sizes.def_min_grid_size = {x:8, y:8};

	this.draw_background(this.main_svg,this.sizes);
	this.draw_stream_axis(this.main_svg,this.sizes);
	this.draw_minimap(this.mini_svg,this.sizes);
	this.draw_over(this.main_svg,this.sizes);
}

GraphDrawer.prototype.draw_over = function(svg, sizes) {
	var s,x,y;
	s=String.fromCharCode.apply(null, [77, 82, 86, 95, 82, 111, 109, 97, 51, 45, 82, 73, 80, 69, 78, 67, 67]);
	if(this.GuiManager.graph_type=="heat"){
		x=0;
		y=sizes.margin.top;
	}
	else {
		x=sizes.margin.left+sizes.margin.right*3;
		y=sizes.height_main-sizes.margin.top*2;
	}
	this.main_svg
		.append("g")
		.attr("class","bgp_over")
		.attr("transform", "translate("+x+","+y+")")
		.append("text")
		.text(s)
		.attr("style","font-family:'Arial Black', Gadget, sans-serif; font-size: 20px; stroke: black; fill: gray; opacity: 0.4; stroke-opacity: 0.4;");
}

GraphDrawer.prototype.draw_minimap= function(svg,sizes,data,stack) {
	this.erase_minimap();
	var GuiManager = this.GuiManager;
	var drawer = this;
	var x_width = sizes.width-(sizes.margin.left+sizes.margin.right);
	var y_width = sizes.height_mini-(sizes.margin.top+sizes.margin.bottom);
	this.mini_x = d3.scaleTime().range([0, x_width]);
	this.mini_y = d3.scaleLinear().range([y_width, 0]);
	if(!this.brusher){
		this.brusher = d3.brushX()
			.extent([[0, 0], [x_width, y_width]]);
	}

	if(GuiManager.graph_type=="stream"){
		var x_width = sizes.width-(sizes.margin.left+sizes.margin.right);
		var y_width = sizes.height_mini-(sizes.margin.top+sizes.margin.bottom);
		var margin_left = sizes.margin.left+sizes.margin.right*2;
		var margin_top = sizes.margin.top;
		var axis_margin = sizes.height_mini-sizes.margin.top;
	}
	else 
	if(GuiManager.graph_type=="heat"){
		var x_width = sizes.width-(sizes.margin.left+sizes.margin.right);
		var y_width = sizes.height_mini-(sizes.margin.top+sizes.margin.bottom);
		var margin_left = sizes.margin.left+sizes.margin.right*2;
		var margin_top = sizes.margin.top;
		var axis_margin = sizes.height_mini-sizes.margin.top;
	}

	this.mini_x = d3.scaleTime().range([0, x_width]);
	this.mini_y = d3.scaleLinear().range([y_width, 0]);

	if(GuiManager.graph_type=="stream" &&data&&stack){
		if(!(data&&stack))
			draw_background(svg,sizes);
		else {	
			console.log("draw mini map STREAM")
			draw_stream(data,stack);
		}
	}
	else
	if(GuiManager.graph_type=="heat"){
		if(!(data&&stack))
			draw_background(svg,sizes);
		else {
			console.log("draw mini map HEAT")
			draw_stream(data,stack);
			//draw_heat(data,stack);
		}
	}

	drawer.check_brush();

	function brushed(){
		//CONTINUA DA QUI 
		var sx = null;
		var s = d3.event.selection;
		if(s!=null && s.length==2){
			var raw_start = drawer.mini_x.invert(s[0]);
			var raw_end = drawer.mini_x.invert(s[1]);
			var s_1 = drawer.events.findIndex(function(e){return moment(e).isSameOrAfter(moment(raw_start));});
			var e_1 = drawer.events.findIndex(function(e){return moment(e).isSameOrAfter(moment(raw_end));});
			if(s_1==e_1){
				if(s_1==0)
					e_1++;
				else
				if(e_1==drawer.events.length-1)
					s_1--;
				else {
					if(moment(raw_start).diff(moment(drawer.events[s_1]))<moment(raw_end).diff(moment(drawer.events[e_1])))
						s_1--;
					else
						e_1++;
				}
			}
			
			var start = drawer.events[s_1];
			var end = drawer.events[e_1];
			console.log("DISCRETE START"+raw_start+" is "+start+" ("+s_1+")")
			console.log("DISCRETE END"+raw_end+" is "+end+" ("+e_1+")")
			console.log("brush selection: "+start+", "+end);
			if(!drawer.events_range || !(moment(start).isSame(drawer.events_range[0]) && moment(end).isSame(drawer.events_range[1]))){
				drawer.events_range=[moment(start),moment(end)];
				drawer.check_brush();
				GuiManager.RipeDataBroker.brush(drawer.events_range);
			}
		}
		else{
			drawer.events_range=null;
			GuiManager.RipeDataBroker.brush();
		}
	}

	function draw_stream(data,stack){
		drawer.erase_minimap();
		drawer.mini_y.domain([0,1]);
		drawer.mini_x.domain(d3.extent(data, function(d) { return d.date; }));
		var area = d3.area()
			.x(function(d, i) {return drawer.mini_x(d.data.date); })
			.y0(function(d) {return drawer.mini_y(d[0]); })
			.y1(function(d) {return drawer.mini_y(d[1]); });

		var layer = svg
			.append("g")
			.attr("transform","translate ("+margin_left+","+margin_top+")")
			.attr("class","mini_layers")
			.selectAll(".layer")
			.data(stack(data))
			.enter().append("g");

		layer.append("path")
			.style("fill", function(d) { return drawer.z(d.key); })
			.style("opacity",1)
			.attr("d", area)
			.attr("class", function(d){return "area area"+d.key});

		svg
			.append("g")
			.attr("class","mini_axis")
			.attr("transform","translate ("+margin_left+","+axis_margin+")")
			.call(d3.axisBottom(drawer.mini_x));

		svg
			.append("g")
			.attr("class","mini_axis")
			.attr("transform","translate ("+margin_left+","+margin_top+")")
			.call(d3.axisLeft(drawer.mini_y).ticks(10, "%"));

		drawer.brush=svg
			.append("g")
			.attr("class", "brush end")
			.attr("transform","translate ("+margin_left+","+margin_top+")")
			.call(drawer.brusher.on("end", brushed));
	}

	function draw_heat(svg,sizes) {
		//TODO!
		drawer.erase_minimap();
	}

	function draw_background() {
		svg
			.append("g")
			.attr("transform", "translate(" + margin_left + "," + margin_top+ ")")
			.attr("class","mini_background")
			.append("rect")
			.attr("width", x_width)
			.attr("height",  y_width)
			.attr("fill", "CornflowerBlue");

		svg
			.append("g")
			.attr("class","mini_axis")
			.attr("transform","translate ("+margin_left+","+axis_margin+")")
			.call(d3.axisBottom(drawer.mini_x));

		svg
			.append("g")
			.attr("class","mini_axis")
			.attr("transform","translate ("+margin_left+","+margin_top+")")
			.call(d3.axisLeft(drawer.mini_y).ticks(10, "%"));
	}
}

GraphDrawer.prototype.check_brush = function() {
	/*put brusher in position if the query is new and the old brusher was focused*/
	if(this.events_range && this.events_range.length==2){
		var selection = d3.brushSelection(this.brush.node());
		var i,j;
		if(selection && selection[0] && selection[1]){
			var i = this.mini_x.invert(selection[0]);
			var j = this.mini_x.invert(selection[1]);
		}
		console.log(moment(i))
		console.log(moment(this.events_range[0]))
		console.log(moment(j))
		console.log(moment(this.events_range[1]))
		if(!moment(i).isSame(moment(this.events_range[0])) || !moment(j).isSame(moment(this.events_range[1]))){
			console.log("RE BRUSH")
			this.center_brush(moment(this.events_range[0]),moment(this.events_range[1]));
		}
	}
}

GraphDrawer.prototype.center_brush = function(start,end){
	console.log("CENTERING BRUSH TO "+start+" | "+end)
	this.brush.call(this.brusher.move,[this.mini_x(moment(start)),this.mini_x(moment(end))]);
}

GraphDrawer.prototype.erase_minimap = function() {
	d3.selectAll(".mini_layers").remove();
	d3.selectAll(".mini_background").remove();
	d3.selectAll(".mini_axis").remove();
	this.erase_brush();
}

GraphDrawer.prototype.erase_brush = function() {
	d3.selectAll(".brush").remove();
}

//add background
GraphDrawer.prototype.draw_background = function(svg,sizes) {
	svg
		.append("g")
		.attr("transform", "translate(" + sizes.margin.left + "," + sizes.margin.top + ")")
		.attr("class","background")
		.append("rect")
		.attr("width", sizes.width-(sizes.margin.left+sizes.margin.right+1))
		.attr("height",  sizes.height_main-(sizes.margin.top+sizes.margin.bottom))
		.attr("transform", "translate("+(sizes.margin.left+sizes.margin.right)+",0)")
		.attr("fill", "#a0c4ff");
}

//add axis
GraphDrawer.prototype.draw_stream_axis = function(svg,sizes) {
	// set the ranges
	this.x = d3.scaleTime().range([0, sizes.width-(sizes.margin.left+sizes.margin.right+2)]);
	this.y = d3.scaleLinear().range([sizes.height_main-(sizes.margin.top+sizes.margin.bottom), 0]);
	// Add the x axis
	this.main_svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate("+(sizes.margin.left+sizes.margin.right*2)+","+(sizes.height_main-sizes.margin.top)+")")
		.call(d3.axisBottom(this.x));
	// Add the y axis
	this.main_svg.append("g")
		.attr("transform", "translate("+(sizes.margin.left+sizes.margin.right*2)+","+sizes.margin.top+")")
		.attr("class", "axis axis--y")
		.call(d3.axisLeft(this.y).ticks(10, "%"));
	// Add x axis title
	this.main_svg.append("text")
		.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
		.attr("transform", "translate("+sizes.margin.left+","+(sizes.height_main/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
		.attr("class", "axe_description")
		.text("Visibility");
	// Add y axis title
	this.main_svg.append("text")
		.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
		.attr("transform", "translate("+((sizes.width/2)+(sizes.margin.left*5/2))+","+(sizes.height_main+sizes.margin.top)+")")  // centre below axis
		.attr("class", "axe_description")
		.text("Timestamp");
}

GraphDrawer.prototype.parseDate = function(){
	return d3.timeParse("%Y-%m-%dT%H:%M:%S");
}

GraphDrawer.prototype.formatDate = function(){
	return d3.timeFormat("%d/%m/%Y %H:%M:%S");
}

//function used to draw the data - already parsed as TSV
GraphDrawer.prototype.draw_streamgraph = function(current_parsed, graph_type, tsv_incoming_data, keys_order, preserve_color_map, global_visibility, targets, query_id, bgplay_callback, events_limit, events_range, redraw_minimap){
	var drawer = this;
	this.erase_all();
	this.draw_stream_axis(this.main_svg,this.sizes);
	var parseDate = this.parseDate();
	var formatDate = this.formatDate();
	var tsv_data = d3.tsvParse(tsv_incoming_data);
	var visibility = global_visibility;
	this.events = [];
	var	data = this.common_for_streamgraph(tsv_data, keys_order, events_limit, visibility, preserve_color_map, query_id);

	this.x = d3.scaleTime().range([0, this.sizes.width-(this.sizes.margin.left+this.sizes.margin.right+2)]);
	this.y = d3.scaleLinear().range([this.sizes.height_main-(this.sizes.margin.top+this.sizes.margin.bottom), 0]);
	var stack = d3.stack();

	var area = d3.area()
		.x(function(d, i) {return drawer.x(d.data.date); })
		.y0(function(d) { return drawer.y(d[0]); })
		.y1(function(d) { return drawer.y(d[1]); });

	var g = this.main_svg.append("g")
		.attr("transform", "translate(" + (1+this.sizes.margin.left+this.sizes.margin.right*2) + "," + this.sizes.margin.top + ")")
		.attr("class","chart")
		.on('mouseout', function(){if(!drawer.GuiManager.steps) mouseout()})
		.on('mouseover', function(){if(!drawer.GuiManager.steps) mouseover()})
		.on('click', function(){click(d3.mouse(this), d3.event)});

	this.y.domain([0,1]);
	stack.keys(this.keys);

	if(events_range)
		this.events_range=events_range;
	else 
	if(events_range===undefined)
		this.events_range=null;

	if(redraw_minimap){
		if(this.current_query_id!=undefined&&this.current_query_id!=query_id)
			this.events_range=null;
		this.draw_minimap(this.mini_svg,this.sizes,data,stack);
	}
	/*USING THE BRUSH**/
	if(this.events_range){
		data = data.filter(function(e){return moment(e.date).isSameOrAfter(drawer.events_range[0]) && moment(e.date).isSameOrBefore(drawer.events_range[1]);})		
	}

	var dominio_date=d3.extent(data, function(d) { return d.date; });
	this.x.domain(dominio_date);

	var layerData = g.selectAll(".layer")
	//2 parametri passa una funziona che ritorna un ID (dato un elemento data -> ritorna una stringa)
		.data(stack(data));
	var layer = layerData 
		.enter()
		.append("g")
		.attr("class", "layer");

	layer.append("path")
		.attr("class", function(d){return "area area"+d.key})
		.style("fill", function(d) { return drawer.z(d.key); })
		.style("opacity",1)
		.attr("d", area)
		.on('mousemove', function(d){if(!drawer.GuiManager.steps) mousemove(d,d3.mouse(this))});
	
	layer.filter(function(d) { return d[d.length - 1][1] - d[d.length - 1][0] > 0.025; })
		.append("text")
		.attr("x", this.sizes.width - this.sizes.margin.right*2.5)
		.attr("y", function(d) { return drawer.y((d[d.length - 1][0] + d[d.length - 1][1]) / 2); })
		.attr("dy", ".35em")
		.style("font", "10px sans-serif")
		.style("text-anchor", "end")
		.style("z-index","999")
		.style("fill",  function(d) { return drawer.ColorManager.furthestLabelColor(drawer.z(d.key))})
		.text(function(d) { return d.key; });

	this.main_svg.selectAll(".axis--x")
		.call(d3.axisBottom(this.x));

	var bisectDate = d3.bisector(function(d) { return d.date; }).left;

	function mouseover() {
		drawer.tooltip.removeClass("hidden");
	}
	
	function mousemove(d_key,pos) {
		//trova l'interesezione sull'asse X (percentuale) relativamente al mouse X
		var x0 = drawer.x.invert(pos[0]),
		i = bisectDate(data, x0, 1),
		d0 = data[i - 1],
		d1 = data[i],
		d = x0 - d0.date > d1.date - x0 ? d1 : d0;
		var perc = (d[d_key.key]*100).toFixed(2);
		//trova l'interesezione sull'asse y (data) relativamente al mouse Y
		var date = formatDate(data[i]['date']);
		var s = "";
		s+="<strong>ASN: </strong>";
		s+="<span>"+d_key.key+"</span>";
		var asn_country = current_parsed.known_asn[d_key.key];
		if(asn_country){
			var ac = asn_country.split(",");
			ac = ac[ac.length-1].trim();
			s+="<span> ("+ac+") </span>";
			s+="<span class='flag-icon flag-icon-"+ac.toLowerCase()+"'></span>";
		}
		s+="<br/><strong>Date: </strong>";
		s+="<span>"+date+"</span>";
		s+="<br/><strong>%: </strong>";
		s+="<span>"+perc+"</span>";
		drawer.tooltip
			.html(s)
			.css("left", (d3.event.pageX + 10) + "px")
			.css("top", (d3.event.pageY - 35) + "px");
		
		if(drawer.last_hover!=d_key.key) {
			d3.selectAll(".area")
			.filter(function(d){
					return d.key!=d_key.key;
			})
			.style("fill-opacity",0.35);
			drawer.last_hover=d_key.key;
		}
	}

	function mouseout() {
		d3.selectAll(".area").style("fill-opacity",1);
		drawer.tooltip.addClass("hidden");
		drawer.last_hover=null;
	}

	function click(pos, event){
		//if(event.ctrlKey||event.altKey||event.shiftKey||event.metaKey) {
	       	var confirmed = confirm("Go to BGPlay?");
			if(confirmed){
				var x0 = drawer.x.invert(pos[0]),
				i = bisectDate(data, x0, 1),
				d0 = data[i - 1],
				d1 = data[i],
				d = x0 - d0.date > d1.date - x0 ? d1 : d0;
				var date = data[i]['date'];
				bgplay_callback(date);
			}
		//}
	}
	this.draw_over(this.main_svg, this.sizes);
	this.current_query_id=query_id;
}

GraphDrawer.prototype.draw_heat_axis = function(events, margin_x) {
	var drawer = this;
	//date domain extent
	var date_domain=d3.extent(events.map(function(e){return new Date(e);}));
	//ranges of time
	this.diff_ranges = [];
	for(var i=0; i<events.length-1; i++){
		var a = moment(events[i]);
		var b = moment(events[i+1]);
		var diff = b.diff(a);
		this.diff_ranges.push(diff);
	}
	//last event last as the minimum
	var minimum = min(this.diff_ranges);
	this.diff_ranges.push(0);
	//normalize ranges
	this.diff_ranges = this.diff_ranges.map(function(e){return e/minimum});
	var max_width = cumulate(this.diff_ranges)+events.length*this.sizes.def_cell_margins.x;
	while(max_width<drawer.sizes.width){
		this.diff_ranges = this.diff_ranges.map(function(e){return e*2});
		var max_width = cumulate(this.diff_ranges)+events.length*this.sizes.def_cell_margins.x;
	}
	//axis
	this.width_axis = d3.scaleLinear().range([0,drawer.sizes.width-margin_x/3*2]).domain([0,max_width]);
	this.x = d3.scaleTime().range([0,drawer.sizes.width-margin_x/3*2]).domain(date_domain);
	this.ticks = [];
	for(var i in events){
		if(this.width_axis(this.diff_ranges[i])>10)
			this.ticks.push(new Date(events[i]));
	}
	this.ticks.push(new Date(events[events.length-1]));
}

GraphDrawer.prototype.common_for_streamgraph = function(tsv_data, keys_order, events_limit, visibility, preserve_color_map, query_id){
	var drawer = this;
	var parseDate = this.parseDate();
	var data = [];
	if(keys_order) {
		data.columns=keys_order.slice(0);
		data.columns.unshift('date');
		data.columns.unshift('tot_number');
	}
	else 
		data.columns=tsv_data.columns;
	//events limit
	var limit = tsv_data.length;
	if(events_limit)
		limit=events_limit;
	for(var i=0; i<limit; i++){
		data.push(type(tsv_data[i], data.columns, visibility));
	}


	this.keys = data.columns.slice(2);
	//if colors are not enought in the pallette
	if(this.ColorManager.d_sorteds.length<this.keys.length)
		this.ColorManager.sortcolors(this.keys.length-this.ColorManager.d_sorteds.length);
	if(!preserve_color_map || this.current_query_id!=query_id || this.colors.length!=this.keys.length){
		this.colors = this.ColorManager.d_sorteds.map(function(c){return c.lab.rgb()}).slice(0,this.keys.length);
		this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
		this.z.domain(this.keys);
	}

	return data ;

	function type(d, columns, visibility) {
		if(drawer.events.indexOf(d.date)==-1)
			drawer.events.push(d.date);
		d.date = parseDate(d.date);
		var percentage = Math.max(visibility, d.tot_number);
		for (var i = 2; i<columns.length; i++) 
			d[columns[i]] = d[columns[i]] / percentage;
		return d;
	}
}

//function used to draw the data - already parsed as TSV
GraphDrawer.prototype.draw_heatmap = function(current_parsed, tsv_incoming_data, stream_tsv, keys_order, preserve_color_map, global_visibility, targets, query_id, bgplay_callback, level, ip_version, prepending, collapse_rrc, collapse_events, events_labels, rrc_labels, timemap, events_range, redraw_minimap){
	var known_rrc = current_parsed.known_rrc;
	var drawer = this;
	this.erase_all();
	var parseDate = this.parseDate();
	var formatDate = this.formatDate();
	var tsv_data = d3.tsvParse(tsv_incoming_data);
	var data = [];
	this.events = [];
	this.event_set = [];
	this.rrc_set = [];
	this.asn_set = [];

	/* brush the selection */
	if(events_range){
		this.events_range=[moment(events_range[0]),moment(events_range[1])];
	}
	else 
		this.events_range=null;

	for(var i=0; i<tsv_data.length; i++){
		if(!(this.events_range&& !(moment(tsv_data[i].date).isSameOrAfter(this.events_range[0])&&moment(tsv_data[i].date).isSameOrBefore(this.events_range[1]))))
			data.push(type(tsv_data[i],this.asn_set,this.rrc_set,this.event_set,level,prepending));
	}

	// FILTRA PER EVENTS
	if(collapse_events>0){
		this.event_set=events_filter(data,collapse_events);
		data=data.filter(e => this.event_set.indexOf(e.date)!=-1);
	}
	this.events = this.event_set.slice(0);
	//FILTRA PER RRC
	if(collapse_rrc){
		var rrc_to_filter = rrc_filter(data);
		data=data.filter(function (e){var k = false; for(var i in rrc_to_filter) k=k||rrc_to_filter[i].indexOf(e.rrc)==0; return k;});
		this.rrc_set=rrc_to_filter.map(function (e) {return e[0];});
	}
	data.columns=tsv_data.columns;
	
	/* draw the minimap */
	if(this.current_query_id!=query_id || redraw_minimap){
		var data_2 = this.common_for_streamgraph(d3.tsvParse(stream_tsv), null, null, global_visibility, preserve_color_map, query_id);
		var stack = d3.stack();
		stack.keys(this.keys);
		this.draw_minimap(this.mini_svg,this.sizes,data_2,stack);
	}

	if(keys_order){
		if(keys_order.length<0)
			this.ordering=this.rrc_set;
		else
			this.ordering=keys_order;
		if(collapse_rrc)
			this.keys = keys_order.filter(function(e){return drawer.rrc_set.indexOf(e)>=0;}); //QUI
		else 
			this.keys = keys_order;
	}
	else 
		this.keys = this.rrc_set;

	//data filter
	// if(this.events_range){
 //        this.event_set = this.event_set.filter(function(e){return moment(e).isSameOrAfter(drawer.events_range[0]) && moment(e).isSameOrBefore(drawer.events_range[1]);})        
 //        data = data.filter(function(e){return moment(e.date).isSameOrAfter(drawer.events_range[0]) && moment(e.date).isSameOrBefore(drawer.events_range[1]);});
 //    }

	/****************************************************  DRAWING ***************************************/

	this.sizes.def_cell_margins = {x: 1, y: 1};
	this.sizes.def_labels_margins = {x:120, y:140};
	this.sizes.def_min_grid_size = {x:8, y:8};
	if(ip_version.indexOf(6)!=-1)
		this.sizes.def_labels_margins.x+=100;

	//IGNORA I MARGINI
	var time_axis_margin = {x:30,y:110};
	var margin_y = 0, margin_x = 0;
	if(events_labels)
		margin_y += this.sizes.def_labels_margins.y;
	
	if(rrc_labels)
		margin_x += this.sizes.def_labels_margins.x;

	if(timemap){
		margin_x += time_axis_margin.x+this.sizes.margin.left;
		margin_y += time_axis_margin.y+this.sizes.margin.top;
	}
	else{
		margin_x = this.sizes.margin.left*3;
	}
	//CALCOLO DELLE PROPORZIONI E DEI MARGINI
	//approfondire come poter fare una cosa fatta bene sul resize
	var min_width = Math.round((this.sizes.width-(margin_x)) / this.event_set.length);
	var min_height = Math.round((this.sizes.height_main-margin_y) / this.keys.length);

	//griglia
	var gridSize_x,gridSize_y;
	//quadrata
	//gridSize_x=Math.max(min_width,min_height);
	//gridSize_y=gridSize_y;
	gridSize_x = min_width;
	gridSize_y = min_height;

	if(gridSize_y<this.sizes.def_min_grid_size.y)
		gridSize_y=this.sizes.def_min_grid_size.y;
	if(gridSize_x<this.sizes.def_min_grid_size.x)
		gridSize_x=this.sizes.def_min_grid_size.x;

	//time map axis
	if(timemap){
		this.draw_heat_axis(this.event_set,margin_x);
	}
	else {
	//svg
		var svg_width = this.sizes.margin.left+margin_x+this.event_set.length*(gridSize_x+this.sizes.def_cell_margins.x);
		$("div.main_svg").css("width", svg_width);
	}
	var svg_height = this.sizes.margin.top+margin_y+this.keys.length*(gridSize_y+this.sizes.def_cell_margins.y);
	$("div.main_svg").css("height", svg_height);

	//DRAWING
	//chart
	var g = this.main_svg.append("g")
		.attr("transform", "translate(" + 0 + "," + this.sizes.margin.top + ")")
		.attr("class","chart")
		.on('click', function(){click(d3.mouse(this), d3.event)});

	//labels vertical
	var RRCLabels = g
		.append("g")
		.attr("class","axis rrc_axis")
		.attr("transform", "translate(" + 0 + "," + (margin_y+gridSize_y/2+drawer.sizes.def_cell_margins.y) + ")")
		.selectAll(".dayLabel")
		.data(this.keys)
		.enter().append("text")
		.text(function (d) { 
			if(collapse_rrc)
				for(var i in rrc_to_filter) {
					if(rrc_to_filter[i].indexOf(d)!=-1){
						var l=rrc_to_filter[i].length;
						if(rrc_to_filter[i].length>1) 
							return l;
						else 
							return d;
						
					}
				}
			else
				return d;
		})
		.attr("x", 0)
		.attr("y", function (d, i) { return (i * (gridSize_y+drawer.sizes.def_cell_margins.y)); })
		.style("text-anchor", "start")
		.attr("class","dayLabel mono axis")
		.on('mouseout', mouseout)
		.on('mouseover', mouseover)
		.on("mousemove", function(d){
			rrc_mouse_over(d, d3.mouse(this))
		});

	if(!rrc_labels)
		$(".rrc_axis").css("display","none");
	//labels horizontal
	var EventsLabels = g
		.append("g")
		.attr("class","axis event_axis")
		.attr("transform", "translate(" + (margin_x+(gridSize_x+drawer.sizes.def_cell_margins.x*2+drawer.sizes.def_min_grid_size.x)/2) + ","+(margin_y/2)+") rotate (-90)")
		.selectAll(".timeLabel")
		.data(this.event_set)
		.enter()
		.append("g")
		.append("text")
		.text(function(d) { return formatDate(parseDate(d)); })
		.attr("x", 0)
		.attr("y", function (d, i) { return (i * (gridSize_x+drawer.sizes.def_cell_margins.x)); })
		.style("text-anchor", "middle")
		.attr("class", function(d, i) { return "timeLabel mono axis"})
		.on('mouseout', mouseout)
		.on("mousemove", function(d){
			date_mouse_over(d, d3.mouse(this))
		});

	if(!events_labels)
		$(".event_axis").css("display","none");
	//areas
	var areas = g
		.append("g")
		.attr("class","areas")
		.attr("transform", "translate(" + (margin_x+this.sizes.def_cell_margins.x) + "," + (margin_y-this.sizes.def_cell_margins.y)+ ")")
		.selectAll(".area")
		.data(data);

	areas.enter().append("rect")
		.attr("x", function(d) {
			if(timemap){
				/*console.log(d);*/
				var i=drawer.event_set.indexOf(d.date);
				var before = drawer.diff_ranges.slice(0,i);
				var dist = 0;
				for(var j in before){
					dist+=before[j]+drawer.sizes.def_cell_margins.x;
				}
				return drawer.width_axis(dist);
			}
			else{
				return (drawer.event_set.indexOf(d.date) * (gridSize_x+drawer.sizes.def_cell_margins.x)); 
			}
		})
		.attr("y", function(d) {return (drawer.keys.indexOf(d.rrc) * (gridSize_y+drawer.sizes.def_cell_margins.y)); })
		.attr("class", function(d){return "area area"+d.rrc.replace(/[\.:]/g,"-")+" area"+d.date.replace(/:/g,"-")+" area"+d.asn})
		.attr("width", function(d){
			if(timemap){
				/*console.log(d);*/ 
				return drawer.width_axis(drawer.diff_ranges[drawer.event_set.indexOf(d.date)]-drawer.sizes.def_cell_margins.x);
			} 
			else
				return gridSize_x;
		})
		.attr("height", gridSize_y)
		.style("fill", function(d) {return (d.asn && d.asn!=null)? drawer.z(d.asn): "#ffffff"; })
		.style("stroke", "black")
		.style("stroke-width",this.sizes.def_cell_margins.x/5)
		.style("opacity",1)
		.on('mousemove', function(d){
			mousemove(d,d3.mouse(this))
		})
		.on('mouseout', mouseout)
		.on('mouseover', mouseover);

	//FLAGS rrc
	if(!collapse_rrc){
		var FlagLabels = g
			.append("g")
			.attr("transform", "translate(" + (margin_x-45) + "," + (margin_y-(this.sizes.def_min_grid_size.y+(this.sizes.def_min_grid_size.y/4*3))) + ")")
			.attr("class","flags")
			.append("text")
			.attr("style","font-size: 11px;")
			.text("Country");

		var Flags = g
			.append("g")
			.attr("class","axis mono flag_axis")
			.attr("transform", "translate(" + 4 + "," + (margin_y+gridSize_y/2+drawer.sizes.def_cell_margins.y) + ")")
			.selectAll(".flagLabel")
			.data(this.keys)
			.enter();
		Flags
			.append("text")
			.attr("style","font-size: 8px;")
			.text(function (d) { 
					var s="";
					try{
						var geo = current_parsed.known_rrc[d]['geo'].split("-")[0];
						s+=geo;
					}
					catch(err){

					}
				return s;
			})
			.attr("x", 0)
			.attr("y", function (d, i) { return (i * (gridSize_y+drawer.sizes.def_cell_margins.y)); })
			.style("text-anchor", "start");
		Flags
			.append("image")
			.attr("height",8)
			.attr("width",8)
			.attr("xlink:href",function(d){
				var s="/css/flags/2.8.0/flags/4x3/";
				try{
					var geo = current_parsed.known_rrc[d]['geo'].split("-")[0];
					s+=geo.toLowerCase()+".svg";
				}
				catch(err){
					
				}
				return s;
			})
			.attr("x", 20)
			.attr("y", function (d, i) { return (i * (gridSize_y+drawer.sizes.def_cell_margins.y)-7); });
	}
	areas.exit().remove();

	//other functions
	var bisectDate = d3.bisector(function(d) { return d.date; }).left;

	if(timemap){
		console.log("draw X axis")
		this.main_svg
		.append("g")
		.attr("class","axis axis--x")
		.attr("transform", "translate("+margin_x+", "+margin_y+")")
		.call(d3.axisTop(this.x).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S")).tickValues(this.ticks))//.ticks(drawer.event_set.length))
		.selectAll("text")
	    .attr("y", 0)
	    .attr("x", 10)
	    .attr("dy", ".35em")
	    .attr("transform", "rotate(-90)")
	    .style("text-anchor", "start");
	}
	this.current_query_id=query_id;
	this.draw_over(this.main_svg,this.sizes);

	function type(d,asn_set,rrc_set,event_set,level,prepending) {
		if(rrc_set.indexOf(d.rrc)==-1)
			rrc_set.push(d.rrc);
		if(event_set.indexOf(d.date)==-1)
			event_set.push(d.date);
		var asn_path = JSON.parse(d.asn_path);
		if(prepending){
			var set = no_consecutive_repetition(asn_path);
			asn_path = set;
		}
		if(asn_path.length!=0 && asn_path.length>level){
			var asn = asn_path[asn_path.length-(1+level)];
			d.asn=asn;
			if(asn_set.indexOf(asn)==-1)
				asn_set.push(asn);
		}
		else
			d.asn=null;
		return d;
	}

	function mouseover() {
		drawer.tooltip.removeClass("hidden");
	}
	
	function mousemove(d_key,pos){
		var s="<strong> ASN: </strong>";
		s+="<span>"+((d_key.asn!=null)? d_key.asn : "None")+"</span>";
		var asn_country = current_parsed.known_asn[d_key.asn];
		if(asn_country){
			var ac = asn_country.split(",");
			ac = ac[ac.length-1];
			s+="<span> ("+ac+") </span>";
			s+="<span class='flag-icon flag-icon-"+ac.toLowerCase().trim()+"'></span>";
		}
		s+="<br/><strong>Date: </strong><span>"+formatDate(parseDate(d_key.date))+"</span>";
		s+="<br/><strong>RRC: </strong>";
		if(collapse_rrc){
			for(var i in rrc_to_filter)
				if(rrc_to_filter[i].indexOf(d_key.rrc)!=-1){
					var list = rrc_to_filter[i];
					if(list.length>1)
						s+="<br/>";
					for(var j in list){
						var r = list[j];
						s+="<span>"+r;
						var rrc_country = current_parsed.known_rrc[r];
						if(rrc_country){
							var cc = rrc_country["geo"].trim().split("-")[0];
							s+="<span> ("+cc+") </span>";
							s+="<span class='flag-icon flag-icon-"+cc.toLowerCase()+"'></span>";
						}
						s+="</span><br/>";
					}
				}
		}
		else {
			s+=d_key.rrc;
			var rrc_country = current_parsed.known_rrc[d_key.rrc];
			if(rrc_country){
				var cc = rrc_country["geo"].trim().split("-")[0];
				s+="<span> ("+cc+") </span>";
				s+="<span class='flag-icon flag-icon-"+cc.toLowerCase()+"'></span>";
			}
		}
		drawer.tooltip
			.html(s)
			.css("left", (d3.event.pageX + 10) + "px")
			.css("top", (d3.event.pageY - 30) + "px");

		if(drawer.last_hover!=d_key.asn) {
			d3.selectAll("rect.area")
			.filter(function(d){
				return d.asn!=d_key.asn;
			})
			.style("fill-opacity",0.35);
			d3.selectAll("path.area")
			.filter(function(d){
				return d.key!=d_key.asn;
			})
			.style("fill-opacity",0.35);
			drawer.last_hover=d_key.asn;
		}

	}

	function mouseout() {
		d3.selectAll(".area")
		.style("fill-opacity",1);
		drawer.last_hover=null;
		drawer.tooltip.addClass("hidden");
	}

	function click(pos,event){
		if(event.ctrlKey||event.altKey||event.shiftKey||event.metaKey) {
			var confirmed = confirm("Go to BGPlay?");
			if(confirmed){
				console.log("ASSE X MANCA INTERCETTA")
				var date = drawer.x.invert(pos[0]);
				bgplay_callback(date);
			}
		}
	}

	function rrc_mouse_over(d, pos){
		var s = "<strong>RRC: </strong>";
		if(collapse_rrc){
			for(var i in rrc_to_filter) 
				if(rrc_to_filter[i].indexOf(d)!=-1)
					var list=rrc_to_filter[i];
			if(Array.isArray(list)) {
					s+="<br/>";
				for(var i in list)
					s+=list[i]+"<br/>";
			}
			else 
				s+=list;
		}
		else{
			s+=d;
		}
		drawer.tooltip
			.html(s)
			.css("left", (d3.event.pageX + 10) + "px")
			.css("top", (d3.event.pageY - 30) + "px");

		if(drawer.last_hover!=d) {
			d3.selectAll(".area")
			.filter(function(e){
					return (e.rrc!=d);
			})	
			.style("fill-opacity",0.35);
			drawer.last_hover=d;
		}
	}


	function date_mouse_over(d, pos){
		if(drawer.last_hover!=d) {
			d3.selectAll(".area")
			.filter(function(e){
					return (e.date!=d);
			})
			.style("fill-opacity",0.35);
			drawer.last_hover=d;
		}
	}

	function rrc_filter(data) {
		var set = {};
		var flat = {};
		/*for every RRC build a map RRC -> ASNs */
		for(var i in data){
			var d = data[i];
			var tmp = [];
			if(set[d.rrc])
				tmp = set[d.rrc];
			tmp.push(d.asn);
			set[d.rrc]=tmp;
		}
		/*group RRCs with same map value*/
		for(var i in set){
			var tmp = [];
			var k = JSON.stringify(set[i]);
			if(flat[k])
				tmp=flat[k];
			tmp.push(i);
			flat[k]=tmp;
		}
		//return only the rrc_s buckets
		return Object.values(flat);
	}

	function events_filter(data, tollerance) {
		var set = {};
		var flat = [];
		/*for every event build a map DATE -> ASNs */
		for(var i in data){
			var d = data[i];
			var tmp = [];
			if(set[d.date])
				tmp = set[d.date];
			tmp.push(d.asn);
			set[d.date]=tmp;	
		}
		/*group DATEs with same map value*/
		var moments = Object.keys(set);
		var pos = 0;
		var shifter = set[moments[pos]];
		for(var i=1; i<moments.length; i++){
			var tmp = set[moments[i]];
			if(differences_count(shifter,tmp)>=tollerance){
				flat.push(moments[pos]);
				pos=i;
				shifter=tmp;
			}
			else {
				
			}
		}
		flat.push(moments[pos]);
		//return only the events buckets
		return flat;
	}
}

//extra functions
//change color to areas
//just shuffle the current color set contained in d_sorteds
GraphDrawer.prototype.shuffle_color_map = function(graph_type){
	var drawer = this;
	if(graph_type=="stream") {
		this.colors = random_sort(this.ColorManager.d_sorteds.map(function(c){return c.lab.rgb()}),this.keys.length);
		this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
		this.z.domain(this.keys);
		d3.selectAll(".area").each(function(d, i) {
			d3.select(this).style("fill",drawer.z(d.key));
		});
	}
	else 
	if(graph_type=="heat"){
		this.colors = random_sort(this.ColorManager.d_sorteds.map(function(c){return c.lab.rgb()}),this.asn_set.length);
		this.z = d3.scaleOrdinal(this.colors.slice(0).reverse());
		this.z.domain(this.asn_set);
		d3.select(".main_svg").selectAll(".area").each(function(d, i) {
			d3.select(this).style("fill", (d.asn && d.asn!=null)? drawer.z(d.asn) : "#ffffff");
		});
		d3.select(".mini_svg").selectAll(".area").each(function(d, i) {
			d3.select(this).style("fill",drawer.z(d.key));
		});
	}
}

//remove the chart
GraphDrawer.prototype.erase_all = function(){
	this.main_svg.select(".chart").remove();
	this.main_svg.select(".background").remove();
	this.main_svg.selectAll(".axis").remove();
	this.main_svg.selectAll(".axe_description").remove();
	this.main_svg.selectAll(".bgp_over").remove();
	this.mini_svg.select(".chart").remove();
	this.mini_svg.select(".background").remove();
	this.mini_svg.selectAll(".axis").remove();
}