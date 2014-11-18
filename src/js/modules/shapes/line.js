var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};

/*
*Represents a line shape, inherits from shape
*/
RenderJs.Canvas.Shapes.Line = function (options) {

    this.color = "#000";
    this.lineWidth = 1;

    /*
    *Constructor
    */
    _init = function (options) {
        var options = options || {};
        this._baseInit({
            x: options.x1,
            y: options.y1,
            width: Math.abs(options.x2 - options.x1),
            height: Math.abs(options.y2 - options.y1)
        });
        this.pos2 = new RenderJs.Vector(options.x2, options.y2);
        this.color = options.color;
        this.lineWidth = options.lineWidth || 1;
    };

    /*
    *Function is called in every frame to redraw itself
    *-ctx is the drawing context from a canvas
    *-fps is the frame per second
    */
    this.draw = function (ctx) {
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos2.x, this.pos2.y);

        ctx.closePath();
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.color;
        ctx.stroke();
    };

    _init.call(this, options);
};
RenderJs.Canvas.Shapes.Line.prototype = new RenderJs.Canvas.Object();
RenderJs.Canvas.Shapes.Line.constructor = RenderJs.Canvas.Shapes.Line;