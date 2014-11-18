var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};
RenderJs.Canvas.Shapes = RenderJs.Canvas.Shapes || {};
/*
 *Represents a sprite image, inherits from shape
 */
RenderJs.Canvas.Shapes.Sprite = function (options) {

    /*
     * Locals
     */
    var image = document.createElement("img");
    var loaded = false;
    var frameIndex = 0;
    var frameCount = 0;
    var started = false;
    var loop = false;
    var defAnimation = "";
    var current;
    var previous;
    var animations;

    var animation = function (name, isLoop) {
        frameIndex = 0;
        started = true;
        loop = isLoop;
        if (!animations[name]){
            return;
        }
        previous = current;
        current = animations[name];
    };

    /*
     *Constructor
     */
    var _init = function (options) {
        var self = this;

        var options = options || {};
        this._baseInit(options);

        frameCount = options.frameCount;
        defAnimation = options.defAnimation;
        animations = options.animations;
        image.onload = function () {
            self.width = image.width;
            self.height = image.height;
            loaded = true;
        };
        image.src = options.url;
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

    /*
     *Function is called in every frame to redraw itself
     *-ctx is the drawing context from a canvas
     */
    this.draw = function (ctx, frame) {
        if (!loaded || !started) {
            return;
        }

        var aktFrame = frameIndex * 4;

        ctx.drawImage(image, current[aktFrame], current[aktFrame + 1], current[aktFrame + 2], current[aktFrame + 3], this.pos.x, this.pos.y, current[aktFrame + 2], current[aktFrame + 3]);
        if (frame.time % frameCount === 0) {
            frameIndex = (frameIndex * 4 + 4) > current.length - 1 ? 0 : frameIndex + 1;
            if (frameIndex === 0 && !loop) {
                animation(defAnimation, true);
            }
        }
    };

    _init.call(this, options);
};
RenderJs.Canvas.Shapes.Sprite.prototype = new RenderJs.Canvas.Object();
RenderJs.Canvas.Shapes.Sprite.constructor = RenderJs.Canvas.Shapes.Sprite;