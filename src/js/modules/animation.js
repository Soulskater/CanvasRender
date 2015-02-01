registerNamespace("RenderJs.Canvas");

RenderJs.Canvas.Animation = inject()
    .class(function (handler, layer) {

        var time = 0;
        var subscriber;
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
            if (started) {
                return;
            }
            started = true;
            stopped = paused = false;
            subscriber = layer.on("animate", animation);
        };

        this.reset = function () {
            time = 0;
        };

        this.pause = function () {
            if (started && subscriber) {
                subscriber();
            }

            started = false;
            paused = true;
        };

        this.stop = function () {
            if (started && subscriber) {
                this.reset();
                subscriber();
            }
            started = false;
            stopped = true;
        };
    });