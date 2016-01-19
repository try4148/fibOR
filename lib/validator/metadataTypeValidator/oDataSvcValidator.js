/*
 * @author 刀叉4148
 *----------------------------------
 * 对元数据type为oDataSvc的content部分进行验证
 */

'use strict';

let oDataSvcValidator = {
	'verify': function() {
		let objReturn = new Object();
		objReturn['result'] = true;
		objReturn['reMsg'] = '';
		objReturn['reCode'] = 0;
		return objReturn;
	}
}

module.exports = oDataSvcValidator;