var fibor = {
  keywords: {
    'eq': 'name eq value',
    'ne': 'name ne value',
    'gt': 'name gt value',
    'ge': 'name ge value',
    'lt': 'name lt value',
    'le': 'name le value',
    'contains': 'contains(name,value)',
    'not contains': 'not contains(name,value)',
    'startswith': 'startswith(name,value)',
    'not startswith': 'not startswith(name,value)',
    'endswith': 'endswith(name,value)',
    'not endswith': 'not endswith(name,value)'
  },
  getElements: function(formId) {
    var form = document.getElementById(formId);
    var elements = new Array();
    var tagElements = form.getElementsByTagName('input');
    for (var j = 0; j < tagElements.length; j++) {
      elements.push(tagElements[j]);
    }
    return elements;
  },
  inputSelector: function(element) {
    var e = new Object();
    if (element.checked) {
      e['name'] = element.name;
      e['value'] = element.value;
      e['type'] = element.getAttribute('metatype');
      e['keyword'] = element.getAttribute('keyword');
      return e;
    }
    //alert(JSON.stringify(e));
    return false;
  },
  input: function(element) {
    var e = new Object();
    var value = element.value;
    if (!value || value.trim() === '') {
      return false;
    }
    switch (element.type.toLowerCase()) {
      case 'file':
        var pos = value.lastIndexOf('\\');
        value = value.substring(pos + 1);
      case 'hidden':
      case 'password':
      case 'text':
        e['name'] = element.name;
        e['value'] = value;
        e['type'] = element.getAttribute('metatype');
        e['keyword'] = element.getAttribute('keyword');
        return e;
      case 'checkbox':
      case 'radio':
        return this.inputSelector(element);
    }
    return false;
  },
  serialize: function(formId) {
    var method = document.getElementById(formId).getAttribute('method');
    var elements = this.getElements(formId);
    var fibor = new Object();

    if (!method) {
      return JSON.stringify(fibor);
    }
    if (method.toLowerCase() !== 'put' && method.toLowerCase() !== 'post' && method.toLowerCase() !== 'get') {
      return JSON.stringify(fibor);
    }
    var ret = '';
    if (method.toLowerCase() === 'get') {
      for (var i = 0; i < elements.length; i++) {
        var obj = this.input(elements[i]);
        if (obj.hasOwnProperty('name') && obj.hasOwnProperty('value') && obj.hasOwnProperty('type') && obj.hasOwnProperty('keyword')) {
          if (obj.type !== 'number' && obj.type !== 'string' && obj.type !== 'datetime') {
            continue;
          }
          if (obj.name === '') {
            continue;
          }
          if (obj.value === '') {
            continue;
          }
          if (!this.keywords.hasOwnProperty(obj.keyword)) {
            continue;
          }

          var v = obj.value;
          if (obj.type === 'string') {
            v = "'" + v + "'";
          }
          if (obj.type === 'datetime') {
            v = "datetime'" + v + "'";
          }

          var t = this.keywords[obj.keyword].replace('value', v).replace('name', obj.name);
          ret = ret === '' ? ret + t : ret + ' and ' + t;
        }
      }
    } else {
      for (var i = 0; i < elements.length; i++) {
        var obj = this.input(elements[i]);
        if (obj.hasOwnProperty('name') && obj.hasOwnProperty('value') && obj.hasOwnProperty('type')) {
          if (obj.type !== 'number' && obj.type !== 'string' && obj.type !== 'datetime' && obj.type !== 'binary') {
            continue;
          }
          if (obj.name === '') {
            continue;
          }
          var v = obj.value;
          if (obj.type === 'string') {
            v = "'" + v + "'";
          }
          if (obj.type === 'datetime') {
            v = "datetime'" + v + "'";
          }
          if (obj.type === 'binary') {
            v = "binary'" + v + "'";
          }
          fibor[obj.name] = v;
        }
      }

      if (method.toLowerCase() === 'put') {
        ret = JSON.stringify(fibor);
      } else {
        var arr = new Array();
        arr.push(fibor);
        ret = JSON.stringify(arr);
      }
    }

    return ret;
  }
}