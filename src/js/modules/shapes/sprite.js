registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a sprite image, inherits from shape
 */
RenderJs.Canvas.Shapes.Sprite = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {
        this.base(options);

        /*
         * Locals
         */
        var self = this;
        var image = document.createElement("img");
        image.onload = function () {
            self.width = image.width;
            self.height = image.height;
            loaded = true;
        };
        image.src = options.url;
        var loaded = false;
        var frameIndex = 0;
        var frameCount = options.frameCount;
        var started = false;
        var loop = false;
        var defAnimation = options.defAnimation;
        var current;
        var previous;
        var animations = options.animations;

        var animation = function (name, isLoop) {
            frameIndex = 0;
            started = true;
            loop = isLoop;
            if (!animations[name]) {
                return;
            }
            previous = current;
            current = animations[name];
        };


        this.start = function () {
            animation(defAnimation, true);
        };

        this.setAnimation = function (name, loop) {
            animation(name, loop);
        };

        this.pointIntersect = function () {
            return false;
        };

        this.getRect = function () {
            var defFrame = animations[defAnimation][0];
            return {x: this.pos.x, y: this.pos.y, width: defFrame[2], height: defFrame[3]};
        };

        this.rotateShape = function (ctx, position) {
            if (this.angle === 0) {
                return;
            }
            var defFrame = animations[defAnimation][0];
            var o = new RenderJs.Vector(position.x + (defFrame[2] / 2), position.y + (defFrame[3] / 2));
            ctx.translate(o.x, o.y);
            ctx.rotate(utils.convertToRad(this.angle));
            ctx.translate(-o.x, -o.y);
        };

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         */
        this.draw = function (ctx, frame, stagePosition) {
            if (!loaded || !started) {
                return;
            }

            var absPosition = this.pos.sub(stagePosition);

            if (this.angle !== 0) {
                ctx.save();
                this.rotateShape(ctx, absPosition);
            }

            var currentFrame = current[frameIndex];

            ctx.drawImage(image, currentFrame[0], currentFrame[1], currentFrame[2], currentFrame[3], absPosition.x, absPosition.y, currentFrame[2], currentFrame[3]);
            if (Math.floor(frame.time) % frameCount === 0) {
                frameIndex = frameIndex >= current.length - 1 ? 0 : frameIndex + 1;
                if (frameIndex === 0 && !loop) {
                    animation(defAnimation, true);
                }
            }
            if (this.angle !== 0) {
                ctx.restore();
            }
        };
    });
