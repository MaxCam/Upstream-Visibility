define([
    "bgpst.env.utils",
    "bgpst.view.graphdrawer",
    "bgpst.view.gui"
], function(utils, GraphDrawer, GuiManager){

    var Main = function(env) {
        this.exposedMethods = ["getVersion", "on", "init", "getEnvironment"];

        this.getVersion = function(){
            return env.version;
        };

        this.on = function(event, callback){
            utils.observer.subscribe(event, callback, this);
        };

        this.getEnvironment = function () {
            return env;
        };

        this.init = function(){
            env.guiManager = new GuiManager(env);
            env.guiManager.init();

        };

    };

    return Main;
});