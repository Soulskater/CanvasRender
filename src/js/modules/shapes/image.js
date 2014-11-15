var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};
/*
*Represents an image, inherits from shape
*/
RenderJs.Canvas.Shapes.Image = function (options) {
    /*
     * Locals
     */
    var _image = document.createElement("img");
    var _loaded = false;
    var _blurRadius = 0;
    var _cache = true;
    var _filterCache = null;

    /*
    *Constructor
    */
    var _init = function (options) {
        var self = this;
        var options = options || {};

        this._baseInit(options);
        _image.src = options.url;
        _blurRadius = options.blurRadius || 0;
        _cache = options.cache == undefined ? true : options.cache;
        _filterCache = null;
        _image.onload = function () {
            self.width = _image.width;
            self.height = _image.height;
            _loaded = true;
        };
    }

    /*
    *Function is called in every frame to redraw itself
    *-ctx is the drawing context from a canvas
    */
    this.draw = function (ctx) {
        if (!_loaded) return;

        if (!_filterCache)
            for (var i = 0; i < this.filters.length; i++) {
                switch (this.filters[i]) {
                    case RenderJs.Canvas.Filters.Blur:
                        _filterCache = RenderJs.Canvas.Filters.Blur(_image, _blurRadius);
                        break;
                }
            }
        if (_filterCache)
            ctx.putImageData(_filterCache, this.pos.x, this.pos.y);
        else
            ctx.drawImage(_image, this.pos.x, this.pos.y);
        if (!_cache)
            _filterCache = null;
    }

    _init.call(this, options);
}

RenderJs.Canvas.Shapes.Image.prototype = new RenderJs.Canvas.Object();
RenderJs.Canvas.Shapes.Image.constructor = RenderJs.Canvas.Shapes.Image;