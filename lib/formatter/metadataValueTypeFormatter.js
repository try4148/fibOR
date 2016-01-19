/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据值的按类型进行格式化
 */

'use strict';

let metadataValueTypeFormatter = {
	'formatValueType': function(dataValue, dataType, dataPattern, isMysql) {
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
			if (isMysql === true) {
				dataValue = db.escape(dataValue, true);
			} else {
				dataValue = db.escape(dataValue);
			}
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

			let moment = require('../.././util/moment.js');
			let m = moment(dataValue);
			return "'" + m.utcOffset(0).format(dataPattern) + "'";

		}
		if (dataType === 'binary') {
			let i = dataValue.indexOf("'");
			let dataFormat = dataValue.substr(0, i).toLowerCase();
			dataValue = dataValue.substr(i);
			dataValue = dataValue.substr(1, dataValue.length - 2);

			if (dataFormat === 'hex') {
				let hex = require('hex');
				let base64 = require('base64');
				dataValue = base64.encode(hex.decode(dataValue));
			}
			return "'" + dataValue + "'";
		}
		if (dataType === 'null') {
			return 'null';
		}
		if (dataType === 'undefined') {
			return dataValue;
		}
	}
}
module.exports = metadataValueTypeFormatter;