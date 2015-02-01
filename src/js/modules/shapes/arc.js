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