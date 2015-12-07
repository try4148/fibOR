'use strict';

var skip = '1';

var skipParser = function(skip){
	var r = '0';
	skip = skip.trim();
	if(!isNaN(skip)){
		if(parseInt(skip).toString() === skip)
		{
			r = skip;
		}
	}
	return r;
}

console.log(skipParser(skip));