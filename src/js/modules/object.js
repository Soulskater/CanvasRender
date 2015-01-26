var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};

RenderJs.Canvas.Events = {
    animate: "animate",
    click: "click",
    keydown: "keydown",
    keyup: "keyup",
    keypress: "keypress",
    mousemove: "mousemove",
    mousehover: "mousehover",
    mouseleave: "mouseleave",
    collision: "collision"
};

/*
*Represents a base class for different type of shapes
*/
RenderJs.Canvas.Object = function () {

    var _eventManager = new EventManager();

    this._baseInit = function (options) {
        options = options || {};
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
    };
    /*
    *Returns with the center point of the shape
    */
    this.getCenter = function () {
        return new RenderJs.Vector(this.pos.x + (this.width) / 2, this.pos.y + (this.height) / 2);
    };
    /*
    *Returns with the rect around the shape
    */
    this.getRect = function () {
        return new RenderJs.Rect(this.pos.x, this.pos.y, this.width, this.height);
    };
    /*
     * Filters which will be applied on the object(blur, greyscale etc...)
     */
    this.setfilters = function (filters) {
        this.filters = filters;
    };
    /*
    *Move the shape with the given distances in pixels, during the time
    *-dX move horizontally
    *-dY move vertically
    *-f move function
    *-t animation time
    */
    this.moveShape = function (dX, dY) {
        this.pos = this.pos.add(dX, dY);
    };

    /*
    *Rotate the shape to the given degree, during the time
    *-deg rotation angle
    *-t animation time
    */
    this.rotateShape = function (ctx) {
        if (this.angle === 0)
        {
            return;
        }
        var o = this.getCenter();
        ctx.translate(o.x, o.y);
        ctx.rotate(Utils.convertToRad(this.angle));
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
        return _eventManager.subscribe(type, handler);
    };

    this.trigger = function (event, args) {
        if (!RenderJs.Canvas.Events[event]) {
            return;
        }
        _eventManager.trigger(event, args);
    };
}