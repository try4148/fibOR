/*
 * @author 刀叉4148
 *----------------------------------
 * 从orderby关键字中分析orderby值
 */

'use strict';

let unique = function(arr) {
	let ret = new Array();
	let hash = new Object();

	for (let i = 0; i < arr.length; i++) {
		let item = arr[i]
		let key = typeof(item) + item
		if (hash[key] !== 1) {
			ret.push(item)
			hash[key] = 1
		}
	}

	return ret
}

let orderbyParser = {
	'parseOrderby':function(metadata, orderbyFields){
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let orderbyArray = unique(orderbyFields.split(','));
		let orderbyReturn = '';
		for(let o in orderbyArray){
			let oa = orderbyArray[o].split(' ');
			let oaf = oa[0].trim();
			if(oaf === ''){
				continue;
			}
			let fieldsType = metadata['content']['fields'][oaf]['type'];
			if(fieldsType === 'number' || fieldsType === 'string' || fieldsType === 'datetime'){
				orderbyReturn = orderbyReturn === '' ? orderbyArray[o] : orderbyReturn + ',' + orderbyArray[o];
			}
		}

		if(orderbyReturn === ''){
			objReturn['result'] = false;
			objReturn['reMsg'] = 'orderby为空';
		}

		objReturn['reMsg'] = orderbyReturn;
		return objReturn;
	}
}
module.exports = orderbyParser;