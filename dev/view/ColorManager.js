define([
    "bgpst.lib.d3-amd"
], function(d3){

    var ColorManager = function (env) {
        this.initcolors();
    };



    ColorManager.prototype.initcolors = function() {
        return new Promise(function (resolve, reject) {
            this.ds = [];
            this.d_sorteds = [];


            resolve(this.innerloop());
        }.bind(this));
    };


    ColorManager.prototype.innerloop = function() {
        for (var size=76; size >= 46; size--) {
            for (var b = -110; b < 100; b += 1) {
                for (var a = -100; a < 100; a += 1) {
                    var lab = d3.lab(size, a, b);
                    var rugub = lab.rgb();

                    // valid color?
                    if ((0 < rugub.r) && (rugub.r < 256) && (0 < rugub.g) && (rugub.g < 256) && (0 < rugub.b) && (rugub.b < 256)) {

                        // constraint
                        if (lab.l > 45 && lab.l < 75) {
                            // var vector = [size, a, b];
                            // unique[JSON.stringify(vector)] = true;
                            this.ds.push({
                                lab: lab, // the color
                                n: 1000000 // (distance to the nearest chosen color) ** 2
                            });
                        }
                    }
                }
            }
        }
    };


    // ColorManager.prototype.innerloop = function() {
    //
    //     // var workerWrapper = function () {
    //     //     addEventListener('message', function(e) {
    //     //         var ds = [];
    //     //         for (var size=76; size >= 46; size--) {
    //     //             for (var b = -110; b < 100; b += 1) {
    //     //                 for (var a = -100; a < 100; a += 1) {
    //     //                     var lab = d3.lab(size, a, b);
    //     //                     var rugub = lab.rgb();
    //     //
    //     //                     // valid color?
    //     //                     if ((0 < rugub.r) && (rugub.r < 256) && (0 < rugub.g) && (rugub.g < 256) && (0 < rugub.b) && (rugub.b < 256)) {
    //     //
    //     //                         // constraint
    //     //                         if (lab.l > 45 && lab.l < 75) {
    //     //                             ds.push({
    //     //                                 lab: lab, // the color
    //     //                                 n: 1000000 // (distance to the nearest chosen color) ** 2
    //     //                             });
    //     //                         }
    //     //                     }
    //     //                 }
    //     //             }
    //     //         }
    //     //
    //     //         postMessage(ds);
    //     //     }, false);
    //     // }.toString();
    //
    //
    //     var workerWrapper ="function () {addEventListener('message', function() {var ds = [];var d3 = " + d3.toString() + ";for (var size=76; size >= 46; size--) {for (var b = -110; b < 100; b += 1) {for (var a = -100; a < 100; a += 1) {var lab = d3.lab(size, a, b);var rugub = lab.rgb();if ((0 < rugub.r) && (rugub.r < 256) && (0 < rugub.g) && (rugub.g < 256) && (0 < rugub.b) && (rugub.b < 256)) {if (lab.l > 45 && lab.l < 75) {ds.push({lab: lab, n: 1000000});}}}}}postMessage(ds);}, false);}";
    //
    //     var generate = function (d3){
    //         var ds = [];
    //         for (var size=76; size >= 46; size--) {
    //             for (var b = -110; b < 100; b += 1) {
    //                 for (var a = -100; a < 100; a += 1) {
    //                     var lab = d3.lab(size, a, b);
    //                     var rugub = lab.rgb();
    //
    //                     // valid color?
    //                     if ((0 < rugub.r) && (rugub.r < 256) && (0 < rugub.g) && (rugub.g < 256) && (0 < rugub.b) && (rugub.b < 256)) {
    //
    //                         // constraint
    //                         if (lab.l > 45 && lab.l < 75) {
    //                             ds.push({
    //                                 lab: lab, // the color
    //                                 n: 1000000 // (distance to the nearest chosen color) ** 2
    //                             });
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //
    //         return ds;
    //     };
    //
    //     if(typeof(Worker) !== "undefined") {
    //         var blobURL = URL.createObjectURL(new Blob([ '(', workerWrapper, ')()' ], {type: 'application/javascript' }));
    //         var worker = new Worker(blobURL);
    //
    //         worker.postMessage("start");
    //
    //         URL.revokeObjectURL( blobURL );
    //
    //         worker.onmessage = function (data) {
    //             this.ds = data;
    //             // worker.terminate();
    //
    //         }.bind(this);
    //
    //     } else {
    //         //this.ds = generate();
    //     }
    //
    //
    // };


    // Order colours by greatest distance from all other selected colors.
    ColorManager.prototype.sortcolors = function(times) {
        if(times>0){
            var d_new = this.select_distant_node();
            this.d_sorteds.push(d_new);
            this.sortcolors(--times);
        }
    };

    // find the node that is furthest away from all the currently selected (sorted) nodes.
    ColorManager.prototype.select_distant_node = function() {
        var n, d, length, selected_node, index;

        // could optimize this by only updating colours within mindist of selected node
        // (would need an octree or something), and keeping a heap so we don't need to do
        // a full scan for the next colour each time.
        //
        // It's fast enough like this though.

        index = 0;
        selected_node = this.ds[index];
        // find the node with the highest "nearest" value (full scan)
        // -- in other words, the most distant one

        for (n=0,length=this.ds.length; n<length; n++){
            d = this.ds[n];
            if (d.n > selected_node.n) {
                selected_node = d;
                index = n;
            }
        }

        // remove it from candidates list
        this.ds.splice(index, 1);

        // each candidate node knows how far away the nearest selected node is.
        // if the newly-selected node is closer, we need to update this distance.
        for (n=0,length=this.ds.length; n<length; n++){

            d = this.ds[n];
            var diff1 = d.lab.a - selected_node.lab.a;
            var diff2 = d.lab.b - selected_node.lab.b;
            var diff3 = d.lab.l - selected_node.lab.l;

            var dist = (diff1*diff1 + diff2*diff2 + diff3*diff3);
            if (dist < d.n) {
                d.n = dist;
            }
        }

        return selected_node;
    };

    ColorManager.prototype.furthestLabelColor = function(color) {
        return ((color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722) < 128) ? "white" : "black";
    };

    return ColorManager;
});

