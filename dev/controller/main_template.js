define([
    "bgpst.env.config",
    "bgpst.env.utils",
    "bgpst.lib.jquery-amd",
    "bgpst.connector.facade",
    "bgpst.view.main"
], function(config, utils, $, Connector, MainView) {

    var main = function (env) {
        this.exposedMethods = ["getVersion", "on", "init", "applyConfiguration", "setTimeRange"];

        this.getVersion = function(){
            return env.version;
        };

        this.on = function(event, callback){
            utils.observer.subscribe(event, callback, this);
        };

        this.init = function(){
            env.mainView = new MainView(env);

        };


        this.init();

    };

    return main;
});