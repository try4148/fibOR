/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据值的类型进行验证
 */

'use strict';

let metadataValueTypeValidator = {
	'verifyMetadataValueType': function(dataType, dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		let verifyValueType = this['verifyValueType' + dataType.substr(0, 1).toUpperCase() + dataType.substr(1).toLowerCase()](dataValue);
		if (!verifyValueType['result']) {
			return verifyValueType;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'getValueTypes': function(dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		if(dataValue === 'null'){
			objReturn['result'] = true;
			objReturn['reMsg'] = 'null';
			return objReturn;
		}

		let PossibleNumber, PossibleString, PossibleDatetime, PossibleBinary;
		PossibleNumber = this['verifyValueTypeNumber'](dataValue);
		PossibleString = this['verifyValueTypeString'](dataValue);
		PossibleDatetime = this['verifyValueTypeDatetime'](dataValue);
		PossibleBinary = this['verifyValueTypeBinary'](dataValue);


		if (PossibleNumber['result'] || PossibleString['result'] || PossibleDatetime['result'] || PossibleBinary['result']) {
			objReturn['result'] = true;
			if (PossibleNumber['result']) {
				objReturn['reMsg'] = 'number';
				return objReturn;
			}
			if (PossibleString['result']) {
				objReturn['reMsg'] = 'string';
				return objReturn;
			}
			if (PossibleDatetime['result']) {
				objReturn['reMsg'] = 'datetime';
				return objReturn;
			}
			if (PossibleBinary['result']) {
				objReturn['reMsg'] = 'binary';
				return objReturn;
			}
		} else {
			objReturn['reMsg'] = 'undefined';
			return objReturn;
		}
	},
	'verifyValueTypeNumber': function(dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (typeof(dataValue) !== 'string' && typeof(dataValue) !== 'number') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是number';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (typeof(dataValue) === 'string' && isNaN(dataValue)) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是number';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyValueTypeString': function(dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (typeof(dataValue) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是string';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (dataValue.charAt(0) !== "'" || dataValue.charAt(dataValue.length - 1) !== "'") {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是string';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyValueTypeDatetime': function(dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (typeof(dataValue) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是datetime';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (dataValue.toLowerCase().indexOf('datetime') !== 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是datetime';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		dataValue = dataValue.substr(8);
		let dataLength = dataValue.length;
		if (dataValue.charAt(0) !== "'" || dataValue.charAt(dataLength - 1) !== "'") {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是datetime';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		dataValue = dataValue.substr(1, dataLength - 2);
		dataValue = (new Date(dataValue)).toJSON();
		if (dataValue === null) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是datetime';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	},
	'verifyValueTypeBinary': function(dataValue) {
		let objReturn = new Object();
		objReturn['result'] = false;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		if (typeof(dataValue) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是binary1';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		if (dataValue.toLowerCase().indexOf('binary') !== 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是binary3';
			objReturn['reCode'] = 0;
			return objReturn;
		}

		dataValue = dataValue.substr(6);

		let dataLength = dataValue.length;
		if (dataValue.charAt(0) !== "'" || dataValue.charAt(dataLength - 1) !== "'") {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是binary4';
			objReturn['reCode'] = 0;
			return objReturn;
		}
		let dataFormat = '';
		dataValue = dataValue.substr(1, dataLength - 2);
		dataLength = dataValue.length;
		if (dataLength % 4 !== 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是binary5';
			objReturn['reCode'] = 0;
			return objReturn;
		}

		let Regx = /^[A-Fa-f0-9]*$/;
		if (Regx.test(dataValue)) {
			dataFormat = 'hex,base64';
		} else {
			let dataValue1 = dataValue.substr(dataLength - 3);
			let i = dataValue1.indexOf('=');

			if (i >= 0) {
				for (let j = i + 1; j < 3; j++) {
					if (dataValue1.charAt(j) !== '=') {
						objReturn['result'] = false;
						objReturn['reMsg'] = '值类型不是binary6';
						objReturn['reCode'] = 0;
						return objReturn;
					}
				}
			}

			let dataValue2 = dataValue.substr(0, dataLength - 3) + dataValue1.substr(0, i);

			let Regx = /^[A-Za-z0-9\+\/]*$/;
			if (Regx.test(dataValue2)) {
				dataFormat = 'base64';
			} else {
				objReturn['result'] = false;
				objReturn['reMsg'] = '值类型不是binary7';
				objReturn['reCode'] = 0;
				return objReturn;
			}
		}

		if (dataFormat === '') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '值类型不是binary8';
			objReturn['reCode'] = 0;
			return objReturn;
		}

		objReturn['result'] = true;
		objReturn['reMsg'] = dataFormat;
		objReturn['reCode'] = 0;
		return objReturn;
	}
}

module.exports = metadataValueTypeValidator;