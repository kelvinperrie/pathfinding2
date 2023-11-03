
var PathFinder = function (nodes, joins) {
    var self = this;

    self.nodes = nodes;
    self.joins = joins;

    self.CalculatePath = function (startId, targetId) {
        //var startId = $("#location-start").val();
        //var targetId = $("#location-target").val();

        var nodeSet = [];
        var completedNotes = [];

        // -- do some setup
        for (var i = 0; i < self.nodes.length; i++) {
            // set the default distance on each node
            self.nodes[i].extended.distance = 100000;
            if (self.nodes[i].extended.id === startId) {
                self.nodes[i].extended.distance = 0;
            }
            self.nodes[i].extended.previous = null;

            // setup the joins from each location to other locations that can be moved too
            self.nodes[i].extended.joins = [];
            // go through the joins and look for any tha relate to this node
            for (var k = 0; k < joins.length; k++) {
                var otherId = null;
                if (self.nodes[i].extended.id === joins[k].extended.linkFrom) {
                    otherId = joins[k].extended.linkTo;
                } else if (self.nodes[i].extended.id === joins[k].extended.linkTo) {
                    otherId = joins[k].extended.linkFrom;
                }
                if (otherId != null) {
                    var newJoin = {
                        linkToId: otherId,
                        coordinates: joins[k].geometry.coordinates
                    };
                    self.nodes[i].extended.joins.push(newJoin);
                }
            }

            // push this node into the set that we're going to examine
            nodeSet.push(self.nodes[i]);
        }

        //console.log("these are our nodes")

        //console.log(nodeSet)

        console.log("==========================================")
        var iterationCounter = 0;
        while (nodeSet.length > 0) {
            var currentIndex = self.GetIndexWithMinDistance(nodeSet);
            var currentItem = nodeSet[currentIndex];
            // console.log("current item is");
            // console.log(currentItem);

            nodeSet.splice(currentIndex, 1);
            completedNotes.push(currentItem);

            if (currentItem.extended.id === targetId) {
                console.log("I think we can end here?");
                console.log("==========================================")

                var thePath = self.ConstructNodePath(completedNotes, currentItem);
                // console.log(thePath)
                return thePath;
            }

            for (var v = 0; v < currentItem.extended.joins.length; v++) {
                var vIndex = self.GetIndexFromCollection(nodeSet, currentItem.extended.joins[v].linkToId);
                if (vIndex >= 0) {
                    var altDistance = currentItem.extended.distance + 1;
                    if (altDistance < nodeSet[vIndex].extended.distance) {
                        nodeSet[vIndex].extended.distance = altDistance;
                        nodeSet[vIndex].extended.previous = currentItem.extended.id;
                        nodeSet[vIndex].extended.justTraversed = currentItem.extended.joins[v];
                    }
                }
            }

            iterationCounter += 1;
        }

    };

    self.GetIndexWithMinDistance = function (collection) {
        var smallestIndex = null;
        var smallestValue = 999999999;
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].extended.distance < smallestValue) {
                smallestIndex = i;
                smallestValue = collection[i].extended.distance;
            }
        }
        return smallestIndex;
    };

    self.GetIndexFromCollection = function (collection, id) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].extended.id === id) {
                return i;
            }
        }
        return -1;
    };

    self.ConstructNodePath = function (processedNodes, targetItem) {
        // return an array of the names that we need to visit
        var path = [];
        var currentItem = targetItem;
        while (currentItem) {
            path.push(currentItem);
            if (currentItem.extended.previous) {
                var previousIndex = self.GetIndexFromCollection(processedNodes, currentItem.extended.previous);
                var previousItem = processedNodes[previousIndex];
                currentItem = previousItem;
            } else {
                break;
            }
        }
        // get our array in the right order
        path = path.reverse();
        return path;
    };

};
