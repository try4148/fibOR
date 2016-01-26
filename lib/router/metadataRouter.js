/*
 * @author 刀叉4148
 *----------------------------------
 * 根据元数据自动加载路由
 */

'use strict';

let mq = require('mq');
let fs = require('fs');
let path = require('path');
let util = require("util");
let encoding = require('encoding');

let metadataPool = require('../.././util/metadataPool.js');
let contentType = require('../.././util/contentType.json');
let oDataSvc = require('../.././util/oDataSvc.json');

let metadataValidator = require('.././validator/metadataValidator.js');
let metadataFormatter = require('.././formatter/metadataFormatter.js');
let httpConnectionValidator = require('.././validator/httpConnectionValidator.js');
let validatorTypeCache = new Object();
let formatterTypeCache = new Object();

let metadataCache = new Object();
let actorCache = new Object();

let routing = new mq.Routing({});

let isAddDefaultRouter = false;
let validator;

// let memo=0;
// var profiler = require("profiler");

let metadataRouterExports = {
	'addRouting': function(rootHttpPath) {
		validator = metadataValidator.verifyVersion();
		if (!validator.result) {
			console.notice(validator['reMsg']);
			return;
		}
		if (isAddDefaultRouter) {
			console.notice('路由已经加载');
			return;
		}

		let metadataFilePath = path.normalize('./metadata');
		rootHttpPath = rootHttpPath || '';
		rootHttpPath = path.normalize('\\' + rootHttpPath);
		rootHttpPath = rootHttpPath.replace(/\\\\/g, "\\");
		rootHttpPath = rootHttpPath.substr(rootHttpPath.length - 1) === '\\' ? rootHttpPath.substr(0, rootHttpPath.length - 1) : rootHttpPath;
		//console.log(rootHttpPath);
		let addMetadataRouter = metadataRouter.addDefaultRouting(rootHttpPath);
		if(!addMetadataRouter){
			console.error('路由参数初始化失败');
			return;
		}

		metadataRouter.setMetadataCache(metadataFilePath, rootHttpPath);
		metadataRouter.verifyMetadataCache(rootHttpPath.length);
		//console.warn(metadataCache);
		metadataRouter.createMetadataRouting(rootHttpPath.length);
		//console.error(metadataCache);
	},
	'getRouting': function() {
		return routing;
	}
}

let metadataRouter = {
	'getActorPath': function(rootHttpPath, metadataType) {
		let path;
		if (fs.exists('./lib/actor/custom/' + rootHttpPath + 'Actor.js')) {
			path = '../.././lib/actor/custom/' + rootHttpPath + 'Actor.js';
		} else {
			path = '../.././lib/actor/default/' + metadataType + 'Actor.js';
		}
		return path;
	},
	'addMetadata': function(fullFilePath, rootHttpPath) {
		let svcHttpPath = rootHttpPath + '\\';
		let fullpath = path.fullpath(fullFilePath);
		let basename = path.basename(fullpath);
		let metadataHttpPath = rootHttpPath + '\\' + basename.substr(0, basename.length - 5);
		if (!metadataCache.hasOwnProperty(svcHttpPath)) {
			let tempObj = new Object();
			tempObj['type'] = util.clone(oDataSvc['type']);
			tempObj['content'] =  new Object();
			tempObj['content']['svcInfo'] = util.clone(oDataSvc['content']['svcInfo']);
			tempObj['content']['svcMetadata'] = util.clone(oDataSvc['content']['svcMetadata']);
			metadataCache[svcHttpPath] = tempObj;
			//console.log('加载元数据服务地址:' + svcHttpPath);
		}
		if (metadataCache.hasOwnProperty(metadataHttpPath)) {
			console.error('元数据不能重复加载:' + fullFilePath);
			return false;
		}
		metadataCache[metadataHttpPath] = require(fullpath);
		console.log('加载元数据:' + fullFilePath);
		return true;
	},
	'setValidatorTypeCache': function() {
		let validatorPath = '.\\lib\\validator\\metadataTypeValidator';
		let dir;
		try {
			dir = fs.readdir(validatorPath);
		} catch (e) {
			console.error('无法加载元数据类型验证器');
			return false;
		}
		dir.forEach(function toDo(f) {
			if (f.isDirectory()) {
				return;
			} else {
				let extname = path.extname(f.name).toLowerCase();
				if (extname !== '.js') {
					return;
				}
				let typeValidatorName = f.name.substr(0,f.name.length-12);
				if(validatorTypeCache.hasOwnProperty(typeValidatorName)){
					return;
				}
				validatorTypeCache[typeValidatorName] = require(path.fullpath(path.fullpath(validatorPath+'\\'+f.name)));
				console.log('加载元数据类型验证器:' + typeValidatorName + 'Validator');
			}
		});
		return true;
	},
	'setFormatterTypeCache': function() {
		let formatterPath = '.\\lib\\formatter\\metadataTypeFormatter';
		let dir;
		try {
			dir = fs.readdir(formatterPath);
		} catch (e) {
			console.error('无法加载元数据类型格式化器');
			return false;
		}
		dir.forEach(function toDo(f) {
			if (f.isDirectory()) {
				return;
			} else {
				let extname = path.extname(f.name).toLowerCase();
				if (extname !== '.js') {
					return;
				}
				let typeFormatterName = f.name.substr(0,f.name.length-12);
				if(formatterTypeCache.hasOwnProperty(typeFormatterName)){
					return;
				}
				formatterTypeCache[typeFormatterName] = require(path.fullpath(path.fullpath(formatterPath+'\\'+f.name)));
				console.log('加载元数据类型格式化器:' + typeFormatterName + 'Formatter');
			}
		});
		return true;
	},
	'setActorCache': function(rootHttpPath) {
		
		let defaultActorPath = '.\\lib\\actor\\default';
		let setDefault = this.setDefaultActor(defaultActorPath);
		if(setDefault){
			console.log('加载元数据类型默认执行器全部完成');
		}

		let customActorPath = '.\\lib\\actor\\custom';
		let setCustom = this.setCustomActor(customActorPath,rootHttpPath);
		if(setCustom){
			console.log('加载元数据自定义执行器全部完成');
		}
		return setDefault && setCustom;
	},
	'setDefaultActor': function(defaultActorPath){
		let dir;
		try {
			dir = fs.readdir(defaultActorPath);
		} catch (e) {
			console.error('无法加载元数据类型默认执行器');
			return false;
		}
		dir.forEach(function toDo(f) {
			if (f.isDirectory()) {
				return;
			} else {
				let extname = path.extname(f.name).toLowerCase();
				if (extname !== '.js') {
					return;
				}
				let typeActorName = f.name.substr(0,f.name.length-8);
				if(actorCache.hasOwnProperty(typeActorName)){
					return;
				}
				actorCache[typeActorName] = require(path.fullpath(path.fullpath(defaultActorPath+'\\'+f.name)));
				console.log('加载元数据类型默认执行器:' + typeActorName + 'Actor');
			}
		});
		return true;
	},
	'setCustomActor': function(customActorPath,rootHttpPath){
		let dir;
		try {
			dir = fs.readdir(customActorPath);
		} catch (e) {
			console.error('无法加载元数据自定义执行器');
			return false;
		}
		dir.forEach(function toDo(f) {
			if (f.isDirectory()) {
				if (f.name !== '.' && f.name !== '..') {
					metadataRouter.setCustomActor(customActorPath+'\\'+f.name,rootHttpPath);
				}
			} else {
				let extname = path.extname(f.name).toLowerCase();
				if (extname !== '.js') {
					return;
				}
				let pathActorName = customActorPath.substr(18)+'\\'+f.name.substr(0,f.name.length-8);
				if(actorCache.hasOwnProperty(rootHttpPath+pathActorName)){
					return;
				}
				actorCache[rootHttpPath+pathActorName] = require(path.fullpath(path.fullpath(customActorPath+'\\'+f.name)));
				console.log('加载元数据自定义执行器:' + pathActorName + 'Actor');
			}
		});
		return true;
	},
	'verifyMetadataCache': function(index) {
		//console.log(metadataCache);
		for (let metadataHttpPath in metadataCache) {
			validator = metadataValidator.verifyMetadata(metadataCache[metadataHttpPath]);
			if (!validator.result) {
				console.error('元数据格式错误:' + '.\\metadata'+metadataHttpPath+'.json');
				delete metadataCache[metadataHttpPath];
				continue;
			}
			if(!actorCache.hasOwnProperty(metadataHttpPath) && !actorCache.hasOwnProperty(metadataCache[metadataHttpPath]['type'])){
				console.error('未找到元数据的执行器' + ':' + '.\\metadata'+metadataHttpPath+'.js');
				delete metadataCache[metadataHttpPath];
				continue;
			}
			metadataCache[metadataHttpPath] = metadataFormatter['formatMetadata'](metadataCache[metadataHttpPath], metadataHttpPath);
			if (!validatorTypeCache.hasOwnProperty(metadataCache[metadataHttpPath]['type'])) {
				console.error('未找到对应资源' + metadataCache[metadataHttpPath]['type'] + '的验证器');
				delete metadataCache[metadataHttpPath];
				continue;
			}
			validator = validatorTypeCache[metadataCache[metadataHttpPath]['type']]['verify'](metadataCache[metadataHttpPath], metadataPool);
			if (!formatterTypeCache.hasOwnProperty(metadataCache[metadataHttpPath]['type'])) {
				console.error('未找到对应资源' + metadataCache[metadataHttpPath]['type'] + '的格式化器');
				delete metadataCache[metadataHttpPath];
				continue;
			}
			if (metadataCache[metadataHttpPath]['type'] !== 'oDataSvc') {//对资源进行格式化
				metadataCache[metadataHttpPath] = formatterTypeCache[metadataCache[metadataHttpPath]['type']]['format'](metadataCache[metadataHttpPath]);
			}
			if (!validator.result) {
				console.error(validator['reMsg'] + ':' + 'metadata'+metadataHttpPath.substr(index)+'.json');
				delete metadataCache[metadataHttpPath];
				continue;
			}
		}
	},
	'createMetadataRouting':function(index){
		let arrMetadataCacheKeys = Object.keys(metadataCache);
		arrMetadataCacheKeys.sort();
		for (let keysIndex in arrMetadataCacheKeys) {//append资源到routing
			let metadataHttpPath = arrMetadataCacheKeys[keysIndex];
			let actor,actorType,svcType,routeReg;
			if(actorCache.hasOwnProperty(metadataHttpPath)){
				actor = actorCache[metadataHttpPath];
				actorType = '自定义类型'+metadataHttpPath.substr(index)+'Actor';
			}
			else{
				actor = actorCache[metadataCache[metadataHttpPath]['type']]
				actorType = '默认类型'+metadataCache[metadataHttpPath]['type']+'Actor';
			}
			if(metadataCache[metadataHttpPath]['type'] === 'oDataSvc'){
				metadataCache[metadataHttpPath] = formatterTypeCache[metadataCache[metadataHttpPath]['type']]['format'](metadataCache,metadataHttpPath);
				svcType = '到服务';
				routeReg = '^' + metadataHttpPath.replace(/\\/g, '/') + '(/)?$';
			}
			else{
				svcType = '.json到资源';
				routeReg = '^' + metadataHttpPath.replace(/\\/g, '/') + '(\\((.*)\\))?$';
			}
			
			routing.append(routeReg, function(objHttp) {
				//通过加入method关键词兼容不支持put，delete方法的浏览器
				objHttp.method = objHttp.query.hasOwnProperty('$method') ? encoding.decodeURI(objHttp.query['$method']).trim().toUpperCase() : objHttp.method;

				validator = httpConnectionValidator.verifyAll(objHttp, metadataCache[metadataHttpPath]);
				if (!validator.result) {
					objHttp.response.status = validator.reCode;
					objHttp.response.write(JSON.stringify(validator));
					return;
				}

				let actorReturn = actor[objHttp.method](objHttp, metadataCache[metadataHttpPath], metadataPool, contentType);

				objHttp.response.status = actorReturn.reCode;
				if(actorReturn.hasOwnProperty('header')){
					objHttp.response.addHeader(actorReturn['header']);
				}
				else{
					objHttp.response.addHeader('Content-type','text/html; charset=utf-8');
				}
				//objHttp.response.addHeader('Access-Control-Allow-Method','GET,POST');

				objHttp.response.write(actorReturn.reMsg);
				// console.warn(++memo);
				// profiler.saveSnapshot(memo+".heapsnapshot");
				// GC();
				return;
			});

			console.notice('映射'+'metadata'+metadataHttpPath.substr(index)+svcType+':'+metadataHttpPath.replace(/\\/g, '/')+'    Actor:'+actorType);
		}
	},
	'setMetadataCache': function(filePath, rootHttpPath, rootFilePath) {

		if (!fs.exists(filePath)) {
			console.log('元数据资源不存在');
		} else {
			let stat;
			try {
				stat = fs.stat(filePath);
			} catch (e) {
				console.log('无法获取元数据资源信息');
				return;
			}

			let baseHttpPath, baseFilePath, httpPath, currentFilePath;

			if (stat.isFile()) {
				baseFilePath = path.dirname(filePath);
			} else {
				baseFilePath = filePath;
			}

			if (!fs.exists(rootFilePath) || baseFilePath.indexOf(rootFilePath) !== 0) {
				let i = baseFilePath.lastIndexOf('\\');
				rootFilePath = baseFilePath.substr(0, i + 1);
				currentFilePath = baseFilePath.substr(i + 1);
			}

			rootHttpPath = rootHttpPath === 'undefined' ? currentFilePath : rootHttpPath;

			if (stat.isFile()) {
				metadataRouter.addMetadata(filePath, rootHttpPath);
			} else {
				let dir = fs.readdir(filePath);
				dir.forEach(function toDo(f) {
					if (f.isDirectory()) {
						if (f.name !== '.' && f.name !== '..') {
							metadataRouter.setMetadataCache(filePath + '\\' + f.name, rootHttpPath + '\\' + f.name, rootFilePath);
						}
					} else {
						let extname = path.extname(f.name).toLowerCase();
						if (extname !== '.json') {
							return;
						}
						metadataRouter.addMetadata(filePath + '\\' + f.name, rootHttpPath);
					}
				});
			}
		}
	},
	'addDefaultRouting': function(rootHttpPath) {
		if (!isAddDefaultRouter) {
			routing.append('^(/.*)$', function(objHttp) {
				objHttp.response.status = 404;
				objHttp.response.addHeader('Content-type','text/html; charset=utf-8');
				objHttp.response.write('没有资源映射到这个地址');
			});

			isAddDefaultRouter = true;

			if(this.setValidatorTypeCache()){
				console.log('加载元数据类型验证器全部成功');
			}
			else{
				console.error('加载元数据类型验证器发生错误');
				return false;
			}
			if(this.setFormatterTypeCache()){
				console.log('加载元数据类型格式化器全部成功');
			}
			else{
				console.error('加载元数据类型格式化器发生错误');
				return false;
			}
			if(this.setActorCache(rootHttpPath)){
				console.log('加载元数据执行器全部成功');
			}
			else{
				console.error('加载元数据类型执行器发生错误');
				return false;
			}
			
			return true;
		}
	}
}

module.exports = metadataRouterExports;