var Utils = (function (module) {

    module.getGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    module.parseUrl = function (url) {
        var parser = document.createElement('a');
        parser.href = url;
        return {
            protocol: parser.protocol,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            hash: parser.hash,
            host: parser.host
        };
    };

    module.sleep = function (seconds) {
        var date = new Date();
        while (new Date() - date < seconds * 1000)
        { }
    };

    return module;
}(Utils || {}));