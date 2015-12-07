'use strict';

var table = require('metadata.js');
var select = 'id,name,password';
var util = require('util');

var verifySelectFields = function(f,t){
	var f1='';
	if(util.has(t.fields,f)){
		if(util.isObject(t.fields[f])){
            if(util.has(t.fields[f],'select')){
                f1 = t.fields[f]['select'] === true ? f : '';
            }
            else{
                f1 = f;
            }
        }
        else{
            f1 = f;
        }
	}
	return f1;
}

var selectParser = function(s,t){
	var sarr = s.split(',');
	var s1 = '';
	sarr.forEach(function(f){
		f = f.trim();
		var vf = verifySelectFields(f,t);
		if(vf !== ''){
			if(s1 === ''){
				s1 = s1 + vf;
			}
			else{
				s1 = s1 + ',' +vf
			}
		}
	});
	return s1;
}

console.log(selectParser(select,table));