define([
	"bgpst.lib.moment"
], function(moment){

	var DateConverter = function(){
		this.ripestat_data_format = "YYYY-MM-DDTHH:mm:ss";
		this.ripestat_data_format_date = "YYYY-MM-DD";
		this.ripestat_data_format_time = "HH:mm:ss";
		this.interface_format_date = "DD/MM/YYYY";
		this.interface_format_time = "HH:mm:ss";
		this.interface_format = "YYYY-MM-DD HH:mm:ss";
	};

	/****************************************************************/
	DateConverter.prototype.formatInterface = function(date){
		return moment(date).format(this.interface_format);
	};

	DateConverter.prototype.parseRipe = function(date){
		return moment(date, this.ripestat_data_format);
	};

	DateConverter.prototype.parseRipeTime = function(date){
		return moment(date,this.ripestat_data_format_time).format(this.ripestat_data_format_time);
	};

	DateConverter.prototype.parseRipeDate = function(date){
		return moment(date,this.ripestat_data_format_date);
	};

	DateConverter.prototype.formatRipe = function(date){
		return moment(date).format(this.ripestat_data_format);	
	};

	DateConverter.prototype.formatRipeDate = function(date){
		return moment(date,this.interface_format_date).format(this.ripestat_data_format_date);	
	};

	DateConverter.prototype.formatRipeTime = function(date){
		return moment(date,this.ripestat_data_format_time).format(this.ripestat_data_format_time);
	};

	DateConverter.prototype.formatRipeDateTime = function(date, time){
		return this.formatRipeDate(date)+"T"+this.formatRipeTime(time);
	};

	/****************************************************************/
	DateConverter.prototype.parseUnix = function(date){
		return moment.unix(date);
	};

	DateConverter.prototype.formatUnix = function(date){
		return moment(date).utc().unix();
	};

	/****************************************************************/
	DateConverter.prototype.parseInterfaceDate = function(date){
		return moment(date,this.interface_format_date);
	};

	DateConverter.prototype.parseInterfaceTime = function(date){
		return moment(date,this.interface_format_time).format(this.interface_format_time);	
	};

	DateConverter.prototype.parseInterface = function(date){
		return moment(date,this.interface_format_date+" "+this.interface_format_time);
	};

	DateConverter.prototype.formatInterfaceDate = function(date){
		return moment(date).format(this.interface_format_date);
	};

	DateConverter.prototype.formatInterfaceTime = function(date){
		return moment(date,this.ripestat_data_format_time).format(this.interface_format_time);
	};

	DateConverter.prototype.formatInterface = function(date){
		return moment(date).format(this.interface_format_date+" "+this.interface_format_time);
	};

	/****************************************************************/
	DateConverter.prototype.executionTime = function(start,end){
		var dif = moment.duration(moment(end).diff(moment(start)));
		return dif.hours()+":"+dif.minutes()+":"+dif.seconds()+"."+dif.milliseconds();
	};

	return DateConverter;
});