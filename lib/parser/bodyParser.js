/*
 * @author 刀叉4148
 *----------------------------------
 * 从body中分析值
 */

let json = require('json');

'use strict';

let bodyParser = {
	'parseBody': function(objHttp) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let bodyValue = objHttp.readAll().toString();
		let bodyJson;
		try {
			bodyJson = json.decode(bodyValue);
		} catch (e) {
			objReturn['result'] = false;
			objReturn['reMsg'] = 'body数据格式不是合法json';
			return objReturn;
		}

		objReturn['reMsg'] = bodyJson;
		return objReturn;
	}
}

module.exports = bodyParser;