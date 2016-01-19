/*
 * @author 刀叉4148
 *----------------------------------
 * 从count关键字中分析count值
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

let countParser = {
	'parseCount': function(countFieldsArray) {
		let countReturn = new Array();
		let countUniqueArray = unique(countFieldsArray);
		for (let c in countUniqueArray) {
			let countFields = countUniqueArray[c].trim();
			if(countFields === ''){
				continue;
			}
			if (countFields === 'true') {
				countReturn.push('true');
			} else if (countFields === 'null') {
				countReturn.push('null');
			} else {
				countReturn.push(countFields);
			}
		}
		return countReturn;
	}
}

module.exports = countParser;