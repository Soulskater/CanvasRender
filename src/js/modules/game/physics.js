var RenderJs = RenderJs || {};
RenderJs.Physics = RenderJs.Physics || {};

RenderJs.Physics.Collisions = (function (module) {

    var _rayCastingAlg = function (p, edge) {
        'takes a point p=Pt() and an edge of two endpoints a,b=Pt() of a line segment returns boolean';
        var _eps = 0.00001;
        var _huge = Number.MAX_VALUE;
        var _tiny = Number.MIN_VALUE;
        var m_blue, m_red = 0;
        var a = edge.p1;
        var b = edge.p2;

        if (a.y > b.y) {
            a.set(b);
            b.set(a);
        }
        if (p.y == a.y || p.y == b.y)
            p.y += _eps;

        var intersect = false;

        if ((p.y > b.y || p.y < a.y) || (p.x > Math.max(a.x, b.x)))
            return false;

        if (p.x < Math.min(a.x, b.x))
            intersect = true;
        else {
            if (Math.abs(a.x - b.x) > _tiny)
                m_red = (b.y - a.y) / (b.x - a.x);
            else
                m_red = _huge;

            if (Math.abs(a.x - p.x) > _tiny)
                m_blue = (p.y - a.y) / (p.x - a.x);
            else
                m_blue = _huge
            intersect = m_blue >= m_red;
        }

        return intersect;
    }

    var _vornoiRegion = function (line, point) {
        var len2 = line.length2();
        var dp = point.dot(line);
        // If the point is beyond the start of the line, it is in the
        // left vornoi region.
        if (dp < 0) {
            return -1;
        }
        // If the point is beyond the end of the line, it is in the
        // right vornoi region.
        else if (dp > len2) {
            return 1;
        }
        // Otherwise, it's in the middle one.
        else {
            return 0;
        }
    }

    var _pointInPolygon = function (p, polygon) {
        var res = false;
        for (var i = 0; i < polygon.rEdges.length; i++) {
            if (_rayCastingAlg(p, polygon.rEdges[i]))
                res = !res;
        }
        return res;
    }

    var _pointInLine = function (p, line) {
        var m = (line.pos2.y - line.pos.y) / (line.pos2.x - line.pos.x);

        return p.y - line.pos.y == m * (p.x - line.pos.y);
    }

    var _pointInCircle = function (p, c) {
        o = c.getCenter();

        return Math.pow(p.x - o.x, 2) + Math.pow(p.y - o.y, 2) <= Math.pow((this.width / 2), 2);
    }

    var _rectVsRect = function (r1, r2) {
        var tw = r1.width;
        var th = r1.height;
        var rw = r2.width;
        var rh = r2.height;
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        var tx = r1.x;
        var ty = r1.y;
        var rx = r2.x;
        var ry = r2.y;
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        //overflow || intersect
        return ((rw < rx || rw > tx) &&
        (rh < ry || rh > ty) &&
        (tw < tx || tw > rx) &&
        (th < ty || th > ry));
    }

    var _rectVsCircle = function (r, c) {
        return _pointInRectangle(c.getCenter(), r) ||
            _lineVsCircle(r.topEdge(), c) ||
            _lineVsCircle(r.rightEdge(), c) ||
            _lineVsCircle(r.bottomEdge(), c) ||
            _lineVsCircle(r.leftEdge(), c);
    }

    var _lineVsCircle = function (l, c) {
        var co = c.getCenter();
        var r = c.radius;
        var d = new RenderJs.Vector(l.pos2.x - l.pos.x, l.pos2.y - l.pos.y);
        var f = new RenderJs.Vector(l.pos.x - co.x, l.pos.y - co.y);

        var a = d.dot(d);
        var b = 2 * f.dot(d);
        var c = f.dot(f) - r * r;

        var discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            // no intersection
            return false;
        }
        else {
            // ray didn't totally miss sphere,
            // so there is a solution to
            // the equation.

            discriminant = Math.sqrt(discriminant);

            // either solution may be on or off the ray so need to test both
            // t1 is always the smaller value, because BOTH discriminant and
            // a are nonnegative.
            var t1 = (-b - discriminant) / (2 * a);
            var t2 = (-b + discriminant) / (2 * a);

            // 3x HIT cases:
            //          -o->             --|-->  |            |  --|->
            // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

            // 3x MISS cases:
            //       ->  o                     o ->              | -> |
            // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

            if (t1 >= 0 && t1 <= 1) {
                // t1 is the intersection, and it's closer than t2
                // (since t1 uses -b - discriminant)
                // Impale, Poke
                return true;
            }

            // here t1 didn't intersect so we are either started
            // inside the sphere or completely past it
            if (t2 >= 0 && t2 <= 1) {
                // ExitWound
                return true;
            }

            // no intn: FallShort, Past, CompletelyInside
            return false;
        }
    }

    var _circleVsCircle = function (c1, c2) {
        var velocity = c2.v;
        //add both radii together to get the colliding distance
        var totalRadius = c1.radius + c2.radius;
        //find the distance between the two circles using Pythagorean theorem. No square roots for optimization
        var distanceSquared = (c1.pos.x - c2.pos.x) * (c1.pos.x - c2.pos.x) + (c1.pos.y - c2.pos.y) * (c1.pos.y - c2.pos.y);
        //if your distance is less than the totalRadius square(because distance is squared)
        if (distanceSquared < totalRadius * totalRadius) {
            var distance = Math.sqrt(distanceSquared);

            var separation = totalRadius - distance;
            var unitVector = new RenderJs.Vector(c1.pos.sub(c2.pos).x / distance, c1.pos.sub(c2.pos).y / distance);
            var diffV = c2.pos.sub(c1.pos);

            //find the movement needed to separate the circles
            return velocity.add(unitVector.scale(separation / 2));//new RenderJs.Vector((c2.pos.x - c1.pos.x) * difference, (c2.pos.y - c1.pos.y) * difference);
        }
        return null; //no collision, return null
    }

    var _circleVsPolygon = function (circle, polygon) {
        // Get the position of the circle relative to the polygon.
        var circlePos = circle.pos.sub(polygon.pos);
        var radius = circle.radius;
        var radius2 = radius * radius;
        var points = polygon.vertices.slice();
        var len = points.length;
        var edge = new RenderJs.Vector(0, 0);
        var point = new RenderJs.Vector(0, 0);
        var response = {
            overlap: Number.MAX_VALUE,
            overlapN: new RenderJs.Vector(0, 0),
            overlapV: new RenderJs.Vector(0, 0)
        };
        // For each edge in the polygon:
        for (var i = 0; i < len; i++) {
            var next = i === len - 1 ? 0 : i + 1;
            var prev = i === 0 ? len - 1 : i - 1;
            var overlap = 0;
            var overlapN = null;

            // Get the edge.
            edge.set(polygon.vertices[i]);
            // Calculate the center of the circle relative to the starting point of the edge.
            point.set(circlePos);
            point.set(point.sub(points[i]));
            // If the distance between the center of the circle and the point
            // is bigger than the radius, the polygon is definitely not fully in
            // the circle.
            if (response && point.length2() > radius2) {
                response['aInB'] = false;
            }

            // Calculate which Vornoi region the center of the circle is in.
            var region = _vornoiRegion(edge, point);
            // If it's the left region:
            if (region === -1) {
                // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
                edge.set(polygon.edges[prev]);
                // Calculate the center of the circle relative the starting point of the previous edge
                var point2 = new RenderJs.Vector(0, 0).set(circlePos).sub(points[prev]);
                region = _vornoiRegion(edge, point2);
                if (region === 1) {
                    // It's in the region we want.  Check if the circle intersects the point.
                    var dist = point.length();
                    if (dist > radius) {
                        // No intersection
                        return false;
                    } else if (response) {
                        // It intersects, calculate the overlap.
                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }
                // If it's the right region:
            } else if (region === 1) {
                // We need to make sure we're in the left region on the next edge
                edge.set(polygon.edges[next]);
                // Calculate the center of the circle relative to the starting point of the next edge.
                point.set(circlePos);
                point.set(point.sub(points[next]));
                region = _vornoiRegion(edge, point);
                if (region === -1) {
                    // It's in the region we want.  Check if the circle intersects the point.
                    var dist = point.length();
                    if (dist > radius) {
                        // No intersection
                        return false;
                    } else if (response) {
                        // It intersects, calculate the overlap.
                        response['bInA'] = false;
                        overlapN = point.normalize();
                        overlap = radius - dist;
                    }
                }
                // Otherwise, it's the middle region:
            } else {
                // Need to check if the circle is intersecting the edge,
                // Change the edge into its "edge normal".
                var normal = edge.perp().normalize();
                // Find the perpendicular distance between the center of the 
                // circle and the edge.
                var dist = point.dot(normal);
                var distAbs = Math.abs(dist);
                // If the circle is on the outside of the edge, there is no intersection.
                if (dist > 0 && distAbs > radius) {
                    // No intersection
                    return false;
                } else if (response) {
                    // It intersects, calculate the overlap.
                    overlapN = normal;
                    overlap = radius - dist;
                    // If the center of the circle is on the outside of the edge, or part of the
                    // circle is on the outside, the circle is not fully inside the polygon.
                    if (dist >= 0 || overlap < 2 * radius) {
                        response['bInA'] = false;
                    }
                }
            }

            // If this is the smallest overlap we've seen, keep it. 
            // (overlapN may be null if the circle was in the wrong Vornoi region).
            if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
                response['overlap'] = overlap;
                response['overlapN'] = new RenderJs.Vector(0, 0).set(overlapN);
            }
        }

        // Calculate the final overlap vector - based on the smallest overlap.
        if (response) {
            response['a'] = polygon;
            response['b'] = circle;
            response['overlapV'] = new RenderJs.Vector(0, 0).set(response['overlapN']).scale(response['overlap']);
        }
        return true;

        //var test1;//numbers for testing max/mins
        //var test2;
        //var test;
        //var min1;//same as above
        //var max1;
        //var min2;
        //var max2;
        //var normalAxis;
        //var offset;
        //var vectorOffset;
        //var vectors;
        //var p2;
        //var distance;
        //var testDistance = Number.MAX_VALUE;
        //var closestVector = new RenderJs.Vector(0, 0);//the vector to use to find the normal
        //// find offset
        //vectorOffset = new RenderJs.Vector(polygon.pos.x - circle.pos.x, polygon.pos.y - circle.pos.y);
        //vectors = polygon.vertices.slice();//again, this is just a function in my polygon class that returns the vertices of the polgon
        ////adds some padding to make it more accurate
        //if (vectors.length == 2) {
        //    var temp = new RenderJs.Vector(-(vectors[1].y - vectors[0].y), vectors[1].x - vectors[0].x);
        //    temp.truncate(0.0000000001);
        //    vectors.push(vectors[1].add(temp));
        //}
        //// find the closest vertex to use to find normal
        //for (var i = 0; i < vectors.length; i++) {
        //    distance = (circle.pos.x - (polygon.pos.x + vectors[i].x)) * (circle.pos.x - (polygon.pos.x + vectors[i].x)) + (circle.pos.y - (polygon.pos.y + vectors[i].y)) * (circle.pos.y - (polygon.pos.y + vectors[i].y));
        //    if (distance < testDistance) {//closest has the lowest distance
        //        testDistance = distance;
        //        closestVector.x = polygon.pos.x + vectors[i].x;
        //        closestVector.y = polygon.pos.y + vectors[i].y;
        //    }
        //}
        ////get the normal vector
        //normalAxis = new RenderJs.Vector(closestVector.x - circle.pos.x, closestVector.y - circle.pos.y);
        //normalAxis.set(normalAxis.normalize());//normalize is(set its length to 1)
        //// project the polygon's points
        //min1 = normalAxis.dot(vectors[0]);
        //max1 = min1;//set max and min
        //for (j = 1; j < vectors.length; j++) {//project all its points, starting with the first(the 0th was done up there^)
        //    test = normalAxis.dot(vectors[j]);//dotProduct to project
        //    if (test < min1) min1 = test;//smallest min is wanted
        //    if (test > max1) max1 = test;//largest max is wanted
        //}
        //// project the circle
        //max2 = circle.radius;//max is radius
        //min2 -= circle.radius;//min is negative radius
        //// offset the polygon's max/min
        //offset = normalAxis.dot(vectorOffset);
        //min1 += offset;
        //max1 += offset;
        //// do the big test
        //test1 = min1 - max2;
        //test2 = min2 - max1;
        //if (test1 > 0 || test2 > 0) {//if either test is greater than 0, there is a gap, we can give up now.
        //    return null;
        //}
        //// find the normal axis for each point and project
        //for (i = 0; i < vectors.length; i++) {
        //    normalAxis = _findNormalAxis(vectors, i);
        //    // project the polygon(again? yes, circles vs. polygon require more testing...)
        //    min1 = normalAxis.dot(vectors[0]);//project
        //    max1 = min1;//set max and min
        //    //project all the other points(see, cirlces v. polygons use lots of this...)
        //    for (j = 1; j < vectors.length; j++) {
        //        test = normalAxis.dot(vectors[j]);//more projection
        //        if (test < min1) min1 = test;//smallest min
        //        if (test > max1) max1 = test;//largest max
        //    }
        //    // project the circle(again)
        //    max2 = circle.radius;//max is radius
        //    min2 -= circle.radius;//min is negative radius
        //    //offset points
        //    offset = normalAxis.dot(vectorOffset);
        //    min1 += offset;
        //    max1 += offset;
        //    // do the test, again
        //    test1 = min1 - max2;
        //    test2 = min2 - max1;
        //    if (test1 > 0 || test2 > 0) {
        //        //failed.. quit now
        //        return null
        //    }
        //}
        //return new RenderJs.Vector(normalAxis.x * (max2 - min1) * -1, normalAxis.y * (max2 - min1) * -1);//return the separation distance
    }

    var _pointInRectangle = function (p, r) {
        return (p.x >= r.x &&
        p.x <= r.x + r.width &&
        p.y >= r.y &&
        p.y <= r.y + r.height);
    }

    module.AabbCollision = function (rectA, rectB) {
        if (Math.abs(rectA.x - rectB.x) < rectA.width + rectB.width) {
            if (Math.abs(rectA.y - rectB.y) < rectA.height + rectB.height) {
                return true;
            }
        }
        return false;
    };

    module.pointInObject = function (p, obj) {
        if (obj instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _pointInRectangle(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Arc)
            return _pointInCircle(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Polygon)
            return _pointInPolygon(p, obj);
        if (obj instanceof RenderJs.Canvas.Shapes.Line)
            return _pointInLine(p, obj);

        return false;
    }

    module.checkCollision = function (obj1, obj2, velocity) {
        if (obj1 instanceof RenderJs.Canvas.Shapes.Rectangle && obj2 instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _rectVsRect(obj1, obj2);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Rectangle && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _rectVsCircle(obj1, obj2);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Rectangle)
            return _rectVsCircle(obj2, obj1);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _circleVsCircle(obj1, obj2, velocity);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Line && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _lineVsCircle(obj1, obj2);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Line)
            return _lineVsCircle(obj2, obj1);

        if (obj1 instanceof RenderJs.Canvas.Shapes.Polygon && obj2 instanceof RenderJs.Canvas.Shapes.Polygon) {
            for (var i = 0; i < obj1.subPolys.length; i++) {
                for (var j = 0; j < obj2.subPolys.length; j++) {
                    var response = module.polygonCollision(obj1.subPolys[i], obj2.subPolys[j], velocity);
                    if (response.intersect || response.willIntersect)
                        return response;
                }
            }
            return null;//RenderJs.Vector.clone(0, 0);
        }
        if (obj1 instanceof RenderJs.Canvas.Shapes.Arc && obj2 instanceof RenderJs.Canvas.Shapes.Polygon)
            return _circleVsPolygon(obj1, obj2, velocity);
        if (obj1 instanceof RenderJs.Canvas.Shapes.Polygon && obj2 instanceof RenderJs.Canvas.Shapes.Arc)
            return _circleVsPolygon(obj2, obj1, velocity);

        return false;
    }

    return module;

}(RenderJs.Physics.Collisions || {}));