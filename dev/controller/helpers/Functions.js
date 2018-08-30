define([
], function(){

  /*courtesy of https://gist.github.com/andrei-m/982927 */
  const levenshtein = (a, b) => {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length
    var tmp, i, j, prev, val;
    // swap to save some memory O(min(a,b)) instead of O(a)
    if (a.length > b.length) {
      tmp = a
      a = b
      b = tmp
    }

    row = Array(a.length + 1)
    // init the row
    for (i = 0; i <= a.length; i++) {
      row[i] = i
    }

    // fill in the rest
    for (i = 1; i <= b.length; i++) {
      prev = i
      for (j = 1; j <= a.length; j++) {
        if (b[i-1] === a[j-1]) {
          val = row[j-1] // match
        } 
        else {
          val = Math.min(row[j-1] + 1, // substitution
          Math.min(prev + 1,     // insertion
          row[j] + 1))  // deletion
        }
        row[j - 1] = prev
        prev = val
      }
      row[a.length] = prev
    }
    return row[a.length]
  };

  /*********************************************** ARRAY METHODS ********************************************/
  //swap two position of an array 
  const swap = (i,j,a) => {
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
    return a;
  };

  //sum all values in the array
  const cumulate = (a) => {
      return a.reduce((pv, cv) => pv+cv, 0);
  };

  //find the average value of the array, if cumulate is given skip the process to make it
  const average = (a,cum_a) => {
    if(a && a != []){
      let cum;
      if(!cum_a)
        cum = cumulate(a);
      else
        cum = cum_a;
      let n = a.length;
      return cum/n;
    }
  };

  //find the variance of the array, if the average is given skip the process to make it
  const variance = (a,avg_a) => {
    if(Array.isArray(a)){
      let avg;
      if(!avg_a)
        avg = average(a);
      else
        avg = avg_a;
      let v = a.map((num) => Math.pow(num - avg, 2));
      return average(v);
    }
  };


  //find the std deviation of the array, if the variance is given skip the process to make it
  const std_dev = (a, varx_a) => {
    if(Array.isArray(a)) {
      let varx;
      if(!varx_a)
        varx = variance(a);
      else
        varx = varx_a;
      return Math.sqrt(varx);
    }
  };

  //find the max in the array
  const max = function(arr){
    return Math.max.apply(null, arr);
  };

  //find the min in the array
  const min = (a) => {
      return Math.min.apply(null, a);
  };

  //find the position of every occourrence in the array of C
  const occurrences_positions = (a,c) => {
    if(Array.isArray(a)){
      var pos = []
      a.forEach(function(v,i,array){if(v == c) pos.push(i)});
      return pos;
    }
  };

  //randomically sort an array
  const random_sort = (a,b) => {
    if(Array.isArray(a))
      return a.slice(0,b).sort(function() { return 0.5 - Math.random();});
  };

  //check if 2 array are equal with json stringification
  const equal = (a,b) => {
    return JSON.stringify(a) == JSON.stringify(b);
  };

  //check if a multidimensional array contains an array v1
  const contains = (a,v1) => {
    return a.map(function(v2,i,arr){return equal(v1,v2);}).reduce(function(va,vb){return va||vb;});
  };

  //count the differences between 2 arrays, position matters
  const differences_count = (a,b) => {
    var l = Math.min(a.length,b.length);
    var diff = 0;
    for(var i = 0; i<l; i++)
      if(a[i] !== b[i])
        diff++;
    diff+=(a.length+b.length)-(l*2);
    return diff;
  };

  //return an array with only the elements sorted by occourrences
  const sort_by_occurrences = (a) => {
      //find the counts using reduce
      var cnts = a.reduce( function (obj, val) {
          obj[val] = (obj[val] || 0) + 1;
          return obj;
      }, {} );
      //Use the keys of the object to get all the values of the array
      //and sort those keys by their counts
      var sorted = Object.keys(cnts).sort( function(a,b) {
          return cnts[b] - cnts[a];
      });
      return sorted;
  };
   
  //return a compressed array with no repetition from consecutives, may repetitions appear in the whole array
  const no_consecutive_repetition = (a) => {
    return a.filter(function(item, pos, arr){
      // Always keep the 0th element as there is nothing before it
      // Then check if each element is different than the one before it
      return pos === 0 || item !== arr[pos-1];
    });
  };

  //return the unique set of elements
  const unique_set = (a) => {
    return Array.from(new Set(a));
  };

  /********************* OBJECT METHODS ***************************/
  const sorted_by_field_key_length = (a,type) => {
    var sortable = [];
    for (var e in a) {
        sortable.push([e, Object.keys(a[e]).length]);
    }
    if(type == "ASC")
      sortable.sort(function(a, b) {
          return a[1] - b[1];
      });
    else 
    if(type = "DSC"){
      sortable.sort(function(a, b) {
        return b[1] - a[1];
      });
    }
    return sortable;
  };

  const sorted_by_field_max = (a,type) => {
    var sortable = [];
    for (var e in a) {
        sortable.push([e, max(Object.values(a[e]))]);
    }
    if(type == "ASC")
      sortable.sort(function(a, b) {
          return a[1] - b[1];
      });
    else 
    if(type = "DSC"){
      sortable.sort(function(a, b) {
        return b[1] - a[1];
      });
    }
    return sortable;
  };

  const sorted_by_field = (a,type) => {
    var sortable = [];
    for (var e in a) {
        sortable.push([e, a[e]]);
    }
    if(type == "ASC")
      sortable.sort(function(a, b) {
          return a[1] - b[1];
      });
    else 
    if(type = "DSC"){
      sortable.sort(function(a, b) {
        return b[1] - a[1];
      });
    }
    return sortable;
  };

  /********************* OTHERS ***************************/
  //return the factorial of x = x!
  const fact = (x) => {
    if(x == 0) {
      return 1;
    }
    if(x < 0 ) {
      return undefined;
    }
    for(var i = x; --i; ) {
      x *= i;
    }
    return x;
  };

  return {
    levenshtein: levenshtein,
    swap: swap,
    cumulate: cumulate,
    average: average,
    variance: variance,
    std_dev: std_dev,
    max: max,
    min: min,
    occurrences_positions: occurrences_positions,
    random_sort: random_sort,
    equal: equal,
    contains: contains,
    differences_count: differences_count,
    sort_by_occurrences: sort_by_occurrences,
    no_consecutive_repetition: no_consecutive_repetition,
    unique_set: unique_set,
    sorted_by_field_key_length: sorted_by_field_key_length,
    sorted_by_field_max: sorted_by_field_max,
    sorted_by_field: sorted_by_field,
    fact: fact
  };
});