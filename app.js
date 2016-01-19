/*
 * @author 刀叉4148
 */

'use strict';

let http = require('http');
let metadataRouter = require('./lib/router/metadataRouter.js');

metadataRouter.addRouting('');

let svr = new http.Server(80,metadataRouter.getRouting);
console.log('fibOR服务开始运行');
svr.run();

