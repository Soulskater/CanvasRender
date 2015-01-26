var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Layer = function (container, width, height, active) {
    /*
     * Locals
     */
    var _self = this;
    var _initialized = false;
    var _eventManager = new EventManager();
    var _time = 0;

    //Click internal event handler
    var _clickHandler = function (event, position) {
        position = position || Utils.getMousePos(event.target, event);
        _eventManager.trigger(RenderJs.Canvas.Events.click, [event, position]);
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

    //Mousemove internal event handler
    var _mousemoveHandler = function (event, position) {
        position = position || Utils.getMousePos(event.target, event);
        _eventManager.trigger(RenderJs.Canvas.Events.mousemove, [event, position]);
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

    //Mouseenter internal event handler
    var _mouseenterHandler = function (event, position) {
        position = position || Utils.getMousePos(event.target, event);
        _eventManager.trigger(RenderJs.Canvas.Events.mouseenter, [event, position]);
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

    //Mouseleave internal event handler
    var _mouseleaveHandler = function (event, position) {
        position = position || Utils.getMousePos(event.target, event);
        _eventManager.trigger(RenderJs.Canvas.Events.mouseleave, [event, position]);
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
        _eventManager.trigger(RenderJs.Canvas.Events.keydown, event);
    };

    var _keyupHandler = function (event) {
        _eventManager.trigger(RenderJs.Canvas.Events.keyup, event);
    };

    var _keypressHandler = function (event) {
        _eventManager.trigger(RenderJs.Canvas.Events.keypress, event);
    };

    //Constructor
    var _init = function (container, width, height, active) {
        document.getElementById(container).appendChild(this.canvas);
        this.canvas.width = width;
        this.canvas.height = height;
        this.active = active;
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
    };

    //For the linked list
    this.prev = null;
    this.next = null;

    //Array of objects on the layer
    this.objects = [];
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.active = false;

    //Subscribe to an event like animate, click, mousemove, mouseenter, mouseleave
    this.on = function (type, handler) {
        if (!RenderJs.Canvas.Events[type]) {
            return;
        }
        return _eventManager.subscribe(type, handler);
    };

    //Add an object to the layer, it will be rendered on this layer
    this.addObject = function (object) {
        if (!(object instanceof RenderJs.Canvas.Object)) {
            console.log("An object on the canvas should be inherited from CanvasObject!");
            return;
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
    this.drawObjects = function (frame) {
        if ((_initialized && !_eventManager.hasSubscribers('animate') && !this.hasSprites(this) && !this.active) || this.objects.length === 0)
        {
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var aktFrameRate = Math.floor(1000 / frame);

        _eventManager.trigger("animate", frame);
        var objectsLoaded = true;
        for (var i = 0, length = this.objects.length; i < length; i++) {
            if (!this.objects[i].loaded) {
                objectsLoaded = false;
            }
            this.objects[i].draw(this.ctx, {
                frameRate: frame,
                lastTime: _time,
                time: _time + aktFrameRate
            });
            //
            //Collision detection
            var collisionObjects = [];
            for (var j = 0, jl = this.objects.length; j < jl; j++) {
                if (this.objects[j].collision && i !== j) {
                    collisionObjects.push(this.objects[j]);
                }
            }

            if (this.objects[i].collision) {
                for (var k = 0, kl = collisionObjects.length; k < kl; k++) {
                    if (RenderJs.Physics.Collisions.checkCollision(this.objects[i], collisionObjects[k])) {
                        this.objects[i].trigger(RenderJs.Canvas.Events.collision, collisionObjects[k]);
                        collisionObjects[k].trigger(RenderJs.Canvas.Events.collision, this.objects[i]);
                    }
                }
            }
        }
        if (objectsLoaded)
            _initialized = true;
        _time += aktFrameRate;
    };

    _init.call(this, container, width, height, active);
};

