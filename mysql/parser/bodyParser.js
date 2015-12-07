'use strict';
//[{"name":"啊","age":"","id":"s"}]
var mq = require('mq');
var http = require('http');

var db = require('db');
var util = require('util');
var formatUri = require('formatUri');
var encoding = require('encoding');
var collection = require('collection');

var table = require('metadata.js');
var routing = new mq.Routing({});

var test = function(r) {
    var id = r.params.length ===1 ? r.params[0] : '';
    var od = formatUri(r.queryString);
    //console.notice(id);
    //console.notice(od);
    //console.log(bodyParser(r));
	if (r.method === 'POST' || r.method === 'PUT') {
		console.log(bodyParser(r.body.readAll(),r.method));
	}
}

routing.append('^/test(\\((.*)\\))?$', test);

var bodyParser = function(body,method){
	var rarr = new Array();
	//rarr.push(r.method);

	var json;
	try {
		json = encoding.jsonDecode(body);
	} catch (e) {}

	if (method === 'POST') {
		rarr = postJsonParser(json);
	}
	if (method === 'PUT') {
		rarr = putJsonParser(json);
	}
	
	return rarr;
}

var putJsonParser = function(json) {
	var rarr = new Array();
	var s = '';
	if (typeof(json) === 'object') {
		for(var f in json){
			if(typeof(f) === 'string'){
				var vbj = verifyBodyJson(f,json[f],table);
				if(vbj.result === true){
					if(s === ''){
						s = vbj.fields + ' = ' + vbj.value;
					}
					else{
						s = s + ',' + vbj.fields + ' = ' + vbj.value;
					}
				}
			}
		}
	}
	rarr.push(s);
	return rarr;
}

var postJsonParser = function(json){
	var rarr = new Array();
	if (typeof(json) === 'object') {
		json.forEach(function(j) {
			if (typeof(j) === 'object') {
				var s = '',t = '';
				for(var f in j){
					if(typeof(f) === 'string'){
						var vbj = verifyBodyJson(f,j[f],table);
						if(vbj.result === true){
							if(s === ''){
								s = '(' + vbj.fields;
							}
							else{
								s = s + ',' + vbj.fields;
							}
							if(t === ''){
								t = '(' + vbj.value;
							}
							else{
								t = t + ',' + vbj.value;
							}
						}
					}
				}
				if(s !== ''){
					s = s + ')';
				}
				if(t !== ''){
					t = t + ')';
				}
				rarr.push(s);
				rarr.push(t);
			}
		});
	}
	return rarr;
}

var verifyBodyJson = function(f,v,t){
	var m = new collection.Map();
	var f1 = '',err = '';
	if(util.has(t.fields,f)){
		if(util.isObject(t.fields[f])){
            if(util.has(t.fields[f],'type')){
                f1 = t.fields[f]['type'];
            }
        }
        else{
            f1 = t.fields[f];
        }
	}

	if (f1 === '') {
		err = 'the table has no such fields or the type of the fields is error';
	}
	if (f1 === 'string') {
		if (v.substr(0, 1) === "'" && v.substr(v.length - 1, 1) === "'") {
			v = v.substr(1, v.length - 2);
		}
		v = "'" + db.escape(v, true) + "'";
	}
	if (f1 === 'number') {
		if (isNaN(v)) {
			err = 'the data type of fields(' + f + ':number) is illegal';
		} 
		else {
			v = Number(v).toString();
		}
	}
	if (f1 === 'date') {
		v = v.length === 8 ? v.substr(0, 4) + '-' + v.substr(4, 2) + '-' + v.substr(6, 2) : v;
		v = v.replace(/[^0-9]/g, '-');
		var l = v.replace(/\-/g,'').length;
		v = (new Date(v)).toJSON();
		if (util.isNull(v)) {
			err = 'the data type of fields(' + f + ':date) is illegal';
		} 
		else {
			v = "'" + v.replace(/\-/g,'').substr(0,l) + "'";
		}
	}
	if (f1 === 'bin') {
		if (v.substr(0, 1) === "'" && v.substr(v.length - 1, 1) === "'") {
			v = v.substr(1, v.length - 2);
		}
		v = "'" + db.escape(v, true) + "'";
	}

	m.put('result',(err === '' ? true : false));
    m.put('errMsg',err);
    m.put('fields',f);
    m.put('value',v);

    //console.log(m);
	return m;
}

var svr = new http.Server(80, routing);
svr.run();