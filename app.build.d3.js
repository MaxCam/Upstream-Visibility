({
    baseUrl : ".",
    findNestedDependencies: true,
    preserveLicenseComments: false,

    wrap: {
        start: "define([], function(){" +
        "define.amd=false;",
        end: "return d3; });"
    },

    include: [
        "bgpst.lib.d3-amd"
    ],

    paths: {
        "bgpst.lib.d3-amd": "dev/libs/d3/js/d3.v4.amd"
    },

    shim: {
    },

    optimize: "none",
    wrapShim: true,
    generateSourceMaps: false,
    out: "dev/libs/d3-libs.js"

})