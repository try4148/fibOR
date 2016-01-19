/*
 * @author 刀叉4148
 *----------------------------------
 * 创建资源连接池
 */

'use strict';

let pool = require('.././util/pool.js');
let db = require('db');

let metadataPool = {
	'createPool': function(resource) {
		let reSplit = resource.indexOf(':');
		let poolType = resource.substr(0, reSplit);
		
		if(poolType === 'mysql' || poolType === 'sqlite' || poolType === 'level' || poolType === 'redis' || poolType === 'mongodb'){
			if(this.Pool !== null){
				if(this.Pool.hasOwnProperty(resource)){
					if(this.Pool[resource]['pool'] === null){
						return false;
					}
					else{
						return true;
					}
				}
				else{
					let objResource = new Object();
					objResource['type'] = poolType;

					let r = null;
					try {
						r = pool(function() {
							let pr = null;
							try {
								pr = db.open(resource);
							} catch (e) {
								return pr;
							}
							return pr;
						});
					} catch (e) {
						objResource['pool'] = r;
						this.Pool[resource] = objResource;
						return false;
					}
					objResource['pool'] = r;
					this.Pool[resource] = objResource;
					return true;
				}
			}
			else {
				let objPool = new Object();
				let objResource = new Object();
				objResource['type'] = poolType;

				
				let r = null;
				try {
					r = pool(function() {
						let pr = null;
						try {
							pr = db.open(resource);
						} catch (e) {
							return pr;
						}
						return pr;
					});
				} catch (e) {
					objResource['pool'] = r;
					objPool[resource] = objResource;
					this.Pool = objPool;
					return false;
				}
	
				objResource['pool'] = r;
				objPool[resource] = objResource;
				this.Pool = objPool;
				return true;
			}
		}
	},
	'getPool':function(resource){
		if(!this.Pool.hasOwnProperty(resource)){
			this.createPool(resource);
		}

		return this.Pool[resource]['pool'](function(db) {return db});
	},
	'getType':function(resource){
		if(!this.Pool.hasOwnProperty(resource)){
			this.createPool(resource);
		}
		return this.Pool[resource]['type'];
	},
	'Pool':null
}

module.exports = metadataPool;