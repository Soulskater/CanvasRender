var LinkedList = function () {
    "use strict";
    var nodes = [];

    this.length = function () {
        return nodes.length;
    };
    this.first = function () {
        return nodes[0];
    };
    this.last = function () {
        return nodes[nodes.length - 1];
    };

    this.buildList = function (nodes) {
        for (var i = 0, length = nodes.length; i < length; i++) {
            if (i === 0) {
                this.first = nodes[i];
            }
            if (i === length - 1) {
                this.last = nodes[i];
            }

            nodes[i].prev = nodes[i - 1];
            nodes[i].next = nodes[i + 1];
            nodes.push(nodes[i]);
        }
    }

    this.append = function (node) {
        var last = this.last();

        if (nodes.length > 0) {
            last.next = node;
            node.prev = last;
        }
        nodes.push(node);
    };

    this.getEnumerator = function () {
        var index = -1;
        return {
            current: function () {
                return nodes[index];
            },
            next: function () {
                if (index === nodes.length - 1) return;
                return nodes[++index];
            },
            prev: function () {
                if (index === 0) {
                    return;
                }
                return nodes[index--];
            }
        };
    };
}