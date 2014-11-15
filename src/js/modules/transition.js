var RenderJs = RenderJs || {};
RenderJs.Canvas = RenderJs.Canvas || {};

RenderJs.Canvas.Easings = RenderJs.Canvas.Easings || {};

RenderJs.Canvas.Easings.BounceEaseOut = function (t, b, c, d) {
    if ((t /= d) < (1 / 2.75)) {
        return c * (7.5625 * t * t) + b;
    }
    else if (t < (2 / 2.75)) {
        return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
    }
    else if (t < (2.5 / 2.75)) {
        return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
    }
    else {
        return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
    }
};

RenderJs.Canvas.Easings.BounceEaseIn = function (t, b, c, d) {
    return c - Kinetic.Easings.BounceEaseOut(d - t, 0, c, d) + b;
};

RenderJs.Canvas.Easings.BounceEaseInOut = function (t, b, c, d) {
    if (t < d / 2) {
        return Kinetic.Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
    }
    else {
        return Kinetic.Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
    }
};

RenderJs.Canvas.Easings.EaseIn = function (t, b, c, d) {
    return c * (t /= d) * t + b;
};

RenderJs.Canvas.Easings.EaseOut = function (t, b, c, d) {
    return -c * (t /= d) * (t - 2) + b;
};

RenderJs.Canvas.Easings.EaseInOut = function (t, b, c, d) {
    if ((t /= d / 2) < 1) {
        return c / 2 * t * t + b;
    }
    return -c / 2 * ((--t) * (t - 2) - 1) + b;
};

RenderJs.Canvas.Easings.ElasticEaseIn = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d) === 1) {
        return b + c;
    }
    if (!p) {
        p = d * 0.3;
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
};

RenderJs.Canvas.Easings.ElasticEaseOut = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d / 2) === 2) {
        return b + c;
    }
    if (!p) {
        p = d * (0.3 * 1.5);
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
};

RenderJs.Canvas.Easings.ElasticEaseInOut = function (t, b, c, d, a, p) {
    // added s = 0
    var s = 0;
    if (t === 0) {
        return b;
    }
    if ((t /= d / 2) === 2) {
        return b + c;
    }
    if (!p) {
        p = d * (0.3 * 1.5);
    }
    if (!a || a < Math.abs(c)) {
        a = c;
        s = p / 4;
    }
    else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
    }
    if (t < 1) {
        return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    }
    return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
};



RenderJs.Canvas.Transition = function (options) {
    var self = this;

    var reverse = false;

    this.duration = options.duration * 1000 || 1000;

    this.shape = options.shape;

    this.props = options.props || {};
    this.origProps = {};
    for (var prop in options.props) {
        this.origProps[prop] = this.shape[prop];
    }

    this.easing = options.easing || RenderJs.Canvas.Easings.EaseInOut;

    var animation = new RenderJs.Canvas.Animation(function (frame) {
        if (frame.time >= self.duration) {
            animation.stop();
        }
        for (var prop in self.props) {
            if (reverse) {
                self.shape[prop] = self.easing(frame.time, self.origProps[prop] + self.props[prop], self.props[prop] * -1, self.duration);
            }
            else {
                self.shape[prop] = self.easing(frame.time, self.origProps[prop], self.props[prop], self.duration);
            }
        }

    }, this.shape.layer);

    this.play = function () {
        animation.start();
    };

    this.pause = function () {
        animation.pause();
    };

    this.stop = function () {
        animation.stop();
    };

    this.reverse = function () {
        reverse = true;
        animation.start();
    };
}