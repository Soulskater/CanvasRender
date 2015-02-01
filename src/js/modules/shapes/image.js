registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents an image, inherits from object
 */
RenderJs.Canvas.Shapes.Image = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {

        this.base(options);
        /*
         * Locals
         */
        var _image = document.createElement("img");
        _image.src = options.url;
        _image.onload = function () {
            self.width = _image.width;
            self.height = _image.height;
            _loaded = true;
        };
        var _loaded = false;
        var _blurRadius = options.blurRadius || 0;
        var _cache = options.cache == undefined ? true : options.cache;
        var _filterCache = null;
        var self = this;

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         */
        this.draw = function (ctx) {
            if (!_loaded) {
                return;
            }

            if (!_filterCache) {
                for (var i = 0; i < this.filters.length; i++) {
                    switch (this.filters[i]) {
                        case RenderJs.Canvas.Filters.Blur:
                            _filterCache = RenderJs.Canvas.Filters.Blur(_image, _blurRadius);
                            break;
                    }
                }
            }
            if (_filterCache) {
                ctx.putImageData(_filterCache, this.pos.x, this.pos.y);
            }
            else {
                ctx.drawImage(_image, this.pos.x, this.pos.y);
            }
            if (!_cache)
                _filterCache = null;
        };
    });