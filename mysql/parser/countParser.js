'use strict';

var table = require('metadata.js');
var count = 'id';
var util = require('util');

var verifyCountFields = function(f,t){
	var r = '';
	if(f === 'true'){
		r = 'count(1)';
	}
	else{
		var f1 = '';
		if(util.has(t.fields,f)){
			if(util.isObject(t.fields[f])){
	            if(util.has(t.fields[f],'type')){
	                f1 = t.fields[f]['type'];
	            }
	            else{
	                f1 = 'null';
	            }
	        }
	        else{
	            f1 = t.fields[f];
	        }
		}
		if(f1 === 'number' || f1 === 'string' || f1 === 'date'){
			r = 'count(' + f + ')';
		}
	}
	return r;
}

var countParser = function(c,t){
	return verifyCountFields(c.trim(),t);;
}

console.log(countParser(count,table));