registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Stage = inject("Utils", "EventDispatcher", "LinkedList")
    .class(function (utils, dispatcher, linkedList, options) {

        var _container = options.container || "viewport";
        var _dispatcher = new dispatcher();
        this.layers = new linkedList();

        this.position = new RenderJs.Vector(-50, -50);

        var _invalidate = function () {
            var self = this;

            var enumerator = this.layers.getEnumerator();
            while (enumerator.next() !== undefined) {
                enumerator.current().drawObjects(this.position);
            }

            requestAnimationFrame(function () {
                _invalidate.call(self);
            });
        };
        _invalidate.call(this);

        this.resize = function (width, height) {
            this.width = width;
            this.height = height;
            document.getElementById(_container).style.width = this.width + "px";
            document.getElementById(_container).style.height = this.height + "px";
            var enumerator = this.layers.getEnumerator();
            while (enumerator.next() !== undefined) {
                enumerator.current().resize(width, height);
            }
        };

        this.onInvalidate = function (handler) {
            return _dispatcher.subscribe("onInvalidate", handler);
        };

        this.createLayer = function (active) {
            var layer = new RenderJs.Canvas.Layer(_container, this.width, this.height, active);
            this.layers.append(layer);

            return layer;
        };

        this.resize(options.width || 1200, options.height || 800);
    });