'use strict';

var top = '2';

var topParser = function(top){
	var r = '0';
	top = top.trim();
	if(!isNaN(top)){
		if(parseInt(top).toString() === top)
		{
			r = top;
		}
	}
	return r;
}

console.log(topParser(top));