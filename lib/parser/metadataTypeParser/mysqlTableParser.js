/*
 * @author 刀叉4148
 *----------------------------------
 * 从mysqlTableParser的分析器
 */
'use strict';

let encoding = require('encoding');

let indexParser = require('.././indexParser.js');
let uriParser = require('.././uriParser.js');
let selectParser = require('.././selectParser.js');
let orderbyParser = require('.././orderbyParser.js');
let topParser = require('.././topParser.js');
let skipParser = require('.././skipParser.js');
let countParser = require('.././countParser.js');
let filterParser = require('.././filterParser.js');
let bodyParser = require('.././bodyParser.js');

let metadataValueTypeValidator = require('../.././validator/metadataValueTypeValidator.js');
let metadataValueTypeFormatter = require('../.././formatter/metadataValueTypeFormatter.js');
let mysqlTableValidator = require('../.././validator/metadataTypeValidator/mysqlTableValidator.js');
let mysqlTableFormatter = require('../.././formatter/metadataTypeFormatter/mysqlTableFormatter.js');
let filterValidator = require('../.././validator/filterValidator.js');

let mysqlTableParser = {
	'parseGetSql': function(objHttp, metadata, verifyUri) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = new Object();
		objReturn['reCode'] = 0;

		let pUri = this.parseUri(objHttp, metadata);
		if (!pUri['result']) {
			return pUri;
		}
		let uri = pUri['reMsg'];

		let pMeta = this.parseMetadata(uri['$metadata'], metadata);

		let pSelect;
		if (uri['$select'] !== '') {
			pSelect = this.parseSelect(uri['$select'], metadata, pMeta);
			if (!pSelect['result']) {
				return pSelect;
			}
			uri['$select'] = 'select ' + pSelect['reMsg'];
		}

		let pIndex = this.parseIndex(objHttp, metadata);
		if (!pIndex['result']) {
			return pIndex;
		}
		let index = pIndex['reMsg'];

		let filter = '';
		let pFilter = this.parseFilter(uri['$filter'], metadata);
		if (pFilter['result']) {
			filter = pFilter['reMsg'];
		}

		let where = '';
		if (index !== '' || filter !== '') {
			where = where + ' where ';
			if (index !== '' && filter !== '') {
				where = where + index + ' and (' + filter + ')';
			} else {
				where = where + (index !== '' ? index : filter);
			}
		}

		uri['$filter'] = where !== '' ? where : '';

		let pOrderby = this.parseOrderby(uri['$orderby'], metadata);
		uri['$orderby'] = pOrderby['result'] ? ' order by ' + pOrderby['reMsg'] : '';

		let pLimit = this.parseLimit(uri['$skip'], uri['$top']);
		uri['$skip'] = pLimit['result'] ? ' limit ' + pLimit['reMsg'] : '';
		uri['$top'] = pLimit['result'] ? pLimit['reMsg'] : '';

		let pCount = this.parseCount(uri['$count'], metadata);
		uri['$count'] = pCount['result'] ? 'select ' + pCount['reMsg'] : '';

		let validator = mysqlTableValidator.verifyUriParams(uri, verifyUri);
		if (!validator['result']) {
			validator['reMsg'] = '解析uri:' + validator['reMsg'];
			return validator;
		}

		let sql = uri['$select'] + ' from ' + metadata['config']['mapping']['table'] + uri['$filter'] + uri['$orderby'] + uri['$skip'];
		objReturn['reMsg']['sql'] = sql;

		let count = '';
		if (!pMeta['result']) {
			count = pCount['result'] ? uri['$count'] + ' from ' + metadata['config']['mapping']['table'] + uri['$filter'] : count;
		}
		objReturn['reMsg']['count'] = count;

		objReturn['reMsg']['metaIsBinary'] = pMeta['result'];
		objReturn['reMsg']['metaExt'] = pMeta['reMsg'];

		return objReturn;
	},
	'parseGetRs': function(rs, metadata, meta) {
		let collection = require('collection');
		var listRs = new collection.List();
		rs.forEach(function(r) {
			let row = new Object();
			for (let f in r) {
				let type = typeof(r[f]);
				if (type !== 'function') {
					let pattern = metadata['content']['fields'][f]['pattern'];
					type = metadata['content']['fields'][f]['type'];
					try {
						if (r[f] === undefined) {
							row[f] = '';
						} else {
							row[f] = mysqlTableFormatter.formatValueTypeRsOut(r[f], type, pattern);
						}
					} catch (e) {
						//console.warn(e);
					}
				}
			}
			listRs.push(row);
		});
		return listRs.toJSON();
	},
	'parseDeleteSql': function(objHttp, metadata, verifyUri) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = new Object();
		objReturn['reCode'] = 0;

		let pUri = this.parseUri(objHttp, metadata);
		if (!pUri['result']) {
			return pUri;
		}
		let uri = pUri['reMsg'];

		let pIndex = this.parseIndex(objHttp, metadata);
		if (!pIndex['result']) {
			return pIndex;
		}
		let index = pIndex['reMsg'];

		let filter = '';
		let pFilter = this.parseFilter(uri['$filter'], metadata);
		if (pFilter['result']) {
			filter = pFilter['reMsg'];
		}

		let where = '';
		if (index !== '' || filter !== '') {
			where = where + ' where ';
			if (index !== '' && filter !== '') {
				where = where + index + ' and (' + filter + ')';
			} else {
				where = where + (index !== '' ? index : filter);
			}
		}

		uri['$filter'] = where !== '' ? where : '';

		let pOrderby = this.parseOrderby(uri['$orderby'], metadata);
		uri['$orderby'] = pOrderby['result'] ? ' order by ' + pOrderby['reMsg'] : '';

		let pTop = this.parseTop(uri['$top']);
		uri['$top'] = pTop['result'] ? ' limit ' + pTop['reMsg'] : '';

		let validator = mysqlTableValidator.verifyUriParams(uri, verifyUri);
		if (!validator['result']) {
			validator['reMsg'] = '解析uri:' + validator['reMsg'];
			return validator;
		}


		let sql = 'delete from ' + metadata['config']['mapping']['table'] + uri['$filter'] + uri['$orderby'] + uri['$top'];
		objReturn['reMsg']['sql'] = sql;
		return objReturn;
	},
	'parsePutSql': function(objHttp, metadata, verifyUri) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = new Object();
		objReturn['reCode'] = 0;

		let pBody = this.parseBody(objHttp, metadata);
		if (!pBody['result']) {
			return pBody;
		}

		let update='';
		for(let p in pBody['reMsg']){
			update = update === '' ? p + ' = ' + pBody['reMsg'][p] : update + ',' +  p + ' = ' + pBody['reMsg'][p];
		}
		if(update === ''){
			objReturn['result'] = false;
			objReturn['reMsg'] = 'update语句为空';
			return objReturn;
		}

		let pUri = this.parseUri(objHttp, metadata, verifyUri);
		if (!pUri['result']) {
			return pUri;
		}
		let uri = pUri['reMsg'];

		let pIndex = this.parseIndex(objHttp, metadata);
		if (!pIndex['result']) {
			return pIndex;
		}
		let index = pIndex['reMsg'];

		let filter = '';
		let pFilter = this.parseFilter(uri['$filter'], metadata);
		if (pFilter['result']) {
			filter = pFilter['reMsg'];
		}

		let where = '';
		if (index !== '' || filter !== '') {
			where = where + ' where ';
			if (index !== '' && filter !== '') {
				where = where + index + ' and (' + filter + ')';
			} else {
				where = where + (index !== '' ? index : filter);
			}
		}

		uri['$filter'] = where !== '' ? where : '';

		let pOrderby = this.parseOrderby(uri['$orderby'], metadata);
		uri['$orderby'] = pOrderby['result'] ? ' order by ' + pOrderby['reMsg'] : '';

		let pTop = this.parseTop(uri['$top']);
		uri['$top'] = pTop['result'] ? ' limit ' + pTop['reMsg'] : '';

		let validator = mysqlTableValidator.verifyUriParams(uri, verifyUri);
		if (!validator['result']) {
			validator['reMsg'] = '解析uri:' + validator['reMsg'];
			return validator;
		}



		let sql = 'update ' + metadata['config']['mapping']['table'] + ' set ' + update + uri['$filter'] + uri['$orderby'] + uri['$top'];
		objReturn['reMsg']['sql'] = sql;

		return objReturn;
	},
	'parsePostSql': function(objHttp, metadata) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = new Object();
		objReturn['reCode'] = 0;

		let pBody = this.parseBody(objHttp, metadata);
		if (!pBody['result']) {
			return pBody;
		}

		let arrSql = new Array();
		for(let p in  pBody['reMsg']){
			let tmpFields = ' (';
			let tmpValues = ' (';
			for(let r in pBody['reMsg'][p]){
				tmpFields = tmpFields === ' (' ? tmpFields + r : tmpFields + ',' + r;
				tmpValues = tmpValues === ' (' ? tmpValues + pBody['reMsg'][p][r] : tmpValues + ',' + pBody['reMsg'][p][r];
			}
			tmpFields = tmpFields + ') ';
			tmpValues = tmpValues + ');';
			arrSql.push('insert into ' + metadata['config']['mapping']['table'] + tmpFields + 'values ' + tmpValues);
		}

		objReturn['reMsg']['sql'] = arrSql;
		return objReturn;
	},
	'parseIndex': function(objHttp, metadata) { //获取index
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '解析index:';
		objReturn['reCode'] = 0;

		let index = indexParser.parseIndex(objHttp.params);
		let validator = mysqlTableValidator.verifyIndex(metadata, index);
		if (!validator['result']) {
			objReturn['result'] = false;
			objReturn['reMsg'] = objReturn['reMsg'] + validator['reMsg'];
			return validator;
		}
		objReturn['reMsg'] = mysqlTableFormatter.formatIndex(metadata, index);
		return objReturn;
	},
	'parseUri': function(objHttp, metadata) { //获取uri
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let uri = new Object();
		uri['$filter'] = '';
		uri['$orderby'] = '';
		uri['$skip'] = '';
		uri['$top'] = '';
		uri['$select'] = '';
		uri['$count'] = '';
		uri['$metadata'] = '';
		for (let q in objHttp.query) {
			if (uri.hasOwnProperty(q.toLowerCase())) {
				uri[q.toLowerCase()] = encoding.decodeURI(objHttp.query[q]).trim();
			}
		}

		objReturn['reMsg'] = uri;
		return objReturn;
	},
	'parseFilter': function(filter, metadata, KeyWords) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let pAstTree = filterParser.parseFilter(filter);
		if (!pAstTree['result']) {
			pAstTree['reMsg'] = '解析filter:' + pAstTree['reMsg'];
			return pAstTree;
		}
		let astTree = pAstTree['reMsg'];

		let validator = mysqlTableValidator.verifyAstTreeLeafType(astTree, metadata['content']['fields'], filterParser.defaultKeyWords);
		if (!validator['result']) {
			validator['reMsg'] = '解析filter:' + validator['reMsg'];
			return validator;
		}
		filter = mysqlTableFormatter.formatAstTree(astTree, metadata, filterParser.defaultKeyWords);

		if (typeof(filter) !== 'string') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '解析filter:AST生成SQL语句出错';
			objReturn['reCode'] = 200;
			return objReturn;
		}

		objReturn['reMsg'] = filter;
		return objReturn;
	},
	'parseSelect': function(select, metadata, pMeta) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let arrSelect = select.split(',');

		let pSelect = selectParser.parseSelect(arrSelect);
		if (!pSelect['result']) {
			pSelect['reMsg'] = '解析select:' + pSelect['reMsg'];
			return pSelect;
		}
		arrSelect = pSelect['reMsg'];

		for (let a in arrSelect) {
			let validator = mysqlTableValidator.verifyParamsFields(metadata['content']['fields'], arrSelect[a].trim(), 'select');
			if (!validator['result']) {
				validator['reMsg'] = '解析select:' + validator['reMsg'];
				return validator;
			}
		}

		if (pMeta['result']) {
			if (arrSelect.length > 1) {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'metadata指定字段是binary时，只允许select一个string类型的字段作为文件名';
				return objReturn;

			}
			if (arrSelect.length === 0) {
				objReturn['reMsg'] = "'binary.bin' as 'filename'," + metadata['config']['mapping']['fields'][pMeta['reMsg']['fieldsName']] + " as 'filedata'";
				return objReturn;
			}
			if (metadata['content']['fields'][arrSelect[0]]['type'] !== 'string') {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'metadata指定字段是binary时，只允许select一个string类型的字段作为文件名';
				return objReturn;
			} else {
				objReturn['reMsg'] = metadata['config']['mapping']['fields'][arrSelect[0]] + " as 'filename'," + metadata['config']['mapping']['fields'][pMeta['reMsg']['fieldsName']] + " as 'filedata'";
				return objReturn;
			}
		}

		objReturn['reMsg'] = mysqlTableFormatter.formatSelect(arrSelect, metadata['config']['mapping']['fields']);
		return objReturn;
	},
	'parseOrderby': function(orderby, metadata) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let orderbyArray = orderby.split(',');
		let orderbyFields = '';
		let validator;
		for (let o in orderbyArray) {
			let oaa = orderbyArray[o].split(' ');
			let oaaf = oaa[0].trim();
			if (oaaf === '') {
				continue;
			}
			validator = mysqlTableValidator.verifyParamsFields(metadata['content']['fields'], oaaf, 'select');
			if (!validator['result']) {
				validator['reMsg'] = '解析orderby:' + validator['reMsg'];
				return validator;
			}

			let oaad = oaa.length === 2 ? oaa[1].trim() : 'asc';
			orderbyFields = orderbyFields === '' ? oaa[0].trim() + ' ' + oaad : orderbyFields + ',' + oaa[0].trim() + ' ' + oaad;
		}

		let pOrderby = orderbyParser.parseOrderby(metadata, orderbyFields);
		if (!pOrderby['result']) {
			pOrderby['reMsg'] = '解析orderby:' + pOrderby['reMsg'];
			return pOrderby;
		}

		objReturn['reMsg'] = mysqlTableFormatter.formatOrderby(pOrderby['reMsg'], metadata['config']['mapping']['fields']);
		return objReturn;
	},
	'parseLimit': function(skip, top) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		//获取top
		let pTop = topParser.parseTop(top);
		//获取skip
		let pSkip = skipParser.parseSkip(skip);

		if (pTop === '0') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '查询数据为0行';
			return objReturn;
		}

		objReturn['reMsg'] = pSkip + ',' + pTop;
		return objReturn;
	},
	'parseTop': function(top) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		//获取top
		let pTop = topParser.parseTop(top);

		if (pTop === '0') {
			objReturn['result'] = false;
			objReturn['reMsg'] = '影响数据为0行';
			return objReturn;
		}

		objReturn['reMsg'] = pTop;
		return objReturn;
	},
	'parseCount': function(count, metadata) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		if (count === '') {
			objReturn['result'] = false;
			objReturn['reMsg'] = 'count参数为空';
			return objReturn;
		}

		let countArray = count.split(',');
		let countFieldsArray = new Array();
		for (let c in countArray) {
			let countFields = countArray[c].trim() === '' ? 'null' : countArray[c].trim();
			let validator = mysqlTableValidator.verifyParamsFields(metadata['content']['fields'], countFields, 'select');
			if (!validator['result']) {
				countFieldsArray.push(countFields === 'true' ? countFields : 'null');
			} else {
				countFieldsArray.push(countFields);
			}
		}

		let pCount = countParser.parseCount(countFieldsArray);
		if (pCount.length === 0) {
			objReturn['result'] = false;
			objReturn['reMsg'] = '无有效count数据';
			return objReturn;
		}

		let rCount = '';
		for (let p in pCount) {
			let tCount = pCount[p];
			if (tCount === 'true' || tCount === 'null') {
				rCount = rCount === '' ? "count(" + tCount + ") as '" + tCount + "'" : rCount + ",count(" + tCount + ") as '" + tCount + "'";
			} else {
				rCount = rCount === '' ? "count(" + metadata['config']['mapping']['fields'][tCount] + ") as '" + tCount + "'" : rCount + ",count(" + metadata['config']['mapping']['fields'][tCount] + ") as '" + tCount + "'";
			}
		}

		objReturn['reMsg'] = rCount;
		return objReturn;
	},
	'parseBody': function(objHttp, metadata) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		let pBody = bodyParser.parseBody(objHttp);
		if (!pBody['result']) {
			return pBody;
		}

		let body = pBody['reMsg'];

		if (objHttp.method === 'POST') {
			if (body.length === undefined) {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'body数据不是json数组';
				return objReturn;
			}
			if (body.length === 0) {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'body数据为空json数组';
				return objReturn;
			}
		}

		if (objHttp.method === 'PUT') {
			if (body.length !== undefined) {
				objReturn['result'] = false;
				objReturn['reMsg'] = 'body数据不是json对象';
				return objReturn;
			}
		}

		if (objHttp.method === 'POST') {
			let arrBody = new Array();
			for (let r in body) {
				let objBody = new Object();
				for (let f in body[r]) {
					let validator = mysqlTableValidator.verifyParamsFields(metadata['content']['fields'], f, 'insert');
					if (!validator['result']) {
						validator['reMsg'] = 'post:' + validator['reMsg'];
						return validator;
					}
					let type = metadata['content']['fields'][f]['type'];
					let value = body[r][f];
					validator = metadataValueTypeValidator.verifyMetadataValueType(type, value);
					if (!validator['result']) {
						validator['reMsg'] = 'post:' + f + validator['reMsg'];
						return validator;
					}
					let pattern = metadata['content']['fields'][f]['pattern'];
					value = mysqlTableFormatter.formatValueTypeRsIn(value, type, pattern);
					let fields = metadata['config']['mapping']['fields'][f];
					objBody[fields] = value;
				}
				arrBody.push(objBody);
			}
			objReturn['reMsg'] = arrBody;
		}

		if (objHttp.method === 'PUT') {
			let objBody = new Object();
			for (let f in body) {
				let validator = mysqlTableValidator.verifyParamsFields(metadata['content']['fields'], f, 'update');
				if (!validator['result']) {
					validator['reMsg'] = 'put:' + validator['reMsg'];
					return validator;
				}

				let type = metadata['content']['fields'][f]['type'];
				let value = body[f];

				validator = metadataValueTypeValidator.verifyMetadataValueType(type, value);
				if (!validator['result']) {
					validator['reMsg'] = 'put:' + f + validator['reMsg'];
					return validator;
				}
				let pattern = metadata['content']['fields'][f]['pattern'];
				value = mysqlTableFormatter.formatValueTypeRsIn(value, type, pattern);
				let fields = metadata['config']['mapping']['fields'][f];
				objBody[fields] = value;
			}
			objReturn['reMsg'] = objBody;
		}
		return objReturn;
	},
	'parseMetadata': function(uriMetadata, metadata) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = null;
		objReturn['reCode'] = 0;

		if (uriMetadata === 'true') {
			objReturn['result'] = false;
			objReturn['reMsg'] = true;
			return objReturn;
		}

		if (!metadata['content']['fields'].hasOwnProperty(uriMetadata)) {
			objReturn['result'] = false;
			objReturn['reMsg'] = false;
			return objReturn;
		}

		if (metadata['content']['fields'][uriMetadata]['type'] === 'binary') {
			let objMeta = new Object();
			objMeta['fieldsName'] = uriMetadata;
			//objMeta['contentType'] = 'application/octet-stream';
			objReturn['reMsg'] = objMeta;
			return objReturn;
		} else {
			objReturn['result'] = false;
			objReturn['reMsg'] = false;
			return objReturn;
		}
	}
}

module.exports = mysqlTableParser;