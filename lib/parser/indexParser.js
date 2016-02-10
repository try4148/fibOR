/*
 * @author 刀叉4148
 *----------------------------------
 * 从http params中分析index值
 */

'use strict';

let encoding = require('encoding');

let preTreat = function(s, k) {
    let dyd = 0;
    let khd = 0;
    let lid = 0;

    let t = new Object();
    if(s.toLowerCase().indexOf(k) < 0){
        t['r0'] = s;
        return t;
    }
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
                t['r' + lid++] = s.substr(0, i);
                s = s.substr(i + klen );
                i = -1;
                continue;
            }
        }
    }

    if (slen > 0) {
        t['r' + lid++] = s.substr(0);
    }

    return t;
}

let indexParser = {
	'parseIndex': function(indexValue) {
		let objReturn =new Object();

		if(indexValue.length !== 1){
			return objReturn;
		}
		
		objReturn = preTreat(encoding.decodeURI(indexValue[0]),',');
		return objReturn;
	}
}

module.exports = indexParser;