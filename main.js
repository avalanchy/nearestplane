//     Index	Property	Type	Description
// 0	icao24	string	Unique ICAO 24-bit address of the transponder in hex string representation.
// 1	callsign	string	Callsign of the vehicle (8 chars). Can be null if no callsign has been received.
// 2	origin_country	string	Country name inferred from the ICAO 24-bit address.
// 3	time_position	float	Unix timestamp (seconds) for the last position update. Can be null if no position report was received by OpenSky within the past 15s.
// 4	time_velocity	float	Unix timestamp (seconds) for the last velocity update. Can be null if no velocity report was received by OpenSky within the past 15s.
// 5	longitude	float	WGS-84 longitude in decimal degrees. Can be null.
// 6	latitude	float	WGS-84 latitude in decimal degrees. Can be null.
// 7	altitude	float	Barometric or geometric altitude in meters. Can be null.
// 8	on_ground	boolean	Boolean value which indicates if the position was retrieved from a surface position report.
// 9	velocity	float	Velocity over ground in m/s. Can be null.
// 10	heading	float	Heading in decimal degrees clockwise from north (i.e. north=0°). Can be null.
// 11	vertical_rate	float	Vertical rate in m/s. A positive value indicates that the airplane is climbing, a negative value indicates that it descends. Can be null.
// 12	sensors	int[]	IDs of the receivers which contributed to this state vector. Is null if no filtering for sensor was used in the request.


var OPENSKY_URL = 'https://opensky-network.org/api/states/all';
var PLANEFINDER_URL = 'https://planefinder.net/flight/';
var FLIGHTRADAR_URL = 'https://www.flightradar24.com/';

var PLANEFINDER_IFRAME = '#planefinder';

var NAME = 1;
var LATITUDE = 6;
var LONGITUDE = 5;
var ALTITUDE = 7;

var MY_LAT_POS = 51.069043;
var MY_LON_POS = 16.979153;

var LAT_DIFF = 0.1;
var LON_DIFF = 0.2;

var MIN_LAT = MY_LAT_POS - LAT_DIFF;
var NAX_LAT = MY_LAT_POS + LAT_DIFF;
var MIN_LON = MY_LON_POS - LON_DIFF;
var MAX_LON = MY_LON_POS + LON_DIFF;


function filterNearest (flights) {
    return flights.filter(function (flight) {
        var lon = flight[LONGITUDE];
        var lat = flight[LATITUDE];
        var alt = flight[ALTITUDE];
        if (!lon || !lat) {
            return false;
        }
        return (
            lat > MIN_LAT &&
            lat < NAX_LAT &&
            lon > MIN_LON &&
            lon < MAX_LON
        );
    });
}

function getNearest (flights) {
    var candidate = null;
    var minDistance = 99999;

    flights.forEach(function (flight) {
        var x = flight[LATITUDE] - MY_LAT_POS;
        var y = flight[LONGITUDE] - MY_LON_POS;
        var distance = Math.sqrt(x*x + y*y);
        if (distance < minDistance) {
            candidate = flight;
            minDistance = distance;
        }
    });
    return candidate;
}


function filterNamed (flights) {
    return flights.filter(function (flight) {
        return flight[NAME];
    });
}

function getFlyingLowest (flights) {
    var candidate = null;
    var lowestAlt = 99999;
    flights.forEach(function (flight) {
        if (flight[ALTITUDE] < lowestAlt) {
            candidate = flight;
        }
    });
    return candidate;
}


function parseFlightName (flight) {
    if (!flight) {
        return '';
    }
    return flight[NAME].trim();
}


function processOpensky (data) {
    var flights = data.states;
    console.log(flights.length + ' flights returned by Opensky');
    return flights;
}


function markOnMap (flightName) {
    console.log('try mark ', flightName);
    var sameAsDisplayed = flightName === window.flightName;
    if (sameAsDisplayed) {
        return;
    }
    window.flightName = flightName;
    var iframe = document.querySelector(PLANEFINDER_IFRAME);
    iframe.src = FLIGHTRADAR_URL + flightName;
}

function obtainFlights () {
    window.fetch(OPENSKY_URL)
        .then(function(response) {
            return response.json()
                .then(processOpensky)
                .then(filterNamed)
                .then(getNearest)
                .then(parseFlightName)
                .then(markOnMap)
        });
}

obtainFlights();
setInterval(obtainFlights, 10000);
