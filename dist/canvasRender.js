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
            if ((_initialized && !_dispatcher.hasSubscribers('animate') && !this.hasSprites(this) && !this.active) || this.objects.length === 0) {
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
            var newPos = this.pos.add(new RenderJs.Vector(dX, dY));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdlbmVyYWwuanMiLCJncmFwaGljcy5qcyIsIm51bWJlci5qcyIsImxpbmtlZGxpc3QuanMiLCJtYWluLmpzIiwibW9kdWxlcy9hbmltYXRpb24uanMiLCJtb2R1bGVzL2ZpbHRlcnMuanMiLCJtb2R1bGVzL2xheWVyLmpzIiwibW9kdWxlcy9vYmplY3QuanMiLCJtb2R1bGVzL3NwYWNlLmpzIiwibW9kdWxlcy9zdGFnZS5qcyIsIm1vZHVsZXMvdHJhbnNpdGlvbi5qcyIsIm1vZHVsZXMvdmVjdG9yLmpzIiwibW9kdWxlcy9nYW1lL3BoeXNpY3MuanMiLCJtb2R1bGVzL2dhbWUvcG9seWdvbkNvbGxpc2lvbi5qcyIsIm1vZHVsZXMvc2hhcGVzL2FyYy5qcyIsIm1vZHVsZXMvc2hhcGVzL2ltYWdlLmpzIiwibW9kdWxlcy9zaGFwZXMvbGluZS5qcyIsIm1vZHVsZXMvc2hhcGVzL3BvbHlnb24uanMiLCJtb2R1bGVzL3NoYXBlcy9yZWN0YW5nbGUuanMiLCJtb2R1bGVzL3NoYXBlcy9zcHJpdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjYW52YXNSZW5kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG5cclxuICAgIG1vZHVsZS5nZXRHdWlkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnBhcnNlVXJsID0gZnVuY3Rpb24gKHVybCkge1xyXG4gICAgICAgIHZhciBwYXJzZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgcGFyc2VyLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJvdG9jb2w6IHBhcnNlci5wcm90b2NvbCxcclxuICAgICAgICAgICAgcG9ydDogcGFyc2VyLnBvcnQsXHJcbiAgICAgICAgICAgIHBhdGhuYW1lOiBwYXJzZXIucGF0aG5hbWUsXHJcbiAgICAgICAgICAgIHNlYXJjaDogcGFyc2VyLnNlYXJjaCxcclxuICAgICAgICAgICAgaGFzaDogcGFyc2VyLmhhc2gsXHJcbiAgICAgICAgICAgIGhvc3Q6IHBhcnNlci5ob3N0XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnNsZWVwID0gZnVuY3Rpb24gKHNlY29uZHMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgd2hpbGUgKG5ldyBEYXRlKCkgLSBkYXRlIDwgc2Vjb25kcyAqIDEwMDApXHJcbiAgICAgICAgeyB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcbn0oVXRpbHMgfHwge30pKTsiLCJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKG1vZHVsZSkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgbW9kdWxlLmNvbnZlcnRUb1JhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgICAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApO1xyXG4gICAgfTtcclxuICAgIHZhciBsYXN0VXBkYXRlID0gKG5ldyBEYXRlKSAqIDEgLSAxO1xyXG5cclxuICAgIG1vZHVsZS5nZXRNb3VzZVBvcyA9IGZ1bmN0aW9uIChjYW52YXMsIGV2dCkge1xyXG4gICAgICAgIHZhciByZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0LFxyXG4gICAgICAgICAgICB5OiBldnQuY2xpZW50WSAtIHJlY3QudG9wXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZ2V0Q2FudmFzID0gZnVuY3Rpb24gKHcsIGgpIHtcclxuICAgICAgICB2YXIgYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIGMud2lkdGggPSB3O1xyXG4gICAgICAgIGMuaGVpZ2h0ID0gaDtcclxuICAgICAgICByZXR1cm4gYztcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuZ2V0UGl4ZWxzID0gZnVuY3Rpb24gKGltZykge1xyXG4gICAgICAgIHZhciBjLCBjdHg7XHJcbiAgICAgICAgaWYgKGltZy5nZXRDb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGMgPSBpbWc7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjdHggPSBjLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWN0eCkge1xyXG4gICAgICAgICAgICBjID0gVXRpbHMuZ2V0Q2FudmFzKGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgICAgICAgIGN0eCA9IGMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBjLndpZHRoLCBjLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmdldEZwcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbm93ID0gbmV3IERhdGU7XHJcbiAgICAgICAgdmFyIGZwcyA9IDEwMDAgLyAobm93IC0gbGFzdFVwZGF0ZSk7XHJcbiAgICAgICAgLy9mcHMgKz0gKHRoaXNGcmFtZUZQUyAtIGZwcykgLyByZWZGcHM7XHJcbiAgICAgICAgbGFzdFVwZGF0ZSA9IG5vdztcclxuXHJcbiAgICAgICAgcmV0dXJuIGZwcztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG59KFV0aWxzIHx8IHt9KSk7IiwidmFyIFV0aWxzID0gKGZ1bmN0aW9uIChtb2R1bGUpIHtcclxuXHJcbiAgICBtb2R1bGUuaXNOdW1iZXIgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuICFpc05hTih2YWx1ZSk7IH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG59KFV0aWxzIHx8IHt9KSk7XHJcbiIsInZhciBMaW5rZWRMaXN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgICB2YXIgbm9kZXMgPSBbXTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoO1xyXG4gICAgfTtcclxuICAgIHRoaXMuZmlyc3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5vZGVzWzBdO1xyXG4gICAgfTtcclxuICAgIHRoaXMubGFzdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYnVpbGRMaXN0ID0gZnVuY3Rpb24gKG5vZGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0ID0gbm9kZXNbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGkgPT09IGxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdCA9IG5vZGVzW2ldO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2Rlc1tpXS5wcmV2ID0gbm9kZXNbaSAtIDFdO1xyXG4gICAgICAgICAgICBub2Rlc1tpXS5uZXh0ID0gbm9kZXNbaSArIDFdO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKG5vZGVzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hcHBlbmQgPSBmdW5jdGlvbiAobm9kZSkge1xyXG4gICAgICAgIHZhciBsYXN0ID0gdGhpcy5sYXN0KCk7XHJcblxyXG4gICAgICAgIGlmIChub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxhc3QubmV4dCA9IG5vZGU7XHJcbiAgICAgICAgICAgIG5vZGUucHJldiA9IGxhc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RW51bWVyYXRvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSAtMTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjdXJyZW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZXNbaW5kZXhdO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IG5vZGVzLmxlbmd0aCAtIDEpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBub2Rlc1srK2luZGV4XTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJldjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVzW2luZGV4LS1dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn0iLCIvL1xyXG4vL1JlZ2lzdGVyIHR5cGVzXHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwialF1ZXJ5XCIsICQpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcImxpbnFcIiwgbGlucSk7XHJcbmRlcGVuZGVuY3lDb250YWluZXIucmVnaXN0ZXJUeXBlKFwiVXRpbHNcIiwgVXRpbHMpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcIkV2ZW50RGlzcGF0Y2hlclwiLCBFdmVudERpc3BhdGNoZXIpO1xyXG5kZXBlbmRlbmN5Q29udGFpbmVyLnJlZ2lzdGVyVHlwZShcIkxpbmtlZExpc3RcIiwgTGlua2VkTGlzdCk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXNcIik7XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuQW5pbWF0aW9uID0gaW5qZWN0KClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAoaGFuZGxlciwgbGF5ZXIpIHtcclxuXHJcbiAgICAgICAgdmFyIHRpbWUgPSAwO1xyXG4gICAgICAgIHZhciBzdWJzY3JpYmVyO1xyXG4gICAgICAgIHZhciBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIHN0b3BwZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgcGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBhbmltYXRpb24gPSBmdW5jdGlvbiAoZnJhbWVSYXRlKSB7XHJcbiAgICAgICAgICAgIGhhbmRsZXIoe1xyXG4gICAgICAgICAgICAgICAgZnJhbWVSYXRlOiBmcmFtZVJhdGUsXHJcbiAgICAgICAgICAgICAgICBsYXN0VGltZTogdGltZSxcclxuICAgICAgICAgICAgICAgIHRpbWU6IHRpbWUgKyAxMDAwIC8gZnJhbWVSYXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aW1lICs9IDEwMDAgLyBmcmFtZVJhdGU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgc3RvcHBlZCA9IHBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzdWJzY3JpYmVyID0gbGF5ZXIub24oXCJhbmltYXRlXCIsIGFuaW1hdGlvbik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGltZSA9IDA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXJ0ZWQgJiYgc3Vic2NyaWJlcikge1xyXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlcigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zdG9wID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoc3RhcnRlZCAmJiBzdWJzY3JpYmVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XHJcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVyKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuRmlsdGVyc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkNvbnZvbHV0ZSA9IGZ1bmN0aW9uIChpbWFnZSwgd2VpZ2h0cywgb3BhcXVlKSB7XHJcbiAgICB2YXIgc2lkZSA9IE1hdGgucm91bmQoTWF0aC5zcXJ0KHdlaWdodHMubGVuZ3RoKSk7XHJcbiAgICB2YXIgaGFsZlNpZGUgPSBNYXRoLmZsb29yKHNpZGUgLyAyKTtcclxuICAgIHZhciBwaXhlbHMgPSBVdGlscy5nZXRQaXhlbHMoaW1hZ2UpO1xyXG4gICAgdmFyIHNyYyA9IHBpeGVscy5kYXRhO1xyXG4gICAgdmFyIHN3ID0gcGl4ZWxzLndpZHRoO1xyXG4gICAgdmFyIHNoID0gcGl4ZWxzLmhlaWdodDtcclxuICAgIC8vIHBhZCBvdXRwdXQgYnkgdGhlIGNvbnZvbHV0aW9uIG1hdHJpeFxyXG4gICAgdmFyIHcgPSBzdztcclxuICAgIHZhciBoID0gc2g7XHJcbiAgICB2YXIgb3V0cHV0ID0gVXRpbHMuZ2V0Q2FudmFzKHcsIGgpLmdldENvbnRleHQoXCIyZFwiKS5jcmVhdGVJbWFnZURhdGEodywgaCk7XHJcbiAgICB2YXIgZHN0ID0gb3V0cHV0LmRhdGE7XHJcbiAgICAvLyBnbyB0aHJvdWdoIHRoZSBkZXN0aW5hdGlvbiBpbWFnZSBwaXhlbHNcclxuICAgIHZhciBhbHBoYUZhYyA9IG9wYXF1ZSA/IDEgOiAwO1xyXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBoOyB5KyspIHtcclxuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHc7IHgrKykge1xyXG4gICAgICAgICAgICB2YXIgc3kgPSB5O1xyXG4gICAgICAgICAgICB2YXIgc3ggPSB4O1xyXG4gICAgICAgICAgICB2YXIgZHN0T2ZmID0gKHkgKiB3ICsgeCkgKiA0O1xyXG4gICAgICAgICAgICAvLyBjYWxjdWxhdGUgdGhlIHdlaWdoZWQgc3VtIG9mIHRoZSBzb3VyY2UgaW1hZ2UgcGl4ZWxzIHRoYXRcclxuICAgICAgICAgICAgLy8gZmFsbCB1bmRlciB0aGUgY29udm9sdXRpb24gbWF0cml4XHJcbiAgICAgICAgICAgIHZhciByID0gMCwgZyA9IDAsIGIgPSAwLCBhID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgY3kgPSAwOyBjeSA8IHNpZGU7IGN5KyspIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGN4ID0gMDsgY3ggPCBzaWRlOyBjeCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjeSA9IHN5ICsgY3kgLSBoYWxmU2lkZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2N4ID0gc3ggKyBjeCAtIGhhbGZTaWRlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY3kgPj0gMCAmJiBzY3kgPCBzaCAmJiBzY3ggPj0gMCAmJiBzY3ggPCBzdykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3JjT2ZmID0gKHNjeSAqIHN3ICsgc2N4KSAqIDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3dCA9IHdlaWdodHNbY3kgKiBzaWRlICsgY3hdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByICs9IHNyY1tzcmNPZmZdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGcgKz0gc3JjW3NyY09mZiArIDFdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgKz0gc3JjW3NyY09mZiArIDJdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgKz0gc3JjW3NyY09mZiArIDNdICogd3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRzdFtkc3RPZmZdID0gcjtcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDFdID0gZztcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDJdID0gYjtcclxuICAgICAgICAgICAgZHN0W2RzdE9mZiArIDNdID0gYSArIGFscGhhRmFjICogKDI1NSAtIGEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvdXRwdXQ7XHJcbn1cclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkJsdXIgPSBmdW5jdGlvbiAoaW1hZ2UsIGJsdXJSYWRpdXMpIHtcclxuICAgIHJldHVybiBzdGFja0JsdXJJbWFnZShpbWFnZSwgYmx1clJhZGl1cyk7XHJcbn1cclxuXHJcblJlbmRlckpzLkNhbnZhcy5GaWx0ZXJzLkdyYXlzY2FsZSA9IGZ1bmN0aW9uIChpbWFnZSwgYXJncykge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgdmFyIHIgPSBkW2ldO1xyXG4gICAgICAgIHZhciBnID0gZFtpICsgMV07XHJcbiAgICAgICAgdmFyIGIgPSBkW2kgKyAyXTtcclxuICAgICAgICAvLyBDSUUgbHVtaW5hbmNlIGZvciB0aGUgUkdCXHJcbiAgICAgICAgdmFyIHYgPSAwLjIxMjYgKiByICsgMC43MTUyICogZyArIDAuMDcyMiAqIGI7XHJcbiAgICAgICAgZFtpXSA9IGRbaSArIDFdID0gZFtpICsgMl0gPSB2XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGl4ZWxzO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQnJpZ2h0bmVzcyA9IGZ1bmN0aW9uIChpbWFnZSwgYWRqdXN0bWVudCkge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgZFtpXSArPSBhZGp1c3RtZW50O1xyXG4gICAgICAgIGRbaSArIDFdICs9IGFkanVzdG1lbnQ7XHJcbiAgICAgICAgZFtpICsgMl0gKz0gYWRqdXN0bWVudDtcclxuICAgIH1cclxuICAgIHJldHVybiBwaXhlbHM7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRmlsdGVycy5UaHJlc2hvbGQgPSBmdW5jdGlvbiAoaW1hZ2UsIHRocmVzaG9sZCkge1xyXG4gICAgdmFyIHBpeGVscyA9IFV0aWxzLmdldFBpeGVscyhpbWFnZSk7XHJcbiAgICB2YXIgZCA9IHBpeGVscy5kYXRhO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgaSArPSA0KSB7XHJcbiAgICAgICAgdmFyIHIgPSBkW2ldO1xyXG4gICAgICAgIHZhciBnID0gZFtpICsgMV07XHJcbiAgICAgICAgdmFyIGIgPSBkW2kgKyAyXTtcclxuICAgICAgICB2YXIgdiA9ICgwLjIxMjYgKiByICsgMC43MTUyICogZyArIDAuMDcyMiAqIGIgPj0gdGhyZXNob2xkKSA/IDI1NSA6IDA7XHJcbiAgICAgICAgZFtpXSA9IGRbaSArIDFdID0gZFtpICsgMl0gPSB2XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGl4ZWxzO1xyXG59O1xyXG4iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhc1wiKTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5MYXllciA9IGluamVjdChcIlV0aWxzXCIsIFwiRXZlbnREaXNwYXRjaGVyXCIsIFwialF1ZXJ5XCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBkaXNwYXRjaGVyLCAkLCBjb250YWluZXIsIHdpZHRoLCBoZWlnaHQsIGFjdGl2ZSkge1xyXG5cclxuICAgICAgICB2YXIgX3NlbGYgPSB0aGlzO1xyXG4gICAgICAgIHZhciBfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgX2Rpc3BhdGNoZXIgPSBuZXcgZGlzcGF0Y2hlcigpO1xyXG4gICAgICAgIHZhciBfdGltZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjb250YWluZXIpLmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKTtcclxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGFjdGl2ZTtcclxuICAgICAgICAvL0ZvciB0aGUgbGlua2VkIGxpc3RcclxuICAgICAgICB0aGlzLnByZXYgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vQXJyYXkgb2Ygb2JqZWN0cyBvbiB0aGUgbGF5ZXJcclxuICAgICAgICB0aGlzLm9iamVjdHMgPSBbXTtcclxuXHJcblxyXG4gICAgICAgIHZhciBfY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IFV0aWxzLmdldE1vdXNlUG9zKGV2ZW50LnRhcmdldCwgZXZlbnQpO1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMuY2xpY2ssIFtldmVudCwgcG9zaXRpb25dKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMub2JqZWN0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucy5wb2ludEluT2JqZWN0KHBvc2l0aW9uLCB0aGlzLm9iamVjdHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzW2ldLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5jbGljaywgZXZlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMucHJldikge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzLnByZXYuY2FudmFzKS50cmlnZ2VyKFwiY2xpY2tcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9tb3VzZW1vdmVIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IFV0aWxzLmdldE1vdXNlUG9zKGV2ZW50LnRhcmdldCwgZXZlbnQpO1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2Vtb3ZlLCBbZXZlbnQsIHBvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm9iamVjdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMucG9pbnRJbk9iamVjdChwb3NpdGlvbiwgdGhpcy5vYmplY3RzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0c1tpXS50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2Vtb3ZlLCBbZXZlbnQsIHBvc2l0aW9uXSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2KSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMucHJldi5jYW52YXMpLnRyaWdnZXIoXCJtb3VzZW1vdmVcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9tb3VzZWVudGVySGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCBVdGlscy5nZXRNb3VzZVBvcyhldmVudC50YXJnZXQsIGV2ZW50KTtcclxuICAgICAgICAgICAgX2Rpc3BhdGNoZXIudHJpZ2dlcihSZW5kZXJKcy5DYW52YXMuRXZlbnRzLm1vdXNlZW50ZXIsIFtldmVudCwgcG9zaXRpb25dKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMub2JqZWN0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucy5wb2ludEluT2JqZWN0KHBvc2l0aW9uLCB0aGlzLm9iamVjdHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RzW2ldLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZWVudGVyLCBbZXZlbnQsIHBvc2l0aW9uXSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2KSB7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMucHJldi5jYW52YXMpLnRyaWdnZXIoXCJtb3VzZWVudGVyXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfbW91c2VsZWF2ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0gcG9zaXRpb24gfHwgVXRpbHMuZ2V0TW91c2VQb3MoZXZlbnQudGFyZ2V0LCBldmVudCk7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5tb3VzZWxlYXZlLCBbZXZlbnQsIHBvc2l0aW9uXSk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSB0aGlzLm9iamVjdHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMucG9pbnRJbk9iamVjdChwb3NpdGlvbiwgdGhpcy5vYmplY3RzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0c1tpXS50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMubW91c2VsZWF2ZSwgW2V2ZW50LCBwb3NpdGlvbl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcy5wcmV2LmNhbnZhcykudHJpZ2dlcihcIm1vdXNlbGVhdmVcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIF9rZXlkb3duSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfZGlzcGF0Y2hlci50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMua2V5ZG93biwgZXZlbnQpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfa2V5dXBIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5rZXl1cCwgZXZlbnQpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBfa2V5cHJlc3NIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoUmVuZGVySnMuQ2FudmFzLkV2ZW50cy5rZXlwcmVzcywgZXZlbnQpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy9cclxuICAgICAgICAvL0V2ZW50IHdpcmV1cHNcclxuICAgICAgICAkKHRoaXMuY2FudmFzKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCwgcG9zaXRpb24pIHtcclxuICAgICAgICAgICAgX2NsaWNrSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCwgcG9zaXRpb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKHRoaXMuY2FudmFzKS5vbihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIF9tb3VzZW1vdmVIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50LCBwb3NpdGlvbik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICQodGhpcy5jYW52YXMpLm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIF9tb3VzZWVudGVySGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCwgcG9zaXRpb24pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKHRoaXMuY2FudmFzKS5vbihcIm1vdXNlbGVhdmVcIiwgZnVuY3Rpb24gKGV2ZW50LCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBfbW91c2VsZWF2ZUhhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQsIHBvc2l0aW9uKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfa2V5ZG93bkhhbmRsZXIuY2FsbChfc2VsZiwgZXZlbnQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkKGRvY3VtZW50KS5vbihcImtleXVwXCIsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBfa2V5dXBIYW5kbGVyLmNhbGwoX3NlbGYsIGV2ZW50KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkub24oXCJrZXlwcmVzc1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgX2tleXByZXNzSGFuZGxlci5jYWxsKF9zZWxmLCBldmVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAodHlwZSwgaGFuZGxlcikge1xyXG4gICAgICAgICAgICBpZiAoIVJlbmRlckpzLkNhbnZhcy5FdmVudHNbdHlwZV0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gX2Rpc3BhdGNoZXIuc3Vic2NyaWJlKHR5cGUsIGhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vQWRkIGFuIG9iamVjdCB0byB0aGUgbGF5ZXIsIGl0IHdpbGwgYmUgcmVuZGVyZWQgb24gdGhpcyBsYXllclxyXG4gICAgICAgIHRoaXMuYWRkT2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuT2JqZWN0KSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQW4gb2JqZWN0IG9uIHRoZSBjYW52YXMgc2hvdWxkIGJlIGluaGVyaXRlZCBmcm9tIENhbnZhc09iamVjdCFcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb2JqZWN0LmxheWVyID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5vYmplY3RzLnB1c2gob2JqZWN0KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL1JldHVybnMgdHJ1ZSBpZiB0aGUgbGF5ZXIgaGFzIHNwcml0ZSBvYmplY3RzIG90aGVyd2lzZSBmYWxzZVxyXG4gICAgICAgIHRoaXMuaGFzU3ByaXRlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IHRoaXMub2JqZWN0cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0c1tpXSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuU3ByaXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vUmVkcmF3IG9iamVjdHMgb24gbGF5ZXJzIGlmIGl0J3MgYWN0aXZlXHJcbiAgICAgICAgdGhpcy5kcmF3T2JqZWN0cyA9IGZ1bmN0aW9uIChmcmFtZSwgYWJzUG9zaXRpb24pIHtcclxuICAgICAgICAgICAgaWYgKChfaW5pdGlhbGl6ZWQgJiYgIV9kaXNwYXRjaGVyLmhhc1N1YnNjcmliZXJzKCdhbmltYXRlJykgJiYgIXRoaXMuaGFzU3ByaXRlcyh0aGlzKSAmJiAhdGhpcy5hY3RpdmUpIHx8IHRoaXMub2JqZWN0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGFrdEZyYW1lUmF0ZSA9IE1hdGguZmxvb3IoMTAwMCAvIGZyYW1lKTtcclxuXHJcbiAgICAgICAgICAgIF9kaXNwYXRjaGVyLnRyaWdnZXIoXCJhbmltYXRlXCIsIGZyYW1lKTtcclxuICAgICAgICAgICAgdmFyIG9iamVjdHNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gdGhpcy5vYmplY3RzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMub2JqZWN0c1tpXS5sb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3RzTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdHNbaV0uZHJhdyh0aGlzLmN0eCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lUmF0ZTogZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFRpbWU6IF90aW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpbWU6IF90aW1lICsgYWt0RnJhbWVSYXRlXHJcbiAgICAgICAgICAgICAgICB9LCBhYnNQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKG9iamVjdHNMb2FkZWQpXHJcbiAgICAgICAgICAgICAgICBfaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBfdGltZSArPSBha3RGcmFtZVJhdGU7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuIiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkV2ZW50cyA9IHtcclxuICAgIGFuaW1hdGU6IFwiYW5pbWF0ZVwiLFxyXG4gICAgY2xpY2s6IFwiY2xpY2tcIixcclxuICAgIGtleWRvd246IFwia2V5ZG93blwiLFxyXG4gICAga2V5dXA6IFwia2V5dXBcIixcclxuICAgIGtleXByZXNzOiBcImtleXByZXNzXCIsXHJcbiAgICBtb3VzZW1vdmU6IFwibW91c2Vtb3ZlXCIsXHJcbiAgICBtb3VzZWhvdmVyOiBcIm1vdXNlaG92ZXJcIixcclxuICAgIG1vdXNlbGVhdmU6IFwibW91c2VsZWF2ZVwiLFxyXG4gICAgY29sbGlzaW9uOiBcImNvbGxpc2lvblwiLFxyXG4gICAgb2JqZWN0Q2hhbmdlZDogXCJvYmplY3RDaGFuZ2VkXCJcclxufTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIGJhc2UgY2xhc3MgZm9yIGRpZmZlcmVudCB0eXBlIG9mIHNoYXBlc1xyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLk9iamVjdCA9IGluamVjdChcIkV2ZW50RGlzcGF0Y2hlclwiLCBcImpRdWVyeVwiLCBcIlV0aWxzXCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKGRpc3BhdGNoZXIsICQsIHV0aWxzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IG5ldyBkaXNwYXRjaGVyKCk7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIHRoaXMuaWQgPSB1dGlscy5nZXRHdWlkKCk7XHJcbiAgICAgICAgdGhpcy5wb3MgPSBuZXcgUmVuZGVySnMuVmVjdG9yKG9wdGlvbnMueCwgb3B0aW9ucy55KTtcclxuICAgICAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aCB8fCAwO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgMDtcclxuICAgICAgICB0aGlzLmFuZ2xlID0gb3B0aW9ucy5hbmdsZSB8fCAwO1xyXG4gICAgICAgIHRoaXMuc2NhbGVYID0gb3B0aW9ucy5zY2FsZVg7XHJcbiAgICAgICAgdGhpcy5zY2FsZVkgPSBvcHRpb25zLnNjYWxlWTtcclxuICAgICAgICB0aGlzLmJsdXJSYWRpdXMgPSBvcHRpb25zLmJsdXJSYWRpdXM7XHJcbiAgICAgICAgdGhpcy5jb2xsaXNpb24gPSBvcHRpb25zLmNvbGxpc2lvbiB8fCBmYWxzZTtcclxuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmxheWVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpSZXR1cm5zIHdpdGggdGhlIGNlbnRlciBwb2ludCBvZiB0aGUgc2hhcGVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldENlbnRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy5wb3MueCArICh0aGlzLndpZHRoKSAvIDIsIHRoaXMucG9zLnkgKyAodGhpcy5oZWlnaHQpIC8gMik7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKlxyXG4gICAgICAgICAqUmV0dXJucyB3aXRoIHRoZSByZWN0IGFyb3VuZCB0aGUgc2hhcGVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmdldENlbnRlcmVkUmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIG8gPSB0aGlzLnBvcztcclxuICAgICAgICAgICAgcmV0dXJuIHt4OiBvLngsIHk6IG8ueSwgd2lkdGg6IHRoaXMud2lkdGgsIGhlaWdodDogdGhpcy5oZWlnaHR9O1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBGaWx0ZXJzIHdoaWNoIHdpbGwgYmUgYXBwbGllZCBvbiB0aGUgb2JqZWN0KGJsdXIsIGdyZXlzY2FsZSBldGMuLi4pXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zZXRmaWx0ZXJzID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5maWx0ZXJzID0gZmlsdGVycztcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGRYLCBkWSkge1xyXG4gICAgICAgICAgICB2YXIgcHJldlBvcyA9IFJlbmRlckpzLlZlY3Rvci5jbG9uZSh0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcclxuICAgICAgICAgICAgdmFyIG5ld1BvcyA9IHRoaXMucG9zLmFkZChuZXcgUmVuZGVySnMuVmVjdG9yKGRYLCBkWSkpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcyA9IG5ld1BvcztcclxuICAgICAgICAgICAgaWYgKHByZXZQb3MueCAhPT0gbmV3UG9zLnggfHwgcHJldlBvcy55ICE9PSBuZXdQb3MueSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFJlbmRlckpzLkNhbnZhcy5FdmVudHMub2JqZWN0Q2hhbmdlZCwgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqUm90YXRlIHRoZSBzaGFwZSB0byB0aGUgZ2l2ZW4gZGVncmVlLCBkdXJpbmcgdGhlIHRpbWVcclxuICAgICAgICAgKi1kZWcgcm90YXRpb24gYW5nbGVcclxuICAgICAgICAgKi10IGFuaW1hdGlvbiB0aW1lXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5yb3RhdGVTaGFwZSA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoby54LCBvLnkpO1xyXG4gICAgICAgICAgICBjdHgucm90YXRlKHV0aWxzLmNvbnZlcnRUb1JhZCh0aGlzLmFuZ2xlKSk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLW8ueCwgLW8ueSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKlNjYWxlIHRoZSBzaGFwZSB3aXRoIHRoZSBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0LCBkdXJpbmcgdGhlIHRpbWVcclxuICAgICAgICAgKi13aWR0aCBzY2FsZSBob3Jpem9udGFsbHkgcmF0aW8gaW50ZWdlciAxIGlzIDEwMCVcclxuICAgICAgICAgKi1oZWlnaHQgc2NhbGUgdmVydGljYWxseSByYXRpbyBpbnRlZ2VyIDEgaXMgMTAwJVxyXG4gICAgICAgICAqLXQgYW5pbWF0aW9uIHRpbWVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnNjYWxlU2hhcGUgPSBmdW5jdGlvbiAoY3R4LCBzY2FsZVgsIHNjYWxlWSkge1xyXG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoby54LCBvLnkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoc2NhbGVYLCBzY2FsZVkpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKC1vLngsIC1vLnkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbiAodHlwZSwgaGFuZGxlcikge1xyXG4gICAgICAgICAgICBpZiAoIVJlbmRlckpzLkNhbnZhcy5FdmVudHNbdHlwZV0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwYXRjaGVyLnN1YnNjcmliZSh0eXBlLCBoYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIgPSBmdW5jdGlvbiAoZXZlbnQsIGFyZ3MpIHtcclxuICAgICAgICAgICAgaWYgKCFSZW5kZXJKcy5DYW52YXMuRXZlbnRzW2V2ZW50XSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci50cmlnZ2VyKGV2ZW50LCBhcmdzKTtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwiLyoqXHJcbiAqIENyZWF0ZWQgYnkgTUNHIG9uIDIwMTUuMDEuMjUuLlxyXG4gKi9cclxudmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblJlbmRlckpzLkNhbnZhcyA9IFJlbmRlckpzLkNhbnZhcyB8fCB7fTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5TcGFjZSA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIF9pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICB0aGlzLnN0YWdlID0gb3B0aW9ucy5zdGFnZTtcclxuICAgIH07XHJcbiAgICBfaW5pdChvcHRpb25zKTtcclxufSIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzXCIpO1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLlN0YWdlID0gaW5qZWN0KFwiVXRpbHNcIiwgXCJFdmVudERpc3BhdGNoZXJcIiwgXCJMaW5rZWRMaXN0XCIpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBkaXNwYXRjaGVyLCBsaW5rZWRMaXN0LCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHZhciBfY29udGFpbmVyID0gb3B0aW9ucy5jb250YWluZXIgfHwgXCJ2aWV3cG9ydFwiO1xyXG4gICAgICAgIHZhciBfY3VycmVudEZwcyA9IDA7XHJcbiAgICAgICAgdmFyIF9kaXNwYXRjaGVyID0gbmV3IGRpc3BhdGNoZXIoKTtcclxuICAgICAgICB0aGlzLmxheWVycyA9IG5ldyBsaW5rZWRMaXN0KCk7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgMTIwMDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IDgwMDtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFJlbmRlckpzLlZlY3RvcigtNTAsIC01MCk7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoX2NvbnRhaW5lcikuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgXCJweFwiO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKF9jb250YWluZXIpLnN0eWxlLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgXCJweFwiO1xyXG5cclxuICAgICAgICB2YXIgX2ludmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgX2N1cnJlbnRGcHMgPSB1dGlscy5nZXRGcHMoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcy5sYXllcnMuZ2V0RW51bWVyYXRvcigpO1xyXG4gICAgICAgICAgICB3aGlsZSAoZW51bWVyYXRvci5uZXh0KCkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgZW51bWVyYXRvci5jdXJyZW50KCkuZHJhd09iamVjdHMoX2N1cnJlbnRGcHMsIHRoaXMucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgX2ludmFsaWRhdGUuY2FsbChzZWxmKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBfaW52YWxpZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLm9uSW52YWxpZGF0ZSA9IGZ1bmN0aW9uIChoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfZGlzcGF0Y2hlci5zdWJzY3JpYmUoXCJvbkludmFsaWRhdGVcIiwgaGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jcmVhdGVMYXllciA9IGZ1bmN0aW9uIChhY3RpdmUpIHtcclxuICAgICAgICAgICAgdmFyIGxheWVyID0gbmV3IFJlbmRlckpzLkNhbnZhcy5MYXllcihfY29udGFpbmVyLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgYWN0aXZlKTtcclxuICAgICAgICAgICAgdGhpcy5sYXllcnMuYXBwZW5kKGxheWVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBsYXllcjtcclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwidmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblJlbmRlckpzLkNhbnZhcyA9IFJlbmRlckpzLkNhbnZhcyB8fCB7fTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzID0gUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MgfHwge307XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5Cb3VuY2VFYXNlT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIGlmICgodCAvPSBkKSA8ICgxIC8gMi43NSkpIHtcclxuICAgICAgICByZXR1cm4gYyAqICg3LjU2MjUgKiB0ICogdCkgKyBiO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodCA8ICgyIC8gMi43NSkpIHtcclxuICAgICAgICByZXR1cm4gYyAqICg3LjU2MjUgKiAodCAtPSAoMS41IC8gMi43NSkpICogdCArIDAuNzUpICsgYjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHQgPCAoMi41IC8gMi43NSkpIHtcclxuICAgICAgICByZXR1cm4gYyAqICg3LjU2MjUgKiAodCAtPSAoMi4yNSAvIDIuNzUpKSAqIHQgKyAwLjkzNzUpICsgYjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBjICogKDcuNTYyNSAqICh0IC09ICgyLjYyNSAvIDIuNzUpKSAqIHQgKyAwLjk4NDM3NSkgKyBiO1xyXG4gICAgfVxyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuQm91bmNlRWFzZUluID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIHJldHVybiBjIC0gS2luZXRpYy5FYXNpbmdzLkJvdW5jZUVhc2VPdXQoZCAtIHQsIDAsIGMsIGQpICsgYjtcclxufTtcclxuXHJcblJlbmRlckpzLkNhbnZhcy5FYXNpbmdzLkJvdW5jZUVhc2VJbk91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICBpZiAodCA8IGQgLyAyKSB7XHJcbiAgICAgICAgcmV0dXJuIEtpbmV0aWMuRWFzaW5ncy5Cb3VuY2VFYXNlSW4odCAqIDIsIDAsIGMsIGQpICogMC41ICsgYjtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBLaW5ldGljLkVhc2luZ3MuQm91bmNlRWFzZU91dCh0ICogMiAtIGQsIDAsIGMsIGQpICogMC41ICsgYyAqIDAuNSArIGI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FYXNlSW4gPSBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xyXG4gICAgcmV0dXJuIGMgKiAodCAvPSBkKSAqIHQgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWFzZU91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkKSB7XHJcbiAgICByZXR1cm4gLWMgKiAodCAvPSBkKSAqICh0IC0gMikgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWFzZUluT3V0ID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQpIHtcclxuICAgIGlmICgodCAvPSBkIC8gMikgPCAxKSB7XHJcbiAgICAgICAgcmV0dXJuIGMgLyAyICogdCAqIHQgKyBiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIC1jIC8gMiAqICgoLS10KSAqICh0IC0gMikgLSAxKSArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FbGFzdGljRWFzZUluID0gZnVuY3Rpb24gKHQsIGIsIGMsIGQsIGEsIHApIHtcclxuICAgIC8vIGFkZGVkIHMgPSAwXHJcbiAgICB2YXIgcyA9IDA7XHJcbiAgICBpZiAodCA9PT0gMCkge1xyXG4gICAgICAgIHJldHVybiBiO1xyXG4gICAgfVxyXG4gICAgaWYgKCh0IC89IGQpID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIGIgKyBjO1xyXG4gICAgfVxyXG4gICAgaWYgKCFwKSB7XHJcbiAgICAgICAgcCA9IGQgKiAwLjM7XHJcbiAgICB9XHJcbiAgICBpZiAoIWEgfHwgYSA8IE1hdGguYWJzKGMpKSB7XHJcbiAgICAgICAgYSA9IGM7XHJcbiAgICAgICAgcyA9IHAgLyA0O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgcyA9IHAgLyAoMiAqIE1hdGguUEkpICogTWF0aC5hc2luKGMgLyBhKTtcclxuICAgIH1cclxuICAgIHJldHVybiAtKGEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogZCAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKSArIGI7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FbGFzdGljRWFzZU91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkLCBhLCBwKSB7XHJcbiAgICAvLyBhZGRlZCBzID0gMFxyXG4gICAgdmFyIHMgPSAwO1xyXG4gICAgaWYgKHQgPT09IDApIHtcclxuICAgICAgICByZXR1cm4gYjtcclxuICAgIH1cclxuICAgIGlmICgodCAvPSBkIC8gMikgPT09IDIpIHtcclxuICAgICAgICByZXR1cm4gYiArIGM7XHJcbiAgICB9XHJcbiAgICBpZiAoIXApIHtcclxuICAgICAgICBwID0gZCAqICgwLjMgKiAxLjUpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhIHx8IGEgPCBNYXRoLmFicyhjKSkge1xyXG4gICAgICAgIGEgPSBjO1xyXG4gICAgICAgIHMgPSBwIC8gNDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbihjIC8gYSk7XHJcbiAgICB9XHJcbiAgICBpZiAodCA8IDEpIHtcclxuICAgICAgICByZXR1cm4gLTAuNSAqIChhICogTWF0aC5wb3coMiwgMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIGQgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSkgKyBiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIGQgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSAqIDAuNSArIGMgKyBiO1xyXG59O1xyXG5cclxuUmVuZGVySnMuQ2FudmFzLkVhc2luZ3MuRWxhc3RpY0Vhc2VJbk91dCA9IGZ1bmN0aW9uICh0LCBiLCBjLCBkLCBhLCBwKSB7XHJcbiAgICAvLyBhZGRlZCBzID0gMFxyXG4gICAgdmFyIHMgPSAwO1xyXG4gICAgaWYgKHQgPT09IDApIHtcclxuICAgICAgICByZXR1cm4gYjtcclxuICAgIH1cclxuICAgIGlmICgodCAvPSBkIC8gMikgPT09IDIpIHtcclxuICAgICAgICByZXR1cm4gYiArIGM7XHJcbiAgICB9XHJcbiAgICBpZiAoIXApIHtcclxuICAgICAgICBwID0gZCAqICgwLjMgKiAxLjUpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFhIHx8IGEgPCBNYXRoLmFicyhjKSkge1xyXG4gICAgICAgIGEgPSBjO1xyXG4gICAgICAgIHMgPSBwIC8gNDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbihjIC8gYSk7XHJcbiAgICB9XHJcbiAgICBpZiAodCA8IDEpIHtcclxuICAgICAgICByZXR1cm4gLTAuNSAqIChhICogTWF0aC5wb3coMiwgMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIGQgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSkgKyBiO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIGQgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSAqIDAuNSArIGMgKyBiO1xyXG59O1xyXG5cclxuXHJcblxyXG5SZW5kZXJKcy5DYW52YXMuVHJhbnNpdGlvbiA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIHJldmVyc2UgPSBmYWxzZTtcclxuXHJcbiAgICB0aGlzLmR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiAqIDEwMDAgfHwgMTAwMDtcclxuXHJcbiAgICB0aGlzLnNoYXBlID0gb3B0aW9ucy5zaGFwZTtcclxuXHJcbiAgICB0aGlzLnByb3BzID0gb3B0aW9ucy5wcm9wcyB8fCB7fTtcclxuICAgIHRoaXMub3JpZ1Byb3BzID0ge307XHJcbiAgICBmb3IgKHZhciBwcm9wIGluIG9wdGlvbnMucHJvcHMpIHtcclxuICAgICAgICB0aGlzLm9yaWdQcm9wc1twcm9wXSA9IHRoaXMuc2hhcGVbcHJvcF07XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lYXNpbmcgPSBvcHRpb25zLmVhc2luZyB8fCBSZW5kZXJKcy5DYW52YXMuRWFzaW5ncy5FYXNlSW5PdXQ7XHJcblxyXG4gICAgdmFyIGFuaW1hdGlvbiA9IG5ldyBSZW5kZXJKcy5DYW52YXMuQW5pbWF0aW9uKGZ1bmN0aW9uIChmcmFtZSkge1xyXG4gICAgICAgIGlmIChmcmFtZS50aW1lID49IHNlbGYuZHVyYXRpb24pIHtcclxuICAgICAgICAgICAgYW5pbWF0aW9uLnN0b3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzZWxmLnByb3BzKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXZlcnNlKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNoYXBlW3Byb3BdID0gc2VsZi5lYXNpbmcoZnJhbWUudGltZSwgc2VsZi5vcmlnUHJvcHNbcHJvcF0gKyBzZWxmLnByb3BzW3Byb3BdLCBzZWxmLnByb3BzW3Byb3BdICogLTEsIHNlbGYuZHVyYXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zaGFwZVtwcm9wXSA9IHNlbGYuZWFzaW5nKGZyYW1lLnRpbWUsIHNlbGYub3JpZ1Byb3BzW3Byb3BdLCBzZWxmLnByb3BzW3Byb3BdLCBzZWxmLmR1cmF0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LCB0aGlzLnNoYXBlLmxheWVyKTtcclxuXHJcbiAgICB0aGlzLnBsYXkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYW5pbWF0aW9uLnN0YXJ0KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYW5pbWF0aW9uLnBhdXNlKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhbmltYXRpb24uc3RvcCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV2ZXJzZSA9IHRydWU7XHJcbiAgICAgICAgYW5pbWF0aW9uLnN0YXJ0KCk7XHJcbiAgICB9O1xyXG59IiwidmFyIFJlbmRlckpzID0gUmVuZGVySnMgfHwge307XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IgPSBmdW5jdGlvbiAoeCwgeSkge1xyXG4gICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgdGhpcy55ID0geSB8fCAwO1xyXG5cclxuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICB0aGlzLnggPSB2Lng7XHJcbiAgICAgICAgdGhpcy55ID0gdi55O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aFNxdWFyZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KHRoaXMueCwgMikgKyBNYXRoLnBvdyh0aGlzLnksIDIpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3F1YXJlZCgpKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5sZW5ndGgyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRvdCh0aGlzKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wZXJwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueSwgLXRoaXMueCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2NhbGUgPSBmdW5jdGlvbiAocykge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMueCAqIHMsIHRoaXMueSAqIHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnN1YiA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgaWYgKHYgaW5zdGFuY2VvZiBSZW5kZXJKcy5WZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy54IC0gdi54LCB0aGlzLnkgLSB2LnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy54IC0gdiwgdGhpcy55IC0gdik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgaWYgKHYgaW5zdGFuY2VvZiBSZW5kZXJKcy5WZWN0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy54ICsgdi54LCB0aGlzLnkgKyB2LnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodGhpcy54ICsgdiwgdGhpcy55ICsgdik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmRvdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5kaXN0ID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdWIodikubGVuZ3RoKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubm9ybWFsaXplID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlKDEgLyB0aGlzLmxlbmd0aCgpKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hbmdsZSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG90KHYpIC8gKHRoaXMubGVuZ3RoKCkgKiB2Lmxlbmd0aCgpKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy50cnVuY2F0ZSA9IGZ1bmN0aW9uIChtYXgpIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gTWF0aC5taW4obWF4LCB0aGlzLmxlbmd0aCgpKTtcclxuICAgICAgICByZXR1cm4gbGVuZ3RoO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJvdGF0ZSA9IGZ1bmN0aW9uIChhbmdsZSkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xyXG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xyXG4gICAgICAgIHRoaXMueCA9IHggKiAgTWF0aC5jb3MoVXRpbHMuY29udmVydFRvUmFkKGFuZ2xlKSkgLSB5ICogTWF0aC5zaW4oVXRpbHMuY29udmVydFRvUmFkKGFuZ2xlKSk7XHJcbiAgICAgICAgdGhpcy55ID0geSAqICBNYXRoLmNvcyhVdGlscy5jb252ZXJ0VG9SYWQoYW5nbGUpKSArIHggKiBNYXRoLnNpbihVdGlscy5jb252ZXJ0VG9SYWQoYW5nbGUpKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIChyb3VuZGVkKSB7XHJcbiAgICAgICAgaWYgKHJvdW5kZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwiKFwiICsgTWF0aC5yb3VuZCh0aGlzLngpICsgXCIsIFwiICsgTWF0aC5yb3VuZCh0aGlzLnkpICsgXCIpXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gXCIoXCIgKyB0aGlzLnggKyBcIiwgXCIgKyB0aGlzLnkgKyBcIilcIjtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5jbG9uZSA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICByZXR1cm4gbmV3IFJlbmRlckpzLlZlY3Rvcih4LCB5KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgdGhlIGFyZWEgb2YgYSB0cmlhbmdsZSBzcGFubmVkIGJ5IHRoZSB0aHJlZSBnaXZlbiBwb2ludHMuIE5vdGUgdGhhdCB0aGUgYXJlYSB3aWxsIGJlIG5lZ2F0aXZlIGlmIHRoZSBwb2ludHMgYXJlIG5vdCBnaXZlbiBpbiBjb3VudGVyLWNsb2Nrd2lzZSBvcmRlci5cclxuICogQHN0YXRpY1xyXG4gKiBAbWV0aG9kIGFyZWFcclxuICogQHBhcmFtICB7QXJyYXl9IGFcclxuICogQHBhcmFtICB7QXJyYXl9IGJcclxuICogQHBhcmFtICB7QXJyYXl9IGNcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuUmVuZGVySnMuVmVjdG9yLmFyZWEgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgcmV0dXJuICgoKGIueCAtIGEueCkgKiAoYy55IC0gYS55KSkgLSAoKGMueCAtIGEueCkgKiAoYi55IC0gYS55KSkpO1xyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLmxlZnQgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5hcmVhKGEsIGIsIGMpID4gMDtcclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5sZWZ0T24gPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5hcmVhKGEsIGIsIGMpID49IDA7XHJcbn07XHJcblxyXG5SZW5kZXJKcy5WZWN0b3IucmlnaHQgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xyXG4gICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5hcmVhKGEsIGIsIGMpIDwgMDtcclxufTtcclxuXHJcblJlbmRlckpzLlZlY3Rvci5yaWdodE9uID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcclxuICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuYXJlYShhLCBiLCBjKSA8PSAwO1xyXG59O1xyXG5cclxuUmVuZGVySnMuVmVjdG9yLnNxZGlzdCA9IGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICB2YXIgZHggPSBiLnggLSBhLng7XHJcbiAgICB2YXIgZHkgPSBiLnkgLSBhLnk7XHJcbiAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBTY2FsYXIoKSB7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiB0d28gc2NhbGFycyBhcmUgZXF1YWxcclxuICogQHN0YXRpY1xyXG4gKiBAbWV0aG9kIGVxXHJcbiAqIEBwYXJhbSAge051bWJlcn0gYVxyXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGJcclxuICogQHBhcmFtICB7TnVtYmVyfSBbcHJlY2lzaW9uXVxyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gKi9cclxuU2NhbGFyLmVxID0gZnVuY3Rpb24gKGEsIGIsIHByZWNpc2lvbikge1xyXG4gICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IDA7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoYSAtIGIpIDwgcHJlY2lzaW9uO1xyXG59OyIsInZhciBSZW5kZXJKcyA9IFJlbmRlckpzIHx8IHt9O1xyXG5SZW5kZXJKcy5QaHlzaWNzID0gUmVuZGVySnMuUGh5c2ljcyB8fCB7fTtcclxuXHJcblJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucyA9IChmdW5jdGlvbiAobW9kdWxlKSB7XHJcblxyXG4gICAgdmFyIF9yYXlDYXN0aW5nQWxnID0gZnVuY3Rpb24gKHAsIGVkZ2UpIHtcclxuICAgICAgICAndGFrZXMgYSBwb2ludCBwPVB0KCkgYW5kIGFuIGVkZ2Ugb2YgdHdvIGVuZHBvaW50cyBhLGI9UHQoKSBvZiBhIGxpbmUgc2VnbWVudCByZXR1cm5zIGJvb2xlYW4nO1xyXG4gICAgICAgIHZhciBfZXBzID0gMC4wMDAwMTtcclxuICAgICAgICB2YXIgX2h1Z2UgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIHZhciBfdGlueSA9IE51bWJlci5NSU5fVkFMVUU7XHJcbiAgICAgICAgdmFyIG1fYmx1ZSwgbV9yZWQgPSAwO1xyXG4gICAgICAgIHZhciBhID0gZWRnZS5wMTtcclxuICAgICAgICB2YXIgYiA9IGVkZ2UucDI7XHJcblxyXG4gICAgICAgIGlmIChhLnkgPiBiLnkpIHtcclxuICAgICAgICAgICAgYS5zZXQoYik7XHJcbiAgICAgICAgICAgIGIuc2V0KGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocC55ID09IGEueSB8fCBwLnkgPT0gYi55KVxyXG4gICAgICAgICAgICBwLnkgKz0gX2VwcztcclxuXHJcbiAgICAgICAgdmFyIGludGVyc2VjdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoKHAueSA+IGIueSB8fCBwLnkgPCBhLnkpIHx8IChwLnggPiBNYXRoLm1heChhLngsIGIueCkpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChwLnggPCBNYXRoLm1pbihhLngsIGIueCkpXHJcbiAgICAgICAgICAgIGludGVyc2VjdCA9IHRydWU7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhhLnggLSBiLngpID4gX3RpbnkpXHJcbiAgICAgICAgICAgICAgICBtX3JlZCA9IChiLnkgLSBhLnkpIC8gKGIueCAtIGEueCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIG1fcmVkID0gX2h1Z2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoYS54IC0gcC54KSA+IF90aW55KVxyXG4gICAgICAgICAgICAgICAgbV9ibHVlID0gKHAueSAtIGEueSkgLyAocC54IC0gYS54KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbV9ibHVlID0gX2h1Z2VcclxuICAgICAgICAgICAgaW50ZXJzZWN0ID0gbV9ibHVlID49IG1fcmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3Zvcm5vaVJlZ2lvbiA9IGZ1bmN0aW9uIChsaW5lLCBwb2ludCkge1xyXG4gICAgICAgIHZhciBsZW4yID0gbGluZS5sZW5ndGgyKCk7XHJcbiAgICAgICAgdmFyIGRwID0gcG9pbnQuZG90KGxpbmUpO1xyXG4gICAgICAgIC8vIElmIHRoZSBwb2ludCBpcyBiZXlvbmQgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lLCBpdCBpcyBpbiB0aGVcclxuICAgICAgICAvLyBsZWZ0IHZvcm5vaSByZWdpb24uXHJcbiAgICAgICAgaWYgKGRwIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIElmIHRoZSBwb2ludCBpcyBiZXlvbmQgdGhlIGVuZCBvZiB0aGUgbGluZSwgaXQgaXMgaW4gdGhlXHJcbiAgICAgICAgLy8gcmlnaHQgdm9ybm9pIHJlZ2lvbi5cclxuICAgICAgICBlbHNlIGlmIChkcCA+IGxlbjIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE90aGVyd2lzZSwgaXQncyBpbiB0aGUgbWlkZGxlIG9uZS5cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcG9pbnRJblBvbHlnb24gPSBmdW5jdGlvbiAocCwgcG9seWdvbikge1xyXG4gICAgICAgIHZhciByZXMgPSBmYWxzZTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvbHlnb24uckVkZ2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChfcmF5Q2FzdGluZ0FsZyhwLCBwb2x5Z29uLnJFZGdlc1tpXSkpXHJcbiAgICAgICAgICAgICAgICByZXMgPSAhcmVzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfcG9pbnRJbkxpbmUgPSBmdW5jdGlvbiAocCwgbGluZSkge1xyXG4gICAgICAgIHZhciBtID0gKGxpbmUucG9zMi55IC0gbGluZS5wb3MueSkgLyAobGluZS5wb3MyLnggLSBsaW5lLnBvcy54KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHAueSAtIGxpbmUucG9zLnkgPT0gbSAqIChwLnggLSBsaW5lLnBvcy55KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX3BvaW50SW5DaXJjbGUgPSBmdW5jdGlvbiAocCwgYykge1xyXG4gICAgICAgIG8gPSBjLmdldENlbnRlcigpO1xyXG5cclxuICAgICAgICByZXR1cm4gTWF0aC5wb3cocC54IC0gby54LCAyKSArIE1hdGgucG93KHAueSAtIG8ueSwgMikgPD0gTWF0aC5wb3coKHRoaXMud2lkdGggLyAyKSwgMik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9yZWN0VnNSZWN0ID0gZnVuY3Rpb24gKHIxLCByMikge1xyXG4gICAgICAgIHZhciB0dyA9IHIxLndpZHRoO1xyXG4gICAgICAgIHZhciB0aCA9IHIxLmhlaWdodDtcclxuICAgICAgICB2YXIgcncgPSByMi53aWR0aDtcclxuICAgICAgICB2YXIgcmggPSByMi5oZWlnaHQ7XHJcbiAgICAgICAgaWYgKHJ3IDw9IDAgfHwgcmggPD0gMCB8fCB0dyA8PSAwIHx8IHRoIDw9IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdHggPSByMS54O1xyXG4gICAgICAgIHZhciB0eSA9IHIxLnk7XHJcbiAgICAgICAgdmFyIHJ4ID0gcjIueDtcclxuICAgICAgICB2YXIgcnkgPSByMi55O1xyXG4gICAgICAgIHJ3ICs9IHJ4O1xyXG4gICAgICAgIHJoICs9IHJ5O1xyXG4gICAgICAgIHR3ICs9IHR4O1xyXG4gICAgICAgIHRoICs9IHR5O1xyXG4gICAgICAgIC8vb3ZlcmZsb3cgfHwgaW50ZXJzZWN0XHJcbiAgICAgICAgcmV0dXJuICgocncgPCByeCB8fCBydyA+IHR4KSAmJlxyXG4gICAgICAgIChyaCA8IHJ5IHx8IHJoID4gdHkpICYmXHJcbiAgICAgICAgKHR3IDwgdHggfHwgdHcgPiByeCkgJiZcclxuICAgICAgICAodGggPCB0eSB8fCB0aCA+IHJ5KSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9yZWN0VnNDaXJjbGUgPSBmdW5jdGlvbiAociwgYykge1xyXG4gICAgICAgIHJldHVybiBfcG9pbnRJblJlY3RhbmdsZShjLmdldENlbnRlcigpLCByKSB8fFxyXG4gICAgICAgICAgICBfbGluZVZzQ2lyY2xlKHIudG9wRWRnZSgpLCBjKSB8fFxyXG4gICAgICAgICAgICBfbGluZVZzQ2lyY2xlKHIucmlnaHRFZGdlKCksIGMpIHx8XHJcbiAgICAgICAgICAgIF9saW5lVnNDaXJjbGUoci5ib3R0b21FZGdlKCksIGMpIHx8XHJcbiAgICAgICAgICAgIF9saW5lVnNDaXJjbGUoci5sZWZ0RWRnZSgpLCBjKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgX2xpbmVWc0NpcmNsZSA9IGZ1bmN0aW9uIChsLCBjKSB7XHJcbiAgICAgICAgdmFyIGNvID0gYy5nZXRDZW50ZXIoKTtcclxuICAgICAgICB2YXIgciA9IGMucmFkaXVzO1xyXG4gICAgICAgIHZhciBkID0gbmV3IFJlbmRlckpzLlZlY3RvcihsLnBvczIueCAtIGwucG9zLngsIGwucG9zMi55IC0gbC5wb3MueSk7XHJcbiAgICAgICAgdmFyIGYgPSBuZXcgUmVuZGVySnMuVmVjdG9yKGwucG9zLnggLSBjby54LCBsLnBvcy55IC0gY28ueSk7XHJcblxyXG4gICAgICAgIHZhciBhID0gZC5kb3QoZCk7XHJcbiAgICAgICAgdmFyIGIgPSAyICogZi5kb3QoZCk7XHJcbiAgICAgICAgdmFyIGMgPSBmLmRvdChmKSAtIHIgKiByO1xyXG5cclxuICAgICAgICB2YXIgZGlzY3JpbWluYW50ID0gYiAqIGIgLSA0ICogYSAqIGM7XHJcblxyXG4gICAgICAgIGlmIChkaXNjcmltaW5hbnQgPCAwKSB7XHJcbiAgICAgICAgICAgIC8vIG5vIGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyByYXkgZGlkbid0IHRvdGFsbHkgbWlzcyBzcGhlcmUsXHJcbiAgICAgICAgICAgIC8vIHNvIHRoZXJlIGlzIGEgc29sdXRpb24gdG9cclxuICAgICAgICAgICAgLy8gdGhlIGVxdWF0aW9uLlxyXG5cclxuICAgICAgICAgICAgZGlzY3JpbWluYW50ID0gTWF0aC5zcXJ0KGRpc2NyaW1pbmFudCk7XHJcblxyXG4gICAgICAgICAgICAvLyBlaXRoZXIgc29sdXRpb24gbWF5IGJlIG9uIG9yIG9mZiB0aGUgcmF5IHNvIG5lZWQgdG8gdGVzdCBib3RoXHJcbiAgICAgICAgICAgIC8vIHQxIGlzIGFsd2F5cyB0aGUgc21hbGxlciB2YWx1ZSwgYmVjYXVzZSBCT1RIIGRpc2NyaW1pbmFudCBhbmRcclxuICAgICAgICAgICAgLy8gYSBhcmUgbm9ubmVnYXRpdmUuXHJcbiAgICAgICAgICAgIHZhciB0MSA9ICgtYiAtIGRpc2NyaW1pbmFudCkgLyAoMiAqIGEpO1xyXG4gICAgICAgICAgICB2YXIgdDIgPSAoLWIgKyBkaXNjcmltaW5hbnQpIC8gKDIgKiBhKTtcclxuXHJcbiAgICAgICAgICAgIC8vIDN4IEhJVCBjYXNlczpcclxuICAgICAgICAgICAgLy8gICAgICAgICAgLW8tPiAgICAgICAgICAgICAtLXwtLT4gIHwgICAgICAgICAgICB8ICAtLXwtPlxyXG4gICAgICAgICAgICAvLyBJbXBhbGUodDEgaGl0LHQyIGhpdCksIFBva2UodDEgaGl0LHQyPjEpLCBFeGl0V291bmQodDE8MCwgdDIgaGl0KSwgXHJcblxyXG4gICAgICAgICAgICAvLyAzeCBNSVNTIGNhc2VzOlxyXG4gICAgICAgICAgICAvLyAgICAgICAtPiAgbyAgICAgICAgICAgICAgICAgICAgIG8gLT4gICAgICAgICAgICAgIHwgLT4gfFxyXG4gICAgICAgICAgICAvLyBGYWxsU2hvcnQgKHQxPjEsdDI+MSksIFBhc3QgKHQxPDAsdDI8MCksIENvbXBsZXRlbHlJbnNpZGUodDE8MCwgdDI+MSlcclxuXHJcbiAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIHQxIGlzIHRoZSBpbnRlcnNlY3Rpb24sIGFuZCBpdCdzIGNsb3NlciB0aGFuIHQyXHJcbiAgICAgICAgICAgICAgICAvLyAoc2luY2UgdDEgdXNlcyAtYiAtIGRpc2NyaW1pbmFudClcclxuICAgICAgICAgICAgICAgIC8vIEltcGFsZSwgUG9rZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGhlcmUgdDEgZGlkbid0IGludGVyc2VjdCBzbyB3ZSBhcmUgZWl0aGVyIHN0YXJ0ZWRcclxuICAgICAgICAgICAgLy8gaW5zaWRlIHRoZSBzcGhlcmUgb3IgY29tcGxldGVseSBwYXN0IGl0XHJcbiAgICAgICAgICAgIGlmICh0MiA+PSAwICYmIHQyIDw9IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIEV4aXRXb3VuZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIG5vIGludG46IEZhbGxTaG9ydCwgUGFzdCwgQ29tcGxldGVseUluc2lkZVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBfY2lyY2xlVnNDaXJjbGUgPSBmdW5jdGlvbiAoYzEsIGMyKSB7XHJcbiAgICAgICAgdmFyIHZlbG9jaXR5ID0gYzIudjtcclxuICAgICAgICAvL2FkZCBib3RoIHJhZGlpIHRvZ2V0aGVyIHRvIGdldCB0aGUgY29sbGlkaW5nIGRpc3RhbmNlXHJcbiAgICAgICAgdmFyIHRvdGFsUmFkaXVzID0gYzEucmFkaXVzICsgYzIucmFkaXVzO1xyXG4gICAgICAgIC8vZmluZCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgdHdvIGNpcmNsZXMgdXNpbmcgUHl0aGFnb3JlYW4gdGhlb3JlbS4gTm8gc3F1YXJlIHJvb3RzIGZvciBvcHRpbWl6YXRpb25cclxuICAgICAgICB2YXIgZGlzdGFuY2VTcXVhcmVkID0gKGMxLnBvcy54IC0gYzIucG9zLngpICogKGMxLnBvcy54IC0gYzIucG9zLngpICsgKGMxLnBvcy55IC0gYzIucG9zLnkpICogKGMxLnBvcy55IC0gYzIucG9zLnkpO1xyXG4gICAgICAgIC8vaWYgeW91ciBkaXN0YW5jZSBpcyBsZXNzIHRoYW4gdGhlIHRvdGFsUmFkaXVzIHNxdWFyZShiZWNhdXNlIGRpc3RhbmNlIGlzIHNxdWFyZWQpXHJcbiAgICAgICAgaWYgKGRpc3RhbmNlU3F1YXJlZCA8IHRvdGFsUmFkaXVzICogdG90YWxSYWRpdXMpIHtcclxuICAgICAgICAgICAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KGRpc3RhbmNlU3F1YXJlZCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc2VwYXJhdGlvbiA9IHRvdGFsUmFkaXVzIC0gZGlzdGFuY2U7XHJcbiAgICAgICAgICAgIHZhciB1bml0VmVjdG9yID0gbmV3IFJlbmRlckpzLlZlY3RvcihjMS5wb3Muc3ViKGMyLnBvcykueCAvIGRpc3RhbmNlLCBjMS5wb3Muc3ViKGMyLnBvcykueSAvIGRpc3RhbmNlKTtcclxuICAgICAgICAgICAgdmFyIGRpZmZWID0gYzIucG9zLnN1YihjMS5wb3MpO1xyXG5cclxuICAgICAgICAgICAgLy9maW5kIHRoZSBtb3ZlbWVudCBuZWVkZWQgdG8gc2VwYXJhdGUgdGhlIGNpcmNsZXNcclxuICAgICAgICAgICAgcmV0dXJuIHZlbG9jaXR5LmFkZCh1bml0VmVjdG9yLnNjYWxlKHNlcGFyYXRpb24gLyAyKSk7Ly9uZXcgUmVuZGVySnMuVmVjdG9yKChjMi5wb3MueCAtIGMxLnBvcy54KSAqIGRpZmZlcmVuY2UsIChjMi5wb3MueSAtIGMxLnBvcy55KSAqIGRpZmZlcmVuY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDsgLy9ubyBjb2xsaXNpb24sIHJldHVybiBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9jaXJjbGVWc1BvbHlnb24gPSBmdW5jdGlvbiAoY2lyY2xlLCBwb2x5Z29uKSB7XHJcbiAgICAgICAgLy8gR2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRvIHRoZSBwb2x5Z29uLlxyXG4gICAgICAgIHZhciBjaXJjbGVQb3MgPSBjaXJjbGUucG9zLnN1Yihwb2x5Z29uLnBvcyk7XHJcbiAgICAgICAgdmFyIHJhZGl1cyA9IGNpcmNsZS5yYWRpdXM7XHJcbiAgICAgICAgdmFyIHJhZGl1czIgPSByYWRpdXMgKiByYWRpdXM7XHJcbiAgICAgICAgdmFyIHBvaW50cyA9IHBvbHlnb24udmVydGljZXMuc2xpY2UoKTtcclxuICAgICAgICB2YXIgbGVuID0gcG9pbnRzLmxlbmd0aDtcclxuICAgICAgICB2YXIgZWRnZSA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCk7XHJcbiAgICAgICAgdmFyIHBvaW50ID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKTtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXA6IE51bWJlci5NQVhfVkFMVUUsXHJcbiAgICAgICAgICAgIG92ZXJsYXBOOiBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLFxyXG4gICAgICAgICAgICBvdmVybGFwVjogbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gRm9yIGVhY2ggZWRnZSBpbiB0aGUgcG9seWdvbjpcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXh0ID0gaSA9PT0gbGVuIC0gMSA/IDAgOiBpICsgMTtcclxuICAgICAgICAgICAgdmFyIHByZXYgPSBpID09PSAwID8gbGVuIC0gMSA6IGkgLSAxO1xyXG4gICAgICAgICAgICB2YXIgb3ZlcmxhcCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBvdmVybGFwTiA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgdGhlIGVkZ2UuXHJcbiAgICAgICAgICAgIGVkZ2Uuc2V0KHBvbHlnb24udmVydGljZXNbaV0pO1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRvIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgZWRnZS5cclxuICAgICAgICAgICAgcG9pbnQuc2V0KGNpcmNsZVBvcyk7XHJcbiAgICAgICAgICAgIHBvaW50LnNldChwb2ludC5zdWIocG9pbnRzW2ldKSk7XHJcbiAgICAgICAgICAgIC8vIElmIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSBhbmQgdGhlIHBvaW50XHJcbiAgICAgICAgICAgIC8vIGlzIGJpZ2dlciB0aGFuIHRoZSByYWRpdXMsIHRoZSBwb2x5Z29uIGlzIGRlZmluaXRlbHkgbm90IGZ1bGx5IGluXHJcbiAgICAgICAgICAgIC8vIHRoZSBjaXJjbGUuXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZSAmJiBwb2ludC5sZW5ndGgyKCkgPiByYWRpdXMyKSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZVsnYUluQiddID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB3aGljaCBWb3Jub2kgcmVnaW9uIHRoZSBjZW50ZXIgb2YgdGhlIGNpcmNsZSBpcyBpbi5cclxuICAgICAgICAgICAgdmFyIHJlZ2lvbiA9IF92b3Jub2lSZWdpb24oZWRnZSwgcG9pbnQpO1xyXG4gICAgICAgICAgICAvLyBJZiBpdCdzIHRoZSBsZWZ0IHJlZ2lvbjpcclxuICAgICAgICAgICAgaWYgKHJlZ2lvbiA9PT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHdlJ3JlIGluIHRoZSBSSUdIVF9WT1JOT0lfUkVHSU9OIG9mIHRoZSBwcmV2aW91cyBlZGdlLlxyXG4gICAgICAgICAgICAgICAgZWRnZS5zZXQocG9seWdvbi5lZGdlc1twcmV2XSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgcHJldmlvdXMgZWRnZVxyXG4gICAgICAgICAgICAgICAgdmFyIHBvaW50MiA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCkuc2V0KGNpcmNsZVBvcykuc3ViKHBvaW50c1twcmV2XSk7XHJcbiAgICAgICAgICAgICAgICByZWdpb24gPSBfdm9ybm9pUmVnaW9uKGVkZ2UsIHBvaW50Mik7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnaW9uID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBpbiB0aGUgcmVnaW9uIHdlIHdhbnQuICBDaGVjayBpZiB0aGUgY2lyY2xlIGludGVyc2VjdHMgdGhlIHBvaW50LlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gcG9pbnQubGVuZ3RoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc3QgPiByYWRpdXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gaW50ZXJzZWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0IGludGVyc2VjdHMsIGNhbGN1bGF0ZSB0aGUgb3ZlcmxhcC5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVybGFwTiA9IHBvaW50Lm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVybGFwID0gcmFkaXVzIC0gZGlzdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBpdCdzIHRoZSByaWdodCByZWdpb246XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVnaW9uID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB3ZSdyZSBpbiB0aGUgbGVmdCByZWdpb24gb24gdGhlIG5leHQgZWRnZVxyXG4gICAgICAgICAgICAgICAgZWRnZS5zZXQocG9seWdvbi5lZGdlc1tuZXh0XSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIHJlbGF0aXZlIHRvIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgbmV4dCBlZGdlLlxyXG4gICAgICAgICAgICAgICAgcG9pbnQuc2V0KGNpcmNsZVBvcyk7XHJcbiAgICAgICAgICAgICAgICBwb2ludC5zZXQocG9pbnQuc3ViKHBvaW50c1tuZXh0XSkpO1xyXG4gICAgICAgICAgICAgICAgcmVnaW9uID0gX3Zvcm5vaVJlZ2lvbihlZGdlLCBwb2ludCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVnaW9uID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgaW4gdGhlIHJlZ2lvbiB3ZSB3YW50LiAgQ2hlY2sgaWYgdGhlIGNpcmNsZSBpbnRlcnNlY3RzIHRoZSBwb2ludC5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGlzdCA9IHBvaW50Lmxlbmd0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXN0ID4gcmFkaXVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vIGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCBpbnRlcnNlY3RzLCBjYWxjdWxhdGUgdGhlIG92ZXJsYXAuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlWydiSW5BJ10gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcE4gPSBwb2ludC5ub3JtYWxpemUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcCA9IHJhZGl1cyAtIGRpc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdCdzIHRoZSBtaWRkbGUgcmVnaW9uOlxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gTmVlZCB0byBjaGVjayBpZiB0aGUgY2lyY2xlIGlzIGludGVyc2VjdGluZyB0aGUgZWRnZSxcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgZWRnZSBpbnRvIGl0cyBcImVkZ2Ugbm9ybWFsXCIuXHJcbiAgICAgICAgICAgICAgICB2YXIgbm9ybWFsID0gZWRnZS5wZXJwKCkubm9ybWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBwZXJwZW5kaWN1bGFyIGRpc3RhbmNlIGJldHdlZW4gdGhlIGNlbnRlciBvZiB0aGUgXHJcbiAgICAgICAgICAgICAgICAvLyBjaXJjbGUgYW5kIHRoZSBlZGdlLlxyXG4gICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBwb2ludC5kb3Qobm9ybWFsKTtcclxuICAgICAgICAgICAgICAgIHZhciBkaXN0QWJzID0gTWF0aC5hYnMoZGlzdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgY2lyY2xlIGlzIG9uIHRoZSBvdXRzaWRlIG9mIHRoZSBlZGdlLCB0aGVyZSBpcyBubyBpbnRlcnNlY3Rpb24uXHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzdCA+IDAgJiYgZGlzdEFicyA+IHJhZGl1cykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIGludGVyc2VjdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJdCBpbnRlcnNlY3RzLCBjYWxjdWxhdGUgdGhlIG92ZXJsYXAuXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcE4gPSBub3JtYWw7XHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxhcCA9IHJhZGl1cyAtIGRpc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlIGlzIG9uIHRoZSBvdXRzaWRlIG9mIHRoZSBlZGdlLCBvciBwYXJ0IG9mIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNpcmNsZSBpcyBvbiB0aGUgb3V0c2lkZSwgdGhlIGNpcmNsZSBpcyBub3QgZnVsbHkgaW5zaWRlIHRoZSBwb2x5Z29uLlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXN0ID49IDAgfHwgb3ZlcmxhcCA8IDIgKiByYWRpdXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VbJ2JJbkEnXSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgc21hbGxlc3Qgb3ZlcmxhcCB3ZSd2ZSBzZWVuLCBrZWVwIGl0LiBcclxuICAgICAgICAgICAgLy8gKG92ZXJsYXBOIG1heSBiZSBudWxsIGlmIHRoZSBjaXJjbGUgd2FzIGluIHRoZSB3cm9uZyBWb3Jub2kgcmVnaW9uKS5cclxuICAgICAgICAgICAgaWYgKG92ZXJsYXBOICYmIHJlc3BvbnNlICYmIE1hdGguYWJzKG92ZXJsYXApIDwgTWF0aC5hYnMocmVzcG9uc2VbJ292ZXJsYXAnXSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlWydvdmVybGFwJ10gPSBvdmVybGFwO1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2VbJ292ZXJsYXBOJ10gPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLnNldChvdmVybGFwTik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZmluYWwgb3ZlcmxhcCB2ZWN0b3IgLSBiYXNlZCBvbiB0aGUgc21hbGxlc3Qgb3ZlcmxhcC5cclxuICAgICAgICBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgcmVzcG9uc2VbJ2EnXSA9IHBvbHlnb247XHJcbiAgICAgICAgICAgIHJlc3BvbnNlWydiJ10gPSBjaXJjbGU7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlWydvdmVybGFwViddID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKS5zZXQocmVzcG9uc2VbJ292ZXJsYXBOJ10pLnNjYWxlKHJlc3BvbnNlWydvdmVybGFwJ10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy92YXIgdGVzdDE7Ly9udW1iZXJzIGZvciB0ZXN0aW5nIG1heC9taW5zXHJcbiAgICAgICAgLy92YXIgdGVzdDI7XHJcbiAgICAgICAgLy92YXIgdGVzdDtcclxuICAgICAgICAvL3ZhciBtaW4xOy8vc2FtZSBhcyBhYm92ZVxyXG4gICAgICAgIC8vdmFyIG1heDE7XHJcbiAgICAgICAgLy92YXIgbWluMjtcclxuICAgICAgICAvL3ZhciBtYXgyO1xyXG4gICAgICAgIC8vdmFyIG5vcm1hbEF4aXM7XHJcbiAgICAgICAgLy92YXIgb2Zmc2V0O1xyXG4gICAgICAgIC8vdmFyIHZlY3Rvck9mZnNldDtcclxuICAgICAgICAvL3ZhciB2ZWN0b3JzO1xyXG4gICAgICAgIC8vdmFyIHAyO1xyXG4gICAgICAgIC8vdmFyIGRpc3RhbmNlO1xyXG4gICAgICAgIC8vdmFyIHRlc3REaXN0YW5jZSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgLy92YXIgY2xvc2VzdFZlY3RvciA9IG5ldyBSZW5kZXJKcy5WZWN0b3IoMCwgMCk7Ly90aGUgdmVjdG9yIHRvIHVzZSB0byBmaW5kIHRoZSBub3JtYWxcclxuICAgICAgICAvLy8vIGZpbmQgb2Zmc2V0XHJcbiAgICAgICAgLy92ZWN0b3JPZmZzZXQgPSBuZXcgUmVuZGVySnMuVmVjdG9yKHBvbHlnb24ucG9zLnggLSBjaXJjbGUucG9zLngsIHBvbHlnb24ucG9zLnkgLSBjaXJjbGUucG9zLnkpO1xyXG4gICAgICAgIC8vdmVjdG9ycyA9IHBvbHlnb24udmVydGljZXMuc2xpY2UoKTsvL2FnYWluLCB0aGlzIGlzIGp1c3QgYSBmdW5jdGlvbiBpbiBteSBwb2x5Z29uIGNsYXNzIHRoYXQgcmV0dXJucyB0aGUgdmVydGljZXMgb2YgdGhlIHBvbGdvblxyXG4gICAgICAgIC8vLy9hZGRzIHNvbWUgcGFkZGluZyB0byBtYWtlIGl0IG1vcmUgYWNjdXJhdGVcclxuICAgICAgICAvL2lmICh2ZWN0b3JzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgLy8gICAgdmFyIHRlbXAgPSBuZXcgUmVuZGVySnMuVmVjdG9yKC0odmVjdG9yc1sxXS55IC0gdmVjdG9yc1swXS55KSwgdmVjdG9yc1sxXS54IC0gdmVjdG9yc1swXS54KTtcclxuICAgICAgICAvLyAgICB0ZW1wLnRydW5jYXRlKDAuMDAwMDAwMDAwMSk7XHJcbiAgICAgICAgLy8gICAgdmVjdG9ycy5wdXNoKHZlY3RvcnNbMV0uYWRkKHRlbXApKTtcclxuICAgICAgICAvL31cclxuICAgICAgICAvLy8vIGZpbmQgdGhlIGNsb3Nlc3QgdmVydGV4IHRvIHVzZSB0byBmaW5kIG5vcm1hbFxyXG4gICAgICAgIC8vZm9yICh2YXIgaSA9IDA7IGkgPCB2ZWN0b3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgLy8gICAgZGlzdGFuY2UgPSAoY2lyY2xlLnBvcy54IC0gKHBvbHlnb24ucG9zLnggKyB2ZWN0b3JzW2ldLngpKSAqIChjaXJjbGUucG9zLnggLSAocG9seWdvbi5wb3MueCArIHZlY3RvcnNbaV0ueCkpICsgKGNpcmNsZS5wb3MueSAtIChwb2x5Z29uLnBvcy55ICsgdmVjdG9yc1tpXS55KSkgKiAoY2lyY2xlLnBvcy55IC0gKHBvbHlnb24ucG9zLnkgKyB2ZWN0b3JzW2ldLnkpKTtcclxuICAgICAgICAvLyAgICBpZiAoZGlzdGFuY2UgPCB0ZXN0RGlzdGFuY2UpIHsvL2Nsb3Nlc3QgaGFzIHRoZSBsb3dlc3QgZGlzdGFuY2VcclxuICAgICAgICAvLyAgICAgICAgdGVzdERpc3RhbmNlID0gZGlzdGFuY2U7XHJcbiAgICAgICAgLy8gICAgICAgIGNsb3Nlc3RWZWN0b3IueCA9IHBvbHlnb24ucG9zLnggKyB2ZWN0b3JzW2ldLng7XHJcbiAgICAgICAgLy8gICAgICAgIGNsb3Nlc3RWZWN0b3IueSA9IHBvbHlnb24ucG9zLnkgKyB2ZWN0b3JzW2ldLnk7XHJcbiAgICAgICAgLy8gICAgfVxyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIC8vLy9nZXQgdGhlIG5vcm1hbCB2ZWN0b3JcclxuICAgICAgICAvL25vcm1hbEF4aXMgPSBuZXcgUmVuZGVySnMuVmVjdG9yKGNsb3Nlc3RWZWN0b3IueCAtIGNpcmNsZS5wb3MueCwgY2xvc2VzdFZlY3Rvci55IC0gY2lyY2xlLnBvcy55KTtcclxuICAgICAgICAvL25vcm1hbEF4aXMuc2V0KG5vcm1hbEF4aXMubm9ybWFsaXplKCkpOy8vbm9ybWFsaXplIGlzKHNldCBpdHMgbGVuZ3RoIHRvIDEpXHJcbiAgICAgICAgLy8vLyBwcm9qZWN0IHRoZSBwb2x5Z29uJ3MgcG9pbnRzXHJcbiAgICAgICAgLy9taW4xID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yc1swXSk7XHJcbiAgICAgICAgLy9tYXgxID0gbWluMTsvL3NldCBtYXggYW5kIG1pblxyXG4gICAgICAgIC8vZm9yIChqID0gMTsgaiA8IHZlY3RvcnMubGVuZ3RoOyBqKyspIHsvL3Byb2plY3QgYWxsIGl0cyBwb2ludHMsIHN0YXJ0aW5nIHdpdGggdGhlIGZpcnN0KHRoZSAwdGggd2FzIGRvbmUgdXAgdGhlcmVeKVxyXG4gICAgICAgIC8vICAgIHRlc3QgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JzW2pdKTsvL2RvdFByb2R1Y3QgdG8gcHJvamVjdFxyXG4gICAgICAgIC8vICAgIGlmICh0ZXN0IDwgbWluMSkgbWluMSA9IHRlc3Q7Ly9zbWFsbGVzdCBtaW4gaXMgd2FudGVkXHJcbiAgICAgICAgLy8gICAgaWYgKHRlc3QgPiBtYXgxKSBtYXgxID0gdGVzdDsvL2xhcmdlc3QgbWF4IGlzIHdhbnRlZFxyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIC8vLy8gcHJvamVjdCB0aGUgY2lyY2xlXHJcbiAgICAgICAgLy9tYXgyID0gY2lyY2xlLnJhZGl1czsvL21heCBpcyByYWRpdXNcclxuICAgICAgICAvL21pbjIgLT0gY2lyY2xlLnJhZGl1czsvL21pbiBpcyBuZWdhdGl2ZSByYWRpdXNcclxuICAgICAgICAvLy8vIG9mZnNldCB0aGUgcG9seWdvbidzIG1heC9taW5cclxuICAgICAgICAvL29mZnNldCA9IG5vcm1hbEF4aXMuZG90KHZlY3Rvck9mZnNldCk7XHJcbiAgICAgICAgLy9taW4xICs9IG9mZnNldDtcclxuICAgICAgICAvL21heDEgKz0gb2Zmc2V0O1xyXG4gICAgICAgIC8vLy8gZG8gdGhlIGJpZyB0ZXN0XHJcbiAgICAgICAgLy90ZXN0MSA9IG1pbjEgLSBtYXgyO1xyXG4gICAgICAgIC8vdGVzdDIgPSBtaW4yIC0gbWF4MTtcclxuICAgICAgICAvL2lmICh0ZXN0MSA+IDAgfHwgdGVzdDIgPiAwKSB7Ly9pZiBlaXRoZXIgdGVzdCBpcyBncmVhdGVyIHRoYW4gMCwgdGhlcmUgaXMgYSBnYXAsIHdlIGNhbiBnaXZlIHVwIG5vdy5cclxuICAgICAgICAvLyAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAvL31cclxuICAgICAgICAvLy8vIGZpbmQgdGhlIG5vcm1hbCBheGlzIGZvciBlYWNoIHBvaW50IGFuZCBwcm9qZWN0XHJcbiAgICAgICAgLy9mb3IgKGkgPSAwOyBpIDwgdmVjdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIC8vICAgIG5vcm1hbEF4aXMgPSBfZmluZE5vcm1hbEF4aXModmVjdG9ycywgaSk7XHJcbiAgICAgICAgLy8gICAgLy8gcHJvamVjdCB0aGUgcG9seWdvbihhZ2Fpbj8geWVzLCBjaXJjbGVzIHZzLiBwb2x5Z29uIHJlcXVpcmUgbW9yZSB0ZXN0aW5nLi4uKVxyXG4gICAgICAgIC8vICAgIG1pbjEgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JzWzBdKTsvL3Byb2plY3RcclxuICAgICAgICAvLyAgICBtYXgxID0gbWluMTsvL3NldCBtYXggYW5kIG1pblxyXG4gICAgICAgIC8vICAgIC8vcHJvamVjdCBhbGwgdGhlIG90aGVyIHBvaW50cyhzZWUsIGNpcmxjZXMgdi4gcG9seWdvbnMgdXNlIGxvdHMgb2YgdGhpcy4uLilcclxuICAgICAgICAvLyAgICBmb3IgKGogPSAxOyBqIDwgdmVjdG9ycy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgIC8vICAgICAgICB0ZXN0ID0gbm9ybWFsQXhpcy5kb3QodmVjdG9yc1tqXSk7Ly9tb3JlIHByb2plY3Rpb25cclxuICAgICAgICAvLyAgICAgICAgaWYgKHRlc3QgPCBtaW4xKSBtaW4xID0gdGVzdDsvL3NtYWxsZXN0IG1pblxyXG4gICAgICAgIC8vICAgICAgICBpZiAodGVzdCA+IG1heDEpIG1heDEgPSB0ZXN0Oy8vbGFyZ2VzdCBtYXhcclxuICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgLy8gICAgLy8gcHJvamVjdCB0aGUgY2lyY2xlKGFnYWluKVxyXG4gICAgICAgIC8vICAgIG1heDIgPSBjaXJjbGUucmFkaXVzOy8vbWF4IGlzIHJhZGl1c1xyXG4gICAgICAgIC8vICAgIG1pbjIgLT0gY2lyY2xlLnJhZGl1czsvL21pbiBpcyBuZWdhdGl2ZSByYWRpdXNcclxuICAgICAgICAvLyAgICAvL29mZnNldCBwb2ludHNcclxuICAgICAgICAvLyAgICBvZmZzZXQgPSBub3JtYWxBeGlzLmRvdCh2ZWN0b3JPZmZzZXQpO1xyXG4gICAgICAgIC8vICAgIG1pbjEgKz0gb2Zmc2V0O1xyXG4gICAgICAgIC8vICAgIG1heDEgKz0gb2Zmc2V0O1xyXG4gICAgICAgIC8vICAgIC8vIGRvIHRoZSB0ZXN0LCBhZ2FpblxyXG4gICAgICAgIC8vICAgIHRlc3QxID0gbWluMSAtIG1heDI7XHJcbiAgICAgICAgLy8gICAgdGVzdDIgPSBtaW4yIC0gbWF4MTtcclxuICAgICAgICAvLyAgICBpZiAodGVzdDEgPiAwIHx8IHRlc3QyID4gMCkge1xyXG4gICAgICAgIC8vICAgICAgICAvL2ZhaWxlZC4uIHF1aXQgbm93XHJcbiAgICAgICAgLy8gICAgICAgIHJldHVybiBudWxsXHJcbiAgICAgICAgLy8gICAgfVxyXG4gICAgICAgIC8vfVxyXG4gICAgICAgIC8vcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3Iobm9ybWFsQXhpcy54ICogKG1heDIgLSBtaW4xKSAqIC0xLCBub3JtYWxBeGlzLnkgKiAobWF4MiAtIG1pbjEpICogLTEpOy8vcmV0dXJuIHRoZSBzZXBhcmF0aW9uIGRpc3RhbmNlXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF9wb2ludEluUmVjdGFuZ2xlID0gZnVuY3Rpb24gKHAsIHIpIHtcclxuICAgICAgICByZXR1cm4gKHAueCA+PSByLnggJiZcclxuICAgICAgICBwLnggPD0gci54ICsgci53aWR0aCAmJlxyXG4gICAgICAgIHAueSA+PSByLnkgJiZcclxuICAgICAgICBwLnkgPD0gci55ICsgci5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5BYWJiQ29sbGlzaW9uID0gZnVuY3Rpb24gKHJlY3RBLCByZWN0Qikge1xyXG4gICAgICAgIGlmIChNYXRoLmFicyhyZWN0QS54IC0gcmVjdEIueCkgPCByZWN0QS53aWR0aCArIHJlY3RCLndpZHRoKSB7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0QS55IC0gcmVjdEIueSkgPCByZWN0QS5oZWlnaHQgKyByZWN0Qi5oZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLnBvaW50SW5PYmplY3QgPSBmdW5jdGlvbiAocCwgb2JqKSB7XHJcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlKVxyXG4gICAgICAgICAgICByZXR1cm4gX3BvaW50SW5SZWN0YW5nbGUocCwgb2JqKTtcclxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMpXHJcbiAgICAgICAgICAgIHJldHVybiBfcG9pbnRJbkNpcmNsZShwLCBvYmopO1xyXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24pXHJcbiAgICAgICAgICAgIHJldHVybiBfcG9pbnRJblBvbHlnb24ocCwgb2JqKTtcclxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5MaW5lKVxyXG4gICAgICAgICAgICByZXR1cm4gX3BvaW50SW5MaW5lKHAsIG9iaik7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBtb2R1bGUuY2hlY2tDb2xsaXNpb24gPSBmdW5jdGlvbiAob2JqMSwgb2JqMiwgdmVsb2NpdHkpIHtcclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlJlY3RhbmdsZSlcclxuICAgICAgICAgICAgcmV0dXJuIF9yZWN0VnNSZWN0KG9iajEsIG9iajIpO1xyXG5cclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYylcclxuICAgICAgICAgICAgcmV0dXJuIF9yZWN0VnNDaXJjbGUob2JqMSwgb2JqMik7XHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYyAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5SZWN0YW5nbGUpXHJcbiAgICAgICAgICAgIHJldHVybiBfcmVjdFZzQ2lyY2xlKG9iajIsIG9iajEpO1xyXG5cclxuICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYylcclxuICAgICAgICAgICAgcmV0dXJuIF9jaXJjbGVWc0NpcmNsZShvYmoxLCBvYmoyLCB2ZWxvY2l0eSk7XHJcblxyXG4gICAgICAgIGlmIChvYmoxIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5MaW5lICYmIG9iajIgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYylcclxuICAgICAgICAgICAgcmV0dXJuIF9saW5lVnNDaXJjbGUob2JqMSwgb2JqMik7XHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYyAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5MaW5lKVxyXG4gICAgICAgICAgICByZXR1cm4gX2xpbmVWc0NpcmNsZShvYmoyLCBvYmoxKTtcclxuXHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24gJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUG9seWdvbikge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iajEuc3ViUG9seXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqMi5zdWJQb2x5cy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IG1vZHVsZS5wb2x5Z29uQ29sbGlzaW9uKG9iajEuc3ViUG9seXNbaV0sIG9iajIuc3ViUG9seXNbal0sIHZlbG9jaXR5KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuaW50ZXJzZWN0IHx8IHJlc3BvbnNlLndpbGxJbnRlcnNlY3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDsvL1JlbmRlckpzLlZlY3Rvci5jbG9uZSgwLCAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLkFyYyAmJiBvYmoyIGluc3RhbmNlb2YgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uKVxyXG4gICAgICAgICAgICByZXR1cm4gX2NpcmNsZVZzUG9seWdvbihvYmoxLCBvYmoyLCB2ZWxvY2l0eSk7XHJcbiAgICAgICAgaWYgKG9iajEgaW5zdGFuY2VvZiBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24gJiYgb2JqMiBpbnN0YW5jZW9mIFJlbmRlckpzLkNhbnZhcy5TaGFwZXMuQXJjKVxyXG4gICAgICAgICAgICByZXR1cm4gX2NpcmNsZVZzUG9seWdvbihvYmoyLCBvYmoxLCB2ZWxvY2l0eSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kdWxlO1xyXG5cclxufShSZW5kZXJKcy5QaHlzaWNzLkNvbGxpc2lvbnMgfHwge30pKTsiLCJ2YXIgUmVuZGVySnMgPSBSZW5kZXJKcyB8fCB7fTtcclxuUmVuZGVySnMuUGh5c2ljcy5Db2xsaXNpb25zID0gKGZ1bmN0aW9uIChtb2R1bGUpIHtcclxuXHJcbiAgICAvLyBDaGVjayBpZiBwb2x5Z29uIEEgaXMgZ29pbmcgdG8gY29sbGlkZSB3aXRoIHBvbHlnb24gQiBmb3IgdGhlIGdpdmVuIHZlbG9jaXR5XHJcbiAgICBtb2R1bGUucG9seWdvbkNvbGxpc2lvbiA9IGZ1bmN0aW9uIChwb2x5Z29uQSwgcG9seWdvbkIsIHZlbG9jaXR5KSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgaW50ZXJzZWN0OiB0cnVlLFxyXG4gICAgICAgICAgICB3aWxsSW50ZXJzZWN0OiB0cnVlXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZWRnZUNvdW50QSA9IHBvbHlnb25BLmVkZ2VzLmxlbmd0aDtcclxuICAgICAgICB2YXIgZWRnZUNvdW50QiA9IHBvbHlnb25CLmVkZ2VzLmxlbmd0aDtcclxuICAgICAgICB2YXIgbWluSW50ZXJ2YWxEaXN0YW5jZSA9IEluZmluaXR5O1xyXG4gICAgICAgIHZhciB0cmFuc2xhdGlvbkF4aXMgPSBuZXcgUmVuZGVySnMuVmVjdG9yKCk7XHJcbiAgICAgICAgdmFyIGVkZ2U7XHJcblxyXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgdGhlIGVkZ2VzIG9mIGJvdGggcG9seWdvbnNcclxuICAgICAgICBmb3IgKHZhciBlZGdlSW5kZXggPSAwLCBsID0gZWRnZUNvdW50QSArIGVkZ2VDb3VudEI7IGVkZ2VJbmRleCA8IGw7IGVkZ2VJbmRleCsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlZGdlSW5kZXggPCBlZGdlQ291bnRBKSB7XHJcbiAgICAgICAgICAgICAgICBlZGdlID0gcG9seWdvbkEuZWRnZXNbZWRnZUluZGV4XTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVkZ2UgPSBwb2x5Z29uQi5lZGdlc1tlZGdlSW5kZXggLSBlZGdlQ291bnRBXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gPT09PT0gMS4gRmluZCBpZiB0aGUgcG9seWdvbnMgYXJlIGN1cnJlbnRseSBpbnRlcnNlY3RpbmcgPT09PT1cclxuXHJcbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIGF4aXMgcGVycGVuZGljdWxhciB0byB0aGUgY3VycmVudCBlZGdlXHJcbiAgICAgICAgICAgIHZhciBheGlzID0gbmV3IFJlbmRlckpzLlZlY3RvcigtZWRnZS55LCBlZGdlLngpO1xyXG4gICAgICAgICAgICBheGlzLnNldChheGlzLm5vcm1hbGl6ZSgpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIHByb2plY3Rpb24gb2YgdGhlIHBvbHlnb24gb24gdGhlIGN1cnJlbnQgYXhpc1xyXG4gICAgICAgICAgICB2YXIgbWluQSA9IDAsIG1pbkIgPSAwLCBtYXhBID0gMCwgbWF4QiA9IDA7XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvamVjdGVkQSA9IF9wcm9qZWN0UG9seWdvbihheGlzLCBwb2x5Z29uQSwgbWluQSwgbWF4QSk7XHJcbiAgICAgICAgICAgIG1pbkEgPSBwcm9qZWN0ZWRBLm1pbjtcclxuICAgICAgICAgICAgbWF4QSA9IHByb2plY3RlZEEubWF4O1xyXG5cclxuICAgICAgICAgICAgdmFyIHByb2plY3RlZEIgPSBfcHJvamVjdFBvbHlnb24oYXhpcywgcG9seWdvbkIsIG1pbkIsIG1heEIpO1xyXG4gICAgICAgICAgICBtaW5CID0gcHJvamVjdGVkQi5taW47XHJcbiAgICAgICAgICAgIG1heEIgPSBwcm9qZWN0ZWRCLm1heDtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBwb2x5Z29uIHByb2plY3Rpb25zIGFyZSBjdXJyZW50bHR5IGludGVyc2VjdGluZ1xyXG4gICAgICAgICAgICBpZiAoX2ludGVydmFsRGlzdGFuY2UobWluQSwgbWF4QSwgbWluQiwgbWF4QikgPiAwKSByZXN1bHQuaW50ZXJzZWN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAvLyA9PT09PSAyLiBOb3cgZmluZCBpZiB0aGUgcG9seWdvbnMgKndpbGwqIGludGVyc2VjdCA9PT09PVxyXG5cclxuICAgICAgICAgICAgLy8gUHJvamVjdCB0aGUgdmVsb2NpdHkgb24gdGhlIGN1cnJlbnQgYXhpc1xyXG4gICAgICAgICAgICB2YXIgdmVsb2NpdHlQcm9qZWN0aW9uID0gYXhpcy5kb3QodmVsb2NpdHkpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHRoZSBwcm9qZWN0aW9uIG9mIHBvbHlnb24gQSBkdXJpbmcgdGhlIG1vdmVtZW50XHJcbiAgICAgICAgICAgIGlmICh2ZWxvY2l0eVByb2plY3Rpb24gPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBtaW5BICs9IHZlbG9jaXR5UHJvamVjdGlvbjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1heEEgKz0gdmVsb2NpdHlQcm9qZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgc2FtZSB0ZXN0IGFzIGFib3ZlIGZvciB0aGUgbmV3IHByb2plY3Rpb25cclxuICAgICAgICAgICAgdmFyIGludGVydmFsRGlzdGFuY2UgPSBfaW50ZXJ2YWxEaXN0YW5jZShtaW5BLCBtYXhBLCBtaW5CLCBtYXhCKTtcclxuICAgICAgICAgICAgaWYgKGludGVydmFsRGlzdGFuY2UgPiAwKSByZXN1bHQud2lsbEludGVyc2VjdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgLy8gSWYgdGhlIHBvbHlnb25zIGFyZSBub3QgaW50ZXJzZWN0aW5nIGFuZCB3b24ndCBpbnRlcnNlY3QsIGV4aXQgdGhlIGxvb3BcclxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuaW50ZXJzZWN0ICYmICFyZXN1bHQud2lsbEludGVyc2VjdCkgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY3VycmVudCBpbnRlcnZhbCBkaXN0YW5jZSBpcyB0aGUgbWluaW11bSBvbmUuIElmIHNvIHN0b3JlXHJcbiAgICAgICAgICAgIC8vIHRoZSBpbnRlcnZhbCBkaXN0YW5jZSBhbmQgdGhlIGN1cnJlbnQgZGlzdGFuY2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgd2lsbCBiZSB1c2VkIHRvIGNhbGN1bGF0ZSB0aGUgbWluaW11bSB0cmFuc2xhdGlvbiB2ZWN0b3JcclxuICAgICAgICAgICAgaW50ZXJ2YWxEaXN0YW5jZSA9IE1hdGguYWJzKGludGVydmFsRGlzdGFuY2UpO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJ2YWxEaXN0YW5jZSA8IG1pbkludGVydmFsRGlzdGFuY2UpIHtcclxuICAgICAgICAgICAgICAgIG1pbkludGVydmFsRGlzdGFuY2UgPSBpbnRlcnZhbERpc3RhbmNlO1xyXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRpb25BeGlzID0gYXhpcztcclxuXHJcbiAgICAgICAgICAgICAgICBkID0gcG9seWdvbkEuZ2V0Q2VudGVyKCkuc3ViKHBvbHlnb25CLmdldENlbnRlcigpKTtcclxuICAgICAgICAgICAgICAgIGlmIChkLmRvdCh0cmFuc2xhdGlvbkF4aXMpIDwgMCkgdHJhbnNsYXRpb25BeGlzID0gdHJhbnNsYXRpb25BeGlzLnNjYWxlKC0xKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGhlIG1pbmltdW0gdHJhbnNsYXRpb24gdmVjdG9yIGNhbiBiZSB1c2VkIHRvIHB1c2ggdGhlIHBvbHlnb25zIGFwcGFydC5cclxuICAgICAgICAvLyBGaXJzdCBtb3ZlcyB0aGUgcG9seWdvbnMgYnkgdGhlaXIgdmVsb2NpdHlcclxuICAgICAgICAvLyB0aGVuIG1vdmUgcG9seWdvbkEgYnkgTWluaW11bVRyYW5zbGF0aW9uVmVjdG9yLlxyXG4gICAgICAgIGlmIChyZXN1bHQud2lsbEludGVyc2VjdCkgcmVzdWx0Lm1pbmltdW1UcmFuc2xhdGlvblZlY3RvciA9IHRyYW5zbGF0aW9uQXhpcy5zY2FsZShtaW5JbnRlcnZhbERpc3RhbmNlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxjdWxhdGUgdGhlIGRpc3RhbmNlIGJldHdlZW4gW21pbkEsIG1heEFdIGFuZCBbbWluQiwgbWF4Ql1cclxuICAgIC8vIFRoZSBkaXN0YW5jZSB3aWxsIGJlIG5lZ2F0aXZlIGlmIHRoZSBpbnRlcnZhbHMgb3ZlcmxhcFxyXG4gICAgdmFyIF9pbnRlcnZhbERpc3RhbmNlID0gZnVuY3Rpb24gKG1pbkEsIG1heEEsIG1pbkIsIG1heEIpIHtcclxuICAgICAgICBpZiAobWluQSA8IG1pbkIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1pbkIgLSBtYXhBO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW5BIC0gbWF4QjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBwcm9qZWN0aW9uIG9mIGEgcG9seWdvbiBvbiBhbiBheGlzIGFuZCByZXR1cm5zIGl0IGFzIGEgW21pbiwgbWF4XSBpbnRlcnZhbFxyXG4gICAgdmFyIF9wcm9qZWN0UG9seWdvbiA9IGZ1bmN0aW9uIChheGlzLCBwb2x5Z29uLCBtaW4sIG1heCkge1xyXG4gICAgICAgIC8vIFRvIHByb2plY3QgYSBwb2ludCBvbiBhbiBheGlzIHVzZSB0aGUgZG90IHByb2R1Y3RcclxuICAgICAgICB2YXIgZCA9IGF4aXMuZG90KHBvbHlnb24udmVydGljZXNbMF0pO1xyXG4gICAgICAgIG1pbiA9IGQ7XHJcbiAgICAgICAgbWF4ID0gZDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvbHlnb24udmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZCA9IHBvbHlnb24udmVydGljZXNbaV0uZG90KGF4aXMpO1xyXG4gICAgICAgICAgICBpZiAoZCA8IG1pbikge1xyXG4gICAgICAgICAgICAgICAgbWluID0gZDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChkID4gbWF4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBtaW46IG1pbixcclxuICAgICAgICAgICAgbWF4OiBtYXhcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2R1bGU7XHJcblxyXG59KFJlbmRlckpzLlBoeXNpY3MuQ29sbGlzaW9ucyB8fCB7fSkpOyIsInJlZ2lzdGVyTmFtZXNwYWNlKFwiUmVuZGVySnMuQ2FudmFzLlNoYXBlc1wiKTtcclxuXHJcbi8qXHJcbiAqUmVwcmVzZW50cyBhIGNpcmNsZSBzaGFwZSwgaW5oZXJpdHMgZnJvbSBzaGFwZVxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5BcmMgPSBpbmplY3QoXCJVdGlsc1wiKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAodXRpbHMsIG9wdGlvbnMpIHtcclxuICAgICAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgICAgICB0aGlzLmJhc2Uob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIG9wdGlvbnMud2lkdGggPSBvcHRpb25zLmhlaWdodCA9IG9wdGlvbnMucmFkaXVzICogMiwgb3B0aW9ucy5yYWRpdXMgKiAyO1xyXG5cclxuICAgICAgICB0aGlzLnJhZGl1cyA9IG9wdGlvbnMucmFkaXVzO1xyXG4gICAgICAgIHRoaXMuc0FuZ2xlID0gdXRpbHMuY29udmVydFRvUmFkKG9wdGlvbnMuc0FuZ2xlIHx8IDApO1xyXG4gICAgICAgIHRoaXMuZUFuZ2xlID0gdXRpbHMuY29udmVydFRvUmFkKG9wdGlvbnMuZUFuZ2xlIHx8IDM2MCk7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9IG9wdGlvbnMuY29sb3I7XHJcbiAgICAgICAgdGhpcy5maWxsQ29sb3IgPSBvcHRpb25zLmZpbGxDb2xvcjtcclxuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IG9wdGlvbnMubGluZVdpZHRoIHx8IDE7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpPdmVycmlkZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCBiZWNhdXNlIHRoZSBjaXJjbGUgY2VudGVyIHBvaW50IGlzIG5vdCB0aGUgdG9wLGxlZnQgY29ybmVyXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5nZXRDZW50ZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVuZGVySnMuVmVjdG9yKHRoaXMucG9zLnggKyB0aGlzLndpZHRoIC8gMiwgdGhpcy5wb3MueSArIHRoaXMuaGVpZ2h0IC8gMik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKk92ZXJyaWRlcyB0aGUgb3JpZ2luYWwgZnVuY3Rpb25cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnBvaW50SW50ZXJzZWN0ID0gZnVuY3Rpb24gKHApIHtcclxuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLmdldENlbnRlcigpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgucG93KHAueCAtIGMueCwgMikgKyBNYXRoLnBvdyhwLnkgLSBjLnksIDIpIDw9IE1hdGgucG93KCh0aGlzLndpZHRoIC8gMiksIDIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi1mcHMgaXMgdGhlIGZyYW1lIHBlciBzZWNvbmRcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yb3RhdGVTaGFwZShjdHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsQ29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5hcmModGhpcy5wb3MueCArIHRoaXMud2lkdGggLyAyLCB0aGlzLnBvcy55ICsgdGhpcy5oZWlnaHQgLyAyLCB0aGlzLndpZHRoIC8gMiwgdGhpcy5zQW5nbGUsIHRoaXMuZUFuZ2xlKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5maWxsQ29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYW5nbGUgIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7IiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGFuIGltYWdlLCBpbmhlcml0cyBmcm9tIG9iamVjdFxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5JbWFnZSA9IGluamVjdChcIlV0aWxzXCIpXHJcbiAgICAuYmFzZShSZW5kZXJKcy5DYW52YXMuT2JqZWN0KVxyXG4gICAgLmNsYXNzKGZ1bmN0aW9uICh1dGlscywgb3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmJhc2Uob3B0aW9ucyk7XHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBMb2NhbHNcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgX2ltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBfaW1hZ2Uuc3JjID0gb3B0aW9ucy51cmw7XHJcbiAgICAgICAgX2ltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi53aWR0aCA9IF9pbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgc2VsZi5oZWlnaHQgPSBfaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgICAgICBfbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBfbG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIF9ibHVyUmFkaXVzID0gb3B0aW9ucy5ibHVyUmFkaXVzIHx8IDA7XHJcbiAgICAgICAgdmFyIF9jYWNoZSA9IG9wdGlvbnMuY2FjaGUgPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IG9wdGlvbnMuY2FjaGU7XHJcbiAgICAgICAgdmFyIF9maWx0ZXJDYWNoZSA9IG51bGw7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCkge1xyXG4gICAgICAgICAgICBpZiAoIV9sb2FkZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFfZmlsdGVyQ2FjaGUpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0aGlzLmZpbHRlcnNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBSZW5kZXJKcy5DYW52YXMuRmlsdGVycy5CbHVyOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2ZpbHRlckNhY2hlID0gUmVuZGVySnMuQ2FudmFzLkZpbHRlcnMuQmx1cihfaW1hZ2UsIF9ibHVyUmFkaXVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoX2ZpbHRlckNhY2hlKSB7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKF9maWx0ZXJDYWNoZSwgdGhpcy5wb3MueCwgdGhpcy5wb3MueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjdHguZHJhd0ltYWdlKF9pbWFnZSwgdGhpcy5wb3MueCwgdGhpcy5wb3MueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFfY2FjaGUpXHJcbiAgICAgICAgICAgICAgICBfZmlsdGVyQ2FjaGUgPSBudWxsO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYSBsaW5lIHNoYXBlLCBpbmhlcml0cyBmcm9tIHNoYXBlXHJcbiAqL1xyXG5SZW5kZXJKcy5DYW52YXMuU2hhcGVzLkxpbmUgPSBpbmplY3QoKVxyXG4gICAgLmJhc2UoUmVuZGVySnMuQ2FudmFzLk9iamVjdClcclxuICAgIC5jbGFzcyhmdW5jdGlvbiAob3B0aW9ucykge1xyXG5cclxuICAgICAgICB0aGlzLmJhc2Uoe1xyXG4gICAgICAgICAgICB4OiBvcHRpb25zLngxLFxyXG4gICAgICAgICAgICB5OiBvcHRpb25zLnkxLFxyXG4gICAgICAgICAgICB3aWR0aDogTWF0aC5hYnMob3B0aW9ucy54MiAtIG9wdGlvbnMueDEpLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IE1hdGguYWJzKG9wdGlvbnMueTIgLSBvcHRpb25zLnkxKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNvbG9yID0gXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIHRoaXMucG9zMiA9IG5ldyBSZW5kZXJKcy5WZWN0b3Iob3B0aW9ucy54Miwgb3B0aW9ucy55Mik7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9IG9wdGlvbnMuY29sb3I7XHJcbiAgICAgICAgdGhpcy5saW5lV2lkdGggPSBvcHRpb25zLmxpbmVXaWR0aCB8fCAxO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqRnVuY3Rpb24gaXMgY2FsbGVkIGluIGV2ZXJ5IGZyYW1lIHRvIHJlZHJhdyBpdHNlbGZcclxuICAgICAgICAgKi1jdHggaXMgdGhlIGRyYXdpbmcgY29udGV4dCBmcm9tIGEgY2FudmFzXHJcbiAgICAgICAgICotZnBzIGlzIHRoZSBmcmFtZSBwZXIgc2Vjb25kXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGN0eCwgZnJhbWUsIHN0YWdlUG9zaXRpb24pIHtcclxuICAgICAgICAgICAgdmFyIGFic1Bvc2l0aW9uID0gdGhpcy5wb3Muc3ViKHN0YWdlUG9zaXRpb24pO1xyXG4gICAgICAgICAgICB2YXIgYWJzUG9zaXRpb24yID0gdGhpcy5wb3MyLnN1YihzdGFnZVBvc2l0aW9uKTtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHgubW92ZVRvKGFic1Bvc2l0aW9uLngsIGFic1Bvc2l0aW9uLnkpO1xyXG4gICAgICAgICAgICBjdHgubGluZVRvKGFic1Bvc2l0aW9uMi54LCBhYnNQb3NpdGlvbjIueSk7XHJcblxyXG4gICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuIiwicmVnaXN0ZXJOYW1lc3BhY2UoXCJSZW5kZXJKcy5DYW52YXMuU2hhcGVzXCIpO1xyXG5cclxuLypcclxuICpSZXByZXNlbnRzIGEgbGluZSBzaGFwZSwgaW5oZXJpdHMgZnJvbSBzaGFwZVxyXG4gKi9cclxuUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uID0gaW5qZWN0KFwiVXRpbHNcIilcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5iYXNlKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbG9yID0gb3B0aW9ucy5jb2xvciB8fCBcIiMwMDBcIjtcclxuICAgICAgICB0aGlzLmxpbmVXaWR0aCA9IG9wdGlvbnMubGluZVdpZHRoIHx8IDE7XHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG9wdGlvbnMucG9pbnRzIHx8IFtdO1xyXG4gICAgICAgIHRoaXMuc3ViUG9seXMgPSBbXTtcclxuICAgICAgICB0aGlzLmVkZ2VzID0gW107XHJcbiAgICAgICAgdGhpcy5yRWRnZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmJ1aWxkRWRnZXMoKTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBEZWNvbXBvc2UgYSBwb2x5Z29uIGlmIGl0J3MgY29uY2F2ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVjb21wb3NlID0gZnVuY3Rpb24gKHJlc3VsdCwgcmVmbGV4VmVydGljZXMsIHN0ZWluZXJQb2ludHMsIGRlbHRhLCBtYXhsZXZlbCwgbGV2ZWwpIHtcclxuICAgICAgICAgICAgbWF4bGV2ZWwgPSBtYXhsZXZlbCB8fCAxMDA7XHJcbiAgICAgICAgICAgIGxldmVsID0gbGV2ZWwgfHwgMDtcclxuICAgICAgICAgICAgZGVsdGEgPSBkZWx0YSB8fCAyNTtcclxuICAgICAgICAgICAgcmVzdWx0ID0gdHlwZW9mIChyZXN1bHQpICE9PSBcInVuZGVmaW5lZFwiID8gcmVzdWx0IDogW107XHJcbiAgICAgICAgICAgIHJlZmxleFZlcnRpY2VzID0gcmVmbGV4VmVydGljZXMgfHwgW107XHJcbiAgICAgICAgICAgIHN0ZWluZXJQb2ludHMgPSBzdGVpbmVyUG9pbnRzIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgdmFyIHVwcGVySW50ID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKSwgbG93ZXJJbnQgPSBuZXcgUmVuZGVySnMuVmVjdG9yKDAsIDApLCBwID0gbmV3IFJlbmRlckpzLlZlY3RvcigwLCAwKTsgLy8gUG9pbnRzXHJcbiAgICAgICAgICAgIHZhciB1cHBlckRpc3QgPSAwLCBsb3dlckRpc3QgPSAwLCBkID0gMCwgY2xvc2VzdERpc3QgPSAwOyAvLyBzY2FsYXJzXHJcbiAgICAgICAgICAgIHZhciB1cHBlckluZGV4ID0gMCwgbG93ZXJJbmRleCA9IDAsIGNsb3Nlc3RJbmRleCA9IDA7IC8vIEludGVnZXJzXHJcbiAgICAgICAgICAgIHZhciBsb3dlclBvbHkgPSBuZXcgUmVuZGVySnMuQ2FudmFzLlNoYXBlcy5Qb2x5Z29uKCksIHVwcGVyUG9seSA9IG5ldyBSZW5kZXJKcy5DYW52YXMuU2hhcGVzLlBvbHlnb24oKTsgLy8gcG9seWdvbnNcclxuICAgICAgICAgICAgdmFyIHBvbHkgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgdiA9IHRoaXMudmVydGljZXM7XHJcblxyXG4gICAgICAgICAgICBpZiAodi5sZW5ndGggPCAzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXZlbCsrO1xyXG4gICAgICAgICAgICBpZiAobGV2ZWwgPiBtYXhsZXZlbCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwicXVpY2tEZWNvbXA6IG1heCBsZXZlbCAoXCIgKyBtYXhsZXZlbCArIFwiKSByZWFjaGVkLlwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvbHkuaXNSZWZsZXgoaSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZWZsZXhWZXJ0aWNlcy5wdXNoKHBvbHkudmVydGljZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHVwcGVyRGlzdCA9IGxvd2VyRGlzdCA9IE51bWJlci5NQVhfVkFMVUU7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMudmVydGljZXMubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlZlY3Rvci5sZWZ0KHBvbHkuYXQoaSAtIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgUmVuZGVySnMuVmVjdG9yLnJpZ2h0T24ocG9seS5hdChpIC0gMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaiAtIDEpKSkgeyAvLyBpZiBsaW5lIGludGVyc2VjdHMgd2l0aCBhbiBlZGdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwID0gdGhpcy5nZXRJbnRlcnNlY3Rpb25Qb2ludChwb2x5LmF0KGkgLSAxKSwgcG9seS5hdChpKSwgcG9seS5hdChqKSwgcG9seS5hdChqIC0gMSkpOyAvLyBmaW5kIHRoZSBwb2ludCBvZiBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5WZWN0b3IucmlnaHQocG9seS5hdChpICsgMSksIHBvbHkuYXQoaSksIHApKSB7IC8vIG1ha2Ugc3VyZSBpdCdzIGluc2lkZSB0aGUgcG9seVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBSZW5kZXJKcy5WZWN0b3Iuc3FkaXN0KHBvbHkudmVydGljZXNbaV0sIHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkIDwgbG93ZXJEaXN0KSB7IC8vIGtlZXAgb25seSB0aGUgY2xvc2VzdCBpbnRlcnNlY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJEaXN0ID0gZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJJbnQgPSBwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlckluZGV4ID0gajtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlZlY3Rvci5sZWZ0KHBvbHkuYXQoaSArIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGogKyAxKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIFJlbmRlckpzLlZlY3Rvci5yaWdodE9uKHBvbHkuYXQoaSArIDEpLCBwb2x5LmF0KGkpLCBwb2x5LmF0KGopKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHRoaXMuZ2V0SW50ZXJzZWN0aW9uUG9pbnQocG9seS5hdChpICsgMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaiksIHBvbHkuYXQoaiArIDEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZW5kZXJKcy5WZWN0b3IubGVmdChwb2x5LmF0KGkgLSAxKSwgcG9seS5hdChpKSwgcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkID0gUmVuZGVySnMuVmVjdG9yLnNxZGlzdChwb2x5LnZlcnRpY2VzW2ldLCBwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZCA8IHVwcGVyRGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlckRpc3QgPSBkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlckludCA9IHA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVySW5kZXggPSBqO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgYXJlIG5vIHZlcnRpY2VzIHRvIGNvbm5lY3QgdG8sIGNob29zZSBhIHBvaW50IGluIHRoZSBtaWRkbGVcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG93ZXJJbmRleCA9PSAodXBwZXJJbmRleCArIDEpICUgdGhpcy52ZXJ0aWNlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIkNhc2UgMTogVmVydGV4KFwiK2krXCIpLCBsb3dlckluZGV4KFwiK2xvd2VySW5kZXgrXCIpLCB1cHBlckluZGV4KFwiK3VwcGVySW5kZXgrXCIpLCBwb2x5LnNpemUoXCIrdGhpcy52ZXJ0aWNlcy5sZW5ndGgrXCIpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwLnggPSAobG93ZXJJbnQueCArIHVwcGVySW50LngpIC8gMjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcC55ID0gKGxvd2VySW50LnkgKyB1cHBlckludC55KSAvIDI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZWluZXJQb2ludHMucHVzaChwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpIDwgdXBwZXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9sb3dlclBvbHkuaW5zZXJ0KGxvd2VyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpICsgaSwgcG9seS5iZWdpbigpICsgdXBwZXJJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCBpLCB1cHBlckluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkudmVydGljZXMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS52ZXJ0aWNlcy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvd2VySW5kZXggIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBwZXJQb2x5Lmluc2VydCh1cHBlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSArIGxvd2VySW5kZXgsIHBvbHkuZW5kKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgbG93ZXJJbmRleCwgcG9seS52ZXJ0aWNlcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cHBlclBvbHkuaW5zZXJ0KHVwcGVyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpLCBwb2x5LmJlZ2luKCkgKyBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIDAsIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2xvd2VyUG9seS5pbnNlcnQobG93ZXJQb2x5LmVuZCgpLCBwb2x5LmJlZ2luKCkgKyBpLCBwb2x5LmVuZCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIGksIHBvbHkudmVydGljZXMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbG93ZXJQb2x5Lmluc2VydChsb3dlclBvbHkuZW5kKCksIHBvbHkuYmVnaW4oKSwgcG9seS5iZWdpbigpICsgdXBwZXJJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCAwLCB1cHBlckluZGV4ICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkudmVydGljZXMucHVzaChwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS52ZXJ0aWNlcy5wdXNoKHApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cHBlclBvbHkuaW5zZXJ0KHVwcGVyUG9seS5lbmQoKSwgcG9seS5iZWdpbigpICsgbG93ZXJJbmRleCwgcG9seS5iZWdpbigpICsgaSArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCBsb3dlckluZGV4LCBpICsgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25uZWN0IHRvIHRoZSBjbG9zZXN0IHBvaW50IHdpdGhpbiB0aGUgdHJpYW5nbGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIkNhc2UgMjogVmVydGV4KFwiK2krXCIpLCBjbG9zZXN0SW5kZXgoXCIrY2xvc2VzdEluZGV4K1wiKSwgcG9seS5zaXplKFwiK3RoaXMudmVydGljZXMubGVuZ3RoK1wiKVxcblwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb3dlckluZGV4ID4gdXBwZXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJJbmRleCArPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZXN0RGlzdCA9IE51bWJlci5NQVhfVkFMVUU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXBwZXJJbmRleCA8IGxvd2VySW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBsb3dlckluZGV4OyBqIDw9IHVwcGVySW5kZXg7ICsraikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlbmRlckpzLlZlY3Rvci5sZWZ0T24ocG9seS5hdChpIC0gMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgUmVuZGVySnMuVmVjdG9yLnJpZ2h0T24ocG9seS5hdChpICsgMSksIHBvbHkuYXQoaSksIHBvbHkuYXQoaikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZCA9IFJlbmRlckpzLlZlY3Rvci5zcWRpc3QocG9seS5hdChpKSwgcG9seS5hdChqKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgPCBjbG9zZXN0RGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9zZXN0RGlzdCA9IGQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb3Nlc3RJbmRleCA9IGogJSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpIDwgY2xvc2VzdEluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIGksIGNsb3Nlc3RJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb3Nlc3RJbmRleCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5hcHBlbmQocG9seSwgY2xvc2VzdEluZGV4LCB2Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuYXBwZW5kKHBvbHksIDAsIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG93ZXJQb2x5LmFwcGVuZChwb2x5LCBpLCB2Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuYXBwZW5kKHBvbHksIDAsIGNsb3Nlc3RJbmRleCArIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBwZXJQb2x5LmFwcGVuZChwb2x5LCBjbG9zZXN0SW5kZXgsIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc29sdmUgc21hbGxlc3QgcG9seSBmaXJzdFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb3dlclBvbHkudmVydGljZXMubGVuZ3RoIDwgdXBwZXJQb2x5LnZlcnRpY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb3dlclBvbHkuZGVjb21wb3NlKHJlc3VsdCwgcmVmbGV4VmVydGljZXMsIHN0ZWluZXJQb2ludHMsIGRlbHRhLCBtYXhsZXZlbCwgbGV2ZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cHBlclBvbHkuZGVjb21wb3NlKHJlc3VsdCwgcmVmbGV4VmVydGljZXMsIHN0ZWluZXJQb2ludHMsIGRlbHRhLCBtYXhsZXZlbCwgbGV2ZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwcGVyUG9seS5kZWNvbXBvc2UocmVzdWx0LCByZWZsZXhWZXJ0aWNlcywgc3RlaW5lclBvaW50cywgZGVsdGEsIG1heGxldmVsLCBsZXZlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvd2VyUG9seS5kZWNvbXBvc2UocmVzdWx0LCByZWZsZXhWZXJ0aWNlcywgc3RlaW5lclBvaW50cywgZGVsdGEsIG1heGxldmVsLCBsZXZlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgcmVzdWx0Lmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtrXS5idWlsZEVkZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godGhpcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogQXBwZW5kIHBvaW50cyBcImZyb21cIiB0byBcInRvXCItMSBmcm9tIGFuIG90aGVyIHBvbHlnb24gXCJwb2x5XCIgb250byB0aGlzIG9uZS5cclxuICAgICAgICAgKiBAbWV0aG9kIGFwcGVuZFxyXG4gICAgICAgICAqIEBwYXJhbSB7UG9seWdvbn0gcG9seSBUaGUgcG9seWdvbiB0byBnZXQgcG9pbnRzIGZyb20uXHJcbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9ICBmcm9tIFRoZSB2ZXJ0ZXggaW5kZXggaW4gXCJwb2x5XCIuXHJcbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9ICB0byBUaGUgZW5kIHZlcnRleCBpbmRleCBpbiBcInBvbHlcIi4gTm90ZSB0aGF0IHRoaXMgdmVydGV4IGlzIE5PVCBpbmNsdWRlZCB3aGVuIGFwcGVuZGluZy5cclxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmFwcGVuZCA9IGZ1bmN0aW9uIChwb2x5LCBmcm9tLCB0bykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChmcm9tKSA9PT0gXCJ1bmRlZmluZWRcIikgdGhyb3cgbmV3IEVycm9yKFwiRnJvbSBpcyBub3QgZ2l2ZW4hXCIpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mICh0bykgPT09IFwidW5kZWZpbmVkXCIpIHRocm93IG5ldyBFcnJvcihcIlRvIGlzIG5vdCBnaXZlbiFcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAodG8gLSAxIDwgZnJvbSkgdGhyb3cgbmV3IEVycm9yKFwibG9sMVwiKTtcclxuICAgICAgICAgICAgaWYgKHRvID4gcG9seS52ZXJ0aWNlcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcImxvbDJcIik7XHJcbiAgICAgICAgICAgIGlmIChmcm9tIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwibG9sM1wiKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBmcm9tOyBpIDwgdG87IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKHBvbHkudmVydGljZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBHZXQgYSB2ZXJ0ZXggYXQgcG9zaXRpb24gaS4gSXQgZG9lcyBub3QgbWF0dGVyIGlmIGkgaXMgb3V0IG9mIGJvdW5kcywgdGhpcyBmdW5jdGlvbiB3aWxsIGp1c3QgY3ljbGUuXHJcbiAgICAgICAgICogQG1ldGhvZCBhdFxyXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaVxyXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuYXQgPSBmdW5jdGlvbiAoaSkge1xyXG4gICAgICAgICAgICB2YXIgdiA9IHRoaXMudmVydGljZXMsXHJcbiAgICAgICAgICAgICAgICBzID0gdi5sZW5ndGg7XHJcbiAgICAgICAgICAgIHJldHVybiB2W2kgPCAwID8gaSAlIHMgKyBzIDogaSAlIHNdO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogR2V0IGZpcnN0IHZlcnRleFxyXG4gICAgICAgICAqIEBtZXRob2QgZmlyc3RcclxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52ZXJ0aWNlc1swXTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIEdldCBsYXN0IHZlcnRleFxyXG4gICAgICAgICAqIEBtZXRob2QgbGFzdFxyXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubGFzdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmVydGljZXNbdGhpcy52ZXJ0aWNlcy5sZW5ndGggLSAxXTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBDaGVja3MgdGhhdCB0aGUgbGluZSBzZWdtZW50cyBvZiB0aGlzIHBvbHlnb24gZG8gbm90IGludGVyc2VjdCBlYWNoIG90aGVyLlxyXG4gICAgICAgICAqIEBtZXRob2QgaXNTaW1wbGVcclxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gcGF0aCBBbiBhcnJheSBvZiB2ZXJ0aWNlcyBlLmcuIFtbMCwwXSxbMCwxXSwuLi5dXHJcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cclxuICAgICAgICAgKiBAdG9kbyBTaG91bGQgaXQgY2hlY2sgYWxsIHNlZ21lbnRzIHdpdGggYWxsIG90aGVycz9cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmlzU2ltcGxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMudmVydGljZXM7XHJcbiAgICAgICAgICAgIC8vIENoZWNrXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaSAtIDE7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlZ21lbnRzSW50ZXJzZWN0KHBhdGhbaV0sIHBhdGhbaSArIDFdLCBwYXRoW2pdLCBwYXRoW2ogKyAxXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIHNlZ21lbnQgYmV0d2VlbiB0aGUgbGFzdCBhbmQgdGhlIGZpcnN0IHBvaW50IHRvIGFsbCBvdGhlcnNcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwYXRoLmxlbmd0aCAtIDI7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VnbWVudHNJbnRlcnNlY3QocGF0aFswXSwgcGF0aFtwYXRoLmxlbmd0aCAtIDFdLCBwYXRoW2ldLCBwYXRoW2kgKyAxXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0SW50ZXJzZWN0aW9uUG9pbnQgPSBmdW5jdGlvbiAocDEsIHAyLCBxMSwgcTIsIGRlbHRhKSB7XHJcbiAgICAgICAgICAgIGRlbHRhID0gZGVsdGEgfHwgMDtcclxuICAgICAgICAgICAgdmFyIGExID0gcDIueSAtIHAxLnk7XHJcbiAgICAgICAgICAgIHZhciBiMSA9IHAxLnggLSBwMi54O1xyXG4gICAgICAgICAgICB2YXIgYzEgPSAoYTEgKiBwMS54KSArIChiMSAqIHAxLnkpO1xyXG4gICAgICAgICAgICB2YXIgYTIgPSBxMi55IC0gcTEueTtcclxuICAgICAgICAgICAgdmFyIGIyID0gcTEueCAtIHEyLng7XHJcbiAgICAgICAgICAgIHZhciBjMiA9IChhMiAqIHExLngpICsgKGIyICogcTEueSk7XHJcbiAgICAgICAgICAgIHZhciBkZXQgPSAoYTEgKiBiMikgLSAoYTIgKiBiMSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIVNjYWxhci5lcShkZXQsIDAsIGRlbHRhKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBSZW5kZXJKcy5WZWN0b3IuY2xvbmUoKChiMiAqIGMxKSAtIChiMSAqIGMyKSkgLyBkZXQsICgoYTEgKiBjMikgLSAoYTIgKiBjMSkpIC8gZGV0KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5jbG9uZSgwLCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogQ2hlY2sgaWYgYSBwb2ludCBpbiB0aGUgcG9seWdvbiBpcyBhIHJlZmxleCBwb2ludFxyXG4gICAgICAgICAqIEBtZXRob2QgaXNSZWZsZXhcclxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICBpXHJcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmlzUmVmbGV4ID0gZnVuY3Rpb24gKGkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFJlbmRlckpzLlZlY3Rvci5yaWdodCh0aGlzLmF0KGkgLSAxKSwgdGhpcy5hdChpKSwgdGhpcy5hdChpICsgMSkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubWFrZUNDVyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGJyID0gMCxcclxuICAgICAgICAgICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzO1xyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBib3R0b20gcmlnaHQgcG9pbnRcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodltpXS55IDwgdlticl0ueSB8fCAodltpXS55ID09IHZbYnJdLnkgJiYgdltpXS54ID4gdlticl0ueCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBiciA9IGk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHJldmVyc2UgcG9seSBpZiBjbG9ja3dpc2VcclxuICAgICAgICAgICAgaWYgKCFSZW5kZXJKcy5WZWN0b3IubGVmdCh0aGlzLmF0KGJyIC0gMSksIHRoaXMuYXQoYnIpLCB0aGlzLmF0KGJyICsgMSkpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBSZXZlcnNlIHRoZSB2ZXJ0aWNlcyBpbiB0aGUgcG9seWdvblxyXG4gICAgICAgICAqIEBtZXRob2QgcmV2ZXJzZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRtcCA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgTiA9IHRoaXMudmVydGljZXMubGVuZ3RoOyBpICE9PSBOOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRtcC5wdXNoKHRoaXMudmVydGljZXMucG9wKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljZXMgPSB0bXA7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZWdtZW50c0ludGVyc2VjdCA9IGZ1bmN0aW9uIChwMSwgcDIsIHExLCBxMikge1xyXG4gICAgICAgICAgICB2YXIgZHggPSBwMi54IC0gcDEueDtcclxuICAgICAgICAgICAgdmFyIGR5ID0gcDIueSAtIHAxLnk7XHJcbiAgICAgICAgICAgIHZhciBkYSA9IHEyLnggLSBxMS54O1xyXG4gICAgICAgICAgICB2YXIgZGIgPSBxMi55IC0gcTEueTtcclxuXHJcbiAgICAgICAgICAgIC8vIHNlZ21lbnRzIGFyZSBwYXJhbGxlbFxyXG4gICAgICAgICAgICBpZiAoZGEgKiBkeSAtIGRiICogZHggPT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzID0gKGR4ICogKHExLnkgLSBwMS55KSArIGR5ICogKHAxLnggLSBxMS54KSkgLyAoZGEgKiBkeSAtIGRiICogZHgpXHJcbiAgICAgICAgICAgIHZhciB0ID0gKGRhICogKHAxLnkgLSBxMS55KSArIGRiICogKHExLnggLSBwMS54KSkgLyAoZGIgKiBkeCAtIGRhICogZHkpXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKHMgPj0gMCAmJiBzIDw9IDEgJiYgdCA+PSAwICYmIHQgPD0gMSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5idWlsZEVkZ2VzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcDE7XHJcbiAgICAgICAgICAgIHZhciBwMjtcclxuICAgICAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLnJFZGdlcyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHAxID0gdGhpcy52ZXJ0aWNlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChpICsgMSA+PSB0aGlzLnZlcnRpY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAyID0gdGhpcy52ZXJ0aWNlc1swXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcDIgPSB0aGlzLnZlcnRpY2VzW2kgKyAxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZWRnZXMucHVzaChwMi5zdWIocDEpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuckVkZ2VzLnB1c2goe3AxOiBuZXcgUmVuZGVySnMuVmVjdG9yKHAxLngsIHAxLnkpLCBwMjogbmV3IFJlbmRlckpzLlZlY3RvcihwMi54LCBwMi55KX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRDZW50ZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbFggPSAwO1xyXG4gICAgICAgICAgICB2YXIgdG90YWxZID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbFggKz0gdGhpcy52ZXJ0aWNlc1tpXS54O1xyXG4gICAgICAgICAgICAgICAgdG90YWxZICs9IHRoaXMudmVydGljZXNbaV0ueTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZW5kZXJKcy5WZWN0b3IodG90YWxYIC8gdGhpcy52ZXJ0aWNlcy5sZW5ndGgsIHRvdGFsWSAvIHRoaXMudmVydGljZXMubGVuZ3RoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLm9mZnNldCA9IGZ1bmN0aW9uICh4LCB5KSB7XHJcbiAgICAgICAgICAgIHZhciB2ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/IG5ldyBSZW5kZXJKcy5WZWN0b3IoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pIDogYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICB0aGlzLnBvcy5zZXQodGhpcy5wb3MuYWRkKHYpKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcCA9IHRoaXMudmVydGljZXNbaV07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnRpY2VzW2ldLnNldChwLmFkZCh2KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zdWJQb2x5cyA9IHRoaXMuZGVjb21wb3NlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCI7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgIT0gXCJcIikgcmVzdWx0ICs9IFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwie1wiICsgdGhpcy52ZXJ0aWNlc1tpXS50b1N0cmluZyh0cnVlKSArIFwifVwiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi1mcHMgaXMgdGhlIGZyYW1lIHBlciBzZWNvbmRcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4KSB7XHJcbiAgICAgICAgICAgIHZhciBjb2xvcnMgPSBbXCJpbmRpYW5yZWRcIiwgXCJ5ZWxsb3dcIiwgJ2dyZWVuJ107XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJQb2x5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZlcnRpY2VzID0gdGhpcy5zdWJQb2x5c1tpXS52ZXJ0aWNlcztcclxuICAgICAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8odmVydGljZXNbMF0ueCwgdmVydGljZXNbMF0ueSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMTsgaiA8IHZlcnRpY2VzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyh2ZXJ0aWNlc1tqXS54LCB2ZXJ0aWNlc1tqXS55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3JzW2ldO1xyXG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTsiLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYSByZWN0YW5nbGUgc2hhcGUsIGluaGVyaXRzIGZyb20gc2hhcGVcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuUmVjdGFuZ2xlID0gaW5qZWN0KFwiVXRpbHNcIilcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBvcHRpb25zKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYmFzZShvcHRpb25zKTtcclxuICAgICAgICB0aGlzLmNvbG9yID0gb3B0aW9ucy5jb2xvcjtcclxuICAgICAgICB0aGlzLmZpbGxDb2xvciA9IG9wdGlvbnMuZmlsbENvbG9yO1xyXG4gICAgICAgIHRoaXMubGluZVdpZHRoID0gb3B0aW9ucy5saW5lV2lkdGggfHwgMTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKkZ1bmN0aW9uIGlzIGNhbGxlZCBpbiBldmVyeSBmcmFtZSB0byByZWRyYXcgaXRzZWxmXHJcbiAgICAgICAgICotY3R4IGlzIHRoZSBkcmF3aW5nIGNvbnRleHQgZnJvbSBhIGNhbnZhc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChjdHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KHRoaXMucG9zLngsIHRoaXMucG9zLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5maWxsQ29sb3IpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCh0aGlzLnBvcy54LCB0aGlzLnBvcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5maWxsQ29sb3I7XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG4iLCJyZWdpc3Rlck5hbWVzcGFjZShcIlJlbmRlckpzLkNhbnZhcy5TaGFwZXNcIik7XHJcblxyXG4vKlxyXG4gKlJlcHJlc2VudHMgYSBzcHJpdGUgaW1hZ2UsIGluaGVyaXRzIGZyb20gc2hhcGVcclxuICovXHJcblJlbmRlckpzLkNhbnZhcy5TaGFwZXMuU3ByaXRlID0gaW5qZWN0KFwiVXRpbHNcIilcclxuICAgIC5iYXNlKFJlbmRlckpzLkNhbnZhcy5PYmplY3QpXHJcbiAgICAuY2xhc3MoZnVuY3Rpb24gKHV0aWxzLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5iYXNlKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIExvY2Fsc1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICB2YXIgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xyXG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBzZWxmLmhlaWdodCA9IGltYWdlLmhlaWdodDtcclxuICAgICAgICAgICAgbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGltYWdlLnNyYyA9IG9wdGlvbnMudXJsO1xyXG4gICAgICAgIHZhciBsb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgZnJhbWVJbmRleCA9IDA7XHJcbiAgICAgICAgdmFyIGZyYW1lQ291bnQgPSBvcHRpb25zLmZyYW1lQ291bnQ7XHJcbiAgICAgICAgdmFyIHN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgbG9vcCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBkZWZBbmltYXRpb24gPSBvcHRpb25zLmRlZkFuaW1hdGlvbjtcclxuICAgICAgICB2YXIgY3VycmVudDtcclxuICAgICAgICB2YXIgcHJldmlvdXM7XHJcbiAgICAgICAgdmFyIGFuaW1hdGlvbnMgPSBvcHRpb25zLmFuaW1hdGlvbnM7XHJcblxyXG4gICAgICAgIHZhciBhbmltYXRpb24gPSBmdW5jdGlvbiAobmFtZSwgaXNMb29wKSB7XHJcbiAgICAgICAgICAgIGZyYW1lSW5kZXggPSAwO1xyXG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgbG9vcCA9IGlzTG9vcDtcclxuICAgICAgICAgICAgaWYgKCFhbmltYXRpb25zW25hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcHJldmlvdXMgPSBjdXJyZW50O1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gYW5pbWF0aW9uc1tuYW1lXTtcclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYW5pbWF0aW9uKGRlZkFuaW1hdGlvbiwgdHJ1ZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRBbmltYXRpb24gPSBmdW5jdGlvbiAobmFtZSwgbG9vcCkge1xyXG4gICAgICAgICAgICBhbmltYXRpb24obmFtZSwgbG9vcCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wb2ludEludGVyc2VjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0UmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGRlZkZyYW1lID0gYW5pbWF0aW9uc1tkZWZBbmltYXRpb25dWzBdO1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IHRoaXMucG9zLngsIHk6IHRoaXMucG9zLnksIHdpZHRoOiBkZWZGcmFtZVsyXSwgaGVpZ2h0OiBkZWZGcmFtZVszXX07XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5yb3RhdGVTaGFwZSA9IGZ1bmN0aW9uIChjdHgsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFuZ2xlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGRlZkZyYW1lID0gYW5pbWF0aW9uc1tkZWZBbmltYXRpb25dWzBdO1xyXG4gICAgICAgICAgICB2YXIgbyA9IG5ldyBSZW5kZXJKcy5WZWN0b3IocG9zaXRpb24ueCArIChkZWZGcmFtZVsyXSAvIDIpLCBwb3NpdGlvbi55ICsgKGRlZkZyYW1lWzNdIC8gMikpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKG8ueCwgby55KTtcclxuICAgICAgICAgICAgY3R4LnJvdGF0ZSh1dGlscy5jb252ZXJ0VG9SYWQodGhpcy5hbmdsZSkpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKC1vLngsIC1vLnkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICpGdW5jdGlvbiBpcyBjYWxsZWQgaW4gZXZlcnkgZnJhbWUgdG8gcmVkcmF3IGl0c2VsZlxyXG4gICAgICAgICAqLWN0eCBpcyB0aGUgZHJhd2luZyBjb250ZXh0IGZyb20gYSBjYW52YXNcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbiAoY3R4LCBmcmFtZSwgc3RhZ2VQb3NpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIWxvYWRlZCB8fCAhc3RhcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgYWJzUG9zaXRpb24gPSB0aGlzLnBvcy5zdWIoc3RhZ2VQb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucm90YXRlU2hhcGUoY3R4LCBhYnNQb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50RnJhbWUgPSBjdXJyZW50W2ZyYW1lSW5kZXhdO1xyXG5cclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWFnZSwgY3VycmVudEZyYW1lWzBdLCBjdXJyZW50RnJhbWVbMV0sIGN1cnJlbnRGcmFtZVsyXSwgY3VycmVudEZyYW1lWzNdLCBhYnNQb3NpdGlvbi54LCBhYnNQb3NpdGlvbi55LCBjdXJyZW50RnJhbWVbMl0sIGN1cnJlbnRGcmFtZVszXSk7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmZsb29yKGZyYW1lLnRpbWUpICUgZnJhbWVDb3VudCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZnJhbWVJbmRleCA9IGZyYW1lSW5kZXggPj0gY3VycmVudC5sZW5ndGggLSAxID8gMCA6IGZyYW1lSW5kZXggKyAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyYW1lSW5kZXggPT09IDAgJiYgIWxvb3ApIHtcclxuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb24oZGVmQW5pbWF0aW9uLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5hbmdsZSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9