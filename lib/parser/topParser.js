/*
 * @author 刀叉4148
 *----------------------------------
 * 从top关键字中分析top值
 */

'use strict';

let topParser = {
	'parseTop': function(topValue) {
		let topReturn = '0';
		topValue = topValue.trim();
		if (!isNaN(topValue)) {
			if (parseInt(topValue).toString() === topValue) {
				topReturn = topValue;
			}
		}
		return topReturn;
	}
}

module.exports = topParser;