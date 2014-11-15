RenderJs.Line = function (x1, y1, x2, y2) {
    this.pos = new RenderJs.Vector(x1, y1);
    this.pos2 = new RenderJs.Vector(x2, y2);
    this.width = Math.abs(this.pos2.x - this.pos.x);
    this.height = Math.abs(this.pos2.y - this.pos.y);;
}