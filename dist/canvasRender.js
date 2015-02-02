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
var Utils = (function (module) {
    "use strict";

    module.convertToRad = function (deg) {
        return deg * (Math.PI / 180);
    };
    var lastUpdate = (new Date) * 1 - 1;

    module.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    module.getCanvas = function (w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    module.getPixels = function (img) {
        var c, ctx;
        if (img.getContext) {
            c = img;
            try {
                ctx = c.getContext('2d');
            } catch (e) {
            }
        }
        if (!ctx) {
            c = Utils.getCanvas(img.width, img.height);
            ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
        }
        return ctx.getImageData(0, 0, c.width, c.height);
    }

    module.getFps = function () {
        var now = new Date;
        var fps = 1000 / (now - lastUpdate);
        //fps += (thisFrameFPS - fps) / refFps;
        lastUpdate = now;

        return fps;
    }

    return module;
}(Utils || {}));
var Utils = (function (module) {

    module.isNumber = function (value) { return !isNaN(value); }

    return module;
}(Utils || {}));

var LinkedList = function () {
    "use strict";
    var nodes = [];

    this.length = function () {
        return nodes.length;
    };
    this.first = function () {
        return nodes[0];
    };
    this.last = function () {
        return nodes[nodes.length - 1];
    };

    this.buildList = function (nodes) {
        for (var i = 0, length = nodes.length; i < length; i++) {
            if (i === 0) {
                this.first = nodes[i];
            }
            if (i === length - 1) {
                this.last = nodes[i];
            }

            nodes[i].prev = nodes[i - 1];
            nodes[i].next = nodes[i + 1];
            nodes.push(nodes[i]);
        }
    }

    this.append = function (node) {
        var last = this.last();

        if (nodes.length > 0) {
            last.next = node;
            node.prev = last;
        }
        nodes.push(node);
    };

    this.getEnumerator = function () {
        var index = -1;
        return {
            current: function () {
                return nodes[index];
            },
            next: function () {
                if (index === nodes.length - 1) return;
                return nodes[++index];
            },
            prev: function () {
                if (index === 0) {
                    return;
                }
                return nodes[index--];
            }
        };
    };
}
//
//Register types
dependencyContainer.registerType("jQuery", $);
dependencyContainer.registerType("linq", linq);
dependencyContainer.registerType("Utils", Utils);
dependencyContainer.registerType("EventDispatcher", EventDispatcher);
dependencyContainer.registerType("LinkedList", LinkedList);
/**
 * Created by gmeszaros on 1/28/2015.
 */

//
//Register types
dependencyContainer.registerType("jQuery", jQuery);
dependencyContainer.registerType("linq", linq);


//In use
var canvas = injector("jQuery", "linq").class(function ($, linq) {
    debugger;
});
registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Animation = inject()
    .class(function (handler, layer) {

        var time = 0;
        var subscriber;
        var started = false;
        var stopped = false;
        var paused = false;

        var animation = function (frameRate) {
            handler({
                frameRate: frameRate,
                lastTime: time,
                time: time + 1000 / frameRate
            });
            time += 1000 / frameRate;
        };

        this.start = function () {
            if (started) {
                return;
            }
            started = true;
            stopped = paused = false;
            subscriber = layer.on("animate", animation);
        };

        this.reset = function () {
            time = 0;
        };

        this.pause = function () {
            if (started && subscriber) {
                subscriber();
            }

            started = false;
            paused = true;
        };

        this.stop = function () {
            if (started && subscriber) {
                this.reset();
                subscriber();
            }
            started = false;
            stopped = true;
        };
    });
registerNamespace("RenderJs.Canvas.Filters");

RenderJs.Canvas.Filters.Convolute = function (image, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);
    var pixels = Utils.getPixels(image);
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;
    var output = Utils.getCanvas(w, h).getContext("2d").createImageData(w, h);
    var dst = output.data;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var sy = y;
            var sx = x;
            var dstOff = (y * w + x) * 4;
            // calculate the weighed sum of the source image pixels that
            // fall under the convolution matrix
            var r = 0, g = 0, b = 0, a = 0;
            for (var cy = 0; cy < side; cy++) {
                for (var cx = 0; cx < side; cx++) {
                    var scy = sy + cy - halfSide;
                    var scx = sx + cx - halfSide;
                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                        var srcOff = (scy * sw + scx) * 4;
                        var wt = weights[cy * side + cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff + 1] * wt;
                        b += src[srcOff + 2] * wt;
                        a += src[srcOff + 3] * wt;
                    }
                }
            }
            dst[dstOff] = r;
            dst[dstOff + 1] = g;
            dst[dstOff + 2] = b;
            dst[dstOff + 3] = a + alphaFac * (255 - a);
        }
    }
    return output;
}

RenderJs.Canvas.Filters.Blur = function (image, blurRadius) {
    return stackBlurImage(image, blurRadius);
}

RenderJs.Canvas.Filters.Grayscale = function (image, args) {
    var pixels = Utils.getPixels(image);
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        // CIE luminance for the RGB
        var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        d[i] = d[i + 1] = d[i + 2] = v
    }
    return pixels;
};

RenderJs.Canvas.Filters.Brightness = function (image, adjustment) {
    var pixels = Utils.getPixels(image);
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        d[i] += adjustment;
        d[i + 1] += adjustment;
        d[i + 2] += adjustment;
    }
    return pixels;
};

RenderJs.Canvas.Filters.Threshold = function (image, threshold) {
    var pixels = Utils.getPixels(image);
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
        var r = d[i];
        var g = d[i + 1];
        var b = d[i + 2];
        var v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = v
    }
    return pixels;
};

registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Layer = inject("Utils", "EventDispatcher", "jQuery")
    .class(function (utils, dispatcher, $, container, width, height, active) {

        var _self = this;
        var _initialized = false;
        var _forceRender = false;
        var _dispatcher = new dispatcher();
        var _time = 0;

        this.canvas = document.createElement("canvas");
        document.getElementById(container).appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = width;
        this.canvas.height = height;
        this.active = active;
        //For the linked list
        this.prev = null;
        this.next = null;

        //Array of objects on the layer
        this.objects = [];


        var _clickHandler = function (event, position) {
            position = position || Utils.getMousePos(event.target, event);
            _dispatcher.trigger(RenderJs.Canvas.Events.click, [event, position]);
            for (var i = this.objects.length - 1; i >= 0; i--) {
                if (RenderJs.Physics.Collisions.pointInObject(position, this.objects[i])) {
                    this.objects[i].trigger(RenderJs.Canvas.Events.click, event)
                    return true;
                }
            }
            if (this.prev) {
                $(this.prev.canvas).trigger("click", position);
            }
        };

        var _mousemoveHandler = function (event, position) {
            position = position || Utils.getMousePos(event.target, event);
            _dispatcher.trigger(RenderJs.Canvas.Events.mousemove, [event, position]);
            for (var i = this.objects.length - 1; i >= 0; i--) {
                if (RenderJs.Physics.Collisions.pointInObject(position, this.objects[i])) {
                    this.objects[i].trigger(RenderJs.Canvas.Events.mousemove, [event, position])
                    return true;
                }
            }
            if (this.prev) {
                $(this.prev.canvas).trigger("mousemove", position);
            }
        };

        var _mouseenterHandler = function (event, position) {
            position = position || Utils.getMousePos(event.target, event);
            _dispatcher.trigger(RenderJs.Canvas.Events.mouseenter, [event, position]);
            for (var i = this.objects.length - 1; i >= 0; i--) {
                if (RenderJs.Physics.Collisions.pointInObject(position, this.objects[i])) {
                    this.objects[i].trigger(RenderJs.Canvas.Events.mouseenter, [event, position])
                    return true;
                }
            }
            if (this.prev) {
                $(this.prev.canvas).trigger("mouseenter", position);
            }
        };

        var _mouseleaveHandler = function (event, position) {
            position = position || Utils.getMousePos(event.target, event);
            _dispatcher.trigger(RenderJs.Canvas.Events.mouseleave, [event, position]);
            for (var i = this.objects.length - 1; i >= 0; i--) {
                if (RenderJs.Physics.Collisions.pointInObject(position, this.objects[i])) {
                    this.objects[i].trigger(RenderJs.Canvas.Events.mouseleave, [event, position]);
                    return true;
                }
            }
            if (this.prev) {
                $(this.prev.canvas).trigger("mouseleave", position);
            }
        };

        var _keydownHandler = function (event) {
            _dispatcher.trigger(RenderJs.Canvas.Events.keydown, event);
        };

        var _keyupHandler = function (event) {
            _dispatcher.trigger(RenderJs.Canvas.Events.keyup, event);
        };

        var _keypressHandler = function (event) {
            _dispatcher.trigger(RenderJs.Canvas.Events.keypress, event);
        };
        //
        //Event wireups
        $(this.canvas).on("click", function (event, position) {
            _clickHandler.call(_self, event, position);
        });

        $(this.canvas).on("mousemove", function (event, position) {
            _mousemoveHandler.call(_self, event, position);
        });

        $(this.canvas).on("mouseenter", function (event, position) {
            _mouseenterHandler.call(_self, event, position);
        });

        $(this.canvas).on("mouseleave", function (event, position) {
            _mouseleaveHandler.call(_self, event, position);
        });

        $(document).on("keydown", function (event) {
            _keydownHandler.call(_self, event);
        });

        $(document).on("keyup", function (event) {
            _keyupHandler.call(_self, event);
        });

        $(document).on("keypress", function (event) {
            _keypressHandler.call(_self, event);
        });

        this.on = function (type, handler) {
            if (!RenderJs.Canvas.Events[type]) {
                return;
            }
            return _dispatcher.subscribe(type, handler);
        };

        //Add an object to the layer, it will be rendered on this layer
        this.addObject = function (object) {
            if (!(object instanceof RenderJs.Canvas.Object)) {
                throw new Error("An object on the canvas should be inherited from CanvasObject!");
            }
            object.layer = this;
            this.objects.push(object);
        };

        this.removeObject = function (object) {
            linq(this.objects).remove(function (item) {
                return item === object;
            });
            object.dispose();
            _forceRender = true;
        };

        this.resize = function (width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            _forceRender = true;
        };

        //Returns true if the layer has sprite objects otherwise false
        this.hasSprites = function () {
            for (var i = 0, length = this.objects.length; i < length; i++) {
                if (this.objects[i] instanceof RenderJs.Canvas.Shapes.Sprite) {
                    return true;
                }
            }
            return false;
        };

        //Redraw objects on layers if it's active
        this.drawObjects = function (frame, absPosition) {
            if (!_forceRender && ((_initialized && !_dispatcher.hasSubscribers('animate') && !this.hasSprites(this) && !this.active) || this.objects.length === 0)) {
                return;
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var aktFrameRate = Math.floor(1000 / frame);

            _dispatcher.trigger("animate", frame);
            var objectsLoaded = true;
            for (var i = 0, length = this.objects.length; i < length; i++) {
                if (!this.objects[i].loaded) {
                    objectsLoaded = false;
                }
                this.objects[i].draw(this.ctx, {
                    frameRate: frame,
                    lastTime: _time,
                    time: _time + aktFrameRate
                }, absPosition);
            }
            if (objectsLoaded)
                _initialized = true;
            if (_forceRender) {
                _forceRender = false;
            }
            _time += aktFrameRate;
        };
    });


registerNamespace("RenderJs.Canvas.Shapes");

RenderJs.Canvas.Events = {
    animate: "animate",
    click: "click",
    keydown: "keydown",
    keyup: "keyup",
    keypress: "keypress",
    mousemove: "mousemove",
    mousehover: "mousehover",
    mouseleave: "mouseleave",
    collision: "collision",
    objectChanged: "objectChanged"
};

/*
 *Represents a base class for different type of shapes
 */
RenderJs.Canvas.Object = inject("EventDispatcher", "jQuery", "Utils")
    .class(function (dispatcher, $, utils, options) {

        this.dispatcher = new dispatcher();

        options = options || {};
        this.id = utils.getGuid();
        this.pos = new RenderJs.Vector(options.x, options.y);
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.angle = options.angle || 0;
        this.scaleX = options.scaleX;
        this.scaleY = options.scaleY;
        this.blurRadius = options.blurRadius;
        this.collision = options.collision || false;
        this.filters = [];
        this.layer = null;
        this.loaded = true;

        /*
         *Returns with the center point of the shape
         */
        this.getCenter = function () {
            return new RenderJs.Vector(this.pos.x + (this.width) / 2, this.pos.y + (this.height) / 2);
        };
        /*
         *Returns with the rect around the shape
         */
        this.getCenteredRect = function () {
            var o = this.pos;
            return {x: o.x, y: o.y, width: this.width, height: this.height};
        };
        /*
         * Filters which will be applied on the object(blur, greyscale etc...)
         */
        this.setfilters = function (filters) {
            this.filters = filters;
        };

        this.updatePosition = function (dX, dY) {
            var prevPos = RenderJs.Vector.clone(this.pos.x, this.pos.y);
            var newPos = this.pos.add(new RenderJs.Vector(Math.floor(dX), Math.floor(dY)));
            this.pos = newPos;
            if (prevPos.x !== newPos.x || prevPos.y !== newPos.y) {
                this.trigger(RenderJs.Canvas.Events.objectChanged, this);
            }
        };

        /*
         *Rotate the shape to the given degree, during the time
         *-deg rotation angle
         *-t animation time
         */
        this.rotateShape = function (ctx) {
            if (this.angle === 0) {
                return;
            }
            var o = this.getCenter();
            ctx.translate(o.x, o.y);
            ctx.rotate(utils.convertToRad(this.angle));
            ctx.translate(-o.x, -o.y);
        };

        /*
         *Scale the shape with the given width and height, during the time
         *-width scale horizontally ratio integer 1 is 100%
         *-height scale vertically ratio integer 1 is 100%
         *-t animation time
         */
        this.scaleShape = function (ctx, scaleX, scaleY) {
            var o = this.getCenter();
            ctx.translate(o.x, o.y);
            ctx.scale(scaleX, scaleY);
            ctx.translate(-o.x, -o.y);
        };

        this.on = function (type, handler) {
            if (!RenderJs.Canvas.Events[type]) {
                return;
            }
            return this.dispatcher.subscribe(type, handler);
        };

        this.trigger = function (event, args) {
            if (!RenderJs.Canvas.Events[event]) {
                return;
            }
            this.dispatcher.trigger(event, args);
        };

        this.dispose = function () {
            this.dispatcher.dispose();
        };
    });
/**
 * Created by MCG on 2015.01.25..
 */
var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Space = function (options) {

    var _init = function (options) {
        this.stage = options.stage;
    };
    _init(options);
}
registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Stage = inject("Utils", "EventDispatcher", "LinkedList")
    .class(function (utils, dispatcher, linkedList, options) {

        var _container = options.container || "viewport";
        var _currentFps = 0;
        var _dispatcher = new dispatcher();
        this.layers = new linkedList();

        this.position = new RenderJs.Vector(-50, -50);

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
var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Easings = RenderJs.Canvas.Easings || {};

RenderJs.Canvas.Easings.BounceEaseOut = function (t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
        return c * (7.5625 * t * t) + b;
    }
    else if (t < (2 / 2.75)) {
        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
    }
    else if (t < (2.5 / 2.75)) {
        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
    }
    else {
        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
    }
};

RenderJs.Canvas.Easings.BounceEaseIn = function (t, b, c, d) {
    return c - Kinetic.Easings.BounceEaseOut(d - t, 0, c, d) + b;
};

RenderJs.Canvas.Easings.BounceEaseInOut = function (t, b, c, d) {
    if (t < d / 2) {
        return Kinetic.Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
    }
    else {
        return Kinetic.Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
    }
};

RenderJs.Canvas.Easings.EaseIn = function (t, b, c, d) {
    return c * (t /= d) * t + b;
};

RenderJs.Canvas.Easings.EaseOut = function (t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
};

RenderJs.Canvas.Easings.EaseInOut = function (t, b, c, d) {
    if ((t /= d / 2) < 1) {
        return c / 2 * t * t + b;
    }
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

RenderJs.Canvas.Easings.ElasticEaseIn = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d) === 1) {
        return b + c;
    }
    if (!p) {
        p = d * 0.3;
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
};

RenderJs.Canvas.Easings.ElasticEaseOut = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d / 2) === 2) {
        return b + c;
    }
    if (!p) {
        p = d * (0.3 * 1.5);
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
};

RenderJs.Canvas.Easings.ElasticEaseInOut = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d / 2) === 2) {
        return b + c;
    }
    if (!p) {
        p = d * (0.3 * 1.5);
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
};



RenderJs.Canvas.Transition = function (options) {
    var self = this;

    var reverse = false;

    this.duration = options.duration * 1000 || 1000;

    this.shape = options.shape;

    this.props = options.props || {};
    this.origProps = {};
    for (var prop in options.props) {
        this.origProps[prop] = this.shape[prop];
    }

    this.easing = options.easing || RenderJs.Canvas.Easings.EaseInOut;

    var animation = new RenderJs.Canvas.Animation(function (frame) {
        if (frame.time >= self.duration) {
            animation.stop();
        }
        for (var prop in self.props) {
            if (reverse) {
                self.shape[prop] = self.easing(frame.time, self.origProps[prop] + self.props[prop], self.props[prop] * -1, self.duration);
            }
            else {
                self.shape[prop] = self.easing(frame.time, self.origProps[prop], self.props[prop], self.duration);
            }
        }

    }, this.shape.layer);

    this.play = function () {
        animation.start();
    };

    this.pause = function () {
        animation.pause();
    };

    this.stop = function () {
        animation.stop();
    };

    this.reverse = function () {
        reverse = true;
        animation.start();
    };
}
var RenderJs = RenderJs || {};

RenderJs.Vector = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;

    this.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    };

    this.lengthSquared = function () {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    };

    this.length = function () {
        return Math.sqrt(this.lengthSquared());
    };

    this.length2 = function () {
        return this.dot(this);
    };

    this.perp = function () {
        return new RenderJs.Vector(this.y, -this.x);
    };

    this.scale = function (s) {
        return new RenderJs.Vector(this.x * s, this.y * s);
    };

    this.sub = function (v) {
        if (v instanceof RenderJs.Vector) {
            return new RenderJs.Vector(this.x - v.x, this.y - v.y);
        }
        else {
            return new RenderJs.Vector(this.x - v, this.y - v);
        }
    };

    this.add = function (v) {
        if (v instanceof RenderJs.Vector) {
            return new RenderJs.Vector(this.x + v.x, this.y + v.y);
        }
        else {
            return new RenderJs.Vector(this.x + v, this.y + v);
        }
    };

    this.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };

    this.dist = function (v) {
        return this.sub(v).length();
    };

    this.normalize = function () {
        return this.scale(1 / this.length());
    };

    this.angle = function (v) {
        return this.dot(v) / (this.length() * v.length());
    };

    this.truncate = function (max) {
        var length = Math.min(max, this.length());
        return length;
    };

    this.rotate = function (angle) {
        var x = this.x;
        var y = this.y;
        this.x = x *  Math.cos(Utils.convertToRad(angle)) - y * Math.sin(Utils.convertToRad(angle));
        this.y = y *  Math.cos(Utils.convertToRad(angle)) + x * Math.sin(Utils.convertToRad(angle));
    };

    this.toString = function (rounded) {
        if (rounded) {
            return "(" + Math.round(this.x) + ", " + Math.round(this.y) + ")";
        }
        else {
            return "(" + this.x + ", " + this.y + ")";
        }
    };

};

RenderJs.Vector.clone = function (x, y) {
    return new RenderJs.Vector(x, y);
};

/**
 * Get the area of a triangle spanned by the three given points. Note that the area will be negative if the points are not given in counter-clockwise order.
 * @static
 * @method area
 * @param  {Array} a
 * @param  {Array} b
 * @param  {Array} c
 * @return {Number}
 */
RenderJs.Vector.area = function (a, b, c) {
    return (((b.x - a.x) * (c.y - a.y)) - ((c.x - a.x) * (b.y - a.y)));
};

RenderJs.Vector.left = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) > 0;
};

RenderJs.Vector.leftOn = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) >= 0;
};

RenderJs.Vector.right = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) < 0;
};

RenderJs.Vector.rightOn = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) <= 0;
};

RenderJs.Vector.sqdist = function (a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return dx * dx + dy * dy;
};

function Scalar() {
}

/**
 * Check if two scalars are equal
 * @static
 * @method eq
 * @param  {Number} a
 * @param  {Number} b
 * @param  {Number} [precision]
 * @return {Boolean}
 */
Scalar.eq = function (a, b, precision) {
    precision = precision || 0;
    return Math.abs(a - b) < precision;
};
var RenderJs = RenderJs || {};
RenderJs.Physics = RenderJs.Physics || {};

RenderJs.Physics.Collisions = (function (module) {

    var _rayCastingAlg = function (p, edge) {
        'takes a point p=Pt() and an edge of two endpoints a,b=Pt() of a line segment returns boolean';
        var _eps = 0.00001;
        var _huge = Number.MAX_VALUE;
        var _tiny = Number.MIN_VALUE;
        var m_blue, m_red = 0;
        var a = edge.p1;
        var b = edge.p2;

        if (a.y > b.y) {
            a.set(b);
            b.set(a);
        }
        if (p.y == a.y || p.y == b.y)
            p.y += _eps;

        var intersect = false;

        if ((p.y > b.y || p.y < a.y) || (p.x > Math.max(a.x, b.x)))
            return false;

        if (p.x < Math.min(a.x, b.x))
            intersect = true;
        else {
            if (Math.abs(a.x - b.x) > _tiny)
                m_red = (b.y - a.y) / (b.x - a.x);
            else
                m_red = _huge;

            if (Math.abs(a.x - p.x) > _tiny)
                m_blue = (p.y - a.y) / (p.x - a.x);
            else
                m_blue = _huge
            intersect = m_blue >= m_red;
        }

        return intersect;
    }

    var _vornoiRegion = function (line, point) {
        var len2 = line.length2();
        var dp = point.dot(line);
        // If the point is beyond the start of the line, it is in the
        // left vornoi region.
        if (dp < 0) {
            return -1;
        }
        // If the point is beyond the end of the line, it is in the
        // right vornoi region.
        else if (dp > len2) {
            return 1;
        }
        // Otherwise, it's in the middle one.
        else {
            return 0;
        }
    }

    var _pointInPolygon = function (p, polygon) {
        var res = false;
        for (var i = 0; i < polygon.rEdges.length; i++) {
            if (_rayCastingAlg(p, polygon.rEdges[i]))
                res = !res;
        }
        return res;
    }

    var _pointInLine = function (p, line) {
        var m = (line.pos2.y - line.pos.y) / (line.pos2.x - line.pos.x);

        return p.y - line.pos.y == m * (p.x - line.pos.y);
    }

    var _pointInCircle = function (p, c) {
        o = c.getCenter();

        return Math.pow(p.x - o.x, 2) + Math.pow(p.y - o.y, 2) <= Math.pow((this.width / 2), 2);
    }

    var _rectVsRect = function (r1, r2) {
        var tw = r1.width;
        var th = r1.height;
        var rw = r2.width;
        var rh = r2.height;
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        var tx = r1.x;
        var ty = r1.y;
        var rx = r2.x;
        var ry = r2.y;
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        //overflow || intersect
        return ((rw < rx || rw > tx) &&
        (rh < ry || rh > ty) &&
        (tw < tx || tw > rx) &&
        (th < ty || th > ry));
    }

    var _rectVsCircle = function (r, c) {
        return _pointInRectangle(c.getCenter(), r) ||
            _lineVsCircle(r.topEdge(), c) ||
            _lineVsCircle(r.rightEdge(), c) ||
            _lineVsCircle(r.bottomEdge(), c) ||
            _lineVsCircle(r.leftEdge(), c);
    }

    var _lineVsCircle = function (l, c) {
        var co = c.getCenter();
        var r = c.radius;
        var d = new RenderJs.Vector(l.pos2.x - l.pos.x, l.pos2.y - l.pos.y);
        var f = new RenderJs.Vector(l.pos.x - co.x, l.pos.y - co.y);

        var a = d.dot(d);
        var b = 2 * f.dot(d);
        var c = f.dot(f) - r * r;

        var discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            // no intersection
            return false;
        }
        else {
            // ray didn't totally miss sphere,
            // so there is a solution to
            // the equation.

            discriminant = Math.sqrt(discriminant);

            // either solution may be on or off the ray so need to test both
            // t1 is always the smaller value, because BOTH discriminant and
            // a are nonnegative.
            var t1 = (-b - discriminant) / (2 * a);
            var t2 = (-b + discriminant) / (2 * a);

            // 3x HIT cases:
            //          -o->             --|-->  |            |  --|->
            // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

            // 3x MISS cases:
            //       ->  o                     o ->              | -> |
            // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

            if (t1 >= 0 && t1 <= 1) {
                // t1 is the intersection, and it's closer than t2
                // (since t1 uses -b - discriminant)
                // Impale, Poke
                return true;
            }

            // here t1 didn't intersect so we are either started
            // inside the sphere or completely past it
            if (t2 >= 0 && t2 <= 1) {
                // ExitWound
                return true;
            }

            // no intn: FallShort, Past, CompletelyInside
            return false;
        }
    }

    var _circleVsCircle = function (c1, c2) {
        var velocity = c2.v;
        //add both radii together to get the colliding distance
        var totalRadius = c1.radius + c2.radius;
        //find the distance between the two circles using Pythagorean theorem. No square roots for optimization
        var distanceSquared = (c1.pos.x - c2.pos.x) * (c1.pos.x - c2.pos.x) + (c1.pos.y - c2.pos.y) * (c1.pos.y - c2.pos.y);
        //if your distance is less than the totalRadius square(because distance is squared)
        if (distanceSquared < totalRadius * totalRadius) {
            var distance = Math.sqrt(distanceSquared);

            var separation = totalRadius - distance;
            var unitVector = new RenderJs.Vector(c1.pos.sub(c2.pos).x / distance, c1.pos.sub(c2.pos).y / distance);
            var diffV = c2.pos.sub(c1.pos);

            //find the movement needed to separate the circles
            return velocity.add(unitVector.scale(separation / 2));//new RenderJs.Vector((c2.pos.x - c1.pos.x) * difference, (c2.pos.y - c1.pos.y) * difference);
        }
        return null; //no collision, return null
    }

    var _circleVsPolygon = function (circle, polygon) {
        // Get the position of the circle relative to the polygon.
        var circlePos = circle.pos.sub(polygon.pos);
        var radius = circle.radius;
        var radius2 = radius * radius;
        var points = polygon.vertices.slice();
        var len = points.length;
        var edge = new RenderJs.Vector(0, 0);
        var point = new RenderJs.Vector(0, 0);
        var response = {
            overlap: Number.MAX_VALUE,
            overlapN: new RenderJs.Vector(0, 0),
            overlapV: new RenderJs.Vector(0, 0)
        };
        // For each edge in the polygon:
        for (var i = 0; i < len; i++) {
            var next = i === len - 1 ? 0 : i + 1;
            var prev = i === 0 ? len - 1 : i - 1;
            var overlap = 0;
            var overlapN = null;

            // Get the edge.
            edge.set(polygon.vertices[i]);
            // Calculate the center of the circle relative to the starting point of the edge.
            point.set(circlePos);
            point.set(point.sub(points[i]));
            // If the distance between the center of the circle and the point
            // is bigger than the radius, the polygon is definitely not fully in
            // the circle.
            if (response && point.length2() > radius2) {
                response['aInB'] = false;
            }

            // Calculate which Vornoi region the center of the circle is in.
            var region = _vornoiRegion(edge, point);
            // If it's the left region:
            if (region === -1) {
                // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
                edge.set(polygon.edges[prev]);
                // Calculate the center of the circle relative the starting point of the previous edge
                var point2 = new RenderJs.Vector(0, 0).set(circlePos).sub(points[prev]);
                region = _vornoiRegion(edge, point2);
                if (region === 1) {
                    // It's in the region we want.  Check if the circle intersects the point.
                    var dist = point.length();
                    if (dist > radius) {
                        // No intersection
                        return false;
                    } else if (response) {
                        // It intersects, calculate the overlap.
                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }
                // If it's the right region:
            } else if (region === 1) {
                // We need to make sure we're in the left region on the next edge
                edge.set(polygon.edges[next]);
                // Calculate the center of the circle relative to the starting point of the next edge.
                point.set(circlePos);
                point.set(point.sub(points[next]));
                region = _vornoiRegion(edge, point);
                if (region === -1) {
                    // It's in the region we want.  Check if the circle intersects the point.
                    var dist = point.length();
                    if (dist > radius) {
                        // No intersection
                        return false;
                    } else if (response) {
                        // It intersects, calculate the overlap.
                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }
                // Otherwise, it's the middle region:
            } else {
                // Need to check if the circle is intersecting the edge,
                // Change the edge into its "edge normal".
                var normal = edge.perp().normalize();
                // Find the perpendicular distance between the center of the 
                // circle and the edge.
                var dist = point.dot(normal);
                var distAbs = Math.abs(dist);
                // If the circle is on the outside of the edge, there is no intersection.
                if (dist > 0 && distAbs > radius) {
                    // No intersection
                    return false;
                } else if (response) {
                    // It intersects, calculate the overlap.
                    overlapN = normal;
                    overlap = radius - dist;
                    // If the center of the circle is on the outside of the edge, or part of the
                    // circle is on the outside, the circle is not fully inside the polygon.
                    if (dist >= 0 || overlap < 2 * radius) {
                        response['bInA'] = false;
                    }
                }
            }

            // If this is the smallest overlap we've seen, keep it. 
            // (overlapN may be null if the circle was in the wrong Vornoi region).
            if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
                response['overlap'] = overlap;
                response['overlapN'] = new RenderJs.Vector(0, 0).set(overlapN);
            }
        }

        // Calculate the final overlap vector - based on the smallest overlap.
        if (response) {
            response['a'] = polygon;
            response['b'] = circle;
            response['overlapV'] = new RenderJs.Vector(0, 0).set(response['overlapN']).scale(response['overlap']);
        }
        return true;

        //var test1;//numbers for testing max/mins
        //var test2;
        //var test;
        //var min1;//same as above
        //var max1;
        //var min2;
        //var max2;
        //var normalAxis;
        //var offset;
        //var vectorOffset;
        //var vectors;
        //var p2;
        //var distance;
        //var testDistance = Number.MAX_VALUE;
        //var closestVector = new RenderJs.Vector(0, 0);//the vector to use to find the normal
        //// find offset
        //vectorOffset = new RenderJs.Vector(polygon.pos.x - circle.pos.x, polygon.pos.y - circle.pos.y);
        //vectors = polygon.vertices.slice();//again, this is just a function in my polygon class that returns the vertices of the polgon
        ////adds some padding to make it more accurate
        //if (vectors.length == 2) {
        //    var temp = new RenderJs.Vector(-(vectors[1].y - vectors[0].y), vectors[1].x - vectors[0].x);
        //    temp.truncate(0.0000000001);
        //    vectors.push(vectors[1].add(temp));
        //}
        //// find the closest vertex to use to find normal
        //for (var i = 0; i < vectors.length; i++) {
        //    distance = (circle.pos.x - (polygon.pos.x + vectors[i].x)) * (circle.pos.x - (polygon.pos.x + vectors[i].x)) + (circle.pos.y - (polygon.pos.y + vectors[i].y)) * (circle.pos.y - (polygon.pos.y + vectors[i].y));
        //    if (distance < testDistance) {//closest has the lowest distance
        //        testDistance = distance;
        //        closestVector.x = polygon.pos.x + vectors[i].x;
        //        closestVector.y = polygon.pos.y + vectors[i].y;
        //    }
        //}
        ////get the normal vector
        //normalAxis = new RenderJs.Vector(closestVector.x - circle.pos.x, closestVector.y - circle.pos.y);
        //normalAxis.set(normalAxis.normalize());//normalize is(set its length to 1)
        //// project the polygon's points
        //min1 = normalAxis.dot(vectors[0]);
        //max1 = min1;//set max and min
        //for (j = 1; j < vectors.length; j++) {//project all its points, starting with the first(the 0th was done up there^)
        //    test = normalAxis.dot(vectors[j]);//dotProduct to project
        //    if (test < min1) min1 = test;//smallest min is wanted
        //    if (test > max1) max1 = test;//largest max is wanted
        //}
        //// project the circle
        //max2 = circle.radius;//max is radius
        //min2 -= circle.radius;//min is negative radius
        //// offset the polygon's max/min
        //offset = normalAxis.dot(vectorOffset);
        //min1 += offset;
        //max1 += offset;
        //// do the big test
        //test1 = min1 - max2;
        //test2 = min2 - max1;
        //if (test1 > 0 || test2 > 0) {//if either test is greater than 0, there is a gap, we can give up now.
        //    return null;
        //}
        //// find the normal axis for each point and project
        //for (i = 0; i < vectors.length; i++) {
        //    normalAxis = _findNormalAxis(vectors, i);
        //    // project the polygon(again? yes, circles vs. polygon require more testing...)
        //    min1 = normalAxis.dot(vectors[0]);//project
        //    max1 = min1;//set max and min
        //    //project all the other points(see, cirlces v. polygons use lots of this...)
        //    for (j = 1; j < vectors.length; j++) {
        //        test = normalAxis.dot(vectors[j]);//more projection
        //        if (test < min1) min1 = test;//smallest min
        //        if (test > max1) max1 = test;//largest max
        //    }
        //    // project the circle(again)
        //    max2 = circle.radius;//max is radius
        //    min2 -= circle.radius;//min is negative radius
        //    //offset points
        //    offset = normalAxis.dot(vectorOffset);
        //    min1 += offset;
        //    max1 += offset;
        //    // do the test, again
        //    test1 = min1 - max2;
        //    test2 = min2 - max1;
        //    if (test1 > 0 || test2 > 0) {
        //        //failed.. quit now
        //        return null
        //    }
        //}
        //return new RenderJs.Vector(normalAxis.x * (max2 - min1) * -1, normalAxis.y * (max2 - min1) * -1);//return the separation distance
    }

    var _pointInRectangle = function (p, r) {
        return (p.x >= r.x &&
        p.x <= r.x + r.width &&
        p.y >= r.y &&
        p.y <= r.y + r.height);
    }

    module.AabbCollision = function (rectA, rectB) {
        if (Math.abs(rectA.x - rectB.x) < rectA.width + rectB.width) {
            if (Math.abs(rectA.y - rectB.y) < rectA.height + rectB.height) {
                return true;
            }
        }
        return false;
    };

    module.pointInObject = function (p, obj) {
        if (obj instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _pointInRectangle(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Arc)
            return _pointInCircle(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Polygon)
            return _pointInPolygon(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Line)
            return _pointInLine(p, obj);

        return false;
    }

    module.checkCollision = function (obj1, obj2, velocity) {
        if (obj1 instanceof RenderJs.Canvas.Shapes.Rectangle && obj2 instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _rectVsRect(obj1, obj2);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Rectangle && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _rectVsCircle(obj1, obj2);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _rectVsCircle(obj2, obj1);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _circleVsCircle(obj1, obj2, velocity);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Line && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _lineVsCircle(obj1, obj2);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Line)
            return _lineVsCircle(obj2, obj1);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Polygon && obj2 instanceof RenderJs.Canvas.Shapes.Polygon) {
            for (var i = 0; i < obj1.subPolys.length; i++) {
                for (var j = 0; j < obj2.subPolys.length; j++) {
                    var response = module.polygonCollision(obj1.subPolys[i], obj2.subPolys[j], velocity);
                    if (response.intersect || response.willIntersect)
                        return response;
                }
            }
            return null;//RenderJs.Vector.clone(0, 0);
        }
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Polygon)
            return _circleVsPolygon(obj1, obj2, velocity);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Polygon && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _circleVsPolygon(obj2, obj1, velocity);

        return false;
    }

    return module;

}(RenderJs.Physics.Collisions || {}));
var RenderJs = RenderJs || {};
RenderJs.Physics.Collisions = (function (module) {

    // Check if polygon A is going to collide with polygon B for the given velocity
    module.polygonCollision = function (polygonA, polygonB, velocity) {
        var result = {
            intersect: true,
            willIntersect: true
        }

        var edgeCountA = polygonA.edges.length;
        var edgeCountB = polygonB.edges.length;
        var minIntervalDistance = Infinity;
        var translationAxis = new RenderJs.Vector();
        var edge;

        // Loop through all the edges of both polygons
        for (var edgeIndex = 0, l = edgeCountA + edgeCountB; edgeIndex < l; edgeIndex++) {
            if (edgeIndex < edgeCountA) {
                edge = polygonA.edges[edgeIndex];
            } else {
                edge = polygonB.edges[edgeIndex - edgeCountA];
            }

            // ===== 1. Find if the polygons are currently intersecting =====

            // Find the axis perpendicular to the current edge
            var axis = new RenderJs.Vector(-edge.y, edge.x);
            axis.set(axis.normalize());

            // Find the projection of the polygon on the current axis
            var minA = 0, minB = 0, maxA = 0, maxB = 0;

            var projectedA = _projectPolygon(axis, polygonA, minA, maxA);
            minA = projectedA.min;
            maxA = projectedA.max;

            var projectedB = _projectPolygon(axis, polygonB, minB, maxB);
            minB = projectedB.min;
            maxB = projectedB.max;

            // Check if the polygon projections are currentlty intersecting
            if (_intervalDistance(minA, maxA, minB, maxB) > 0) result.intersect = false;

            // ===== 2. Now find if the polygons *will* intersect =====

            // Project the velocity on the current axis
            var velocityProjection = axis.dot(velocity);

            // Get the projection of polygon A during the movement
            if (velocityProjection < 0) {
                minA += velocityProjection;
            } else {
                maxA += velocityProjection;
            }

            // Do the same test as above for the new projection
            var intervalDistance = _intervalDistance(minA, maxA, minB, maxB);
            if (intervalDistance > 0) result.willIntersect = false;

            // If the polygons are not intersecting and won't intersect, exit the loop
            if (!result.intersect && !result.willIntersect) break;

            // Check if the current interval distance is the minimum one. If so store
            // the interval distance and the current distance.
            // This will be used to calculate the minimum translation vector
            intervalDistance = Math.abs(intervalDistance);
            if (intervalDistance < minIntervalDistance) {
                minIntervalDistance = intervalDistance;
                translationAxis = axis;

                d = polygonA.getCenter().sub(polygonB.getCenter());
                if (d.dot(translationAxis) < 0) translationAxis = translationAxis.scale(-1);
            }
        }

        // The minimum translation vector can be used to push the polygons appart.
        // First moves the polygons by their velocity
        // then move polygonA by MinimumTranslationVector.
        if (result.willIntersect) result.minimumTranslationVector = translationAxis.scale(minIntervalDistance);

        return result;
    }

    // Calculate the distance between [minA, maxA] and [minB, maxB]
    // The distance will be negative if the intervals overlap
    var _intervalDistance = function (minA, maxA, minB, maxB) {
        if (minA < minB) {
            return minB - maxA;
        } else {
            return minA - maxB;
        }
    }

    // Calculate the projection of a polygon on an axis and returns it as a [min, max] interval
    var _projectPolygon = function (axis, polygon, min, max) {
        // To project a point on an axis use the dot product
        var d = axis.dot(polygon.vertices[0]);
        min = d;
        max = d;
        for (var i = 0; i < polygon.vertices.length; i++) {
            d = polygon.vertices[i].dot(axis);
            if (d < min) {
                min = d;
            } else {
                if (d > max) {
                    max = d;
                }
            }
        }
        return {
            min: min,
            max: max
        };
    }

    return module;

}(RenderJs.Physics.Collisions || {}));
registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a circle shape, inherits from shape
 */
RenderJs.Canvas.Shapes.Arc = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {
        "use strict";
        this.base(options);

        options = options || {};
        options.width = options.height = options.radius * 2, options.radius * 2;

        this.radius = options.radius;
        this.sAngle = utils.convertToRad(options.sAngle || 0);
        this.eAngle = utils.convertToRad(options.eAngle || 360);
        this.color = options.color;
        this.fillColor = options.fillColor;
        this.lineWidth = options.lineWidth || 1;

        /*
         *Overrides the original function, because the circle center point is not the top,left corner
         */
        this.getCenter = function () {
            return new RenderJs.Vector(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
        };

        /*
         *Overrides the original function
         */
        this.pointIntersect = function (p) {
            var c = this.getCenter();

            return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow((this.width / 2), 2);
        };

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         *-fps is the frame per second
         */
        this.draw = function (ctx) {
            if (this.angle !== 0) {
                ctx.save();
                this.rotateShape(ctx);
            }
            ctx.beginPath();
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.fillColor;
            ctx.arc(this.pos.x + this.width / 2, this.pos.y + this.height / 2, this.width / 2, this.sAngle, this.eAngle);
            if (this.color) {
                ctx.stroke();
            }
            if (this.fillColor) {
                ctx.fill();
            }

            ctx.closePath();
            if (this.angle !== 0) {
                ctx.restore();
            }
        };
    });
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
registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a line shape, inherits from shape
 */
RenderJs.Canvas.Shapes.Line = inject()
    .base(RenderJs.Canvas.Object)
    .class(function (options) {

        this.base({
            x: options.x1,
            y: options.y1,
            width: Math.abs(options.x2 - options.x1),
            height: Math.abs(options.y2 - options.y1)
        });

        this.color = "#000";
        this.lineWidth = 1;
        this.pos2 = new RenderJs.Vector(options.x2, options.y2);
        this.color = options.color;
        this.lineWidth = options.lineWidth || 1;

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         *-fps is the frame per second
         */
        this.draw = function (ctx, frame, stagePosition) {
            var absPosition = this.pos.sub(stagePosition);
            var absPosition2 = this.pos2.sub(stagePosition);
            ctx.beginPath();
            ctx.moveTo(absPosition.x, absPosition.y);
            ctx.lineTo(absPosition2.x, absPosition2.y);

            ctx.closePath();
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        };
    });

registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a line shape, inherits from shape
 */
RenderJs.Canvas.Shapes.Polygon = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {
        this.base(options);

        this.color = options.color || "#000";
        this.lineWidth = options.lineWidth || 1;
        this.vertices = options.points || [];
        this.subPolys = [];
        this.edges = [];
        this.rEdges = [];
        this.buildEdges();

        /*
         * Decompose a polygon if it's concave
         */
        this.decompose = function (result, reflexVertices, steinerPoints, delta, maxlevel, level) {
            maxlevel = maxlevel || 100;
            level = level || 0;
            delta = delta || 25;
            result = typeof (result) !== "undefined" ? result : [];
            reflexVertices = reflexVertices || [];
            steinerPoints = steinerPoints || [];

            var upperInt = new RenderJs.Vector(0, 0), lowerInt = new RenderJs.Vector(0, 0), p = new RenderJs.Vector(0, 0); // Points
            var upperDist = 0, lowerDist = 0, d = 0, closestDist = 0; // scalars
            var upperIndex = 0, lowerIndex = 0, closestIndex = 0; // Integers
            var lowerPoly = new RenderJs.Canvas.Shapes.Polygon(), upperPoly = new RenderJs.Canvas.Shapes.Polygon(); // polygons
            var poly = this,
                v = this.vertices;

            if (v.length < 3) {
                return result;
            }

            level++;
            if (level > maxlevel) {
                console.warn("quickDecomp: max level (" + maxlevel + ") reached.");
                return result;
            }

            for (var i = 0; i < this.vertices.length; ++i) {
                if (poly.isReflex(i)) {
                    reflexVertices.push(poly.vertices[i]);
                    upperDist = lowerDist = Number.MAX_VALUE;


                    for (var j = 0; j < this.vertices.length; ++j) {
                        if (RenderJs.Vector.left(poly.at(i - 1), poly.at(i), poly.at(j))
                            && RenderJs.Vector.rightOn(poly.at(i - 1), poly.at(i), poly.at(j - 1))) { // if line intersects with an edge
                            p = this.getIntersectionPoint(poly.at(i - 1), poly.at(i), poly.at(j), poly.at(j - 1)); // find the point of intersection
                            if (RenderJs.Vector.right(poly.at(i + 1), poly.at(i), p)) { // make sure it's inside the poly
                                d = RenderJs.Vector.sqdist(poly.vertices[i], p);
                                if (d < lowerDist) { // keep only the closest intersection
                                    lowerDist = d;
                                    lowerInt = p;
                                    lowerIndex = j;
                                }
                            }
                        }
                        if (RenderJs.Vector.left(poly.at(i + 1), poly.at(i), poly.at(j + 1))
                            && RenderJs.Vector.rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                            p = this.getIntersectionPoint(poly.at(i + 1), poly.at(i), poly.at(j), poly.at(j + 1));
                            if (RenderJs.Vector.left(poly.at(i - 1), poly.at(i), p)) {
                                d = RenderJs.Vector.sqdist(poly.vertices[i], p);
                                if (d < upperDist) {
                                    upperDist = d;
                                    upperInt = p;
                                    upperIndex = j;
                                }
                            }
                        }
                    }

                    // if there are no vertices to connect to, choose a point in the middle
                    if (lowerIndex == (upperIndex + 1) % this.vertices.length) {
                        //console.log("Case 1: Vertex("+i+"), lowerIndex("+lowerIndex+"), upperIndex("+upperIndex+"), poly.size("+this.vertices.length+")");
                        p.x = (lowerInt.x + upperInt.x) / 2;
                        p.y = (lowerInt.y + upperInt.y) / 2;
                        steinerPoints.push(p);

                        if (i < upperIndex) {
                            //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.begin() + upperIndex + 1);
                            lowerPoly.append(poly, i, upperIndex + 1);
                            lowerPoly.vertices.push(p);
                            upperPoly.vertices.push(p);
                            if (lowerIndex != 0) {
                                //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.end());
                                upperPoly.append(poly, lowerIndex, poly.vertices.length);
                            }
                            //upperPoly.insert(upperPoly.end(), poly.begin(), poly.begin() + i + 1);
                            upperPoly.append(poly, 0, i + 1);
                        } else {
                            if (i != 0) {
                                //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.end());
                                lowerPoly.append(poly, i, poly.vertices.length);
                            }
                            //lowerPoly.insert(lowerPoly.end(), poly.begin(), poly.begin() + upperIndex + 1);
                            lowerPoly.append(poly, 0, upperIndex + 1);
                            lowerPoly.vertices.push(p);
                            upperPoly.vertices.push(p);
                            //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.begin() + i + 1);
                            upperPoly.append(poly, lowerIndex, i + 1);
                        }
                    } else {
                        // connect to the closest point within the triangle
                        //console.log("Case 2: Vertex("+i+"), closestIndex("+closestIndex+"), poly.size("+this.vertices.length+")\n");

                        if (lowerIndex > upperIndex) {
                            upperIndex += this.vertices.length;
                        }
                        closestDist = Number.MAX_VALUE;

                        if (upperIndex < lowerIndex) {
                            return result;
                        }

                        for (var j = lowerIndex; j <= upperIndex; ++j) {
                            if (RenderJs.Vector.leftOn(poly.at(i - 1), poly.at(i), poly.at(j))
                                && RenderJs.Vector.rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                                d = RenderJs.Vector.sqdist(poly.at(i), poly.at(j));
                                if (d < closestDist) {
                                    closestDist = d;
                                    closestIndex = j % this.vertices.length;
                                }
                            }
                        }

                        if (i < closestIndex) {
                            lowerPoly.append(poly, i, closestIndex + 1);
                            if (closestIndex !== 0) {
                                upperPoly.append(poly, closestIndex, v.length);
                            }
                            upperPoly.append(poly, 0, i + 1);
                        } else {
                            if (i !== 0) {
                                lowerPoly.append(poly, i, v.length);
                            }
                            lowerPoly.append(poly, 0, closestIndex + 1);
                            upperPoly.append(poly, closestIndex, i + 1);
                        }
                    }

                    // solve smallest poly first
                    if (lowerPoly.vertices.length < upperPoly.vertices.length) {
                        lowerPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                        upperPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                    } else {
                        upperPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                        lowerPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                    }
                    for (var k = 0; k < result.length; k++) {
                        result[k].buildEdges();
                    }
                    return result;
                }
            }
            result.push(this);

            return result;
        };

        /*
         * Append points "from" to "to"-1 from an other polygon "poly" onto this one.
         * @method append
         * @param {Polygon} poly The polygon to get points from.
         * @param {Number}  from The vertex index in "poly".
         * @param {Number}  to The end vertex index in "poly". Note that this vertex is NOT included when appending.
         * @return {Array}
         */
        this.append = function (poly, from, to) {
            if (typeof (from) === "undefined") throw new Error("From is not given!");
            if (typeof (to) === "undefined") throw new Error("To is not given!");

            if (to - 1 < from) throw new Error("lol1");
            if (to > poly.vertices.length) throw new Error("lol2");
            if (from < 0) throw new Error("lol3");

            for (var i = from; i < to; i++) {
                this.vertices.push(poly.vertices[i]);
            }
        };

        /*
         * Get a vertex at position i. It does not matter if i is out of bounds, this function will just cycle.
         * @method at
         * @param  {Number} i
         * @return {Array}
         */
        this.at = function (i) {
            var v = this.vertices,
                s = v.length;
            return v[i < 0 ? i % s + s : i % s];
        };

        /*
         * Get first vertex
         * @method first
         * @return {Array}
         */
        this.first = function () {
            return this.vertices[0];
        };

        /*
         * Get last vertex
         * @method last
         * @return {Array}
         */
        this.last = function () {
            return this.vertices[this.vertices.length - 1];
        };


        /*
         * Checks that the line segments of this polygon do not intersect each other.
         * @method isSimple
         * @param  {Array} path An array of vertices e.g. [[0,0],[0,1],...]
         * @return {Boolean}
         * @todo Should it check all segments with all others?
         */
        this.isSimple = function () {
            var path = this.vertices;
            // Check
            for (var i = 0; i < path.length - 1; i++) {
                for (var j = 0; j < i - 1; j++) {
                    if (this.segmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
                        return false;
                    }
                }
            }

            // Check the segment between the last and the first point to all others
            for (var i = 1; i < path.length - 2; i++) {
                if (this.segmentsIntersect(path[0], path[path.length - 1], path[i], path[i + 1])) {
                    return false;
                }
            }

            return true;
        };

        this.getIntersectionPoint = function (p1, p2, q1, q2, delta) {
            delta = delta || 0;
            var a1 = p2.y - p1.y;
            var b1 = p1.x - p2.x;
            var c1 = (a1 * p1.x) + (b1 * p1.y);
            var a2 = q2.y - q1.y;
            var b2 = q1.x - q2.x;
            var c2 = (a2 * q1.x) + (b2 * q1.y);
            var det = (a1 * b2) - (a2 * b1);

            if (!Scalar.eq(det, 0, delta))
                return RenderJs.Vector.clone(((b2 * c1) - (b1 * c2)) / det, ((a1 * c2) - (a2 * c1)) / det);
            else
                return RenderJs.Vector.clone(0, 0);
        }

        /*
         * Check if a point in the polygon is a reflex point
         * @method isReflex
         * @param  {Number}  i
         * @return {Boolean}
         */
        this.isReflex = function (i) {
            return RenderJs.Vector.right(this.at(i - 1), this.at(i), this.at(i + 1));
        };

        this.makeCCW = function () {
            var br = 0,
                v = this.vertices;

            // find bottom right point
            for (var i = 1; i < this.vertices.length; ++i) {
                if (v[i].y < v[br].y || (v[i].y == v[br].y && v[i].x > v[br].x)) {
                    br = i;
                }
            }

            // reverse poly if clockwise
            if (!RenderJs.Vector.left(this.at(br - 1), this.at(br), this.at(br + 1))) {
                this.reverse();
            }
        };
        /*
         * Reverse the vertices in the polygon
         * @method reverse
         */
        this.reverse = function () {
            var tmp = [];
            for (var i = 0, N = this.vertices.length; i !== N; i++) {
                tmp.push(this.vertices.pop());
            }
            this.vertices = tmp;
        };

        this.segmentsIntersect = function (p1, p2, q1, q2) {
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var da = q2.x - q1.x;
            var db = q2.y - q1.y;

            // segments are parallel
            if (da * dy - db * dx == 0)
                return false;

            var s = (dx * (q1.y - p1.y) + dy * (p1.x - q1.x)) / (da * dy - db * dx)
            var t = (da * (p1.y - q1.y) + db * (q1.x - p1.x)) / (db * dx - da * dy)

            return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
        };

        this.buildEdges = function () {
            var p1;
            var p2;
            this.edges = [];
            this.rEdges = [];
            for (var i = 0; i < this.vertices.length; i++) {
                p1 = this.vertices[i];
                if (i + 1 >= this.vertices.length) {
                    p2 = this.vertices[0];
                } else {
                    p2 = this.vertices[i + 1];
                }
                this.edges.push(p2.sub(p1));
                this.rEdges.push({p1: new RenderJs.Vector(p1.x, p1.y), p2: new RenderJs.Vector(p2.x, p2.y)});
            }
        };

        this.getCenter = function () {
            var totalX = 0;
            var totalY = 0;
            for (var i = 0; i < this.vertices.length; i++) {
                totalX += this.vertices[i].x;
                totalY += this.vertices[i].y;
            }

            return new RenderJs.Vector(totalX / this.vertices.length, totalY / this.vertices.length);
        };

        this.offset = function (x, y) {
            var v = arguments.length === 2 ? new RenderJs.Vector(arguments[0], arguments[1]) : arguments[0];
            this.pos.set(this.pos.add(v));
            for (var i = 0; i < this.vertices.length; i++) {
                var p = this.vertices[i];
                this.vertices[i].set(p.add(v));
            }
            this.subPolys = this.decompose();
        };

        this.toString = function () {
            var result = "";

            for (var i = 0; i < this.vertices.length; i++) {
                if (result != "") result += " ";
                result += "{" + this.vertices[i].toString(true) + "}";
            }

            return result;
        };

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         *-fps is the frame per second
         */
        this.draw = function (ctx) {
            var colors = ["indianred", "yellow", 'green'];
            for (var i = 0; i < this.subPolys.length; i++) {
                var vertices = this.subPolys[i].vertices;
                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (var j = 1; j < vertices.length; j++) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.closePath();
                ctx.lineWidth = this.lineWidth;
                ctx.strokeStyle = this.color;
                ctx.fillStyle = colors[i];
                ctx.fill();
                ctx.stroke();
            }
        };
    });
registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a rectangle shape, inherits from shape
 */
RenderJs.Canvas.Shapes.Rectangle = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {

        this.base(options);
        this.color = options.color;
        this.fillColor = options.fillColor;
        this.lineWidth = options.lineWidth || 1;

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         */
        this.draw = function (ctx) {
            if (this.color) {
                ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
            }
            if (this.fillColor) {
                ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
            }
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.fillColor;
        };
    });

registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a sprite image, inherits from shape
 */
RenderJs.Canvas.Shapes.Sprite = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {
        this.base(options);

        /*
         * Locals
         */
        var self = this;
        var image = document.createElement("img");
        image.onload = function () {
            self.width = image.width;
            self.height = image.height;
            loaded = true;
        };
        image.src = options.url;
        var loaded = false;
        var frameIndex = 0;
        var frameCount = options.frameCount;
        var started = false;
        var loop = false;
        var defAnimation = options.defAnimation;
        var current;
        var previous;
        var animations = options.animations;

        var animation = function (name, isLoop) {
            frameIndex = 0;
            started = true;
            loop = isLoop;
            if (!animations[name]) {
                return;
            }
            previous = current;
            current = animations[name];
        };


        this.start = function () {
            animation(defAnimation, true);
        };

        this.setAnimation = function (name, loop) {
            animation(name, loop);
        };

        this.pointIntersect = function () {
            return false;
        };

        this.getRect = function () {
            var defFrame = animations[defAnimation][0];
            return {x: this.pos.x, y: this.pos.y, width: defFrame[2], height: defFrame[3]};
        };

        this.rotateShape = function (ctx, position) {
            if (this.angle === 0) {
                return;
            }
            var defFrame = animations[defAnimation][0];
            var o = new RenderJs.Vector(position.x + (defFrame[2] / 2), position.y + (defFrame[3] / 2));
            ctx.translate(o.x, o.y);
            ctx.rotate(utils.convertToRad(this.angle));
            ctx.translate(-o.x, -o.y);
        };

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         */
        this.draw = function (ctx, frame, stagePosition) {
            if (!loaded || !started) {
                return;
            }

            var absPosition = this.pos.sub(stagePosition);

            if (this.angle !== 0) {
                ctx.save();
                this.rotateShape(ctx, absPosition);
            }

            var currentFrame = current[frameIndex];

            ctx.drawImage(image, currentFrame[0], currentFrame[1], currentFrame[2], currentFrame[3], absPosition.x, absPosition.y, currentFrame[2], currentFrame[3]);
            if (Math.floor(frame.time) % frameCount === 0) {
                frameIndex = frameIndex >= current.length - 1 ? 0 : frameIndex + 1;
                if (frameIndex === 0 && !loop) {
                    animation(defAnimation, true);
                }
            }
            if (this.angle !== 0) {
                ctx.restore();
            }
        };
    });

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdlbmVyYWwuanMiLCJncmFwaGljcy5qcyIsIm51bWJlci5qcyIsImxpbmtlZGxpc3QuanMiLCJtYWluLmpzIiwicmVnaXN0ZXJUeXBlcy5qcyIsIm1vZHVsZXNcXGFuaW1hdGlvbi5qcyIsIm1vZHVsZXNcXGZpbHRlcnMuanMiLCJtb2R1bGVzXFxsYXllci5qcyIsIm1vZHVsZXNcXG9iamVjdC5qcyIsIm1vZHVsZXNcXHNwYWNlLmpzIiwibW9kdWxlc1xcc3RhZ2UuanMiLCJtb2R1bGVzXFx0cmFuc2l0aW9uLmpzIiwibW9kdWxlc1xcdmVjdG9yLmpzIiwibW9kdWxlc1xcZ2FtZVxccGh5c2ljcy5qcyIsIm1vZHVsZXNcXGdhbWVcXHBvbHlnb25Db2xsaXNpb24uanMiLCJtb2R1bGVzXFxzaGFwZXNcXGFyYy5qcyIsIm1vZHVsZXNcXHNoYXBlc1xcaW1hZ2UuanMiLCJtb2R1bGVzXFxzaGFwZXNcXGxpbmUuanMiLCJtb2R1bGVzXFxzaGFwZXNcXHBvbHlnb24uanMiLCJtb2R1bGVzXFxzaGFwZXNcXHJlY3RhbmdsZS5qcyIsIm1vZHVsZXNcXHNoYXBlc1xcc3ByaXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjYW52YXNSZW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIG1vZHVsZS5nZXRHdWlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnBhcnNlVXJsID0gZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIHZhciBwYXJzZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgcGFyc2VyLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJvdG9jb2w6IHBhcnNlci5wcm90b2NvbCxcclxuICAgICAgICAgICAgcG9ydDogcGFyc2VyLnBvcnQsXHJcbiAgICAgICAgICAgIHBhdGhuYW1lOiBwYXJzZXIucGF0aG5hbWUsXHJcbiAgICAgICAgICAgIHNlYXJjaDogcGFyc2VyLnNlYXJjaCxcclxuICAgICAgICAgICAgaGFzaDogcGFyc2VyLmhhc2gsXHJcbiAgICAgICAgICAgIGhvc3Q6IHBhcnNlci5ob3N0XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnNsZWVwID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgd2hpbGUgKG5ldyBEYXRlKCkgLSBkYXRlIDwgc2Vjb25kcyAqIDEwMDApXHJcbiAgICAgICAgeyB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcbn0oVXRpbHMgfHwge30pKTsiLCJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgbW9kdWxlLmNvbnZlcnRUb1JhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgICAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG4gICAgfTtcclxuICAgIHZhciBsYXN0VXBkYXRlID0gKG5ldyBEYXRlKSAqIDEgLSAxO1xyXG5cclxuICAgIG1vZHVsZS5nZXRNb3VzZVBvcyA9IGZ1bmN0aW9uIChjYW52YXMsIGV2dCkge1xyXG4gICAgICAgIHZhciByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0LFxyXG4gICAgICAgICAgICB5OiBldnQuY2xpZW50WSAtIHJlY3QudG9wXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZ2V0Q2FudmFzID0gZnVuY3Rpb24gKHcsIGgpIHtcclxuICAgICAgICB2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGMud2lkdGggPSB3O1xyXG4gICAgICAgIGMuaGVpZ2h0ID0gaDtcclxuICAgICAgICByZXR1cm4gYztcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZ2V0UGl4ZWxzID0gZnVuY3Rpb24gKGltZykge1xyXG4gICAgICAgIHZhciBjLCBjdHg7XHJcbiAgICAgICAgaWYgKGltZy5nZXRDb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGMgPSBpbWc7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjdHggPSBjLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWN0eCkge1xyXG4gICAgICAgICAgICBjID0gVXRpbHMuZ2V0Q2FudmFzKGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBjLndpZHRoLCBjLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmdldEZwcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGU7XHJcbiAgICAgICAgdmFyIGZwcyA9IDEwMDAgLyAobm93IC0gbGFzdFVwZGF0ZSk7XHJcbiAgICAgICAgLy9mcHMgKz0gKHRoaXNGcmFtZUZQUyAtIGZwcykgLyByZWZGcHM7XHJcbiAgICAgICAgbGFzdFVwZGF0ZSA9IG5vdztcclxuXHJcbiAgICAgICAgcmV0dXJuIGZwcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG59KFV0aWxzIHx8IHt9KSk7IiwidmFyIFV0aWxzID0gKGZ1bmN0aW9uIChtb2R1bGUpIHtcclxuXHJcbiAgICBtb2R1bGUuaXNOdW1iZXIgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuICFpc05hTih2YWx1ZSk7IH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG59KFV0aWxzIHx8IHt9KSk7XHJcbiIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICB2YXIgbm9kZXMgPSBbXTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoO1xyXG4gICAgfTtcclxuICAgIHRoaXMuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGVzWzBdO1xyXG4gICAgfTtcclxuICAgIHRoaXMubGFzdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYnVpbGRMaXN0ID0gZnVuY3Rpb24gKG5vZGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0ID0gbm9kZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGkgPT09IGxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdCA9IG5vZGVzW2ldO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2Rlc1tpXS5wcmV2ID0gbm9kZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICBub2Rlc1tpXS5uZXh0ID0gbm9kZXNbaSArIDFdO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKG5vZGVzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hcHBlbmQgPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgIHZhciBsYXN0ID0gdGhpcy5sYXN0KCk7XHJcblxyXG4gICAgICAgIGlmIChub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxhc3QubmV4dCA9IG5vZGU7XHJcbiAgICAgICAgICAgIG5vZGUucHJldiA9IGxhc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RW51bWVyYXRvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSAtMTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZXNbaW5kZXhdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IG5vZGVzLmxlbmd0aCAtIDEpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1srK2luZGV4XTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJldjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzW2luZGV4LS1dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn0iLCIvL1xyXG4vL1JlZ2lzdGVyIHR5cGVzXHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwialF1ZXJ5XCIsICQpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcImxpbnFcIiwgbGlucSk7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwiVXRpbHNcIiwgVXRpbHMpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcIkV2ZW50RGlzcGF0Y2hlclwiLCBFdmVudERpc3BhdGNoZXIpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcIkxpbmtlZExpc3RcIiwgTGlua2VkTGlzdCk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgZ21lc3phcm9zIG9uIDEvMjgvMjAxNS5cclxuICovXHJcblxyXG4vL1xyXG4vL1JlZ2lzdGVyIHR5cGVzXHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwialF1ZXJ5XCIsIGpRdWVyeSk7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwibGlucVwiLCBsaW5xKTtcclxuXHJcblxyXG4vL0luIHVzZVxyXG52YXIgY2FudmFzID0gaW5qZWN0b3IoXCJqUXVlcnlcIiwgXCJsaW5xXCIpLmNsYXNzKGZ1bmN0aW9uICgkLCBsaW5xKSB7XHJcbiAgICBkZWJ1Z2dlcjtcclxufSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXNcIik7XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuQW5pbWF0aW9uID0gaW5qZWN0KClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAoaGFuZGxlciwgbGF5ZXIpIHtcclxuXHJcbiAgICAgICAgdmFyIHRpbWUgPSAwO1xyXG4gICAgICAgIHZhciBzdWJzY3JpYmVyO1xyXG4gICAgICAgIHZhciBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIHN0b3BwZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgcGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBhbmltYXRpb24gPSBmdW5jdGlvbiAoZnJhbWVSYXRlKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZXIoe1xyXG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlOiBmcmFtZVJhdGUsXHJcbiAgICAgICAgICAgICAgICBsYXN0VGltZTogdGltZSxcclxuICAgICAgICAgICAgICAgIHRpbWU6IHRpbWUgKyAxMDAwIC8gZnJhbWVSYXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aW1lICs9IDEwMDAgLyBmcmFtZVJhdGU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgc3RvcHBlZCA9IHBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzdWJzY3JpYmVyID0gbGF5ZXIub24oXCJhbmltYXRlXCIsIGFuaW1hdGlvbik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGltZSA9IDA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgc3Vic2NyaWJlcikge1xyXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc3RhcnRlZCAmJiBzdWJzY3JpYmVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuRmlsdGVyc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkNvbnZvbHV0ZSA9IGZ1bmN0aW9uIChpbWFnZSwgd2VpZ2h0cywgb3BhcXVlKSB7XHJcbiAgICB2YXIgc2lkZSA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KHdlaWdodHMubGVuZ3RoKSk7XHJcbiAgICB2YXIgaGFsZlNpZGUgPSBNYXRoLmZsb29yKHNpZGUgLyAyKTtcclxuICAgIHZhciBwaXhlbHMgPSBVdGlscy5nZXRQaXhlbHMoaW1hZ2UpO1xyXG4gICAgdmFyIHNyYyA9IHBpeGVscy5kYXRhO1xyXG4gICAgdmFyIHN3ID0gcGl4ZWxzLndpZHRoO1xyXG4gICAgdmFyIHNoID0gcGl4ZWxzLmhlaWdodDtcclxuICAgIC8vIHBhZCBvdXRwdXQgYnkgdGhlIGNvbnZvbHV0aW9uIG1hdHJpeFxyXG4gICAgdmFyIHcgPSBzdztcclxuICAgIHZhciBoID0gc2g7XHJcbiAgICB2YXIgb3V0cHV0ID0gVXRpbHMuZ2V0Q2FudmFzKHcsIGgpLmdldENvbnRleHQoXCIyZFwiKS5jcmVhdGVJbWFnZURhdGEodywgaCk7XHJcbiAgICB2YXIgZHN0ID0gb3V0cHV0LmRhdGE7XHJcbiAgICAvLyBnbyB0aHJvdWdoIHRoZSBkZXN0aW5hdGlvbiBpbWFnZSBwaXhlbHNcclxuICAgIHZhciBhbHBoYUZhYyA9IG9wYXF1ZSA/IDEgOiAwO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBoOyB5KyspIHtcclxuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHc7IHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc3kgPSB5O1xyXG4gICAgICAgICAgICB2YXIgc3ggPSB4O1xyXG4gICAgICAgICAgICB2YXIgZHN0T2ZmID0gKHkgKiB3ICsgeCkgKiA0O1xyXG4gICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHdlaWdoZWQgc3VtIG9mIHRoZSBzb3VyY2UgaW1hZ2UgcGl4ZWxzIHRoYXRcclxuICAgICAgICAgICAgLy8gZmFsbCB1bmRlciB0aGUgY29udm9sdXRpb24gbWF0cml4XHJcbiAgICAgICAgICAgIHZhciByID0gMCwgZyA9IDAsIGIgPSAwLCBhID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgY3kgPSAwOyBjeSA8IHNpZGU7IGN5KyspIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGN4ID0gMDsgY3ggPCBzaWRlOyBjeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjeSA9IHN5ICsgY3kgLSBoYWxmU2lkZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2N4ID0gc3ggKyBjeCAtIGhhbGZTaWRlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3kgPj0gMCAmJiBzY3kgPCBzaCAmJiBzY3ggPj0gMCAmJiBzY3ggPCBzdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3JjT2ZmID0gKHNjeSAqIHN3ICsgc2N4KSAqIDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3dCA9IHdlaWdodHNbY3kgKiBzaWRlICsgY3hdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByICs9IHNyY1tzcmNPZmZdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcgKz0gc3JjW3NyY09mZiArIDFdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgKz0gc3JjW3NyY09mZiArIDJdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgKz0gc3JjW3NyY09mZiArIDNdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRzdFtkc3RPZmZdID0gcjtcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDFdID0gZztcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDJdID0gYjtcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDNdID0gYSArIGFscGhhRmFjICogKDI1NSAtIGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvdXRwdXQ7XHJcbn1cclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkJsdXIgPSBmdW5jdGlvbiAoaW1hZ2UsIGJsdXJSYWRpdXMpIHtcclxuICAgIHJldHVybiBzdGFja0JsdXJJbWFnZShpbWFnZSwgYmx1clJhZGl1cyk7XHJcbn1cclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkdyYXlzY2FsZSA9IGZ1bmN0aW9uIChpbWFnZSwgYXJncykge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgdmFyIHIgPSBkW2ldO1xyXG4gICAgICAgIHZhciBnID0gZFtpICsgMV07XHJcbiAgICAgICAgdmFyIGIgPSBkW2kgKyAyXTtcclxuICAgICAgICAvLyBDSUUgbHVtaW5hbmNlIGZvciB0aGUgUkdCXHJcbiAgICAgICAgdmFyIHYgPSAwLjIxMjYgKiByICsgMC43MTUyICogZyArIDAuMDcyMiAqIGI7XHJcbiAgICAgICAgZFtpXSA9IGRbaSArIDFdID0gZFtpICsgMl0gPSB2XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGl4ZWxzO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQnJpZ2h0bmVzcyA9IGZ1bmN0aW9uIChpbWFnZSwgYWRqdXN0bWVudCkge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgZFtpXSArPSBhZGp1c3RtZW50O1xyXG4gICAgICAgIGRbaSArIDFdICs9IGFkanVzdG1lbnQ7XHJcbiAgICAgICAgZFtpICsgMl0gKz0gYWRqdXN0bWVudDtcclxuICAgIH1cclxuICAgIHJldHVybiBwaXhlbHM7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRmlsdGVycy5UaHJlc2hvbGQgPSBmdW5jdGlvbiAoaW1hZ2UsIHRocmVzaG9sZCkge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgdmFyIHIgPSBkW2ldO1xyXG4gICAgICAgIHZhciBnID0gZFtpICsgMV07XHJcbiAgICAgICAgdmFyIGIgPSBkW2kgKyAyXTtcclxuICAgICAgICB2YXIgdiA9ICgwLjIxMjYgKiByICsgMC43MTUyICogZyArIDAuMDcyMiAqIGIgPj0gdGhyZXNob2xkKSA/IDI1NSA6IDA7XHJcbiAgICAgICAgZFtpXSA9IGRbaSArIDFdID0gZFtpICsgMl0gPSB2XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGl4ZWxzO1xyXG59O1xyXG4iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5MYXllciA9IGluamVjdChcIlV0aWxzXCIsIFwiRXZlbnREaXNwYXRjaGVyXCIsIFwialF1ZXJ5XCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBkaXNwYXRjaGVyLCAkLCBjb250YWluZXIsIHdpZHRoLCBoZWlnaHQsIGFjdGl2ZSkge1xyXG5cclxuICAgICAgICB2YXIgX3NlbGYgPSB0aGlzO1xyXG4gICAgICAgIHZhciBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgX2ZvcmNlUmVuZGVyID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIF9kaXNwYXRjaGVyID0gbmV3IGRpc3BhdGNoZXIoKTtcclxuICAgICAgICB2YXIgX3RpbWUgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVyKS5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XHJcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBhY3RpdmU7XHJcbiAgICAgICAgLy9Gb3IgdGhlIGxpbmtlZCBsaXN0XHJcbiAgICAgICAgdGhpcy5wcmV2ID0gbnVsbDtcclxuICAgICAgICB0aGlzLm5leHQgPSBudWxsO1xyXG5cclxuICAgICAgICAvL0FycmF5IG9mIG9iamVjdHMgb24gdGhlIGxheWVyXHJcbiAgICAgICAgdGhpcy5vYmplY3RzID0gW107XHJcblxyXG5cclxuICAgICAgICB2YXIgX2NsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCBVdGlscy5nZXRNb3VzZVBvcyhldmVudC50YXJnZXQsIGV2ZW50KTtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLmNsaWNrLCBbZXZlbnQsIHBvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm9iamVjdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMucG9pbnRJbk9iamVjdChwb3NpdGlvbiwgdGhpcy5vYmplY3RzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0c1tpXS50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMuY2xpY2ssIGV2ZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcy5wcmV2LmNhbnZhcykudHJpZ2dlcihcImNsaWNrXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfbW91c2Vtb3ZlSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCBVdGlscy5nZXRNb3VzZVBvcyhldmVudC50YXJnZXQsIGV2ZW50KTtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlbW92ZSwgW2V2ZW50LCBwb3NpdGlvbl0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5vYmplY3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zLnBvaW50SW5PYmplY3QocG9zaXRpb24sIHRoaXMub2JqZWN0c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0udHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlbW92ZSwgW2V2ZW50LCBwb3NpdGlvbl0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldikge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzLnByZXYuY2FudmFzKS50cmlnZ2VyKFwibW91c2Vtb3ZlXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfbW91c2VlbnRlckhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gfHwgVXRpbHMuZ2V0TW91c2VQb3MoZXZlbnQudGFyZ2V0LCBldmVudCk7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZWVudGVyLCBbZXZlbnQsIHBvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm9iamVjdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMucG9pbnRJbk9iamVjdChwb3NpdGlvbiwgdGhpcy5vYmplY3RzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0c1tpXS50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2VlbnRlciwgW2V2ZW50LCBwb3NpdGlvbl0pXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldikge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzLnByZXYuY2FudmFzKS50cmlnZ2VyKFwibW91c2VlbnRlclwiLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX21vdXNlbGVhdmVIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IFV0aWxzLmdldE1vdXNlUG9zKGV2ZW50LnRhcmdldCwgZXZlbnQpO1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2VsZWF2ZSwgW2V2ZW50LCBwb3NpdGlvbl0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5vYmplY3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zLnBvaW50SW5PYmplY3QocG9zaXRpb24sIHRoaXMub2JqZWN0c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0udHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlbGVhdmUsIFtldmVudCwgcG9zaXRpb25dKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2KSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMucHJldi5jYW52YXMpLnRyaWdnZXIoXCJtb3VzZWxlYXZlXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfa2V5ZG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLmtleWRvd24sIGV2ZW50KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX2tleXVwSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMua2V5dXAsIGV2ZW50KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX2tleXByZXNzSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMua2V5cHJlc3MsIGV2ZW50KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy9FdmVudCB3aXJldXBzXHJcbiAgICAgICAgJCh0aGlzLmNhbnZhcykub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIF9jbGlja0hhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQsIHBvc2l0aW9uKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCh0aGlzLmNhbnZhcykub24oXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBfbW91c2Vtb3ZlSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCwgcG9zaXRpb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKHRoaXMuY2FudmFzKS5vbihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBfbW91c2VlbnRlckhhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQsIHBvc2l0aW9uKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCh0aGlzLmNhbnZhcykub24oXCJtb3VzZWxlYXZlXCIsIGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgX21vdXNlbGVhdmVIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50LCBwb3NpdGlvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2tleWRvd25IYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oXCJrZXl1cFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2tleXVwSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKFwia2V5cHJlc3NcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9rZXlwcmVzc0hhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLm9uID0gZnVuY3Rpb24gKHR5cGUsIGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgaWYgKCFSZW5kZXJKcy5DYW52YXMuRXZlbnRzW3R5cGVdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIF9kaXNwYXRjaGVyLnN1YnNjcmliZSh0eXBlLCBoYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL0FkZCBhbiBvYmplY3QgdG8gdGhlIGxheWVyLCBpdCB3aWxsIGJlIHJlbmRlcmVkIG9uIHRoaXMgbGF5ZXJcclxuICAgICAgICB0aGlzLmFkZE9iamVjdCA9IGZ1bmN0aW9uIChvYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKCEob2JqZWN0IGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLk9iamVjdCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFuIG9iamVjdCBvbiB0aGUgY2FudmFzIHNob3VsZCBiZSBpbmhlcml0ZWQgZnJvbSBDYW52YXNPYmplY3QhXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9iamVjdC5sYXllciA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMub2JqZWN0cy5wdXNoKG9iamVjdCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yZW1vdmVPYmplY3QgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGxpbnEodGhpcy5vYmplY3RzKS5yZW1vdmUoZnVuY3Rpb24gKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtID09PSBvYmplY3Q7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBvYmplY3QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICBfZm9yY2VSZW5kZXIgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucmVzaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICBfZm9yY2VSZW5kZXIgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vUmV0dXJucyB0cnVlIGlmIHRoZSBsYXllciBoYXMgc3ByaXRlIG9iamVjdHMgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgICAgICAgdGhpcy5oYXNTcHJpdGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gdGhpcy5vYmplY3RzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RzW2ldIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5TcHJpdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy9SZWRyYXcgb2JqZWN0cyBvbiBsYXllcnMgaWYgaXQncyBhY3RpdmVcclxuICAgICAgICB0aGlzLmRyYXdPYmplY3RzID0gZnVuY3Rpb24gKGZyYW1lLCBhYnNQb3NpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIV9mb3JjZVJlbmRlciAmJiAoKF9pbml0aWFsaXplZCAmJiAhX2Rpc3BhdGNoZXIuaGFzU3Vic2NyaWJlcnMoJ2FuaW1hdGUnKSAmJiAhdGhpcy5oYXNTcHJpdGVzKHRoaXMpICYmICF0aGlzLmFjdGl2ZSkgfHwgdGhpcy5vYmplY3RzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFrdEZyYW1lUmF0ZSA9IE1hdGguZmxvb3IoMTAwMCAvIGZyYW1lKTtcclxuXHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoXCJhbmltYXRlXCIsIGZyYW1lKTtcclxuICAgICAgICAgICAgdmFyIG9iamVjdHNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gdGhpcy5vYmplY3RzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub2JqZWN0c1tpXS5sb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3RzTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0uZHJhdyh0aGlzLmN0eCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lUmF0ZTogZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWU6IF90aW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWU6IF90aW1lICsgYWt0RnJhbWVSYXRlXHJcbiAgICAgICAgICAgICAgICB9LCBhYnNQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9iamVjdHNMb2FkZWQpXHJcbiAgICAgICAgICAgICAgICBfaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAoX2ZvcmNlUmVuZGVyKSB7XHJcbiAgICAgICAgICAgICAgICBfZm9yY2VSZW5kZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBfdGltZSArPSBha3RGcmFtZVJhdGU7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuIiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkV2ZW50cyA9IHtcclxuICAgIGFuaW1hdGU6IFwiYW5pbWF0ZVwiLFxyXG4gICAgY2xpY2s6IFwiY2xpY2tcIixcclxuICAgIGtleWRvd246IFwia2V5ZG93blwiLFxyXG4gICAga2V5dXA6IFwia2V5dXBcIixcclxuICAgIGtleXByZXNzOiBcImtleXByZXNzXCIsXHJcbiAgICBtb3VzZW1vdmU6IFwibW91c2Vtb3ZlXCIsXHJcbiAgICBtb3VzZWhvdmVyOiBcIm1vdXNlaG92ZXJcIixcclxuICAgIG1vdXNlbGVhdmU6IFwibW91c2VsZWF2ZVwiLFxyXG4gICAgY29sbGlzaW9uOiBcImNvbGxpc2lvblwiLFxyXG4gICAgb2JqZWN0Q2hhbmdlZDogXCJvYmplY3RDaGFuZ2VkXCJcclxufTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIGJhc2UgY2xhc3MgZm9yIGRpZmZlcmVudCB0eXBlIG9mIHNoYXBlc1xyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLk9iamVjdCA9IGluamVjdChcIkV2ZW50RGlzcGF0Y2hlclwiLCBcImpRdWVyeVwiLCBcIlV0aWxzXCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKGRpc3BhdGNoZXIsICQsIHV0aWxzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IG5ldyBkaXNwYXRjaGVyKCk7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIHRoaXMuaWQgPSB1dGlscy5nZXRHdWlkKCk7XHJcbiAgICAgICAgdGhpcy5wb3MgPSBuZXcgUmVuZGVySnMuVmVjdG9yKG9wdGlvbnMueCwgb3B0aW9ucy55KTtcclxuICAgICAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aCB8fCAwO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgMDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gb3B0aW9ucy5hbmdsZSB8fCAwO1xyXG4gICAgICAgIHRoaXMuc2NhbGVYID0gb3B0aW9ucy5zY2FsZVg7XHJcbiAgICAgICAgdGhpcy5zY2FsZVkgPSBvcHRpb25zLnNjYWxlWTtcclxuICAgICAgICB0aGlzLmJsdXJSYWRpdXMgPSBvcHRpb25zLmJsdXJSYWRpdXM7XHJcbiAgICAgICAgdGhpcy5jb2xsaXNpb24gPSBvcHRpb25zLmNvbGxpc2lvbiB8fCBmYWxzZTtcclxuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmxheWVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpSZXR1cm5zIHdpdGggdGhlIGNlbnRlciBwb2ludCBvZiB0aGUgc2hhcGVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldENlbnRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy5wb3MueCArICh0aGlzLndpZHRoKSAvIDIsIHRoaXMucG9zLnkgKyAodGhpcy5oZWlnaHQpIC8gMik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAqUmV0dXJucyB3aXRoIHRoZSByZWN0IGFyb3VuZCB0aGUgc2hhcGVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldENlbnRlcmVkUmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG8gPSB0aGlzLnBvcztcclxuICAgICAgICAgICAgcmV0dXJuIHt4OiBvLngsIHk6IG8ueSwgd2lkdGg6IHRoaXMud2lkdGgsIGhlaWdodDogdGhpcy5oZWlnaHR9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBGaWx0ZXJzIHdoaWNoIHdpbGwgYmUgYXBwbGllZCBvbiB0aGUgb2JqZWN0KGJsdXIsIGdyZXlzY2FsZSBldGMuLi4pXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zZXRmaWx0ZXJzID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGRYLCBkWSkge1xyXG4gICAgICAgICAgICB2YXIgcHJldlBvcyA9IFJlbmRlckpzLlZlY3Rvci5jbG9uZSh0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcclxuICAgICAgICAgICAgdmFyIG5ld1BvcyA9IHRoaXMucG9zLmFkZChuZXcgUmVuZGVySnMuVmVjdG9yKE1hdGguZmxvb3IoZFgpLCBNYXRoLmZsb29yKGRZKSkpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IG5ld1BvcztcclxuICAgICAgICAgICAgaWYgKHByZXZQb3MueCAhPT0gbmV3UG9zLnggfHwgcHJldlBvcy55ICE9PSBuZXdQb3MueSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMub2JqZWN0Q2hhbmdlZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqUm90YXRlIHRoZSBzaGFwZSB0byB0aGUgZ2l2ZW4gZGVncmVlLCBkdXJpbmcgdGhlIHRpbWVcclxuICAgICAgICAgKi1kZWcgcm90YXRpb24gYW5nbGVcclxuICAgICAgICAgKi10IGFuaW1hdGlvbiB0aW1lXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb3RhdGVTaGFwZSA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoby54LCBvLnkpO1xyXG4gICAgICAgICAgICBjdHgucm90YXRlKHV0aWxzLmNvbnZlcnRUb1JhZCh0aGlzLmFuZ2xlKSk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLW8ueCwgLW8ueSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKlNjYWxlIHRoZSBzaGFwZSB3aXRoIHRoZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LCBkdXJpbmcgdGhlIHRpbWVcclxuICAgICAgICAgKi13aWR0aCBzY2FsZSBob3Jpem9udGFsbHkgcmF0aW8gaW50ZWdlciAxIGlzIDEwMCVcclxuICAgICAgICAgKi1oZWlnaHQgc2NhbGUgdmVydGljYWxseSByYXRpbyBpbnRlZ2VyIDEgaXMgMTAwJVxyXG4gICAgICAgICAqLXQgYW5pbWF0aW9uIHRpbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnNjYWxlU2hhcGUgPSBmdW5jdGlvbiAoY3R4LCBzY2FsZVgsIHNjYWxlWSkge1xyXG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoby54LCBvLnkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoc2NhbGVYLCBzY2FsZVkpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKC1vLngsIC1vLnkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAodHlwZSwgaGFuZGxlcikge1xyXG4gICAgICAgICAgICBpZiAoIVJlbmRlckpzLkNhbnZhcy5FdmVudHNbdHlwZV0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZSh0eXBlLCBoYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIgPSBmdW5jdGlvbiAoZXZlbnQsIGFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKCFSZW5kZXJKcy5DYW52YXMuRXZlbnRzW2V2ZW50XSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci50cmlnZ2VyKGV2ZW50LCBhcmdzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pOyIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IE1DRyBvbiAyMDE1LjAxLjI1Li5cclxuICovXHJcbnZhciBSZW5kZXJKcyA9IFJlbmRlckpzIHx8IHt9O1xyXG5SZW5kZXJKcy5DYW52YXMgPSBSZW5kZXJKcy5DYW52YXMgfHwge307XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuU3BhY2UgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgIHZhciBfaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5zdGFnZSA9IG9wdGlvbnMuc3RhZ2U7XHJcbiAgICB9O1xyXG4gICAgX2luaXQob3B0aW9ucyk7XHJcbn0iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5TdGFnZSA9IGluamVjdChcIlV0aWxzXCIsIFwiRXZlbnREaXNwYXRjaGVyXCIsIFwiTGlua2VkTGlzdFwiKVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgZGlzcGF0Y2hlciwgbGlua2VkTGlzdCwgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB2YXIgX2NvbnRhaW5lciA9IG9wdGlvbnMuY29udGFpbmVyIHx8IFwidmlld3BvcnRcIjtcclxuICAgICAgICB2YXIgX2N1cnJlbnRGcHMgPSAwO1xyXG4gICAgICAgIHZhciBfZGlzcGF0Y2hlciA9IG5ldyBkaXNwYXRjaGVyKCk7XHJcbiAgICAgICAgdGhpcy5sYXllcnMgPSBuZXcgbGlua2VkTGlzdCgpO1xyXG5cclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFJlbmRlckpzLlZlY3RvcigtNTAsIC01MCk7XHJcblxyXG4gICAgICAgIHZhciBfaW52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICBfY3VycmVudEZwcyA9IHV0aWxzLmdldEZwcygpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzLmxheWVycy5nZXRFbnVtZXJhdG9yKCk7XHJcbiAgICAgICAgICAgIHdoaWxlIChlbnVtZXJhdG9yLm5leHQoKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhdG9yLmN1cnJlbnQoKS5kcmF3T2JqZWN0cyhfY3VycmVudEZwcywgdGhpcy5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBfaW52YWxpZGF0ZS5jYWxsKHNlbGYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIF9pbnZhbGlkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMucmVzaXplID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2NvbnRhaW5lcikuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgXCJweFwiO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChfY29udGFpbmVyKS5zdHlsZS5oZWlnaHQgPSB0aGlzLmhlaWdodCArIFwicHhcIjtcclxuICAgICAgICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzLmxheWVycy5nZXRFbnVtZXJhdG9yKCk7XHJcbiAgICAgICAgICAgIHdoaWxlIChlbnVtZXJhdG9yLm5leHQoKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhdG9yLmN1cnJlbnQoKS5yZXNpemUod2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLm9uSW52YWxpZGF0ZSA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZGlzcGF0Y2hlci5zdWJzY3JpYmUoXCJvbkludmFsaWRhdGVcIiwgaGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jcmVhdGVMYXllciA9IGZ1bmN0aW9uIChhY3RpdmUpIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gbmV3IFJlbmRlckpzLkNhbnZhcy5MYXllcihfY29udGFpbmVyLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgYWN0aXZlKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnMuYXBwZW5kKGxheWVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnJlc2l6ZShvcHRpb25zLndpZHRoIHx8IDEyMDAsIG9wdGlvbnMuaGVpZ2h0IHx8IDgwMCk7XHJcbiAgICB9KTsiLCJ2YXIgUmVuZGVySnMgPSBSZW5kZXJKcyB8fCB7fTtcclxuUmVuZGVySnMuQ2FudmFzID0gUmVuZGVySnMuQ2FudmFzIHx8IHt9O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MgPSBSZW5kZXJKcy5DYW52YXMuRWFzaW5ncyB8fCB7fTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkJvdW5jZUVhc2VPdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgaWYgKCh0IC89IGQpIDwgKDEgLyAyLjc1KSkge1xyXG4gICAgICAgIHJldHVybiBjICogKDcuNTYyNSAqIHQgKiB0KSArIGI7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0IDwgKDIgLyAyLjc1KSkge1xyXG4gICAgICAgIHJldHVybiBjICogKDcuNTYyNSAqICh0IC09ICgxLjUgLyAyLjc1KSkgKiB0ICsgMC43NSkgKyBiO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodCA8ICgyLjUgLyAyLjc1KSkge1xyXG4gICAgICAgIHJldHVybiBjICogKDcuNTYyNSAqICh0IC09ICgyLjI1IC8gMi43NSkpICogdCArIDAuOTM3NSkgKyBiO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGMgKiAoNy41NjI1ICogKHQgLT0gKDIuNjI1IC8gMi43NSkpICogdCArIDAuOTg0Mzc1KSArIGI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5Cb3VuY2VFYXNlSW4gPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgcmV0dXJuIGMgLSBLaW5ldGljLkVhc2luZ3MuQm91bmNlRWFzZU91dChkIC0gdCwgMCwgYywgZCkgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuQm91bmNlRWFzZUluT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIGlmICh0IDwgZCAvIDIpIHtcclxuICAgICAgICByZXR1cm4gS2luZXRpYy5FYXNpbmdzLkJvdW5jZUVhc2VJbih0ICogMiwgMCwgYywgZCkgKiAwLjUgKyBiO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIEtpbmV0aWMuRWFzaW5ncy5Cb3VuY2VFYXNlT3V0KHQgKiAyIC0gZCwgMCwgYywgZCkgKiAwLjUgKyBjICogMC41ICsgYjtcclxuICAgIH1cclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVhc2VJbiA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICByZXR1cm4gYyAqICh0IC89IGQpICogdCArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FYXNlT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIHJldHVybiAtYyAqICh0IC89IGQpICogKHQgLSAyKSArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FYXNlSW5PdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgaWYgKCh0IC89IGQgLyAyKSA8IDEpIHtcclxuICAgICAgICByZXR1cm4gYyAvIDIgKiB0ICogdCArIGI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gLWMgLyAyICogKCgtLXQpICogKHQgLSAyKSAtIDEpICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVsYXN0aWNFYXNlSW4gPSBmdW5jdGlvbiAodCwgYiwgYywgZCwgYSwgcCkge1xyXG4gICAgLy8gYWRkZWQgcyA9IDBcclxuICAgIHZhciBzID0gMDtcclxuICAgIGlmICh0ID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGI7XHJcbiAgICB9XHJcbiAgICBpZiAoKHQgLz0gZCkgPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gYiArIGM7XHJcbiAgICB9XHJcbiAgICBpZiAoIXApIHtcclxuICAgICAgICBwID0gZCAqIDAuMztcclxuICAgIH1cclxuICAgIGlmICghYSB8fCBhIDwgTWF0aC5hYnMoYykpIHtcclxuICAgICAgICBhID0gYztcclxuICAgICAgICBzID0gcCAvIDQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBzID0gcCAvICgyICogTWF0aC5QSSkgKiBNYXRoLmFzaW4oYyAvIGEpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIC0oYSAqIE1hdGgucG93KDIsIDEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiBkIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVsYXN0aWNFYXNlT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQsIGEsIHApIHtcclxuICAgIC8vIGFkZGVkIHMgPSAwXHJcbiAgICB2YXIgcyA9IDA7XHJcbiAgICBpZiAodCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBiO1xyXG4gICAgfVxyXG4gICAgaWYgKCh0IC89IGQgLyAyKSA9PT0gMikge1xyXG4gICAgICAgIHJldHVybiBiICsgYztcclxuICAgIH1cclxuICAgIGlmICghcCkge1xyXG4gICAgICAgIHAgPSBkICogKDAuMyAqIDEuNSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWEgfHwgYSA8IE1hdGguYWJzKGMpKSB7XHJcbiAgICAgICAgYSA9IGM7XHJcbiAgICAgICAgcyA9IHAgLyA0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcyA9IHAgLyAoMiAqIE1hdGguUEkpICogTWF0aC5hc2luKGMgLyBhKTtcclxuICAgIH1cclxuICAgIGlmICh0IDwgMSkge1xyXG4gICAgICAgIHJldHVybiAtMC41ICogKGEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogZCAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKSArIGI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogZCAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgYyArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FbGFzdGljRWFzZUluT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQsIGEsIHApIHtcclxuICAgIC8vIGFkZGVkIHMgPSAwXHJcbiAgICB2YXIgcyA9IDA7XHJcbiAgICBpZiAodCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBiO1xyXG4gICAgfVxyXG4gICAgaWYgKCh0IC89IGQgLyAyKSA9PT0gMikge1xyXG4gICAgICAgIHJldHVybiBiICsgYztcclxuICAgIH1cclxuICAgIGlmICghcCkge1xyXG4gICAgICAgIHAgPSBkICogKDAuMyAqIDEuNSk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWEgfHwgYSA8IE1hdGguYWJzKGMpKSB7XHJcbiAgICAgICAgYSA9IGM7XHJcbiAgICAgICAgcyA9IHAgLyA0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcyA9IHAgLyAoMiAqIE1hdGguUEkpICogTWF0aC5hc2luKGMgLyBhKTtcclxuICAgIH1cclxuICAgIGlmICh0IDwgMSkge1xyXG4gICAgICAgIHJldHVybiAtMC41ICogKGEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogZCAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKSArIGI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogZCAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgYyArIGI7XHJcbn07XHJcblxyXG5cclxuXHJcblJlbmRlckpzLkNhbnZhcy5UcmFuc2l0aW9uID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgcmV2ZXJzZSA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuZHVyYXRpb24gPSBvcHRpb25zLmR1cmF0aW9uICogMTAwMCB8fCAxMDAwO1xyXG5cclxuICAgIHRoaXMuc2hhcGUgPSBvcHRpb25zLnNoYXBlO1xyXG5cclxuICAgIHRoaXMucHJvcHMgPSBvcHRpb25zLnByb3BzIHx8IHt9O1xyXG4gICAgdGhpcy5vcmlnUHJvcHMgPSB7fTtcclxuICAgIGZvciAodmFyIHByb3AgaW4gb3B0aW9ucy5wcm9wcykge1xyXG4gICAgICAgIHRoaXMub3JpZ1Byb3BzW3Byb3BdID0gdGhpcy5zaGFwZVtwcm9wXTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhc2luZyA9IG9wdGlvbnMuZWFzaW5nIHx8IFJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVhc2VJbk91dDtcclxuXHJcbiAgICB2YXIgYW5pbWF0aW9uID0gbmV3IFJlbmRlckpzLkNhbnZhcy5BbmltYXRpb24oZnVuY3Rpb24gKGZyYW1lKSB7XHJcbiAgICAgICAgaWYgKGZyYW1lLnRpbWUgPj0gc2VsZi5kdXJhdGlvbikge1xyXG4gICAgICAgICAgICBhbmltYXRpb24uc3RvcCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNlbGYucHJvcHMpIHtcclxuICAgICAgICAgICAgaWYgKHJldmVyc2UpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2hhcGVbcHJvcF0gPSBzZWxmLmVhc2luZyhmcmFtZS50aW1lLCBzZWxmLm9yaWdQcm9wc1twcm9wXSArIHNlbGYucHJvcHNbcHJvcF0sIHNlbGYucHJvcHNbcHJvcF0gKiAtMSwgc2VsZi5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNoYXBlW3Byb3BdID0gc2VsZi5lYXNpbmcoZnJhbWUudGltZSwgc2VsZi5vcmlnUHJvcHNbcHJvcF0sIHNlbGYucHJvcHNbcHJvcF0sIHNlbGYuZHVyYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sIHRoaXMuc2hhcGUubGF5ZXIpO1xyXG5cclxuICAgIHRoaXMucGxheSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhbmltYXRpb24uc3RhcnQoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhbmltYXRpb24ucGF1c2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFuaW1hdGlvbi5zdG9wKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXZlcnNlID0gdHJ1ZTtcclxuICAgICAgICBhbmltYXRpb24uc3RhcnQoKTtcclxuICAgIH07XHJcbn0iLCJ2YXIgUmVuZGVySnMgPSBSZW5kZXJKcyB8fCB7fTtcclxuXHJcblJlbmRlckpzLlZlY3RvciA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICB0aGlzLnggPSB4IHx8IDA7XHJcbiAgICB0aGlzLnkgPSB5IHx8IDA7XHJcblxyXG4gICAgdGhpcy5zZXQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHRoaXMueCA9IHYueDtcclxuICAgICAgICB0aGlzLnkgPSB2Lnk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubGVuZ3RoU3F1YXJlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5wb3codGhpcy54LCAyKSArIE1hdGgucG93KHRoaXMueSwgMik7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aDIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG90KHRoaXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBlcnAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy55LCAtdGhpcy54KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zY2FsZSA9IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy54ICogcywgdGhpcy55ICogcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc3ViID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICBpZiAodiBpbnN0YW5jZW9mIFJlbmRlckpzLlZlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnggLSB2LngsIHRoaXMueSAtIHYueSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnggLSB2LCB0aGlzLnkgLSB2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICBpZiAodiBpbnN0YW5jZW9mIFJlbmRlckpzLlZlY3Rvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnggKyB2LngsIHRoaXMueSArIHYueSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnggKyB2LCB0aGlzLnkgKyB2KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZG90ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmRpc3QgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN1Yih2KS5sZW5ndGgoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5ub3JtYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbGUoMSAvIHRoaXMubGVuZ3RoKCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFuZ2xlID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kb3QodikgLyAodGhpcy5sZW5ndGgoKSAqIHYubGVuZ3RoKCkpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnRydW5jYXRlID0gZnVuY3Rpb24gKG1heCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1pbihtYXgsIHRoaXMubGVuZ3RoKCkpO1xyXG4gICAgICAgIHJldHVybiBsZW5ndGg7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucm90YXRlID0gZnVuY3Rpb24gKGFuZ2xlKSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLng7XHJcbiAgICAgICAgdmFyIHkgPSB0aGlzLnk7XHJcbiAgICAgICAgdGhpcy54ID0geCAqICBNYXRoLmNvcyhVdGlscy5jb252ZXJ0VG9SYWQoYW5nbGUpKSAtIHkgKiBNYXRoLnNpbihVdGlscy5jb252ZXJ0VG9SYWQoYW5nbGUpKTtcclxuICAgICAgICB0aGlzLnkgPSB5ICogIE1hdGguY29zKFV0aWxzLmNvbnZlcnRUb1JhZChhbmdsZSkpICsgeCAqIE1hdGguc2luKFV0aWxzLmNvbnZlcnRUb1JhZChhbmdsZSkpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKHJvdW5kZWQpIHtcclxuICAgICAgICBpZiAocm91bmRlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCIoXCIgKyBNYXRoLnJvdW5kKHRoaXMueCkgKyBcIiwgXCIgKyBNYXRoLnJvdW5kKHRoaXMueSkgKyBcIilcIjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIihcIiArIHRoaXMueCArIFwiLCBcIiArIHRoaXMueSArIFwiKVwiO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLmNsb25lID0gZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHgsIHkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgYXJlYSBvZiBhIHRyaWFuZ2xlIHNwYW5uZWQgYnkgdGhlIHRocmVlIGdpdmVuIHBvaW50cy4gTm90ZSB0aGF0IHRoZSBhcmVhIHdpbGwgYmUgbmVnYXRpdmUgaWYgdGhlIHBvaW50cyBhcmUgbm90IGdpdmVuIGluIGNvdW50ZXItY2xvY2t3aXNlIG9yZGVyLlxyXG4gKiBAc3RhdGljXHJcbiAqIEBtZXRob2QgYXJlYVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gYVxyXG4gKiBAcGFyYW0gIHtBcnJheX0gYlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gY1xyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5SZW5kZXJKcy5WZWN0b3IuYXJlYSA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICByZXR1cm4gKCgoYi54IC0gYS54KSAqIChjLnkgLSBhLnkpKSAtICgoYy54IC0gYS54KSAqIChiLnkgLSBhLnkpKSk7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IubGVmdCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmFyZWEoYSwgYiwgYykgPiAwO1xyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLmxlZnRPbiA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmFyZWEoYSwgYiwgYykgPj0gMDtcclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5yaWdodCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmFyZWEoYSwgYiwgYykgPCAwO1xyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLnJpZ2h0T24gPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5hcmVhKGEsIGIsIGMpIDw9IDA7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3Iuc3FkaXN0ID0gZnVuY3Rpb24gKGEsIGIpIHtcclxuICAgIHZhciBkeCA9IGIueCAtIGEueDtcclxuICAgIHZhciBkeSA9IGIueSAtIGEueTtcclxuICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIFNjYWxhcigpIHtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIHR3byBzY2FsYXJzIGFyZSBlcXVhbFxyXG4gKiBAc3RhdGljXHJcbiAqIEBtZXRob2QgZXFcclxuICogQHBhcmFtICB7TnVtYmVyfSBhXHJcbiAqIEBwYXJhbSAge051bWJlcn0gYlxyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IFtwcmVjaXNpb25dXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqL1xyXG5TY2FsYXIuZXEgPSBmdW5jdGlvbiAoYSwgYiwgcHJlY2lzaW9uKSB7XHJcbiAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgMDtcclxuICAgIHJldHVybiBNYXRoLmFicyhhIC0gYikgPCBwcmVjaXNpb247XHJcbn07IiwidmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblJlbmRlckpzLlBoeXNpY3MgPSBSZW5kZXJKcy5QaHlzaWNzIHx8IHt9O1xyXG5cclxuUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zID0gKGZ1bmN0aW9uIChtb2R1bGUpIHtcclxuXHJcbiAgICB2YXIgX3JheUNhc3RpbmdBbGcgPSBmdW5jdGlvbiAocCwgZWRnZSkge1xyXG4gICAgICAgICd0YWtlcyBhIHBvaW50IHA9UHQoKSBhbmQgYW4gZWRnZSBvZiB0d28gZW5kcG9pbnRzIGEsYj1QdCgpIG9mIGEgbGluZSBzZWdtZW50IHJldHVybnMgYm9vbGVhbic7XHJcbiAgICAgICAgdmFyIF9lcHMgPSAwLjAwMDAxO1xyXG4gICAgICAgIHZhciBfaHVnZSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgdmFyIF90aW55ID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuICAgICAgICB2YXIgbV9ibHVlLCBtX3JlZCA9IDA7XHJcbiAgICAgICAgdmFyIGEgPSBlZGdlLnAxO1xyXG4gICAgICAgIHZhciBiID0gZWRnZS5wMjtcclxuXHJcbiAgICAgICAgaWYgKGEueSA+IGIueSkge1xyXG4gICAgICAgICAgICBhLnNldChiKTtcclxuICAgICAgICAgICAgYi5zZXQoYSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChwLnkgPT0gYS55IHx8IHAueSA9PSBiLnkpXHJcbiAgICAgICAgICAgIHAueSArPSBfZXBzO1xyXG5cclxuICAgICAgICB2YXIgaW50ZXJzZWN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICgocC55ID4gYi55IHx8IHAueSA8IGEueSkgfHwgKHAueCA+IE1hdGgubWF4KGEueCwgYi54KSkpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHAueCA8IE1hdGgubWluKGEueCwgYi54KSlcclxuICAgICAgICAgICAgaW50ZXJzZWN0ID0gdHJ1ZTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGEueCAtIGIueCkgPiBfdGlueSlcclxuICAgICAgICAgICAgICAgIG1fcmVkID0gKGIueSAtIGEueSkgLyAoYi54IC0gYS54KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbV9yZWQgPSBfaHVnZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhhLnggLSBwLngpID4gX3RpbnkpXHJcbiAgICAgICAgICAgICAgICBtX2JsdWUgPSAocC55IC0gYS55KSAvIChwLnggLSBhLngpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBtX2JsdWUgPSBfaHVnZVxyXG4gICAgICAgICAgICBpbnRlcnNlY3QgPSBtX2JsdWUgPj0gbV9yZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW50ZXJzZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfdm9ybm9pUmVnaW9uID0gZnVuY3Rpb24gKGxpbmUsIHBvaW50KSB7XHJcbiAgICAgICAgdmFyIGxlbjIgPSBsaW5lLmxlbmd0aDIoKTtcclxuICAgICAgICB2YXIgZHAgPSBwb2ludC5kb3QobGluZSk7XHJcbiAgICAgICAgLy8gSWYgdGhlIHBvaW50IGlzIGJleW9uZCB0aGUgc3RhcnQgb2YgdGhlIGxpbmUsIGl0IGlzIGluIHRoZVxyXG4gICAgICAgIC8vIGxlZnQgdm9ybm9pIHJlZ2lvbi5cclxuICAgICAgICBpZiAoZHAgPCAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSWYgdGhlIHBvaW50IGlzIGJleW9uZCB0aGUgZW5kIG9mIHRoZSBsaW5lLCBpdCBpcyBpbiB0aGVcclxuICAgICAgICAvLyByaWdodCB2b3Jub2kgcmVnaW9uLlxyXG4gICAgICAgIGVsc2UgaWYgKGRwID4gbGVuMikge1xyXG4gICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdzIGluIHRoZSBtaWRkbGUgb25lLlxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9wb2ludEluUG9seWdvbiA9IGZ1bmN0aW9uIChwLCBwb2x5Z29uKSB7XHJcbiAgICAgICAgdmFyIHJlcyA9IGZhbHNlO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9seWdvbi5yRWRnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKF9yYXlDYXN0aW5nQWxnKHAsIHBvbHlnb24uckVkZ2VzW2ldKSlcclxuICAgICAgICAgICAgICAgIHJlcyA9ICFyZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9wb2ludEluTGluZSA9IGZ1bmN0aW9uIChwLCBsaW5lKSB7XHJcbiAgICAgICAgdmFyIG0gPSAobGluZS5wb3MyLnkgLSBsaW5lLnBvcy55KSAvIChsaW5lLnBvczIueCAtIGxpbmUucG9zLngpO1xyXG5cclxuICAgICAgICByZXR1cm4gcC55IC0gbGluZS5wb3MueSA9PSBtICogKHAueCAtIGxpbmUucG9zLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcG9pbnRJbkNpcmNsZSA9IGZ1bmN0aW9uIChwLCBjKSB7XHJcbiAgICAgICAgbyA9IGMuZ2V0Q2VudGVyKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLnBvdyhwLnggLSBvLngsIDIpICsgTWF0aC5wb3cocC55IC0gby55LCAyKSA8PSBNYXRoLnBvdygodGhpcy53aWR0aCAvIDIpLCAyKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3JlY3RWc1JlY3QgPSBmdW5jdGlvbiAocjEsIHIyKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gcjEud2lkdGg7XHJcbiAgICAgICAgdmFyIHRoID0gcjEuaGVpZ2h0O1xyXG4gICAgICAgIHZhciBydyA9IHIyLndpZHRoO1xyXG4gICAgICAgIHZhciByaCA9IHIyLmhlaWdodDtcclxuICAgICAgICBpZiAocncgPD0gMCB8fCByaCA8PSAwIHx8IHR3IDw9IDAgfHwgdGggPD0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0eCA9IHIxLng7XHJcbiAgICAgICAgdmFyIHR5ID0gcjEueTtcclxuICAgICAgICB2YXIgcnggPSByMi54O1xyXG4gICAgICAgIHZhciByeSA9IHIyLnk7XHJcbiAgICAgICAgcncgKz0gcng7XHJcbiAgICAgICAgcmggKz0gcnk7XHJcbiAgICAgICAgdHcgKz0gdHg7XHJcbiAgICAgICAgdGggKz0gdHk7XHJcbiAgICAgICAgLy9vdmVyZmxvdyB8fCBpbnRlcnNlY3RcclxuICAgICAgICByZXR1cm4gKChydyA8IHJ4IHx8IHJ3ID4gdHgpICYmXHJcbiAgICAgICAgKHJoIDwgcnkgfHwgcmggPiB0eSkgJiZcclxuICAgICAgICAodHcgPCB0eCB8fCB0dyA+IHJ4KSAmJlxyXG4gICAgICAgICh0aCA8IHR5IHx8IHRoID4gcnkpKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3JlY3RWc0NpcmNsZSA9IGZ1bmN0aW9uIChyLCBjKSB7XHJcbiAgICAgICAgcmV0dXJuIF9wb2ludEluUmVjdGFuZ2xlKGMuZ2V0Q2VudGVyKCksIHIpIHx8XHJcbiAgICAgICAgICAgIF9saW5lVnNDaXJjbGUoci50b3BFZGdlKCksIGMpIHx8XHJcbiAgICAgICAgICAgIF9saW5lVnNDaXJjbGUoci5yaWdodEVkZ2UoKSwgYykgfHxcclxuICAgICAgICAgICAgX2xpbmVWc0NpcmNsZShyLmJvdHRvbUVkZ2UoKSwgYykgfHxcclxuICAgICAgICAgICAgX2xpbmVWc0NpcmNsZShyLmxlZnRFZGdlKCksIGMpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfbGluZVZzQ2lyY2xlID0gZnVuY3Rpb24gKGwsIGMpIHtcclxuICAgICAgICB2YXIgY28gPSBjLmdldENlbnRlcigpO1xyXG4gICAgICAgIHZhciByID0gYy5yYWRpdXM7XHJcbiAgICAgICAgdmFyIGQgPSBuZXcgUmVuZGVySnMuVmVjdG9yKGwucG9zMi54IC0gbC5wb3MueCwgbC5wb3MyLnkgLSBsLnBvcy55KTtcclxuICAgICAgICB2YXIgZiA9IG5ldyBSZW5kZXJKcy5WZWN0b3IobC5wb3MueCAtIGNvLngsIGwucG9zLnkgLSBjby55KTtcclxuXHJcbiAgICAgICAgdmFyIGEgPSBkLmRvdChkKTtcclxuICAgICAgICB2YXIgYiA9IDIgKiBmLmRvdChkKTtcclxuICAgICAgICB2YXIgYyA9IGYuZG90KGYpIC0gciAqIHI7XHJcblxyXG4gICAgICAgIHZhciBkaXNjcmltaW5hbnQgPSBiICogYiAtIDQgKiBhICogYztcclxuXHJcbiAgICAgICAgaWYgKGRpc2NyaW1pbmFudCA8IDApIHtcclxuICAgICAgICAgICAgLy8gbm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHJheSBkaWRuJ3QgdG90YWxseSBtaXNzIHNwaGVyZSxcclxuICAgICAgICAgICAgLy8gc28gdGhlcmUgaXMgYSBzb2x1dGlvbiB0b1xyXG4gICAgICAgICAgICAvLyB0aGUgZXF1YXRpb24uXHJcblxyXG4gICAgICAgICAgICBkaXNjcmltaW5hbnQgPSBNYXRoLnNxcnQoZGlzY3JpbWluYW50KTtcclxuXHJcbiAgICAgICAgICAgIC8vIGVpdGhlciBzb2x1dGlvbiBtYXkgYmUgb24gb3Igb2ZmIHRoZSByYXkgc28gbmVlZCB0byB0ZXN0IGJvdGhcclxuICAgICAgICAgICAgLy8gdDEgaXMgYWx3YXlzIHRoZSBzbWFsbGVyIHZhbHVlLCBiZWNhdXNlIEJPVEggZGlzY3JpbWluYW50IGFuZFxyXG4gICAgICAgICAgICAvLyBhIGFyZSBub25uZWdhdGl2ZS5cclxuICAgICAgICAgICAgdmFyIHQxID0gKC1iIC0gZGlzY3JpbWluYW50KSAvICgyICogYSk7XHJcbiAgICAgICAgICAgIHZhciB0MiA9ICgtYiArIGRpc2NyaW1pbmFudCkgLyAoMiAqIGEpO1xyXG5cclxuICAgICAgICAgICAgLy8gM3ggSElUIGNhc2VzOlxyXG4gICAgICAgICAgICAvLyAgICAgICAgICAtby0+ICAgICAgICAgICAgIC0tfC0tPiAgfCAgICAgICAgICAgIHwgIC0tfC0+XHJcbiAgICAgICAgICAgIC8vIEltcGFsZSh0MSBoaXQsdDIgaGl0KSwgUG9rZSh0MSBoaXQsdDI+MSksIEV4aXRXb3VuZCh0MTwwLCB0MiBoaXQpLCBcclxuXHJcbiAgICAgICAgICAgIC8vIDN4IE1JU1MgY2FzZXM6XHJcbiAgICAgICAgICAgIC8vICAgICAgIC0+ICBvICAgICAgICAgICAgICAgICAgICAgbyAtPiAgICAgICAgICAgICAgfCAtPiB8XHJcbiAgICAgICAgICAgIC8vIEZhbGxTaG9ydCAodDE+MSx0Mj4xKSwgUGFzdCAodDE8MCx0MjwwKSwgQ29tcGxldGVseUluc2lkZSh0MTwwLCB0Mj4xKVxyXG5cclxuICAgICAgICAgICAgaWYgKHQxID49IDAgJiYgdDEgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdDEgaXMgdGhlIGludGVyc2VjdGlvbiwgYW5kIGl0J3MgY2xvc2VyIHRoYW4gdDJcclxuICAgICAgICAgICAgICAgIC8vIChzaW5jZSB0MSB1c2VzIC1iIC0gZGlzY3JpbWluYW50KVxyXG4gICAgICAgICAgICAgICAgLy8gSW1wYWxlLCBQb2tlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaGVyZSB0MSBkaWRuJ3QgaW50ZXJzZWN0IHNvIHdlIGFyZSBlaXRoZXIgc3RhcnRlZFxyXG4gICAgICAgICAgICAvLyBpbnNpZGUgdGhlIHNwaGVyZSBvciBjb21wbGV0ZWx5IHBhc3QgaXRcclxuICAgICAgICAgICAgaWYgKHQyID49IDAgJiYgdDIgPD0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gRXhpdFdvdW5kXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gbm8gaW50bjogRmFsbFNob3J0LCBQYXN0LCBDb21wbGV0ZWx5SW5zaWRlXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9jaXJjbGVWc0NpcmNsZSA9IGZ1bmN0aW9uIChjMSwgYzIpIHtcclxuICAgICAgICB2YXIgdmVsb2NpdHkgPSBjMi52O1xyXG4gICAgICAgIC8vYWRkIGJvdGggcmFkaWkgdG9nZXRoZXIgdG8gZ2V0IHRoZSBjb2xsaWRpbmcgZGlzdGFuY2VcclxuICAgICAgICB2YXIgdG90YWxSYWRpdXMgPSBjMS5yYWRpdXMgKyBjMi5yYWRpdXM7XHJcbiAgICAgICAgLy9maW5kIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSB0d28gY2lyY2xlcyB1c2luZyBQeXRoYWdvcmVhbiB0aGVvcmVtLiBObyBzcXVhcmUgcm9vdHMgZm9yIG9wdGltaXphdGlvblxyXG4gICAgICAgIHZhciBkaXN0YW5jZVNxdWFyZWQgPSAoYzEucG9zLnggLSBjMi5wb3MueCkgKiAoYzEucG9zLnggLSBjMi5wb3MueCkgKyAoYzEucG9zLnkgLSBjMi5wb3MueSkgKiAoYzEucG9zLnkgLSBjMi5wb3MueSk7XHJcbiAgICAgICAgLy9pZiB5b3VyIGRpc3RhbmNlIGlzIGxlc3MgdGhhbiB0aGUgdG90YWxSYWRpdXMgc3F1YXJlKGJlY2F1c2UgZGlzdGFuY2UgaXMgc3F1YXJlZClcclxuICAgICAgICBpZiAoZGlzdGFuY2VTcXVhcmVkIDwgdG90YWxSYWRpdXMgKiB0b3RhbFJhZGl1cykge1xyXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGlzdGFuY2VTcXVhcmVkKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzZXBhcmF0aW9uID0gdG90YWxSYWRpdXMgLSBkaXN0YW5jZTtcclxuICAgICAgICAgICAgdmFyIHVuaXRWZWN0b3IgPSBuZXcgUmVuZGVySnMuVmVjdG9yKGMxLnBvcy5zdWIoYzIucG9zKS54IC8gZGlzdGFuY2UsIGMxLnBvcy5zdWIoYzIucG9zKS55IC8gZGlzdGFuY2UpO1xyXG4gICAgICAgICAgICB2YXIgZGlmZlYgPSBjMi5wb3Muc3ViKGMxLnBvcyk7XHJcblxyXG4gICAgICAgICAgICAvL2ZpbmQgdGhlIG1vdmVtZW50IG5lZWRlZCB0byBzZXBhcmF0ZSB0aGUgY2lyY2xlc1xyXG4gICAgICAgICAgICByZXR1cm4gdmVsb2NpdHkuYWRkKHVuaXRWZWN0b3Iuc2NhbGUoc2VwYXJhdGlvbiAvIDIpKTsvL25ldyBSZW5kZXJKcy5WZWN0b3IoKGMyLnBvcy54IC0gYzEucG9zLngpICogZGlmZmVyZW5jZSwgKGMyLnBvcy55IC0gYzEucG9zLnkpICogZGlmZmVyZW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsOyAvL25vIGNvbGxpc2lvbiwgcmV0dXJuIG51bGxcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX2NpcmNsZVZzUG9seWdvbiA9IGZ1bmN0aW9uIChjaXJjbGUsIHBvbHlnb24pIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBjaXJjbGUgcmVsYXRpdmUgdG8gdGhlIHBvbHlnb24uXHJcbiAgICAgICAgdmFyIGNpcmNsZVBvcyA9IGNpcmNsZS5wb3Muc3ViKHBvbHlnb24ucG9zKTtcclxuICAgICAgICB2YXIgcmFkaXVzID0gY2lyY2xlLnJhZGl1cztcclxuICAgICAgICB2YXIgcmFkaXVzMiA9IHJhZGl1cyAqIHJhZGl1cztcclxuICAgICAgICB2YXIgcG9pbnRzID0gcG9seWdvbi52ZXJ0aWNlcy5zbGljZSgpO1xyXG4gICAgICAgIHZhciBsZW4gPSBwb2ludHMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBlZGdlID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKTtcclxuICAgICAgICB2YXIgcG9pbnQgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApO1xyXG4gICAgICAgIHZhciByZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgb3ZlcmxhcDogTnVtYmVyLk1BWF9WQUxVRSxcclxuICAgICAgICAgICAgb3ZlcmxhcE46IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCksXHJcbiAgICAgICAgICAgIG92ZXJsYXBWOiBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApXHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBGb3IgZWFjaCBlZGdlIGluIHRoZSBwb2x5Z29uOlxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG5leHQgPSBpID09PSBsZW4gLSAxID8gMCA6IGkgKyAxO1xyXG4gICAgICAgICAgICB2YXIgcHJldiA9IGkgPT09IDAgPyBsZW4gLSAxIDogaSAtIDE7XHJcbiAgICAgICAgICAgIHZhciBvdmVybGFwID0gMDtcclxuICAgICAgICAgICAgdmFyIG92ZXJsYXBOID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZWRnZS5cclxuICAgICAgICAgICAgZWRnZS5zZXQocG9seWdvbi52ZXJ0aWNlc1tpXSk7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgcmVsYXRpdmUgdG8gdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBlZGdlLlxyXG4gICAgICAgICAgICBwb2ludC5zZXQoY2lyY2xlUG9zKTtcclxuICAgICAgICAgICAgcG9pbnQuc2V0KHBvaW50LnN1Yihwb2ludHNbaV0pKTtcclxuICAgICAgICAgICAgLy8gSWYgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIGFuZCB0aGUgcG9pbnRcclxuICAgICAgICAgICAgLy8gaXMgYmlnZ2VyIHRoYW4gdGhlIHJhZGl1cywgdGhlIHBvbHlnb24gaXMgZGVmaW5pdGVseSBub3QgZnVsbHkgaW5cclxuICAgICAgICAgICAgLy8gdGhlIGNpcmNsZS5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHBvaW50Lmxlbmd0aDIoKSA+IHJhZGl1czIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlWydhSW5CJ10gPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHdoaWNoIFZvcm5vaSByZWdpb24gdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIGlzIGluLlxyXG4gICAgICAgICAgICB2YXIgcmVnaW9uID0gX3Zvcm5vaVJlZ2lvbihlZGdlLCBwb2ludCk7XHJcbiAgICAgICAgICAgIC8vIElmIGl0J3MgdGhlIGxlZnQgcmVnaW9uOlxyXG4gICAgICAgICAgICBpZiAocmVnaW9uID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgd2UncmUgaW4gdGhlIFJJR0hUX1ZPUk5PSV9SRUdJT04gb2YgdGhlIHByZXZpb3VzIGVkZ2UuXHJcbiAgICAgICAgICAgICAgICBlZGdlLnNldChwb2x5Z29uLmVkZ2VzW3ByZXZdKTtcclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgcmVsYXRpdmUgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBwcmV2aW91cyBlZGdlXHJcbiAgICAgICAgICAgICAgICB2YXIgcG9pbnQyID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKS5zZXQoY2lyY2xlUG9zKS5zdWIocG9pbnRzW3ByZXZdKTtcclxuICAgICAgICAgICAgICAgIHJlZ2lvbiA9IF92b3Jub2lSZWdpb24oZWRnZSwgcG9pbnQyKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZWdpb24gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGluIHRoZSByZWdpb24gd2Ugd2FudC4gIENoZWNrIGlmIHRoZSBjaXJjbGUgaW50ZXJzZWN0cyB0aGUgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBwb2ludC5sZW5ndGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdCA+IHJhZGl1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVsnYkluQSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJsYXBOID0gcG9pbnQubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIElmIGl0J3MgdGhlIHJpZ2h0IHJlZ2lvbjpcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWdpb24gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHdlJ3JlIGluIHRoZSBsZWZ0IHJlZ2lvbiBvbiB0aGUgbmV4dCBlZGdlXHJcbiAgICAgICAgICAgICAgICBlZGdlLnNldChwb2x5Z29uLmVkZ2VzW25leHRdKTtcclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgcmVsYXRpdmUgdG8gdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBuZXh0IGVkZ2UuXHJcbiAgICAgICAgICAgICAgICBwb2ludC5zZXQoY2lyY2xlUG9zKTtcclxuICAgICAgICAgICAgICAgIHBvaW50LnNldChwb2ludC5zdWIocG9pbnRzW25leHRdKSk7XHJcbiAgICAgICAgICAgICAgICByZWdpb24gPSBfdm9ybm9pUmVnaW9uKGVkZ2UsIHBvaW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChyZWdpb24gPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBpbiB0aGUgcmVnaW9uIHdlIHdhbnQuICBDaGVjayBpZiB0aGUgY2lyY2xlIGludGVyc2VjdHMgdGhlIHBvaW50LlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gcG9pbnQubGVuZ3RoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3QgPiByYWRpdXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0IGludGVyc2VjdHMsIGNhbGN1bGF0ZSB0aGUgb3ZlcmxhcC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVybGFwTiA9IHBvaW50Lm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVybGFwID0gcmFkaXVzIC0gZGlzdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGl0J3MgdGhlIG1pZGRsZSByZWdpb246XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBOZWVkIHRvIGNoZWNrIGlmIHRoZSBjaXJjbGUgaXMgaW50ZXJzZWN0aW5nIHRoZSBlZGdlLFxyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBlZGdlIGludG8gaXRzIFwiZWRnZSBub3JtYWxcIi5cclxuICAgICAgICAgICAgICAgIHZhciBub3JtYWwgPSBlZGdlLnBlcnAoKS5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIHBlcnBlbmRpY3VsYXIgZGlzdGFuY2UgYmV0d2VlbiB0aGUgY2VudGVyIG9mIHRoZSBcclxuICAgICAgICAgICAgICAgIC8vIGNpcmNsZSBhbmQgdGhlIGVkZ2UuXHJcbiAgICAgICAgICAgICAgICB2YXIgZGlzdCA9IHBvaW50LmRvdChub3JtYWwpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpc3RBYnMgPSBNYXRoLmFicyhkaXN0KTtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjaXJjbGUgaXMgb24gdGhlIG91dHNpZGUgb2YgdGhlIGVkZ2UsIHRoZXJlIGlzIG5vIGludGVyc2VjdGlvbi5cclxuICAgICAgICAgICAgICAgIGlmIChkaXN0ID4gMCAmJiBkaXN0QWJzID4gcmFkaXVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEl0IGludGVyc2VjdHMsIGNhbGN1bGF0ZSB0aGUgb3ZlcmxhcC5cclxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwTiA9IG5vcm1hbDtcclxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwID0gcmFkaXVzIC0gZGlzdDtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgaXMgb24gdGhlIG91dHNpZGUgb2YgdGhlIGVkZ2UsIG9yIHBhcnQgb2YgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2lyY2xlIGlzIG9uIHRoZSBvdXRzaWRlLCB0aGUgY2lyY2xlIGlzIG5vdCBmdWxseSBpbnNpZGUgdGhlIHBvbHlnb24uXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3QgPj0gMCB8fCBvdmVybGFwIDwgMiAqIHJhZGl1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVsnYkluQSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBzbWFsbGVzdCBvdmVybGFwIHdlJ3ZlIHNlZW4sIGtlZXAgaXQuIFxyXG4gICAgICAgICAgICAvLyAob3ZlcmxhcE4gbWF5IGJlIG51bGwgaWYgdGhlIGNpcmNsZSB3YXMgaW4gdGhlIHdyb25nIFZvcm5vaSByZWdpb24pLlxyXG4gICAgICAgICAgICBpZiAob3ZlcmxhcE4gJiYgcmVzcG9uc2UgJiYgTWF0aC5hYnMob3ZlcmxhcCkgPCBNYXRoLmFicyhyZXNwb25zZVsnb3ZlcmxhcCddKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VbJ292ZXJsYXAnXSA9IG92ZXJsYXA7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZVsnb3ZlcmxhcE4nXSA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCkuc2V0KG92ZXJsYXBOKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBmaW5hbCBvdmVybGFwIHZlY3RvciAtIGJhc2VkIG9uIHRoZSBzbWFsbGVzdCBvdmVybGFwLlxyXG4gICAgICAgIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXNwb25zZVsnYSddID0gcG9seWdvbjtcclxuICAgICAgICAgICAgcmVzcG9uc2VbJ2InXSA9IGNpcmNsZTtcclxuICAgICAgICAgICAgcmVzcG9uc2VbJ292ZXJsYXBWJ10gPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLnNldChyZXNwb25zZVsnb3ZlcmxhcE4nXSkuc2NhbGUocmVzcG9uc2VbJ292ZXJsYXAnXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICAvL3ZhciB0ZXN0MTsvL251bWJlcnMgZm9yIHRlc3RpbmcgbWF4L21pbnNcclxuICAgICAgICAvL3ZhciB0ZXN0MjtcclxuICAgICAgICAvL3ZhciB0ZXN0O1xyXG4gICAgICAgIC8vdmFyIG1pbjE7Ly9zYW1lIGFzIGFib3ZlXHJcbiAgICAgICAgLy92YXIgbWF4MTtcclxuICAgICAgICAvL3ZhciBtaW4yO1xyXG4gICAgICAgIC8vdmFyIG1heDI7XHJcbiAgICAgICAgLy92YXIgbm9ybWFsQXhpcztcclxuICAgICAgICAvL3ZhciBvZmZzZXQ7XHJcbiAgICAgICAgLy92YXIgdmVjdG9yT2Zmc2V0O1xyXG4gICAgICAgIC8vdmFyIHZlY3RvcnM7XHJcbiAgICAgICAgLy92YXIgcDI7XHJcbiAgICAgICAgLy92YXIgZGlzdGFuY2U7XHJcbiAgICAgICAgLy92YXIgdGVzdERpc3RhbmNlID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuICAgICAgICAvL3ZhciBjbG9zZXN0VmVjdG9yID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKTsvL3RoZSB2ZWN0b3IgdG8gdXNlIHRvIGZpbmQgdGhlIG5vcm1hbFxyXG4gICAgICAgIC8vLy8gZmluZCBvZmZzZXRcclxuICAgICAgICAvL3ZlY3Rvck9mZnNldCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IocG9seWdvbi5wb3MueCAtIGNpcmNsZS5wb3MueCwgcG9seWdvbi5wb3MueSAtIGNpcmNsZS5wb3MueSk7XHJcbiAgICAgICAgLy92ZWN0b3JzID0gcG9seWdvbi52ZXJ0aWNlcy5zbGljZSgpOy8vYWdhaW4sIHRoaXMgaXMganVzdCBhIGZ1bmN0aW9uIGluIG15IHBvbHlnb24gY2xhc3MgdGhhdCByZXR1cm5zIHRoZSB2ZXJ0aWNlcyBvZiB0aGUgcG9sZ29uXHJcbiAgICAgICAgLy8vL2FkZHMgc29tZSBwYWRkaW5nIHRvIG1ha2UgaXQgbW9yZSBhY2N1cmF0ZVxyXG4gICAgICAgIC8vaWYgKHZlY3RvcnMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAvLyAgICB2YXIgdGVtcCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoLSh2ZWN0b3JzWzFdLnkgLSB2ZWN0b3JzWzBdLnkpLCB2ZWN0b3JzWzFdLnggLSB2ZWN0b3JzWzBdLngpO1xyXG4gICAgICAgIC8vICAgIHRlbXAudHJ1bmNhdGUoMC4wMDAwMDAwMDAxKTtcclxuICAgICAgICAvLyAgICB2ZWN0b3JzLnB1c2godmVjdG9yc1sxXS5hZGQodGVtcCkpO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIC8vLy8gZmluZCB0aGUgY2xvc2VzdCB2ZXJ0ZXggdG8gdXNlIHRvIGZpbmQgbm9ybWFsXHJcbiAgICAgICAgLy9mb3IgKHZhciBpID0gMDsgaSA8IHZlY3RvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAvLyAgICBkaXN0YW5jZSA9IChjaXJjbGUucG9zLnggLSAocG9seWdvbi5wb3MueCArIHZlY3RvcnNbaV0ueCkpICogKGNpcmNsZS5wb3MueCAtIChwb2x5Z29uLnBvcy54ICsgdmVjdG9yc1tpXS54KSkgKyAoY2lyY2xlLnBvcy55IC0gKHBvbHlnb24ucG9zLnkgKyB2ZWN0b3JzW2ldLnkpKSAqIChjaXJjbGUucG9zLnkgLSAocG9seWdvbi5wb3MueSArIHZlY3RvcnNbaV0ueSkpO1xyXG4gICAgICAgIC8vICAgIGlmIChkaXN0YW5jZSA8IHRlc3REaXN0YW5jZSkgey8vY2xvc2VzdCBoYXMgdGhlIGxvd2VzdCBkaXN0YW5jZVxyXG4gICAgICAgIC8vICAgICAgICB0ZXN0RGlzdGFuY2UgPSBkaXN0YW5jZTtcclxuICAgICAgICAvLyAgICAgICAgY2xvc2VzdFZlY3Rvci54ID0gcG9seWdvbi5wb3MueCArIHZlY3RvcnNbaV0ueDtcclxuICAgICAgICAvLyAgICAgICAgY2xvc2VzdFZlY3Rvci55ID0gcG9seWdvbi5wb3MueSArIHZlY3RvcnNbaV0ueTtcclxuICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy8vL2dldCB0aGUgbm9ybWFsIHZlY3RvclxyXG4gICAgICAgIC8vbm9ybWFsQXhpcyA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoY2xvc2VzdFZlY3Rvci54IC0gY2lyY2xlLnBvcy54LCBjbG9zZXN0VmVjdG9yLnkgLSBjaXJjbGUucG9zLnkpO1xyXG4gICAgICAgIC8vbm9ybWFsQXhpcy5zZXQobm9ybWFsQXhpcy5ub3JtYWxpemUoKSk7Ly9ub3JtYWxpemUgaXMoc2V0IGl0cyBsZW5ndGggdG8gMSlcclxuICAgICAgICAvLy8vIHByb2plY3QgdGhlIHBvbHlnb24ncyBwb2ludHNcclxuICAgICAgICAvL21pbjEgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JzWzBdKTtcclxuICAgICAgICAvL21heDEgPSBtaW4xOy8vc2V0IG1heCBhbmQgbWluXHJcbiAgICAgICAgLy9mb3IgKGogPSAxOyBqIDwgdmVjdG9ycy5sZW5ndGg7IGorKykgey8vcHJvamVjdCBhbGwgaXRzIHBvaW50cywgc3RhcnRpbmcgd2l0aCB0aGUgZmlyc3QodGhlIDB0aCB3YXMgZG9uZSB1cCB0aGVyZV4pXHJcbiAgICAgICAgLy8gICAgdGVzdCA9IG5vcm1hbEF4aXMuZG90KHZlY3RvcnNbal0pOy8vZG90UHJvZHVjdCB0byBwcm9qZWN0XHJcbiAgICAgICAgLy8gICAgaWYgKHRlc3QgPCBtaW4xKSBtaW4xID0gdGVzdDsvL3NtYWxsZXN0IG1pbiBpcyB3YW50ZWRcclxuICAgICAgICAvLyAgICBpZiAodGVzdCA+IG1heDEpIG1heDEgPSB0ZXN0Oy8vbGFyZ2VzdCBtYXggaXMgd2FudGVkXHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy8vLyBwcm9qZWN0IHRoZSBjaXJjbGVcclxuICAgICAgICAvL21heDIgPSBjaXJjbGUucmFkaXVzOy8vbWF4IGlzIHJhZGl1c1xyXG4gICAgICAgIC8vbWluMiAtPSBjaXJjbGUucmFkaXVzOy8vbWluIGlzIG5lZ2F0aXZlIHJhZGl1c1xyXG4gICAgICAgIC8vLy8gb2Zmc2V0IHRoZSBwb2x5Z29uJ3MgbWF4L21pblxyXG4gICAgICAgIC8vb2Zmc2V0ID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yT2Zmc2V0KTtcclxuICAgICAgICAvL21pbjEgKz0gb2Zmc2V0O1xyXG4gICAgICAgIC8vbWF4MSArPSBvZmZzZXQ7XHJcbiAgICAgICAgLy8vLyBkbyB0aGUgYmlnIHRlc3RcclxuICAgICAgICAvL3Rlc3QxID0gbWluMSAtIG1heDI7XHJcbiAgICAgICAgLy90ZXN0MiA9IG1pbjIgLSBtYXgxO1xyXG4gICAgICAgIC8vaWYgKHRlc3QxID4gMCB8fCB0ZXN0MiA+IDApIHsvL2lmIGVpdGhlciB0ZXN0IGlzIGdyZWF0ZXIgdGhhbiAwLCB0aGVyZSBpcyBhIGdhcCwgd2UgY2FuIGdpdmUgdXAgbm93LlxyXG4gICAgICAgIC8vICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIC8vLy8gZmluZCB0aGUgbm9ybWFsIGF4aXMgZm9yIGVhY2ggcG9pbnQgYW5kIHByb2plY3RcclxuICAgICAgICAvL2ZvciAoaSA9IDA7IGkgPCB2ZWN0b3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgbm9ybWFsQXhpcyA9IF9maW5kTm9ybWFsQXhpcyh2ZWN0b3JzLCBpKTtcclxuICAgICAgICAvLyAgICAvLyBwcm9qZWN0IHRoZSBwb2x5Z29uKGFnYWluPyB5ZXMsIGNpcmNsZXMgdnMuIHBvbHlnb24gcmVxdWlyZSBtb3JlIHRlc3RpbmcuLi4pXHJcbiAgICAgICAgLy8gICAgbWluMSA9IG5vcm1hbEF4aXMuZG90KHZlY3RvcnNbMF0pOy8vcHJvamVjdFxyXG4gICAgICAgIC8vICAgIG1heDEgPSBtaW4xOy8vc2V0IG1heCBhbmQgbWluXHJcbiAgICAgICAgLy8gICAgLy9wcm9qZWN0IGFsbCB0aGUgb3RoZXIgcG9pbnRzKHNlZSwgY2lybGNlcyB2LiBwb2x5Z29ucyB1c2UgbG90cyBvZiB0aGlzLi4uKVxyXG4gICAgICAgIC8vICAgIGZvciAoaiA9IDE7IGogPCB2ZWN0b3JzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgLy8gICAgICAgIHRlc3QgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JzW2pdKTsvL21vcmUgcHJvamVjdGlvblxyXG4gICAgICAgIC8vICAgICAgICBpZiAodGVzdCA8IG1pbjEpIG1pbjEgPSB0ZXN0Oy8vc21hbGxlc3QgbWluXHJcbiAgICAgICAgLy8gICAgICAgIGlmICh0ZXN0ID4gbWF4MSkgbWF4MSA9IHRlc3Q7Ly9sYXJnZXN0IG1heFxyXG4gICAgICAgIC8vICAgIH1cclxuICAgICAgICAvLyAgICAvLyBwcm9qZWN0IHRoZSBjaXJjbGUoYWdhaW4pXHJcbiAgICAgICAgLy8gICAgbWF4MiA9IGNpcmNsZS5yYWRpdXM7Ly9tYXggaXMgcmFkaXVzXHJcbiAgICAgICAgLy8gICAgbWluMiAtPSBjaXJjbGUucmFkaXVzOy8vbWluIGlzIG5lZ2F0aXZlIHJhZGl1c1xyXG4gICAgICAgIC8vICAgIC8vb2Zmc2V0IHBvaW50c1xyXG4gICAgICAgIC8vICAgIG9mZnNldCA9IG5vcm1hbEF4aXMuZG90KHZlY3Rvck9mZnNldCk7XHJcbiAgICAgICAgLy8gICAgbWluMSArPSBvZmZzZXQ7XHJcbiAgICAgICAgLy8gICAgbWF4MSArPSBvZmZzZXQ7XHJcbiAgICAgICAgLy8gICAgLy8gZG8gdGhlIHRlc3QsIGFnYWluXHJcbiAgICAgICAgLy8gICAgdGVzdDEgPSBtaW4xIC0gbWF4MjtcclxuICAgICAgICAvLyAgICB0ZXN0MiA9IG1pbjIgLSBtYXgxO1xyXG4gICAgICAgIC8vICAgIGlmICh0ZXN0MSA+IDAgfHwgdGVzdDIgPiAwKSB7XHJcbiAgICAgICAgLy8gICAgICAgIC8vZmFpbGVkLi4gcXVpdCBub3dcclxuICAgICAgICAvLyAgICAgICAgcmV0dXJuIG51bGxcclxuICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy9yZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcihub3JtYWxBeGlzLnggKiAobWF4MiAtIG1pbjEpICogLTEsIG5vcm1hbEF4aXMueSAqIChtYXgyIC0gbWluMSkgKiAtMSk7Ly9yZXR1cm4gdGhlIHNlcGFyYXRpb24gZGlzdGFuY2VcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3BvaW50SW5SZWN0YW5nbGUgPSBmdW5jdGlvbiAocCwgcikge1xyXG4gICAgICAgIHJldHVybiAocC54ID49IHIueCAmJlxyXG4gICAgICAgIHAueCA8PSByLnggKyByLndpZHRoICYmXHJcbiAgICAgICAgcC55ID49IHIueSAmJlxyXG4gICAgICAgIHAueSA8PSByLnkgKyByLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLkFhYmJDb2xsaXNpb24gPSBmdW5jdGlvbiAocmVjdEEsIHJlY3RCKSB7XHJcbiAgICAgICAgaWYgKE1hdGguYWJzKHJlY3RBLnggLSByZWN0Qi54KSA8IHJlY3RBLndpZHRoICsgcmVjdEIud2lkdGgpIHtcclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3RBLnkgLSByZWN0Qi55KSA8IHJlY3RBLmhlaWdodCArIHJlY3RCLmhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUucG9pbnRJbk9iamVjdCA9IGZ1bmN0aW9uIChwLCBvYmopIHtcclxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUpXHJcbiAgICAgICAgICAgIHJldHVybiBfcG9pbnRJblJlY3RhbmdsZShwLCBvYmopO1xyXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYylcclxuICAgICAgICAgICAgcmV0dXJuIF9wb2ludEluQ2lyY2xlKHAsIG9iaik7XHJcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbilcclxuICAgICAgICAgICAgcmV0dXJuIF9wb2ludEluUG9seWdvbihwLCBvYmopO1xyXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkxpbmUpXHJcbiAgICAgICAgICAgIHJldHVybiBfcG9pbnRJbkxpbmUocCwgb2JqKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5jaGVja0NvbGxpc2lvbiA9IGZ1bmN0aW9uIChvYmoxLCBvYmoyLCB2ZWxvY2l0eSkge1xyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlKVxyXG4gICAgICAgICAgICByZXR1cm4gX3JlY3RWc1JlY3Qob2JqMSwgb2JqMik7XHJcblxyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjKVxyXG4gICAgICAgICAgICByZXR1cm4gX3JlY3RWc0NpcmNsZShvYmoxLCBvYmoyKTtcclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSlcclxuICAgICAgICAgICAgcmV0dXJuIF9yZWN0VnNDaXJjbGUob2JqMiwgb2JqMSk7XHJcblxyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjKVxyXG4gICAgICAgICAgICByZXR1cm4gX2NpcmNsZVZzQ2lyY2xlKG9iajEsIG9iajIsIHZlbG9jaXR5KTtcclxuXHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkxpbmUgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjKVxyXG4gICAgICAgICAgICByZXR1cm4gX2xpbmVWc0NpcmNsZShvYmoxLCBvYmoyKTtcclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkxpbmUpXHJcbiAgICAgICAgICAgIHJldHVybiBfbGluZVZzQ2lyY2xlKG9iajIsIG9iajEpO1xyXG5cclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbiAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqMS5zdWJQb2x5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmoyLnN1YlBvbHlzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gbW9kdWxlLnBvbHlnb25Db2xsaXNpb24ob2JqMS5zdWJQb2x5c1tpXSwgb2JqMi5zdWJQb2x5c1tqXSwgdmVsb2NpdHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5pbnRlcnNlY3QgfHwgcmVzcG9uc2Uud2lsbEludGVyc2VjdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsOy8vUmVuZGVySnMuVmVjdG9yLmNsb25lKDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24pXHJcbiAgICAgICAgICAgIHJldHVybiBfY2lyY2xlVnNQb2x5Z29uKG9iajEsIG9iajIsIHZlbG9jaXR5KTtcclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbiAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMpXHJcbiAgICAgICAgICAgIHJldHVybiBfY2lyY2xlVnNQb2x5Z29uKG9iajIsIG9iajEsIHZlbG9jaXR5KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcblxyXG59KFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucyB8fCB7fSkpOyIsInZhciBSZW5kZXJKcyA9IFJlbmRlckpzIHx8IHt9O1xyXG5SZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHBvbHlnb24gQSBpcyBnb2luZyB0byBjb2xsaWRlIHdpdGggcG9seWdvbiBCIGZvciB0aGUgZ2l2ZW4gdmVsb2NpdHlcclxuICAgIG1vZHVsZS5wb2x5Z29uQ29sbGlzaW9uID0gZnVuY3Rpb24gKHBvbHlnb25BLCBwb2x5Z29uQiwgdmVsb2NpdHkpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICBpbnRlcnNlY3Q6IHRydWUsXHJcbiAgICAgICAgICAgIHdpbGxJbnRlcnNlY3Q6IHRydWVcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBlZGdlQ291bnRBID0gcG9seWdvbkEuZWRnZXMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBlZGdlQ291bnRCID0gcG9seWdvbkIuZWRnZXMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBtaW5JbnRlcnZhbERpc3RhbmNlID0gSW5maW5pdHk7XHJcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uQXhpcyA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoKTtcclxuICAgICAgICB2YXIgZWRnZTtcclxuXHJcbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgZWRnZXMgb2YgYm90aCBwb2x5Z29uc1xyXG4gICAgICAgIGZvciAodmFyIGVkZ2VJbmRleCA9IDAsIGwgPSBlZGdlQ291bnRBICsgZWRnZUNvdW50QjsgZWRnZUluZGV4IDwgbDsgZWRnZUluZGV4KyspIHtcclxuICAgICAgICAgICAgaWYgKGVkZ2VJbmRleCA8IGVkZ2VDb3VudEEpIHtcclxuICAgICAgICAgICAgICAgIGVkZ2UgPSBwb2x5Z29uQS5lZGdlc1tlZGdlSW5kZXhdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZWRnZSA9IHBvbHlnb25CLmVkZ2VzW2VkZ2VJbmRleCAtIGVkZ2VDb3VudEFdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyA9PT09PSAxLiBGaW5kIGlmIHRoZSBwb2x5Z29ucyBhcmUgY3VycmVudGx5IGludGVyc2VjdGluZyA9PT09PVxyXG5cclxuICAgICAgICAgICAgLy8gRmluZCB0aGUgYXhpcyBwZXJwZW5kaWN1bGFyIHRvIHRoZSBjdXJyZW50IGVkZ2VcclxuICAgICAgICAgICAgdmFyIGF4aXMgPSBuZXcgUmVuZGVySnMuVmVjdG9yKC1lZGdlLnksIGVkZ2UueCk7XHJcbiAgICAgICAgICAgIGF4aXMuc2V0KGF4aXMubm9ybWFsaXplKCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gRmluZCB0aGUgcHJvamVjdGlvbiBvZiB0aGUgcG9seWdvbiBvbiB0aGUgY3VycmVudCBheGlzXHJcbiAgICAgICAgICAgIHZhciBtaW5BID0gMCwgbWluQiA9IDAsIG1heEEgPSAwLCBtYXhCID0gMDtcclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9qZWN0ZWRBID0gX3Byb2plY3RQb2x5Z29uKGF4aXMsIHBvbHlnb25BLCBtaW5BLCBtYXhBKTtcclxuICAgICAgICAgICAgbWluQSA9IHByb2plY3RlZEEubWluO1xyXG4gICAgICAgICAgICBtYXhBID0gcHJvamVjdGVkQS5tYXg7XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvamVjdGVkQiA9IF9wcm9qZWN0UG9seWdvbihheGlzLCBwb2x5Z29uQiwgbWluQiwgbWF4Qik7XHJcbiAgICAgICAgICAgIG1pbkIgPSBwcm9qZWN0ZWRCLm1pbjtcclxuICAgICAgICAgICAgbWF4QiA9IHByb2plY3RlZEIubWF4O1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHBvbHlnb24gcHJvamVjdGlvbnMgYXJlIGN1cnJlbnRsdHkgaW50ZXJzZWN0aW5nXHJcbiAgICAgICAgICAgIGlmIChfaW50ZXJ2YWxEaXN0YW5jZShtaW5BLCBtYXhBLCBtaW5CLCBtYXhCKSA+IDApIHJlc3VsdC5pbnRlcnNlY3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIC8vID09PT09IDIuIE5vdyBmaW5kIGlmIHRoZSBwb2x5Z29ucyAqd2lsbCogaW50ZXJzZWN0ID09PT09XHJcblxyXG4gICAgICAgICAgICAvLyBQcm9qZWN0IHRoZSB2ZWxvY2l0eSBvbiB0aGUgY3VycmVudCBheGlzXHJcbiAgICAgICAgICAgIHZhciB2ZWxvY2l0eVByb2plY3Rpb24gPSBheGlzLmRvdCh2ZWxvY2l0eSk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgdGhlIHByb2plY3Rpb24gb2YgcG9seWdvbiBBIGR1cmluZyB0aGUgbW92ZW1lbnRcclxuICAgICAgICAgICAgaWYgKHZlbG9jaXR5UHJvamVjdGlvbiA8IDApIHtcclxuICAgICAgICAgICAgICAgIG1pbkEgKz0gdmVsb2NpdHlQcm9qZWN0aW9uO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbWF4QSArPSB2ZWxvY2l0eVByb2plY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBzYW1lIHRlc3QgYXMgYWJvdmUgZm9yIHRoZSBuZXcgcHJvamVjdGlvblxyXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxEaXN0YW5jZSA9IF9pbnRlcnZhbERpc3RhbmNlKG1pbkEsIG1heEEsIG1pbkIsIG1heEIpO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJ2YWxEaXN0YW5jZSA+IDApIHJlc3VsdC53aWxsSW50ZXJzZWN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGUgcG9seWdvbnMgYXJlIG5vdCBpbnRlcnNlY3RpbmcgYW5kIHdvbid0IGludGVyc2VjdCwgZXhpdCB0aGUgbG9vcFxyXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5pbnRlcnNlY3QgJiYgIXJlc3VsdC53aWxsSW50ZXJzZWN0KSBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjdXJyZW50IGludGVydmFsIGRpc3RhbmNlIGlzIHRoZSBtaW5pbXVtIG9uZS4gSWYgc28gc3RvcmVcclxuICAgICAgICAgICAgLy8gdGhlIGludGVydmFsIGRpc3RhbmNlIGFuZCB0aGUgY3VycmVudCBkaXN0YW5jZS5cclxuICAgICAgICAgICAgLy8gVGhpcyB3aWxsIGJlIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBtaW5pbXVtIHRyYW5zbGF0aW9uIHZlY3RvclxyXG4gICAgICAgICAgICBpbnRlcnZhbERpc3RhbmNlID0gTWF0aC5hYnMoaW50ZXJ2YWxEaXN0YW5jZSk7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnZhbERpc3RhbmNlIDwgbWluSW50ZXJ2YWxEaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgbWluSW50ZXJ2YWxEaXN0YW5jZSA9IGludGVydmFsRGlzdGFuY2U7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGlvbkF4aXMgPSBheGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIGQgPSBwb2x5Z29uQS5nZXRDZW50ZXIoKS5zdWIocG9seWdvbkIuZ2V0Q2VudGVyKCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGQuZG90KHRyYW5zbGF0aW9uQXhpcykgPCAwKSB0cmFuc2xhdGlvbkF4aXMgPSB0cmFuc2xhdGlvbkF4aXMuc2NhbGUoLTEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUaGUgbWluaW11bSB0cmFuc2xhdGlvbiB2ZWN0b3IgY2FuIGJlIHVzZWQgdG8gcHVzaCB0aGUgcG9seWdvbnMgYXBwYXJ0LlxyXG4gICAgICAgIC8vIEZpcnN0IG1vdmVzIHRoZSBwb2x5Z29ucyBieSB0aGVpciB2ZWxvY2l0eVxyXG4gICAgICAgIC8vIHRoZW4gbW92ZSBwb2x5Z29uQSBieSBNaW5pbXVtVHJhbnNsYXRpb25WZWN0b3IuXHJcbiAgICAgICAgaWYgKHJlc3VsdC53aWxsSW50ZXJzZWN0KSByZXN1bHQubWluaW11bVRyYW5zbGF0aW9uVmVjdG9yID0gdHJhbnNsYXRpb25BeGlzLnNjYWxlKG1pbkludGVydmFsRGlzdGFuY2UpO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYmV0d2VlbiBbbWluQSwgbWF4QV0gYW5kIFttaW5CLCBtYXhCXVxyXG4gICAgLy8gVGhlIGRpc3RhbmNlIHdpbGwgYmUgbmVnYXRpdmUgaWYgdGhlIGludGVydmFscyBvdmVybGFwXHJcbiAgICB2YXIgX2ludGVydmFsRGlzdGFuY2UgPSBmdW5jdGlvbiAobWluQSwgbWF4QSwgbWluQiwgbWF4Qikge1xyXG4gICAgICAgIGlmIChtaW5BIDwgbWluQikge1xyXG4gICAgICAgICAgICByZXR1cm4gbWluQiAtIG1heEE7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1pbkEgLSBtYXhCO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgdGhlIHByb2plY3Rpb24gb2YgYSBwb2x5Z29uIG9uIGFuIGF4aXMgYW5kIHJldHVybnMgaXQgYXMgYSBbbWluLCBtYXhdIGludGVydmFsXHJcbiAgICB2YXIgX3Byb2plY3RQb2x5Z29uID0gZnVuY3Rpb24gKGF4aXMsIHBvbHlnb24sIG1pbiwgbWF4KSB7XHJcbiAgICAgICAgLy8gVG8gcHJvamVjdCBhIHBvaW50IG9uIGFuIGF4aXMgdXNlIHRoZSBkb3QgcHJvZHVjdFxyXG4gICAgICAgIHZhciBkID0gYXhpcy5kb3QocG9seWdvbi52ZXJ0aWNlc1swXSk7XHJcbiAgICAgICAgbWluID0gZDtcclxuICAgICAgICBtYXggPSBkO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9seWdvbi52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBkID0gcG9seWdvbi52ZXJ0aWNlc1tpXS5kb3QoYXhpcyk7XHJcbiAgICAgICAgICAgIGlmIChkIDwgbWluKSB7XHJcbiAgICAgICAgICAgICAgICBtaW4gPSBkO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKGQgPiBtYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXggPSBkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG1pbjogbWluLFxyXG4gICAgICAgICAgICBtYXg6IG1heFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1vZHVsZTtcclxuXHJcbn0oUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zIHx8IHt9KSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgY2lyY2xlIHNoYXBlLCBpbmhlcml0cyBmcm9tIHNoYXBlXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYyA9IGluamVjdChcIlV0aWxzXCIpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgb3B0aW9ucykge1xyXG4gICAgICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgICAgIHRoaXMuYmFzZShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgb3B0aW9ucy53aWR0aCA9IG9wdGlvbnMuaGVpZ2h0ID0gb3B0aW9ucy5yYWRpdXMgKiAyLCBvcHRpb25zLnJhZGl1cyAqIDI7XHJcblxyXG4gICAgICAgIHRoaXMucmFkaXVzID0gb3B0aW9ucy5yYWRpdXM7XHJcbiAgICAgICAgdGhpcy5zQW5nbGUgPSB1dGlscy5jb252ZXJ0VG9SYWQob3B0aW9ucy5zQW5nbGUgfHwgMCk7XHJcbiAgICAgICAgdGhpcy5lQW5nbGUgPSB1dGlscy5jb252ZXJ0VG9SYWQob3B0aW9ucy5lQW5nbGUgfHwgMzYwKTtcclxuICAgICAgICB0aGlzLmNvbG9yID0gb3B0aW9ucy5jb2xvcjtcclxuICAgICAgICB0aGlzLmZpbGxDb2xvciA9IG9wdGlvbnMuZmlsbENvbG9yO1xyXG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gb3B0aW9ucy5saW5lV2lkdGggfHwgMTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKk92ZXJyaWRlcyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIGJlY2F1c2UgdGhlIGNpcmNsZSBjZW50ZXIgcG9pbnQgaXMgbm90IHRoZSB0b3AsbGVmdCBjb3JuZXJcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldENlbnRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy5wb3MueCArIHRoaXMud2lkdGggLyAyLCB0aGlzLnBvcy55ICsgdGhpcy5oZWlnaHQgLyAyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqT3ZlcnJpZGVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvblxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucG9pbnRJbnRlcnNlY3QgPSBmdW5jdGlvbiAocCkge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5wb3cocC54IC0gYy54LCAyKSArIE1hdGgucG93KHAueSAtIGMueSwgMikgPD0gTWF0aC5wb3coKHRoaXMud2lkdGggLyAyKSwgMik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqLWZwcyBpcyB0aGUgZnJhbWUgcGVyIHNlY29uZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJvdGF0ZVNoYXBlKGN0eCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcclxuICAgICAgICAgICAgY3R4LmFyYyh0aGlzLnBvcy54ICsgdGhpcy53aWR0aCAvIDIsIHRoaXMucG9zLnkgKyB0aGlzLmhlaWdodCAvIDIsIHRoaXMud2lkdGggLyAyLCB0aGlzLnNBbmdsZSwgdGhpcy5lQW5nbGUpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb2xvcikge1xyXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbGxDb2xvcikge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYW4gaW1hZ2UsIGluaGVyaXRzIGZyb20gb2JqZWN0XHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLkltYWdlID0gaW5qZWN0KFwiVXRpbHNcIilcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYmFzZShvcHRpb25zKTtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIExvY2Fsc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBfaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xyXG4gICAgICAgIF9pbWFnZS5zcmMgPSBvcHRpb25zLnVybDtcclxuICAgICAgICBfaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLndpZHRoID0gX2ltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBzZWxmLmhlaWdodCA9IF9pbWFnZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIF9sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIF9sb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgX2JsdXJSYWRpdXMgPSBvcHRpb25zLmJsdXJSYWRpdXMgfHwgMDtcclxuICAgICAgICB2YXIgX2NhY2hlID0gb3B0aW9ucy5jYWNoZSA9PSB1bmRlZmluZWQgPyB0cnVlIDogb3B0aW9ucy5jYWNoZTtcclxuICAgICAgICB2YXIgX2ZpbHRlckNhY2hlID0gbnVsbDtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICAgICAgICAgIGlmICghX2xvYWRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIV9maWx0ZXJDYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbHRlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRoaXMuZmlsdGVyc1tpXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkJsdXI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZmlsdGVyQ2FjaGUgPSBSZW5kZXJKcy5DYW52YXMuRmlsdGVycy5CbHVyKF9pbWFnZSwgX2JsdXJSYWRpdXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChfZmlsdGVyQ2FjaGUpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEoX2ZpbHRlckNhY2hlLCB0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoX2ltYWdlLCB0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIV9jYWNoZSlcclxuICAgICAgICAgICAgICAgIF9maWx0ZXJDYWNoZSA9IG51bGw7XHJcbiAgICAgICAgfTtcclxuICAgIH0pOyIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIGxpbmUgc2hhcGUsIGluaGVyaXRzIGZyb20gc2hhcGVcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuTGluZSA9IGluamVjdCgpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYmFzZSh7XHJcbiAgICAgICAgICAgIHg6IG9wdGlvbnMueDEsXHJcbiAgICAgICAgICAgIHk6IG9wdGlvbnMueTEsXHJcbiAgICAgICAgICAgIHdpZHRoOiBNYXRoLmFicyhvcHRpb25zLngyIC0gb3B0aW9ucy54MSksXHJcbiAgICAgICAgICAgIGhlaWdodDogTWF0aC5hYnMob3B0aW9ucy55MiAtIG9wdGlvbnMueTEpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuY29sb3IgPSBcIiMwMDBcIjtcclxuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgdGhpcy5wb3MyID0gbmV3IFJlbmRlckpzLlZlY3RvcihvcHRpb25zLngyLCBvcHRpb25zLnkyKTtcclxuICAgICAgICB0aGlzLmNvbG9yID0gb3B0aW9ucy5jb2xvcjtcclxuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IG9wdGlvbnMubGluZVdpZHRoIHx8IDE7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi1mcHMgaXMgdGhlIGZyYW1lIHBlciBzZWNvbmRcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCBmcmFtZSwgc3RhZ2VQb3NpdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgYWJzUG9zaXRpb24gPSB0aGlzLnBvcy5zdWIoc3RhZ2VQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHZhciBhYnNQb3NpdGlvbjIgPSB0aGlzLnBvczIuc3ViKHN0YWdlUG9zaXRpb24pO1xyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8oYWJzUG9zaXRpb24ueCwgYWJzUG9zaXRpb24ueSk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8oYWJzUG9zaXRpb24yLngsIGFic1Bvc2l0aW9uMi55KTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG4iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYSBsaW5lIHNoYXBlLCBpbmhlcml0cyBmcm9tIHNoYXBlXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24gPSBpbmplY3QoXCJVdGlsc1wiKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLmJhc2Uob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIHRoaXMuY29sb3IgPSBvcHRpb25zLmNvbG9yIHx8IFwiIzAwMFwiO1xyXG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gb3B0aW9ucy5saW5lV2lkdGggfHwgMTtcclxuICAgICAgICB0aGlzLnZlcnRpY2VzID0gb3B0aW9ucy5wb2ludHMgfHwgW107XHJcbiAgICAgICAgdGhpcy5zdWJQb2x5cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZWRnZXMgPSBbXTtcclxuICAgICAgICB0aGlzLnJFZGdlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuYnVpbGRFZGdlcygpO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIERlY29tcG9zZSBhIHBvbHlnb24gaWYgaXQncyBjb25jYXZlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kZWNvbXBvc2UgPSBmdW5jdGlvbiAocmVzdWx0LCByZWZsZXhWZXJ0aWNlcywgc3RlaW5lclBvaW50cywgZGVsdGEsIG1heGxldmVsLCBsZXZlbCkge1xyXG4gICAgICAgICAgICBtYXhsZXZlbCA9IG1heGxldmVsIHx8IDEwMDtcclxuICAgICAgICAgICAgbGV2ZWwgPSBsZXZlbCB8fCAwO1xyXG4gICAgICAgICAgICBkZWx0YSA9IGRlbHRhIHx8IDI1O1xyXG4gICAgICAgICAgICByZXN1bHQgPSB0eXBlb2YgKHJlc3VsdCkgIT09IFwidW5kZWZpbmVkXCIgPyByZXN1bHQgOiBbXTtcclxuICAgICAgICAgICAgcmVmbGV4VmVydGljZXMgPSByZWZsZXhWZXJ0aWNlcyB8fCBbXTtcclxuICAgICAgICAgICAgc3RlaW5lclBvaW50cyA9IHN0ZWluZXJQb2ludHMgfHwgW107XHJcblxyXG4gICAgICAgICAgICB2YXIgdXBwZXJJbnQgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLCBsb3dlckludCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCksIHAgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApOyAvLyBQb2ludHNcclxuICAgICAgICAgICAgdmFyIHVwcGVyRGlzdCA9IDAsIGxvd2VyRGlzdCA9IDAsIGQgPSAwLCBjbG9zZXN0RGlzdCA9IDA7IC8vIHNjYWxhcnNcclxuICAgICAgICAgICAgdmFyIHVwcGVySW5kZXggPSAwLCBsb3dlckluZGV4ID0gMCwgY2xvc2VzdEluZGV4ID0gMDsgLy8gSW50ZWdlcnNcclxuICAgICAgICAgICAgdmFyIGxvd2VyUG9seSA9IG5ldyBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24oKSwgdXBwZXJQb2x5ID0gbmV3IFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbigpOyAvLyBwb2x5Z29uc1xyXG4gICAgICAgICAgICB2YXIgcG9seSA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlcztcclxuXHJcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA8IDMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldmVsKys7XHJcbiAgICAgICAgICAgIGlmIChsZXZlbCA+IG1heGxldmVsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJxdWlja0RlY29tcDogbWF4IGxldmVsIChcIiArIG1heGxldmVsICsgXCIpIHJlYWNoZWQuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9seS5pc1JlZmxleChpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZmxleFZlcnRpY2VzLnB1c2gocG9seS52ZXJ0aWNlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJEaXN0ID0gbG93ZXJEaXN0ID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuVmVjdG9yLmxlZnQocG9seS5hdChpIC0gMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBSZW5kZXJKcy5WZWN0b3IucmlnaHRPbihwb2x5LmF0KGkgLSAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqIC0gMSkpKSB7IC8vIGlmIGxpbmUgaW50ZXJzZWN0cyB3aXRoIGFuIGVkZ2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSB0aGlzLmdldEludGVyc2VjdGlvblBvaW50KHBvbHkuYXQoaSAtIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopLCBwb2x5LmF0KGogLSAxKSk7IC8vIGZpbmQgdGhlIHBvaW50IG9mIGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlZlY3Rvci5yaWdodChwb2x5LmF0KGkgKyAxKSwgcG9seS5hdChpKSwgcCkpIHsgLy8gbWFrZSBzdXJlIGl0J3MgaW5zaWRlIHRoZSBwb2x5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZCA9IFJlbmRlckpzLlZlY3Rvci5zcWRpc3QocG9seS52ZXJ0aWNlc1tpXSwgcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgPCBsb3dlckRpc3QpIHsgLy8ga2VlcCBvbmx5IHRoZSBjbG9zZXN0IGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlckRpc3QgPSBkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlckludCA9IHA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VySW5kZXggPSBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuVmVjdG9yLmxlZnQocG9seS5hdChpICsgMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaiArIDEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgUmVuZGVySnMuVmVjdG9yLnJpZ2h0T24ocG9seS5hdChpICsgMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwID0gdGhpcy5nZXRJbnRlcnNlY3Rpb25Qb2ludChwb2x5LmF0KGkgKyAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSwgcG9seS5hdChqICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlZlY3Rvci5sZWZ0KHBvbHkuYXQoaSAtIDEpLCBwb2x5LmF0KGkpLCBwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBSZW5kZXJKcy5WZWN0b3Iuc3FkaXN0KHBvbHkudmVydGljZXNbaV0sIHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkIDwgdXBwZXJEaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyRGlzdCA9IGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVySW50ID0gcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJJbmRleCA9IGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbm8gdmVydGljZXMgdG8gY29ubmVjdCB0bywgY2hvb3NlIGEgcG9pbnQgaW4gdGhlIG1pZGRsZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb3dlckluZGV4ID09ICh1cHBlckluZGV4ICsgMSkgJSB0aGlzLnZlcnRpY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiQ2FzZSAxOiBWZXJ0ZXgoXCIraStcIiksIGxvd2VySW5kZXgoXCIrbG93ZXJJbmRleCtcIiksIHVwcGVySW5kZXgoXCIrdXBwZXJJbmRleCtcIiksIHBvbHkuc2l6ZShcIit0aGlzLnZlcnRpY2VzLmxlbmd0aCtcIilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAueCA9IChsb3dlckludC54ICsgdXBwZXJJbnQueCkgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLnkgPSAobG93ZXJJbnQueSArIHVwcGVySW50LnkpIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlaW5lclBvaW50cy5wdXNoKHApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCB1cHBlckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xvd2VyUG9seS5pbnNlcnQobG93ZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCkgKyBpLCBwb2x5LmJlZ2luKCkgKyB1cHBlckluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIGksIHVwcGVySW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS52ZXJ0aWNlcy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LnZlcnRpY2VzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG93ZXJJbmRleCAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cHBlclBvbHkuaW5zZXJ0KHVwcGVyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpICsgbG93ZXJJbmRleCwgcG9seS5lbmQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCBsb3dlckluZGV4LCBwb2x5LnZlcnRpY2VzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VwcGVyUG9seS5pbnNlcnQodXBwZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCksIHBvbHkuYmVnaW4oKSArIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgMCwgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbG93ZXJQb2x5Lmluc2VydChsb3dlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSArIGksIHBvbHkuZW5kKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgaSwgcG9seS52ZXJ0aWNlcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sb3dlclBvbHkuaW5zZXJ0KGxvd2VyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpLCBwb2x5LmJlZ2luKCkgKyB1cHBlckluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIDAsIHVwcGVySW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS52ZXJ0aWNlcy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LnZlcnRpY2VzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VwcGVyUG9seS5pbnNlcnQodXBwZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCkgKyBsb3dlckluZGV4LCBwb2x5LmJlZ2luKCkgKyBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIGxvd2VySW5kZXgsIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbm5lY3QgdG8gdGhlIGNsb3Nlc3QgcG9pbnQgd2l0aGluIHRoZSB0cmlhbmdsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiQ2FzZSAyOiBWZXJ0ZXgoXCIraStcIiksIGNsb3Nlc3RJbmRleChcIitjbG9zZXN0SW5kZXgrXCIpLCBwb2x5LnNpemUoXCIrdGhpcy52ZXJ0aWNlcy5sZW5ndGgrXCIpXFxuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvd2VySW5kZXggPiB1cHBlckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlckluZGV4ICs9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb3Nlc3REaXN0ID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cHBlckluZGV4IDwgbG93ZXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IGxvd2VySW5kZXg7IGogPD0gdXBwZXJJbmRleDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuVmVjdG9yLmxlZnRPbihwb2x5LmF0KGkgLSAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBSZW5kZXJKcy5WZWN0b3IucmlnaHRPbihwb2x5LmF0KGkgKyAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkID0gUmVuZGVySnMuVmVjdG9yLnNxZGlzdChwb2x5LmF0KGkpLCBwb2x5LmF0KGopKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCA8IGNsb3Nlc3REaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb3Nlc3REaXN0ID0gZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VzdEluZGV4ID0gaiAlIHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCBjbG9zZXN0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgaSwgY2xvc2VzdEluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2xvc2VzdEluZGV4ICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCBjbG9zZXN0SW5kZXgsIHYubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgMCwgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIGksIHYubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgMCwgY2xvc2VzdEluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIGNsb3Nlc3RJbmRleCwgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBzb2x2ZSBzbWFsbGVzdCBwb2x5IGZpcnN0XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvd2VyUG9seS52ZXJ0aWNlcy5sZW5ndGggPCB1cHBlclBvbHkudmVydGljZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5kZWNvbXBvc2UocmVzdWx0LCByZWZsZXhWZXJ0aWNlcywgc3RlaW5lclBvaW50cywgZGVsdGEsIG1heGxldmVsLCBsZXZlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5kZWNvbXBvc2UocmVzdWx0LCByZWZsZXhWZXJ0aWNlcywgc3RlaW5lclBvaW50cywgZGVsdGEsIG1heGxldmVsLCBsZXZlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmRlY29tcG9zZShyZXN1bHQsIHJlZmxleFZlcnRpY2VzLCBzdGVpbmVyUG9pbnRzLCBkZWx0YSwgbWF4bGV2ZWwsIGxldmVsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmRlY29tcG9zZShyZXN1bHQsIHJlZmxleFZlcnRpY2VzLCBzdGVpbmVyUG9pbnRzLCBkZWx0YSwgbWF4bGV2ZWwsIGxldmVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCByZXN1bHQubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2tdLmJ1aWxkRWRnZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBBcHBlbmQgcG9pbnRzIFwiZnJvbVwiIHRvIFwidG9cIi0xIGZyb20gYW4gb3RoZXIgcG9seWdvbiBcInBvbHlcIiBvbnRvIHRoaXMgb25lLlxyXG4gICAgICAgICAqIEBtZXRob2QgYXBwZW5kXHJcbiAgICAgICAgICogQHBhcmFtIHtQb2x5Z29ufSBwb2x5IFRoZSBwb2x5Z29uIHRvIGdldCBwb2ludHMgZnJvbS5cclxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gIGZyb20gVGhlIHZlcnRleCBpbmRleCBpbiBcInBvbHlcIi5cclxuICAgICAgICAgKiBAcGFyYW0ge051bWJlcn0gIHRvIFRoZSBlbmQgdmVydGV4IGluZGV4IGluIFwicG9seVwiLiBOb3RlIHRoYXQgdGhpcyB2ZXJ0ZXggaXMgTk9UIGluY2x1ZGVkIHdoZW4gYXBwZW5kaW5nLlxyXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuYXBwZW5kID0gZnVuY3Rpb24gKHBvbHksIGZyb20sIHRvKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGZyb20pID09PSBcInVuZGVmaW5lZFwiKSB0aHJvdyBuZXcgRXJyb3IoXCJGcm9tIGlzIG5vdCBnaXZlbiFcIik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHRvKSA9PT0gXCJ1bmRlZmluZWRcIikgdGhyb3cgbmV3IEVycm9yKFwiVG8gaXMgbm90IGdpdmVuIVwiKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0byAtIDEgPCBmcm9tKSB0aHJvdyBuZXcgRXJyb3IoXCJsb2wxXCIpO1xyXG4gICAgICAgICAgICBpZiAodG8gPiBwb2x5LnZlcnRpY2VzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwibG9sMlwiKTtcclxuICAgICAgICAgICAgaWYgKGZyb20gPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJsb2wzXCIpO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZyb207IGkgPCB0bzsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnRpY2VzLnB1c2gocG9seS52ZXJ0aWNlc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEdldCBhIHZlcnRleCBhdCBwb3NpdGlvbiBpLiBJdCBkb2VzIG5vdCBtYXR0ZXIgaWYgaSBpcyBvdXQgb2YgYm91bmRzLCB0aGlzIGZ1bmN0aW9uIHdpbGwganVzdCBjeWNsZS5cclxuICAgICAgICAgKiBAbWV0aG9kIGF0XHJcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpXHJcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5hdCA9IGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlcyxcclxuICAgICAgICAgICAgICAgIHMgPSB2Lmxlbmd0aDtcclxuICAgICAgICAgICAgcmV0dXJuIHZbaSA8IDAgPyBpICUgcyArIHMgOiBpICUgc107XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBHZXQgZmlyc3QgdmVydGV4XHJcbiAgICAgICAgICogQG1ldGhvZCBmaXJzdFxyXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZlcnRpY2VzWzBdO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogR2V0IGxhc3QgdmVydGV4XHJcbiAgICAgICAgICogQG1ldGhvZCBsYXN0XHJcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5sYXN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52ZXJ0aWNlc1t0aGlzLnZlcnRpY2VzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIENoZWNrcyB0aGF0IHRoZSBsaW5lIHNlZ21lbnRzIG9mIHRoaXMgcG9seWdvbiBkbyBub3QgaW50ZXJzZWN0IGVhY2ggb3RoZXIuXHJcbiAgICAgICAgICogQG1ldGhvZCBpc1NpbXBsZVxyXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSBwYXRoIEFuIGFycmF5IG9mIHZlcnRpY2VzIGUuZy4gW1swLDBdLFswLDFdLC4uLl1cclxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAgICAgICAqIEB0b2RvIFNob3VsZCBpdCBjaGVjayBhbGwgc2VnbWVudHMgd2l0aCBhbGwgb3RoZXJzP1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaXNTaW1wbGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXRoID0gdGhpcy52ZXJ0aWNlcztcclxuICAgICAgICAgICAgLy8gQ2hlY2tcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBpIC0gMTsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VnbWVudHNJbnRlcnNlY3QocGF0aFtpXSwgcGF0aFtpICsgMV0sIHBhdGhbal0sIHBhdGhbaiArIDFdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB0aGUgc2VnbWVudCBiZXR3ZWVuIHRoZSBsYXN0IGFuZCB0aGUgZmlyc3QgcG9pbnQgdG8gYWxsIG90aGVyc1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHBhdGgubGVuZ3RoIC0gMjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWdtZW50c0ludGVyc2VjdChwYXRoWzBdLCBwYXRoW3BhdGgubGVuZ3RoIC0gMV0sIHBhdGhbaV0sIHBhdGhbaSArIDFdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRJbnRlcnNlY3Rpb25Qb2ludCA9IGZ1bmN0aW9uIChwMSwgcDIsIHExLCBxMiwgZGVsdGEpIHtcclxuICAgICAgICAgICAgZGVsdGEgPSBkZWx0YSB8fCAwO1xyXG4gICAgICAgICAgICB2YXIgYTEgPSBwMi55IC0gcDEueTtcclxuICAgICAgICAgICAgdmFyIGIxID0gcDEueCAtIHAyLng7XHJcbiAgICAgICAgICAgIHZhciBjMSA9IChhMSAqIHAxLngpICsgKGIxICogcDEueSk7XHJcbiAgICAgICAgICAgIHZhciBhMiA9IHEyLnkgLSBxMS55O1xyXG4gICAgICAgICAgICB2YXIgYjIgPSBxMS54IC0gcTIueDtcclxuICAgICAgICAgICAgdmFyIGMyID0gKGEyICogcTEueCkgKyAoYjIgKiBxMS55KTtcclxuICAgICAgICAgICAgdmFyIGRldCA9IChhMSAqIGIyKSAtIChhMiAqIGIxKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghU2NhbGFyLmVxKGRldCwgMCwgZGVsdGEpKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5jbG9uZSgoKGIyICogYzEpIC0gKGIxICogYzIpKSAvIGRldCwgKChhMSAqIGMyKSAtIChhMiAqIGMxKSkgLyBkZXQpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmNsb25lKDAsIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBDaGVjayBpZiBhIHBvaW50IGluIHRoZSBwb2x5Z29uIGlzIGEgcmVmbGV4IHBvaW50XHJcbiAgICAgICAgICogQG1ldGhvZCBpc1JlZmxleFxyXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gIGlcclxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuaXNSZWZsZXggPSBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLnJpZ2h0KHRoaXMuYXQoaSAtIDEpLCB0aGlzLmF0KGkpLCB0aGlzLmF0KGkgKyAxKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5tYWtlQ0NXID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYnIgPSAwLFxyXG4gICAgICAgICAgICAgICAgdiA9IHRoaXMudmVydGljZXM7XHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGJvdHRvbSByaWdodCBwb2ludFxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGlmICh2W2ldLnkgPCB2W2JyXS55IHx8ICh2W2ldLnkgPT0gdlticl0ueSAmJiB2W2ldLnggPiB2W2JyXS54KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyID0gaTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gcmV2ZXJzZSBwb2x5IGlmIGNsb2Nrd2lzZVxyXG4gICAgICAgICAgICBpZiAoIVJlbmRlckpzLlZlY3Rvci5sZWZ0KHRoaXMuYXQoYnIgLSAxKSwgdGhpcy5hdChiciksIHRoaXMuYXQoYnIgKyAxKSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmV2ZXJzZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFJldmVyc2UgdGhlIHZlcnRpY2VzIGluIHRoZSBwb2x5Z29uXHJcbiAgICAgICAgICogQG1ldGhvZCByZXZlcnNlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yZXZlcnNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdG1wID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBOID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkgIT09IE47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG1wLnB1c2godGhpcy52ZXJ0aWNlcy5wb3AoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IHRtcDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNlZ21lbnRzSW50ZXJzZWN0ID0gZnVuY3Rpb24gKHAxLCBwMiwgcTEsIHEyKSB7XHJcbiAgICAgICAgICAgIHZhciBkeCA9IHAyLnggLSBwMS54O1xyXG4gICAgICAgICAgICB2YXIgZHkgPSBwMi55IC0gcDEueTtcclxuICAgICAgICAgICAgdmFyIGRhID0gcTIueCAtIHExLng7XHJcbiAgICAgICAgICAgIHZhciBkYiA9IHEyLnkgLSBxMS55O1xyXG5cclxuICAgICAgICAgICAgLy8gc2VnbWVudHMgYXJlIHBhcmFsbGVsXHJcbiAgICAgICAgICAgIGlmIChkYSAqIGR5IC0gZGIgKiBkeCA9PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHMgPSAoZHggKiAocTEueSAtIHAxLnkpICsgZHkgKiAocDEueCAtIHExLngpKSAvIChkYSAqIGR5IC0gZGIgKiBkeClcclxuICAgICAgICAgICAgdmFyIHQgPSAoZGEgKiAocDEueSAtIHExLnkpICsgZGIgKiAocTEueCAtIHAxLngpKSAvIChkYiAqIGR4IC0gZGEgKiBkeSlcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAocyA+PSAwICYmIHMgPD0gMSAmJiB0ID49IDAgJiYgdCA8PSAxKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmJ1aWxkRWRnZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBwMTtcclxuICAgICAgICAgICAgdmFyIHAyO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2VzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuckVkZ2VzID0gW107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgcDEgPSB0aGlzLnZlcnRpY2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgKyAxID49IHRoaXMudmVydGljZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcDIgPSB0aGlzLnZlcnRpY2VzWzBdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwMiA9IHRoaXMudmVydGljZXNbaSArIDFdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGdlcy5wdXNoKHAyLnN1YihwMSkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yRWRnZXMucHVzaCh7cDE6IG5ldyBSZW5kZXJKcy5WZWN0b3IocDEueCwgcDEueSksIHAyOiBuZXcgUmVuZGVySnMuVmVjdG9yKHAyLngsIHAyLnkpfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldENlbnRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsWCA9IDA7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbFkgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRvdGFsWCArPSB0aGlzLnZlcnRpY2VzW2ldLng7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFkgKz0gdGhpcy52ZXJ0aWNlc1tpXS55O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0b3RhbFggLyB0aGlzLnZlcnRpY2VzLmxlbmd0aCwgdG90YWxZIC8gdGhpcy52ZXJ0aWNlcy5sZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMub2Zmc2V0ID0gZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgICAgICAgICAgdmFyIHYgPSBhcmd1bWVudHMubGVuZ3RoID09PSAyID8gbmV3IFJlbmRlckpzLlZlY3Rvcihhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSkgOiBhcmd1bWVudHNbMF07XHJcbiAgICAgICAgICAgIHRoaXMucG9zLnNldCh0aGlzLnBvcy5hZGQodikpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBwID0gdGhpcy52ZXJ0aWNlc1tpXTtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVydGljZXNbaV0uc2V0KHAuYWRkKHYpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN1YlBvbHlzID0gdGhpcy5kZWNvbXBvc2UoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPSBcIlwiKSByZXN1bHQgKz0gXCIgXCI7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCJ7XCIgKyB0aGlzLnZlcnRpY2VzW2ldLnRvU3RyaW5nKHRydWUpICsgXCJ9XCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqLWZwcyBpcyB0aGUgZnJhbWUgcGVyIHNlY29uZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgdmFyIGNvbG9ycyA9IFtcImluZGlhbnJlZFwiLCBcInllbGxvd1wiLCAnZ3JlZW4nXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YlBvbHlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmVydGljZXMgPSB0aGlzLnN1YlBvbHlzW2ldLnZlcnRpY2VzO1xyXG4gICAgICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh2ZXJ0aWNlc1swXS54LCB2ZXJ0aWNlc1swXS55KTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAxOyBqIDwgdmVydGljZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHZlcnRpY2VzW2pdLngsIHZlcnRpY2VzW2pdLnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcnNbaV07XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pOyIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIHJlY3RhbmdsZSBzaGFwZSwgaW5oZXJpdHMgZnJvbSBzaGFwZVxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUgPSBpbmplY3QoXCJVdGlsc1wiKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5iYXNlKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuY29sb3IgPSBvcHRpb25zLmNvbG9yO1xyXG4gICAgICAgIHRoaXMuZmlsbENvbG9yID0gb3B0aW9ucy5maWxsQ29sb3I7XHJcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBvcHRpb25zLmxpbmVXaWR0aCB8fCAxO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jb2xvcikge1xyXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QodGhpcy5wb3MueCwgdGhpcy5wb3MueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbGxDb2xvcikge1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHRoaXMucG9zLngsIHRoaXMucG9zLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbiIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIHNwcml0ZSBpbWFnZSwgaW5oZXJpdHMgZnJvbSBzaGFwZVxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5TcHJpdGUgPSBpbmplY3QoXCJVdGlsc1wiKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLmJhc2Uob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogTG9jYWxzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHZhciBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XHJcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzZWxmLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIHNlbGYuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaW1hZ2Uuc3JjID0gb3B0aW9ucy51cmw7XHJcbiAgICAgICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBmcmFtZUluZGV4ID0gMDtcclxuICAgICAgICB2YXIgZnJhbWVDb3VudCA9IG9wdGlvbnMuZnJhbWVDb3VudDtcclxuICAgICAgICB2YXIgc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBsb29wID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGRlZkFuaW1hdGlvbiA9IG9wdGlvbnMuZGVmQW5pbWF0aW9uO1xyXG4gICAgICAgIHZhciBjdXJyZW50O1xyXG4gICAgICAgIHZhciBwcmV2aW91cztcclxuICAgICAgICB2YXIgYW5pbWF0aW9ucyA9IG9wdGlvbnMuYW5pbWF0aW9ucztcclxuXHJcbiAgICAgICAgdmFyIGFuaW1hdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBpc0xvb3ApIHtcclxuICAgICAgICAgICAgZnJhbWVJbmRleCA9IDA7XHJcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBsb29wID0gaXNMb29wO1xyXG4gICAgICAgICAgICBpZiAoIWFuaW1hdGlvbnNbbmFtZV0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwcmV2aW91cyA9IGN1cnJlbnQ7XHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSBhbmltYXRpb25zW25hbWVdO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhbmltYXRpb24oZGVmQW5pbWF0aW9uLCB0cnVlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldEFuaW1hdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBsb29wKSB7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbihuYW1lLCBsb29wKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnBvaW50SW50ZXJzZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRSZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgZGVmRnJhbWUgPSBhbmltYXRpb25zW2RlZkFuaW1hdGlvbl1bMF07XHJcbiAgICAgICAgICAgIHJldHVybiB7eDogdGhpcy5wb3MueCwgeTogdGhpcy5wb3MueSwgd2lkdGg6IGRlZkZyYW1lWzJdLCBoZWlnaHQ6IGRlZkZyYW1lWzNdfTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnJvdGF0ZVNoYXBlID0gZnVuY3Rpb24gKGN0eCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgZGVmRnJhbWUgPSBhbmltYXRpb25zW2RlZkFuaW1hdGlvbl1bMF07XHJcbiAgICAgICAgICAgIHZhciBvID0gbmV3IFJlbmRlckpzLlZlY3Rvcihwb3NpdGlvbi54ICsgKGRlZkZyYW1lWzJdIC8gMiksIHBvc2l0aW9uLnkgKyAoZGVmRnJhbWVbM10gLyAyKSk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoby54LCBvLnkpO1xyXG4gICAgICAgICAgICBjdHgucm90YXRlKHV0aWxzLmNvbnZlcnRUb1JhZCh0aGlzLmFuZ2xlKSk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLW8ueCwgLW8ueSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIGZyYW1lLCBzdGFnZVBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghbG9hZGVkIHx8ICFzdGFydGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBhYnNQb3NpdGlvbiA9IHRoaXMucG9zLnN1YihzdGFnZVBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yb3RhdGVTaGFwZShjdHgsIGFic1Bvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRGcmFtZSA9IGN1cnJlbnRbZnJhbWVJbmRleF07XHJcblxyXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCBjdXJyZW50RnJhbWVbMF0sIGN1cnJlbnRGcmFtZVsxXSwgY3VycmVudEZyYW1lWzJdLCBjdXJyZW50RnJhbWVbM10sIGFic1Bvc2l0aW9uLngsIGFic1Bvc2l0aW9uLnksIGN1cnJlbnRGcmFtZVsyXSwgY3VycmVudEZyYW1lWzNdKTtcclxuICAgICAgICAgICAgaWYgKE1hdGguZmxvb3IoZnJhbWUudGltZSkgJSBmcmFtZUNvdW50ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFtZUluZGV4ID0gZnJhbWVJbmRleCA+PSBjdXJyZW50Lmxlbmd0aCAtIDEgPyAwIDogZnJhbWVJbmRleCArIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJhbWVJbmRleCA9PT0gMCAmJiAhbG9vcCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbihkZWZBbmltYXRpb24sIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=