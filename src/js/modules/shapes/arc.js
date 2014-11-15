var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};

/*
*Represents a circle shape, inherits from shape
*/
RenderJs.Canvas.Shapes.Arc = function (options) {
    "use strict";

    /*
    *Constructor
    */
    var _init = function (options) {
        options = options || {};
        options.width = options.height = options.radius * 2, options.radius * 2;
        //
        //For the base class
        this._baseInit(options);

        this.radius = options.radius;
        this.sAngle = Utils.convertToRad(options.sAngle || 0);
        this.eAngle = Utils.convertToRad(options.eAngle || 360);
        this.color = options.color;
        this.fillColor = options.fillColor;
        this.lineWidth = options.lineWidth || 1;
    }

    /*
    *Overrides the original function, because the circle center point is not the top,left corner
    */
    this.getCenter = function () {
        return new RenderJs.Vector(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
    }

    /*
    *Overrides the original function
    */
    this.pointIntersect = function (p) {
        var c = this.getCenter();

        return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow((this.width / 2), 2);
    }

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

        ctx.fillStyle = "white";
        ctx.font = "bold 10pt Verdana";
        ctx.fillText("Wheel", this.pos.x + this.radius - 20, this.pos.y + this.radius);
        ctx.closePath();
        if (this.angle !== 0) {
            ctx.restore();
        }
    };

    _init.call(this, options);
    
};
RenderJs.Canvas.Shapes.Arc.prototype = new RenderJs.Canvas.Object();
RenderJs.Canvas.Shapes.Arc.constructor = RenderJs.Canvas.Shapes.Arc;