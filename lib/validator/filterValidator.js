/*
 * @author 刀叉4148
 *----------------------------------
 * 对filter进行验证
 */

'use strict';

//let metadataValueTypeValidator = require('./metadataValueTypeValidator.js');
//let mysqlTableValidator = require('./metadataTypeValidator/mysqlTableValidator.js');

let objLen = function(o) {
	let a = Object.keys(o);
	return a.length;
}

let verifyAstTreeLeafIsEmpty = function(o) {
	let objReturn = new Object();
	objReturn['result'] = false;
	objReturn['reMsg'] = '';
	objReturn['reCode'] = 0;
	if (typeof(o) !== 'string' && typeof(o) !== 'object') {
		objReturn['reMsg'] = 'AST树节点类型不正确';
		return objReturn;
	}
	if (typeof(o) === 'string') {
		if (o === '') {
			objReturn['reMsg'] = 'AST树节点string为空';
			return objReturn;
		} else {
			objReturn['result'] = true;
			return objReturn;
		}
	}
	if (typeof(o) === 'object') {
		let olo = objLen(o);
		if (olo === 0) {
			objReturn['reMsg'] = 'AST树节点object为空';
			return objReturn;
		}
		for (let i = 1; i < olo; i++) {
			let v = verifyAstTreeLeafIsEmpty(o['l' + i]);
			if (!v['result']) {
				return v;
			}
		}
	}
	objReturn['result'] = true;
	objReturn['reMsg'] = '';
	objReturn['reCode'] = 0;
	return objReturn;
}

let filterValidator = {
	'verifyAstTree': function(o) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '解析filter时发生错误:';
		objReturn['reCode'] = 0;
		if (typeof(o) !== 'object') {
			objReturn['reMsg'] = objReturn['reMsg'] + '未能生成AST树';
			return objReturn;
		}
		let validator = verifyAstTreeLeafIsEmpty(o);
		if (!validator['result']) {
			objReturn['reMsg'] = objReturn['reMsg'] + validator['reMsg'];
			return objReturn;
		}
		
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		return objReturn
	}
}

module.exports = filterValidator;