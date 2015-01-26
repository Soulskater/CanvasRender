﻿var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Layer = function (container, width, height, active) {
    /*
     * Locals
     */
    var _self = this;
    var _initialized = false;
    var _eventManager = new EventManager();
    var _time = 0;
    var _rect;

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
        _rect = {x: 0, y: 0, width: width, height: height};
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
    this.visibleObjects = [];

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
        this.isObjectVisible(object);
        var self = this;
        /*object.on(RenderJs.Canvas.Events.objectChanged, function (obj) {
            self.isObjectVisible(obj);
        });*/
    };

    this.isObjectVisible = function (object) {
        var rect = object.getRect();
        if (RenderJs.Physics.Collisions.AabbCollision(_rect, rect)) {
            if (!object.visible) {
                this.visibleObjects.push(object);
                object.visible = true;
            }
        }
        else {
            if (object.visible) {
                this.visibleObjects.splice(this.visibleObjects.indexOf(object), 1);
                object.visible = false;
            }
        }
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
        if ((_initialized && !_eventManager.hasSubscribers('animate') && !this.hasSprites(this) && !this.active) || this.objects.length === 0) {
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        var aktFrameRate = Math.floor(1000 / frame);

        _eventManager.trigger("animate", frame);
        var objectsLoaded = true;
        //console.log(this.visibleObjects.length);
        for (var i = 0, length = this.visibleObjects.length; i < length; i++) {
            if (!this.visibleObjects[i].loaded) {
                objectsLoaded = false;
            }
            this.visibleObjects[i].draw(this.ctx, {
                frameRate: frame,
                lastTime: _time,
                time: _time + aktFrameRate
            });
        }
        if (objectsLoaded)
            _initialized = true;
        _time += aktFrameRate;
    };

    _init.call(this, container, width, height, active);
};

