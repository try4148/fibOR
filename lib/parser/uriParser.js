/*
 * @author 刀叉4148
 *----------------------------------
 * 从uri中提取odata各关键词和值
 */

'use strict';

let encoding = require('encoding');

let uriParser = {
	'parseUri': function(objHttp) {
		let objUri = new Object();
		objUri['$filter'] = '';
		objUri['$orderby'] = '';
		objUri['$skip'] = '';
		objUri['$top'] = '';
		objUri['$select'] = '';
		objUri['$count'] = '';
		objUri['$metadata'] = '';
		for (let q in objHttp.query) {
			if (objUri.hasOwnProperty(q.toLowerCase())) {
				objUri[q.toLowerCase()] = encoding.decodeURI(objHttp.query[q]).trim();
			}
		}
		return objUri;
	}
}

module.exports = uriParser;