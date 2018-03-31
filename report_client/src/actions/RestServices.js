var rootComponent;

export function initializeState( root){
    console.log("Initializing rest services")
    rootComponent = root;
}

export function receiveHealthCheck(json) {
    rootComponent.udpdateHealthCheck( {healthCheck:json});
    console.log("receiveSeamaUser - ", json.toString())
}

export function fetchHealthCheck() {
    return fetch('/untapped/health-check')
        .then(response => response.json())
        .then(json => receiveHealthCheck(json))
        .catch(function(error){
            // This means the service isn't running.
            console.log("fetchHealthCheck failed", error);
            rootComponent.setState( {healthCheck:{server:"failed", database:"n/a" }});
        });
}

export function receiveSeamaKiosks(json) {
    var kiosk = json.kiosks;
    rootComponent.setState( {seamaKiosk:kiosk});
    console.log("receiveSeamaUser - ", kiosk)
}

export function fetchSeamaKiosks() {
    return fetch('/untapped/kiosks')
        .then(response => response.json())
        .then(json => receiveSeamaKiosks(json))
        .catch(function(error){
            console.log("fetchSeamaKiosks failed", error);
        });
}

export function receiveWaterQuality(json) {
    rootComponent.updateWaterQualityState(json);
    console.log("receiveSeamaWaterQuality - ", json)
}

export function fetchWaterQuality( params) {
    var urlParms = queryParams(params);
    var url = '/untapped/water-quality?' + urlParms;
    return fetch(url)
        .then(response => response.json())
        .then(json => receiveWaterQuality(json))
        .catch(function(error){
            console.log("fetchWaterQuality failed", error);
        });
}

function queryParams(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}