/*
 * @author 刀叉4148
 *----------------------------------
 * http路由路径test/test的处理程序
 */

'use strict';

let objLen = function(o) {
    let a = Object.keys(o);
    return a.length;
}

let defaultActor = require('../.././default/sqliteTableActor.js');

let customActor = {
	'GET': function(r,m,d,c) {
		let customReturn = defaultActor['GET'](r,m,d,c);
		if(!customReturn.hasOwnProperty('header') && customReturn['result']){
			let newMsg = new Object();
			let json = require('json');
			let oldMsg = json.decode(customReturn['reMsg']);
			newMsg['rows'] = oldMsg['result'];
			let total;
			if(oldMsg.hasOwnProperty('count')){
				for(let o in oldMsg['count']){
					total = oldMsg['count'][o];
					break;
				}
			}
			else{
				total = objLen(newMsg['rows']);
			}
			newMsg['total'] = total;
			customReturn['reMsg'] = JSON.stringify(newMsg);
		}
		return customReturn;
	},
	'PUT': function(r,m,d,c) {
		return defaultActor['PUT'](r,m,d,c);
	},
	'POST': function(r,m,d,c) {
		return defaultActor['POST'](r,m,d,c);
	},
	'DELETE': function(r,m,d,c) {
		return defaultActor['DELETE'](r,m,d,c);
	},
	'OPTIONS': function(r,m,d,c) {
		return defaultActor['OPTIONS'](r,m,d,c);
	}
}

module.exports = customActor;