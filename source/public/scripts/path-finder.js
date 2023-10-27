
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
            self.nodes[i].distance = 100000;
            if (self.nodes[i].id === startId) {
                self.nodes[i].distance = 0;
            }
            self.nodes[i].previous = null;

            // setup the joins from each location to other locations that can be moved too
            self.nodes[i].joins = [];
            // go through the joins and look for any tha relate to this node
            for (var k = 0; k < joins.length; k++) {
                var otherId = null;
                if (self.nodes[i].id === joins[k].locations[0]) {
                    otherId = joins[k].locations[1];
                } else if (self.nodes[i].id === joins[k].locations[1]) {
                    otherId = joins[k].locations[0];
                }
                if (otherId != null) {
                    var newJoin = {
                        linkToId: otherId,
                        coordinates: joins[k].coordinates
                    };
                    self.nodes[i].joins.push(newJoin);
                }
            }

            // push this node into the set that we're going to examine
            nodeSet.push(self.nodes[i]);
        }


        console.log("==========================================")
        var iterationCounter = 0;
        while (nodeSet.length > 0) {

            var currentIndex = self.GetIndexWithMinDistance(nodeSet);
            var currentItem = nodeSet[currentIndex];
            console.log("current item is");
            console.log(currentItem);

            nodeSet.splice(currentIndex, 1);
            completedNotes.push(currentItem);

            if (currentItem.id === targetId) {
                console.log("I think we can end here?");
                console.log("==========================================")

                var thePath = self.ConstructNodePath(completedNotes, currentItem);

                return thePath;
            }

            for (var v = 0; v < currentItem.joins.length; v++) {
                var vIndex = self.GetIndexFromCollection(nodeSet, currentItem.joins[v].linkToId);
                //console.log("index returns as " + vIndex);
                if (vIndex >= 0) {
                    console.log("checking alt distance for " + currentItem.joins[v].linkToId);
                    var altDistance = currentItem.distance + 1;
                    if (altDistance < nodeSet[vIndex].distance) {
                        nodeSet[vIndex].distance = altDistance;
                        nodeSet[vIndex].previous = currentItem.id;
                    }
                }
            }

            iterationCounter += 1;
        }

        console.log(completedNotes);

    };

    self.GetIndexWithMinDistance = function (collection) {
        var smallestIndex = null;
        var smallestValue = 999999999;
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].distance < smallestValue) {
                smallestIndex = i;
                smallestValue = collection[i].distance;
            }
        }
        return smallestIndex;
    };

    self.GetIndexFromCollection = function (collection, id) {
        for (var i = 0; i < collection.length; i++) {
            if (collection[i].id === id) {
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
            if (currentItem.previous) {
                var previousIndex = self.GetIndexFromCollection(processedNodes, currentItem.previous);
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
