({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    name: 'bgpst-loader',

    paths: {
        /* environment */
        "bgpst.env.utils": "dev/environment/utils",
        "bgpst.env.config": "dev/environment/config",
        "bgpst.env.languages.en": "dev/environment/languages/language.eng",

        /* libs */
        "bgpst.lib.require": "dev/libs/require.min",
        "bgpst.lib.jquery-amd": "dev/libs/jquery-libs-amd",
        "bgpst.lib.jquery-libs": "dev/libs/jquery-libs",
        "bgpst.lib.date-format": "dev/libs/dateFormat",
        "bgpst.lib.d3-amd": "dev/libs/d3-libs",
        "bgpst.lib.mustache": "dev/libs/mustache",
        "bgpst.lib.text": "dev/libs/require-text",
        "bgpst.lib.stache": "dev/libs/stache",
        "bgpst.lib.colorbrewer": "dev/libs/colorbrewer",
        "bgpst.lib.d3.legend": "dev/libs/d3.legend",
        "bgpst.lib.moment": "dev/libs/moment-libs",

        /* view */
        "bgpst.view.main": "dev/view/MainView",
        "bgpst.view.color": "dev/view/ColorManager",
        "bgpst.view.graphdrawer": "dev/view/GraphDrawer",
        "bgpst.view.gui": "dev/view/GuiManager",
        "bgpst.view.context": "dev/view/ContextManager",
        "bgpst.view.heuristics": "dev/view/HeuristicsManager",
        "bgpst.view.metrics": "dev/view/MetricsManager",
        "bgpst.view.broker": "dev/view/RipeDataBroker",
        "bgpst.view.parser": "dev/view/RipeDataParser",
        "bgpst.view.scroller": "dev/view/Scroller",

        /* controller */
        "bgpst.controller.main": "dev/controller/main",

        "bgpst.controller.asnvalidator": "dev/controller/helpers/AsnValidator",
        "bgpst.controller.dateconverter": "dev/controller/helpers/DateConverter",
        "bgpst.controller.datevalidator": "dev/controller/helpers/DateValidator",
        "bgpst.controller.functions": "dev/controller/helpers/Functions",
        "bgpst.controller.ipv4validator": "dev/controller/helpers/Ipv4Validator",
        "bgpst.controller.ipv6validator": "dev/controller/helpers/Ipv6Validator",
        "bgpst.controller.logger": "dev/controller/helpers/Logger",
        "bgpst.controller.validator": "dev/controller/helpers/Validator",


        /* model */
        "bgpst.model.gdbstruct": "dev/model/gdb_structure/GDBStruct",


        /* connector */
        "bgpst.connector.facade": "dev/connector/ConnectorFacade",
        "bgpst.connector.translation": "dev/connector/TranslationConnector",
        "bgpst.connector.rest": "dev/connector/RestConnector"

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
    },
    stubModules: ["bgpst.lib.text", "bgpst.lib.stache"],
    removeCombined: true,
    optimize: "none",//uglify2
    wrapShim: true,
    generateSourceMaps: false,

    out: "bgpst-dist.js"


})