'use strict';

var http = require('http');
var mq = require('mq');
var fs = require('fs');

var routing = new mq.Routing({});
var routers = fs.readdir('./routers');
var regex = /^([^\.]+)\.js$/;

routing.append('^((/)?.*)' ,function(r) {r.response.write('no such routers');});

routers.forEach(function AddRoute(f) {
    if(f.isDirectory()) return;
    var matchs = regex.exec(f.name);
    if(!matchs) return;
	var rest = require('./routers/' + matchs[1]);
    //console.log(matchs[1]);
    routing.append('^/' + matchs[1] + '/?(.*)' ,function(r) {rest(r)});

});

var svr = new http.Server(80,routing);
svr.run();
