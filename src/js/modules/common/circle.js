RenderJs.Circle = function (x, y, r) {
    this.pos = new RenderJs.Vector(x, y);
    this.width = 2 * r;
    this.height = 2 * r;

    this.getCenter = function () {
        return new RenderJs.Vector(this.pos.x + this.width / 2, this.pos.y + this.height / 2);
    }

    this.pointInCircle = function (p) {
        c = this.getCenter();

        return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow((this.width / 2), 2);
    }
}