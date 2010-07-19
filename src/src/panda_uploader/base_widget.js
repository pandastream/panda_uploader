
PandaUploader.BaseWidget = function() {
};
PandaUploader.BaseWidget.prototype = {
    init: function(query, signed_params, options) {
        this.query = query;
        this.signed_params = signed_params;
        this.options = options;
        this.upload_strategy = this.options.upload_strategy;
    },
    
    triggerEvent: function(event_name, args) {
        var handler = this.upload_strategy[event_name];
        if (handler) {
            if ( ! args) {
                args = [];
            }
            handler.apply(this.upload_strategy, args);
            var user_handler = this.options[event_name];
            if (user_handler) {
                user_handler(arguments)
            }
        }
    },
    
    boundHandler: function(event_name) {
        var triggerEvent = PandaUploader.bind(this, 'triggerEvent');
        return function() {
            triggerEvent(event_name, arguments);
        };
    },
    
    getForm: function() {
        throw "Unimplemented method getForm()";
    },
    
    getSignedParams: function() {
        return this.signed_params.call ? this.signed_params() : this.signed_params;
    },
    
    start: function() {
        throw "Unimplemented method start()";
    },
    
    disable: function() {
        throw "Unimplemented method disable()";
    },
    
    enable: function() {
        throw "Unimplemented method enable()";
    },
    
    cancel: function() {
        throw "Unimplemented method cancel()";
    },
    
    setValue: function(value) {
        throw "Unimplemented method setValue()";
    },
    
    getValue: function() {
        throw "Unimplemented method getValue()";
    }
};
