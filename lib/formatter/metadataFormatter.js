/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据格式化
 */

'use strict';

let fs = require('fs');

let metadataFormatter = {
	'formatMetadata': function(metadata, customActor) {

		let newMetadata = new Object();

		let metadataName;

		if (metadata.hasOwnProperty('name')) {
			metadataName = metadata['name']
		} else {
			let lIO = customActor.lastIndexOf('\\');
			if (lIO >= 0) {
				metadataName = customActor.substring(customActor.length, lIO + 1);
			} else {
				metadataName = customActor;
			}
		}

		newMetadata['name'] = metadataName;
		newMetadata['type'] = metadata['type'];
		newMetadata['content'] = metadata['content'];
		//根据lib/actor里面的文件自动初始化actor属性
		//先从special的cumtom找，没有从default找
		let newAction = new Object();
		if (metadata.hasOwnProperty('action')) {
			newAction['GET'] = metadata['action'].hasOwnProperty('GET') ? metadata['action']['GET'] : true;
			newAction['PUT'] = metadata['action'].hasOwnProperty('PUT') ? metadata['action']['PUT'] : true;
			newAction['POST'] = metadata['action'].hasOwnProperty('POST') ? metadata['action']['POST'] : true;
			newAction['DELETE'] = metadata['action'].hasOwnProperty('DELETE') ? metadata['action']['DELETE'] : true;
			newAction['OPTIONS'] = metadata['action'].hasOwnProperty('OPTIONS') ? metadata['action']['OPTIONS'] : true;
			newAction['HEAD'] = metadata['action'].hasOwnProperty('HEAD') ? metadata['action']['HEAD'] : true;
		} else {
			newAction['GET'] = true;
			newAction['PUT'] = true;
			newAction['POST'] = true;
			newAction['DELETE'] = true;
			newAction['OPTIONS'] = true;
			newAction['HEAD'] = true;
		}
		if (fs.exists('./lib/actor/custom/' + customActor + 'Actor.js')) {
			let metadataActor = require('../.././lib/actor/custom/' + customActor + 'Actor.js');
			newAction['GET'] = metadataActor.hasOwnProperty('GET') ? true && newAction['GET'] : false;
			newAction['PUT'] = metadataActor.hasOwnProperty('PUT') ? true && newAction['PUT'] : false;
			newAction['POST'] = metadataActor.hasOwnProperty('POST') ? true && newAction['POST'] : false;
			newAction['DELETE'] = metadataActor.hasOwnProperty('DELETE') ? true && newAction['DELETE'] : false;
			newAction['OPTIONS'] = metadataActor.hasOwnProperty('OPTIONS') ? true && newAction['OPTIONS'] : false;
			newAction['HEAD'] = metadataActor.hasOwnProperty('HEAD') ? true && newAction['HEAD'] : false;
		} else if (fs.exists('./lib/actor/default/' + metadata['type'] + 'Actor.js')) {
			let metadataActor = require('../.././lib/actor/default/' + metadata['type'] + 'Actor.js');
			newAction['GET'] = metadataActor.hasOwnProperty('GET') ? true && newAction['GET'] : false;
			newAction['PUT'] = metadataActor.hasOwnProperty('PUT') ? true && newAction['PUT'] : false;
			newAction['POST'] = metadataActor.hasOwnProperty('POST') ? true && newAction['POST'] : false;
			newAction['DELETE'] = metadataActor.hasOwnProperty('DELETE') ? true && newAction['DELETE'] : false;
			newAction['OPTIONS'] = metadataActor.hasOwnProperty('OPTIONS') ? true && newAction['OPTIONS'] : false;
			newAction['HEAD'] = metadataActor.hasOwnProperty('HEAD') ? true && newAction['HEAD'] : false;
		} else {
			newAction['GET'] = false;
			newAction['PUT'] = false;
			newAction['POST'] = false;
			newAction['DELETE'] = false;
			newAction['OPTIONS'] = false;
			newAction['HEAD'] = false;
		}

		newMetadata['action'] = newAction;
		newMetadata['comment'] = metadata.hasOwnProperty('comment') ? metadata['comment'] : '';

		let newExt = new Object();
		newMetadata['config'] = metadata.hasOwnProperty('config') ? metadata['config'] : newExt;
		return newMetadata;
	}
}

module.exports = metadataFormatter;