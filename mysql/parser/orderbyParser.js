'use strict';

var table = require('metadata.js');
var orderby = 'id desc,name,password';
var util = require('util');

var verifyOrderbyFields = function(f1,f2,t){
	var f = '',r = '';
	if(util.has(t.fields,f1)){
		if(util.isObject(t.fields[f1])){
            if(util.has(t.fields[f1],'type')){
                f = t.fields[f1]['type'];
            }
            else{
                f = 'null';
            }
        }
        else{
            f = t.fields[f1];
        }
	}

	if(f === 'number' || f === 'string' || f === 'date'){
		r = f1 + ' ' + (f2 === '' ? 'asc' : 'desc');
	}
	return r;
}

var orderbyParser = function(o,t){
	var oarr = o.split(',');
	var o1 = '';
	oarr.forEach(function(f){
		var farr = f.trim().split(' ');
		var f1 = farr[0].trim();
		var f2 = farr.length === 2
			   ? farr[1].trim()
			   : '';

		var vf = verifyOrderbyFields(f1,f2,t);
		if(vf !== ''){
			if(o1 === ''){
				o1 = o1 + vf;
			}
			else{
				o1 = o1 + ',' +vf
			}
		}
	});
	return o1;
}

console.log(orderbyParser(orderby,table));