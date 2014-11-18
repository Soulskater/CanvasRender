var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Animation = function (handler, layer) {

    var time = 0;
    var subscriberId = 0;
    var started = false;
    var stopped = false;
    var paused = false;

    var animation = function (frameRate) {
        handler({
            frameRate: frameRate,
            lastTime: time,
            time: time + 1000 / frameRate
        });
        time += 1000 / frameRate;
    };

    this.start = function () {
        started = true;
        stopped = paused = false;
        subscriberId = layer.on("animate", animation);
    };

    this.reset = function () {
        time = 0;
    };

    this.pause = function () {
        if (started) {
            layer.off('animate', subscriberId);
        }

        started = false;
        paused = true;
    };

    this.stop = function () {
        if (started) {
            this.reset();
            layer.off("animate", subscriberId);
        }
        started = false;
        stopped = true;
    };
}