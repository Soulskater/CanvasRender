var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Stage = function (options) {
    /*
     * Locals
     */
    var _container = "viewport";
    var _currentFps = 0;
    var _eventManager = new EventManager();

    var _invalidate = function () {
        var self = this;
        _currentFps = Utils.getFps();
        //_fpsStat.text(Math.floor(_currentFps));

        var enumerator = this.layers.getEnumerator();
        while (enumerator.next() !== undefined) {
            enumerator.current().drawObjects(_currentFps);
        }

        requestAnimationFrame(function () {
            _invalidate.call(self);
        });
    };

    this.layers = new LinkedList();
    this.width = 1200;
    this.height = 800;
    this.position = RenderJs.Vector(50, 50);

    var _init = function (options) {
        _container = options.container || _container;
        this.width = options.width || 1200;
        this.height = options.height || 800;

        document.getElementById(_container).style.width = this.width + "px";
        document.getElementById(_container).style.height = this.height + "px";

        _invalidate.call(this);
    };

    this.onInvalidate = function (handler) {
        _eventManager.subscribe("onInvalidate", handler);
    };

    this.createLayer = function (active) {
        var layer = new RenderJs.Canvas.Layer(_container, this.width, this.height, active);
        this.layers.append(layer);

        return layer;
    };

    _init.call(this, options);
}