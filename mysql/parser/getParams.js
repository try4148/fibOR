'use strict';

var mq = require('mq');
var http = require('http');
var formatUri = require('formatUri');

var routing = new mq.Routing({});

var test = function(r) {
    var id = r.params.length ===1 ? r.params[0] : '';
    var od = formatUri(r.queryString);
    console.notice(id);
    console.notice(od);
}

routing.append('^/test(\\((.*)\\))?$', test);

var svr = new http.Server(80, routing);
svr.run();