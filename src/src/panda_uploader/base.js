function PandaUploader(){}

PandaUploader.getHttpStatusText = function(statusCode) {
    return {
        400: "Bad Request",
        401: "Unauthorized",
        404: "Not Found",
        412: "Precondition Failed",
        415: "Unsupported Media Type",
        500: "Internal Server Error"
    }[statusCode*1]
};

PandaUploader.getPandaError = function(statusCode) {
    return {
        400: "BadRequest",
        401: "NotAuthorized",
        404: "RecordNotFound",
        412: "CannotDelete",
        415: "FormatNotRecognised",
        500: "PandaError"
    }[statusCode*1]
}

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

PandaUploader.log = function() {
    // override method to print debug information
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

PandaUploader.sizeInBytes = function(size) {
  var m = size.match(new RegExp("([0-9]+)([GKM]?B)?"));

  if ( ! m) {
    return null
  }

  var value = m[1];
  var units = m[2];
  var ex = 1;
  switch(units) {
  case 'B': ex = 0; break;
  case 'MB': ex = 2; break;
  case 'GB': ex = 3; break;
  }

  return value*Math.pow(1024, ex);
}

