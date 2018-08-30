({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){" +
        "define.amd=false;",
        end: "return moment; });"
    },

    include: [
        "bgpst.lib.moment"
    ],

    paths: {
        "bgpst.lib.moment": "dev/libs/moment/2.18.1/moment.min"
    },

    shim: {
    },

    optimize: "none",
    wrapShim: true,
    generateSourceMaps: false,
    out: "dev/libs/moment-libs.js"

})