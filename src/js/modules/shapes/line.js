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
