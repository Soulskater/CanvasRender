/***************************************************************
 *
 *   EventManager
 *
 ***************************************************************/
var EventManager;
(EventManager = function () {
}).prototype = {
    subscribe: function (type, method, scope, context) {
        var listeners, handlers, scope;
        if (!(listeners = this.listeners)) {
            listeners = this.listeners = {};
        }
        if (!(handlers = listeners[type])) {
            handlers = listeners[type] = [];
        }
        scope = (scope ? scope : window);
        var id = Utils.getGuid();
        handlers.push({
            id: id,
            method: method,
            scope: scope,
            context: (context ? context : scope)
        });
        return id;
    },
    hasSubscribers: function (type) {
        return this.listeners && this.listeners[type] && this.listeners[type].length > 0;
    },
    unSubscribe: function (type, id) {
        var i = this.listeners[type].length;
        var handler = null;
        while (!handler && i--) {
            if (this.listeners[type][i].id === id)
                handler = this.listeners[type][i];
        }
        if (!handler) return;
        this.listeners[type].splice(i, 1);
    },
    trigger: function (type, data, context) {
        var listeners, handlers, i, n, handler, scope;
        data = data instanceof Array ? data : [data];
        if (!(listeners = this.listeners)) {
            return;
        }
        if (!(handlers = listeners[type])) {
            return;
        }
        for (i = 0, n = handlers.length; i < n; i++) {
            handler = handlers[i];
            if ((typeof (context) !== "undefined" && context !== handler.context) || !handler) continue;
            if (handler.method.apply(
                handler.scope, data
            ) === false) {
                return false;
            }
        }
        return true;
    }
};

function Observable(initial) {

    var update = function (value) {
        if (arguments.length > 0) {
            update._value = arguments[0];
            for (var i = 0; i < update._subscribers.length; i++) {
                update._subscribers[i](update._value);
            }
        }
        return update._value;
    };

    update._value = initial;
    update._subscribers = [];
    update.subscribe = function (callback) {
        update._subscribers.push(callback);
    };

    update.unSubscribe = function (callback) {
        update._subscribers.splice(update._subscribers.indexOf(callback), 1);
    };

    return update;
}