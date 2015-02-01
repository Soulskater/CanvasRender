registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Stage = inject("Utils", "EventDispatcher", "LinkedList")
    .class(function (utils, dispatcher, linkedList, options) {

        var _container = options.container || "viewport";
        var _currentFps = 0;
        var _dispatcher = new dispatcher();
        this.layers = new linkedList();
        this.width = options.width || 1200;
        this.height = options.height || 800;
        this.position = new RenderJs.Vector(-50, -50);
        document.getElementById(_container).style.width = this.width + "px";
        document.getElementById(_container).style.height = this.height + "px";

        var _invalidate = function () {
            var self = this;
            _currentFps = utils.getFps();

            var enumerator = this.layers.getEnumerator();
            while (enumerator.next() !== undefined) {
                enumerator.current().drawObjects(_currentFps, this.position);
            }

            requestAnimationFrame(function () {
                _invalidate.call(self);
            });
        };
        _invalidate.call(this);

        this.onInvalidate = function (handler) {
            return _dispatcher.subscribe("onInvalidate", handler);
        };

        this.createLayer = function (active) {
            var layer = new RenderJs.Canvas.Layer(_container, this.width, this.height, active);
            this.layers.append(layer);

            return layer;
        };
    });