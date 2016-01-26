/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据type为mysqlTable进行格式化
 */

'use strict';

let moment = require('../../.././util/moment.js');
let metadataValueTypeFormatter = require('.././metadataValueTypeFormatter.js');
let metadataValueTypeValidator = require('../.././validator/metadataValueTypeValidator.js');

let objLen = function(o) {
	let a = Object.keys(o);
	return a.length;
}

let mysqlTableFormatter = {
	'format': function(metadata) {
		let table = metadata['content'];
		let t = new Object();
		let f = new Object();
		let i = new Object();
		let mapping = new Object();
		let mappingFields = new Object();
		if (metadata['config'].hasOwnProperty('mapping')) {
			if (metadata['config']['mapping'].hasOwnProperty('table')) {
				mapping['table'] = metadata['config']['mapping']['table'];
			} else {
				mapping['table'] = metadata['name'];
			}
		} else {
			mapping['table'] = metadata['name'];
		}
		if (table.hasOwnProperty('fields')) {
			if (typeof(table.fields) === 'object' && objLen(table.fields) > 0) {
				for (let ef in table.fields) {
					if (metadata['config'].hasOwnProperty('mapping')) {
						if (metadata['config']['mapping'].hasOwnProperty('fields')) {
							if (metadata['config']['mapping']['fields'].hasOwnProperty(ef)) {
								mappingFields[ef] = metadata['config']['mapping']['fields'][ef];
							} else {
								mappingFields[ef] = ef;
							}
						} else {
							mappingFields[ef] = ef;
						}
					} else {
						mappingFields[ef] = ef;
					}
					if (typeof(table.fields[ef]) === 'object' && objLen(table.fields[ef]) > 0) {
						if (table.fields[ef].hasOwnProperty('type')) {
							if (typeof(table.fields[ef]['type']) === 'string') {
								let type = table.fields[ef]['type'].trim().toLowerCase();
								if (type === 'number' || type === 'string' || type === 'datetime' || type === 'binary') {

									let pattern = '';
									if(type === 'binary'){
										pattern = 'base64';
									}
									let select = true;
									let update = true;
									let insert = true;
									let condition = true;
									if (table.fields[ef].hasOwnProperty('pattern')) {
										if (table.fields[ef]['pattern'] !== '') {
											pattern = table.fields[ef]['pattern'];
										}
									}
									if (table.fields[ef].hasOwnProperty('select')) {
										if (table.fields[ef]['select'] !== true) {
											select = false;
										}
									}
									if (table.fields[ef].hasOwnProperty('update')) {
										if (table.fields[ef]['update'] !== true) {
											update = false;
										}
									}
									if (table.fields[ef].hasOwnProperty('insert')) {
										if (table.fields[ef]['insert'] !== true) {
											insert = false;
										}
									}
									if (table.fields[ef].hasOwnProperty('condition')) {
										if (table.fields[ef]['condition'] !== true) {
											condition = false;
										}
									}
									let d = {};
									d.type = type;
									d.pattern = pattern;
									d.select = select;
									d.update = update;
									d.insert = insert;
									d.condition = condition;

									f[ef.toLowerCase()] = d;
								}
							}
						}
					}
					if (typeof(table.fields[ef]) === 'string') {
						let type = table.fields[ef].trim().toLowerCase();
						if (type === 'number' || type === 'string' || type === 'datetime' || type === 'binary') {

							let pattern = '';
							if (type === 'binary') {
								pattern = 'base64';
							}
							let select = true;
							let update = true;
							let insert = true;
							let condition = true;

							let d = {};
							d.type = type;
							d.pattern = pattern;
							d.select = select;
							d.update = update;
							d.insert = insert;
							d.condition = condition;


							f[ef.toLowerCase()] = d;
						}
					}
				}
			}
		}

		if (table.hasOwnProperty('index')) {
			if (typeof(table.index) === 'object' && objLen(table.index) > 0) {
				if (table.index.hasOwnProperty('fields')) {
					if (typeof(table.index.fields) === 'string') {
						let tif = '';
						let tifArr = table.index.fields.toLowerCase().split(',');
						for (let tid in tifArr) {
							let ttif = tifArr[tid];
							if (f.hasOwnProperty(ttif)) {
								if (f[ttif].type === 'string' || f[ttif].type === 'number' || f[ttif].type === 'datetime') {
									tif = tif === '' ? tif + ttif : tif + ',' + ttif;

								}
							}
						}
						i.fields = tif;
						let must = true;
						if (table.index.hasOwnProperty('must')) {
							if (table.index.must !== true) {
								must = false;
							}
						}
						i.must = must;
					}
				}
			}
		}

		t.fields = f;
		t.index = i;
		metadata['content'] = t;

		mapping['fields'] = mappingFields;
		metadata['config']['mapping'] = mapping;

		return metadata;
	},
	'formatSelect': function(arrSelect, fieldsMapping) {
		let retSelect = '';
		for (let a in arrSelect) {
			let tmpFileds = arrSelect[a];
			if (tmpFileds !== fieldsMapping[tmpFileds]) {
				tmpFileds = fieldsMapping[tmpFileds] + " as " + tmpFileds;
			}
			retSelect = retSelect === '' ? tmpFileds : retSelect + ',' + tmpFileds;
		}
		return retSelect;
	},
	'formatOrderby': function(strOrderby, fieldsMapping) {
		let arrOrderby = strOrderby.split(',');
		let retOrderby = '';
		for (let a in arrOrderby) {
			let arrTmpFileds = arrOrderby[a].split(' ');
			let tmpFileds = arrTmpFileds[0];
			if (tmpFileds !== fieldsMapping[tmpFileds]) {
				tmpFileds = fieldsMapping[tmpFileds];
			}
			retOrderby = retOrderby === '' ? tmpFileds + ' ' + arrTmpFileds[1] : retOrderby + ',' + tmpFileds + ' ' + arrTmpFileds[1];
		}
		return retOrderby;
	},
	'formatFunc': function(astObject, metadata, keyWords) {
		if (typeof(astObject) === 'object') {
			if (keyWords['func'].hasOwnProperty(astObject['l0'])) { //进行转换
				let temp = '';
				if (astObject['l0'] === 'contains') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'%" + tempValue.substr(1, tempValue.length - 2) + "%'";
					temp = tempFields + ' like ' + tempValue;
				}
				if (astObject['l0'] === 'not contains') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'%" + tempValue.substr(1, tempValue.length - 2) + "%'";
					temp = tempFields + ' not like ' + tempValue;
				}
				if (astObject['l0'] === 'startswith') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'" + tempValue.substr(1, tempValue.length - 2) + "%'";
					temp = tempFields + ' like ' + tempValue;
				}
				if (astObject['l0'] === 'not startswith') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'" + tempValue.substr(1, tempValue.length - 2) + "%'";
					temp = tempFields + ' not like ' + tempValue;
				}
				if (astObject['l0'] === 'endswith') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'%" + tempValue.substr(1, tempValue.length - 2) + "'";
					temp = tempFields + ' like ' + tempValue;
				}
				if (astObject['l0'] === 'not endswith') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					let tempValue = astObject['l2'];
					tempValue = "'%" + tempValue.substr(1, tempValue.length - 2) + "'";
					temp = tempFields + ' not like ' + tempValue;
				}
				if (astObject['l0'] === 'length') {
					let tempFields = metadata['config']['mapping']['fields'][astObject['l1']];
					temp = 'length(' + tempFields + ')';
				}
				astObject = temp;
			} else {
				let olo = objLen(astObject);
				for (let i = 1; i < olo; i++) {
					astObject['l' + i] = this.formatFunc(astObject['l' + i], metadata, keyWords);
				}
			}
		}
		return astObject;
	},
	'formatComp': function(astObject, metadata, keyWords) {
		if (typeof(astObject) === 'object') {
			if (keyWords['comp'].hasOwnProperty(astObject['l0'])) {
				let tempLeftFields, tempRightFields, tempComp;
				if (metadata['content']['fields'].hasOwnProperty(astObject['l1'])) {
					tempLeftFields = metadata['config']['mapping']['fields'][astObject['l1']];
				} else {
					tempLeftFields = astObject['l1'];
				}

				if (metadata['content']['fields'].hasOwnProperty(astObject['l2'])) {
					tempRightFields = metadata['config']['mapping']['fields'][astObject['l2']];
				} else {
					tempRightFields = astObject['l2'];
				}

				if (tempRightFields === 'null') {
					tempComp = astObject['l0'] === 'eq' ? 'is' : 'is not';
				} else {
					tempComp = keyWords['comp'][astObject['l0']];
				}

				astObject = tempLeftFields + ' ' + tempComp + ' ' + tempRightFields;
			} else {
				let olo = objLen(astObject);
				for (let i = 1; i < olo; i++) {
					astObject['l' + i] = this.formatComp(astObject['l' + i], metadata, keyWords);
				}
			}
		}
		return astObject;
	},
	'formatLogic': function(astObject, keyWords) {
		if (typeof(astObject) === 'object') {
			if (typeof(astObject['l1']) === 'object') {
				astObject['l1'] = this.formatLogic(astObject['l1'], keyWords);
			}
			if (typeof(astObject['l2']) === 'object') {
				astObject['l2'] = this.formatLogic(astObject['l2'], keyWords);
			}
			astObject = '(' + astObject['l1'] + ' ' + keyWords['logic'][astObject['l0']] + ' ' + astObject['l2'] + ')';
		}
		return astObject;
	},
	'formatAstTree': function(astObject, metadata, keyWords) {
		astObject = this.formatAstTreeLeafType(astObject, metadata, keyWords);
		astObject = this.formatFunc(astObject, metadata, keyWords);
		astObject = this.formatComp(astObject, metadata, keyWords);
		astObject = this.formatLogic(astObject, keyWords);
		return astObject;
	},
	'formatAstTreeLeafType': function(astObject, metadata, keyWords) {
		if (typeof(astObject) === 'object') {
			let k = astObject['l0'];
			if (keyWords['logic'].hasOwnProperty(k)) {
				let olo = objLen(astObject);
				for (let i = 1; i < olo; i++) {
					astObject['l' + i] = this.formatAstTreeLeafType(astObject['l' + i], metadata, keyWords);
				}
			}
			if (keyWords['comp'].hasOwnProperty(k)) {
				for (let i = 1; i < 3; i++) {
					if (typeof(astObject['l' + i]) === 'string') {
						if (metadata['content']['fields'].hasOwnProperty(astObject['l' + i])) { //字段	
							//astObject['l' + i] = metadata['config']['mapping']['fields'][astObject['l' + i]];
						} else { //值
							let type = '';
							let pattern = '';
							let j = i === 1 ? 2 : 1;
							if (typeof(astObject['l' + j]) === 'string') {
								if (metadata['content']['fields'].hasOwnProperty(astObject['l' + j])) { //字段
									pattern = metadata['content']['fields'][astObject['l' + j]]['pattern'];
									type = metadata['content']['fields'][astObject['l' + j]]['type'];
								} else {
									let validator = metadataValueTypeValidator.getValueTypes(astObject['l' + i]);
									type = validator['reMsg'];
								}
							} else {
								type = keyWords['func'][astObject['l' + j]['l0']]['returnType'];
							}
							astObject['l' + i] = astObject['l' + i] === 'null' ? 'null' : metadataValueTypeFormatter.formatValueType(astObject['l' + i], type, pattern, true);
						}
					} else { //函数
						astObject['l' + i] = this.formatAstTreeLeafType(astObject['l' + i], metadata, keyWords);
					}
				}
			}
			if (keyWords['func'].hasOwnProperty(k)) {
				let arrType = keyWords['func'][k]['paramsType'].split(',');
				for (let i = 0; i < arrType.length; i++) {
					if (metadata['content']['fields'].hasOwnProperty(astObject['l' + (i + 1)])) { //字段
						//
					} else { //值
						let type = arrType[i];
						let pattern = '';
						astObject['l' + (i + 1)] = astObject['l' + (i + 1)] === 'null' ? 'null' : metadataValueTypeFormatter.formatValueType(astObject['l' + (i + 1)], type, pattern, true);
					}
				}
			}
		}
		return astObject;
	},
	'formatIndex': function(metadata, index) {
		let retStr = '';

		let oli = objLen(index);
		if (oli === 0) {
			return retStr;
		}

		let fieldsArray = metadata['content']['index']['fields'].split(',');
		for (let i in fieldsArray) {
			let dataType = metadata['content']['fields'][fieldsArray[i].trim()]['type'];
			let dataPattern = metadata['content']['fields'][fieldsArray[i].trim()]['pattern'];
			let dataName = metadata['config']['mapping']['fields'][fieldsArray[i].trim()];
			let dataValue = metadataValueTypeFormatter.formatValueType(index['r' + i], dataType, dataPattern, true);
			retStr = retStr === '' ? dataName + ' = ' + dataValue : ' and ' + dataName + ' = ' + dataValue;
		}

		return retStr;
	},
	'formatValueTypeRsOut': function(dataValue, dataType, dataPattern) {
		if (dataType === 'number') {

			let arrDataPattern = dataPattern.split(',');
			for (let adp in arrDataPattern) {
				if (isNaN(arrDataPattern[adp])) {
					return dataValue;
				}
			}
			let pil, pfl;
			if (arrDataPattern.length === 2) {
				pil = parseInt(arrDataPattern[0]);
				pfl = parseInt(arrDataPattern[1]);
			} else {
				pil = parseInt(arrDataPattern[0]);
				pfl = 0;
			}

			let arrDataValue = String(dataValue).split('.');
			let vi, vf;
			if (arrDataValue.length === 2) {
				vi = arrDataValue[0].length > pil ? arrDataValue[0].substr(arrDataValue[0].length - pil) : arrDataValue[0];
				vf = arrDataValue[1].length > pfl ? arrDataValue[1].substr(0, pfl) : arrDataValue[1];
				dataValue = vi + '.' + vf;
			} else {
				dataValue = arrDataValue[0].length > pil ? arrDataValue[0].substr(arrDataValue[0].length - pil) : arrDataValue[0];
			}
			return Number(dataValue);
		}
		if (dataType === 'string') {
			if (dataPattern !== '' && !isNaN(dataPattern)) {
				let pl = parseInt(dataPattern);
				dataValue = dataValue.length > pl ? dataValue.substr(0, p1) : dataValue;
			}
			return dataValue;
		}
		if (dataType === 'datetime') {
			if (dataPattern === '') {
				return dataValue;
			}
			let m = moment(dataValue);
			return m.utcOffset(0).format(dataPattern);

		}
		if (dataType === 'binary') {
			if (dataPattern === 'hex') {
				let hex = require('hex');
				dataValue = hex.encode(dataValue);
			} else {
				let base64 = require('base64');
				dataValue = base64.encode(dataValue);
			}
			return dataValue;
		}
		if (dataType === 'null') {
			return null;
		} else {
			return dataValue;
		}
	},
	'formatValueTypeRsIn': function(dataValue, dataType, dataPattern) {
		if (dataType === 'number') {
			if (dataPattern === '') {
				return dataValue;
			}
			let arrDataPattern = dataPattern.split(',');
			for (let adp in arrDataPattern) {
				if (isNaN(arrDataPattern[adp])) {
					return dataValue;
				}
			}
			let pil, pfl;
			if (arrDataPattern.length === 2) {
				pil = parseInt(arrDataPattern[0]);
				pfl = parseInt(arrDataPattern[1]);
			} else {
				pil = parseInt(arrDataPattern[0]);
				pfl = 0;
			}

			let arrDataValue = dataValue.split('.');
			let vi, vf;
			if (arrDataValue.length === 2) {
				vi = arrDataValue[0].length > pil ? arrDataValue[0].substr(arrDataValue[0].length - pil) : arrDataValue[0];
				vf = arrDataValue[1].length > pfl ? arrDataValue[1].substr(0, pfl) : arrDataValue[1];
				dataValue = vi + '.' + vf;
			} else {
				dataValue = arrDataValue[0].length > pil ? arrDataValue[0].substr(arrDataValue[0].length - pil) : arrDataValue[0];
			}
			return dataValue;
		}
		if (dataType === 'string') {
			dataValue = dataValue.substr(1, dataValue.length - 2);

			if (dataPattern !== '' && !isNaN(dataPattern)) {
				let pl = parseInt(dataPattern);
				dataValue = dataValue.length > pl ? dataValue.substr(0, p1) : dataValue;
			}

			let db = require('db');
			dataValue = db.escape(dataValue, true);
			return "'" + dataValue + "'";
		}
		if (dataType === 'datetime') {
			dataValue = dataValue.substr(8);
			dataValue = dataValue.substr(1, dataValue.length - 2);
			if (dataPattern === '') {
				return dataValue;
			}

			dataValue = dataValue.replace(/\//g, "-")
			let arrDataValue = dataValue.split("-");
			let tmp = '';
			for (let a in arrDataValue) {
				tmp = tmp === '' ? (arrDataValue[a].length < 2 ? '0' + arrDataValue[a] : arrDataValue[a]) : tmp + '-' + (arrDataValue[a].length < 2 ? '0' + arrDataValue[a] : arrDataValue[a]);
			}
			dataValue = (new Date(tmp)).toJSON();
			let zoneOffset = ((new Date(tmp)).getTimezoneOffset()) * 60000;
			let m = moment(dataValue).utcOffset(0).valueOf() + zoneOffset;
			m = m.toString();
			return 'from_unixtime(' + m.substr(0, m.length - 3) + ')';

		}
		if (dataType === 'binary') {
			dataValue = dataValue.substr(6);
			dataValue = dataValue.substr(1, dataValue.length - 2);

			if (dataPattern !== 'hex') {
				let hex = require('hex');
				let base64 = require('base64');
				dataValue = hex.encode(base64.decode(dataValue));
			}
			return "hex('" + dataValue + "')";
		}
		if (dataType === 'null') {
			return 'null';
		}
		if (dataType === 'undefined') {
			return dataValue;
		}
	}
}

module.exports = mysqlTableFormatter;