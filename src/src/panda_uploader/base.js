function PandaUploader(){}

PandaUploader.supportFileAPI = function() {
    var fi = document.createElement('INPUT');
    fi.type = 'file';
    return 'files' in fi;
};

PandaUploader.supportAjaxUploadProgressEvents = function() {
    var xhr = PandaUploader.createXHRObject();
    return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
}

PandaUploader.supportCORS = function() {
    if (typeof XDomainRequest != 'undefined') {
        return true;
    }
    else if (typeof XMLHttpRequest != 'undefined') {
        var ret = new XMLHttpRequest()
        return 'withCredentials' in ret;
    }
    else {
        return null;
    }
};

PandaUploader.supportHTML5Widget = function() {
    return PandaUploader.supportFileAPI() &&
      PandaUploader.supportAjaxUploadProgressEvents() &&
      PandaUploader.supportCORS();
};

// A variation of PPK's http://www.quirksmode.org/js/xmlhttp.html
PandaUploader.createXHRObject = function() {
    if (typeof this.XMLHttpFactories == 'undefined') {
        this.XMLHttpFactories = [
            function () { return new XDomainRequest(); },
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
            function () { return new ActiveXObject("Msxml3.XMLHTTP"); },
            function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
        ];
    }

    var xmlhttp = null;
    for (var i = 0; i < this.XMLHttpFactories.length; i++) {
        try {
            xmlhttp = this.XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    
    return xmlhttp;
};

PandaUploader.bind = function(object, method_name) {
    return function() {
        var method = object[method_name];
        if (method) {
            return method.apply(object, arguments);
        }
    }
};

PandaUploader.alert = function(msg) {
    return alert(msg);
};

PandaUploader.parseJSON = function(json_str) {
  if (jQuery && jQuery.parseJSON) {
      return jQuery.parseJSON(json_str);
  }
  else {
      return eval('(' + json_str + ')');
  }
};

PandaUploader.toJSON = function(hash) {
    var pairs = [];
    jQuery.each(hash, function(key, value) {
        pairs.push('"' + escape(key) + '":"' + escape(value) + '"');
    });
    return '{' + pairs.join(',') + '}';
    
    function escape(string) {
        return string.replace(new RegExp('"', 'g'), '\\"');
    }
}
