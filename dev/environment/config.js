/**
 * Change configs here.
 */

define([], function(){

    /**
     * Configuration file
     */

    return {
        widgetPrefix: "ic",
        defaultTimeWindowMinutes: 60 * 24 * 2, // 2 days

        dataAPIs:{
            main: "https://stat.ripe.net/data/bgplay/data.json",
            count: "https://stat.ripe.net/data/ris-peer-count/data.json",
            cpInfo: "https://stat.ripe.net/data/geoloc/data.json",
            asInfo: "https://stat.ripe.net/data/as-overview/data.json",
            ipInfo: "https://stat.ripe.net/data/whats-my-ip/data.json" 
        },
        
        style: {
            colorRange: ["#FEE8c8", "#B30000"],
            barChart: {
                margin: { top: 20, right: 20, bottom: 70, left: 40, label: 7 },
                width: 1000,
                height: 200
            },
            map: {
                width: 660,
                height: 500
            },
            legend: {
                width: 20,
                height: 300,
                margin: {
                    left: 20,
                    top: 20
                },
                marginLabel: 30
            }
        }
        
    };
});
