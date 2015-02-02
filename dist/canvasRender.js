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

        var lastUpdate;

        var getFps = function () {
            var now = new Date();
            var fps = 1000 / (now - lastUpdate);
            //fps += (thisFrameFPS - fps) / refFps;
            lastUpdate = now;
            return fps;
        };

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
        this.drawObjects = function (absPosition) {
            if (!lastUpdate) {
                lastUpdate = (new Date()) * 1 - 1;
            }
            if (!_forceRender && ((_initialized && !_dispatcher.hasSubscribers('animate') && !this.hasSprites(this) && !this.active) || this.objects.length === 0)) {
                return;
            }

            var fps = getFps();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var aktFrameRate = Math.floor(1000 / fps);

            _dispatcher.trigger("animate", fps);
            var objectsLoaded = true;
            for (var i = 0, length = this.objects.length; i < length; i++) {
                if (!this.objects[i].loaded) {
                    objectsLoaded = false;
                }
                this.objects[i].draw(this.ctx, {
                    frameRate: fps,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdlbmVyYWwuanMiLCJncmFwaGljcy5qcyIsIm51bWJlci5qcyIsImxpbmtlZGxpc3QuanMiLCJtYWluLmpzIiwibW9kdWxlcy9hbmltYXRpb24uanMiLCJtb2R1bGVzL2ZpbHRlcnMuanMiLCJtb2R1bGVzL2xheWVyLmpzIiwibW9kdWxlcy9vYmplY3QuanMiLCJtb2R1bGVzL3NwYWNlLmpzIiwibW9kdWxlcy9zdGFnZS5qcyIsIm1vZHVsZXMvdHJhbnNpdGlvbi5qcyIsIm1vZHVsZXMvdmVjdG9yLmpzIiwibW9kdWxlcy9nYW1lL3BoeXNpY3MuanMiLCJtb2R1bGVzL2dhbWUvcG9seWdvbkNvbGxpc2lvbi5qcyIsIm1vZHVsZXMvc2hhcGVzL2FyYy5qcyIsIm1vZHVsZXMvc2hhcGVzL2ltYWdlLmpzIiwibW9kdWxlcy9zaGFwZXMvbGluZS5qcyIsIm1vZHVsZXMvc2hhcGVzL3BvbHlnb24uanMiLCJtb2R1bGVzL3NoYXBlcy9yZWN0YW5nbGUuanMiLCJtb2R1bGVzL3NoYXBlcy9zcHJpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjYW52YXNSZW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIG1vZHVsZS5nZXRHdWlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnBhcnNlVXJsID0gZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIHZhciBwYXJzZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgcGFyc2VyLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJvdG9jb2w6IHBhcnNlci5wcm90b2NvbCxcclxuICAgICAgICAgICAgcG9ydDogcGFyc2VyLnBvcnQsXHJcbiAgICAgICAgICAgIHBhdGhuYW1lOiBwYXJzZXIucGF0aG5hbWUsXHJcbiAgICAgICAgICAgIHNlYXJjaDogcGFyc2VyLnNlYXJjaCxcclxuICAgICAgICAgICAgaGFzaDogcGFyc2VyLmhhc2gsXHJcbiAgICAgICAgICAgIGhvc3Q6IHBhcnNlci5ob3N0XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnNsZWVwID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgd2hpbGUgKG5ldyBEYXRlKCkgLSBkYXRlIDwgc2Vjb25kcyAqIDEwMDApXHJcbiAgICAgICAgeyB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcbn0oVXRpbHMgfHwge30pKTsiLCJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgbW9kdWxlLmNvbnZlcnRUb1JhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgICAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZ2V0TW91c2VQb3MgPSBmdW5jdGlvbiAoY2FudmFzLCBldnQpIHtcclxuICAgICAgICB2YXIgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBldnQuY2xpZW50WCAtIHJlY3QubGVmdCxcclxuICAgICAgICAgICAgeTogZXZ0LmNsaWVudFkgLSByZWN0LnRvcFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmdldENhbnZhcyA9IGZ1bmN0aW9uICh3LCBoKSB7XHJcbiAgICAgICAgdmFyIGMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICBjLndpZHRoID0gdztcclxuICAgICAgICBjLmhlaWdodCA9IGg7XHJcbiAgICAgICAgcmV0dXJuIGM7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmdldFBpeGVscyA9IGZ1bmN0aW9uIChpbWcpIHtcclxuICAgICAgICB2YXIgYywgY3R4O1xyXG4gICAgICAgIGlmIChpbWcuZ2V0Q29udGV4dCkge1xyXG4gICAgICAgICAgICBjID0gaW1nO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY3R4ID0gYy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFjdHgpIHtcclxuICAgICAgICAgICAgYyA9IFV0aWxzLmdldENhbnZhcyhpbWcud2lkdGgsIGltZy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBjdHggPSBjLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgYy53aWR0aCwgYy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcbn0oVXRpbHMgfHwge30pKTsiLCJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIG1vZHVsZS5pc051bWJlciA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gIWlzTmFOKHZhbHVlKTsgfVxyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcbn0oVXRpbHMgfHwge30pKTtcclxuIiwidmFyIExpbmtlZExpc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgIHZhciBub2RlcyA9IFtdO1xyXG5cclxuICAgIHRoaXMubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGg7XHJcbiAgICB9O1xyXG4gICAgdGhpcy5maXJzdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZXNbMF07XHJcbiAgICB9O1xyXG4gICAgdGhpcy5sYXN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBub2Rlc1tub2Rlcy5sZW5ndGggLSAxXTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5idWlsZExpc3QgPSBmdW5jdGlvbiAobm9kZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbm9kZXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3QgPSBub2Rlc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gbGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0ID0gbm9kZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG5vZGVzW2ldLnByZXYgPSBub2Rlc1tpIC0gMV07XHJcbiAgICAgICAgICAgIG5vZGVzW2ldLm5leHQgPSBub2Rlc1tpICsgMV07XHJcbiAgICAgICAgICAgIG5vZGVzLnB1c2gobm9kZXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmFwcGVuZCA9IGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmxhc3QoKTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGFzdC5uZXh0ID0gbm9kZTtcclxuICAgICAgICAgICAgbm9kZS5wcmV2ID0gbGFzdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbm9kZXMucHVzaChub2RlKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRFbnVtZXJhdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IC0xO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGN1cnJlbnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1tpbmRleF07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gbm9kZXMubGVuZ3RoIC0gMSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzWysraW5kZXhdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcmV2OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZXNbaW5kZXgtLV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufSIsIi8vXHJcbi8vUmVnaXN0ZXIgdHlwZXNcclxuZGVwZW5kZW5jeUNvbnRhaW5lci5yZWdpc3RlclR5cGUoXCJqUXVlcnlcIiwgJCk7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwibGlucVwiLCBsaW5xKTtcclxuZGVwZW5kZW5jeUNvbnRhaW5lci5yZWdpc3RlclR5cGUoXCJVdGlsc1wiLCBVdGlscyk7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwiRXZlbnREaXNwYXRjaGVyXCIsIEV2ZW50RGlzcGF0Y2hlcik7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwiTGlua2VkTGlzdFwiLCBMaW5rZWRMaXN0KTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5BbmltYXRpb24gPSBpbmplY3QoKVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uIChoYW5kbGVyLCBsYXllcikge1xyXG5cclxuICAgICAgICB2YXIgdGltZSA9IDA7XHJcbiAgICAgICAgdmFyIHN1YnNjcmliZXI7XHJcbiAgICAgICAgdmFyIHN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgc3RvcHBlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBwYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdmFyIGFuaW1hdGlvbiA9IGZ1bmN0aW9uIChmcmFtZVJhdGUpIHtcclxuICAgICAgICAgICAgaGFuZGxlcih7XHJcbiAgICAgICAgICAgICAgICBmcmFtZVJhdGU6IGZyYW1lUmF0ZSxcclxuICAgICAgICAgICAgICAgIGxhc3RUaW1lOiB0aW1lLFxyXG4gICAgICAgICAgICAgICAgdGltZTogdGltZSArIDEwMDAgLyBmcmFtZVJhdGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRpbWUgKz0gMTAwMCAvIGZyYW1lUmF0ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc3RhcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBzdG9wcGVkID0gcGF1c2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHN1YnNjcmliZXIgPSBsYXllci5vbihcImFuaW1hdGVcIiwgYW5pbWF0aW9uKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aW1lID0gMDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc3RhcnRlZCAmJiBzdWJzY3JpYmVyKSB7XHJcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgcGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzdGFydGVkICYmIHN1YnNjcmliZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgICAgICAgICAgICAgIHN1YnNjcmliZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHN0b3BwZWQgPSB0cnVlO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQ29udm9sdXRlID0gZnVuY3Rpb24gKGltYWdlLCB3ZWlnaHRzLCBvcGFxdWUpIHtcclxuICAgIHZhciBzaWRlID0gTWF0aC5yb3VuZChNYXRoLnNxcnQod2VpZ2h0cy5sZW5ndGgpKTtcclxuICAgIHZhciBoYWxmU2lkZSA9IE1hdGguZmxvb3Ioc2lkZSAvIDIpO1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgc3JjID0gcGl4ZWxzLmRhdGE7XHJcbiAgICB2YXIgc3cgPSBwaXhlbHMud2lkdGg7XHJcbiAgICB2YXIgc2ggPSBwaXhlbHMuaGVpZ2h0O1xyXG4gICAgLy8gcGFkIG91dHB1dCBieSB0aGUgY29udm9sdXRpb24gbWF0cml4XHJcbiAgICB2YXIgdyA9IHN3O1xyXG4gICAgdmFyIGggPSBzaDtcclxuICAgIHZhciBvdXRwdXQgPSBVdGlscy5nZXRDYW52YXModywgaCkuZ2V0Q29udGV4dChcIjJkXCIpLmNyZWF0ZUltYWdlRGF0YSh3LCBoKTtcclxuICAgIHZhciBkc3QgPSBvdXRwdXQuZGF0YTtcclxuICAgIC8vIGdvIHRocm91Z2ggdGhlIGRlc3RpbmF0aW9uIGltYWdlIHBpeGVsc1xyXG4gICAgdmFyIGFscGhhRmFjID0gb3BhcXVlID8gMSA6IDA7XHJcbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IGg7IHkrKykge1xyXG4gICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgdzsgeCsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzeSA9IHk7XHJcbiAgICAgICAgICAgIHZhciBzeCA9IHg7XHJcbiAgICAgICAgICAgIHZhciBkc3RPZmYgPSAoeSAqIHcgKyB4KSAqIDQ7XHJcbiAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgd2VpZ2hlZCBzdW0gb2YgdGhlIHNvdXJjZSBpbWFnZSBwaXhlbHMgdGhhdFxyXG4gICAgICAgICAgICAvLyBmYWxsIHVuZGVyIHRoZSBjb252b2x1dGlvbiBtYXRyaXhcclxuICAgICAgICAgICAgdmFyIHIgPSAwLCBnID0gMCwgYiA9IDAsIGEgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBjeSA9IDA7IGN5IDwgc2lkZTsgY3krKykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY3ggPSAwOyBjeCA8IHNpZGU7IGN4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2N5ID0gc3kgKyBjeSAtIGhhbGZTaWRlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzY3ggPSBzeCArIGN4IC0gaGFsZlNpZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjeSA+PSAwICYmIHNjeSA8IHNoICYmIHNjeCA+PSAwICYmIHNjeCA8IHN3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcmNPZmYgPSAoc2N5ICogc3cgKyBzY3gpICogNDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHd0ID0gd2VpZ2h0c1tjeSAqIHNpZGUgKyBjeF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgKz0gc3JjW3NyY09mZl0gKiB3dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZyArPSBzcmNbc3JjT2ZmICsgMV0gKiB3dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYiArPSBzcmNbc3JjT2ZmICsgMl0gKiB3dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYSArPSBzcmNbc3JjT2ZmICsgM10gKiB3dDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZHN0W2RzdE9mZl0gPSByO1xyXG4gICAgICAgICAgICBkc3RbZHN0T2ZmICsgMV0gPSBnO1xyXG4gICAgICAgICAgICBkc3RbZHN0T2ZmICsgMl0gPSBiO1xyXG4gICAgICAgICAgICBkc3RbZHN0T2ZmICsgM10gPSBhICsgYWxwaGFGYWMgKiAoMjU1IC0gYSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG91dHB1dDtcclxufVxyXG5cclxuUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQmx1ciA9IGZ1bmN0aW9uIChpbWFnZSwgYmx1clJhZGl1cykge1xyXG4gICAgcmV0dXJuIHN0YWNrQmx1ckltYWdlKGltYWdlLCBibHVyUmFkaXVzKTtcclxufVxyXG5cclxuUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuR3JheXNjYWxlID0gZnVuY3Rpb24gKGltYWdlLCBhcmdzKSB7XHJcbiAgICB2YXIgcGl4ZWxzID0gVXRpbHMuZ2V0UGl4ZWxzKGltYWdlKTtcclxuICAgIHZhciBkID0gcGl4ZWxzLmRhdGE7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyBpICs9IDQpIHtcclxuICAgICAgICB2YXIgciA9IGRbaV07XHJcbiAgICAgICAgdmFyIGcgPSBkW2kgKyAxXTtcclxuICAgICAgICB2YXIgYiA9IGRbaSArIDJdO1xyXG4gICAgICAgIC8vIENJRSBsdW1pbmFuY2UgZm9yIHRoZSBSR0JcclxuICAgICAgICB2YXIgdiA9IDAuMjEyNiAqIHIgKyAwLjcxNTIgKiBnICsgMC4wNzIyICogYjtcclxuICAgICAgICBkW2ldID0gZFtpICsgMV0gPSBkW2kgKyAyXSA9IHZcclxuICAgIH1cclxuICAgIHJldHVybiBwaXhlbHM7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRmlsdGVycy5CcmlnaHRuZXNzID0gZnVuY3Rpb24gKGltYWdlLCBhZGp1c3RtZW50KSB7XHJcbiAgICB2YXIgcGl4ZWxzID0gVXRpbHMuZ2V0UGl4ZWxzKGltYWdlKTtcclxuICAgIHZhciBkID0gcGl4ZWxzLmRhdGE7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyBpICs9IDQpIHtcclxuICAgICAgICBkW2ldICs9IGFkanVzdG1lbnQ7XHJcbiAgICAgICAgZFtpICsgMV0gKz0gYWRqdXN0bWVudDtcclxuICAgICAgICBkW2kgKyAyXSArPSBhZGp1c3RtZW50O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBpeGVscztcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLlRocmVzaG9sZCA9IGZ1bmN0aW9uIChpbWFnZSwgdGhyZXNob2xkKSB7XHJcbiAgICB2YXIgcGl4ZWxzID0gVXRpbHMuZ2V0UGl4ZWxzKGltYWdlKTtcclxuICAgIHZhciBkID0gcGl4ZWxzLmRhdGE7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyBpICs9IDQpIHtcclxuICAgICAgICB2YXIgciA9IGRbaV07XHJcbiAgICAgICAgdmFyIGcgPSBkW2kgKyAxXTtcclxuICAgICAgICB2YXIgYiA9IGRbaSArIDJdO1xyXG4gICAgICAgIHZhciB2ID0gKDAuMjEyNiAqIHIgKyAwLjcxNTIgKiBnICsgMC4wNzIyICogYiA+PSB0aHJlc2hvbGQpID8gMjU1IDogMDtcclxuICAgICAgICBkW2ldID0gZFtpICsgMV0gPSBkW2kgKyAyXSA9IHZcclxuICAgIH1cclxuICAgIHJldHVybiBwaXhlbHM7XHJcbn07XHJcbiIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkxheWVyID0gaW5qZWN0KFwiVXRpbHNcIiwgXCJFdmVudERpc3BhdGNoZXJcIiwgXCJqUXVlcnlcIilcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIGRpc3BhdGNoZXIsICQsIGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCwgYWN0aXZlKSB7XHJcblxyXG4gICAgICAgIHZhciBfc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdmFyIF9pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBfZm9yY2VSZW5kZXIgPSBmYWxzZTtcclxuICAgICAgICB2YXIgX2Rpc3BhdGNoZXIgPSBuZXcgZGlzcGF0Y2hlcigpO1xyXG4gICAgICAgIHZhciBfdGltZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXIpLmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcclxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGFjdGl2ZTtcclxuICAgICAgICAvL0ZvciB0aGUgbGlua2VkIGxpc3RcclxuICAgICAgICB0aGlzLnByZXYgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vQXJyYXkgb2Ygb2JqZWN0cyBvbiB0aGUgbGF5ZXJcclxuICAgICAgICB0aGlzLm9iamVjdHMgPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGxhc3RVcGRhdGU7XHJcblxyXG4gICAgICAgIHZhciBnZXRGcHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICB2YXIgZnBzID0gMTAwMCAvIChub3cgLSBsYXN0VXBkYXRlKTtcclxuICAgICAgICAgICAgLy9mcHMgKz0gKHRoaXNGcmFtZUZQUyAtIGZwcykgLyByZWZGcHM7XHJcbiAgICAgICAgICAgIGxhc3RVcGRhdGUgPSBub3c7XHJcbiAgICAgICAgICAgIHJldHVybiBmcHM7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9jbGlja0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gfHwgVXRpbHMuZ2V0TW91c2VQb3MoZXZlbnQudGFyZ2V0LCBldmVudCk7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5jbGljaywgW2V2ZW50LCBwb3NpdGlvbl0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5vYmplY3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zLnBvaW50SW5PYmplY3QocG9zaXRpb24sIHRoaXMub2JqZWN0c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0udHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLmNsaWNrLCBldmVudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2KSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMucHJldi5jYW52YXMpLnRyaWdnZXIoXCJjbGlja1wiLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX21vdXNlbW92ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gfHwgVXRpbHMuZ2V0TW91c2VQb3MoZXZlbnQudGFyZ2V0LCBldmVudCk7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZW1vdmUsIFtldmVudCwgcG9zaXRpb25dKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMub2JqZWN0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucy5wb2ludEluT2JqZWN0KHBvc2l0aW9uLCB0aGlzLm9iamVjdHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzW2ldLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZW1vdmUsIFtldmVudCwgcG9zaXRpb25dKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcy5wcmV2LmNhbnZhcykudHJpZ2dlcihcIm1vdXNlbW92ZVwiLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX21vdXNlZW50ZXJIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IFV0aWxzLmdldE1vdXNlUG9zKGV2ZW50LnRhcmdldCwgZXZlbnQpO1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2VlbnRlciwgW2V2ZW50LCBwb3NpdGlvbl0pO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5vYmplY3RzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zLnBvaW50SW5PYmplY3QocG9zaXRpb24sIHRoaXMub2JqZWN0c1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0udHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlZW50ZXIsIFtldmVudCwgcG9zaXRpb25dKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcy5wcmV2LmNhbnZhcykudHJpZ2dlcihcIm1vdXNlZW50ZXJcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9tb3VzZWxlYXZlSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCBVdGlscy5nZXRNb3VzZVBvcyhldmVudC50YXJnZXQsIGV2ZW50KTtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlbGVhdmUsIFtldmVudCwgcG9zaXRpb25dKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMub2JqZWN0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucy5wb2ludEluT2JqZWN0KHBvc2l0aW9uLCB0aGlzLm9iamVjdHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzW2ldLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZWxlYXZlLCBbZXZlbnQsIHBvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldikge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzLnByZXYuY2FudmFzKS50cmlnZ2VyKFwibW91c2VsZWF2ZVwiLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgX2tleWRvd25IYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5rZXlkb3duLCBldmVudCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9rZXl1cEhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLmtleXVwLCBldmVudCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9rZXlwcmVzc0hhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLmtleXByZXNzLCBldmVudCk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vRXZlbnQgd2lyZXVwc1xyXG4gICAgICAgICQodGhpcy5jYW52YXMpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBfY2xpY2tIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50LCBwb3NpdGlvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQodGhpcy5jYW52YXMpLm9uKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgX21vdXNlbW92ZUhhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQsIHBvc2l0aW9uKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJCh0aGlzLmNhbnZhcykub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgX21vdXNlZW50ZXJIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50LCBwb3NpdGlvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQodGhpcy5jYW52YXMpLm9uKFwibW91c2VsZWF2ZVwiLCBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIF9tb3VzZWxlYXZlSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCwgcG9zaXRpb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9rZXlkb3duSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKFwia2V5dXBcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9rZXl1cEhhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKGRvY3VtZW50KS5vbihcImtleXByZXNzXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfa2V5cHJlc3NIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIGlmICghUmVuZGVySnMuQ2FudmFzLkV2ZW50c1t0eXBlXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfZGlzcGF0Y2hlci5zdWJzY3JpYmUodHlwZSwgaGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy9BZGQgYW4gb2JqZWN0IHRvIHRoZSBsYXllciwgaXQgd2lsbCBiZSByZW5kZXJlZCBvbiB0aGlzIGxheWVyXHJcbiAgICAgICAgdGhpcy5hZGRPYmplY3QgPSBmdW5jdGlvbiAob2JqZWN0KSB7XHJcbiAgICAgICAgICAgIGlmICghKG9iamVjdCBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5PYmplY3QpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBbiBvYmplY3Qgb24gdGhlIGNhbnZhcyBzaG91bGQgYmUgaW5oZXJpdGVkIGZyb20gQ2FudmFzT2JqZWN0IVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvYmplY3QubGF5ZXIgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdHMucHVzaChvYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucmVtb3ZlT2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICBsaW5xKHRoaXMub2JqZWN0cykucmVtb3ZlKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSA9PT0gb2JqZWN0O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgb2JqZWN0LmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgX2ZvcmNlUmVuZGVyID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnJlc2l6ZSA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgX2ZvcmNlUmVuZGVyID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL1JldHVybnMgdHJ1ZSBpZiB0aGUgbGF5ZXIgaGFzIHNwcml0ZSBvYmplY3RzIG90aGVyd2lzZSBmYWxzZVxyXG4gICAgICAgIHRoaXMuaGFzU3ByaXRlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMub2JqZWN0cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0c1tpXSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuU3ByaXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vUmVkcmF3IG9iamVjdHMgb24gbGF5ZXJzIGlmIGl0J3MgYWN0aXZlXHJcbiAgICAgICAgdGhpcy5kcmF3T2JqZWN0cyA9IGZ1bmN0aW9uIChhYnNQb3NpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIWxhc3RVcGRhdGUpIHtcclxuICAgICAgICAgICAgICAgIGxhc3RVcGRhdGUgPSAobmV3IERhdGUoKSkgKiAxIC0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIV9mb3JjZVJlbmRlciAmJiAoKF9pbml0aWFsaXplZCAmJiAhX2Rpc3BhdGNoZXIuaGFzU3Vic2NyaWJlcnMoJ2FuaW1hdGUnKSAmJiAhdGhpcy5oYXNTcHJpdGVzKHRoaXMpICYmICF0aGlzLmFjdGl2ZSkgfHwgdGhpcy5vYmplY3RzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGZwcyA9IGdldEZwcygpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgYWt0RnJhbWVSYXRlID0gTWF0aC5mbG9vcigxMDAwIC8gZnBzKTtcclxuXHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoXCJhbmltYXRlXCIsIGZwcyk7XHJcbiAgICAgICAgICAgIHZhciBvYmplY3RzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMub2JqZWN0cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm9iamVjdHNbaV0ubG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0c0xvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzW2ldLmRyYXcodGhpcy5jdHgsIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFtZVJhdGU6IGZwcyxcclxuICAgICAgICAgICAgICAgICAgICBsYXN0VGltZTogX3RpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGltZTogX3RpbWUgKyBha3RGcmFtZVJhdGVcclxuICAgICAgICAgICAgICAgIH0sIGFic1Bvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAob2JqZWN0c0xvYWRlZClcclxuICAgICAgICAgICAgICAgIF9pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmIChfZm9yY2VSZW5kZXIpIHtcclxuICAgICAgICAgICAgICAgIF9mb3JjZVJlbmRlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF90aW1lICs9IGFrdEZyYW1lUmF0ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRXZlbnRzID0ge1xyXG4gICAgYW5pbWF0ZTogXCJhbmltYXRlXCIsXHJcbiAgICBjbGljazogXCJjbGlja1wiLFxyXG4gICAga2V5ZG93bjogXCJrZXlkb3duXCIsXHJcbiAgICBrZXl1cDogXCJrZXl1cFwiLFxyXG4gICAga2V5cHJlc3M6IFwia2V5cHJlc3NcIixcclxuICAgIG1vdXNlbW92ZTogXCJtb3VzZW1vdmVcIixcclxuICAgIG1vdXNlaG92ZXI6IFwibW91c2Vob3ZlclwiLFxyXG4gICAgbW91c2VsZWF2ZTogXCJtb3VzZWxlYXZlXCIsXHJcbiAgICBjb2xsaXNpb246IFwiY29sbGlzaW9uXCIsXHJcbiAgICBvYmplY3RDaGFuZ2VkOiBcIm9iamVjdENoYW5nZWRcIlxyXG59O1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgYmFzZSBjbGFzcyBmb3IgZGlmZmVyZW50IHR5cGUgb2Ygc2hhcGVzXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuT2JqZWN0ID0gaW5qZWN0KFwiRXZlbnREaXNwYXRjaGVyXCIsIFwialF1ZXJ5XCIsIFwiVXRpbHNcIilcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAoZGlzcGF0Y2hlciwgJCwgdXRpbHMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyID0gbmV3IGRpc3BhdGNoZXIoKTtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5pZCA9IHV0aWxzLmdldEd1aWQoKTtcclxuICAgICAgICB0aGlzLnBvcyA9IG5ldyBSZW5kZXJKcy5WZWN0b3Iob3B0aW9ucy54LCBvcHRpb25zLnkpO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IDA7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBvcHRpb25zLmhlaWdodCB8fCAwO1xyXG4gICAgICAgIHRoaXMuYW5nbGUgPSBvcHRpb25zLmFuZ2xlIHx8IDA7XHJcbiAgICAgICAgdGhpcy5zY2FsZVggPSBvcHRpb25zLnNjYWxlWDtcclxuICAgICAgICB0aGlzLnNjYWxlWSA9IG9wdGlvbnMuc2NhbGVZO1xyXG4gICAgICAgIHRoaXMuYmx1clJhZGl1cyA9IG9wdGlvbnMuYmx1clJhZGl1cztcclxuICAgICAgICB0aGlzLmNvbGxpc2lvbiA9IG9wdGlvbnMuY29sbGlzaW9uIHx8IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKlJldHVybnMgd2l0aCB0aGUgY2VudGVyIHBvaW50IG9mIHRoZSBzaGFwZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZ2V0Q2VudGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnBvcy54ICsgKHRoaXMud2lkdGgpIC8gMiwgdGhpcy5wb3MueSArICh0aGlzLmhlaWdodCkgLyAyKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpSZXR1cm5zIHdpdGggdGhlIHJlY3QgYXJvdW5kIHRoZSBzaGFwZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZ2V0Q2VudGVyZWRSZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMucG9zO1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IG8ueCwgeTogby55LCB3aWR0aDogdGhpcy53aWR0aCwgaGVpZ2h0OiB0aGlzLmhlaWdodH07XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEZpbHRlcnMgd2hpY2ggd2lsbCBiZSBhcHBsaWVkIG9uIHRoZSBvYmplY3QoYmx1ciwgZ3JleXNjYWxlIGV0Yy4uLilcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnNldGZpbHRlcnMgPSBmdW5jdGlvbiAoZmlsdGVycykge1xyXG4gICAgICAgICAgICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbiAoZFgsIGRZKSB7XHJcbiAgICAgICAgICAgIHZhciBwcmV2UG9zID0gUmVuZGVySnMuVmVjdG9yLmNsb25lKHRoaXMucG9zLngsIHRoaXMucG9zLnkpO1xyXG4gICAgICAgICAgICB2YXIgbmV3UG9zID0gdGhpcy5wb3MuYWRkKG5ldyBSZW5kZXJKcy5WZWN0b3IoTWF0aC5mbG9vcihkWCksIE1hdGguZmxvb3IoZFkpKSk7XHJcbiAgICAgICAgICAgIHRoaXMucG9zID0gbmV3UG9zO1xyXG4gICAgICAgICAgICBpZiAocHJldlBvcy54ICE9PSBuZXdQb3MueCB8fCBwcmV2UG9zLnkgIT09IG5ld1Bvcy55KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5vYmplY3RDaGFuZ2VkLCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpSb3RhdGUgdGhlIHNoYXBlIHRvIHRoZSBnaXZlbiBkZWdyZWUsIGR1cmluZyB0aGUgdGltZVxyXG4gICAgICAgICAqLWRlZyByb3RhdGlvbiBhbmdsZVxyXG4gICAgICAgICAqLXQgYW5pbWF0aW9uIHRpbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJvdGF0ZVNoYXBlID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5nZXRDZW50ZXIoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShvLngsIG8ueSk7XHJcbiAgICAgICAgICAgIGN0eC5yb3RhdGUodXRpbHMuY29udmVydFRvUmFkKHRoaXMuYW5nbGUpKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSgtby54LCAtby55KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqU2NhbGUgdGhlIHNoYXBlIHdpdGggdGhlIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHQsIGR1cmluZyB0aGUgdGltZVxyXG4gICAgICAgICAqLXdpZHRoIHNjYWxlIGhvcml6b250YWxseSByYXRpbyBpbnRlZ2VyIDEgaXMgMTAwJVxyXG4gICAgICAgICAqLWhlaWdodCBzY2FsZSB2ZXJ0aWNhbGx5IHJhdGlvIGludGVnZXIgMSBpcyAxMDAlXHJcbiAgICAgICAgICotdCBhbmltYXRpb24gdGltZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc2NhbGVTaGFwZSA9IGZ1bmN0aW9uIChjdHgsIHNjYWxlWCwgc2NhbGVZKSB7XHJcbiAgICAgICAgICAgIHZhciBvID0gdGhpcy5nZXRDZW50ZXIoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShvLngsIG8ueSk7XHJcbiAgICAgICAgICAgIGN0eC5zY2FsZShzY2FsZVgsIHNjYWxlWSk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLW8ueCwgLW8ueSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5vbiA9IGZ1bmN0aW9uICh0eXBlLCBoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIGlmICghUmVuZGVySnMuQ2FudmFzLkV2ZW50c1t0eXBlXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BhdGNoZXIuc3Vic2NyaWJlKHR5cGUsIGhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHJpZ2dlciA9IGZ1bmN0aW9uIChldmVudCwgYXJncykge1xyXG4gICAgICAgICAgICBpZiAoIVJlbmRlckpzLkNhbnZhcy5FdmVudHNbZXZlbnRdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLnRyaWdnZXIoZXZlbnQsIGFyZ3MpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgTUNHIG9uIDIwMTUuMDEuMjUuLlxyXG4gKi9cclxudmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblJlbmRlckpzLkNhbnZhcyA9IFJlbmRlckpzLkNhbnZhcyB8fCB7fTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5TcGFjZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLnN0YWdlID0gb3B0aW9ucy5zdGFnZTtcclxuICAgIH07XHJcbiAgICBfaW5pdChvcHRpb25zKTtcclxufSIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLlN0YWdlID0gaW5qZWN0KFwiVXRpbHNcIiwgXCJFdmVudERpc3BhdGNoZXJcIiwgXCJMaW5rZWRMaXN0XCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBkaXNwYXRjaGVyLCBsaW5rZWRMaXN0LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBfY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXIgfHwgXCJ2aWV3cG9ydFwiO1xyXG4gICAgICAgIHZhciBfZGlzcGF0Y2hlciA9IG5ldyBkaXNwYXRjaGVyKCk7XHJcbiAgICAgICAgdGhpcy5sYXllcnMgPSBuZXcgbGlua2VkTGlzdCgpO1xyXG5cclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFJlbmRlckpzLlZlY3RvcigtNTAsIC01MCk7XHJcblxyXG4gICAgICAgIHZhciBfaW52YWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIGVudW1lcmF0b3IgPSB0aGlzLmxheWVycy5nZXRFbnVtZXJhdG9yKCk7XHJcbiAgICAgICAgICAgIHdoaWxlIChlbnVtZXJhdG9yLm5leHQoKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBlbnVtZXJhdG9yLmN1cnJlbnQoKS5kcmF3T2JqZWN0cyh0aGlzLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIF9pbnZhbGlkYXRlLmNhbGwoc2VsZik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgX2ludmFsaWRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNpemUgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChfY29udGFpbmVyKS5zdHlsZS53aWR0aCA9IHRoaXMud2lkdGggKyBcInB4XCI7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9jb250YWluZXIpLnN0eWxlLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgXCJweFwiO1xyXG4gICAgICAgICAgICB2YXIgZW51bWVyYXRvciA9IHRoaXMubGF5ZXJzLmdldEVudW1lcmF0b3IoKTtcclxuICAgICAgICAgICAgd2hpbGUgKGVudW1lcmF0b3IubmV4dCgpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGVudW1lcmF0b3IuY3VycmVudCgpLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMub25JbnZhbGlkYXRlID0gZnVuY3Rpb24gKGhhbmRsZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF9kaXNwYXRjaGVyLnN1YnNjcmliZShcIm9uSW52YWxpZGF0ZVwiLCBoYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZUxheWVyID0gZnVuY3Rpb24gKGFjdGl2ZSkge1xyXG4gICAgICAgICAgICB2YXIgbGF5ZXIgPSBuZXcgUmVuZGVySnMuQ2FudmFzLkxheWVyKF9jb250YWluZXIsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBhY3RpdmUpO1xyXG4gICAgICAgICAgICB0aGlzLmxheWVycy5hcHBlbmQobGF5ZXIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGxheWVyO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucmVzaXplKG9wdGlvbnMud2lkdGggfHwgMTIwMCwgb3B0aW9ucy5oZWlnaHQgfHwgODAwKTtcclxuICAgIH0pOyIsInZhciBSZW5kZXJKcyA9IFJlbmRlckpzIHx8IHt9O1xyXG5SZW5kZXJKcy5DYW52YXMgPSBSZW5kZXJKcy5DYW52YXMgfHwge307XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncyA9IFJlbmRlckpzLkNhbnZhcy5FYXNpbmdzIHx8IHt9O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuQm91bmNlRWFzZU91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICBpZiAoKHQgLz0gZCkgPCAoMSAvIDIuNzUpKSB7XHJcbiAgICAgICAgcmV0dXJuIGMgKiAoNy41NjI1ICogdCAqIHQpICsgYjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHQgPCAoMiAvIDIuNzUpKSB7XHJcbiAgICAgICAgcmV0dXJuIGMgKiAoNy41NjI1ICogKHQgLT0gKDEuNSAvIDIuNzUpKSAqIHQgKyAwLjc1KSArIGI7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0IDwgKDIuNSAvIDIuNzUpKSB7XHJcbiAgICAgICAgcmV0dXJuIGMgKiAoNy41NjI1ICogKHQgLT0gKDIuMjUgLyAyLjc1KSkgKiB0ICsgMC45Mzc1KSArIGI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gYyAqICg3LjU2MjUgKiAodCAtPSAoMi42MjUgLyAyLjc1KSkgKiB0ICsgMC45ODQzNzUpICsgYjtcclxuICAgIH1cclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkJvdW5jZUVhc2VJbiA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICByZXR1cm4gYyAtIEtpbmV0aWMuRWFzaW5ncy5Cb3VuY2VFYXNlT3V0KGQgLSB0LCAwLCBjLCBkKSArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5Cb3VuY2VFYXNlSW5PdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgaWYgKHQgPCBkIC8gMikge1xyXG4gICAgICAgIHJldHVybiBLaW5ldGljLkVhc2luZ3MuQm91bmNlRWFzZUluKHQgKiAyLCAwLCBjLCBkKSAqIDAuNSArIGI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gS2luZXRpYy5FYXNpbmdzLkJvdW5jZUVhc2VPdXQodCAqIDIgLSBkLCAwLCBjLCBkKSAqIDAuNSArIGMgKiAwLjUgKyBiO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWFzZUluID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIHJldHVybiBjICogKHQgLz0gZCkgKiB0ICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVhc2VPdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgcmV0dXJuIC1jICogKHQgLz0gZCkgKiAodCAtIDIpICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVhc2VJbk91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICBpZiAoKHQgLz0gZCAvIDIpIDwgMSkge1xyXG4gICAgICAgIHJldHVybiBjIC8gMiAqIHQgKiB0ICsgYjtcclxuICAgIH1cclxuICAgIHJldHVybiAtYyAvIDIgKiAoKC0tdCkgKiAodCAtIDIpIC0gMSkgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWxhc3RpY0Vhc2VJbiA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkLCBhLCBwKSB7XHJcbiAgICAvLyBhZGRlZCBzID0gMFxyXG4gICAgdmFyIHMgPSAwO1xyXG4gICAgaWYgKHQgPT09IDApIHtcclxuICAgICAgICByZXR1cm4gYjtcclxuICAgIH1cclxuICAgIGlmICgodCAvPSBkKSA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiBiICsgYztcclxuICAgIH1cclxuICAgIGlmICghcCkge1xyXG4gICAgICAgIHAgPSBkICogMC4zO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhIHx8IGEgPCBNYXRoLmFicyhjKSkge1xyXG4gICAgICAgIGEgPSBjO1xyXG4gICAgICAgIHMgPSBwIC8gNDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbihjIC8gYSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gLShhICogTWF0aC5wb3coMiwgMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIGQgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSkgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWxhc3RpY0Vhc2VPdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCwgYSwgcCkge1xyXG4gICAgLy8gYWRkZWQgcyA9IDBcclxuICAgIHZhciBzID0gMDtcclxuICAgIGlmICh0ID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGI7XHJcbiAgICB9XHJcbiAgICBpZiAoKHQgLz0gZCAvIDIpID09PSAyKSB7XHJcbiAgICAgICAgcmV0dXJuIGIgKyBjO1xyXG4gICAgfVxyXG4gICAgaWYgKCFwKSB7XHJcbiAgICAgICAgcCA9IGQgKiAoMC4zICogMS41KTtcclxuICAgIH1cclxuICAgIGlmICghYSB8fCBhIDwgTWF0aC5hYnMoYykpIHtcclxuICAgICAgICBhID0gYztcclxuICAgICAgICBzID0gcCAvIDQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBzID0gcCAvICgyICogTWF0aC5QSSkgKiBNYXRoLmFzaW4oYyAvIGEpO1xyXG4gICAgfVxyXG4gICAgaWYgKHQgPCAxKSB7XHJcbiAgICAgICAgcmV0dXJuIC0wLjUgKiAoYSAqIE1hdGgucG93KDIsIDEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiBkIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpICsgYjtcclxuICAgIH1cclxuICAgIHJldHVybiBhICogTWF0aC5wb3coMiwgLTEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiBkIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkgKiAwLjUgKyBjICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkVsYXN0aWNFYXNlSW5PdXQgPSBmdW5jdGlvbiAodCwgYiwgYywgZCwgYSwgcCkge1xyXG4gICAgLy8gYWRkZWQgcyA9IDBcclxuICAgIHZhciBzID0gMDtcclxuICAgIGlmICh0ID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGI7XHJcbiAgICB9XHJcbiAgICBpZiAoKHQgLz0gZCAvIDIpID09PSAyKSB7XHJcbiAgICAgICAgcmV0dXJuIGIgKyBjO1xyXG4gICAgfVxyXG4gICAgaWYgKCFwKSB7XHJcbiAgICAgICAgcCA9IGQgKiAoMC4zICogMS41KTtcclxuICAgIH1cclxuICAgIGlmICghYSB8fCBhIDwgTWF0aC5hYnMoYykpIHtcclxuICAgICAgICBhID0gYztcclxuICAgICAgICBzID0gcCAvIDQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBzID0gcCAvICgyICogTWF0aC5QSSkgKiBNYXRoLmFzaW4oYyAvIGEpO1xyXG4gICAgfVxyXG4gICAgaWYgKHQgPCAxKSB7XHJcbiAgICAgICAgcmV0dXJuIC0wLjUgKiAoYSAqIE1hdGgucG93KDIsIDEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiBkIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpICsgYjtcclxuICAgIH1cclxuICAgIHJldHVybiBhICogTWF0aC5wb3coMiwgLTEwICogKHQgLT0gMSkpICogTWF0aC5zaW4oKHQgKiBkIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkgKiAwLjUgKyBjICsgYjtcclxufTtcclxuXHJcblxyXG5cclxuUmVuZGVySnMuQ2FudmFzLlRyYW5zaXRpb24gPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciByZXZlcnNlID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy5kdXJhdGlvbiA9IG9wdGlvbnMuZHVyYXRpb24gKiAxMDAwIHx8IDEwMDA7XHJcblxyXG4gICAgdGhpcy5zaGFwZSA9IG9wdGlvbnMuc2hhcGU7XHJcblxyXG4gICAgdGhpcy5wcm9wcyA9IG9wdGlvbnMucHJvcHMgfHwge307XHJcbiAgICB0aGlzLm9yaWdQcm9wcyA9IHt9O1xyXG4gICAgZm9yICh2YXIgcHJvcCBpbiBvcHRpb25zLnByb3BzKSB7XHJcbiAgICAgICAgdGhpcy5vcmlnUHJvcHNbcHJvcF0gPSB0aGlzLnNoYXBlW3Byb3BdO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFzaW5nID0gb3B0aW9ucy5lYXNpbmcgfHwgUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWFzZUluT3V0O1xyXG5cclxuICAgIHZhciBhbmltYXRpb24gPSBuZXcgUmVuZGVySnMuQ2FudmFzLkFuaW1hdGlvbihmdW5jdGlvbiAoZnJhbWUpIHtcclxuICAgICAgICBpZiAoZnJhbWUudGltZSA+PSBzZWxmLmR1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbi5zdG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc2VsZi5wcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocmV2ZXJzZSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zaGFwZVtwcm9wXSA9IHNlbGYuZWFzaW5nKGZyYW1lLnRpbWUsIHNlbGYub3JpZ1Byb3BzW3Byb3BdICsgc2VsZi5wcm9wc1twcm9wXSwgc2VsZi5wcm9wc1twcm9wXSAqIC0xLCBzZWxmLmR1cmF0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2hhcGVbcHJvcF0gPSBzZWxmLmVhc2luZyhmcmFtZS50aW1lLCBzZWxmLm9yaWdQcm9wc1twcm9wXSwgc2VsZi5wcm9wc1twcm9wXSwgc2VsZi5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfSwgdGhpcy5zaGFwZS5sYXllcik7XHJcblxyXG4gICAgdGhpcy5wbGF5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFuaW1hdGlvbi5zdGFydCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFuaW1hdGlvbi5wYXVzZSgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYW5pbWF0aW9uLnN0b3AoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZXZlcnNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldmVyc2UgPSB0cnVlO1xyXG4gICAgICAgIGFuaW1hdGlvbi5zdGFydCgpO1xyXG4gICAgfTtcclxufSIsInZhciBSZW5kZXJKcyA9IFJlbmRlckpzIHx8IHt9O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yID0gZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgIHRoaXMueCA9IHggfHwgMDtcclxuICAgIHRoaXMueSA9IHkgfHwgMDtcclxuXHJcbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgdGhpcy54ID0gdi54O1xyXG4gICAgICAgIHRoaXMueSA9IHYueTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5sZW5ndGhTcXVhcmVkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBNYXRoLnBvdyh0aGlzLngsIDIpICsgTWF0aC5wb3codGhpcy55LCAyKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmxlbmd0aFNxdWFyZWQoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubGVuZ3RoMiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kb3QodGhpcyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucGVycCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnksIC10aGlzLngpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNjYWxlID0gZnVuY3Rpb24gKHMpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnggKiBzLCB0aGlzLnkgKiBzKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zdWIgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgUmVuZGVySnMuVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueCAtIHYueCwgdGhpcy55IC0gdi55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueCAtIHYsIHRoaXMueSAtIHYpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGQgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgUmVuZGVySnMuVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueCArIHYueCwgdGhpcy55ICsgdi55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueCArIHYsIHRoaXMueSArIHYpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5kb3QgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2Lnk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZGlzdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ViKHYpLmxlbmd0aCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zY2FsZSgxIC8gdGhpcy5sZW5ndGgoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYW5nbGUgPSBmdW5jdGlvbiAodikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRvdCh2KSAvICh0aGlzLmxlbmd0aCgpICogdi5sZW5ndGgoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudHJ1bmNhdGUgPSBmdW5jdGlvbiAobWF4KSB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWluKG1heCwgdGhpcy5sZW5ndGgoKSk7XHJcbiAgICAgICAgcmV0dXJuIGxlbmd0aDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUpIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMueDtcclxuICAgICAgICB2YXIgeSA9IHRoaXMueTtcclxuICAgICAgICB0aGlzLnggPSB4ICogIE1hdGguY29zKFV0aWxzLmNvbnZlcnRUb1JhZChhbmdsZSkpIC0geSAqIE1hdGguc2luKFV0aWxzLmNvbnZlcnRUb1JhZChhbmdsZSkpO1xyXG4gICAgICAgIHRoaXMueSA9IHkgKiAgTWF0aC5jb3MoVXRpbHMuY29udmVydFRvUmFkKGFuZ2xlKSkgKyB4ICogTWF0aC5zaW4oVXRpbHMuY29udmVydFRvUmFkKGFuZ2xlKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAocm91bmRlZCkge1xyXG4gICAgICAgIGlmIChyb3VuZGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIihcIiArIE1hdGgucm91bmQodGhpcy54KSArIFwiLCBcIiArIE1hdGgucm91bmQodGhpcy55KSArIFwiKVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiKFwiICsgdGhpcy54ICsgXCIsIFwiICsgdGhpcy55ICsgXCIpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IuY2xvbmUgPSBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IoeCwgeSk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHRoZSBhcmVhIG9mIGEgdHJpYW5nbGUgc3Bhbm5lZCBieSB0aGUgdGhyZWUgZ2l2ZW4gcG9pbnRzLiBOb3RlIHRoYXQgdGhlIGFyZWEgd2lsbCBiZSBuZWdhdGl2ZSBpZiB0aGUgcG9pbnRzIGFyZSBub3QgZ2l2ZW4gaW4gY291bnRlci1jbG9ja3dpc2Ugb3JkZXIuXHJcbiAqIEBzdGF0aWNcclxuICogQG1ldGhvZCBhcmVhXHJcbiAqIEBwYXJhbSAge0FycmF5fSBhXHJcbiAqIEBwYXJhbSAge0FycmF5fSBiXHJcbiAqIEBwYXJhbSAge0FycmF5fSBjXHJcbiAqIEByZXR1cm4ge051bWJlcn1cclxuICovXHJcblJlbmRlckpzLlZlY3Rvci5hcmVhID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHJldHVybiAoKChiLnggLSBhLngpICogKGMueSAtIGEueSkpIC0gKChjLnggLSBhLngpICogKGIueSAtIGEueSkpKTtcclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5sZWZ0ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuYXJlYShhLCBiLCBjKSA+IDA7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IubGVmdE9uID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuYXJlYShhLCBiLCBjKSA+PSAwO1xyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLnJpZ2h0ID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuYXJlYShhLCBiLCBjKSA8IDA7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IucmlnaHRPbiA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7XHJcbiAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmFyZWEoYSwgYiwgYykgPD0gMDtcclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5zcWRpc3QgPSBmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgdmFyIGR4ID0gYi54IC0gYS54O1xyXG4gICAgdmFyIGR5ID0gYi55IC0gYS55O1xyXG4gICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG59O1xyXG5cclxuZnVuY3Rpb24gU2NhbGFyKCkge1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2sgaWYgdHdvIHNjYWxhcnMgYXJlIGVxdWFsXHJcbiAqIEBzdGF0aWNcclxuICogQG1ldGhvZCBlcVxyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGFcclxuICogQHBhcmFtICB7TnVtYmVyfSBiXHJcbiAqIEBwYXJhbSAge051bWJlcn0gW3ByZWNpc2lvbl1cclxuICogQHJldHVybiB7Qm9vbGVhbn1cclxuICovXHJcblNjYWxhci5lcSA9IGZ1bmN0aW9uIChhLCBiLCBwcmVjaXNpb24pIHtcclxuICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiB8fCAwO1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKGEgLSBiKSA8IHByZWNpc2lvbjtcclxufTsiLCJ2YXIgUmVuZGVySnMgPSBSZW5kZXJKcyB8fCB7fTtcclxuUmVuZGVySnMuUGh5c2ljcyA9IFJlbmRlckpzLlBoeXNpY3MgfHwge307XHJcblxyXG5SZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIHZhciBfcmF5Q2FzdGluZ0FsZyA9IGZ1bmN0aW9uIChwLCBlZGdlKSB7XHJcbiAgICAgICAgJ3Rha2VzIGEgcG9pbnQgcD1QdCgpIGFuZCBhbiBlZGdlIG9mIHR3byBlbmRwb2ludHMgYSxiPVB0KCkgb2YgYSBsaW5lIHNlZ21lbnQgcmV0dXJucyBib29sZWFuJztcclxuICAgICAgICB2YXIgX2VwcyA9IDAuMDAwMDE7XHJcbiAgICAgICAgdmFyIF9odWdlID0gTnVtYmVyLk1BWF9WQUxVRTtcclxuICAgICAgICB2YXIgX3RpbnkgPSBOdW1iZXIuTUlOX1ZBTFVFO1xyXG4gICAgICAgIHZhciBtX2JsdWUsIG1fcmVkID0gMDtcclxuICAgICAgICB2YXIgYSA9IGVkZ2UucDE7XHJcbiAgICAgICAgdmFyIGIgPSBlZGdlLnAyO1xyXG5cclxuICAgICAgICBpZiAoYS55ID4gYi55KSB7XHJcbiAgICAgICAgICAgIGEuc2V0KGIpO1xyXG4gICAgICAgICAgICBiLnNldChhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHAueSA9PSBhLnkgfHwgcC55ID09IGIueSlcclxuICAgICAgICAgICAgcC55ICs9IF9lcHM7XHJcblxyXG4gICAgICAgIHZhciBpbnRlcnNlY3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKChwLnkgPiBiLnkgfHwgcC55IDwgYS55KSB8fCAocC54ID4gTWF0aC5tYXgoYS54LCBiLngpKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAocC54IDwgTWF0aC5taW4oYS54LCBiLngpKVxyXG4gICAgICAgICAgICBpbnRlcnNlY3QgPSB0cnVlO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYS54IC0gYi54KSA+IF90aW55KVxyXG4gICAgICAgICAgICAgICAgbV9yZWQgPSAoYi55IC0gYS55KSAvIChiLnggLSBhLngpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBtX3JlZCA9IF9odWdlO1xyXG5cclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGEueCAtIHAueCkgPiBfdGlueSlcclxuICAgICAgICAgICAgICAgIG1fYmx1ZSA9IChwLnkgLSBhLnkpIC8gKHAueCAtIGEueCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIG1fYmx1ZSA9IF9odWdlXHJcbiAgICAgICAgICAgIGludGVyc2VjdCA9IG1fYmx1ZSA+PSBtX3JlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnRlcnNlY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF92b3Jub2lSZWdpb24gPSBmdW5jdGlvbiAobGluZSwgcG9pbnQpIHtcclxuICAgICAgICB2YXIgbGVuMiA9IGxpbmUubGVuZ3RoMigpO1xyXG4gICAgICAgIHZhciBkcCA9IHBvaW50LmRvdChsaW5lKTtcclxuICAgICAgICAvLyBJZiB0aGUgcG9pbnQgaXMgYmV5b25kIHRoZSBzdGFydCBvZiB0aGUgbGluZSwgaXQgaXMgaW4gdGhlXHJcbiAgICAgICAgLy8gbGVmdCB2b3Jub2kgcmVnaW9uLlxyXG4gICAgICAgIGlmIChkcCA8IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBJZiB0aGUgcG9pbnQgaXMgYmV5b25kIHRoZSBlbmQgb2YgdGhlIGxpbmUsIGl0IGlzIGluIHRoZVxyXG4gICAgICAgIC8vIHJpZ2h0IHZvcm5vaSByZWdpb24uXHJcbiAgICAgICAgZWxzZSBpZiAoZHAgPiBsZW4yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBPdGhlcndpc2UsIGl0J3MgaW4gdGhlIG1pZGRsZSBvbmUuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3BvaW50SW5Qb2x5Z29uID0gZnVuY3Rpb24gKHAsIHBvbHlnb24pIHtcclxuICAgICAgICB2YXIgcmVzID0gZmFsc2U7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2x5Z29uLnJFZGdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoX3JheUNhc3RpbmdBbGcocCwgcG9seWdvbi5yRWRnZXNbaV0pKVxyXG4gICAgICAgICAgICAgICAgcmVzID0gIXJlcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3BvaW50SW5MaW5lID0gZnVuY3Rpb24gKHAsIGxpbmUpIHtcclxuICAgICAgICB2YXIgbSA9IChsaW5lLnBvczIueSAtIGxpbmUucG9zLnkpIC8gKGxpbmUucG9zMi54IC0gbGluZS5wb3MueCk7XHJcblxyXG4gICAgICAgIHJldHVybiBwLnkgLSBsaW5lLnBvcy55ID09IG0gKiAocC54IC0gbGluZS5wb3MueSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9wb2ludEluQ2lyY2xlID0gZnVuY3Rpb24gKHAsIGMpIHtcclxuICAgICAgICBvID0gYy5nZXRDZW50ZXIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KHAueCAtIG8ueCwgMikgKyBNYXRoLnBvdyhwLnkgLSBvLnksIDIpIDw9IE1hdGgucG93KCh0aGlzLndpZHRoIC8gMiksIDIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcmVjdFZzUmVjdCA9IGZ1bmN0aW9uIChyMSwgcjIpIHtcclxuICAgICAgICB2YXIgdHcgPSByMS53aWR0aDtcclxuICAgICAgICB2YXIgdGggPSByMS5oZWlnaHQ7XHJcbiAgICAgICAgdmFyIHJ3ID0gcjIud2lkdGg7XHJcbiAgICAgICAgdmFyIHJoID0gcjIuaGVpZ2h0O1xyXG4gICAgICAgIGlmIChydyA8PSAwIHx8IHJoIDw9IDAgfHwgdHcgPD0gMCB8fCB0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHR4ID0gcjEueDtcclxuICAgICAgICB2YXIgdHkgPSByMS55O1xyXG4gICAgICAgIHZhciByeCA9IHIyLng7XHJcbiAgICAgICAgdmFyIHJ5ID0gcjIueTtcclxuICAgICAgICBydyArPSByeDtcclxuICAgICAgICByaCArPSByeTtcclxuICAgICAgICB0dyArPSB0eDtcclxuICAgICAgICB0aCArPSB0eTtcclxuICAgICAgICAvL292ZXJmbG93IHx8IGludGVyc2VjdFxyXG4gICAgICAgIHJldHVybiAoKHJ3IDwgcnggfHwgcncgPiB0eCkgJiZcclxuICAgICAgICAocmggPCByeSB8fCByaCA+IHR5KSAmJlxyXG4gICAgICAgICh0dyA8IHR4IHx8IHR3ID4gcngpICYmXHJcbiAgICAgICAgKHRoIDwgdHkgfHwgdGggPiByeSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcmVjdFZzQ2lyY2xlID0gZnVuY3Rpb24gKHIsIGMpIHtcclxuICAgICAgICByZXR1cm4gX3BvaW50SW5SZWN0YW5nbGUoYy5nZXRDZW50ZXIoKSwgcikgfHxcclxuICAgICAgICAgICAgX2xpbmVWc0NpcmNsZShyLnRvcEVkZ2UoKSwgYykgfHxcclxuICAgICAgICAgICAgX2xpbmVWc0NpcmNsZShyLnJpZ2h0RWRnZSgpLCBjKSB8fFxyXG4gICAgICAgICAgICBfbGluZVZzQ2lyY2xlKHIuYm90dG9tRWRnZSgpLCBjKSB8fFxyXG4gICAgICAgICAgICBfbGluZVZzQ2lyY2xlKHIubGVmdEVkZ2UoKSwgYyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9saW5lVnNDaXJjbGUgPSBmdW5jdGlvbiAobCwgYykge1xyXG4gICAgICAgIHZhciBjbyA9IGMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgdmFyIHIgPSBjLnJhZGl1cztcclxuICAgICAgICB2YXIgZCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IobC5wb3MyLnggLSBsLnBvcy54LCBsLnBvczIueSAtIGwucG9zLnkpO1xyXG4gICAgICAgIHZhciBmID0gbmV3IFJlbmRlckpzLlZlY3RvcihsLnBvcy54IC0gY28ueCwgbC5wb3MueSAtIGNvLnkpO1xyXG5cclxuICAgICAgICB2YXIgYSA9IGQuZG90KGQpO1xyXG4gICAgICAgIHZhciBiID0gMiAqIGYuZG90KGQpO1xyXG4gICAgICAgIHZhciBjID0gZi5kb3QoZikgLSByICogcjtcclxuXHJcbiAgICAgICAgdmFyIGRpc2NyaW1pbmFudCA9IGIgKiBiIC0gNCAqIGEgKiBjO1xyXG5cclxuICAgICAgICBpZiAoZGlzY3JpbWluYW50IDwgMCkge1xyXG4gICAgICAgICAgICAvLyBubyBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gcmF5IGRpZG4ndCB0b3RhbGx5IG1pc3Mgc3BoZXJlLFxyXG4gICAgICAgICAgICAvLyBzbyB0aGVyZSBpcyBhIHNvbHV0aW9uIHRvXHJcbiAgICAgICAgICAgIC8vIHRoZSBlcXVhdGlvbi5cclxuXHJcbiAgICAgICAgICAgIGRpc2NyaW1pbmFudCA9IE1hdGguc3FydChkaXNjcmltaW5hbnQpO1xyXG5cclxuICAgICAgICAgICAgLy8gZWl0aGVyIHNvbHV0aW9uIG1heSBiZSBvbiBvciBvZmYgdGhlIHJheSBzbyBuZWVkIHRvIHRlc3QgYm90aFxyXG4gICAgICAgICAgICAvLyB0MSBpcyBhbHdheXMgdGhlIHNtYWxsZXIgdmFsdWUsIGJlY2F1c2UgQk9USCBkaXNjcmltaW5hbnQgYW5kXHJcbiAgICAgICAgICAgIC8vIGEgYXJlIG5vbm5lZ2F0aXZlLlxyXG4gICAgICAgICAgICB2YXIgdDEgPSAoLWIgLSBkaXNjcmltaW5hbnQpIC8gKDIgKiBhKTtcclxuICAgICAgICAgICAgdmFyIHQyID0gKC1iICsgZGlzY3JpbWluYW50KSAvICgyICogYSk7XHJcblxyXG4gICAgICAgICAgICAvLyAzeCBISVQgY2FzZXM6XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgIC1vLT4gICAgICAgICAgICAgLS18LS0+ICB8ICAgICAgICAgICAgfCAgLS18LT5cclxuICAgICAgICAgICAgLy8gSW1wYWxlKHQxIGhpdCx0MiBoaXQpLCBQb2tlKHQxIGhpdCx0Mj4xKSwgRXhpdFdvdW5kKHQxPDAsIHQyIGhpdCksIFxyXG5cclxuICAgICAgICAgICAgLy8gM3ggTUlTUyBjYXNlczpcclxuICAgICAgICAgICAgLy8gICAgICAgLT4gIG8gICAgICAgICAgICAgICAgICAgICBvIC0+ICAgICAgICAgICAgICB8IC0+IHxcclxuICAgICAgICAgICAgLy8gRmFsbFNob3J0ICh0MT4xLHQyPjEpLCBQYXN0ICh0MTwwLHQyPDApLCBDb21wbGV0ZWx5SW5zaWRlKHQxPDAsIHQyPjEpXHJcblxyXG4gICAgICAgICAgICBpZiAodDEgPj0gMCAmJiB0MSA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0MSBpcyB0aGUgaW50ZXJzZWN0aW9uLCBhbmQgaXQncyBjbG9zZXIgdGhhbiB0MlxyXG4gICAgICAgICAgICAgICAgLy8gKHNpbmNlIHQxIHVzZXMgLWIgLSBkaXNjcmltaW5hbnQpXHJcbiAgICAgICAgICAgICAgICAvLyBJbXBhbGUsIFBva2VcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBoZXJlIHQxIGRpZG4ndCBpbnRlcnNlY3Qgc28gd2UgYXJlIGVpdGhlciBzdGFydGVkXHJcbiAgICAgICAgICAgIC8vIGluc2lkZSB0aGUgc3BoZXJlIG9yIGNvbXBsZXRlbHkgcGFzdCBpdFxyXG4gICAgICAgICAgICBpZiAodDIgPj0gMCAmJiB0MiA8PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBFeGl0V291bmRcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBubyBpbnRuOiBGYWxsU2hvcnQsIFBhc3QsIENvbXBsZXRlbHlJbnNpZGVcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgX2NpcmNsZVZzQ2lyY2xlID0gZnVuY3Rpb24gKGMxLCBjMikge1xyXG4gICAgICAgIHZhciB2ZWxvY2l0eSA9IGMyLnY7XHJcbiAgICAgICAgLy9hZGQgYm90aCByYWRpaSB0b2dldGhlciB0byBnZXQgdGhlIGNvbGxpZGluZyBkaXN0YW5jZVxyXG4gICAgICAgIHZhciB0b3RhbFJhZGl1cyA9IGMxLnJhZGl1cyArIGMyLnJhZGl1cztcclxuICAgICAgICAvL2ZpbmQgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHR3byBjaXJjbGVzIHVzaW5nIFB5dGhhZ29yZWFuIHRoZW9yZW0uIE5vIHNxdWFyZSByb290cyBmb3Igb3B0aW1pemF0aW9uXHJcbiAgICAgICAgdmFyIGRpc3RhbmNlU3F1YXJlZCA9IChjMS5wb3MueCAtIGMyLnBvcy54KSAqIChjMS5wb3MueCAtIGMyLnBvcy54KSArIChjMS5wb3MueSAtIGMyLnBvcy55KSAqIChjMS5wb3MueSAtIGMyLnBvcy55KTtcclxuICAgICAgICAvL2lmIHlvdXIgZGlzdGFuY2UgaXMgbGVzcyB0aGFuIHRoZSB0b3RhbFJhZGl1cyBzcXVhcmUoYmVjYXVzZSBkaXN0YW5jZSBpcyBzcXVhcmVkKVxyXG4gICAgICAgIGlmIChkaXN0YW5jZVNxdWFyZWQgPCB0b3RhbFJhZGl1cyAqIHRvdGFsUmFkaXVzKSB7XHJcbiAgICAgICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkaXN0YW5jZVNxdWFyZWQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNlcGFyYXRpb24gPSB0b3RhbFJhZGl1cyAtIGRpc3RhbmNlO1xyXG4gICAgICAgICAgICB2YXIgdW5pdFZlY3RvciA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoYzEucG9zLnN1YihjMi5wb3MpLnggLyBkaXN0YW5jZSwgYzEucG9zLnN1YihjMi5wb3MpLnkgLyBkaXN0YW5jZSk7XHJcbiAgICAgICAgICAgIHZhciBkaWZmViA9IGMyLnBvcy5zdWIoYzEucG9zKTtcclxuXHJcbiAgICAgICAgICAgIC8vZmluZCB0aGUgbW92ZW1lbnQgbmVlZGVkIHRvIHNlcGFyYXRlIHRoZSBjaXJjbGVzXHJcbiAgICAgICAgICAgIHJldHVybiB2ZWxvY2l0eS5hZGQodW5pdFZlY3Rvci5zY2FsZShzZXBhcmF0aW9uIC8gMikpOy8vbmV3IFJlbmRlckpzLlZlY3RvcigoYzIucG9zLnggLSBjMS5wb3MueCkgKiBkaWZmZXJlbmNlLCAoYzIucG9zLnkgLSBjMS5wb3MueSkgKiBkaWZmZXJlbmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7IC8vbm8gY29sbGlzaW9uLCByZXR1cm4gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIHZhciBfY2lyY2xlVnNQb2x5Z29uID0gZnVuY3Rpb24gKGNpcmNsZSwgcG9seWdvbikge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcG9zaXRpb24gb2YgdGhlIGNpcmNsZSByZWxhdGl2ZSB0byB0aGUgcG9seWdvbi5cclxuICAgICAgICB2YXIgY2lyY2xlUG9zID0gY2lyY2xlLnBvcy5zdWIocG9seWdvbi5wb3MpO1xyXG4gICAgICAgIHZhciByYWRpdXMgPSBjaXJjbGUucmFkaXVzO1xyXG4gICAgICAgIHZhciByYWRpdXMyID0gcmFkaXVzICogcmFkaXVzO1xyXG4gICAgICAgIHZhciBwb2ludHMgPSBwb2x5Z29uLnZlcnRpY2VzLnNsaWNlKCk7XHJcbiAgICAgICAgdmFyIGxlbiA9IHBvaW50cy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApO1xyXG4gICAgICAgIHZhciBwb2ludCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCk7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xyXG4gICAgICAgICAgICBvdmVybGFwOiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICBvdmVybGFwTjogbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKSxcclxuICAgICAgICAgICAgb3ZlcmxhcFY6IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMClcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEZvciBlYWNoIGVkZ2UgaW4gdGhlIHBvbHlnb246XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbmV4dCA9IGkgPT09IGxlbiAtIDEgPyAwIDogaSArIDE7XHJcbiAgICAgICAgICAgIHZhciBwcmV2ID0gaSA9PT0gMCA/IGxlbiAtIDEgOiBpIC0gMTtcclxuICAgICAgICAgICAgdmFyIG92ZXJsYXAgPSAwO1xyXG4gICAgICAgICAgICB2YXIgb3ZlcmxhcE4gPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSBlZGdlLlxyXG4gICAgICAgICAgICBlZGdlLnNldChwb2x5Z29uLnZlcnRpY2VzW2ldKTtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSByZWxhdGl2ZSB0byB0aGUgc3RhcnRpbmcgcG9pbnQgb2YgdGhlIGVkZ2UuXHJcbiAgICAgICAgICAgIHBvaW50LnNldChjaXJjbGVQb3MpO1xyXG4gICAgICAgICAgICBwb2ludC5zZXQocG9pbnQuc3ViKHBvaW50c1tpXSkpO1xyXG4gICAgICAgICAgICAvLyBJZiB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgYW5kIHRoZSBwb2ludFxyXG4gICAgICAgICAgICAvLyBpcyBiaWdnZXIgdGhhbiB0aGUgcmFkaXVzLCB0aGUgcG9seWdvbiBpcyBkZWZpbml0ZWx5IG5vdCBmdWxseSBpblxyXG4gICAgICAgICAgICAvLyB0aGUgY2lyY2xlLlxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcG9pbnQubGVuZ3RoMigpID4gcmFkaXVzMikge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VbJ2FJbkInXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgd2hpY2ggVm9ybm9pIHJlZ2lvbiB0aGUgY2VudGVyIG9mIHRoZSBjaXJjbGUgaXMgaW4uXHJcbiAgICAgICAgICAgIHZhciByZWdpb24gPSBfdm9ybm9pUmVnaW9uKGVkZ2UsIHBvaW50KTtcclxuICAgICAgICAgICAgLy8gSWYgaXQncyB0aGUgbGVmdCByZWdpb246XHJcbiAgICAgICAgICAgIGlmIChyZWdpb24gPT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSdyZSBpbiB0aGUgUklHSFRfVk9STk9JX1JFR0lPTiBvZiB0aGUgcHJldmlvdXMgZWRnZS5cclxuICAgICAgICAgICAgICAgIGVkZ2Uuc2V0KHBvbHlnb24uZWRnZXNbcHJldl0pO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSByZWxhdGl2ZSB0aGUgc3RhcnRpbmcgcG9pbnQgb2YgdGhlIHByZXZpb3VzIGVkZ2VcclxuICAgICAgICAgICAgICAgIHZhciBwb2ludDIgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLnNldChjaXJjbGVQb3MpLnN1Yihwb2ludHNbcHJldl0pO1xyXG4gICAgICAgICAgICAgICAgcmVnaW9uID0gX3Zvcm5vaVJlZ2lvbihlZGdlLCBwb2ludDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZ2lvbiA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgaW4gdGhlIHJlZ2lvbiB3ZSB3YW50LiAgQ2hlY2sgaWYgdGhlIGNpcmNsZSBpbnRlcnNlY3RzIHRoZSBwb2ludC5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlzdCA9IHBvaW50Lmxlbmd0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXN0ID4gcmFkaXVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCBpbnRlcnNlY3RzLCBjYWxjdWxhdGUgdGhlIG92ZXJsYXAuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlWydiSW5BJ10gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcE4gPSBwb2ludC5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcCA9IHJhZGl1cyAtIGRpc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gSWYgaXQncyB0aGUgcmlnaHQgcmVnaW9uOlxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlZ2lvbiA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgd2UncmUgaW4gdGhlIGxlZnQgcmVnaW9uIG9uIHRoZSBuZXh0IGVkZ2VcclxuICAgICAgICAgICAgICAgIGVkZ2Uuc2V0KHBvbHlnb24uZWRnZXNbbmV4dF0pO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSByZWxhdGl2ZSB0byB0aGUgc3RhcnRpbmcgcG9pbnQgb2YgdGhlIG5leHQgZWRnZS5cclxuICAgICAgICAgICAgICAgIHBvaW50LnNldChjaXJjbGVQb3MpO1xyXG4gICAgICAgICAgICAgICAgcG9pbnQuc2V0KHBvaW50LnN1Yihwb2ludHNbbmV4dF0pKTtcclxuICAgICAgICAgICAgICAgIHJlZ2lvbiA9IF92b3Jub2lSZWdpb24oZWRnZSwgcG9pbnQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlZ2lvbiA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGluIHRoZSByZWdpb24gd2Ugd2FudC4gIENoZWNrIGlmIHRoZSBjaXJjbGUgaW50ZXJzZWN0cyB0aGUgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBwb2ludC5sZW5ndGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdCA+IHJhZGl1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBObyBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVsnYkluQSddID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJsYXBOID0gcG9pbnQubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgaXQncyB0aGUgbWlkZGxlIHJlZ2lvbjpcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIE5lZWQgdG8gY2hlY2sgaWYgdGhlIGNpcmNsZSBpcyBpbnRlcnNlY3RpbmcgdGhlIGVkZ2UsXHJcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGVkZ2UgaW50byBpdHMgXCJlZGdlIG5vcm1hbFwiLlxyXG4gICAgICAgICAgICAgICAgdmFyIG5vcm1hbCA9IGVkZ2UucGVycCgpLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgcGVycGVuZGljdWxhciBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBjZW50ZXIgb2YgdGhlIFxyXG4gICAgICAgICAgICAgICAgLy8gY2lyY2xlIGFuZCB0aGUgZWRnZS5cclxuICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gcG9pbnQuZG90KG5vcm1hbCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGlzdEFicyA9IE1hdGguYWJzKGRpc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNpcmNsZSBpcyBvbiB0aGUgb3V0c2lkZSBvZiB0aGUgZWRnZSwgdGhlcmUgaXMgbm8gaW50ZXJzZWN0aW9uLlxyXG4gICAgICAgICAgICAgICAgaWYgKGRpc3QgPiAwICYmIGRpc3RBYnMgPiByYWRpdXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBObyBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQgaW50ZXJzZWN0cywgY2FsY3VsYXRlIHRoZSBvdmVybGFwLlxyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBOID0gbm9ybWFsO1xyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXAgPSByYWRpdXMgLSBkaXN0O1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSBpcyBvbiB0aGUgb3V0c2lkZSBvZiB0aGUgZWRnZSwgb3IgcGFydCBvZiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAvLyBjaXJjbGUgaXMgb24gdGhlIG91dHNpZGUsIHRoZSBjaXJjbGUgaXMgbm90IGZ1bGx5IGluc2lkZSB0aGUgcG9seWdvbi5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdCA+PSAwIHx8IG92ZXJsYXAgPCAyICogcmFkaXVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlWydiSW5BJ10gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIHNtYWxsZXN0IG92ZXJsYXAgd2UndmUgc2Vlbiwga2VlcCBpdC4gXHJcbiAgICAgICAgICAgIC8vIChvdmVybGFwTiBtYXkgYmUgbnVsbCBpZiB0aGUgY2lyY2xlIHdhcyBpbiB0aGUgd3JvbmcgVm9ybm9pIHJlZ2lvbikuXHJcbiAgICAgICAgICAgIGlmIChvdmVybGFwTiAmJiByZXNwb25zZSAmJiBNYXRoLmFicyhvdmVybGFwKSA8IE1hdGguYWJzKHJlc3BvbnNlWydvdmVybGFwJ10pKSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZVsnb3ZlcmxhcCddID0gb3ZlcmxhcDtcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlWydvdmVybGFwTiddID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKS5zZXQob3ZlcmxhcE4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGZpbmFsIG92ZXJsYXAgdmVjdG9yIC0gYmFzZWQgb24gdGhlIHNtYWxsZXN0IG92ZXJsYXAuXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlWydhJ10gPSBwb2x5Z29uO1xyXG4gICAgICAgICAgICByZXNwb25zZVsnYiddID0gY2lyY2xlO1xyXG4gICAgICAgICAgICByZXNwb25zZVsnb3ZlcmxhcFYnXSA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCkuc2V0KHJlc3BvbnNlWydvdmVybGFwTiddKS5zY2FsZShyZXNwb25zZVsnb3ZlcmxhcCddKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIC8vdmFyIHRlc3QxOy8vbnVtYmVycyBmb3IgdGVzdGluZyBtYXgvbWluc1xyXG4gICAgICAgIC8vdmFyIHRlc3QyO1xyXG4gICAgICAgIC8vdmFyIHRlc3Q7XHJcbiAgICAgICAgLy92YXIgbWluMTsvL3NhbWUgYXMgYWJvdmVcclxuICAgICAgICAvL3ZhciBtYXgxO1xyXG4gICAgICAgIC8vdmFyIG1pbjI7XHJcbiAgICAgICAgLy92YXIgbWF4MjtcclxuICAgICAgICAvL3ZhciBub3JtYWxBeGlzO1xyXG4gICAgICAgIC8vdmFyIG9mZnNldDtcclxuICAgICAgICAvL3ZhciB2ZWN0b3JPZmZzZXQ7XHJcbiAgICAgICAgLy92YXIgdmVjdG9ycztcclxuICAgICAgICAvL3ZhciBwMjtcclxuICAgICAgICAvL3ZhciBkaXN0YW5jZTtcclxuICAgICAgICAvL3ZhciB0ZXN0RGlzdGFuY2UgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIC8vdmFyIGNsb3Nlc3RWZWN0b3IgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApOy8vdGhlIHZlY3RvciB0byB1c2UgdG8gZmluZCB0aGUgbm9ybWFsXHJcbiAgICAgICAgLy8vLyBmaW5kIG9mZnNldFxyXG4gICAgICAgIC8vdmVjdG9yT2Zmc2V0ID0gbmV3IFJlbmRlckpzLlZlY3Rvcihwb2x5Z29uLnBvcy54IC0gY2lyY2xlLnBvcy54LCBwb2x5Z29uLnBvcy55IC0gY2lyY2xlLnBvcy55KTtcclxuICAgICAgICAvL3ZlY3RvcnMgPSBwb2x5Z29uLnZlcnRpY2VzLnNsaWNlKCk7Ly9hZ2FpbiwgdGhpcyBpcyBqdXN0IGEgZnVuY3Rpb24gaW4gbXkgcG9seWdvbiBjbGFzcyB0aGF0IHJldHVybnMgdGhlIHZlcnRpY2VzIG9mIHRoZSBwb2xnb25cclxuICAgICAgICAvLy8vYWRkcyBzb21lIHBhZGRpbmcgdG8gbWFrZSBpdCBtb3JlIGFjY3VyYXRlXHJcbiAgICAgICAgLy9pZiAodmVjdG9ycy5sZW5ndGggPT0gMikge1xyXG4gICAgICAgIC8vICAgIHZhciB0ZW1wID0gbmV3IFJlbmRlckpzLlZlY3RvcigtKHZlY3RvcnNbMV0ueSAtIHZlY3RvcnNbMF0ueSksIHZlY3RvcnNbMV0ueCAtIHZlY3RvcnNbMF0ueCk7XHJcbiAgICAgICAgLy8gICAgdGVtcC50cnVuY2F0ZSgwLjAwMDAwMDAwMDEpO1xyXG4gICAgICAgIC8vICAgIHZlY3RvcnMucHVzaCh2ZWN0b3JzWzFdLmFkZCh0ZW1wKSk7XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy8vLyBmaW5kIHRoZSBjbG9zZXN0IHZlcnRleCB0byB1c2UgdG8gZmluZCBub3JtYWxcclxuICAgICAgICAvL2ZvciAodmFyIGkgPSAwOyBpIDwgdmVjdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIC8vICAgIGRpc3RhbmNlID0gKGNpcmNsZS5wb3MueCAtIChwb2x5Z29uLnBvcy54ICsgdmVjdG9yc1tpXS54KSkgKiAoY2lyY2xlLnBvcy54IC0gKHBvbHlnb24ucG9zLnggKyB2ZWN0b3JzW2ldLngpKSArIChjaXJjbGUucG9zLnkgLSAocG9seWdvbi5wb3MueSArIHZlY3RvcnNbaV0ueSkpICogKGNpcmNsZS5wb3MueSAtIChwb2x5Z29uLnBvcy55ICsgdmVjdG9yc1tpXS55KSk7XHJcbiAgICAgICAgLy8gICAgaWYgKGRpc3RhbmNlIDwgdGVzdERpc3RhbmNlKSB7Ly9jbG9zZXN0IGhhcyB0aGUgbG93ZXN0IGRpc3RhbmNlXHJcbiAgICAgICAgLy8gICAgICAgIHRlc3REaXN0YW5jZSA9IGRpc3RhbmNlO1xyXG4gICAgICAgIC8vICAgICAgICBjbG9zZXN0VmVjdG9yLnggPSBwb2x5Z29uLnBvcy54ICsgdmVjdG9yc1tpXS54O1xyXG4gICAgICAgIC8vICAgICAgICBjbG9zZXN0VmVjdG9yLnkgPSBwb2x5Z29uLnBvcy55ICsgdmVjdG9yc1tpXS55O1xyXG4gICAgICAgIC8vICAgIH1cclxuICAgICAgICAvL31cclxuICAgICAgICAvLy8vZ2V0IHRoZSBub3JtYWwgdmVjdG9yXHJcbiAgICAgICAgLy9ub3JtYWxBeGlzID0gbmV3IFJlbmRlckpzLlZlY3RvcihjbG9zZXN0VmVjdG9yLnggLSBjaXJjbGUucG9zLngsIGNsb3Nlc3RWZWN0b3IueSAtIGNpcmNsZS5wb3MueSk7XHJcbiAgICAgICAgLy9ub3JtYWxBeGlzLnNldChub3JtYWxBeGlzLm5vcm1hbGl6ZSgpKTsvL25vcm1hbGl6ZSBpcyhzZXQgaXRzIGxlbmd0aCB0byAxKVxyXG4gICAgICAgIC8vLy8gcHJvamVjdCB0aGUgcG9seWdvbidzIHBvaW50c1xyXG4gICAgICAgIC8vbWluMSA9IG5vcm1hbEF4aXMuZG90KHZlY3RvcnNbMF0pO1xyXG4gICAgICAgIC8vbWF4MSA9IG1pbjE7Ly9zZXQgbWF4IGFuZCBtaW5cclxuICAgICAgICAvL2ZvciAoaiA9IDE7IGogPCB2ZWN0b3JzLmxlbmd0aDsgaisrKSB7Ly9wcm9qZWN0IGFsbCBpdHMgcG9pbnRzLCBzdGFydGluZyB3aXRoIHRoZSBmaXJzdCh0aGUgMHRoIHdhcyBkb25lIHVwIHRoZXJlXilcclxuICAgICAgICAvLyAgICB0ZXN0ID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yc1tqXSk7Ly9kb3RQcm9kdWN0IHRvIHByb2plY3RcclxuICAgICAgICAvLyAgICBpZiAodGVzdCA8IG1pbjEpIG1pbjEgPSB0ZXN0Oy8vc21hbGxlc3QgbWluIGlzIHdhbnRlZFxyXG4gICAgICAgIC8vICAgIGlmICh0ZXN0ID4gbWF4MSkgbWF4MSA9IHRlc3Q7Ly9sYXJnZXN0IG1heCBpcyB3YW50ZWRcclxuICAgICAgICAvL31cclxuICAgICAgICAvLy8vIHByb2plY3QgdGhlIGNpcmNsZVxyXG4gICAgICAgIC8vbWF4MiA9IGNpcmNsZS5yYWRpdXM7Ly9tYXggaXMgcmFkaXVzXHJcbiAgICAgICAgLy9taW4yIC09IGNpcmNsZS5yYWRpdXM7Ly9taW4gaXMgbmVnYXRpdmUgcmFkaXVzXHJcbiAgICAgICAgLy8vLyBvZmZzZXQgdGhlIHBvbHlnb24ncyBtYXgvbWluXHJcbiAgICAgICAgLy9vZmZzZXQgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JPZmZzZXQpO1xyXG4gICAgICAgIC8vbWluMSArPSBvZmZzZXQ7XHJcbiAgICAgICAgLy9tYXgxICs9IG9mZnNldDtcclxuICAgICAgICAvLy8vIGRvIHRoZSBiaWcgdGVzdFxyXG4gICAgICAgIC8vdGVzdDEgPSBtaW4xIC0gbWF4MjtcclxuICAgICAgICAvL3Rlc3QyID0gbWluMiAtIG1heDE7XHJcbiAgICAgICAgLy9pZiAodGVzdDEgPiAwIHx8IHRlc3QyID4gMCkgey8vaWYgZWl0aGVyIHRlc3QgaXMgZ3JlYXRlciB0aGFuIDAsIHRoZXJlIGlzIGEgZ2FwLCB3ZSBjYW4gZ2l2ZSB1cCBub3cuXHJcbiAgICAgICAgLy8gICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgLy99XHJcbiAgICAgICAgLy8vLyBmaW5kIHRoZSBub3JtYWwgYXhpcyBmb3IgZWFjaCBwb2ludCBhbmQgcHJvamVjdFxyXG4gICAgICAgIC8vZm9yIChpID0gMDsgaSA8IHZlY3RvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAvLyAgICBub3JtYWxBeGlzID0gX2ZpbmROb3JtYWxBeGlzKHZlY3RvcnMsIGkpO1xyXG4gICAgICAgIC8vICAgIC8vIHByb2plY3QgdGhlIHBvbHlnb24oYWdhaW4/IHllcywgY2lyY2xlcyB2cy4gcG9seWdvbiByZXF1aXJlIG1vcmUgdGVzdGluZy4uLilcclxuICAgICAgICAvLyAgICBtaW4xID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yc1swXSk7Ly9wcm9qZWN0XHJcbiAgICAgICAgLy8gICAgbWF4MSA9IG1pbjE7Ly9zZXQgbWF4IGFuZCBtaW5cclxuICAgICAgICAvLyAgICAvL3Byb2plY3QgYWxsIHRoZSBvdGhlciBwb2ludHMoc2VlLCBjaXJsY2VzIHYuIHBvbHlnb25zIHVzZSBsb3RzIG9mIHRoaXMuLi4pXHJcbiAgICAgICAgLy8gICAgZm9yIChqID0gMTsgaiA8IHZlY3RvcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAvLyAgICAgICAgdGVzdCA9IG5vcm1hbEF4aXMuZG90KHZlY3RvcnNbal0pOy8vbW9yZSBwcm9qZWN0aW9uXHJcbiAgICAgICAgLy8gICAgICAgIGlmICh0ZXN0IDwgbWluMSkgbWluMSA9IHRlc3Q7Ly9zbWFsbGVzdCBtaW5cclxuICAgICAgICAvLyAgICAgICAgaWYgKHRlc3QgPiBtYXgxKSBtYXgxID0gdGVzdDsvL2xhcmdlc3QgbWF4XHJcbiAgICAgICAgLy8gICAgfVxyXG4gICAgICAgIC8vICAgIC8vIHByb2plY3QgdGhlIGNpcmNsZShhZ2FpbilcclxuICAgICAgICAvLyAgICBtYXgyID0gY2lyY2xlLnJhZGl1czsvL21heCBpcyByYWRpdXNcclxuICAgICAgICAvLyAgICBtaW4yIC09IGNpcmNsZS5yYWRpdXM7Ly9taW4gaXMgbmVnYXRpdmUgcmFkaXVzXHJcbiAgICAgICAgLy8gICAgLy9vZmZzZXQgcG9pbnRzXHJcbiAgICAgICAgLy8gICAgb2Zmc2V0ID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yT2Zmc2V0KTtcclxuICAgICAgICAvLyAgICBtaW4xICs9IG9mZnNldDtcclxuICAgICAgICAvLyAgICBtYXgxICs9IG9mZnNldDtcclxuICAgICAgICAvLyAgICAvLyBkbyB0aGUgdGVzdCwgYWdhaW5cclxuICAgICAgICAvLyAgICB0ZXN0MSA9IG1pbjEgLSBtYXgyO1xyXG4gICAgICAgIC8vICAgIHRlc3QyID0gbWluMiAtIG1heDE7XHJcbiAgICAgICAgLy8gICAgaWYgKHRlc3QxID4gMCB8fCB0ZXN0MiA+IDApIHtcclxuICAgICAgICAvLyAgICAgICAgLy9mYWlsZWQuLiBxdWl0IG5vd1xyXG4gICAgICAgIC8vICAgICAgICByZXR1cm4gbnVsbFxyXG4gICAgICAgIC8vICAgIH1cclxuICAgICAgICAvL31cclxuICAgICAgICAvL3JldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKG5vcm1hbEF4aXMueCAqIChtYXgyIC0gbWluMSkgKiAtMSwgbm9ybWFsQXhpcy55ICogKG1heDIgLSBtaW4xKSAqIC0xKTsvL3JldHVybiB0aGUgc2VwYXJhdGlvbiBkaXN0YW5jZVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcG9pbnRJblJlY3RhbmdsZSA9IGZ1bmN0aW9uIChwLCByKSB7XHJcbiAgICAgICAgcmV0dXJuIChwLnggPj0gci54ICYmXHJcbiAgICAgICAgcC54IDw9IHIueCArIHIud2lkdGggJiZcclxuICAgICAgICBwLnkgPj0gci55ICYmXHJcbiAgICAgICAgcC55IDw9IHIueSArIHIuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuQWFiYkNvbGxpc2lvbiA9IGZ1bmN0aW9uIChyZWN0QSwgcmVjdEIpIHtcclxuICAgICAgICBpZiAoTWF0aC5hYnMocmVjdEEueCAtIHJlY3RCLngpIDwgcmVjdEEud2lkdGggKyByZWN0Qi53aWR0aCkge1xyXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMocmVjdEEueSAtIHJlY3RCLnkpIDwgcmVjdEEuaGVpZ2h0ICsgcmVjdEIuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5wb2ludEluT2JqZWN0ID0gZnVuY3Rpb24gKHAsIG9iaikge1xyXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSlcclxuICAgICAgICAgICAgcmV0dXJuIF9wb2ludEluUmVjdGFuZ2xlKHAsIG9iaik7XHJcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjKVxyXG4gICAgICAgICAgICByZXR1cm4gX3BvaW50SW5DaXJjbGUocCwgb2JqKTtcclxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uKVxyXG4gICAgICAgICAgICByZXR1cm4gX3BvaW50SW5Qb2x5Z29uKHAsIG9iaik7XHJcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuTGluZSlcclxuICAgICAgICAgICAgcmV0dXJuIF9wb2ludEluTGluZShwLCBvYmopO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmNoZWNrQ29sbGlzaW9uID0gZnVuY3Rpb24gKG9iajEsIG9iajIsIHZlbG9jaXR5KSB7XHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUpXHJcbiAgICAgICAgICAgIHJldHVybiBfcmVjdFZzUmVjdChvYmoxLCBvYmoyKTtcclxuXHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMpXHJcbiAgICAgICAgICAgIHJldHVybiBfcmVjdFZzQ2lyY2xlKG9iajEsIG9iajIpO1xyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlKVxyXG4gICAgICAgICAgICByZXR1cm4gX3JlY3RWc0NpcmNsZShvYmoyLCBvYmoxKTtcclxuXHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYyAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMpXHJcbiAgICAgICAgICAgIHJldHVybiBfY2lyY2xlVnNDaXJjbGUob2JqMSwgb2JqMiwgdmVsb2NpdHkpO1xyXG5cclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuTGluZSAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMpXHJcbiAgICAgICAgICAgIHJldHVybiBfbGluZVZzQ2lyY2xlKG9iajEsIG9iajIpO1xyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuTGluZSlcclxuICAgICAgICAgICAgcmV0dXJuIF9saW5lVnNDaXJjbGUob2JqMiwgb2JqMSk7XHJcblxyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24pIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoxLnN1YlBvbHlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iajIuc3ViUG9seXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBtb2R1bGUucG9seWdvbkNvbGxpc2lvbihvYmoxLnN1YlBvbHlzW2ldLCBvYmoyLnN1YlBvbHlzW2pdLCB2ZWxvY2l0eSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmludGVyc2VjdCB8fCByZXNwb25zZS53aWxsSW50ZXJzZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7Ly9SZW5kZXJKcy5WZWN0b3IuY2xvbmUoMCwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMgJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbilcclxuICAgICAgICAgICAgcmV0dXJuIF9jaXJjbGVWc1BvbHlnb24ob2JqMSwgb2JqMiwgdmVsb2NpdHkpO1xyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYylcclxuICAgICAgICAgICAgcmV0dXJuIF9jaXJjbGVWc1BvbHlnb24ob2JqMiwgb2JqMSwgdmVsb2NpdHkpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1vZHVsZTtcclxuXHJcbn0oUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zIHx8IHt9KSk7IiwidmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucyA9IChmdW5jdGlvbiAobW9kdWxlKSB7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgcG9seWdvbiBBIGlzIGdvaW5nIHRvIGNvbGxpZGUgd2l0aCBwb2x5Z29uIEIgZm9yIHRoZSBnaXZlbiB2ZWxvY2l0eVxyXG4gICAgbW9kdWxlLnBvbHlnb25Db2xsaXNpb24gPSBmdW5jdGlvbiAocG9seWdvbkEsIHBvbHlnb25CLCB2ZWxvY2l0eSkge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIGludGVyc2VjdDogdHJ1ZSxcclxuICAgICAgICAgICAgd2lsbEludGVyc2VjdDogdHJ1ZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGVkZ2VDb3VudEEgPSBwb2x5Z29uQS5lZGdlcy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGVkZ2VDb3VudEIgPSBwb2x5Z29uQi5lZGdlcy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIG1pbkludGVydmFsRGlzdGFuY2UgPSBJbmZpbml0eTtcclxuICAgICAgICB2YXIgdHJhbnNsYXRpb25BeGlzID0gbmV3IFJlbmRlckpzLlZlY3RvcigpO1xyXG4gICAgICAgIHZhciBlZGdlO1xyXG5cclxuICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHRoZSBlZGdlcyBvZiBib3RoIHBvbHlnb25zXHJcbiAgICAgICAgZm9yICh2YXIgZWRnZUluZGV4ID0gMCwgbCA9IGVkZ2VDb3VudEEgKyBlZGdlQ291bnRCOyBlZGdlSW5kZXggPCBsOyBlZGdlSW5kZXgrKykge1xyXG4gICAgICAgICAgICBpZiAoZWRnZUluZGV4IDwgZWRnZUNvdW50QSkge1xyXG4gICAgICAgICAgICAgICAgZWRnZSA9IHBvbHlnb25BLmVkZ2VzW2VkZ2VJbmRleF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlZGdlID0gcG9seWdvbkIuZWRnZXNbZWRnZUluZGV4IC0gZWRnZUNvdW50QV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vID09PT09IDEuIEZpbmQgaWYgdGhlIHBvbHlnb25zIGFyZSBjdXJyZW50bHkgaW50ZXJzZWN0aW5nID09PT09XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBheGlzIHBlcnBlbmRpY3VsYXIgdG8gdGhlIGN1cnJlbnQgZWRnZVxyXG4gICAgICAgICAgICB2YXIgYXhpcyA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoLWVkZ2UueSwgZWRnZS54KTtcclxuICAgICAgICAgICAgYXhpcy5zZXQoYXhpcy5ub3JtYWxpemUoKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBwcm9qZWN0aW9uIG9mIHRoZSBwb2x5Z29uIG9uIHRoZSBjdXJyZW50IGF4aXNcclxuICAgICAgICAgICAgdmFyIG1pbkEgPSAwLCBtaW5CID0gMCwgbWF4QSA9IDAsIG1heEIgPSAwO1xyXG5cclxuICAgICAgICAgICAgdmFyIHByb2plY3RlZEEgPSBfcHJvamVjdFBvbHlnb24oYXhpcywgcG9seWdvbkEsIG1pbkEsIG1heEEpO1xyXG4gICAgICAgICAgICBtaW5BID0gcHJvamVjdGVkQS5taW47XHJcbiAgICAgICAgICAgIG1heEEgPSBwcm9qZWN0ZWRBLm1heDtcclxuXHJcbiAgICAgICAgICAgIHZhciBwcm9qZWN0ZWRCID0gX3Byb2plY3RQb2x5Z29uKGF4aXMsIHBvbHlnb25CLCBtaW5CLCBtYXhCKTtcclxuICAgICAgICAgICAgbWluQiA9IHByb2plY3RlZEIubWluO1xyXG4gICAgICAgICAgICBtYXhCID0gcHJvamVjdGVkQi5tYXg7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcG9seWdvbiBwcm9qZWN0aW9ucyBhcmUgY3VycmVudGx0eSBpbnRlcnNlY3RpbmdcclxuICAgICAgICAgICAgaWYgKF9pbnRlcnZhbERpc3RhbmNlKG1pbkEsIG1heEEsIG1pbkIsIG1heEIpID4gMCkgcmVzdWx0LmludGVyc2VjdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgLy8gPT09PT0gMi4gTm93IGZpbmQgaWYgdGhlIHBvbHlnb25zICp3aWxsKiBpbnRlcnNlY3QgPT09PT1cclxuXHJcbiAgICAgICAgICAgIC8vIFByb2plY3QgdGhlIHZlbG9jaXR5IG9uIHRoZSBjdXJyZW50IGF4aXNcclxuICAgICAgICAgICAgdmFyIHZlbG9jaXR5UHJvamVjdGlvbiA9IGF4aXMuZG90KHZlbG9jaXR5KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgcHJvamVjdGlvbiBvZiBwb2x5Z29uIEEgZHVyaW5nIHRoZSBtb3ZlbWVudFxyXG4gICAgICAgICAgICBpZiAodmVsb2NpdHlQcm9qZWN0aW9uIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgbWluQSArPSB2ZWxvY2l0eVByb2plY3Rpb247XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtYXhBICs9IHZlbG9jaXR5UHJvamVjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRG8gdGhlIHNhbWUgdGVzdCBhcyBhYm92ZSBmb3IgdGhlIG5ldyBwcm9qZWN0aW9uXHJcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbERpc3RhbmNlID0gX2ludGVydmFsRGlzdGFuY2UobWluQSwgbWF4QSwgbWluQiwgbWF4Qik7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnZhbERpc3RhbmNlID4gMCkgcmVzdWx0LndpbGxJbnRlcnNlY3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBwb2x5Z29ucyBhcmUgbm90IGludGVyc2VjdGluZyBhbmQgd29uJ3QgaW50ZXJzZWN0LCBleGl0IHRoZSBsb29wXHJcbiAgICAgICAgICAgIGlmICghcmVzdWx0LmludGVyc2VjdCAmJiAhcmVzdWx0LndpbGxJbnRlcnNlY3QpIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGN1cnJlbnQgaW50ZXJ2YWwgZGlzdGFuY2UgaXMgdGhlIG1pbmltdW0gb25lLiBJZiBzbyBzdG9yZVxyXG4gICAgICAgICAgICAvLyB0aGUgaW50ZXJ2YWwgZGlzdGFuY2UgYW5kIHRoZSBjdXJyZW50IGRpc3RhbmNlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIHdpbGwgYmUgdXNlZCB0byBjYWxjdWxhdGUgdGhlIG1pbmltdW0gdHJhbnNsYXRpb24gdmVjdG9yXHJcbiAgICAgICAgICAgIGludGVydmFsRGlzdGFuY2UgPSBNYXRoLmFicyhpbnRlcnZhbERpc3RhbmNlKTtcclxuICAgICAgICAgICAgaWYgKGludGVydmFsRGlzdGFuY2UgPCBtaW5JbnRlcnZhbERpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5JbnRlcnZhbERpc3RhbmNlID0gaW50ZXJ2YWxEaXN0YW5jZTtcclxuICAgICAgICAgICAgICAgIHRyYW5zbGF0aW9uQXhpcyA9IGF4aXM7XHJcblxyXG4gICAgICAgICAgICAgICAgZCA9IHBvbHlnb25BLmdldENlbnRlcigpLnN1Yihwb2x5Z29uQi5nZXRDZW50ZXIoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZC5kb3QodHJhbnNsYXRpb25BeGlzKSA8IDApIHRyYW5zbGF0aW9uQXhpcyA9IHRyYW5zbGF0aW9uQXhpcy5zY2FsZSgtMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRoZSBtaW5pbXVtIHRyYW5zbGF0aW9uIHZlY3RvciBjYW4gYmUgdXNlZCB0byBwdXNoIHRoZSBwb2x5Z29ucyBhcHBhcnQuXHJcbiAgICAgICAgLy8gRmlyc3QgbW92ZXMgdGhlIHBvbHlnb25zIGJ5IHRoZWlyIHZlbG9jaXR5XHJcbiAgICAgICAgLy8gdGhlbiBtb3ZlIHBvbHlnb25BIGJ5IE1pbmltdW1UcmFuc2xhdGlvblZlY3Rvci5cclxuICAgICAgICBpZiAocmVzdWx0LndpbGxJbnRlcnNlY3QpIHJlc3VsdC5taW5pbXVtVHJhbnNsYXRpb25WZWN0b3IgPSB0cmFuc2xhdGlvbkF4aXMuc2NhbGUobWluSW50ZXJ2YWxEaXN0YW5jZSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIFttaW5BLCBtYXhBXSBhbmQgW21pbkIsIG1heEJdXHJcbiAgICAvLyBUaGUgZGlzdGFuY2Ugd2lsbCBiZSBuZWdhdGl2ZSBpZiB0aGUgaW50ZXJ2YWxzIG92ZXJsYXBcclxuICAgIHZhciBfaW50ZXJ2YWxEaXN0YW5jZSA9IGZ1bmN0aW9uIChtaW5BLCBtYXhBLCBtaW5CLCBtYXhCKSB7XHJcbiAgICAgICAgaWYgKG1pbkEgPCBtaW5CKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW5CIC0gbWF4QTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbWluQSAtIG1heEI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgcHJvamVjdGlvbiBvZiBhIHBvbHlnb24gb24gYW4gYXhpcyBhbmQgcmV0dXJucyBpdCBhcyBhIFttaW4sIG1heF0gaW50ZXJ2YWxcclxuICAgIHZhciBfcHJvamVjdFBvbHlnb24gPSBmdW5jdGlvbiAoYXhpcywgcG9seWdvbiwgbWluLCBtYXgpIHtcclxuICAgICAgICAvLyBUbyBwcm9qZWN0IGEgcG9pbnQgb24gYW4gYXhpcyB1c2UgdGhlIGRvdCBwcm9kdWN0XHJcbiAgICAgICAgdmFyIGQgPSBheGlzLmRvdChwb2x5Z29uLnZlcnRpY2VzWzBdKTtcclxuICAgICAgICBtaW4gPSBkO1xyXG4gICAgICAgIG1heCA9IGQ7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2x5Z29uLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGQgPSBwb2x5Z29uLnZlcnRpY2VzW2ldLmRvdChheGlzKTtcclxuICAgICAgICAgICAgaWYgKGQgPCBtaW4pIHtcclxuICAgICAgICAgICAgICAgIG1pbiA9IGQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZCA+IG1heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heCA9IGQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbWluOiBtaW4sXHJcbiAgICAgICAgICAgIG1heDogbWF4XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG5cclxufShSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMgfHwge30pKTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYSBjaXJjbGUgc2hhcGUsIGluaGVyaXRzIGZyb20gc2hhcGVcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjID0gaW5qZWN0KFwiVXRpbHNcIilcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBvcHRpb25zKSB7XHJcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICAgICAgdGhpcy5iYXNlKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBvcHRpb25zLndpZHRoID0gb3B0aW9ucy5oZWlnaHQgPSBvcHRpb25zLnJhZGl1cyAqIDIsIG9wdGlvbnMucmFkaXVzICogMjtcclxuXHJcbiAgICAgICAgdGhpcy5yYWRpdXMgPSBvcHRpb25zLnJhZGl1cztcclxuICAgICAgICB0aGlzLnNBbmdsZSA9IHV0aWxzLmNvbnZlcnRUb1JhZChvcHRpb25zLnNBbmdsZSB8fCAwKTtcclxuICAgICAgICB0aGlzLmVBbmdsZSA9IHV0aWxzLmNvbnZlcnRUb1JhZChvcHRpb25zLmVBbmdsZSB8fCAzNjApO1xyXG4gICAgICAgIHRoaXMuY29sb3IgPSBvcHRpb25zLmNvbG9yO1xyXG4gICAgICAgIHRoaXMuZmlsbENvbG9yID0gb3B0aW9ucy5maWxsQ29sb3I7XHJcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBvcHRpb25zLmxpbmVXaWR0aCB8fCAxO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqT3ZlcnJpZGVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiwgYmVjYXVzZSB0aGUgY2lyY2xlIGNlbnRlciBwb2ludCBpcyBub3QgdGhlIHRvcCxsZWZ0IGNvcm5lclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZ2V0Q2VudGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih0aGlzLnBvcy54ICsgdGhpcy53aWR0aCAvIDIsIHRoaXMucG9zLnkgKyB0aGlzLmhlaWdodCAvIDIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpPdmVycmlkZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5wb2ludEludGVyc2VjdCA9IGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gdGhpcy5nZXRDZW50ZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnBvdyhwLnggLSBjLngsIDIpICsgTWF0aC5wb3cocC55IC0gYy55LCAyKSA8PSBNYXRoLnBvdygodGhpcy53aWR0aCAvIDIpLCAyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICotZnBzIGlzIHRoZSBmcmFtZSBwZXIgc2Vjb25kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucm90YXRlU2hhcGUoY3R4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbENvbG9yO1xyXG4gICAgICAgICAgICBjdHguYXJjKHRoaXMucG9zLnggKyB0aGlzLndpZHRoIC8gMiwgdGhpcy5wb3MueSArIHRoaXMuaGVpZ2h0IC8gMiwgdGhpcy53aWR0aCAvIDIsIHRoaXMuc0FuZ2xlLCB0aGlzLmVBbmdsZSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsbENvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pOyIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhbiBpbWFnZSwgaW5oZXJpdHMgZnJvbSBvYmplY3RcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuSW1hZ2UgPSBpbmplY3QoXCJVdGlsc1wiKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5iYXNlKG9wdGlvbnMpO1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogTG9jYWxzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIF9pbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XHJcbiAgICAgICAgX2ltYWdlLnNyYyA9IG9wdGlvbnMudXJsO1xyXG4gICAgICAgIF9pbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYud2lkdGggPSBfaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIHNlbGYuaGVpZ2h0ID0gX2ltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgX2xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgX2xvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBfYmx1clJhZGl1cyA9IG9wdGlvbnMuYmx1clJhZGl1cyB8fCAwO1xyXG4gICAgICAgIHZhciBfY2FjaGUgPSBvcHRpb25zLmNhY2hlID09IHVuZGVmaW5lZCA/IHRydWUgOiBvcHRpb25zLmNhY2hlO1xyXG4gICAgICAgIHZhciBfZmlsdGVyQ2FjaGUgPSBudWxsO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgaWYgKCFfbG9hZGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghX2ZpbHRlckNhY2hlKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmlsdGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodGhpcy5maWx0ZXJzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQmx1cjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9maWx0ZXJDYWNoZSA9IFJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkJsdXIoX2ltYWdlLCBfYmx1clJhZGl1cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKF9maWx0ZXJDYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShfZmlsdGVyQ2FjaGUsIHRoaXMucG9zLngsIHRoaXMucG9zLnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShfaW1hZ2UsIHRoaXMucG9zLngsIHRoaXMucG9zLnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghX2NhY2hlKVxyXG4gICAgICAgICAgICAgICAgX2ZpbHRlckNhY2hlID0gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgbGluZSBzaGFwZSwgaW5oZXJpdHMgZnJvbSBzaGFwZVxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5MaW5lID0gaW5qZWN0KClcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgdGhpcy5iYXNlKHtcclxuICAgICAgICAgICAgeDogb3B0aW9ucy54MSxcclxuICAgICAgICAgICAgeTogb3B0aW9ucy55MSxcclxuICAgICAgICAgICAgd2lkdGg6IE1hdGguYWJzKG9wdGlvbnMueDIgLSBvcHRpb25zLngxKSxcclxuICAgICAgICAgICAgaGVpZ2h0OiBNYXRoLmFicyhvcHRpb25zLnkyIC0gb3B0aW9ucy55MSlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5jb2xvciA9IFwiIzAwMFwiO1xyXG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gMTtcclxuICAgICAgICB0aGlzLnBvczIgPSBuZXcgUmVuZGVySnMuVmVjdG9yKG9wdGlvbnMueDIsIG9wdGlvbnMueTIpO1xyXG4gICAgICAgIHRoaXMuY29sb3IgPSBvcHRpb25zLmNvbG9yO1xyXG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gb3B0aW9ucy5saW5lV2lkdGggfHwgMTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqLWZwcyBpcyB0aGUgZnJhbWUgcGVyIHNlY29uZFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgsIGZyYW1lLCBzdGFnZVBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBhYnNQb3NpdGlvbiA9IHRoaXMucG9zLnN1YihzdGFnZVBvc2l0aW9uKTtcclxuICAgICAgICAgICAgdmFyIGFic1Bvc2l0aW9uMiA9IHRoaXMucG9zMi5zdWIoc3RhZ2VQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbyhhYnNQb3NpdGlvbi54LCBhYnNQb3NpdGlvbi55KTtcclxuICAgICAgICAgICAgY3R4LmxpbmVUbyhhYnNQb3NpdGlvbjIueCwgYWJzUG9zaXRpb24yLnkpO1xyXG5cclxuICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbiIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIGxpbmUgc2hhcGUsIGluaGVyaXRzIGZyb20gc2hhcGVcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbiA9IGluamVjdChcIlV0aWxzXCIpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgb3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMuYmFzZShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb2xvciA9IG9wdGlvbnMuY29sb3IgfHwgXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBvcHRpb25zLmxpbmVXaWR0aCB8fCAxO1xyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBvcHRpb25zLnBvaW50cyB8fCBbXTtcclxuICAgICAgICB0aGlzLnN1YlBvbHlzID0gW107XHJcbiAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuckVkZ2VzID0gW107XHJcbiAgICAgICAgdGhpcy5idWlsZEVkZ2VzKCk7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogRGVjb21wb3NlIGEgcG9seWdvbiBpZiBpdCdzIGNvbmNhdmVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRlY29tcG9zZSA9IGZ1bmN0aW9uIChyZXN1bHQsIHJlZmxleFZlcnRpY2VzLCBzdGVpbmVyUG9pbnRzLCBkZWx0YSwgbWF4bGV2ZWwsIGxldmVsKSB7XHJcbiAgICAgICAgICAgIG1heGxldmVsID0gbWF4bGV2ZWwgfHwgMTAwO1xyXG4gICAgICAgICAgICBsZXZlbCA9IGxldmVsIHx8IDA7XHJcbiAgICAgICAgICAgIGRlbHRhID0gZGVsdGEgfHwgMjU7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHR5cGVvZiAocmVzdWx0KSAhPT0gXCJ1bmRlZmluZWRcIiA/IHJlc3VsdCA6IFtdO1xyXG4gICAgICAgICAgICByZWZsZXhWZXJ0aWNlcyA9IHJlZmxleFZlcnRpY2VzIHx8IFtdO1xyXG4gICAgICAgICAgICBzdGVpbmVyUG9pbnRzID0gc3RlaW5lclBvaW50cyB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIHZhciB1cHBlckludCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCksIGxvd2VySW50ID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKSwgcCA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCk7IC8vIFBvaW50c1xyXG4gICAgICAgICAgICB2YXIgdXBwZXJEaXN0ID0gMCwgbG93ZXJEaXN0ID0gMCwgZCA9IDAsIGNsb3Nlc3REaXN0ID0gMDsgLy8gc2NhbGFyc1xyXG4gICAgICAgICAgICB2YXIgdXBwZXJJbmRleCA9IDAsIGxvd2VySW5kZXggPSAwLCBjbG9zZXN0SW5kZXggPSAwOyAvLyBJbnRlZ2Vyc1xyXG4gICAgICAgICAgICB2YXIgbG93ZXJQb2x5ID0gbmV3IFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbigpLCB1cHBlclBvbHkgPSBuZXcgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uKCk7IC8vIHBvbHlnb25zXHJcbiAgICAgICAgICAgIHZhciBwb2x5ID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzO1xyXG5cclxuICAgICAgICAgICAgaWYgKHYubGVuZ3RoIDwgMykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV2ZWwrKztcclxuICAgICAgICAgICAgaWYgKGxldmVsID4gbWF4bGV2ZWwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInF1aWNrRGVjb21wOiBtYXggbGV2ZWwgKFwiICsgbWF4bGV2ZWwgKyBcIikgcmVhY2hlZC5cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwb2x5LmlzUmVmbGV4KGkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVmbGV4VmVydGljZXMucHVzaChwb2x5LnZlcnRpY2VzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB1cHBlckRpc3QgPSBsb3dlckRpc3QgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5WZWN0b3IubGVmdChwb2x5LmF0KGkgLSAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIFJlbmRlckpzLlZlY3Rvci5yaWdodE9uKHBvbHkuYXQoaSAtIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGogLSAxKSkpIHsgLy8gaWYgbGluZSBpbnRlcnNlY3RzIHdpdGggYW4gZWRnZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHRoaXMuZ2V0SW50ZXJzZWN0aW9uUG9pbnQocG9seS5hdChpIC0gMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaiksIHBvbHkuYXQoaiAtIDEpKTsgLy8gZmluZCB0aGUgcG9pbnQgb2YgaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuVmVjdG9yLnJpZ2h0KHBvbHkuYXQoaSArIDEpLCBwb2x5LmF0KGkpLCBwKSkgeyAvLyBtYWtlIHN1cmUgaXQncyBpbnNpZGUgdGhlIHBvbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkID0gUmVuZGVySnMuVmVjdG9yLnNxZGlzdChwb2x5LnZlcnRpY2VzW2ldLCBwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCA8IGxvd2VyRGlzdCkgeyAvLyBrZWVwIG9ubHkgdGhlIGNsb3Nlc3QgaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyRGlzdCA9IGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VySW50ID0gcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJJbmRleCA9IGo7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5WZWN0b3IubGVmdChwb2x5LmF0KGkgKyAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqICsgMSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiBSZW5kZXJKcy5WZWN0b3IucmlnaHRPbihwb2x5LmF0KGkgKyAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHAgPSB0aGlzLmdldEludGVyc2VjdGlvblBvaW50KHBvbHkuYXQoaSArIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopLCBwb2x5LmF0KGogKyAxKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVuZGVySnMuVmVjdG9yLmxlZnQocG9seS5hdChpIC0gMSksIHBvbHkuYXQoaSksIHApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZCA9IFJlbmRlckpzLlZlY3Rvci5zcWRpc3QocG9seS52ZXJ0aWNlc1tpXSwgcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgPCB1cHBlckRpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJEaXN0ID0gZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJJbnQgPSBwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlckluZGV4ID0gajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZXJlIGFyZSBubyB2ZXJ0aWNlcyB0byBjb25uZWN0IHRvLCBjaG9vc2UgYSBwb2ludCBpbiB0aGUgbWlkZGxlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvd2VySW5kZXggPT0gKHVwcGVySW5kZXggKyAxKSAlIHRoaXMudmVydGljZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJDYXNlIDE6IFZlcnRleChcIitpK1wiKSwgbG93ZXJJbmRleChcIitsb3dlckluZGV4K1wiKSwgdXBwZXJJbmRleChcIit1cHBlckluZGV4K1wiKSwgcG9seS5zaXplKFwiK3RoaXMudmVydGljZXMubGVuZ3RoK1wiKVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC54ID0gKGxvd2VySW50LnggKyB1cHBlckludC54KSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAueSA9IChsb3dlckludC55ICsgdXBwZXJJbnQueSkgLyAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVpbmVyUG9pbnRzLnB1c2gocCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IHVwcGVySW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbG93ZXJQb2x5Lmluc2VydChsb3dlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSArIGksIHBvbHkuYmVnaW4oKSArIHVwcGVySW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgaSwgdXBwZXJJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LnZlcnRpY2VzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkudmVydGljZXMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb3dlckluZGV4ICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3VwcGVyUG9seS5pbnNlcnQodXBwZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCkgKyBsb3dlckluZGV4LCBwb2x5LmVuZCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIGxvd2VySW5kZXgsIHBvbHkudmVydGljZXMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBwZXJQb2x5Lmluc2VydCh1cHBlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSwgcG9seS5iZWdpbigpICsgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCAwLCBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sb3dlclBvbHkuaW5zZXJ0KGxvd2VyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpICsgaSwgcG9seS5lbmQoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCBpLCBwb2x5LnZlcnRpY2VzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xvd2VyUG9seS5pbnNlcnQobG93ZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCksIHBvbHkuYmVnaW4oKSArIHVwcGVySW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgMCwgdXBwZXJJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LnZlcnRpY2VzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkudmVydGljZXMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBwZXJQb2x5Lmluc2VydCh1cHBlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSArIGxvd2VySW5kZXgsIHBvbHkuYmVnaW4oKSArIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgbG93ZXJJbmRleCwgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29ubmVjdCB0byB0aGUgY2xvc2VzdCBwb2ludCB3aXRoaW4gdGhlIHRyaWFuZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJDYXNlIDI6IFZlcnRleChcIitpK1wiKSwgY2xvc2VzdEluZGV4KFwiK2Nsb3Nlc3RJbmRleCtcIiksIHBvbHkuc2l6ZShcIit0aGlzLnZlcnRpY2VzLmxlbmd0aCtcIilcXG5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG93ZXJJbmRleCA+IHVwcGVySW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVySW5kZXggKz0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3QgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVwcGVySW5kZXggPCBsb3dlckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gbG93ZXJJbmRleDsgaiA8PSB1cHBlckluZGV4OyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5WZWN0b3IubGVmdE9uKHBvbHkuYXQoaSAtIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIFJlbmRlckpzLlZlY3Rvci5yaWdodE9uKHBvbHkuYXQoaSArIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBSZW5kZXJKcy5WZWN0b3Iuc3FkaXN0KHBvbHkuYXQoaSksIHBvbHkuYXQoaikpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkIDwgY2xvc2VzdERpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2VzdERpc3QgPSBkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZXN0SW5kZXggPSBqICUgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IGNsb3Nlc3RJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCBpLCBjbG9zZXN0SW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9zZXN0SW5kZXggIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIGNsb3Nlc3RJbmRleCwgdi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCAwLCBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5hcHBlbmQocG9seSwgaSwgdi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCAwLCBjbG9zZXN0SW5kZXggKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgY2xvc2VzdEluZGV4LCBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvbHZlIHNtYWxsZXN0IHBvbHkgZmlyc3RcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG93ZXJQb2x5LnZlcnRpY2VzLmxlbmd0aCA8IHVwcGVyUG9seS52ZXJ0aWNlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmRlY29tcG9zZShyZXN1bHQsIHJlZmxleFZlcnRpY2VzLCBzdGVpbmVyUG9pbnRzLCBkZWx0YSwgbWF4bGV2ZWwsIGxldmVsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmRlY29tcG9zZShyZXN1bHQsIHJlZmxleFZlcnRpY2VzLCBzdGVpbmVyUG9pbnRzLCBkZWx0YSwgbWF4bGV2ZWwsIGxldmVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuZGVjb21wb3NlKHJlc3VsdCwgcmVmbGV4VmVydGljZXMsIHN0ZWluZXJQb2ludHMsIGRlbHRhLCBtYXhsZXZlbCwgbGV2ZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuZGVjb21wb3NlKHJlc3VsdCwgcmVmbGV4VmVydGljZXMsIHN0ZWluZXJQb2ludHMsIGRlbHRhLCBtYXhsZXZlbCwgbGV2ZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHJlc3VsdC5sZW5ndGg7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRba10uYnVpbGRFZGdlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEFwcGVuZCBwb2ludHMgXCJmcm9tXCIgdG8gXCJ0b1wiLTEgZnJvbSBhbiBvdGhlciBwb2x5Z29uIFwicG9seVwiIG9udG8gdGhpcyBvbmUuXHJcbiAgICAgICAgICogQG1ldGhvZCBhcHBlbmRcclxuICAgICAgICAgKiBAcGFyYW0ge1BvbHlnb259IHBvbHkgVGhlIHBvbHlnb24gdG8gZ2V0IHBvaW50cyBmcm9tLlxyXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSAgZnJvbSBUaGUgdmVydGV4IGluZGV4IGluIFwicG9seVwiLlxyXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSAgdG8gVGhlIGVuZCB2ZXJ0ZXggaW5kZXggaW4gXCJwb2x5XCIuIE5vdGUgdGhhdCB0aGlzIHZlcnRleCBpcyBOT1QgaW5jbHVkZWQgd2hlbiBhcHBlbmRpbmcuXHJcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5hcHBlbmQgPSBmdW5jdGlvbiAocG9seSwgZnJvbSwgdG8pIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZnJvbSkgPT09IFwidW5kZWZpbmVkXCIpIHRocm93IG5ldyBFcnJvcihcIkZyb20gaXMgbm90IGdpdmVuIVwiKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAodG8pID09PSBcInVuZGVmaW5lZFwiKSB0aHJvdyBuZXcgRXJyb3IoXCJUbyBpcyBub3QgZ2l2ZW4hXCIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRvIC0gMSA8IGZyb20pIHRocm93IG5ldyBFcnJvcihcImxvbDFcIik7XHJcbiAgICAgICAgICAgIGlmICh0byA+IHBvbHkudmVydGljZXMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJsb2wyXCIpO1xyXG4gICAgICAgICAgICBpZiAoZnJvbSA8IDApIHRocm93IG5ldyBFcnJvcihcImxvbDNcIik7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gZnJvbTsgaSA8IHRvOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmVydGljZXMucHVzaChwb2x5LnZlcnRpY2VzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogR2V0IGEgdmVydGV4IGF0IHBvc2l0aW9uIGkuIEl0IGRvZXMgbm90IG1hdHRlciBpZiBpIGlzIG91dCBvZiBib3VuZHMsIHRoaXMgZnVuY3Rpb24gd2lsbCBqdXN0IGN5Y2xlLlxyXG4gICAgICAgICAqIEBtZXRob2QgYXRcclxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlcclxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmF0ID0gZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzLFxyXG4gICAgICAgICAgICAgICAgcyA9IHYubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4gdltpIDwgMCA/IGkgJSBzICsgcyA6IGkgJSBzXTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEdldCBmaXJzdCB2ZXJ0ZXhcclxuICAgICAgICAgKiBAbWV0aG9kIGZpcnN0XHJcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5maXJzdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmVydGljZXNbMF07XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBHZXQgbGFzdCB2ZXJ0ZXhcclxuICAgICAgICAgKiBAbWV0aG9kIGxhc3RcclxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmxhc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZlcnRpY2VzW3RoaXMudmVydGljZXMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogQ2hlY2tzIHRoYXQgdGhlIGxpbmUgc2VnbWVudHMgb2YgdGhpcyBwb2x5Z29uIGRvIG5vdCBpbnRlcnNlY3QgZWFjaCBvdGhlci5cclxuICAgICAgICAgKiBAbWV0aG9kIGlzU2ltcGxlXHJcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9IHBhdGggQW4gYXJyYXkgb2YgdmVydGljZXMgZS5nLiBbWzAsMF0sWzAsMV0sLi4uXVxyXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAgICAgICAgICogQHRvZG8gU2hvdWxkIGl0IGNoZWNrIGFsbCBzZWdtZW50cyB3aXRoIGFsbCBvdGhlcnM/XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5pc1NpbXBsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHBhdGggPSB0aGlzLnZlcnRpY2VzO1xyXG4gICAgICAgICAgICAvLyBDaGVja1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGkgLSAxOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWdtZW50c0ludGVyc2VjdChwYXRoW2ldLCBwYXRoW2kgKyAxXSwgcGF0aFtqXSwgcGF0aFtqICsgMV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRoZSBzZWdtZW50IGJldHdlZW4gdGhlIGxhc3QgYW5kIHRoZSBmaXJzdCBwb2ludCB0byBhbGwgb3RoZXJzXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcGF0aC5sZW5ndGggLSAyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlZ21lbnRzSW50ZXJzZWN0KHBhdGhbMF0sIHBhdGhbcGF0aC5sZW5ndGggLSAxXSwgcGF0aFtpXSwgcGF0aFtpICsgMV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldEludGVyc2VjdGlvblBvaW50ID0gZnVuY3Rpb24gKHAxLCBwMiwgcTEsIHEyLCBkZWx0YSkge1xyXG4gICAgICAgICAgICBkZWx0YSA9IGRlbHRhIHx8IDA7XHJcbiAgICAgICAgICAgIHZhciBhMSA9IHAyLnkgLSBwMS55O1xyXG4gICAgICAgICAgICB2YXIgYjEgPSBwMS54IC0gcDIueDtcclxuICAgICAgICAgICAgdmFyIGMxID0gKGExICogcDEueCkgKyAoYjEgKiBwMS55KTtcclxuICAgICAgICAgICAgdmFyIGEyID0gcTIueSAtIHExLnk7XHJcbiAgICAgICAgICAgIHZhciBiMiA9IHExLnggLSBxMi54O1xyXG4gICAgICAgICAgICB2YXIgYzIgPSAoYTIgKiBxMS54KSArIChiMiAqIHExLnkpO1xyXG4gICAgICAgICAgICB2YXIgZGV0ID0gKGExICogYjIpIC0gKGEyICogYjEpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFTY2FsYXIuZXEoZGV0LCAwLCBkZWx0YSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVuZGVySnMuVmVjdG9yLmNsb25lKCgoYjIgKiBjMSkgLSAoYjEgKiBjMikpIC8gZGV0LCAoKGExICogYzIpIC0gKGEyICogYzEpKSAvIGRldCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuY2xvbmUoMCwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIENoZWNrIGlmIGEgcG9pbnQgaW4gdGhlIHBvbHlnb24gaXMgYSByZWZsZXggcG9pbnRcclxuICAgICAgICAgKiBAbWV0aG9kIGlzUmVmbGV4XHJcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSAgaVxyXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5pc1JlZmxleCA9IGZ1bmN0aW9uIChpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IucmlnaHQodGhpcy5hdChpIC0gMSksIHRoaXMuYXQoaSksIHRoaXMuYXQoaSArIDEpKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLm1ha2VDQ1cgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBiciA9IDAsXHJcbiAgICAgICAgICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlcztcclxuXHJcbiAgICAgICAgICAgIC8vIGZpbmQgYm90dG9tIHJpZ2h0IHBvaW50XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZbaV0ueSA8IHZbYnJdLnkgfHwgKHZbaV0ueSA9PSB2W2JyXS55ICYmIHZbaV0ueCA+IHZbYnJdLngpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnIgPSBpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyByZXZlcnNlIHBvbHkgaWYgY2xvY2t3aXNlXHJcbiAgICAgICAgICAgIGlmICghUmVuZGVySnMuVmVjdG9yLmxlZnQodGhpcy5hdChiciAtIDEpLCB0aGlzLmF0KGJyKSwgdGhpcy5hdChiciArIDEpKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogUmV2ZXJzZSB0aGUgdmVydGljZXMgaW4gdGhlIHBvbHlnb25cclxuICAgICAgICAgKiBAbWV0aG9kIHJldmVyc2VcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0bXAgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIE4gPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSAhPT0gTjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0bXAucHVzaCh0aGlzLnZlcnRpY2VzLnBvcCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzID0gdG1wO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2VnbWVudHNJbnRlcnNlY3QgPSBmdW5jdGlvbiAocDEsIHAyLCBxMSwgcTIpIHtcclxuICAgICAgICAgICAgdmFyIGR4ID0gcDIueCAtIHAxLng7XHJcbiAgICAgICAgICAgIHZhciBkeSA9IHAyLnkgLSBwMS55O1xyXG4gICAgICAgICAgICB2YXIgZGEgPSBxMi54IC0gcTEueDtcclxuICAgICAgICAgICAgdmFyIGRiID0gcTIueSAtIHExLnk7XHJcblxyXG4gICAgICAgICAgICAvLyBzZWdtZW50cyBhcmUgcGFyYWxsZWxcclxuICAgICAgICAgICAgaWYgKGRhICogZHkgLSBkYiAqIGR4ID09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgcyA9IChkeCAqIChxMS55IC0gcDEueSkgKyBkeSAqIChwMS54IC0gcTEueCkpIC8gKGRhICogZHkgLSBkYiAqIGR4KVxyXG4gICAgICAgICAgICB2YXIgdCA9IChkYSAqIChwMS55IC0gcTEueSkgKyBkYiAqIChxMS54IC0gcDEueCkpIC8gKGRiICogZHggLSBkYSAqIGR5KVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChzID49IDAgJiYgcyA8PSAxICYmIHQgPj0gMCAmJiB0IDw9IDEpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuYnVpbGRFZGdlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHAxO1xyXG4gICAgICAgICAgICB2YXIgcDI7XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5yRWRnZXMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBwMSA9IHRoaXMudmVydGljZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoaSArIDEgPj0gdGhpcy52ZXJ0aWNlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwMiA9IHRoaXMudmVydGljZXNbMF07XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHAyID0gdGhpcy52ZXJ0aWNlc1tpICsgMV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkZ2VzLnB1c2gocDIuc3ViKHAxKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJFZGdlcy5wdXNoKHtwMTogbmV3IFJlbmRlckpzLlZlY3RvcihwMS54LCBwMS55KSwgcDI6IG5ldyBSZW5kZXJKcy5WZWN0b3IocDIueCwgcDIueSl9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0Q2VudGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWxYID0gMDtcclxuICAgICAgICAgICAgdmFyIHRvdGFsWSA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG90YWxYICs9IHRoaXMudmVydGljZXNbaV0ueDtcclxuICAgICAgICAgICAgICAgIHRvdGFsWSArPSB0aGlzLnZlcnRpY2VzW2ldLnk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRvdGFsWCAvIHRoaXMudmVydGljZXMubGVuZ3RoLCB0b3RhbFkgLyB0aGlzLnZlcnRpY2VzLmxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5vZmZzZXQgPSBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgICAgICAgICB2YXIgdiA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyBuZXcgUmVuZGVySnMuVmVjdG9yKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKSA6IGFyZ3VtZW50c1swXTtcclxuICAgICAgICAgICAgdGhpcy5wb3Muc2V0KHRoaXMucG9zLmFkZCh2KSk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHAgPSB0aGlzLnZlcnRpY2VzW2ldO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXS5zZXQocC5hZGQodikpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc3ViUG9seXMgPSB0aGlzLmRlY29tcG9zZSgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICE9IFwiXCIpIHJlc3VsdCArPSBcIiBcIjtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBcIntcIiArIHRoaXMudmVydGljZXNbaV0udG9TdHJpbmcodHJ1ZSkgKyBcIn1cIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICotZnBzIGlzIHRoZSBmcmFtZSBwZXIgc2Vjb25kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgICAgICAgICB2YXIgY29sb3JzID0gW1wiaW5kaWFucmVkXCIsIFwieWVsbG93XCIsICdncmVlbiddO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3ViUG9seXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ZXJ0aWNlcyA9IHRoaXMuc3ViUG9seXNbaV0udmVydGljZXM7XHJcbiAgICAgICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHZlcnRpY2VzWzBdLngsIHZlcnRpY2VzWzBdLnkpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCB2ZXJ0aWNlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN0eC5saW5lVG8odmVydGljZXNbal0ueCwgdmVydGljZXNbal0ueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1tpXTtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgcmVjdGFuZ2xlIHNoYXBlLCBpbmhlcml0cyBmcm9tIHNoYXBlXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSA9IGluamVjdChcIlV0aWxzXCIpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmJhc2Uob3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9IG9wdGlvbnMuY29sb3I7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3IgPSBvcHRpb25zLmZpbGxDb2xvcjtcclxuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IG9wdGlvbnMubGluZVdpZHRoIHx8IDE7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlUmVjdCh0aGlzLnBvcy54LCB0aGlzLnBvcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuZmlsbENvbG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QodGhpcy5wb3MueCwgdGhpcy5wb3MueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbENvbG9yO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuIiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgc3ByaXRlIGltYWdlLCBpbmhlcml0cyBmcm9tIHNoYXBlXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLlNwcml0ZSA9IGluamVjdChcIlV0aWxzXCIpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgb3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMuYmFzZShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBMb2NhbHNcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgc2VsZi5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpbWFnZS5zcmMgPSBvcHRpb25zLnVybDtcclxuICAgICAgICB2YXIgbG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGZyYW1lSW5kZXggPSAwO1xyXG4gICAgICAgIHZhciBmcmFtZUNvdW50ID0gb3B0aW9ucy5mcmFtZUNvdW50O1xyXG4gICAgICAgIHZhciBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGxvb3AgPSBmYWxzZTtcclxuICAgICAgICB2YXIgZGVmQW5pbWF0aW9uID0gb3B0aW9ucy5kZWZBbmltYXRpb247XHJcbiAgICAgICAgdmFyIGN1cnJlbnQ7XHJcbiAgICAgICAgdmFyIHByZXZpb3VzO1xyXG4gICAgICAgIHZhciBhbmltYXRpb25zID0gb3B0aW9ucy5hbmltYXRpb25zO1xyXG5cclxuICAgICAgICB2YXIgYW5pbWF0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGlzTG9vcCkge1xyXG4gICAgICAgICAgICBmcmFtZUluZGV4ID0gMDtcclxuICAgICAgICAgICAgc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxvb3AgPSBpc0xvb3A7XHJcbiAgICAgICAgICAgIGlmICghYW5pbWF0aW9uc1tuYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHByZXZpb3VzID0gY3VycmVudDtcclxuICAgICAgICAgICAgY3VycmVudCA9IGFuaW1hdGlvbnNbbmFtZV07XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbihkZWZBbmltYXRpb24sIHRydWUpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QW5pbWF0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGxvb3ApIHtcclxuICAgICAgICAgICAgYW5pbWF0aW9uKG5hbWUsIGxvb3ApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucG9pbnRJbnRlcnNlY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFJlY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBkZWZGcmFtZSA9IGFuaW1hdGlvbnNbZGVmQW5pbWF0aW9uXVswXTtcclxuICAgICAgICAgICAgcmV0dXJuIHt4OiB0aGlzLnBvcy54LCB5OiB0aGlzLnBvcy55LCB3aWR0aDogZGVmRnJhbWVbMl0sIGhlaWdodDogZGVmRnJhbWVbM119O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucm90YXRlU2hhcGUgPSBmdW5jdGlvbiAoY3R4LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBkZWZGcmFtZSA9IGFuaW1hdGlvbnNbZGVmQW5pbWF0aW9uXVswXTtcclxuICAgICAgICAgICAgdmFyIG8gPSBuZXcgUmVuZGVySnMuVmVjdG9yKHBvc2l0aW9uLnggKyAoZGVmRnJhbWVbMl0gLyAyKSwgcG9zaXRpb24ueSArIChkZWZGcmFtZVszXSAvIDIpKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShvLngsIG8ueSk7XHJcbiAgICAgICAgICAgIGN0eC5yb3RhdGUodXRpbHMuY29udmVydFRvUmFkKHRoaXMuYW5nbGUpKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSgtby54LCAtby55KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgZnJhbWUsIHN0YWdlUG9zaXRpb24pIHtcclxuICAgICAgICAgICAgaWYgKCFsb2FkZWQgfHwgIXN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGFic1Bvc2l0aW9uID0gdGhpcy5wb3Muc3ViKHN0YWdlUG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJvdGF0ZVNoYXBlKGN0eCwgYWJzUG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VycmVudEZyYW1lID0gY3VycmVudFtmcmFtZUluZGV4XTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIGN1cnJlbnRGcmFtZVswXSwgY3VycmVudEZyYW1lWzFdLCBjdXJyZW50RnJhbWVbMl0sIGN1cnJlbnRGcmFtZVszXSwgYWJzUG9zaXRpb24ueCwgYWJzUG9zaXRpb24ueSwgY3VycmVudEZyYW1lWzJdLCBjdXJyZW50RnJhbWVbM10pO1xyXG4gICAgICAgICAgICBpZiAoTWF0aC5mbG9vcihmcmFtZS50aW1lKSAlIGZyYW1lQ291bnQgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGZyYW1lSW5kZXggPSBmcmFtZUluZGV4ID49IGN1cnJlbnQubGVuZ3RoIC0gMSA/IDAgOiBmcmFtZUluZGV4ICsgMTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmFtZUluZGV4ID09PSAwICYmICFsb29wKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uKGRlZkFuaW1hdGlvbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==