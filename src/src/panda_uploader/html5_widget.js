
PandaUploader.HTML5Widget = function() {
};

PandaUploader.HTML5Widget.prototype = new PandaUploader.BaseWidget();
PandaUploader.HTML5Widget.prototype.constructor = PandaUploader.HTML5Widget;

PandaUploader.HTML5Widget.prototype.init = function() {
    PandaUploader.BaseWidget.prototype.init.apply(this, arguments);
    
    this.xhr = PandaUploader.createXRequestObject();
    this.xhr.upload.addEventListener('loadstart', PandaUploader.bind(this.upload_strategy, 'onloadstart'), false);
    this.xhr.upload.addEventListener('progress', PandaUploader.bind(this.upload_strategy, 'onprogress'), false);
    this.xhr.upload.addEventListener('load', PandaUploader.bind(this.upload_strategy, 'onload'), false);
    this.xhr.upload.addEventListener('error', PandaUploader.bind(this.upload_strategy, 'onerror'), false);
    this.xhr.upload.addEventListener('abort', PandaUploader.bind(this.upload_strategy, 'onabort'), false);
    this.xhr.addEventListener('readystatechange', PandaUploader.bind(this.upload_strategy, 'onreadystatechange'), false);

    this.query.after('<input type="file" />');
    $(this.getField()).change(PandaUploader.bind(this.upload_strategy, 'onchange'));
    
    this.upload_strategy.onwidgetload();
};

PandaUploader.HTML5Widget.prototype.getForm = function() {
    return this.query.parents('form').get(0);
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
    this.xhr.setRequestHeader("X-Panda-Params", json_string);
    this.xhr.send(file);
};

PandaUploader.HTML5Widget.prototype.getFile = function() {
    return $(this.getField()).get(0).files[0];
};

PandaUploader.HTML5Widget.prototype.setValue = function(value) {
    return this.query.val(value);
};

PandaUploader.HTML5Widget.prototype.disable = function() {
    $(this.getField()).attr('disabled', true);
};

PandaUploader.HTML5Widget.prototype.enable = function() {
    $(this.getField()).removeAttr('disabled');
};

PandaUploader.HTML5Widget.prototype.getField = function() {
    return this.query.next().get(0);
};
