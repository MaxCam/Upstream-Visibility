define([
], function(){
	
	return function () {
		var printErrors = false;
		var printDebug = false;

		this.log = function (string, type){
			if ((!type || type == "debug") && printDebug){
				console.log(string);
			} else if (type == "error" && printErrors) {
				console.log(string);
			}
		}
	}
});