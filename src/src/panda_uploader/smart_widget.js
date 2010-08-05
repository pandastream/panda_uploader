
PandaUploader.SmartWidget = function(html5_opts, flash_opts) {
    if (PandaUploader.supportHTML5Widget()) {
        return new PandaUploader.HTML5Widget(html5_opts);
    }
    else {
        return new PandaUploader.FlashWidget(flash_opts);
    }
};