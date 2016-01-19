/*
 * @author 刀叉4148
 *----------------------------------
 * 元数据类型SVC处理程序
 */

'use strict';

let uriParser = require('../.././parser/uriParser.js');

let objReturn = new Object();
objReturn['result'] = true;
objReturn['reMsg'] = '';
objReturn['reCode'] = 0;

let metadataSvcActor = {
	'GET': function(objHttp, metadata) {
		//console.warn(metadata);
		let uri = uriParser.parseUri(objHttp);
		if (uri['$metadata'] !== '') {
			if (metadata['content']['svcMetadata'].hasOwnProperty(uri['$metadata'])) {
				objReturn['reMsg'] = JSON.stringify(metadata['content']['svcMetadata'][uri['$metadata']]);
			} else {
				objReturn['reMsg'] = JSON.stringify(metadata['content']['svcMetadata']);
			}
		} else {
			let objTempReturn = new Object();
			objTempReturn['svcInfo'] = metadata['content']['svcInfo'];
			objTempReturn['svcMetadata'] = 'http://' + objHttp['headers']['Host'] + objHttp['address'] + '?$metadata=true';
			let arrSvcResourse = new Array();

			for (let o in metadata['content']['svcMetadata']) {
				let objSvcResourse = new Object();
				objSvcResourse['svcResourseName'] = metadata['content']['svcMetadata'][o]['name'];
				objSvcResourse['svcResourseType'] = metadata['content']['svcMetadata'][o]['type'];
				objSvcResourse['svcResourseUrl'] = 'http://' + objHttp['headers']['Host'] + objHttp['address'] + o;

				arrSvcResourse.push(objSvcResourse);
			}
			objTempReturn['svcResourse'] = arrSvcResourse;
			objTempReturn['svcComment'] = metadata['comment'];

			objReturn['reMsg'] = JSON.stringify(objTempReturn);
			
			//console.log(objHttp);
		}

		objReturn['reCode'] = 200;
		return objReturn;
	},
	'OPTIONS': function(objHttp, metadata) {
		let objHttpMethodAllowd = new Object();
		objHttpMethodAllowd['methodAllowd'] = metadata['action'];
		objReturn['reMsg'] = JSON.stringify(objHttpMethodAllowd);
		objReturn['reCode'] = 200;
		return objReturn;
	}
}

module.exports = metadataSvcActor;