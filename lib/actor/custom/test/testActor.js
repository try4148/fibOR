/*
 * @author 刀叉4148
 *----------------------------------
 * http路由路径test/test的处理程序
 */

'use strict';

let defaultActor = require('../.././default/mysqlTableActor.js');

let mysqlTableActor = {
	'GET': function(r) {
		return r.response.write(r.method);
	},
	'PUT': function(r) {
		return r.response.write(r.method);
	},
	'POST': function(r) {
		return r.response.write(r.method);
	},
	'OPTIONS': function(r,m,c) {
		return defaultActor['OPTIONS'](r,m,c);
	}
}

module.exports = mysqlTableActor;