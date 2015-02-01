registerNamespace("RenderJs.Canvas.Shapes");

/*
 *Represents a line shape, inherits from shape
 */
RenderJs.Canvas.Shapes.Polygon = inject("Utils")
    .base(RenderJs.Canvas.Object)
    .class(function (utils, options) {
        this.base(options);

        this.color = options.color || "#000";
        this.lineWidth = options.lineWidth || 1;
        this.vertices = options.points || [];
        this.subPolys = [];
        this.edges = [];
        this.rEdges = [];
        this.buildEdges();

        /*
         * Decompose a polygon if it's concave
         */
        this.decompose = function (result, reflexVertices, steinerPoints, delta, maxlevel, level) {
            maxlevel = maxlevel || 100;
            level = level || 0;
            delta = delta || 25;
            result = typeof (result) !== "undefined" ? result : [];
            reflexVertices = reflexVertices || [];
            steinerPoints = steinerPoints || [];

            var upperInt = new RenderJs.Vector(0, 0), lowerInt = new RenderJs.Vector(0, 0), p = new RenderJs.Vector(0, 0); // Points
            var upperDist = 0, lowerDist = 0, d = 0, closestDist = 0; // scalars
            var upperIndex = 0, lowerIndex = 0, closestIndex = 0; // Integers
            var lowerPoly = new RenderJs.Canvas.Shapes.Polygon(), upperPoly = new RenderJs.Canvas.Shapes.Polygon(); // polygons
            var poly = this,
                v = this.vertices;

            if (v.length < 3) {
                return result;
            }

            level++;
            if (level > maxlevel) {
                console.warn("quickDecomp: max level (" + maxlevel + ") reached.");
                return result;
            }

            for (var i = 0; i < this.vertices.length; ++i) {
                if (poly.isReflex(i)) {
                    reflexVertices.push(poly.vertices[i]);
                    upperDist = lowerDist = Number.MAX_VALUE;


                    for (var j = 0; j < this.vertices.length; ++j) {
                        if (RenderJs.Vector.left(poly.at(i - 1), poly.at(i), poly.at(j))
                            && RenderJs.Vector.rightOn(poly.at(i - 1), poly.at(i), poly.at(j - 1))) { // if line intersects with an edge
                            p = this.getIntersectionPoint(poly.at(i - 1), poly.at(i), poly.at(j), poly.at(j - 1)); // find the point of intersection
                            if (RenderJs.Vector.right(poly.at(i + 1), poly.at(i), p)) { // make sure it's inside the poly
                                d = RenderJs.Vector.sqdist(poly.vertices[i], p);
                                if (d < lowerDist) { // keep only the closest intersection
                                    lowerDist = d;
                                    lowerInt = p;
                                    lowerIndex = j;
                                }
                            }
                        }
                        if (RenderJs.Vector.left(poly.at(i + 1), poly.at(i), poly.at(j + 1))
                            && RenderJs.Vector.rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                            p = this.getIntersectionPoint(poly.at(i + 1), poly.at(i), poly.at(j), poly.at(j + 1));
                            if (RenderJs.Vector.left(poly.at(i - 1), poly.at(i), p)) {
                                d = RenderJs.Vector.sqdist(poly.vertices[i], p);
                                if (d < upperDist) {
                                    upperDist = d;
                                    upperInt = p;
                                    upperIndex = j;
                                }
                            }
                        }
                    }

                    // if there are no vertices to connect to, choose a point in the middle
                    if (lowerIndex == (upperIndex + 1) % this.vertices.length) {
                        //console.log("Case 1: Vertex("+i+"), lowerIndex("+lowerIndex+"), upperIndex("+upperIndex+"), poly.size("+this.vertices.length+")");
                        p.x = (lowerInt.x + upperInt.x) / 2;
                        p.y = (lowerInt.y + upperInt.y) / 2;
                        steinerPoints.push(p);

                        if (i < upperIndex) {
                            //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.begin() + upperIndex + 1);
                            lowerPoly.append(poly, i, upperIndex + 1);
                            lowerPoly.vertices.push(p);
                            upperPoly.vertices.push(p);
                            if (lowerIndex != 0) {
                                //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.end());
                                upperPoly.append(poly, lowerIndex, poly.vertices.length);
                            }
                            //upperPoly.insert(upperPoly.end(), poly.begin(), poly.begin() + i + 1);
                            upperPoly.append(poly, 0, i + 1);
                        } else {
                            if (i != 0) {
                                //lowerPoly.insert(lowerPoly.end(), poly.begin() + i, poly.end());
                                lowerPoly.append(poly, i, poly.vertices.length);
                            }
                            //lowerPoly.insert(lowerPoly.end(), poly.begin(), poly.begin() + upperIndex + 1);
                            lowerPoly.append(poly, 0, upperIndex + 1);
                            lowerPoly.vertices.push(p);
                            upperPoly.vertices.push(p);
                            //upperPoly.insert(upperPoly.end(), poly.begin() + lowerIndex, poly.begin() + i + 1);
                            upperPoly.append(poly, lowerIndex, i + 1);
                        }
                    } else {
                        // connect to the closest point within the triangle
                        //console.log("Case 2: Vertex("+i+"), closestIndex("+closestIndex+"), poly.size("+this.vertices.length+")\n");

                        if (lowerIndex > upperIndex) {
                            upperIndex += this.vertices.length;
                        }
                        closestDist = Number.MAX_VALUE;

                        if (upperIndex < lowerIndex) {
                            return result;
                        }

                        for (var j = lowerIndex; j <= upperIndex; ++j) {
                            if (RenderJs.Vector.leftOn(poly.at(i - 1), poly.at(i), poly.at(j))
                                && RenderJs.Vector.rightOn(poly.at(i + 1), poly.at(i), poly.at(j))) {
                                d = RenderJs.Vector.sqdist(poly.at(i), poly.at(j));
                                if (d < closestDist) {
                                    closestDist = d;
                                    closestIndex = j % this.vertices.length;
                                }
                            }
                        }

                        if (i < closestIndex) {
                            lowerPoly.append(poly, i, closestIndex + 1);
                            if (closestIndex !== 0) {
                                upperPoly.append(poly, closestIndex, v.length);
                            }
                            upperPoly.append(poly, 0, i + 1);
                        } else {
                            if (i !== 0) {
                                lowerPoly.append(poly, i, v.length);
                            }
                            lowerPoly.append(poly, 0, closestIndex + 1);
                            upperPoly.append(poly, closestIndex, i + 1);
                        }
                    }

                    // solve smallest poly first
                    if (lowerPoly.vertices.length < upperPoly.vertices.length) {
                        lowerPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                        upperPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                    } else {
                        upperPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                        lowerPoly.decompose(result, reflexVertices, steinerPoints, delta, maxlevel, level);
                    }
                    for (var k = 0; k < result.length; k++) {
                        result[k].buildEdges();
                    }
                    return result;
                }
            }
            result.push(this);

            return result;
        };

        /*
         * Append points "from" to "to"-1 from an other polygon "poly" onto this one.
         * @method append
         * @param {Polygon} poly The polygon to get points from.
         * @param {Number}  from The vertex index in "poly".
         * @param {Number}  to The end vertex index in "poly". Note that this vertex is NOT included when appending.
         * @return {Array}
         */
        this.append = function (poly, from, to) {
            if (typeof (from) === "undefined") throw new Error("From is not given!");
            if (typeof (to) === "undefined") throw new Error("To is not given!");

            if (to - 1 < from) throw new Error("lol1");
            if (to > poly.vertices.length) throw new Error("lol2");
            if (from < 0) throw new Error("lol3");

            for (var i = from; i < to; i++) {
                this.vertices.push(poly.vertices[i]);
            }
        };

        /*
         * Get a vertex at position i. It does not matter if i is out of bounds, this function will just cycle.
         * @method at
         * @param  {Number} i
         * @return {Array}
         */
        this.at = function (i) {
            var v = this.vertices,
                s = v.length;
            return v[i < 0 ? i % s + s : i % s];
        };

        /*
         * Get first vertex
         * @method first
         * @return {Array}
         */
        this.first = function () {
            return this.vertices[0];
        };

        /*
         * Get last vertex
         * @method last
         * @return {Array}
         */
        this.last = function () {
            return this.vertices[this.vertices.length - 1];
        };


        /*
         * Checks that the line segments of this polygon do not intersect each other.
         * @method isSimple
         * @param  {Array} path An array of vertices e.g. [[0,0],[0,1],...]
         * @return {Boolean}
         * @todo Should it check all segments with all others?
         */
        this.isSimple = function () {
            var path = this.vertices;
            // Check
            for (var i = 0; i < path.length - 1; i++) {
                for (var j = 0; j < i - 1; j++) {
                    if (this.segmentsIntersect(path[i], path[i + 1], path[j], path[j + 1])) {
                        return false;
                    }
                }
            }

            // Check the segment between the last and the first point to all others
            for (var i = 1; i < path.length - 2; i++) {
                if (this.segmentsIntersect(path[0], path[path.length - 1], path[i], path[i + 1])) {
                    return false;
                }
            }

            return true;
        };

        this.getIntersectionPoint = function (p1, p2, q1, q2, delta) {
            delta = delta || 0;
            var a1 = p2.y - p1.y;
            var b1 = p1.x - p2.x;
            var c1 = (a1 * p1.x) + (b1 * p1.y);
            var a2 = q2.y - q1.y;
            var b2 = q1.x - q2.x;
            var c2 = (a2 * q1.x) + (b2 * q1.y);
            var det = (a1 * b2) - (a2 * b1);

            if (!Scalar.eq(det, 0, delta))
                return RenderJs.Vector.clone(((b2 * c1) - (b1 * c2)) / det, ((a1 * c2) - (a2 * c1)) / det);
            else
                return RenderJs.Vector.clone(0, 0);
        }

        /*
         * Check if a point in the polygon is a reflex point
         * @method isReflex
         * @param  {Number}  i
         * @return {Boolean}
         */
        this.isReflex = function (i) {
            return RenderJs.Vector.right(this.at(i - 1), this.at(i), this.at(i + 1));
        };

        this.makeCCW = function () {
            var br = 0,
                v = this.vertices;

            // find bottom right point
            for (var i = 1; i < this.vertices.length; ++i) {
                if (v[i].y < v[br].y || (v[i].y == v[br].y && v[i].x > v[br].x)) {
                    br = i;
                }
            }

            // reverse poly if clockwise
            if (!RenderJs.Vector.left(this.at(br - 1), this.at(br), this.at(br + 1))) {
                this.reverse();
            }
        };
        /*
         * Reverse the vertices in the polygon
         * @method reverse
         */
        this.reverse = function () {
            var tmp = [];
            for (var i = 0, N = this.vertices.length; i !== N; i++) {
                tmp.push(this.vertices.pop());
            }
            this.vertices = tmp;
        };

        this.segmentsIntersect = function (p1, p2, q1, q2) {
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var da = q2.x - q1.x;
            var db = q2.y - q1.y;

            // segments are parallel
            if (da * dy - db * dx == 0)
                return false;

            var s = (dx * (q1.y - p1.y) + dy * (p1.x - q1.x)) / (da * dy - db * dx)
            var t = (da * (p1.y - q1.y) + db * (q1.x - p1.x)) / (db * dx - da * dy)

            return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
        };

        this.buildEdges = function () {
            var p1;
            var p2;
            this.edges = [];
            this.rEdges = [];
            for (var i = 0; i < this.vertices.length; i++) {
                p1 = this.vertices[i];
                if (i + 1 >= this.vertices.length) {
                    p2 = this.vertices[0];
                } else {
                    p2 = this.vertices[i + 1];
                }
                this.edges.push(p2.sub(p1));
                this.rEdges.push({p1: new RenderJs.Vector(p1.x, p1.y), p2: new RenderJs.Vector(p2.x, p2.y)});
            }
        };

        this.getCenter = function () {
            var totalX = 0;
            var totalY = 0;
            for (var i = 0; i < this.vertices.length; i++) {
                totalX += this.vertices[i].x;
                totalY += this.vertices[i].y;
            }

            return new RenderJs.Vector(totalX / this.vertices.length, totalY / this.vertices.length);
        };

        this.offset = function (x, y) {
            var v = arguments.length === 2 ? new RenderJs.Vector(arguments[0], arguments[1]) : arguments[0];
            this.pos.set(this.pos.add(v));
            for (var i = 0; i < this.vertices.length; i++) {
                var p = this.vertices[i];
                this.vertices[i].set(p.add(v));
            }
            this.subPolys = this.decompose();
        };

        this.toString = function () {
            var result = "";

            for (var i = 0; i < this.vertices.length; i++) {
                if (result != "") result += " ";
                result += "{" + this.vertices[i].toString(true) + "}";
            }

            return result;
        };

        /*
         *Function is called in every frame to redraw itself
         *-ctx is the drawing context from a canvas
         *-fps is the frame per second
         */
        this.draw = function (ctx) {
            var colors = ["indianred", "yellow", 'green'];
            for (var i = 0; i < this.subPolys.length; i++) {
                var vertices = this.subPolys[i].vertices;
                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (var j = 1; j < vertices.length; j++) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.closePath();
                ctx.lineWidth = this.lineWidth;
                ctx.strokeStyle = this.color;
                ctx.fillStyle = colors[i];
                ctx.fill();
                ctx.stroke();
            }
        };
    });