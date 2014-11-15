RenderJs.Rect = function (x, y, width, height) {
    this.pos = new RenderJs.Vector(x, y);
    this.width = width;
    this.height = height;
    this.leftEdge = function () {
        //Left
        return { p1: new RenderJs.Vector(this.pos.x, this.pos.y + this.height), p2: new RenderJs.Vector(this.pos.x, this.pos.y) };
    }
    this.rightEdge = function () {
        //Right
        return { p1: new RenderJs.Vector(this.pos.x + this.width, this.pos.y), p2: new RenderJs.Vector(this.pos.x + this.width, this.pos.y + this.height) };
    }
    this.topEdge = function () {
        //Top
        return { p1: new RenderJs.Vector(this.pos.x, this.pos.y), p2: new RenderJs.Vector(this.pos.x + this.width, this.pos.y) };
    };
    this.bottomEdge = function () {
        //Bottom
        return { p1: new RenderJs.Vector(this.pos.x + this.width, this.pos.y + this.height), p2: new RenderJs.Vector(this.pos.x, this.pos.y + this.height) };
    }
}