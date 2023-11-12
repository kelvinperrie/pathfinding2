
function UpdateDropdown(id, collection, placeHolderText) {
    $("#"+id).html("");

    if(placeHolderText) {
        //<option value="" data-placeholder>Select an option</option>
        $("#"+id).append($("<option data-placeholder>").text(placeHolderText).val(""));
    }

    // $("#"+id).append($("<option>").text("none").val(""));
    for(var i=0; i< collection.length; i++){
        //$("#"+id).append($("<option>").text(collection[i].name + " (" + collection[i].id + ")").val(collection[i].id));
        $("#"+id).append($("<option>").text(collection[i].name).val(collection[i].id));
    }
}

function GetMapKey() {
    return "taranakibasehospital";
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    return params.key;
}

// used to display feedback information to the user
function ShowUserMessage(type, message, displayDuration) {
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

    // attempts to load the given tile/base layer
    function GetTileLayer(layerNameToLoad, availableBaseLayers) {
        // if(this.currentLayer) {
        //     // if we're already displaying a tile layer then remove it
        //     this.map.removeLayer(this.currentLayer);
        // }
        // locate the wanted layer in our collection of available layers, once found load it
        for (let possibleLayer of availableBaseLayers) {
            if(possibleLayer.label === layerNameToLoad) {
                return possibleLayer.layer;
                // this.map.addLayer(possibleLayer.layer);
                // this.currentLayer = possibleLayer.layer;
                // break;
            }
        }
    }

    // sets up the possible base layers that can be used by the map
    function SetupAvailableBaseLayers() {

        let availableBaseLayers = [];
        // possible maps https://leaflet-extras.github.io/leaflet-providers/preview/

        // sat images
        var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
        availableBaseLayers.push({ label: "Esri Satelite", layer: Esri_WorldImagery })

        // topo map
        var Thunderforest_Outdoors = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}', {
            attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            apikey: '6ceeda90965642818c0223946515f2e5',
            maxZoom: 19
        });
        availableBaseLayers.push({ label: "Thunderforest Outdoors", layer: Thunderforest_Outdoors });
        
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
        availableBaseLayers.push({ label: "OpenStreetMap", layer: OpenStreetMap });

        return availableBaseLayers;
    }