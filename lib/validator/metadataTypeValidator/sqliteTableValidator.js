/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据type为sqliteTable的content部分进行验证
 */

'use strict';

let metadataValueTypeValidator = require('.././metadataValueTypeValidator.js');

let objLen = function(o) {
	let a = Object.keys(o);
	return a.length;
}

let preTreatKeywords = function(s, k) {
	let dyd = 0;
	let khd = 0;
	let lid = 0;

	let t = new Object();
	t['l' + lid++] = k.trim();
	let slen = s.length;
	let klen = k.length;
	for (let i = 0; i < slen; i++) {
		if (s.charAt(i) === "'") {
			if (dyd === 0) {
				dyd = 1;
			} else {
				dyd = 0;
			}

		}
		if (s.charAt(i) === '(' && dyd === 0) {
			khd++;
		}
		if (s.charAt(i) === ')' && dyd === 0) {
			khd--;
		}
		if (khd < 0) {
			let objEmpty = new Object();
			t = objEmpty;
			return t;
		}
		if (dyd === 0 && khd === 0 && s.substr(i, klen).toLowerCase() === k) {

			if (i + klen <= slen) {
				t['l' + lid++] = s.substr(0, i);
				s = s.substr(i + klen);
				i = -1;
				continue;
			}
		}
	}

	if (slen > 0) {
		t['l' + lid++] = s.substr(0);
	}

	return t;
}

let sqliteTableValidator = {
	'verify': function(metadata, metadataPool) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (!metadata['content'].hasOwnProperty('fields')) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中无fields项';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (typeof(metadata['content']['fields']) !== 'object') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中fields项格式不正确';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (objLen(metadata['content']['fields']) === 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中fields项为空';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (!metadata.hasOwnProperty('config')) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中无config项';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (typeof(metadata['config']) !== 'object') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中config项格式不正确';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (!metadata['config'].hasOwnProperty('resource')) {
			objReturn['result'] = false;
			objReturn['reMsg'] = 'config项中未找到resource项';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (typeof(metadata['config']['resource']) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据resource项格式不正确';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (metadata['config']['resource'].indexOf(':') < 1) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据resource项格式不正确';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (metadata['config']['resource'].substr(0,metadata['config']['resource'].indexOf(':')) !== 'sqlite') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据resource项不是正确的sqlite连接串';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (!metadataPool.createPool(metadata['config']['resource'])) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '未找到元数据对应资源';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (metadataPool.getType(metadata['config']['resource']) !== 'sqlite') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据对应资源类型错误';
			objReturn['reCode'] = 0;
			return objReturn;
		}

		let tableName = metadata.name;
		if (metadata['config'].hasOwnProperty('mapping')) {
			if (metadata['config']['mapping'].hasOwnProperty('table')) {
				tableName = metadata['config']['mapping']['table']
			}
		}
		//console.warn(metadataPool.getPool(metadata['config']['resource']));
		if (metadataPool.getPool(metadata['config']['resource']) === null) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '资源连接池创建失败';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		let verifySql = "select count(*) tabcnt from sqlite_master where type in ('table','view') and name='" + tableName + "'";
		try {
			let verifySqlResult = metadataPool.getPool(metadata['config']['resource']).execute(verifySql);
			if (verifySqlResult[0].tabcnt !== 1) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '表不存在';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		} catch (e) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '无法获取sqliteTable资源';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		for (let fields in metadata['content']['fields']) {
			let fieldsType, fieldsPattern;
			if (typeof(metadata['content']['fields'][fields]) === 'string') {
				fieldsType = metadata['content']['fields'][fields];
				fieldsPattern = '';
			}
			if (typeof(metadata['content']['fields'][fields]) === 'object') {
				if (!metadata['content']['fields'][fields].hasOwnProperty('type')) {
					objReturn['result'] = false;
					objReturn['reMsg'] = '字段类型未知';
					objReturn['reCode'] = 0;
					return objReturn;
				}
				if (!metadata['content']['fields'][fields].hasOwnProperty('pattern')) {
					fieldsPattern = '';
				} else {
					fieldsPattern = metadata['content']['fields'][fields]['pattern'];
				}
				fieldsType = metadata['content']['fields'][fields]['type'];
			}
			if (fieldsType.length === 0) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '字段类型为空';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			if (!metadataValueTypeValidator.hasOwnProperty('verifyValueType' + fieldsType.substr(0, 1).toUpperCase() + fieldsType.substr(1))) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '字段类型不支持';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			let validator = this.verifyPattern(fieldsType, fieldsPattern);
			if (!validator.result) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '字段类型模式错误';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			let tableFields = fields;
			if (metadata['config'].hasOwnProperty('mapping')) {
				if (metadata['config']['mapping'].hasOwnProperty('fields')) {
					if (metadata['config']['mapping']['fields'].hasOwnProperty(fields)) {
						tableFields = metadata['config']['mapping']['fields'][fields];
					}
				}
			}
			try {
				validator = this.verifyFieldsIsExists(metadataPool.getPool(metadata['config']['resource']), tableName, tableFields);
				if (!validator.result) {
					return validator;
				}
			} catch (e) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '无法获取sqliteTable资源';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		}
		if (metadata['content'].hasOwnProperty('index')) {
			if (typeof(metadata['content']['index']) !== 'object') {
				objReturn['result'] = false;
				objReturn['reMsg'] = '元数据index项格式不正确';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			if (objLen(metadata['content']['index']) === 0) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '元数据index项未空';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			if (!metadata['content']['index'].hasOwnProperty('fields')) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '元数据index项缺少fields';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			if (typeof(metadata['content']['index']['fields']) !== 'string') {
				objReturn['result'] = false;
				objReturn['reMsg'] = '元数据index的fields项格式不正确';
				objReturn['reCode'] = 0;
				return objReturn;
			}
			let fieldsArr = metadata['content']['index']['fields'].split(',');
			for (let fields in fieldsArr) {
				if (!metadata['content']['fields'].hasOwnProperty(fieldsArr[fields])) {
					objReturn['result'] = false;
					objReturn['reMsg'] = 'index项未在元数据的fields中定义';
					objReturn['reCode'] = 0;
					return objReturn;
				}
			}
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyPattern': function(fieldsType, fieldsPattern) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (typeof(fieldsPattern) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (fieldsPattern === '') {
			objReturn['result'] = true;
			objReturn['reMsg'] = '';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyFieldsIsExists': function(dbConn, tableName, fieldsName) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		let verifySql = "select " + fieldsName + " from " + tableName + " where 1 = 0";
		try {
			let verifySqlResult = dbConn.execute(verifySql);
		} catch (e) {
			objReturn['reMsg'] = tableName + '表中' + fieldsName + '字段不存在';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		return objReturn;
	},
	'verifyIndex': function(metadata, index) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let oli = objLen(index);
		if (metadata['content']['index']['must']) {
			if (oli === 0) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '必须要index参数';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		}

		if (oli !== 0) {
			let fieldsArray = metadata['content']['index']['fields'].split(',');
			if (fieldsArray.length !== oli) {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'index参数个数不正确';
				objReturn['reCode'] = 0;
				return objReturn;
			}

			for (let i in fieldsArray) {
				let dataName = fieldsArray[i].trim();
				let dataType = metadata['content']['fields'][dataName]['type'];
				//let dataFormat = metadata['content']['fields'][dataName]['pattern'];
				let dataValue = index['r' + i];
				let validator = metadataValueTypeValidator.verifyMetadataValueType(dataType, dataValue);
				if (!validator['result']) {
					validator['reMsg'] = 'index:' + dataName + validator['reMsg'];
					return validator;
				}
			}
		}

		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyUriParams': function(uri, verigyParams) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		verigyParams = verigyParams || '';
		let verigyArray = verigyParams.split(',');
		for (let v in verigyArray) {
			//console.log(uri['$'+verigyArray[v]].trim()uri['$'+verigyArray[v]].trim()sss);
			if (uri['$' + verigyArray[v]].trim() === '') {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'uri中关键参数$' + verigyArray[v] + '缺失';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyParamsFields': function(metadataTable, paramsFields, grantCheck) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		if (!metadataTable.hasOwnProperty(paramsFields)) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '元数据中未定义的' + paramsFields;
			objReturn['reCode'] = 0;
			return objReturn;
		}

		if (metadataTable[paramsFields].hasOwnProperty(grantCheck)) {
			if (metadataTable[paramsFields][grantCheck] === false) {
				objReturn['result'] = false;
				objReturn['reMsg'] = paramsFields + '无' + grantCheck + '权限';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		}

		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyAstTreeLeafType': function(o, t, keyWords) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		if (typeof(o) === 'object') {
			let k = o['l0'];
			if (keyWords['logic'].hasOwnProperty(k)) {
				let olo = objLen(o);
				for (let i = 1; i < olo; i++) {
					if (typeof(o['l' + i]) === 'object') {
						let v = this.verifyAstTreeLeafType(o['l' + i], t, keyWords);
						if (!v['result']) {
							return v;
						}
					} else {
						if (o['l' + i] !== 'true' || o['l' + i] !== 'false') {
							objReturn['result'] = false;
							objReturn['reMsg'] = '比较项不是bool类型';
							return objReturn;
						}
					}
				}
			}
			if (keyWords['comp'].hasOwnProperty(k)) {
				let type = '';
				let arrType = new Array();
				for (let i = 1; i < 3; i++) {
					if (typeof(o['l' + i]) === 'string') {
						if (t.hasOwnProperty(o['l' + i])) { //字段	

							let validator = this.verifyParamsFields(t, o['l' + i], 'condition');
							if (!validator['result']) {
								return validator;
							}
							type = t[o['l' + i]]['type'];
							arrType.push(type);
						} else { //值
							let validator = metadataValueTypeValidator.getValueTypes(o['l' + i]);
							if (!validator['result']) {
								validator['reMsg'] = '获取值类型错误';
								return validator;
							}
							let type = validator['reMsg'];
							arrType.push(type);
						}
					} else { //函数
						type = keyWords['func'][o['l' + i]['l0']]['returnType'];
						arrType.push(type);
					}
				}

				if (arrType[0] === arrType[1] || arrType[1] === 'null') {
					objReturn['result'] = true;
					return objReturn;
				} else {
					objReturn['result'] = false;
					objReturn['reMsg'] = 'comp两边类型验证错误';
					return objReturn;
				}
			}
			if (keyWords['func'].hasOwnProperty(k)) {
				let arrType = keyWords['func'][k]['paramsType'].split(',');
				for (let i = 0; i < arrType.length; i++) {
					if (t.hasOwnProperty(o['l' + (i + 1)])) { //字段

						let validator = this.verifyParamsFields(t, o['l' + (i + 1)], 'condition');

						if (!validator['result']) {
							return validator;
						}
						let type = 'fields';
						if (arrType[i] === type) {
							continue;
						} else {
							objReturn['result'] = false;
							objReturn['reMsg'] = 'func参数类型验证错误';
							return objReturn;
						}
					} else { //值
						let validator = metadataValueTypeValidator.getValueTypes(o['l' + (i + 1)]);
						if (!validator['result']) {
							validator['reMsg'] = '获取值类型错误';
							return validator;
						}
						let type = validator['reMsg'];
						if (arrType[i] === type) {
							continue;
						} else {
							objReturn['result'] = false;
							objReturn['reMsg'] = 'func参数类型验证错误';
							return objReturn;
						}
					}
				}
			}

		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	}
}

module.exports = sqliteTableValidator;