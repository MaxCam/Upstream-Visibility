/**
 * Some require.js configurations
 */


requirejs.config({
    waitSeconds: 30,
    paths:{
        /* environment */
        "bgpst.env.utils": window.atlas._widgets.bgpst.urls.env + "utils",
        "bgpst.env.config": window.atlas._widgets.bgpst.urls.env + "config",
        "bgpst.env.languages.en": window.atlas._widgets.bgpst.urls.env + "languages/language.eng",

        /* libs */
        "bgpst.lib.require": window.atlas._widgets.bgpst.urls.libs + "require.min",
        "bgpst.lib.jquery-amd": window.atlas._widgets.bgpst.urls.libs + "jquery-libs-amd",
        "bgpst.lib.jquery-libs": window.atlas._widgets.bgpst.urls.libs + "jquery-libs",
        "bgpst.lib.date-format": window.atlas._widgets.bgpst.urls.libs + "dateFormat",
        "bgpst.lib.d3-amd": window.atlas._widgets.bgpst.urls.libs + "d3-libs",
        "bgpst.lib.mustache": window.atlas._widgets.bgpst.urls.libs + "mustache",
        "bgpst.lib.text": window.atlas._widgets.bgpst.urls.libs + "require-text",
        "bgpst.lib.stache": window.atlas._widgets.bgpst.urls.libs + "stache",
        "bgpst.lib.colorbrewer": window.atlas._widgets.bgpst.urls.libs + "colorbrewer",
        "bgpst.lib.d3.legend": window.atlas._widgets.bgpst.urls.libs + "d3.legend",
        "bgpst.lib.moment": window.atlas._widgets.bgpst.urls.libs + "moment-libs",

        "bgpst.lib.bootstrap.datetimepicker": window.atlas._widgets.bgpst.urls.libs + "datetimepicker/4.17.47/bootstrap-datetimepicker.min",
        "bgpst.lib.bootstrap.validator": window.atlas._widgets.bgpst.urls.libs + "form_validator/0.5.3/bootstrapValidator.min",
        "bgpst.lib.bootstrap.validator-it": window.atlas._widgets.bgpst.urls.libs + "form_validator/0.5.3/it_IT",

        "bgpst.lib.bootstrap.tokenfield": window.atlas._widgets.bgpst.urls.libs + "tokenfield/0.12.0/bootstrap-tokenfield.min",



        /* view */
        "bgpst.view.main": window.atlas._widgets.bgpst.urls.view + "MainView",
        "bgpst.view.color": window.atlas._widgets.bgpst.urls.view + "ColorManager",
        "bgpst.view.graphdrawer": window.atlas._widgets.bgpst.urls.view + "GraphDrawer",
        "bgpst.view.gui": window.atlas._widgets.bgpst.urls.view + "GuiManager",
        "bgpst.view.heuristics": window.atlas._widgets.bgpst.urls.view + "HeuristicsManager",
        "bgpst.view.metrics": window.atlas._widgets.bgpst.urls.view + "MetricsManager",
        "bgpst.view.broker": window.atlas._widgets.bgpst.urls.view + "RipeDataBroker",
        "bgpst.view.parser": window.atlas._widgets.bgpst.urls.view + "RipeDataParser",
        "bgpst.view.scroller": window.atlas._widgets.bgpst.urls.view + "Scroller",

        /* controller */
        "bgpst.controller.main": window.atlas._widgets.bgpst.urls.controller + "main",

        "bgpst.controller.dateconverter": window.atlas._widgets.bgpst.urls.controller + "helpers/DateConverter",
        "bgpst.controller.functions": window.atlas._widgets.bgpst.urls.controller + "helpers/Functions",
        "bgpst.controller.ipv4validator": window.atlas._widgets.bgpst.urls.controller + "helpers/Ipv4Validator",
        "bgpst.controller.ipv6validator": window.atlas._widgets.bgpst.urls.controller + "helpers/Ipv6Validator",
        "bgpst.controller.logger": window.atlas._widgets.bgpst.urls.controller + "helpers/Logger",
        "bgpst.controller.validator": window.atlas._widgets.bgpst.urls.controller + "helpers/Validator",


        /* model */
        "bgpst.model.gdbstruct": window.atlas._widgets.bgpst.urls.model + "gdb_structure/GDBStruct"
        

    },
    shim:{
        "bgpst.lib.bootstrap-datetimepicker": {
            deps: ["bgpst.lib.jquery-amd"]
        },
        "bgpst.lib.bootstrap-validator": {
            deps: ["bgpst.lib.jquery-amd"]
        },
        "bgpst.lib.bootstrap-validator-it": {
            deps: ["bgpst.lib.jquery-amd"]
        },
        "bgpst.lib.bootstrap-tokenfield": {
            deps: ["bgpst.lib.jquery-amd"]
        },
        "bgpst.lib.d3-amd": {
            export: "d3"
        }
    },

    stache: {
        extension: '.html', // default = '.html'
        path: 'dev/view/html/' // default = ''
    }
});



define([
    "bgpst.env.utils",
    "bgpst.lib.moment",
    "bgpst.env.config",
    "bgpst.env.languages.en",
    "bgpst.lib.jquery-amd",
    "bgpst.controller.main",
    "bgpst.controller.logger"
], function(utils, moment, config, language, $, Main, Logger){

    return function(instance){
        var env, instanceParams, queryParams, parentDom, styleDownloads, objectToBeEnriched;

        /*
         * Access to the instance
         */
        instanceParams = instance.instanceParams;
        queryParams = instance.queryParams;
        parentDom = instance.domElement;

        /*
         * Init Dependency Injection Vector
         */
        env = {
            "version": "18.7.25.2",
            "dev": instanceParams.dev,
            "showMetricsScore": instanceParams.showMetricsScore,
            "logger": new Logger(),
            "autoStart": instanceParams.autoStart || true,
            "widgetUrl": WIDGET_URL + "dev/",
            "parentDom": $(parentDom),
            "queryParams": queryParams
            //{ resource: "IP", startDate: new Date(), stopDate: new Date()}
        };

        if (!env.queryParams.targets.every(function (item) {
                return utils.validateIP(item.toString()) || !isNaN(item.toString().replace(/AS/ig, ''));
            })){
            utils.observer.publish("error", "One of the targets is not a valid resource (IP, prefix, ASN)");
        }

        if (env.queryParams.stopDate) {
            env.queryParams.stopDate = (isNaN(env.queryParams.stopDate)) ?
                moment(env.queryParams.stopDate).utc() : // parse string
                moment.unix(env.queryParams.stopDate).utc(); // parse unix timestamp
        } else {
            env.queryParams.stopDate = moment.utc(); // now
        }

        if (env.queryParams.startDate) {
            env.queryParams.startDate = (isNaN(env.queryParams.startDate)) ?
                moment(env.queryParams.startDate).utc() :
                moment.unix(env.queryParams.startDate).utc();
        } else {
            env.queryParams.startDate = moment(env.queryParams.stopDate).subtract(config.defaultTimeWindowMinutes, "minute"); // default time window
        }

        /*
         * Check if parent dom exists
         */
        if (!env.parentDom || env.parentDom.length == 0){
            throw "It was not possible to find the DOM element to populate";
        }


        /*
         * Check if stylesheets are loaded
         */

        if (!instanceParams.dev){
            styleDownloads = [
                window.atlas._widgets.bgpst.urls.view + "css/style-lib-dist.min.css"
            ];
        } else {
            styleDownloads = [
                window.atlas._widgets.bgpst.urls.view + "css/style.css",
                window.atlas._widgets.bgpst.urls.libs + "jquery/jquery-ui.min.css",
                window.atlas._widgets.bgpst.urls.libs + "bootstrap/css/bootstrap.min.css",
                window.atlas._widgets.bgpst.urls.libs + "bootstrap/css/bootstrap-theme.min.css",
                window.atlas._widgets.bgpst.urls.libs + "bootstrap-slider/css/bootstrap-slider.css",
                window.atlas._widgets.bgpst.urls.view + "css/flags/2.8.0/flag-icon.min.css",
                window.atlas._widgets.bgpst.urls.libs + "bootstrap-datetimepicker/css/bootstrap-datetimepicker.css"
            ];

        }


        objectToBeEnriched = {};

        utils.loadStylesheets(styleDownloads, function(){
            var n, length, methodName, callbackReady;

            env.main = new Main(env);

            if (env.autoStart){
                env.main.init();
            }

            function enrichMethod(methodName) {
                objectToBeEnriched[methodName] = function () {
                    return env.main[methodName].apply(env.main, arguments);
                }
            }

            for (n=0,length=env.main.exposedMethods.length; n<length; n++){
                methodName = env.main.exposedMethods[n];
                enrichMethod(methodName);
            }

            callbackReady = window.atlas._widgets.bgpst.instances.callback[parentDom];

            /* bgp stream script to ben run */
            if (callbackReady){
                callbackReady(objectToBeEnriched);
            }
        });


        /**
         * A set of methods exposed outside
         */
        return objectToBeEnriched;
    };

});

