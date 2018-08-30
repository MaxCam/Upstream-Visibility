({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){" +
        "define.amd=false;",
        end: "});"
    },

    include: [
        "bgpst.lib.jquery",
        // "bgpst.lib.jquery-ui",
        "bgpst.lib.bootstrap",
        "bgpst.lib.bootstrap.datetimepicker"
    ],

    paths: {
        "bgpst.lib.jquery": "dev/libs/jquery/jquery-1.11.1.min",
        "bgpst.lib.jquery-ui": "dev/libs/jquery_ui/1.12.1/jquery-ui.min",
        // "bgpst.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap.min",
        "bgpst.lib.bootstrap": "dev/libs/bootstrap/js/bootstrap_3.3.7.min",
        "bgpst.lib.bootstrap.datetimepicker": "dev/libs/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min",
    },

    // shim: {
    //     "bgpst.lib.bootstrap": {
    //         deps: ["bgpst.lib.jquery"]
    //     },
    //     "bgpst.lib.jquery-ui": {
    //         deps: ["bgpst.lib.jquery"]
    //     },
    //     "bgpst.lib.bootstrap.datetimepicker": {
    //         deps: ["bgpst.lib.bootstrap"]
    //     }
    // },

    optimize: "none",
    wrapShim: true,
    generateSourceMaps: false,
    out: "dev/libs/jquery-libs.js"

})