/**
 * The location of the widget
 */
if (typeof STAT_WIDGET_API_URL == 'undefined') {
    STAT_WIDGET_API_URL = "https://stat.ripe.net/widgets/";  // Default repo
}
WIDGET_URL = ((typeof EXTERNAL_WIDGET_URL == 'undefined') ? STAT_WIDGET_API_URL + 'js/interdomain-landscape/' : EXTERNAL_WIDGET_URL) ;

/**
 * Name space configuration
 */
window.atlas = window.atlas || {};
window.atlas._widgets = window.atlas._widgets || {};
window.atlas._widgets.bgpst = window.atlas._widgets.bgpst || {};
window.atlas._widgets.bgpst.urls = window.atlas._widgets.bgpst.urls || {
        libs: WIDGET_URL + "dev/libs/",
        env: WIDGET_URL + "dev/environment/",
        connector: WIDGET_URL + "dev/connector/",
        model: WIDGET_URL + "dev/model/",
        view: WIDGET_URL + "dev/view/",
        controller: WIDGET_URL + "dev/controller/",
        session: WIDGET_URL + "dev/session/"
    };
window.atlas._widgets.bgpst.instances = window.atlas._widgets.bgpst.instances || {
        requested: [],
        running: {},
        callback: {}
    };


if (!window.atlas._widgets.widgetInjectorRequested) { // Only one injector
    window.atlas._widgets.widgetInjectorRequested = true;
    if (typeof requirejs == "undefined") {
        window.atlas._widgets.widgetInjectorLoaded = false;
        window.atlas._widgets.bgpst.tmp_scripts = document.getElementsByTagName('script');
        window.atlas._widgets.bgpst.tmp_scrip = window.atlas._widgets.bgpst.tmp_scripts[window.atlas._widgets.bgpst.tmp_scripts.length - 1];
        window.atlas._widgets.injectorScript = document.createElement('script');
        window.atlas._widgets.injectorScript.async = false;
        window.atlas._widgets.injectorScript.src = window.atlas._widgets.bgpst.urls.libs + 'require.min.js';
        window.atlas._widgets.bgpst.tmp_scrip.parentNode.appendChild(window.atlas._widgets.injectorScript);
    } else {
        window.atlas._widgets.widgetInjectorLoaded = true;
    }
}

/**
 * Widget injector
 */
function initBGPst(domElement, instanceParams, queryParams){
    var run;

    run = function(){
        var instances, instance;

        instances = window.atlas._widgets.bgpst.instances;
        instance = instances.requested.shift();

        while (instance){
            (function(instances, instance){
                requirejs.config({
                    waitSeconds: 60
                });
                if (instance.instanceParams.dev) { // Load dev version
                    require([WIDGET_URL + 'bgpst-loader.js'], function(Widget){
                        instances.running[instance.domElement] = Widget(instance);
                    });
                } else { // Load deployed version
                    require([WIDGET_URL + 'bgpst-dist.js'], function () {
                        require(['bgpst-loader'], function(Widget){
                            instances.running[instance.domElement] = Widget(instance);
                        });
                    });
                }
            })(instances, instance);

            instance = instances.requested.shift();
        }
    };

    window.atlas._widgets.bgpst.instances.callback[domElement] = null;
    window.atlas._widgets.bgpst.instances.requested
        .push({ domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {} });

    if (document.readyState == 'complete'){
        window.atlas._widgets.widgetInjectorLoaded = true;
    } else {

        function ieLoadBugFix(){
            if (!window.atlas._widgets.widgetInjectorLoaded){
                if (document.readyState=='loaded' || document.readyState=='complete') {
                    window.atlas._widgets.injectorScript.onload();
                }else {
                    setTimeout(ieLoadBugFix, 200);
                }
            }
        }

        ieLoadBugFix();
    }

    if (window.atlas._widgets.widgetInjectorLoaded === false){
        window.atlas._widgets.injectorScript.onload = function(){
            window.atlas._widgets.widgetInjectorLoaded = true;
            run();
        };
    } else {
        run();
    }

    return {
        ready: function(callback){
            window.atlas._widgets.bgpst.instances.callback[domElement] = callback;
        },
        shell: function(){
            var instance = window.atlas._widgets.bgpst.instances.running[domElement];

            if (instance) {
                return instance;
            } else {
                throw "Widget not loaded yet. Try again in a few seconds."
            }
        }
    };
}

if (typeof jQuery != 'undefined' && jQuery.fn && window.ripestat) {

    jQuery.fn.interdomainLandscape = function (data, widget_width, mark_loaded) {
        var thisWidget, widgetParams, domElement, oldReadyFunction, instance;

        thisWidget = this.statWidget();
        widgetParams = thisWidget.get_params();
        domElement = jQuery(this)[0];
        oldReadyFunction = widgetParams.ready;

        widgetParams.ready = function () {
            mark_loaded();
            if (oldReadyFunction) {
                oldReadyFunction();
            }
        };

        instance = initBGPst(domElement, {
            dev: false,
            sendErrors: false
        }, {
            targets: [widgetParams.resource],
            startDate: widgetParams.starttime,
            stopDate: widgetParams.endtime
        });

        instance.ready(function(){
            var updateLink = false;

            instance.shell()
                .on("error", function (error) {
                    $(domElement).addMsg("error", error, true);
                });
            instance.shell()
                .on("updated", function(params){
                    var newParams = {
                        resource: params.targets.join(","),
                        starttime: params.startDate.unix(),
                        endtime: params.stopDate.unix()
                    };
                    thisWidget.set_params(newParams);
                    if (updateLink) {
                        thisWidget.navigate(newParams);
                        thisWidget.update_permalinks();
                    } else {
                        updateLink = true;
                    }

                    $(domElement).find(".messages").remove();
                });
        });
    };
}