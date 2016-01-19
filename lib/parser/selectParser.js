/*
 * @author 刀叉4148
 *----------------------------------
 * 从select关键字中分析select值
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

let selectParser = {
	'parseSelect': function(arrSelect) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		if(arrSelect.length === 0){
			objReturn['result'] = false;
			objReturn['reMsg'] = 'select项为空';
			return objReturn;
		}

		let selectArray = unique(arrSelect);

		objReturn['reMsg'] = selectArray;
		return objReturn;
	}
}

module.exports = selectParser;