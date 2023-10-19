

class MapPage {

    map = L.map('map').setView([-39.19340, 173.98926], 15);
    availableBaseLayers = [];       // a collection of all available tile/base layers; used to swap between them
    allFeatureLayers = [];
    currentLayer = null;        // holds the a reference to the current BASE layer (so that we can remove it if required)
    self = null;
    currentLevel = "1";
    availableLevels = ["B","1","2","3","4","5"];
    layerWithDetailsBeingEdited = null; // what a name! brilliant!

    constructor() {
        
        self = this;

        this.SetupAvailableBaseLayers()

        // create a custom button for changing layers
        // we're going to build up the actions for the button based on how many available layers we have
        let actions = [];
        for (let possibleLayer of this.availableBaseLayers) {
            (function(label){
                actions.push({ text: label, onClick: () => { self.LoadTileLayer(label); } });
            })(possibleLayer.label);
        }
        actions.push('finishMode') // this is the finish button
        // create a custom control to change layers with the above given actions
        this.map.pm.Toolbar.createCustomControl({
            name: 'LayersButton',
            block: 'custom',
            className: 'leaflet-pm-icon-layers',
            title: 'Choose base layer',
            toggle: true,
            actions: actions
        });
        // create a custom control to save, load, or clear annotation data
        this.map.pm.Toolbar.createCustomControl({
            name: 'SaveLoadButton',
            block: 'custom',
            className: 'leaflet-pm-icon-save',
            title: 'Save or load data',
            toggle: true,
            actions: [
                { text: "Save", onClick: () => { self.SaveDataToDb(); } },
                { text: "Load", onClick: () => { self.LoadDataFromDb(); } },
                { text: "Clear", onClick: () => { self.ClearAllDrawingLayers(); } }
            ]
        });

        // hide the toolbar to start with
        //this.map.pm.toggleControls();

        this.map.pm.setPathOptions({snapDistance:5});

        // setup some handlers for the html to interact with this model
        this.map.on('zoom zoomend',(e)=>{
            this.ResizeTextMarkersBasedOnZoom();
        })

        this.map.on("pm:create", (e) => {
            console.log(e);
            this.LayerCreate_handler(e);
        });

        document.getElementById("down-level-trigger").onclick = function(e) { self.ChangeLevelDown_handler(); return false; };
        document.getElementById("up-level-trigger").onclick = function(e) { self.ChangeLevelUp_handler(); return false; };

        document.getElementById("toolBarVisibilityToggle").onclick = function(e) { self.ToggleToolBar_handler(e); return false; };

        document.getElementById("save-layer-details").onclick = function(e) { self.SaveLayerDetails_handler(e); return false; };

        
        // load this layer by default
        this.LoadTileLayer("OpenStreetMap")
        // load the map data from the database and display it on the page
        this.LoadDataFromDb();
        //this.ShowUserMessage("info", "This is an example starting message", -1);
    }

    ChangeLevelDown_handler() {
        let index = this.availableLevels.indexOf(this.currentLevel);
        if(index -1 >= 0) {
            this.currentLevel = this.availableLevels[index -1];
            this.LevelChanged();
        } else {
            console.log("can't go down anymore levels")
        }
    }
    ChangeLevelUp_handler() {
        let index = this.availableLevels.indexOf(this.currentLevel);
        if(index +1 <= this.availableLevels.length-1) {
            this.currentLevel = this.availableLevels[index +1];
            this.LevelChanged();
        } else {
            console.log("can't go up anymore levels")
        }
    }
    LevelChanged() {
        document.getElementById("current-level-display").textContent=this.currentLevel;
        this.ShowOnlyLayersOnGivenLevel();
    }
    ShowOnlyLayersOnGivenLevel() {
        // this.map.eachLayer(function(layer){
        //     if(layer instanceof L.Path || layer instanceof L.Marker){
        //         layer.remove();
        //     }
        // });
        console.log("we're going to look at all the layers and show only the ones on " + this.currentLevel)
        for(let i = 0; i < this.allFeatureLayers.length; i++) {
            this.map.removeLayer(this.allFeatureLayers[i])
            console.log("a layer:");
            console.log(this.allFeatureLayers[i]);
            if(this.allFeatureLayers[i].extended) {
                console.log("this layer is on level: " + this.allFeatureLayers[i].extended.level)
                console.log("indexOf check is: " + this.allFeatureLayers[i].extended.level.indexOf(this.currentLevel))
                if(this.allFeatureLayers[i].extended.level.length == 0) {
                    // no levels, so show it
                    this.map.addLayer(this.allFeatureLayers[i])

                } else if(this.allFeatureLayers[i].extended.level.indexOf(this.currentLevel) >= 0) {
                    // this one should show
                    this.map.addLayer(this.allFeatureLayers[i])
                } else {
                    // this one should be hidden

                }
            } else {
                // no data, so show it
                this.map.addLayer(this.allFeatureLayers[i])

            }
        }
    }

    // toggle the visibility of the toolbar
    ToggleToolBar_handler(event) {
        this.map.pm.toggleControls();
        // update the text on the visibility toggle link
        if(this.map.pm.controlsVisible()) {
            document.getElementById("toolBarVisibilityToggle").textContent="Hide tools"
        } else {
            document.getElementById("toolBarVisibilityToggle").textContent="Show tools"
        }
    }

    SaveLayerDetails_handler(e) {
        console.log("saving the layer details")
        this.SaveLayerDetails();
    }

    LayerCreate_handler(e) {
        console.log("i'm in layer create")

        e.layer.on('click',function(e){
            self.LayerClicked_handler(e);
        });

        e.layer.on("pm:edit", (e) => {
            this.LayerEdited_handler(e);
        });
        this.UpdateLocationDropdowns();
    }

    LayerEdited_handler(e) {
        console.log("consider me edited!")
        console.log(e);
    }

    LayerClicked_handler(e) {
        console.log("consider me clicked!")
        console.log(e);
        this.layerWithDetailsBeingEdited = e.sourceTarget;
        console.log("just set layerwithdetailsbeing edited")
        console.log(this.layerWithDetailsBeingEdited)
        this.DisplayLayerDetails(e.sourceTarget);
    }

    GetListOfAllLocations() {
        let locations = [];
        this.map.eachLayer(function(layer){
            if(layer instanceof L.Path){
                if(layer.extended) {
                    let locationId = layer.extended.id;
                    let locationName = layer.extended.name;
                    let location = { id: locationId, name: locationName };
                    if(locationId && locationName) {
                        locations.push(location);
                    } else {
                        console.log("there is a location without an id or name; id: " + locationId + ", name:" + locationName);
                    }
                } else {
                    console.log("there is a layer with no extended object, very sad, can't add to list of locations")
                }
            }
        });
        locations = locations.sort((a, b) => a.name.localeCompare(b.name));
        return locations;
    }

    UpdateLocationDropdowns() {
        let collection = this.GetListOfAllLocations();
        this.UpdateDropdown("linkFrom", collection);
        this.UpdateDropdown("linkTo", collection);
    }

    UpdateDropdown(id, collection) {
        $("#"+id).html("");
        $("#"+id).append($("<option>").text("none").val(""));
        for(var i=0; i< collection.length; i++){
            $("#"+id).append($("<option>").text(collection[i].name + " (" + collection[i].id + ")").val(collection[i].id));
        }
    }

    ClearLayerDetailsValues() {
        $("#locationId").val("");
        $("#locationName").val("");
        $("#locationLevel").val("");
        $("#linkLevel").val("");
        $("#linkFrom").val("");
        $("#linkTo").val("");
    }

    DisplayLayerDetails(layer) {
        console.log("about to display a layer's details")
        console.log(layer);
        this.ClearLayerDetailsValues();
        $("#layer-path-details").hide();
        $("#layer-point-details").hide();

        if(layer instanceof L.Path) {
            if(this.layerWithDetailsBeingEdited.extended) {
                $("#locationId").val(this.layerWithDetailsBeingEdited.extended.id);
                $("#locationName").val(this.layerWithDetailsBeingEdited.extended.name);
                $("#locationLevel").val(this.layerWithDetailsBeingEdited.extended.level.join(","));
            } else {
                console.log("this layer has no 'extended' property, so can't display details") 
            } 
            $("#layer-path-details").show();
        } else if(layer instanceof L.Marker) {
            if(this.layerWithDetailsBeingEdited.extended) {
                $("#linkLevel").val(this.layerWithDetailsBeingEdited.extended.level.join(","));

                $("#linkFrom").val(this.layerWithDetailsBeingEdited.extended.linkFrom);
                $("#linkTo").val(this.layerWithDetailsBeingEdited.extended.linkTo);

            } else {
                console.log("this layer has no 'extended' property, so can't display details") 
            } 
            $("#layer-point-details").show();
        }
    }

    SaveLayerDetails() {
        if(this.layerWithDetailsBeingEdited) {
            if(this.layerWithDetailsBeingEdited.extended) {

            } else {
                this.layerWithDetailsBeingEdited.extended = {};
            }
            if(this.layerWithDetailsBeingEdited instanceof L.Path) {
                let layerName = $("#locationName").val();
                let layerId = $("#locationId").val();
                let layerLevel = $("#locationLevel").val();
                this.layerWithDetailsBeingEdited.extended.id = layerId;
                this.layerWithDetailsBeingEdited.extended.name = layerName;
                this.layerWithDetailsBeingEdited.extended.level = layerLevel != "" ? layerLevel.split(",") : "";
            } else if(this.layerWithDetailsBeingEdited instanceof L.Marker) {
                let linkLevel = $("#linkLevel").val();
                this.layerWithDetailsBeingEdited.extended.level = linkLevel != "" ? linkLevel.split(",") : "";
                this.layerWithDetailsBeingEdited.extended.linkFrom =  $("#linkFrom").val();
                this.layerWithDetailsBeingEdited.extended.linkTo =  $("#linkTo").val();
            } else {
                console.log("I dunno what this layer is, I refuse to save it!")
            }
        }
        console.log(this.layerWithDetailsBeingEdited);
    }

    // sets up the possible base layers that can be used by the map
    SetupAvailableBaseLayers() {
        // possible maps https://leaflet-extras.github.io/leaflet-providers/preview/

        // sat images
        var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
        this.availableBaseLayers.push({ label: "Esri Satelite", layer: Esri_WorldImagery })

        // topo map
        var Thunderforest_Outdoors = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}', {
            attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            apikey: '6ceeda90965642818c0223946515f2e5',
            maxZoom: 19
        });
        this.availableBaseLayers.push({ label: "Thunderforest Outdoors", layer: Thunderforest_Outdoors });
        
        // open topo map
        // var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        //     maxZoom: 19,
        //     attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        // });
        // availableBaseLayers.push({ label: "OpenTopoMap", layer: OpenTopoMap });

        var OpenStreetMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 25,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        this.availableBaseLayers.push({ label: "OpenStreetMap", layer: OpenStreetMap });

        this.map.pm.addControls({  
            position: 'topleft',  
            drawCircleMarker: false,
            rotateMode: false,
        });
    }

    // attempts to load the given tile/base layer
    LoadTileLayer(layerNameToLoad) {
        if(this.currentLayer) {
            // if we're already displaying a tile layer then remove it
            this.map.removeLayer(this.currentLayer);
        }
        // locate the wanted layer in our collection of available layers, once found load it
        for (let possibleLayer of this.availableBaseLayers) {
            if(possibleLayer.label === layerNameToLoad) {
                this.map.addLayer(possibleLayer.layer);
                this.currentLayer = possibleLayer.layer;
                break;
            }
        }
    }

    // get the key from the query string
    GetMapKey() {
        return "taranakibasehospital";
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
        return params.key;
    }

    // removes all geoman/annotation layers
    ClearAllDrawingLayers() {
        this.map.eachLayer(function(layer){
            if(layer instanceof L.Path || layer instanceof L.Marker){
                layer.remove();
            }
        });
    }

    // takes a set of configuration and layer data and displays it on the map
    ShowDataOnMap(config, data) {

        // configure the map as per data from db
        let configJson =  JSON.parse(config);
        if(configJson) {
            this.map.setView(new L.LatLng(configJson.center.lat, configJson.center.lng), configJson.zoom);
        }

        var geoLayers = JSON.parse(data);
        if(geoLayers) {
            for (let geoLayer of geoLayers){
                console.log("this is the geolayer layer we're working on ")
                console.log(geoLayer);
                //console.log("we're adding a layer of type " + geoLayer.geometry.type)
                // we have to treat point layers differently - circles and markers are built from points, but are not supported in
                // the geojson format, so we need to reconstruct them using the options we crammed in the geojson layers when no one was looking
                if(geoLayer.geometry.type === "Point") {
                    //console.log("it's a point");
                    let newLayer = L.geoJSON(geoLayer, {
                        onEachFeature: function (feature, layer) {
                            layer.extended = geoLayer.extended;
                        },
                        pointToLayer: function (feature, latlng) {
                            // it's a marker - so it could be a circle or a marker (a marker can also be a text marker! yay!)
                            // if its got a radius then it must be a circle right?!?
                            if(feature.properties && feature.properties.radius) {
                                // console.log("it's a circle");
                                // console.log(feature.properties)
                                return L.circle(latlng, feature.properties);
                            } else {
                                // it's a marker! If it's a text marker then that is determined by the properties
                                // console.log("it's a marker");
                                // console.log(feature.properties)
                                // if we just throw the feature properies at the new marker as its options then it messes up some stuff internally on the marker (icon property)
                                // so just copy the ones we care about to maintain our marker state
                                let featureOptions = {};
                                if(feature.properties && feature.properties.textMarker == true) {
                                    featureOptions.textMarker = true;
                                    featureOptions.text = feature.properties.text;
                                }
                                //console.log(featureOptions);
                                return L.marker(latlng, featureOptions);
                            }
                        }
                    });
                    newLayer.extended = geoLayer.extended;
                    //this.allFeatureLayers.push(newLayer);
                    newLayer.addTo(this.map);
                } else {
                    //console.log("I don't think we need to do anything special for this type of layer");
                    let newLayer = L.geoJSON(geoLayer, {
                        onEachFeature: function (feature, layer) {
                            layer.extended = geoLayer.extended;
                        }
                    });//,geoLayer.extended);
                    //this.allFeatureLayers.push(newLayer);
                    newLayer.addTo(this.map);
                }
            }
        }
        // add event handlers to the layers we just added
        this.map.eachLayer(function(layer){
            if(layer instanceof L.Path || layer instanceof L.Marker){
                
                layer.on("pm:edit", (e) => {
                    self.LayerEdited_handler(e);
                });
                layer.on('click',function(e){
                    self.LayerClicked_handler(e);
                })
                self.allFeatureLayers.push(layer);
            }
        });
        this.UpdateLocationDropdowns();
        this.HideLoadingPanel();
        this.LevelChanged();
    }

    // used to display feedback information to the user
    ShowUserMessage(type, message, displayDuration) {
        // if it's an error message then the user has to close it; -1 duration means manual close
        let duration = type === 'danger' ? -1  : 8000;
        // if a duration is passed in then use that instead
        if(displayDuration) {
            duration = displayDuration;
        }
        Toastify({
            text: message,
            className: "alert-"+type,
            duration: duration,
            close: true
        }).showToast();
    }

    // used to load from the database map configuration and annotations based on the key value in the query params
    LoadDataFromDb() {
        this.ShowLoadingPanel();
        this.ClearAllDrawingLayers();

        let mapKey = this.GetMapKey();
        if(mapKey) {
            // using the key, request data from the db
            let postData = { 'key' : mapKey };
            fetch('/getmapdata?' + new URLSearchParams({
                    key: mapKey
                }), { headers: {
                        'Content-Type': 'application/json'
                } })
            .then((response) => {
                if(response.ok) {
                    return response.json();
                } else {
                    return Promise.reject(response);
                }
            })
            .then((dataResponse) => {
                // we don't need the whole record, just the config and the data fields
                this.ShowDataOnMap(dataResponse.Config,dataResponse.Data);
            })
            .catch(err => {
                // there's got to be a better way!
                console.log("we're in the error handler")
                console.log(err)
                if(err.json) {
                    err.json().then((json) => {
                        this.ShowUserMessage("danger", json.error)
                    })
                } else {
                    this.ShowUserMessage("danger", err)
                }
                this.HideLoadingPanel();
            })
        } else {
            this.ShowUserMessage("info", "No key was supplied in query string params so I couldn't load any data.")
            this.HideLoadingPanel();
        }
    }

    // used to save whatever is on the current map into the database, using the key value in the query params
    SaveDataToDb(){
        // we're going to check if we're editing and if we are we want to turn off editing
        // otherwise we end up saving all the temp edit shapes, and that sucks.
        // these methods seem weirdly named, but they seem to do what we want ...?
        if(this.map.pm.globalEditModeEnabled()) {
            this.map.pm.disableGlobalEditMode();
        }

        let mapKey = this.GetMapKey();
        if(!mapKey) {
            // show user an error
            this.ShowUserMessage("info", "I can't save anything because there's no key in the query string params - stop messing around!")
            return;
        }

        var geoJsonLayers = [];
        
        this.map.eachLayer(function(layer){
            if(layer instanceof L.Path || layer instanceof L.Marker){
                // console.log("we're saving a layer! This is the layer:")
                // console.log(layer)
                let geoJsonLayer = layer.toGeoJSON();
                // cram the layer options into the geoJson layer. The options hold information that isn't supported by the 
                // geojson format that we can use to reconstruct the layer later
                // console.log("These are the layer.options")
                // console.log(layer.options)
                // set the radius - after a circle is edited the radius isn't set right??????
                layer.options.radius = layer._mRadius;
                geoJsonLayer.properties = layer.options;
                //console.log("the _mRadius is " + layer._mRadius)
                // copy our extra stuff into the geojsonlayer, for some reason the stuff I made up is not in the geojson spec which is bs
                geoJsonLayer.extended = layer.extended;
                geoJsonLayers.push(geoJsonLayer);
            }
        });

        let mapConfigJson = {
            center : this.map.getCenter(),
            zoom : this.map.getZoom()
        }

        let postData = JSON.stringify({ 'key' : mapKey, 'data' : geoJsonLayers, 'config' : mapConfigJson});

        fetch('/setmapdata', { method: "POST", body: postData, 
            headers: {
                'Content-Type': 'application/json'
            } })
        .then((response) => {
            if(response.ok) {
                this.ShowUserMessage("success", "Map annotations have been saved!")
                // there is no data to process ... don't need to return anything to next .then
            } else {
                return Promise.reject(response);
            }
        })
        .catch(err => {
            // [unhappy emoji]
            if(err.json) {
                err.json().then((json) => {
                    this.ShowUserMessage("danger", json.error)
                })
            } else {
                this.ShowUserMessage("danger", err)
            }
        })
    }

    // text markers don't normally scale. This function scales them based on the current zoom level
    ResizeTextMarkersBasedOnZoom() {
        var rootCSS = document.querySelector(':root');
        let layers = this.map.pm.getGeomanLayers();

        //var size = 18 * (map.getZoom() / 18);
        var size = this.map.getZoom() - 4;
        // set the font size in relation to the current zoom level
        rootCSS.style.setProperty('--fontSize', size+'px');
        // for each textmarker layer we need the text area to resize
        layers.forEach((layer)=>{
            if(layer.defaultOptions && layer.defaultOptions.textMarker) {
                // we're going to force it to resize the text area by setting the content
                let currentText = layer.pm.getText()
                layer.pm.setText(currentText)
            }
        });
    }
    
    ShowLoadingPanel() {
        document.getElementsByClassName('loader')[0].style.display  = 'block';
    }
    HideLoadingPanel() {
        document.getElementsByClassName('loader')[0].style.display  = 'none';
    }
  }
