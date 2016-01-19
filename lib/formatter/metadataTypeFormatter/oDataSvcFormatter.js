/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据type为oDataSvc的content部分进行格式化
 */

'use strict';

let util = require('util');

let oDataSvcFormatter = {
	'format': function(metadataCache,metadataHttpPath) {
		let metadataOData = metadataCache[metadataHttpPath];
		// if (!metadataOData.hasOwnProperty('name') || metadataOData['name'] === '') {
		// 	metadataOData['name'] = 'fibOR';
		// }
		metadataOData['name'] = 'fibOR';
		let CopyRightDate = (new Date()).getFullYear();
		metadataOData['content']['svcInfo']['copyRight'] = metadataOData['content']['svcInfo']['copyRight'].replace('[date]', CopyRightDate);

		for(let tempHttpPath in metadataCache){

			if(tempHttpPath.length <= metadataHttpPath.length){
				continue;
			}
			let tempBaseHttpPath = tempHttpPath.substr(0,metadataHttpPath.length);

			if(tempBaseHttpPath !== metadataHttpPath){
				continue;
			}
			

			let tempExtHttpPath = tempHttpPath.substr(metadataHttpPath.length);
			let s = tempExtHttpPath.indexOf('\\');
			let e = tempExtHttpPath.lastIndexOf('\\');
			if(s !== e){
				continue;
			}
			if(s>0 && tempExtHttpPath.charAt(tempExtHttpPath.length-1) !== '\\'){
				continue;
			}
			tempExtHttpPath = tempExtHttpPath.replace(/\\/g, '/');
			let metadataTemp = util.clone(metadataCache[tempHttpPath]);

			if (metadataTemp.hasOwnProperty('config')) {
				delete metadataTemp['config'];
			}
			if(metadataTemp['type'] === 'oDataSvc'){
				metadataTemp['name'] = 'fibOR';
				metadataTemp['comment'] = '这是FibRO服务地址'+tempHttpPath+'的说明';
			}


			metadataOData['content']['svcMetadata'][tempExtHttpPath] = metadataTemp;
		}

		if (!metadataOData.hasOwnProperty('action')) {
			let newAction = new Object();
			newAction['GET'] = true;
			newAction['PUT'] = false;
			newAction['POST'] = false;
			newAction['DELETE'] = false;
			newAction['OPTIONS'] = true;
			newAction['HEAD'] = false;
			metadataOData['action'] = newAction;
		}
		metadataOData['comment'] = '这是FibRO服务地址'+metadataHttpPath.replace(/\\/g, '/')+'的说明';
		return metadataOData;
	}
}

module.exports = oDataSvcFormatter;