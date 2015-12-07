'use strict';

var db = require('db');
var util = require('util');
var collection = require('collection');
var jsonEncode = require('encoding').jsonEncode;
var base64Encode = require('encoding').base64Encode;
var base64Decode = require('encoding').base64Decode;

var m = new collection.Map();
var keyWords = {
    'oper': {
        'eq': '=',
        'ne': '<>',
        'gt': '>',
        'ge': '>=',
        'lt': '<',
        'le': '<='
    },
    'func': {
        'contains': function(kv, f) {
            return parserFunc(kv, f);
        },
        'not contains': function(kv, f) {
            return parserFunc(kv, f);
        },
        'startswith': function(kv, f) {
            return parserFunc(kv, f);
        },
        'not startswith': function(kv, f) {
            return parserFunc(kv, f);
        },
        'endswith': function(kv, f) {
            return parserFunc(kv, f);
        },
        'not endswith': function(kv, f) {
            return parserFunc(kv, f);
        }
    }
};
var table = {
    'fields': {
        'id': 'number',
        'name': 'string',
        'birth': 'date',
        'photo': 'bin',
        'password': {
            'type': 'string',
            'select': false
        }
    },
    'index': 'id'
};

var trimBrackets = function(s){
    s = s.trim();

    if(s.charAt(0) === '(' && s.charAt(s.length-1) === ')'){
        var st = s.substr(1,s.length-2).trim();
        var dyd = 0;
        var khd = 0;
        //console.log(st);

        for(var i=0;i<st.length;i++){
            if(st.charAt(i) === "'"){
                if(dyd === 0){
                    if(i > 0){
                        if(st.charAt(i-1) === ' ' || st.charAt(i-1) === ','){
                            dyd = 1;
                        }
                    }
                    else{
                        dyd = 1;
                    }
                }
                else{
                    if(i < st.length-1){
                        if(st.charAt(i+1) === ' ' || st.charAt(i+1) === ')'){
                            dyd = 0;
                        }
                    }
                    else{
                        dyd = 0;
                    }
                }

            }

            if(st.charAt(i) === '(' && dyd === 0){
                khd++;
            }
            if(st.charAt(i) === ')' && dyd === 0){
                khd--;
            }

            // console.log(st);
             // console.log(i);
             // console.log(dyd+','+khd);

            if(khd < 0){
                return s;
            }
        }
        if(dyd === 0 && khd === 0){
            s = st;
            if(s.charAt(0) === '(' && s.charAt(s.length-1) === ')')
                s=trimBrackets(s);
        }
    }
    //console.log(s);
    return s;
}

var preTreat = function(s,p){
	var dyd = 0;
	var khd = 0;
    var lid = 0;

    var m = new collection.Map();
    m.put('l'+lid++,p);

	for(var i=0;i<s.length;i++){
        if(s.charAt(i) === "'"){
            if(dyd === 0){
                if(i > 0){
                    if(s.charAt(i-1) === ' '  || s.charAt(i-1) === ','){
                        dyd = 1;
                    }
                }
                else{
                    dyd = 1;
                }
            }
            else{
                if(i < s.length-1){
                    if(s.charAt(i+1) === ' ' || s.charAt(i+1) === ')'){
                        dyd = 0;
                    }
                }
                else{
                    dyd = 0;
                }
            }

        }
		if(s.charAt(i) === '(' && dyd === 0){
			khd++;
		}
		if(s.charAt(i) === ')' && dyd === 0){
			khd--;
		}
        if(khd < 0){
                m.clear();
                return m;
        }
		if(dyd === 0 && khd === 0 && s.charAt(i) === ' '){

			if(i+p.length+1 < s.length && s.substr(i+1,p.length+1).toLowerCase() === p+' '){
                m.put('l'+lid++,trimBrackets(s.substr(0,i)));
				s = s.substr(i+p.length+2);
				i = -1;
				continue;
			}
		}
	}

	if(s.length > 0){
        m.put('l'+lid++,trimBrackets(s.substr(0)));
	}

	return m;
}

var preTreatOA = function(m){
	//console.log(m);
	if(m.size > 2){
		for(var i=1;i<m.size;i++){
			var t1 = new collection.Map();
            var t2 = new collection.Map();
			var s = trimBrackets(m['l'+i]);

			t1 = preTreat(s,'or');
            t2 = preTreat(s,'and');
            if(t1.size > 2){
                m.remove('l'+i);
                m.put('l'+i,preTreatOA(t1));
            }
			if(t1.size === 2 && t2.size === 2){
                m.remove('l'+i);
                m.put('l'+i,parserWhereKV(s,keyWords));
			}
			if(t1.size === 2 && t2.size > 2){
                m.remove('l'+i);
                m.put('l'+i,preTreatOA(t2));
            }
		}
	}

    return m;
}

var reBuildWhere = function(m){
    var s;
    if(m.size > 1){
        s = '(' + reBuildWhere(m['l1']);
        for(var i=2;i<m.size;i++){
            if(reBuildWhere(m['l'+i]) === ''){
                continue;
            }
            if(s !== '(' ){
                s = s + ' ' + m['l0'] + ' ' + reBuildWhere(m['l'+i]);
            }
            else{
                s = s + reBuildWhere(m['l'+i]);
            }
        }
        s = s + ')';
        //console.log(s);
    }
    else{
        //if(m['n0']!=='')
        s = m['n0'];
    }

    if(s === '()')
        s='';
    return s;
}

var parserWhereKV = function(s,c){
    var k = '';
    var v = '';
    var o = '';
    var f = '';
    var r = new collection.Map();
    //根据操作符分离字段和值
    for(var n in c.oper){
        //console.log(n);
        //console.log(keyWords.oper[n]);
        var m = preTreat(s,n);
        if(m.size === 3){
            k = m.l1.toLowerCase();
            v = m.l2;
            o = m.l0;
            break;
        }
    }

    if(o !== ''){

    	var vf = verifyKV(k,v,table);

    	if(vf.result){
            //console.log(vf);
            if(vf.type === 'null'){
                o = o === 'eq' ? 'is' : 'is not';
            }
            else{
                o = c.oper[o];
            }
    		r.put('l0',o);
    		var t1 = new collection.Map();
    		var t2 = new collection.Map();
    		t1.put('n0',vf.k);
    		r.put('l1',t1);
    		t2.put('n0',vf.v);
    		r.put('l2',t2);
    	}
        else{
            r.put('l0','');
            var t1 = new collection.Map();
            var t2 = new collection.Map();
            t1.put('n0','');
            r.put('l1',t1);
            t2.put('n0','');
            r.put('l2',t2);
        }
    }
    else{//根据函数分离
        for(var n in c.func){
            if(s.substr(0,n.length).toLowerCase() === n){
                var ts = trimBrackets(s.substr(n.length));
                var sp = ts.indexOf(',');
                if(sp > 0){
                    k = ts.substr(0,sp).toLowerCase();
                    v = ts.substr(sp+1);
                    f = n;
                    break;
                }
            }
        }
        if(f !== ''){

            var vf = verifyKV(k,v,table);
            //console.log(vf)
            //console.log(f);
            if(vf.result && vf.type !== 'null'){
                r = c.func[f](vf,f);
                //console.log(r);
            }
            else{
                r.put('l0','');
                var t1 = new collection.Map();
                var t2 = new collection.Map();
                t1.put('n0','');
                r.put('l1',t1);
                t2.put('n0','');
                r.put('l2',t2);
            }
        }
        else{
            r.put('l0','');
            var t1 = new collection.Map();
            var t2 = new collection.Map();
            t1.put('n0','');
            r.put('l1',t1);
            t2.put('n0','');
            r.put('l2',t2);
        }
    }

    return r;
}

var verifyKV = function(k,v,t){
	var t1 = '';
	var err = '';
	if(util.has(t.fields,k)){
        if(v.toLowerCase() !== 'null'){
            if(util.isObject(t.fields[k])){
                if(util.has(t.fields[k],'type')){
                    t1 = t.fields[k]['type'];
                }
                else{
                    err = 'the fields type is err';
                }
               
            }
            else{
                t1 = t.fields[k];
            }

    		//t1 = util.isObject(t.fields[k]) ? t.fields[k]['type'] : t.fields[k];
    		if(t1 === 'string'){
                if(v.substr(0,1) === "'" && v.substr(v.length-1,1) === "'"){
                    v = v.substr(1,v.length-2);
                }
                v = "'" + db.escape(v,true) + "'";
    		}
    		if(t1 === 'number'){
                if(isNaN(v)){
                    err = 'the data type of fields(' + k + ':number) is illegal';
                }
                else{
                	v = Number(v).toString();
                }
    		}
    		if(t1 === 'date'){
                v = v.length === 8 ? v.substr(0,4) + '-' + v.substr(4,2) + '-' + v.substr(6,2) : v;
                v = v.replace(/[^0-9]/g,'-');
                var l = v.replace(/\-/g,'').length;
                v = (new Date(v)).toJSON();
                if(util.isNull(v)){
                    err = 'the data type of fields(' + k + ':date) is illegal';
                }
                else{
                    v = "'" + v.replace(/\-/g,'').substr(0,l) + "'";
                }
    		}
    		if(t1 === 'bin'){
    			err = 'the data type of fields(' + k + ':bin) can not use as where case';
			}
        }
        else{
            t1 = 'null';
        }
	}
    else{
        err = 'table has no such fields:' + k;
        t1 = 'null';
    }

    //var retStr = "{'result':" + (err === '' ? 'true' : 'false') + ",'errMsr':'" + err + "','k':" + k + ",'v':" + v + "}";
    var m = new collection.Map();
    m.put('result',(err === '' ? true : false));
    m.put('errMsg',err);
    m.put('k',k);
    m.put('v',v);
    m.put('type',t1);
    return m;
}

var parserFunc = function(kv,f){
    //console.log(kv);
    //console.log(f);
    var t = new collection.Map();
    var t1 = new collection.Map();
    var t2 = new collection.Map();
    var o = '';
    switch(f)
    {
        case 'contains':
        case 'not contains':
            o = f.replace('contains','like');

            if(kv.type === 'string'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'%" + kv.v.substr(1,kv.v.length-2) + "%'");
                t.put('l2',t2);
            }
            if(kv.type === 'number'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'%" + kv.v + "%'");
                t.put('l2',t2);
            }
            //console.log(t);
            break;
        case 'startswith':
        case 'not startswith':
            o = f.replace('startswith','like');

            if(kv.type === 'string'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'" + kv.v.substr(1,kv.v.length-2) + "%'");
                t.put('l2',t2);
            }
            if(kv.type === 'number'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'" + kv.v + "%'");
                t.put('l2',t2);
            }
            //console.log('eee');
            break;
        case 'endswith':
        case 'not endswith':
            o = f.replace('endswith','like');

            if(kv.type === 'string'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'%" + kv.v.substr(1,kv.v.length-2) + "'");
                t.put('l2',t2);
            }
            if(kv.type === 'number'){
                t.put('l0',o);
                t1.put('n0',kv.k);
                t.put('l1',t1);
                t2.put('n0',"'%" + kv.v + "'");
                t.put('l2',t2);
            }
            //console.log('fff');
            break;
        default:
            //console.log('ggg');
            t.put('l0','');
            t1.put('n0','');
            t.put('l1',t1);
            t2.put('n0','');
            t.put('l2',t2);
    }

    if(t.size === 0){
        t.put('l0','');
        t1.put('n0','');
        t.put('l1',t1);
        t2.put('n0','');
        t.put('l2',t2);
    }
    return t;
}

var verifyIndex = function(m,t){
    var vi = false;
    if(util.has(t,'index')){
        for(var i=1;i<m.size;i++){
            if(m['l'+i]['l1'].has('n0')){
                if(m['l'+i]['l1']['n0'] === t.index){
                    vi = true;
                    break;
                }
            }
        }
        //console.log(m);
    }
    else{
        console.log('no');
        vi = true;
    }
    if(!vi){
        m.clear();
    }
    return m;
}

var addIndexKV = function(m,v,t){
    var vf = verifyKV(t.index,v.toString(),table);
    var m0 = new collection.Map();
    if(vf.result){
        var t = new collection.Map();
        var t1 = new collection.Map();
        var t2 = new collection.Map();
        t.put('l0','=');
        t1.put('n0',vf.k);
        t.put('l1',t1);
        t2.put('n0',vf.v);
        t.put('l2',t2);
        m0.put('l0','and');
        m0.put('l1',m);
        m0.put('l2',t)
    }
    if(m0.size > 0){
        return m0;
    }
    else{
        return m;
    }
}
var orid = 0;
var s = "birth eq '2011-11-11' or password eq NULL";
var s1= "(name eq '徐' or name eq '发' and id ge 5)";
var s2 ="(((id eq null) and ((name eq 'x') or ((id eq 9) or (id eq 3))) and (id eq 2)) or (photo eq 'y') or (name eq 's'))";


//s1= trimBrackets(s1);

s = trimBrackets(s);
//console.log(s);
var m = new collection.Map();
var t1 = new collection.Map();
var t2 = new collection.Map();

t1 = preTreat(s,'or');
t2 = preTreat(s,'and');

if(t1.size > 2){
    m = preTreatOA(t1);
}
if(t1.size === 2 && t2.size > 2){
    m = preTreatOA(t2);
}
if(t1.size === 2 && t2.size === 2){
    m = parserWhereKV(t1.l1,keyWords);
}
if(m.size === 0){
    console.log('Brackets in sql has error');
}
else{
	console.log(reBuildWhere(verifyIndex(addIndexKV(m,1,table),table)));
	//console.log(m);
	//console.log(trimBrackets(reBuildWhere(m)));
	//console.log(preTreatOA(m));
}

//for(var n in keyWords.oper){
// 	console.log(n);
// 	console.log(keyWords.oper[n]);
//}
//keyWords.func.contains('like');
//console.log('xx');
//console.log(parserWhereKV(s1,keyWords));

//console.log('table:'+table.index);
// console.log(util.format('yyyyMMdd','2011/11/11x'.replace(/[^0-9]/g,'-') ));
// console.log(base64Decode('xx').toString ()==='');
// console.log(jsonEncode(verifyKV('birth','2008-12-12',table)));
//var s3 = "()";
//console.log(s3);
//console.log(trimBrackets(s3));
