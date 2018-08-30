define([
    "bgpst.env.utils",
    "bgpst.env.config",
    "bgpst.view.graphdrawer",
    "bgpst.controller.dateconverter",
    "bgpst.view.broker",
    "bgpst.view.scroller",
    "bgpst.lib.moment",
    "bgpst.lib.jquery-amd",
    "bgpst.lib.stache!main"
], function(utils, config, GraphDrawer, DateConverter, RipeDataBroker, EPPZScrollTo, moment, $, template){


    //setup the whole gui interface actions, events and styles <-- TO CALL AT DOM READY
    var GuiManager = function(env) {

        /*************************************** DOM elements ************************************/
        env.parentDom.append(template({ widgetUrl: env.widgetUrl }));

        this.mouse = { x: 0, y: 0 };

        $(env.parentDom).on("mousemove", function(e){
            this.mouse = {
                x: e.screenX,
                y: e.screenY
            };
        }.bind(this));

        this.dom = {
            applyTime: env.parentDom.find(".apply-time"),
            container: env.parentDom.find(".bgpst-container"),
            canvasContainer: env.parentDom.find(".canvas_container"),
            mainSvg: env.parentDom.find("div.main_svg"),
            miniSvg: env.parentDom.find("div.mini_svg"),
            tooltip: env.parentDom.find("[data-toggle='tooltip']"),
            tooltipSvg: env.parentDom.find(".svg_tooltip"),
            title: env.parentDom.find(".title"),
            metaInfoResource: env.parentDom.find(".meta-info-resource"),
            metaQueryStartTime: env.parentDom.find(".meta-query-start-time"),
            metaQueryStopTime: env.parentDom.find(".meta-query-stop-time"),

            optionCommandButton: env.parentDom.find(".option_command_btn"),
            sortButton: env.parentDom.find(".sort_btn"),

            listButton: env.parentDom.find(".list_btn"),
            asnList: env.parentDom.find(".asn_list"),
            asnListButton: env.parentDom.find(".asn_list_btn"),
            cpList: env.parentDom.find(".cp_list"),
            cpListButton: env.parentDom.find(".cp_list_btn"),

            stepsStartButton: env.parentDom.find(".steps_start"),
            stepsStopButton: env.parentDom.find(".steps_stop"),
            stepsPauseButton: env.parentDom.find(".steps_pause"),

            streamingStartButton: env.parentDom.find(".streaming_start"),
            streamingStopButton: env.parentDom.find(".streaming_stop"),

            date: env.parentDom.find(".date_range_button"),
            counter: env.parentDom.find(".counter"),
            counterAsn: env.parentDom.find(".counter_asn").parent(),

            graphType: env.parentDom.find("input[name='graph_type']"),

            ipVersion: env.parentDom.find(".ip_version"),
            ipVersionButton: env.parentDom.find("input[name='ip_version']"),

            heatmapTimeButton: env.parentDom.find(".heatmap_time_btn"),
            gatherInformationButton: env.parentDom.find(".gather_information_btn"),
            preserveColorButton: env.parentDom.find(".preserve_color_btn"),
            globalVisibilityButton: env.parentDom.find(".global_visibility_btn"),
            prependingPreventionButton: env.parentDom.find(".prepending_prevention_btn"),
            mergeEventsButton: env.parentDom.find(".merge_events"),
            mergeEventsInput: env.parentDom.find("input[name='merge_events']"),

            mergeCPButton: env.parentDom.find(".merge_cp_btn"),
            eventsLabelsButton: env.parentDom.find(".events_labels_btn"),
            cpLabelsButton: env.parentDom.find(".cp_labels_btn"),
            scrollbarsButton: env.parentDom.find(".scrollbars_btn"),

            asnLvlButton: env.parentDom.find(".asn_lvl"),
            asnLvlInput: env.parentDom.find("input[name='asn_lvl']"),

            heatOptionButton: env.parentDom.find(".heat_option"),
            streamOptionButton: env.parentDom.find(".stream_option"),

            //heuristics_buttons
            shuffleColorButton: env.parentDom.find(".shuffle_color_map_btn"),
            levDistRandCumButton: env.parentDom.find(".lev_dist_randwalk_cum_btn"),
            levDistRanMaxButton: env.parentDom.find(".lev_dist_randwalk_max_btn"),
            pointDistRanButton: env.parentDom.find(".point_dist_by_randwalk_btn"),
            pointDistInfButton: env.parentDom.find(".point_dist_by_inference_btn"),
            pointDistGreedyButton: env.parentDom.find(".point_dist_greedy_btn"),
            exchangeGreedyButton: env.parentDom.find(".exchange_greedy_sort_btn"),
            wiggleSumButton: env.parentDom.find(".wiggle_sum_btn"),
            wiggleMaxButton: env.parentDom.find(".wiggle_max_btn"),
            ascstdevSortButton: env.parentDom.find(".sort_asn_ascstdev_btn"),
            dscstdevSortButton: env.parentDom.find(".sort_asn_dscstdev_btn"),
            ascvarSortButton: env.parentDom.find(".sort_asn_ascvar_btn"),
            dscvarSortButton: env.parentDom.find(".sort_asn_dscvar_btn"),
            ascavgSortButton: env.parentDom.find(".sort_asn_ascavg_btn"),
            dscavgSortButton: env.parentDom.find(".sort_asn_dscavg_btn"),
            ascsumSortButton: env.parentDom.find(".sort_asn_ascsum_btn"),
            dscsumSortButton: env.parentDom.find(".sort_asn_dscsum_btn"),
            heatGreedy1SortButton: env.parentDom.find(".heat_greedy_sort_1_btn"),
            heatGreedy2SortButton: env.parentDom.find(".heat_greedy_sort_2_btn"),
            heatStdevSortButton: env.parentDom.find(".heat_stdev_sort_btn"),
            heatCountrySortButton: env.parentDom.find(".heat_country_sort"),
            heatGeoSortButton: env.parentDom.find(".heat_as_sort"),

            startDate: env.parentDom.find(".start-date"),
            stopDate: env.parentDom.find(".stop-date"),

            timeModal: env.parentDom.find(".time-modal"),
            timeModalButton: env.parentDom.find(".time-modal-button"),
            loadingImage: env.parentDom.find(".bgpstr-spinner")
        };

        utils.observer.subscribe("updated", function(params){
            this.dom.metaInfoResource.html(params.targets);
            this.dom.metaQueryStartTime.html(params.startDate.format("YYYY-MM-DD HH:mm:ss"));
            this.dom.metaQueryStopTime.html(params.stopDate.format("YYYY-MM-DD HH:mm:ss"));
        }.bind(this));


        this.drawer = new GraphDrawer(env);

        this.preserve_map = true;
        this.global_visibility = true;
        this.prepending_prevention = true;
        this.asn_level = 1;
        this.ip_version = [4,6];
        this.graph_type = "stream";
        this.streaming = false;
        this.steps = false;
        this.current_step = 0;
        this.merge_cp = false;
        this.merge_events = 40;
        this.events_labels = false;
        this.cp_labels = false;
        this.use_scrollbars = false;
        this.cp_info_done = false;
        this.asn_info_done = false;
        this.gather_information = true;
        this.heatmap_time_map = true;
        this.streaming_speed = 60000;

        this.asn_list_max_scroll = 5;
        this.cp_list_max_scroll = 11;

        this.oldHeight; /*declaration needed for scope*/
        var $this = this;


        this.init = function () {
            this.ripeDataBroker = new RipeDataBroker(env);
            this.dateConverter = new DateConverter();

            this.drawer.drawer_init();
            this.pickers_setup();
            this.other_command_button_setup();
            this.tooltip_setup();

            this.ripeDataBroker.dataRequest();
        };

        this.checkDatetimepicker = function () {
            var start = moment($this.dom.startDate.datetimepicker("getDate"));
            var stop = moment($this.dom.stopDate.datetimepicker("getDate"));

            if (!stop.isAfter(start)) {
                $this.dom.stopDate.datetimepicker("setDate", moment.utc().toDate());
            }
        };

        this.pickers_setup = function () {

            this.dom.timeModal.modal({
                show: false,
                backdrop : false,
                keyboard : false
            });

            this.dom.timeModalButton.on("mousedown, mouseup", function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            });
            this.dom.startDate
                .datetimepicker({
                    initialDate: env.queryParams.startDate,//.utc().format("YYYY-MM-DD HH:mm:ss")
                    format: "yyyy-mm-dd hh:ii:ss",
                    autoclose: true,
                    startDate: "2004-01-01 00:00:00",
                    endDate: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
                    container: $this.dom.container
                })
                .on('changeDate', this.checkDatetimepicker)
                .on('show', function () {
                    var offset = $this.dom.startDate.offset();
                    $this.dom.container.find(".datetimepicker")
                        .on("click", function () {
                            $this.dom.container.find(".datetimepicker")
                                .css("top", offset.top + 25 - $(window).scrollTop())
                                .css("left", offset.left - $(window).scrollLeft());
                        })
                        .css("top", offset.top + 25 - $(window).scrollTop())
                        .css("left", offset.left - $(window).scrollLeft());
                });

            this.dom.stopDate
                .datetimepicker({
                    initialDate: env.queryParams.stopDate.format("YYYY-MM-DD HH:mm:ss"),
                    format: "yyyy-mm-dd hh:ii:ss",
                    autoclose: true,
                    startDate: "2004-01-01 00:00:00",
                    endDate: moment.utc().format("YYYY-MM-DD HH:mm:ss"),
                    container: $this.dom.container
                })
                .on('changeDate', this.checkDatetimepicker)
                .on('show', function () {
                    var offset = $this.dom.stopDate.offset();
                    $this.dom.container.find(".datetimepicker")
                        .on("click", function () {
                            $this.dom.container.find(".datetimepicker")
                                .css("top", offset.top + 25 - $(window).scrollTop())
                                .css("left", offset.left - $(window).scrollLeft());
                        })
                        .css("top", offset.top + 25 - $(window).scrollTop())
                        .css("left", offset.left - $(window).scrollLeft());
                });

            this.dom.startDate.datetimepicker("setDate", new Date(env.queryParams.startDate.format("YYYY-MM-DDTHH:mm:ss")));
            this.dom.stopDate.datetimepicker("setDate", new Date(env.queryParams.stopDate.format("YYYY-MM-DDTHH:mm:ss")));
        };

        this.setTimeFrameButton = function () {
            this.dom.applyTime.on("mousedown", () => {
                env.queryParams.startDate = moment($this.dom.startDate.datetimepicker("getDate"));
                env.queryParams.stopDate = moment($this.dom.stopDate.datetimepicker("getDate"));
                this.loading(true);
                $this.ripeDataBroker.dataRequest();
            });
        };

        //other_command_menu
        this.other_command_button_setup = function () {
            env.parentDom.find('.dropdown-toggle').dropdown();
            env.parentDom.find('.graph_type').button('toggle');
            this.setTimeFrameButton();
            this.shuffle_color_map_btn_setup();
            this.gather_information_btn_setup();
            this.preserve_color_map_btn_setup();
            this.prepending_prevention_btn_setup();
            this.merge_events_btn_setup();
            this.merge_cp_btn_setup();
            this.events_labels_btn_setup();
            this.cp_labels_btn_setup();
            this.scrollbars_btn_setup();
            this.heatmap_time_btn_setup();
            this.global_visiblity_btn_setup();
            this.graph_type_radio_setup();
            this.ip_version_checkbox_setup();
            this.asn_level_setup();
            this.streaming_btn_setup();
            this.steps_btn_setup();
            this.asn_list_btn_setup();
            this.cp_list_btn_setup();
            /***********************************************/
            this.boolean_checker();
            /***********************************************/
            this.sort_asn_ascstdev_btn_setup();
            this.sort_asn_dscstdev_btn_setup();
            this.sort_asn_ascvar_btn_setup();
            this.sort_asn_dscvar_btn_setup();
            this.sort_asn_ascavg_btn_setup();
            this.sort_asn_dscavg_btn_setup();
            this.sort_asn_ascsum_btn_setup();
            this.sort_asn_dscsum_btn_setup();
            this.lev_dist_randwalk_cum_btn_setup();
            this.lev_dist_randwalk_max_btn_setup();
            this.point_dist_by_randwalk_btn_setup();
            this.point_dist_by_inference_btn_setup();
            this.point_dist_greedy_btn_setup();
            this.exchange_greedy_sort_btn_setup();
            this.wiggle_max_btn_setup();
            this.wiggle_sum_btn_setup();
            /**********************************************/
            this.heat_greedy_sort_1_btn_setup();
            this.heat_greedy_sort_2_btn_setup();
            this.heat_stdev_sort_btn_setup();
            this.heat_geo_sort_btn_setup();
            this.heat_asn_sort_btn_setup();
            this.draw_functions_btn_enabler();
        };

        this.isGraphPresent = function (text) {
            return this.drawer.isGraphPresent();
        };

        this.lock_all = function () {
            this.dom.listButton.addClass("disabled");
            this.dom.listButton.addClass("not-active");

            this.dom.sortButton.addClass("disabled");
            this.dom.sortButton.addClass("not-active");

            this.dom.optionCommandButton.addClass("disabled");
            this.dom.optionCommandButton.addClass("not-active");

            this.dom.date.addClass("disabled");
            this.dom.date.addClass("not-active");
            this.dom.date.parent().addClass("not-active");

            this.dom.graphType.parent().addClass("disabled");
            this.dom.graphType.parent().addClass("not-active");
            this.dom.graphType.parent().attr("disabled", true);

            this.dom.ipVersionButton.filter("[value='6']").parent().addClass("disabled");
            this.dom.ipVersionButton.filter("[value='6']").parent().addClass("not-active");
            this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", true);

            this.dom.ipVersionButton.filter("[value='4']").parent().addClass("disabled");
            this.dom.ipVersionButton.filter("[value='4']").parent().addClass("not-active");
            this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", true);

            this.dom.stepsStartButton.addClass("disabled");
            this.dom.stepsStartButton.addClass("not-active");
            this.dom.stepsStartButton.attr("disabled", true);

            if (!this.streaming) {
                this.dom.streamingStartButton.addClass("disabled");
                this.dom.streamingStartButton.addClass("not-active");
                this.dom.streamingStartButton.attr("disabled", true);
            }
            else {
                this.dom.streamingStopButton.removeClass("disabled");
                this.dom.streamingStopButton.removeClass("not-active");
                this.dom.streamingStopButton.attr("disabled", false);
            }
        };

        this.boolean_checker = function () {
            if (!this.gather_information) {
                this.dom.gatherInformationButton.find("span").addClass("hidden");
                this.dom.gatherInformationButton.parent().removeClass("active");
            }
            else {
                this.dom.gatherInformationButton.find("span").removeClass("hidden");
                this.dom.gatherInformationButton.parent().addClass("active");
            }

            if (!this.preserve_map) {
                this.dom.preserveColorButton.find("span").addClass("hidden");
                this.dom.preserveColorButton.parent().removeClass("active");
            }
            else {
                this.dom.preserveColorButton.find("span").removeClass("hidden");
                this.dom.preserveColorButton.parent().addClass("active");
            }

            if (!this.global_visibility) {
                this.dom.globalVisibilityButton.find("span").addClass("hidden");
                this.dom.globalVisibilityButton.parent().removeClass("active");
            }
            else {
                this.dom.globalVisibilityButton.find("span").removeClass("hidden");
                this.dom.globalVisibilityButton.parent().addClass("active");
            }

            if (!this.prepending_prevention) {
                this.dom.prependingPreventionButton.find("span").addClass("hidden");
                this.dom.prependingPreventionButton.parent().removeClass("active");
            }
            else {
                this.dom.prependingPreventionButton.find("span").removeClass("hidden");
                this.dom.prependingPreventionButton.parent().addClass("active");
            }

            if (!this.merge_cp) {
                this.dom.mergeCPButton.find("span").addClass("hidden");
                this.dom.mergeCPButton.parent().removeClass("active");
            }
            else {
                this.dom.mergeCPButton.find("span").removeClass("hidden");
                this.dom.mergeCPButton.parent().addClass("active");
            }
            if (!this.merge_events) {
                this.dom.mergeEventsButton.find("span").addClass("hidden");
                this.dom.mergeEventsButton.parent().removeClass("active");
            }
            else {
                this.dom.mergeEventsButton.find("span").removeClass("hidden");
                this.dom.mergeEventsButton.parent().addClass("active");
            }
            if (!this.events_labels) {
                this.dom.eventsLabelsButton.find("span").addClass("hidden");
                this.dom.eventsLabelsButton.parent().removeClass("active");
            }
            else {
                this.dom.eventsLabelsButton.find("span").removeClass("hidden");
                this.dom.eventsLabelsButton.parent().addClass("active");
            }

            if (!this.cp_labels) {
                this.dom.cpLabelsButton.find("span").addClass("hidden");
                this.dom.cpLabelsButton.parent().removeClass("active");
            } else {
                this.dom.cpLabelsButton.find("span").removeClass("hidden");
                this.dom.cpLabelsButton.parent().addClass("active");
            }

            if (!this.heatmap_time_map) {
                this.dom.heatmapTimeButton.find("span").addClass("hidden");
                this.dom.heatmapTimeButton.parent().removeClass("active");
            } else {
                this.dom.heatmapTimeButton.find("span").removeClass("hidden");
                this.dom.heatmapTimeButton.parent().addClass("active");
            }

            if (!this.use_scrollbars) {
                this.dom.scrollbarsButton.find("span").addClass("hidden");
                this.dom.scrollbarsButton.parent().removeClass("active");
            } else {
                this.dom.scrollbarsButton.find("span").removeClass("hidden");
                this.dom.scrollbarsButton.parent().addClass("active");
            }
            if (this.graph_type == "stream") {
                this.dom.graphType.filter("[value='stream']").prop('checked', true);
                this.dom.graphType.filter("[value='stream']").parent().addClass("active");
                this.dom.graphType.filter("[value='heat']").parent().removeClass("active");
                this.dom.streamOptionButton.removeClass("hidden");
                this.dom.heatOptionButton.addClass("hidden");
            }  else if (this.graph_type == "heat") {
                this.dom.graphType.filter("[value='heat']").prop('checked', true);
                this.dom.graphType.filter("[value='heat']").parent().addClass("active");
                this.dom.graphType.filter("[value='stream']").parent().removeClass("active");
                this.dom.heatOptionButton.removeClass("hidden");
                this.dom.streamOptionButton.addClass("hidden");
            }
            if (this.ip_version.indexOf(4) != -1) {
                this.dom.ipVersionButton.filter("[value='4']").prop('checked', true);
                this.dom.ipVersionButton.filter("[value='4']").parent().addClass("active");
            }
            if (this.ip_version.indexOf(6) != -1) {
                this.dom.ipVersionButton.filter("[value='6']").prop('checked', true);
                this.dom.ipVersionButton.filter("[value='6']").parent().addClass("active");
            }

        };

        this.draw_functions_btn_enabler = function () {
            if (this.isGraphPresent() && !this.streaming) {
                this.dom.listButton.removeClass("disabled");
                this.dom.listButton.removeClass("not-active");
                this.dom.optionCommandButton.removeClass("disabled");
                this.dom.optionCommandButton.removeClass("not-active");
                this.dom.sortButton.removeClass("disabled");
                this.dom.sortButton.removeClass("not-active");

                this.dom.graphType.parent().removeClass("disabled");
                this.dom.graphType.parent().removeClass("not-active");
                this.dom.graphType.parent().attr("disabled", false);

                this.dom.date.removeClass("disabled");
                this.dom.date.removeClass("not-active");
                this.dom.date.parent().removeClass("not-active");


                const containsIpv4 = this.ripeDataBroker.current_parsed.targets
                    .some(utils.isIPv4);
                const containsIpv6 = this.ripeDataBroker.current_parsed.targets
                    .some(utils.isIPv6);

                if (containsIpv4 || containsIpv6) {
                    if (!containsIpv4) {
                        this.dom.ipVersionButton.filter("[value='4']").parent().addClass("disabled");
                        this.dom.ipVersionButton.filter("[value='4']").parent().addClass("not-active");
                        this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", true);
                    } else {
                        this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("disabled");
                        this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("not-active");
                        this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", false);
                    }

                    if (!containsIpv6) {
                        this.dom.ipVersionButton.filter("[value='6']").parent().addClass("disabled");
                        this.dom.ipVersionButton.filter("[value='6']").parent().addClass("not-active");
                        this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", true);
                    } else {
                        this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("disabled");
                        this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("not-active");
                        this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", false);
                    }
                } else {
                    this.dom.ipVersion.hide();
                }

                if (this.ip_version.indexOf(4) != -1) {
                    this.dom.ipVersionButton.filter('[value="4"]').prop('checked', true);
                    this.dom.ipVersionButton.filter('[value="4"]').parent().addClass("active");
                } else {
                    this.dom.ipVersionButton.filter('[value="4"]').prop('checked', false);
                    this.dom.ipVersionButton.filter('[value="4"]').parent().removeClass("active");
                }
                if (this.ip_version.indexOf(6) != -1) {
                    this.dom.ipVersionButton.filter('[value="6"]').prop('checked', true);
                    this.dom.ipVersionButton.filter('[value="6"]').parent().addClass("active");
                } else {
                    this.dom.ipVersionButton.filter('[value="6"]').prop('checked', false);
                    this.dom.ipVersionButton.filter('[value="6"]').parent().removeClass("active");
                }
                this.dom.counter.removeClass("hidden");
                if (this.graph_type == "stream") {
                    this.dom.stepsStartButton.removeClass("disabled");
                    this.dom.stepsStartButton.removeClass("not-active");
                    this.dom.stepsStartButton.attr("disabled", false);

                    this.dom.streamingStartButton.removeClass("disabled");
                    this.dom.streamingStartButton.removeClass("not-active");
                    this.dom.streamingStartButton.attr("disabled", false);
                }
                if (this.graph_type == "heat") {
                    this.dom.stepsStartButton.addClass("disabled");
                    this.dom.stepsStartButton.addClass("not-active");
                    this.dom.stepsStartButton.attr("disabled", true);

                    this.dom.streamingStartButton.addClass("disabled");
                    this.dom.streamingStartButton.addClass("not-active");
                    this.dom.streamingStartButton.attr("disabled", true);
                }
                if (!this.steps) {
                    this.dom.stepsStartButton.prop('checked', false);
                    this.dom.stepsStartButton.removeClass("active");
                }
            }
            else {
                this.dom.listButton.addClass("disabled");
                this.dom.listButton.addClass("not-active");
                this.dom.sortButton.addClass("disabled");
                this.dom.sortButton.addClass("not-active");
                this.dom.optionCommandButton.addClass("disabled");
                this.dom.optionCommandButton.addClass("not-active");

                this.dom.ipVersionButton.filter("[value='6']").parent().addClass("disabled");
                this.dom.ipVersionButton.filter("[value='6']").parent().addClass("not-active");
                this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", true);

                this.dom.ipVersionButton.filter("[value='4']").parent().addClass("disabled");
                this.dom.ipVersionButton.filter("[value='4']").parent().addClass("not-active");
                this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", true);

                this.dom.graphType.parent().addClass("disabled");
                this.dom.graphType.parent().addClass("not-active");
                this.dom.graphType.parent().attr("disabled", true);

                this.dom.counter.addClass("hidden");

                this.dom.stepsStartButton.addClass("disabled");
                this.dom.stepsStartButton.addClass("not-active");
                this.dom.stepsStartButton.attr("disabled", true);

                this.dom.streamingStartButton.addClass("disabled");
                this.dom.streamingStartButton.addClass("not-active");
                this.dom.streamingStartButton.attr("disabled", true);

                // this.dom.date.addClass("disabled");
                // this.dom.date.addClass("not-active");
                // this.dom.date.parent().addClass("not-active");
            }
        };

        this.ip_version_checkbox_enabler = function () {
            if (!this.streaming) {
                if (this.ripeDataBroker.current_parsed.targets.every(utils.isIPv4)) {
                    this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("disabled");
                    this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("not-active");
                    this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", false);
                    this.ip_version = [4];
                }
                else {
                    this.dom.ipVersionButton.filter("[value='4']").parent().addClass("disabled");
                    this.dom.ipVersionButton.filter("[value='4']").parent().addClass("not-active");
                    this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", true);
                }
                if (this.ripeDataBroker.current_parsed.targets.every(function (e) {
                        return utils.isIPv6(e);
                    })) {
                    this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("disabled");
                    this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("not-active");
                    this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", false);
                    this.ip_version = [6];
                }
                else {
                    this.dom.ipVersionButton.filter("[value='6']").parent().addClass("disabled");
                    this.dom.ipVersionButton.filter("[value='6']").parent().addClass("not-active");
                    this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", true);
                }
                if (this.ripeDataBroker.current_parsed.targets.some(function (e) {
                        return utils.isIPv4(e);
                    }) && this.ripeDataBroker.current_parsed.targets.some(function (e) {
                        return utils.isIPv6(e);
                    })) {
                    this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("disabled");
                    this.dom.ipVersionButton.filter("[value='4']").parent().removeClass("not-active");
                    this.dom.ipVersionButton.filter("[value='4']").parent().attr("disabled", false);
                    this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("disabled");
                    this.dom.ipVersionButton.filter("[value='6']").parent().removeClass("not-active");
                    this.dom.ipVersionButton.filter("[value='6']").parent().attr("disabled", false);
                    if (this.ip_version.length == 0)
                        this.ip_version = [4];
                }
            }
        };


        /************************** CLICKABLE UI SETUP **************************/
        //TO CALL AT SETUP

        this.tooltip_setup = function () {
            this.dom.tooltip.tooltip();
        };

        this.shuffle_color_map_btn_setup = function () {
            this.dom.shuffleColorButton.on("click", function (e) {
                if ($this.isGraphPresent())
                    $this.drawer.shuffle_color_map($this.graph_type);
            });
        };

        this.gather_information_btn_setup = function () {
            this.dom.gatherInformationButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.gather_information = !$this.gather_information;
            });
        };

        this.preserve_color_map_btn_setup = function () {
            this.dom.preserveColorButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.preserve_map = !$this.preserve_map;
            });
        };

        this.prepending_prevention_btn_setup = function () {
            this.dom.prependingPreventionButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.prepending_prevention = !$this.prepending_prevention;
                if ($this.isGraphPresent())
                    if ($this.graph_type == "stream")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
                    else if ($this.graph_type == "heat")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.merge_cp_btn_setup = function () {
            this.dom.mergeCPButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.merge_cp = !$this.merge_cp;
                if ($this.isGraphPresent()) {
                    $this.ripeDataBroker.loadCurrentState(false, null, true);
                    if ($this.merge_cp)
                        $this.update_counters(".counter_asn", $this.drawer.keys.length + "/" + env.current_parsed.cp_set.length);
                    else
                        $this.update_counters(".counter_asn", $this.drawer.keys.length);
                }
            });
        };

        this.merge_events_btn_setup = function () {
            this.dom.mergeEventsInput.filter(":input").val(this.merge_events);
            this.dom.mergeEventsInput.filter(":input").on("change", function (e, ui) {
                $this.merge_events = parseInt($this.dom.mergeEventsInput.val());
                if ($this.isGraphPresent()) {
                    $this.ripeDataBroker.loadCurrentState(false, null, true);
                    if ($this.merge_events)
                        $this.update_counters(".counter_events", $this.drawer.event_set.length + "/" + env.current_parsed.events.length);
                    else
                        $this.update_counters(".counter_events", env.current_parsed.events.length);
                }
            });
        };

        this.events_labels_btn_setup = function () {
            this.dom.eventsLabelsButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.events_labels = !$this.events_labels;
                if ($this.isGraphPresent())
                    $this.ripeDataBroker.loadCurrentState(false, null, false);
            });
        };

        this.cp_labels_btn_setup = function () {
            this.dom.cpLabelsButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.cp_labels = !$this.cp_labels;
                if ($this.isGraphPresent())
                    $this.ripeDataBroker.loadCurrentState(false, null, false);
            });
        };

        this.heatmap_time_btn_setup = function () {
            this.dom.heatmapTimeButton.on("click", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.heatmap_time_map = !$this.heatmap_time_map;
                if ($this.isGraphPresent())
                    $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.scrollbars_btn_setup = function () {
            this.dom.scrollbarsButton.on("mousedown", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.use_scrollbars = !$this.use_scrollbars;
                if ($this.use_scrollbars) {
                    $this.oldHeight = $this.dom.mainSvg.css("height");
                    $this.dom.mainSvg.css("height", '');
                    $this.dom.mainSvg.css("overflow-y", "scroll");
                    $this.dom.mainSvg.find('svg').css("height",$this.oldHeight);
                }
                else {
                    $this.dom.mainSvg.css("height", $this.oldHeight);
                    $this.dom.mainSvg.css("overflow-y", '');
                    $this.dom.mainSvg.find('svg').css("height",'');
                }
            });
        };

        this.global_visiblity_btn_setup = function () {
            this.dom.globalVisibilityButton.on("mousedown", function (e) {
                var target = e.target;
                $(target).find("span").toggleClass("hidden");
                $(target).parent().toggleClass("active");
                $this.global_visibility = !$this.global_visibility;
                if ($this.isGraphPresent())
                    if ($this.graph_type == "stream")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
                    else if ($this.graph_type == "heat")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.graph_type_radio_setup = function () {
            env.parentDom.on("mousedown", ".graph_type",  (e) => {
                this.loading(true);
                setTimeout(() => {
                    $this.graph_type = $this.dom.graphType.filter(":checked").val();
                    if ($this.graph_type == "stream") {
                        $this.dom.counterAsn.find("label").text("#ASN");
                        $this.dom.streamOptionButton.removeClass("hidden");
                        $this.dom.heatOptionButton.addClass("hidden");
                        $this.dom.mainSvg.css("height", '');
                        $this.dom.mainSvg.css("overflow-y", '');
                        $this.dom.mainSvg.find('svg').css("height",'');
                        $this.use_scrollbars = false;
                    } else if ($this.graph_type == "heat") {
                        $this.dom.counterAsn.find("label").text("#CP");
                        $this.dom.streamOptionButton.addClass("hidden");
                        $this.dom.heatOptionButton.removeClass("hidden");
                    }

                    $this.ripeDataBroker.heuristicsManager.setDefaultHeuristic($this.graph_type);
                    if ($this.isGraphPresent()) {
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
                    }
                }, 200);

            });
        };

        this.ip_version_checkbox_setup = function () {

            this.dom.ipVersionButton.on("change", function (e) {
                $this.ip_version = [];
                $this.dom.ipVersion.filter(":checked").each(function () {
                    $this.ip_version.push(parseInt($(this).val()));
                });
                if ($this.isGraphPresent()) {
                    if ($this.graph_type == "heat")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
                    else if ($this.graph_type == "stream")
                        $this.ripeDataBroker.loadCurrentState(false, null, true);
                }
            });
        };

        this.asn_level_setup = function () {
            this.dom.asnLvlInput.val(this.asn_level);
            this.dom.asnLvlInput.filter(":input")
                .on("change", function (e, ui) {
                    e.preventDefault();
                    e.stopPropagation();
                    if ($this.timerLevelSetup){
                        clearTimeout($this.timerLevelSetup);
                    }
                    $this.timerLevelSetup = setTimeout(function () {
                        $this.asn_level = parseInt($this.dom.asnLvlInput.val());
                        if ($this.isGraphPresent()) {
                            $this.ripeDataBroker.loadCurrentState(false, null, true);
                        }
                    }, 3000);

                });
        };


        this.streaming_btn_setup = function () {
            this.streaming_start_btn_setup();
            this.streaming_stop_btn_setup();
            this.dom.streamingStopButton.addClass("hidden");
        };

        this.streaming_start_btn_setup = function () {
            this.dom.streamingStartButton.on("mousedown", function (e, ui) {
                if(e.which==1){
                    $this.streaming = true;
                    $this.lock_all();
                    $this.dom.streamingStartButton.addClass("hidden");
                    $this.dom.streamingStopButton.removeClass("hidden");
                    $this.streaming_interval = $this.ripeDataBroker.streamgraph_streaming($this.streaming_speed);
                }
            });
        };

        this.streaming_stop_btn_setup = function () {
            this.dom.streamingStopButton.on("mousedown", function (e, ui) {
                if(e.which==1){
                    clearInterval($this.streaming_interval);
                    delete $this.streaming_interval;
                    $this.streaming=false;
                    $this.dom.streamingStartButton.removeClass("hidden");
                    $this.dom.streamingStopButton.addClass("hidden");
                    $this.draw_functions_btn_enabler();
                }
            });
        };

        this.steps_btn_setup = function () {
            this.steps_start_btn_setup();
            this.steps_stop_btn_setup();
            this.steps_pause_btn_setup();
            this.dom.stepsStopButton.addClass("hidden");
            this.dom.stepsPauseButton.addClass("hidden");
        };


        this.steps_start_btn_setup = function () {
            this.dom.stepsStartButton.on("mousedown", function (e, ui) {
                if(e.which==1) {
                    $this.steps = true;
                    $this.lock_all();
                    $this.dom.stepsStartButton.addClass("hidden");
                    $this.dom.stepsStopButton.removeClass("hidden");
                    $this.dom.stepsPauseButton.removeClass("hidden");
                    $this.steps_interval= $this.ripeDataBroker.streamgraph_stepped_view(50);
                }
            });
        };

        this.steps_stop_btn_setup = function () {
            this.dom.stepsStopButton.on("mousedown", function (e, ui) {
                if(e.which==1) {
                    console.log("Stopping steps view with interval ID: "+$this.steps_interval);
                    clearInterval($this.steps_interval);
                    delete $this.steps_interval;
                    $this.current_step = 0;
                    $this.steps = false;
                    $this.ripeDataBroker.steps_core(0);
                    $this.dom.stepsStartButton.removeClass("hidden");
                    $this.dom.stepsStopButton.addClass("hidden");
                    $this.dom.stepsPauseButton.addClass("hidden");
                    env.logger.log("== GuiManager Streaming stopped");
                    $this.draw_functions_btn_enabler();
                }
            });
        };

        this.steps_pause_btn_setup = function () {
            this.dom.stepsPauseButton.on("mousedown", function (e, ui) {
                if(e.which==1) {
                    console.log("Pausing steps view with interval ID: "+$this.steps_interval);
                    clearInterval($this.steps_interval);
                    delete $this.steps_interval;
                    $this.steps = false;
                    $this.dom.stepsStartButton.removeClass("hidden");
                    $this.dom.stepsPauseButton.addClass("hidden");
                    env.logger.log("== GuiManager Streaming stopped");
                    $this.draw_functions_btn_enabler();
                }
            });
        };

        this.list_btn_setup = function () {
            this.dom.listButton.on("mousedown", function (e) {
                if ($this.asn_info_done) {
                    $this.dom.asnListButton.parent().removeClass("not-active");
                    $this.dom.asnListButton.parent().removeClass("disabled");
                }
                else {
                    $this.dom.asnListButton.parent().addClass("not-active");
                    $this.dom.asnListButton.parent().addClass("disabled");
                }
                if ($this.cp_info_done) {
                    $this.dom.cpListButton.parent().removeClass("not-active");
                    $this.dom.cpListButton.parent().removeClass("disabled");
                }
                else {
                    $this.dom.cpListButton.parent().addClass("not-active");
                    $this.dom.cpListButton.parent().addClass("disabled");
                }
            });
        };

        this.asn_list_btn_setup = function () {
            this.dom.asnListButton.hover(function (event) {
                var html = "";
                var set;
                if ($this.graph_type == "stream")
                    set = $this.drawer.keys.slice(0).reverse();
                else if ($this.graph_type == "heat")
                    set = $this.drawer.asn_set.slice(0);
                for (var i in set) {
                    var asn = set[i];
                    var color_background = $this.drawer.z(asn);
                    var color_text = $this.drawer.colorManager.furthestLabelColor(color_background);
                    html += '<li class="list-group-item as' + asn + '" style="color:' + color_text + '; background-color:' + color_background + ';"';
                    if ($this.graph_type == "stream")
                        html += 'onmouseover="d3.selectAll(\'.area\').filter(function(d){return d.key!=' + asn + ';}).style(\'fill-opacity\',\'0.35\');" onmouseout="d3.selectAll(\'.area\').style(\'fill-opacity\',1);">';
                    else if ($this.graph_type == 'heat')
                        html += 'onmouseover="d3.selectAll(\'.area\').filter(function(d){return d.asn!=' + asn + ';}).style(\'fill-opacity\',\'0.35\');" onmouseout="d3.selectAll(\'.area\').style(\'fill-opacity\',1);">';
                    html += "<div> ASN: " + asn + "</div>";
                    var info = $this.ripeDataBroker.current_parsed.known_asn[asn];
                    if (info) {
                        var tokens = info.split(",");
                        var parts = string_break(tokens[0].trim());
                        html+= "<div>";
                        html+=parts.join("<br/>");
                        html+= "</div>";
                        var country = tokens[tokens.length - 1].trim().split("-")[0];
                        html += '<div> Country: (' + country + ') <span class="flag-icon flag-icon-' + country.toLowerCase() + '" alt="' + country + '" title="' + country + '"></span></div>';
                    }
                    html += "</li>";
                }
                $this.dom.asnList.html(html);
                if (set.length < $this.asn_list_max_scroll) {
                    $this.dom.asnList.css("height", "auto");
                    $this.dom.asnList.css("overflow-y", "visible");
                }
                else {
                    $this.dom.asnList.css("height", "");
                    $this.dom.asnList.css("overflow-y", "");
                }
            });

            this.dom.asnListButton.click(function (event) {
                event.stopPropagation();
                event.preventDefault();
            });

            function string_break(str){
                var l = str.length;
                var tks = str.split(/[ -]/);
                var parts = [];
                var limit = 15;
                var counter = 0;
                var s = "";
                for(var i=0; i<tks.length; i++){
                    var ti = tks[i];
                    counter+=ti.length;
                    s+=ti;
                    if(s.length>limit){
                        parts.push(s);
                        s="";
                    }
                    else{
                        if(str[counter]!=undefined)
                            s+=str[counter];
                    }
                    counter++;
                }
                if(s!=="")
                    parts.push(s);
                return parts;
            }
        };

        this.cp_list_btn_setup = function () {
            this.dom.cpListButton.hover(function (event) {
                var html = "";
                var set;
                if ($this.graph_type == "stream") {
                    set = $this.ripeDataBroker.current_parsed.cp_set;
                } else if ($this.graph_type == "heat"){
                    set = $this.drawer.keys;
                }
                for (var i in set) {
                    var cp = set[i];
                    html += "<li>";
                    html += "<div> ID: " + cp + "</div>";
                    var info = $this.ripeDataBroker.current_parsed.known_cp[cp];
                    if (info) {
                        html += "<div> IP: " + info["ip"] + "</div>";
                        html += "<div> Peering with CP: " + info["rrc"] + "</div>";
                        html += "<div> From AS: " + info["as_number"] + "</div>";
                        var country = info["geo"].trim().split("-")[0];
                        html += '<div> Country: (' + country + ') <span class="flag-icon flag-icon-' + country.toLowerCase() + '" alt="' + country + '" title="' + country + '"></span></div>';
                    }
                    html += "</li>";
                }
                $this.dom.cpList.html(html);
                if (set.length < $this.cp_list_max_scroll) {
                    $this.dom.cpList.css("height", "auto");
                    $this.dom.cpList.css("overflow-y", "visible");
                }
                else {
                    $this.dom.cpList.css("height", "");
                    $this.dom.cpList.css("overflow-y", "");
                }
            });

            this.dom.cpListButton.click(function (event) {
                event.stopPropagation();
                event.preventDefault();
            });
        };

        /************************** ORDERING BUTTONS **************************/
        //levensthein
        this.lev_dist_randwalk_cum_btn_setup = function () {
            this.dom.levDistRandCumButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "lev_rnd_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.lev_dist_randwalk_max_btn_setup = function () {
            this.dom.levDistRanMaxButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "lev_rnd_max";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        //best std dev random walking
        this.point_dist_by_randwalk_btn_setup = function () {
            this.dom.pointDistRanButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "st_rnd_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.point_dist_by_inference_btn_setup = function () {
            this.dom.pointDistInfButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "st_inf_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        //STD DEV SWAP
        this.point_dist_greedy_btn_setup = function () {
            this.dom.pointDistGreedyButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "st_grdy_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        //NEARFLOWS
        this.exchange_greedy_sort_btn_setup = function () {
            this.dom.exchangeGreedyButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "n_f";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        //WIGGLES
        this.wiggle_sum_btn_setup = function () {
            this.dom.wiggleSumButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "w_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.wiggle_max_btn_setup = function () {
            this.dom.wiggleMaxButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "w_max";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        //SORTS
        this.sort_asn_ascstdev_btn_setup = function () {
            this.dom.ascstdevSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_st";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "asc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_dscstdev_btn_setup = function () {
            this.dom.dscstdevSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_st";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "dsc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_ascvar_btn_setup = function () {
            this.dom.ascvarSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_var";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "asc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_dscvar_btn_setup = function () {
            this.dom.dscvarSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_var";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "dsc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_ascavg_btn_setup = function () {
            this.dom.ascavgSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_avg";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "asc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_dscavg_btn_setup = function () {
            this.dom.dscavgSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_avg";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "dsc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_ascsum_btn_setup = function () {
            this.dom.ascsumSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "asc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.sort_asn_dscsum_btn_setup = function () {
            this.dom.dscsumSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "s_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = "dsc";
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        /**HEATMAP**/
        this.heat_greedy_sort_1_btn_setup = function () {
            this.dom.heatGreedy1SortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "nf_1";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.heat_greedy_sort_2_btn_setup = function () {
            this.dom.heatGreedy2SortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "nf_2";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.heat_stdev_sort_btn_setup = function () {
            this.dom.heatStdevSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "st_grdy_cum";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.heat_geo_sort_btn_setup = function () {
            this.dom.heatCountrySortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "geo";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };

        this.heat_asn_sort_btn_setup = function () {
            this.dom.heatGeoSortButton.on("mousedown", function (e) {
                $this.ripeDataBroker.heuristicsManager.current_heuristic = "asn";
                $this.ripeDataBroker.heuristicsManager.current_sort_type = null;
                $this.ripeDataBroker.loadCurrentState(false, null, true);
            });
        };


        /**************************************** OTHERS ************************************************/
        this.set_ordering = function (order) {
            $this.ripeDataBroker.loadCurrentState(order, false, null, true);
        };

        this.get_ordering = function () {
            return this.drawer.keys;
        };

        this.restoreQuery = function () {
            // Populate UI elements
        };

        this.update_counters = function (selector, quantity) {
            $(selector).text(quantity);
        };


        this.loading = function(isLoading){

            if (isLoading){
                this.dom.loadingImage.show();
            } else {
                this.dom.loadingImage.hide();

            }

        };
    };

    return GuiManager;
});