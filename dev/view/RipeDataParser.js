define([
    "bgpst.env.utils",
    "bgpst.lib.moment",
    "bgpst.controller.functions"
], function(utils, moment, myUtils){

    var RipeDataParser = function(env) {
        env.logger.log("==== RipeParser Starting");
        this.states = {};
        this.events = [];
        this.resources = [];
        this.asn_distributions = [];

        this.asn_set = [];
        this.cp_set = [];
        this.asn_freqs = [];
        this.asn_sumfreqs = [];
        this.asn_avgfreqs = [];
        this.asn_varfreqs = [];
        this.asn_stdev = [];
        this.cp_shiftings = {};

        this.fake_head = false;
        this.fake_tail = false;
        this.query_starttime = "";
        this.query_endtime = "";

        this.known_asn = {};
        this.known_cp = {};

        env.logger.log("==== RipeParser Ready");

        /**manage the events and state of the announcement**/
        //the level of detail is by CP and only later cumulated to ASN view
        //there are fiew global variables used to maintain the state of the flow
        //states_asn:array of states, each state is a normalized vector of ASN weight on routing
        //states:array of states, each state is cp routing
        //events:array of timestamps, one for each state
        //cp_map:object used to maintain the current state
        //last_date:last timestamp seen

        //ripe_response_parse();
        //main function to call for parsing
        this.ripe_response_parse = function (json, start, end) {
            env.logger.log(start, end);
            //on local load from data.json
            //json = require('./data.json');
            //global variables init
            var data = json['data'];
            this.cp_map = {};
            this.states = {};
            this.events = [];
            this.resources = [];
            this.targets = [];
            this.last_date = data['query_starttime'];
            this.asn_distributions = [];
            this.asn_set = [];
            this.cp_set = [];
            this.asn_freqs = {};
            this.asn_sumfreqs = {};
            this.asn_avgfreqs = {};
            this.asn_varfreqs = {};
            this.asn_stdev = {};

            //fetch nodes and cp
            this.fetchNodes(data);
            this.fetchCP(data);

            //date
            this.query_starttime = data['query_starttime'];
            this.query_endtime = data['query_endtime'];

            //estraggo i targets
            for (var t in data['targets']) {
                this.targets.push(data['targets'][t]['prefix']);
            }
            this.resources = data.sources;
            //inizializza la mappa in base al numero di targets
            for (var t=0; t<this.targets.length; t++){
                var target = this.targets[t];
                this.cp_map[target] = {};
                this.states[target] = [];
            }
            //stato iniziale
            if (data.initial_state.length > 0)
                this.loadFirstState(json);
            //eventi
            if (data.events.length > 0)
                this.loadUpdates(json);
            //zero fill
            this.zeroFilling(start, end);
            //for debugging
            var log_on = false;
            var print_on = false;
            if (log_on) {
                env.logger.log(this.states);
                env.logger.log(this.events);
                env.logger.log(this.resources);
                env.logger.log(this.targets);
                env.logger.log(this.cp_set);
            }
            if (print_on) {
                this.print_json_to_file(this.states, 'states.json');
                this.print_json_to_file(this.events, 'events.json');
                this.print_json_to_file(this.targets, 'targets.json');
                this.print_json_to_file(this.resources, 'resources.json');
                this.print_json_to_file(this.cp_set, 'map.json');
            }
            return {
                query_id: json['query_id'],
                states: this.states,			//array of values % by cp
                events: this.events,			//array of timestamps
                targets: this.targets,		//array of targets
                resources: this.resources,	//array of CP by asn
                cp_set: this.cp_set,		//array of cp
                asn_set: this.asn_set,

                asn_freqs: this.asn_freqs,
                asn_sumfreqs: this.asn_sumfreqs,
                asn_avgfreqs: this.asn_avgfreqs,
                asn_varfreqs: this.asn_varfreqs,
                asn_stdev: this.asn_stdev,
                asn_distributions: this.asn_distributions,

                query_starttime: this.query_starttime,
                query_endtime: this.query_endtime,
                fake_head: this.fake_head,
                fake_tail: this.fake_tail,

                known_asn: this.known_asn,
                known_cp: this.known_cp
            }
        };

        //first load function, load the initial state and the first events
        this.loadFirstState = function (json) {
            var data = json['data'];
            this.makeIntialStateMapping(data);
            this.snapshotOfState();
        };

        //only load new events on the already existing configuration
        this.loadUpdates = function (json) {
            var data = json['data'];
            this.fetchUpdates(data);
            this.snapshotOfState();
        };

        //initialize the cp_map
        this.makeIntialStateMapping = function (data) {
            var initial_state = data['initial_state'];
            for (var i in initial_state) {
                var state = initial_state[i];
                var path = state['path'];
                var cp_id = state['source_id'];
                if (this.cp_set.indexOf(cp_id) == -1) {
                    this.cp_set.push(cp_id);
                }
                this.cp_map[state['target_prefix']][cp_id] = path;
            }
        };

        //fetch updates event using timestamp to cumultate the effects
        //everytime the last_date is different from the current event timestamp a new "state" as a snapshot is taken
        //from the cp_map
        this.fetchUpdates = function (data) {
            var updates = data['events'];
            this.last_date = updates[0]['timestamp'];
            for (var i=0; i<updates.length; i++) {
                var e = updates[i];
                var e_attrs = e['attrs'];
                var e_s_id = e_attrs['source_id'];
                var e_target = e_attrs['target_prefix'];
                var e_type = e['type'];
                //if its a new resource add to cp_set
                if (this.cp_set.indexOf(e_s_id) == -1){
                    this.cp_set.push(e_s_id);
                }
                //make snapshot if timestamp is different
                if (this.last_date != e['timestamp']) {
                    this.snapshotOfState();
                    this.last_date = e['timestamp'];
                }
                switch (e_type) {
                    case 'A':
                        this.cp_map[e_target][e_s_id] = e_attrs['path'];
                        break;
                    case 'W':
                        this.cp_map[e_target][e_s_id] = "";
                        break;
                    default:
                        break;
                }
            }
        };

        //take a snapshot of the cp_map
        //cumulate the single CP announcement into ASN view
        this.snapshotOfState = function () {
            for (var t=0; t<this.targets.length; t++) {
                var target = this.targets[t];
                this.states[target].push(Object.assign({}, this.cp_map[target]));
            }
            this.events.push(this.last_date);
        };

        //zero fill the cps in every moment
        this.zeroFilling = function (start, end) {
            for (var t=0; t<this.targets.length; t++) {
                var target = this.targets[t];
                var state = this.states[target];
                for (var i=0,length=state.length; i<length; i++) {
                    var stateTmp = state[i];
                    for (var r=0,length2=this.cp_set.length; r<length2; r++) {
                        var cp = this.cp_set[r];
                        if (!stateTmp[cp]) {
                            stateTmp[cp] = [];
                        }
                    }
                }
            }

            //PATCH EVENT BEFORE AND AFTER
            if (moment(this.events[0]).isAfter(start)) {
                env.logger.log("ADDED HEAD FAKE EVENT");
                this.fake_head = true;
                this.query_starttime = start.format(env.dateConverter.ripestat_data_format);
            } else {
                this.fake_head = false;
            }
            if (moment(this.events[this.events.length - 1]).isBefore(end)) {
                env.logger.log("ADDED TAIL FAKE EVENT");
                this.fake_tail = true;
                this.query_endtime = end.format(env.dateConverter.ripestat_data_format);
            } else {
                this.fake_tail = false;
            }
        };

        //object of cp and an array of states for any of them
        // MAP OF CP AND THEIR ASN TRAVERSED
        this.states_cp = function (parsed, level, antiprepending) {
            this.states_by_cp = {};
            //init
            for (var r in parsed.cp_set) {
                this.states_by_cp[parsed.cp_set[r]] = [];
            }
            //popolate
            for (var t in parsed.targets) {
                var tgt = parsed.targets[t];
                var states = parsed.states[tgt];
                for (var s in states) {
                    var state = states[s];
                    for (var r in state) {
                        var cp = state[r];
                        if (antiprepending)
                            cp = myUtils.no_consecutive_repetition(cp);
                        if (cp.length > level)
                            this.states_by_cp[r].push(cp[cp.length - level - 1]);
                        else
                            this.states_by_cp[r].push(null);
                    }
                }
            }
            parsed.states_by_cp = this.states_by_cp;
        };

        //object of cp and their asn sorted for occurrences
        //MAP OF CP AND ASN COMPOSITION (ORDERED SET OF ASN FOR THAT CP)
        this.cp_composition = function (parsed) {
            this.cp_by_composition = {};
            for (var r in parsed.cp_set) {
                var cp = parsed.cp_set[r];
                var asn_seq = parsed.states_by_cp[cp];
                this.cp_by_composition[cp] = myUtils.sort_by_occurrences(asn_seq);
            }
            parsed.cp_by_composition = this.cp_by_composition;
        };

        //object of cp and their asn seqs changed
        //MAP OF CP AND ASN TRAVERSED (SEQUENCE OF ASN TRAVERSED)
        this.cp_seqs = function (parsed) {
            this.cp_by_seqs = {};
            for (var r in parsed.cp_set) {
                var cp = parsed.cp_set[r];
                var asn_seq = parsed.states_by_cp[cp];
                this.cp_by_seqs[cp] = myUtils.no_consecutive_repetition(asn_seq);
            }
            parsed.cp_by_seqs = this.cp_by_seqs;
        };

        //MAP OF ASN (AND EXCHANGES FOR OTHER ASN COUNTED)
        this.asn_exchanges = function (parsed) {
            this.asn_by_exchanges = {}
            for (var i in parsed.cp_set) {
                var as_list = parsed.cp_by_seqs[parsed.cp_set[i]];
                if (as_list.length > 1) {
                    for (var a = 0; a < as_list.length - 1; a++) {
                        var pre = as_list[a];
                        var post = as_list[a + 1];
                        if (!this.asn_by_exchanges[pre])
                            this.asn_by_exchanges[pre] = {};
                        var counter = this.asn_by_exchanges[pre][post];
                        if (!counter)
                            counter = 0;
                        counter++;
                        this.asn_by_exchanges[pre][post] = counter;
                    }
                }
            }
            parsed.asn_by_exchanges = this.asn_by_exchanges;
        };

        this.get_cp_shiftings = function (parsed) {
            this.cp_shiftings = {};
            for (var t in parsed.targets) {
                this.cp_shiftings[parsed.targets[t]] = {};
            }
            for (var r in parsed.cp_set) {
                this.cp_shiftings[parsed.cp_set[r]] = [];
            }
            for (var r in parsed.cp_set) {
                var cp = parsed.cp_set[r];
                for (var s in parsed.states) {
                    var val = parsed.states[s][cp];
                    this.cp_shiftings[cp].push(val);
                }
            }
            parsed.cp_shiftings = this.cp_shiftings;
        };

        /* compute the frequency analysis */
        this.computeAsnFrequencies = function (data) {
            //initialization
            this.asn_freqs = {};
            this.asn_sumfreqs = {};
            this.asn_avgfreqs = {};
            this.asn_varfreqs = {};
            this.asn_stdev = {};
            for (var a in this.asn_set)
                this.asn_freqs[this.asn_set[a]] = [];
            for (var i in data) {
                for (var a in this.asn_set) {
                    this.asn_freqs[this.asn_set[a]].push(data[i][this.asn_set[a]]);
                }
            }
            //compute cumulate, avg, variance and std_dev
            for (var a in this.asn_freqs) {
                this.asn_sumfreqs[a] = myUtils.cumulate(this.asn_freqs[a]);
                this.asn_avgfreqs[a] = myUtils.average(this.asn_freqs[a], this.asn_sumfreqs[a]);
                this.asn_varfreqs[a] = myUtils.variance(this.asn_freqs[a], this.asn_avgfreqs[a]);
                this.asn_stdev[a] = myUtils.std_dev(this.asn_freqs[a], this.asn_varfreqs[a]);
            }
        };

        this.fetchNodes = function (data) {
            for (var a in data.nodes) {
                var node = data.nodes[a];
                var asn = node["as_number"];
                var owner = node["owner"];
                if (!this.known_asn[asn])
                    this.known_asn[asn] = owner;
            }
        };

        this.fetchCP = function (data) {
            for (var a in data.sources) {
                var node = data.sources[a];
                var id = node["id"];
                var ip = node["ip"];
                var rrc = node["rrc"];
                var as_number = node["as_number"];
                var geo_of_as = this.known_asn[as_number];
                if (geo_of_as) {
                    var index = geo_of_as.lastIndexOf(",");
                    var geo = geo_of_as.substr(index + 1).split("-")[0].trim();
                }
                if (geo) {
                    this.known_cp[id] = {
                        "ip": ip,
                        "id": id,
                        "rrc": rrc,
                        "as_number": as_number,
                        "geo": geo
                    }
                }
            }
        };

        //print out the object to a file
        this.print_json_to_file = function (json, filename) {
            var fs = require('fs');
            fs.writeFile("./" + filename, JSON.stringify(json, null, 4), function (err) {
                if (err) {
                    return env.logger.log(err);
                }
                env.logger.log(filename + " file written");
            });
        };

        /************************************************ CONVERSIONS ************************************************/

        this.comune_converter = function (data, antiprepending, level, target_types) {
            this.asn_distributions = [];
            var include_ipv4 = target_types.indexOf(4) != -1;
            var include_ipv6 = target_types.indexOf(6) != -1;

            this.asn_set = [];
            this.local_visibility = 0;
            //initialize
            for (let i of data.events) {
                this.asn_distributions.push({});
            }

            //counting
            for (let tgt of data.targets){
                if ((include_ipv4 && utils.isIPv4(tgt)) || (include_ipv6 && utils.isIPv6(tgt))) {
                    for (var i in data.states[tgt]) {
                        var state = data.states[tgt][i];
                        var tot = 0;
                        for (var e in state) {
                            var path = state[e];
                            if (antiprepending) {
                                //antiprepending-da-spostare
                                path = myUtils.no_consecutive_repetition(path);
                            }
                            if (path !== "" && path.length > (level)) {
                                var asn = path[path.length - (level + 1)];
                                //update the asn list if wasnt discovered
                                if (this.asn_set.indexOf(asn) == -1)
                                    this.asn_set.push(asn);
                                //update counters
                                var temp = this.asn_distributions[i][asn];
                                if (!temp)
                                    temp = 0;
                                this.asn_distributions[i][asn] = (temp + 1);
                                tot++;
                            }
                        }
                        this.asn_distributions[i]['tot_number'] = tot;
                        if (tot > this.local_visibility)
                            this.local_visibility = tot;
                    }
                }
            }
            //zero-filling
            for (var i in this.asn_distributions)
                for (var a in this.asn_set) {
                    if (!this.asn_distributions[i][this.asn_set[a]])
                        this.asn_distributions[i][this.asn_set[a]] = 0;
                }
            data.asn_distributions = this.asn_distributions;
            this.computeAsnFrequencies(this.asn_distributions);
            this.computeDifferenceVector(data);
            this.computeDistanceVector(data);
            this.get_cp_shiftings(data);
            data.asn_freqs = this.asn_freqs;
            data.asn_sumfreqs = this.asn_sumfreqs;
            data.asn_avgfreqs = this.asn_avgfreqs;
            data.asn_varfreqs = this.asn_varfreqs;
            data.asn_stdev = this.asn_stdev;
            data.query_starttime = this.query_starttime;
            data.query_endtime = this.query_endtime;
            data.local_visibility = this.local_visibility;
        };

        //convert the data to a TSV format for streamgraph
        this.convert_to_streamgraph_tsv = function (data, antiprepending, level, target_types) {
            this.comune_converter(data, antiprepending, level, target_types);

            var real_states = data.asn_distributions.concat();
            var real_events = data.events.concat();
            var dummy_state = {};

            if (data.fake_tail || data.fake_tail) {
                for (var d in this.asn_set) {
                    dummy_state[this.asn_set[d]] = 0;
                }
                dummy_state['tot_number'] = 0;
            }

            if (data.fake_head) {
                real_states = [dummy_state].concat(real_states);
                real_events = [data.query_starttime].concat(real_events);
                env.logger.log(real_states)
            }

            if (data.fake_tail) {
                real_states = real_states.concat(real_states[real_states.length - 1]);
                real_events = real_events.concat(data.query_endtime);
            }

            //parse to TSV
            var converted_data = [];
            //TSV header
            var header = "date\ttot_number";
            for (var i in this.asn_set)
                header += "\t" + this.asn_set[i];
            converted_data.push(header);
            //TSV DATA
            var last_values = "";
            var length = real_events.length - 1;
            for (var i = 0; i < length; i++) {
                var date = real_events[i] + "\t";
                var tot = real_states[i]['tot_number'];
                var values = "";
                for (var j in this.asn_set) {
                    var value = real_states[i][this.asn_set[j]];
                    if (!value)
                        value = 0;
                    values += "\t" + value;
                }
                values = tot + values;
                line = date + values;

                //PATCH FOR STREAMGRAPH AVOID INTERPOLATION
                if (last_values != "" && last_values != values && i < data.events.length - 2) {
                    converted_data.push(date + last_values);
                }
                converted_data.push(line);
                last_values = values;
            }

            var last_date = real_events[length] + "\t";
            var last_tot = real_states[length]['tot_number'];
            var last_values = "";
            for (var j in this.asn_set) {
                var value = real_states[length][this.asn_set[j]];
                if (!value)
                    value = 0;
                last_values += "\t" + value;
            }
            last_values = last_tot + last_values;
            converted_data.push(date + last_values);
            converted_data.push(last_date + last_values);

            var converted = converted_data.join("\n");
            data.asn_set = this.asn_set;
            return converted;
        };

        //convert the data to a TSV format for heatmap
        this.convert_to_heatmap_tsv = (data, antiprepending, level, target_types) => {
            this.comune_converter(data, antiprepending, level, target_types);

            var real_states = {};
            var real_events = data.events;
            var dummy_state = {};

            if (data.fake_tail || data.fake_tail) {
                for (var d in this.cp_set)
                    dummy_state[this.cp_set[d]] = [];
            }

            for (var t in data.targets) {
                var tgt = data.targets[t];
                real_states[tgt] = data.states[tgt].concat();
            }

            if (data.fake_head) {
                for (var t in data.targets) {
                    var tgt = data.targets[t];
                    real_states[tgt] = [dummy_state].concat(real_states[tgt]);
                }
                real_events = [data.query_starttime].concat(real_events);
            }

            if (data.fake_tail) {
                for (var t in data.targets) {
                    var tgt = data.targets[t];
                    //real_states[tgt]=real_states[tgt].concat(real_states[tgt][real_states[tgt].length-1]);
                    real_states[tgt] = real_states[tgt].concat(dummy_state);
                }
                real_events = real_events.concat(data.query_endtime);
            }

            env.logger.log(real_events);
            var converted_data = [];
            var header = "date\tcp\tasn_path";
            var cp_set = data.cp_set.sort();
            var include_ipv4 = target_types.indexOf(4) != -1;
            var include_ipv6 = target_types.indexOf(6) != -1;
            converted_data.push(header);
            for (var t in data.targets) {
                var tgt = data.targets[t];
                if ((include_ipv4 && utils.isIPv4(tgt)) || (include_ipv6 && utils.isIPv6(tgt))) {
                    for (var i in real_states[tgt]) {
                        var state = real_states[tgt][i];
                        for (var j in cp_set) {
                            var path = state[cp_set[j]];
                            if (!Array.isArray(path))
                                path = [];
                            var line = real_events[i];
                            line += "\t" + cp_set[j] + "\t" + JSON.stringify(path);
                            converted_data.push(line);
                        }
                    }
                }
            }
            return converted_data.join("\n");
        };

        /************************ OTHER ************************/
        /**freq difference**/
        /* compute the difference vector (N-1) length by each sample (column) */
        this.computeDifferenceVector = function (current_parsed) {
            var counters = [];
            for (var i = 0; i < current_parsed.events.length - 1; i++)
                counters[i] = 0;
            for (var i = 0; i < counters.length; i++)
                for (var k in current_parsed.asn_freqs) {
                    counters[i] += Math.abs(current_parsed.asn_freqs[k][i] - current_parsed.asn_freqs[k][i + 1]);
                }
            //counters è un array della differenza tra ogni campione considerando le frequenze
            return counters;
        };

        /**freq distance**/
        /* compute the distance vector (N-1) length by each sample (column) */
        this.computeDistanceVector = function (current_parsed) {
            var counters = [];
            for (var i = 0; i < current_parsed.events.length - 1; i++)
                counters[i] = 0;
            for (var i = 0; i < counters.length; i++)
                for (var k in current_parsed.asn_freqs) {
                    counters[i] += Math.sqrt(Math.abs(Math.pow(current_parsed.asn_freqs[k][i], 2) - Math.pow(current_parsed.asn_freqs[k][i + 1], 2)));
                }
            //counters è un array delle distanza tra ogni campione considerando le frequenze
            return counters;
        };
    };

    return RipeDataParser;
});