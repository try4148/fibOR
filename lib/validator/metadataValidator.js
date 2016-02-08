/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据格式进行验证，至少应包含type和content
 */

'use strict';

let getObjLen = function(o) {
	let l = Object.keys(o);
	return l.length;
}

let objReturn = new Object();
objReturn['result'] = false;
objReturn['reMsg'] = '';
objReturn['reCode'] = 0;

let metadataValidator = {
	'verifyMetadata': function(metadata) {
		if (!metadata.hasOwnProperty('type')) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据格式缺少type';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if(typeof(metadata['type']) !== 'string'){
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据type类型不是正确格式';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (metadata['type'] === '') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据type类型为空';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (!metadata.hasOwnProperty('content')) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据格式缺少content';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if(typeof(metadata['content']) !== 'object'){
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据object类型不是正确格式';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (getObjLen(metadata['content']) === 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据content类型为空';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyVersion': function(){
		let util = require("util");
		let requireVersion = '0.2.0';
		let currentVersion = util.buildInfo()['fibjs'];
		if (currentVersion < requireVersion) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '需要运行在fibjs ' + requireVersion + ' 或以上版本';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	}
}

module.exports = metadataValidator;