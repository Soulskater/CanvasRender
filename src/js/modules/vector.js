var RenderJs = RenderJs || {};

RenderJs.Vector = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;

    this.set = function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    };

    this.lengthSquared = function () {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    };

    this.length = function () {
        return Math.sqrt(this.lengthSquared());
    };

    this.length2 = function () {
        return this.dot(this);
    };

    this.perp = function () {
        return new RenderJs.Vector(this.y, -this.x);
    };

    this.scale = function (s) {
        return new RenderJs.Vector(this.x * s, this.y * s);
    };

    this.sub = function (v) {
        if (v instanceof RenderJs.Vector) {
            return new RenderJs.Vector(this.x - v.x, this.y - v.y);
        }
        else {
            return new RenderJs.Vector(this.x - v, this.y - v);
        }
    };

    this.add = function (v) {
        if (v instanceof RenderJs.Vector) {
            return new RenderJs.Vector(this.x + v.x, this.y + v.y);
        }
        else {
            return new RenderJs.Vector(this.x + v, this.y + v);
        }
    };

    this.dot = function (v) {
        return this.x * v.x + this.y * v.y;
    };

    this.dist = function (v) {
        return this.sub(v).length();
    };

    this.normalize = function () {
        return this.scale(1 / this.length());
    };

    this.angle = function (v) {
        return this.dot(v) / (this.length() * v.length());
    };

    this.truncate = function (max) {
        var length = Math.min(max, this.length());
        return length;
    };

    this.rotate = function (angle) {
        var x = this.x;
        var y = this.y;
        this.x = x *  Math.cos(Utils.convertToRad(angle)) - y * Math.sin(Utils.convertToRad(angle));
        this.y = y *  Math.cos(Utils.convertToRad(angle)) + x * Math.sin(Utils.convertToRad(angle));
    };

    this.toString = function (rounded) {
        if (rounded) {
            return "(" + Math.round(this.x) + ", " + Math.round(this.y) + ")";
        }
        else {
            return "(" + this.x + ", " + this.y + ")";
        }
    };

};

RenderJs.Vector.clone = function (x, y) {
    return new RenderJs.Vector(x, y);
};

/**
 * Get the area of a triangle spanned by the three given points. Note that the area will be negative if the points are not given in counter-clockwise order.
 * @static
 * @method area
 * @param  {Array} a
 * @param  {Array} b
 * @param  {Array} c
 * @return {Number}
 */
RenderJs.Vector.area = function (a, b, c) {
    return (((b.x - a.x) * (c.y - a.y)) - ((c.x - a.x) * (b.y - a.y)));
};

RenderJs.Vector.left = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) > 0;
};

RenderJs.Vector.leftOn = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) >= 0;
};

RenderJs.Vector.right = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) < 0;
};

RenderJs.Vector.rightOn = function (a, b, c) {
    return RenderJs.Vector.area(a, b, c) <= 0;
};

RenderJs.Vector.sqdist = function (a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    return dx * dx + dy * dy;
};

function Scalar() {
}

/**
 * Check if two scalars are equal
 * @static
 * @method eq
 * @param  {Number} a
 * @param  {Number} b
 * @param  {Number} [precision]
 * @return {Boolean}
 */
Scalar.eq = function (a, b, precision) {
    precision = precision || 0;
    return Math.abs(a - b) < precision;
};