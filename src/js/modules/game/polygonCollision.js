var RenderJs = RenderJs || {};
RenderJs.Physics.Collisions = (function (module) {

    // Check if polygon A is going to collide with polygon B for the given velocity
    module.polygonCollision = function (polygonA, polygonB, velocity) {
        var result = {
            intersect: true,
            willIntersect: true
        }

        var edgeCountA = polygonA.edges.length;
        var edgeCountB = polygonB.edges.length;
        var minIntervalDistance = Infinity;
        var translationAxis = new RenderJs.Vector();
        var edge;

        // Loop through all the edges of both polygons
        for (var edgeIndex = 0, l = edgeCountA + edgeCountB; edgeIndex < l; edgeIndex++) {
            if (edgeIndex < edgeCountA) {
                edge = polygonA.edges[edgeIndex];
            } else {
                edge = polygonB.edges[edgeIndex - edgeCountA];
            }

            // ===== 1. Find if the polygons are currently intersecting =====

            // Find the axis perpendicular to the current edge
            var axis = new RenderJs.Vector(-edge.y, edge.x);
            axis.set(axis.normalize());

            // Find the projection of the polygon on the current axis
            var minA = 0, minB = 0, maxA = 0, maxB = 0;

            var projectedA = _projectPolygon(axis, polygonA, minA, maxA);
            minA = projectedA.min;
            maxA = projectedA.max;

            var projectedB = _projectPolygon(axis, polygonB, minB, maxB);
            minB = projectedB.min;
            maxB = projectedB.max;

            // Check if the polygon projections are currentlty intersecting
            if (_intervalDistance(minA, maxA, minB, maxB) > 0) result.intersect = false;

            // ===== 2. Now find if the polygons *will* intersect =====

            // Project the velocity on the current axis
            var velocityProjection = axis.dot(velocity);

            // Get the projection of polygon A during the movement
            if (velocityProjection < 0) {
                minA += velocityProjection;
            } else {
                maxA += velocityProjection;
            }

            // Do the same test as above for the new projection
            var intervalDistance = _intervalDistance(minA, maxA, minB, maxB);
            if (intervalDistance > 0) result.willIntersect = false;

            // If the polygons are not intersecting and won't intersect, exit the loop
            if (!result.intersect && !result.willIntersect) break;

            // Check if the current interval distance is the minimum one. If so store
            // the interval distance and the current distance.
            // This will be used to calculate the minimum translation vector
            intervalDistance = Math.abs(intervalDistance);
            if (intervalDistance < minIntervalDistance) {
                minIntervalDistance = intervalDistance;
                translationAxis = axis;

                d = polygonA.getCenter().sub(polygonB.getCenter());
                if (d.dot(translationAxis) < 0) translationAxis = translationAxis.scale(-1);
            }
        }

        // The minimum translation vector can be used to push the polygons appart.
        // First moves the polygons by their velocity
        // then move polygonA by MinimumTranslationVector.
        if (result.willIntersect) result.minimumTranslationVector = translationAxis.scale(minIntervalDistance);

        return result;
    }

    // Calculate the distance between [minA, maxA] and [minB, maxB]
    // The distance will be negative if the intervals overlap
    var _intervalDistance = function (minA, maxA, minB, maxB) {
        if (minA < minB) {
            return minB - maxA;
        } else {
            return minA - maxB;
        }
    }

    // Calculate the projection of a polygon on an axis and returns it as a [min, max] interval
    var _projectPolygon = function (axis, polygon, min, max) {
        // To project a point on an axis use the dot product
        var d = axis.dot(polygon.vertices[0]);
        min = d;
        max = d;
        for (var i = 0; i < polygon.vertices.length; i++) {
            d = polygon.vertices[i].dot(axis);
            if (d < min) {
                min = d;
            } else {
                if (d > max) {
                    max = d;
                }
            }
        }
        return {
            min: min,
            max: max
        };
    }

    return module;

}(RenderJs.Physics.Collisions || {}));