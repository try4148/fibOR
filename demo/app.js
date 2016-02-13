/*
 * @author 刀叉4148
 */

'use strict';

let http = require('http');
let metadataRouter = require('./lib/router/metadataRouter.js');

let routing;
console.warn('映射fibOR路径');
metadataRouter.addRouting('fibor');
routing = metadataRouter.getRouting();
console.warn('映射其他路径');
routing.append('^/midi(/.*)', http.fileHandler('./midi'))
console.notice('映射示例路径到/midi/');

let svr = new http.Server(80, routing);
svr.crossDomain = true;
console.log('fibOR服务开始运行');
svr.run();