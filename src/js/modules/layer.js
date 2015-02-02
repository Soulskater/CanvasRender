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

