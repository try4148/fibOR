/*
 * @author 刀叉4148
 *----------------------------------
 * 根据传入的参数验证http连接的有效性
 */

'use strict';

let httpConnectionValidator = {
	'verifyAllowMax': function(httpObj, metadata, validatorPrm) { //连接数验证
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'verifyAllowIP': function(httpObj, metadata, validatorPrm) { //连接ip验证
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'verifyHttpMethod': function(httpObj, metadata, validatorPrm) { //连接请求方法验证
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (!metadata['action'].hasOwnProperty(httpObj.method)) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '资源不支持' + httpObj.method;
			objReturn['reCode'] = 501;
			return objReturn;
		}
		if (!metadata['action'][httpObj.method]) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '资源不允许' + httpObj.method;
			objReturn['reCode'] = 405;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'verifyAllowAuthority': function(httpObj, metadata, validatorPrm) { //连接授权验证
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'verifyHttpHead': function(httpObj, metadata, validatorPrm) { //连接头验证
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'verifyAll': function(httpObj, metadata, validatorPrm) { //验证所有
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		for (let verfy in this) {
			if (verfy !== 'verifyAll') {
				let crt = this[verfy](httpObj, metadata, validatorPrm);
				if (!crt.result) {
					return crt;
				}
			}
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 200;
		return objReturn;
	}
}

module.exports = httpConnectionValidator;