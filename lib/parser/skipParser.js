/*
 * @author 刀叉4148
 *----------------------------------
 * 从skip关键字中分析skip值
 */

'use strict';

let skipParser = {
	'parseSkip': function(skipValue) {
		let skipReturn = '0';
		skipValue = skipValue.trim();
		if (!isNaN(skipValue)) {
			if (parseInt(skipValue).toString() === skipValue) {
				skipReturn = skipValue;
			}
		}
		return skipReturn;
	}
}

module.exports = skipParser;