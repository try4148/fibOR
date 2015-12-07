'use strict';

var collection = require('collection');

var uri = "$top=2&$filter=id lt 10&$orderby=id desc&$skip=10&$select=id,name&$count=true";

var uriParser = function(uri){
	var m = new collection.Map();
	m.put('filter','');
	m.put('orderby','');
	m.put('skip','');
	m.put('top','');
	m.put('select','');
	m.put('count','');
	m.put('metadata','');
	var sp1 = uri.split('&');
	sp1.forEach(function(s){
		s = s.trim();
		var i = s.indexOf('$') + 1;
		var j = s.indexOf('=') - i;
		var t = s.substr(j+2).trim();
		s = s.substr(i,j).trim();
		if(m.has(s)){
			if(m[s] === ''){
				m.remove(s);
				m.put(s,t)
			}
		}
	})
	return m;
}

console.log(uriParser(uri));