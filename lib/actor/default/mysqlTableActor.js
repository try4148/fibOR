/*
 * @author 刀叉4148
 *----------------------------------
 * 元数据类型mysqlTable的通用处理程序
 */

'use strict';

let mysqlTableParser = require('../.././parser/metadataTypeParser/mysqlTableParser.js');

let mysqlTableActor = {
	'GET': function(objHttp, metadata, dbPool, contentType) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let parse = mysqlTableParser.parseGetSql(objHttp, metadata, 'select,filter');
		if (!parse['result']) {
			return parse;
		}

		let sqlResult = new Object();
		if (!parse['reMsg']['metaIsBinary']) {
			let sql = parse['reMsg']['sql'];
			let count = parse['reMsg']['count'];
			let rs;
			try {
				rs = dbPool.getPool(metadata['config']['resource']).execute(sql);
				//rs.map(function(v){console.log(v); v['xm']=1; return v});
				// var collection = require("collection");
				// var a = new Array();
				// a.push(rs[1].toJSON());
				// a.push(rs[2].toJSON());
				// let b = new Object();
				// for(let o in rs[0]){
				// 	b[o] = rs[0][o];
				// }
				// b['extend']=a;
				// console.warn(rs.toArray());
				if (parse['reMsg']['metaExt']) {
					sqlResult['result'] = rs;
				} else {
					sqlResult['result'] = mysqlTableParser.parseGetRs(rs, metadata);
				}

			} catch (e) {
				objReturn['result'] = false;
				objReturn['reMsg'] = '查询数据库时发生错误';
				objReturn['reCode'] = 502;
				return objReturn;
			}
			if (count !== '') {
				try {
					rs = dbPool.getPool(metadata['config']['resource']).execute(count);
					sqlResult['count'] = rs[0].toJSON();
				} catch (e) {
					objReturn['reMsg'] = '查询数据库时发生错误';
					objReturn['reCode'] = 502;
					return objReturn;
				}
			}
			objReturn['reMsg'] = JSON.stringify(sqlResult);
			objReturn['reCode'] = 200;
			return objReturn;
		} else {
			let path = require('path');
			let sql = parse['reMsg']['sql'];

			let rs, filename, filedata;
			try {
				rs = dbPool.getPool(metadata['config']['resource']).execute(sql);
				if (rs.length !== 1) {
					objReturn['reMsg'] = '返回二进制流时条数不等于1';
					objReturn['reCode'] = 404;
					return objReturn;
				}

				if (rs[0]['filedata'] === undefined) {
					objReturn['reMsg'] = '未找到二进制数据';
					objReturn['reCode'] = 404;
					return objReturn;
				}
				filedata = rs[0]['filedata'];
				if (rs[0]['filename'] === undefined) {
					filename = 'binary.bin';
				} else {
					filename = path.basename(rs[0]['filename']) === '' ? 'binary.bin' : path.basename(rs[0]['filename']);
				}
			} catch (e) {
				objReturn['reMsg'] = '查询数据库时发生错误';
				objReturn['reCode'] = 502;
				return objReturn;
			}
			let header = new Object();

			let extname;
			extname = path.extname(extname) === '' ? '.bin' : path.extname(extname);
			let ct = 'application/octet-stream';
			if (contentType.hasOwnProperty(extname)) {
				ct = contentType[extname];
			}

			header['Content-type'] = ct;
			header['Accept-Length'] = objReturn['reMsg'].length;
			header['Content-Disposition'] = 'attachment; filename=' + filename;
			objReturn['header'] = header;

			objReturn['reMsg'] = filedata;

			objReturn['reCode'] = 200;
			return objReturn;
		}

	},
	'PUT': function(objHttp, metadata, dbPool, contentType) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let parse = mysqlTableParser.parsePutSql(objHttp, metadata, 'filter');
		if (!parse['result']) {
			return parse;
		}

		let sql = parse['reMsg']['sql'];
		let sqlResult = new Object();
		let rs;
		try {
			rs = dbPool.getPool(metadata['config']['resource']).execute(sql);
			sqlResult['result'] = rs.toJSON();
		} catch (e) {
			objReturn['reMsg'] = '更新数据库时发生错误';
			objReturn['reCode'] = 502;
			return objReturn;
		}

		objReturn['reMsg'] = JSON.stringify(sqlResult);
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'POST': function(objHttp, metadata, dbPool, contentType) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let parse = mysqlTableParser.parsePostSql(objHttp, metadata);
		if (!parse['result']) {
			return parse;
		}

		let sqlResult = new Object();
		let db = dbPool.getPool(metadata['config']['resource']);
		try {
			db.begin();
			for(let a in parse['reMsg']['sql']){
				let rs = db.execute(parse['reMsg']['sql'][a]);
				sqlResult[a] = rs.toJSON();
			}
			db.commit();
		} catch (e) {
			db.rollback();
			objReturn['reMsg'] = '插入数据库时发生错误';
			objReturn['reCode'] = 502;
			return objReturn;
		}

		objReturn['reMsg'] = JSON.stringify(sqlResult);
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'DELETE': function(objHttp, metadata, dbPool, contentType) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let parse = mysqlTableParser.parseDeleteSql(objHttp, metadata, 'filter');
		if (!parse['result']) {
			return parse;
		}

		let sql = parse['reMsg']['sql'];
		let sqlResult = new Object();
		let rs;
		try {
			rs = dbPool.getPool(metadata['config']['resource']).execute(sql);
			sqlResult['result'] = rs.toJSON();
		} catch (e) {
			objReturn['reMsg'] = JSON.stringify(e);
			objReturn['reCode'] = 502;
			return objReturn;
		}

		objReturn['reMsg'] = JSON.stringify(sqlResult);
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'OPTIONS': function(objHttp, metadata, dbPool, contentType) {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;

		let objHttpMethodAllowd = new Object();
		objHttpMethodAllowd['methodAllowd'] = metadata['action'];
		objReturn['reMsg'] = JSON.stringify(objHttpMethodAllowd);
		objReturn['reCode'] = 200;
		return objReturn;
	},
	'HEAD': function(objHttp, metadata, dbPool, contentType) {
		return this.GET(objHttp, metadata, dbPool);
	}
}

module.exports = mysqlTableActor;