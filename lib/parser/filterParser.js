/*
 * @author 刀叉4148
 *----------------------------------
 * 从filter关键字中分析filter值
 */

'use strict';

let filterValidator = require('.././validator/filterValidator.js');

let objLen = function(o) {
    let a = Object.keys(o);
    return a.length;
}

let keyWords = {};

let trimBrackets = function(s) {
    let t = s.trim();
    let tlen = t.length;
    if (t.charAt(0) === '(' && t.charAt(tlen - 1) === ')') {
        let ss = t.substr(1, tlen - 2);
        let dyd = 0;
        let khd = 0;
        let sslen = ss.length;

        for (let i = 0; i < sslen; i++) {
            if (ss.charAt(i) === "'") {
                if (dyd === 0) {
                    dyd = 1;
                } else {
                    dyd = 0;
                }

            }

            if (ss.charAt(i) === '(' && dyd === 0) {
                khd++;
            }
            if (ss.charAt(i) === ')' && dyd === 0) {
                khd--;
            }

            if (khd < 0) {
                return s;
            }
        }

        if (dyd === 0 && khd === 0) {
            if (ss.charAt(0) === '(' && ss.charAt(tlen - 1) === ')') {
                ss = trimBrackets(ss);
            }
        }

        s = ss;
    }

    return s;
}

let preTreatKeywords = function(s, k) {
    let dyd = 0;
    let khd = 0;
    let lid = 1;

    let t = new Object();
    t['l0'] = k.trim();
    if(s.toLowerCase().indexOf(k) < 0){
        t['l1'] = s;
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
                t['l' + lid++] = trimBrackets(s.substr(0, i));
                s = s.substr(i + klen);
                slen = s.length
                i = -1;
                continue;
            }
        }
    }

    if (slen > 0) {
        t['l' + lid++] = trimBrackets(s);
    }

    return t;
}

let preTreatLogic = function(o) {
    let p = new Object();
    if (typeof(o) === 'string') {
        o = trimBrackets(o);
        if (o === '') {
            return p;
        }
        let p1, p2;
        p1 = preTreatKeywords(o, ' or ');
        if (objLen(p1) > 2) {
            o = preTreatLogic(p1);
        } else {
            p2 = preTreatKeywords(o, ' and ');
            if (objLen(p2) > 2) {
                o = preTreatLogic(p2);
            } else {
                return o;
            }
        }
    }
    if (typeof(o) === 'object') {
        let olo = objLen(o);
        if (olo <= 2) {
            return p;
        }
        for (let i = 1; i < olo; i++) {
            o['l' + i] = preTreatLogic(o['l' + i]);
        }
    }
    return o;
}

let preTreatComp = function(o) {
    let p = new Object();
    if (typeof(o) === 'string') {
        o = trimBrackets(o);
        if (o === '') {
            return p;
        }
        for (let k in keyWords['comp']) {
            let t = preTreatKeywords(o, ' ' + k + ' ');
            let olt = objLen(t);
            if (olt > 2) {
                return t;
            }
        }
    }
    if (typeof(o) === 'object') {
        let olo = objLen(o);
        if (olo !== 3) {
            return p;
        }
        for (let i = 1; i < olo; i++) {
            o['l' + i] = preTreatComp(o['l' + i]);
        }
    }
    return o;
}

let preTreatFunc = function(o) {
    let p = new Object();
    if (typeof(o) === 'string') {
        o = o.trim();
        let t = o.indexOf('(');
        let l = o.length - 1;
        if (t < 0 || o.substr(l) !== ')') {
            return o;
        }
        let f = o.substr(0, t);
        if (!keyWords['func'].hasOwnProperty(f)) {
            return o;
        }

        let n = keyWords.func[f]['paramsType'].split(',').length;
        let s = o.substring(t + 1, l);

        p = preTreatKeywords(s, ',');

        if (objLen(p) !== n + 1) {
            let objEmpty = new Object();
            p = objEmpty;
        } else {
            p['l0'] = f;
        }
        return p;
    }
    if (typeof(o) === 'object') {
        let olo = objLen(o);
        if (olo < 2) {
            return p;
        }
        for (let i = 1; i < olo; i++) {
            o['l' + i] = preTreatFunc(o['l' + i]);
        }
    }
    return o;
}

let filterParser = {
    'defaultKeyWords': {
        'logic': { //逻辑关键词
            'and': 'and',
            'or': 'or',
            'not': 'not'
        },
        'comp': { //比较关键词
            'eq': '=',
            'ne': '<>',
            'gt': '>',
            'ge': '>=',
            'lt': '<',
            'le': '<='
        },
        'func': { //定义函数名和参数类型，返回值类型
            'contains': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'not contains': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'startswith': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'not startswith': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'endswith': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'not endswith': {
                paramsType: 'fields,string',
                returnType: 'bool'
            },
            'length': {
                paramsType: 'fields',
                returnType: 'number'
            }
        }
    },
    'parseFilter': function(filterValue, filterKeyWords) {
        let objReturn = new Object();
        objReturn['result'] = true;
        objReturn['reMsg'] = null;
        objReturn['reCode'] = 0;

        if (filterKeyWords !== null && typeof(filterKeyWords) === 'object') {
            keyWords = filterKeyWords;
        } else {
            keyWords = this.defaultKeyWords;
        }

        let astTree = preTreatFunc(preTreatComp(preTreatLogic(filterValue)));
        let validator = filterValidator.verifyAstTree(astTree);
        if (!validator['result']) {
            return validator;
        }

        objReturn['reMsg'] = astTree;
        return objReturn;
    }
}

module.exports = filterParser;