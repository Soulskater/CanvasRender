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
