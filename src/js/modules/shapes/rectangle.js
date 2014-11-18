var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};

/*
*Represents a rectangle shape, inherits from shape
*/
RenderJs.Canvas.Shapes.Rectangle = function (options) {

    this.color = undefined;
    this.fillColor = undefined;
    this.lineWidth = 1;

    /*
    *Constructor
    */
    var _init = function (options) {
        var options = options || {};
        this._baseInit(options);

        this.color = options.color;
        this.fillColor = options.fillColor;
        this.lineWidth = options.lineWidth || 1;
    };
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

    _init.call(this, options);
};
RenderJs.Canvas.Shapes.Rectangle.prototype = new RenderJs.Canvas.Object();
RenderJs.Canvas.Shapes.Rectangle.constructor = RenderJs.Canvas.Shapes.Rectangle;