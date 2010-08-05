
PandaUploader.HTML5Widget = function() {
};

PandaUploader.HTML5Widget.prototype = new PandaUploader.BaseWidget();
PandaUploader.HTML5Widget.prototype.constructor = PandaUploader.HTML5Widget;

PandaUploader.HTML5Widget.prototype.init = function() {
    PandaUploader.BaseWidget.prototype.init.apply(this, arguments);
    
    this.xhr = PandaUploader.createXHRObject();
    this.xhr.upload.addEventListener('loadstart', this.boundHandler('onloadstart'), false);
    this.xhr.upload.addEventListener('progress', this.boundHandler('onprogress'), false);
    this.xhr.upload.addEventListener('load', this.boundHandler('onload'), false);
    this.xhr.upload.addEventListener('error', this.boundHandler('onerror'), false);
    this.xhr.upload.addEventListener('abort', this.boundHandler('onabort'), false);
    this.xhr.addEventListener('readystatechange', PandaUploader.bind(this, 'onreadystatechange'), false);

    this.query.after('<input type="file" />');
    jQuery(this.getField()).change(this.boundHandler('onchange'));
    
    this.triggerEvent('onwidgetload');
};

PandaUploader.HTML5Widget.prototype.start = function() {
    var file = this.getFile();
    var params = this.getSignedParams();
    var json_string = '{"access_key":"' + params.access_key + '", "cloud_id":"' + params.cloud_id + '", "timestamp":"' + params.timestamp + '", "signature":"' + params.signature + '"}';
    this.xhr.open('POST', this.options.api_url + '/videos.json', true);
    this.xhr.setRequestHeader("Cache-Control", "no-cache");
    this.xhr.setRequestHeader("Content-Type", "application/octet-stream");
    this.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    this.xhr.setRequestHeader("X-File-Name", file.fileName);
    this.xhr.setRequestHeader("X-Query-Params", json_string);
    this.xhr.send(file);
};

PandaUploader.HTML5Widget.prototype.abort = function() {
    this.xhr.abort();
}

PandaUploader.HTML5Widget.prototype.getFile = function() {
    return jQuery(this.getField()).get(0).files[0];
};

PandaUploader.HTML5Widget.prototype.setValue = function(value) {
    return this.query.val(value);
};

PandaUploader.HTML5Widget.prototype.disable = function() {
    jQuery(this.getField()).attr('disabled', true);
};

PandaUploader.HTML5Widget.prototype.enable = function() {
    jQuery(this.getField()).removeAttr('disabled');
};

PandaUploader.HTML5Widget.prototype.getField = function() {
    return this.query.next().get(0);
};

PandaUploader.HTML5Widget.prototype.onreadystatechange = function(event) {
    this.triggerEvent('onreadystatechange', arguments);

    var status = null;

    try {
        status = event.target.status;
    }
    catch(e) {
        return;
    }

    if (status == '200' && event.target.responseText) {
        var response = PandaUploader.parseJSON(event.target.responseText);
        this.setValue(response.id);
        this.triggerEvent('onsuccess', [event]);
    }
}
