
var baseUrl = 'https://rest.ehrscape.com/rest/v1';

var username = "ois.seminar";
var password = "ois4fri";

var sessionID;

var ehrIdList = [];

var googleMap;
var activeMarkers = [];



function getSessionId () {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


//region DISPLAY FUNCTIONS
function displayData(ehrId) {
    // Display the data
    var callback = function (retrievedData) {
        if (retrievedData) {
            $("#name").html(retrievedData.firstNames + " " + retrievedData.lastNames);
            $("#dateOfBirth").html(retrievedData.dateOfBirth.split("T")[0]);
            var age = retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "age";})[0].value;
            $("#age").html(age);
            var sex = retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "sex";})[0].value;
            $("#sex").html(sex);
            var nationality = retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "nationality";})[0].value;
            $("#nationality").html(nationality);
            var height = retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "height";})[0].value;
            $("#height").html(height + "cm");

            var weightMeasurements = destringifyGraphData(retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "weightMeasurements";})[0].value);
            plotWeight(weightMeasurements);

            var temparatureMeasurements = destringifyGraphData(retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "temparatureMeasurements";})[0].value);
            plotBodyTemparature(temparatureMeasurements);

            var saturationMeasurements = destringifyGraphData(retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "saturationMeasurements";})[0].value);
            plotOxygenSaturation(saturationMeasurements);

            var lowBpMeasurements = destringifyGraphData(retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "bpLowMeasurements";})[0].value);
            var highBpMeasurements = destringifyGraphData(retrievedData.partyAdditionalInfo.filter(function(obj) {return obj.key === "bpHighMeasurements";})[0].value);
            plotBloodPressure(lowBpMeasurements, highBpMeasurements);

            var injuries = destringifyInjuries(retrievedData.partyAdditionalInfo.filter(function (obj) { return obj.key === "injuries";})[0].value);
            displayInjuries(injuries);
        }
    };

    fetchEhrSubjectData(ehrId, callback);
}

function displayInjuries(injuries) {
    var injuriesList = document.getElementById("injuriesList");
    injuriesList.innerHTML = "";

    for (var i = 0; i < activeMarkers.length; i++) {
        activeMarkers[i].setMap(null);
    }

    activeMarkers = [];

    for (var i = 0; i < injuries.length; i++) {
        var entry =
            "<div class='panel panel-default'>\
                <div class='panel-heading'> \
                    <h4 class='panel-title'>\
                        <a data-toggle='collapse' href='#collapse" + i +"'>" + injuries[i].type + "</a>\
                    </h4>\
                </div>\
                <div id='collapse" + i + "' class='panel-collapse collapse'>\
                    <div class='panel-body'>\
                        <div class='row'>\
                            <div class='col-md-3'>\
                                <b>Lokacija:</b> " + injuries[i].location + "\
                            </div>\
                            <div class='col-md-2'>\
                                <b>Datum:</b> " + injuries[i].timestamp + "\
                            </div>\
                            <div class='col-md-3'>\
                                <b>Terapija:</b> " + injuries[i].therapy + "\
                            </div>\
                            <div class='col-md-4'>\
                                <b>Čas okrevanja:</b> " + injuries[i].recoveryTime + " dni  " + ((injuries[i].recovered) ? "(Že okreval)" : "") + "\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>"

        injuriesList.innerHTML += entry;

        // Create google map markers
        var marker = new google.maps.Marker({
            position: {lat: injuries[i].lat, lng:injuries[i].lng},
            map: googleMap
        });

        activeMarkers.push(marker);

        var infowindow = new google.maps.InfoWindow({
            content: injuries[i].type
        });

        infowindow.open(googleMap, marker);

    }
}
//endregion

//region DATA GENERATION
function generateData (pacientNum) {

    var data;
    if (pacientNum === 0) {
        data = {
            firstName: "Johnny",
            lastName: "Bravo",
            dateOfBirth: "1996-10-30T10:00",
            sex: "Moški",
            age: "19",
            nationality: "Slovenska",
            height: "176",

            weightMeasurements: [
                {timestamp: "2016-06-11", value: 70.3},
                {timestamp: "2016-07-11", value: 72.5},
                {timestamp: "2016-09-11", value: 73.1},
                {timestamp: "2016-11-12", value: 71.1},
                {timestamp: "2016-12-12", value: 69.7},
                {timestamp: "2017-1-12", value: 70.2},
                {timestamp: "2017-2-12", value: 70.0}
            ],

            temparatureMeasurements: [
                {timestamp: "2016-06-11", value: 36.4},
                {timestamp: "2016-07-11", value: 36.5},
                {timestamp: "2016-09-11", value: 36.3},
                {timestamp: "2016-11-12", value: 36.4},
                {timestamp: "2016-12-12", value: 36.7},
                {timestamp: "2017-1-12", value: 36.6},
                {timestamp: "2017-2-12", value: 36.2}
            ],

            saturationMeasurements: [
                {timestamp: "2016-06-11", value: 97.4},
                {timestamp: "2016-07-11", value: 98.5},
                {timestamp: "2016-09-11", value: 97.1},
                {timestamp: "2016-11-12", value: 99.2},
                {timestamp: "2016-12-12", value: 99.0},
                {timestamp: "2017-1-12", value: 98.6},
                {timestamp: "2017-2-12", value: 99.2}
            ],

            //lowY: [70, 60, 65, 70, 66, 78, 80], highY: [100, 80, 90, 80, 75, 100, 110]
            bpLowMeasurements: [
                {timestamp: "2016-06-11", value: 70},
                {timestamp: "2016-07-11", value: 71},
                {timestamp: "2016-09-11", value: 68},
                {timestamp: "2016-11-12", value: 70},
                {timestamp: "2016-12-12", value: 66},
                {timestamp: "2017-1-12", value: 72},
                {timestamp: "2017-2-12", value: 74}
            ],

            bpHighMeasurements: [
                {timestamp: "2016-06-11", value: 100},
                {timestamp: "2016-07-11", value: 103},
                {timestamp: "2016-09-11", value: 99},
                {timestamp: "2016-11-12", value: 101},
                {timestamp: "2016-12-12", value: 96},
                {timestamp: "2017-1-12", value: 100},
                {timestamp: "2017-2-12", value: 105}
            ],

            injuries: [
                {type: "Zvin gležnja", timestamp: "5. 4. 2013", therapy: "Obkladki, počitek", recoveryTime: "14", recovered: true, location: "Barcelona", lat: 41.380670, lng: 2.123011},
                {type: "Pretres možganov", timestamp: "18. 9. 2015", therapy: "Počitek", recoveryTime: "7", recovered: true, location: "London", lat: 51.555369, lng: -0.108158},
                {type: "Poškodba kolenskih vezi", timestamp: "3. 3. 2016", therapy: "Operacija", recoveryTime: "120", recovered: false, location: "Munchen", lat: 48.218764, lng: 11.624397}
            ]
        };
    }
    else if (pacientNum === 1) {
        data = {
            firstName: "Bronhilda",
            lastName: "Valkarievska",
            dateOfBirth: "1996-07-23T16:30",
            sex: "Zenska",
            age: "20",
            nationality: "Slovenska",
            height: "185",

            weightMeasurements: [
                {timestamp: "2016-06-11", value: 76.2},
                {timestamp: "2016-07-11", value: 74.4},
                {timestamp: "2016-09-11", value: 73.5},
                {timestamp: "2016-11-12", value: 75.9},
                {timestamp: "2016-12-12", value: 75.1},
                {timestamp: "2017-1-12", value: 74.4},
                {timestamp: "2017-2-12", value: 76.8}
            ],

            temparatureMeasurements: [
                {timestamp: "2016-06-11", value: 36.2},
                {timestamp: "2016-07-11", value: 36.5},
                {timestamp: "2016-09-11", value: 36.7},
                {timestamp: "2016-11-12", value: 36.5},
                {timestamp: "2016-12-12", value: 36.3},
                {timestamp: "2017-1-12", value: 36.6},
                {timestamp: "2017-2-12", value: 36.4}
            ],

            saturationMeasurements: [
                {timestamp: "2016-06-11", value: 98.4},
                {timestamp: "2016-07-11", value: 98.5},
                {timestamp: "2016-09-11", value: 99.1},
                {timestamp: "2016-11-12", value: 99.2},
                {timestamp: "2016-12-12", value: 99.3},
                {timestamp: "2017-1-12", value: 98.6},
                {timestamp: "2017-2-12", value: 99.0}
            ],

            //lowY: [70, 60, 65, 70, 66, 78, 80], highY: [100, 80, 90, 80, 75, 100, 110]
            bpLowMeasurements: [
                {timestamp: "2016-06-11", value: 73},
                {timestamp: "2016-07-11", value: 68},
                {timestamp: "2016-09-11", value: 69},
                {timestamp: "2016-11-12", value: 71},
                {timestamp: "2016-12-12", value: 70},
                {timestamp: "2017-1-12", value: 72},
                {timestamp: "2017-2-12", value: 74}
            ],

            bpHighMeasurements: [
                {timestamp: "2016-06-11", value: 99},
                {timestamp: "2016-07-11", value: 103},
                {timestamp: "2016-09-11", value: 101},
                {timestamp: "2016-11-12", value: 102},
                {timestamp: "2016-12-12", value: 103},
                {timestamp: "2017-1-12", value: 101},
                {timestamp: "2017-2-12", value: 105}
            ],

            injuries: [
                {type: "Zlom desnega zapestja", timestamp: "13. 5. 2014", therapy: "Mavec", recoveryTime: "60", recovered: true, location: "London", lat: 51.555369, lng: -0.108158},
                {type: "Zlom prsta", timestamp: "23. 1. 2016", therapy: "Opornica", recoveryTime: "30", recovered: true, location: "Dhaka", lat: 23.806469, lng: 90.363668}
            ]
        }
    }
    else if (pacientNum === 2) {
        data = {
            firstName: "Bob",
            lastName: "Smith",
            dateOfBirth: "1996-06-21T05:00",
            sex: "Moški",
            age: "19",
            nationality: "Slovenska",
            height: "182",

            weightMeasurements: [
                {timestamp: "2016-06-11", value: 75.2},
                {timestamp: "2016-07-11", value: 73.4},
                {timestamp: "2016-09-11", value: 74.5},
                {timestamp: "2016-11-12", value: 75.9},
                {timestamp: "2016-12-12", value: 74.1},
                {timestamp: "2017-1-12", value: 74.4},
                {timestamp: "2017-2-12", value: 76.8}
            ],

            temparatureMeasurements: [
                {timestamp: "2016-06-11", value: 36.3},
                {timestamp: "2016-07-11", value: 36.2},
                {timestamp: "2016-09-11", value: 36.3},
                {timestamp: "2016-11-12", value: 36.4},
                {timestamp: "2016-12-12", value: 36.5},
                {timestamp: "2017-1-12", value: 36.8},
                {timestamp: "2017-2-12", value: 36.6}
            ],

            saturationMeasurements: [
                {timestamp: "2016-06-11", value: 98.4},
                {timestamp: "2016-07-11", value: 97.5},
                {timestamp: "2016-09-11", value: 99.1},
                {timestamp: "2016-11-12", value: 98.2},
                {timestamp: "2016-12-12", value: 98.0},
                {timestamp: "2017-1-12", value: 99.3},
                {timestamp: "2017-2-12", value: 98.2}
            ],

            //lowY: [70, 60, 65, 70, 66, 78, 80], highY: [100, 80, 90, 80, 75, 100, 110]
            bpLowMeasurements: [
                {timestamp: "2016-06-11", value: 63},
                {timestamp: "2016-07-11", value: 61},
                {timestamp: "2016-09-11", value: 64},
                {timestamp: "2016-11-12", value: 65},
                {timestamp: "2016-12-12", value: 62},
                {timestamp: "2017-1-12", value: 64},
                {timestamp: "2017-2-12", value: 65}
            ],

            bpHighMeasurements: [
                {timestamp: "2016-06-11", value: 95},
                {timestamp: "2016-07-11", value: 93},
                {timestamp: "2016-09-11", value: 94},
                {timestamp: "2016-11-12", value: 95},
                {timestamp: "2016-12-12", value: 96},
                {timestamp: "2017-1-12", value: 92},
                {timestamp: "2017-2-12", value: 93}
            ],

            injuries: [
                {type: "Zvin gležnja", timestamp: "19. 5. 2014", therapy: "Obkladki, počitek", recoveryTime: "14", recovered: true, location: "Dhaka", lat: 23.806469, lng: 90.363668},
                {type: "Poškodba komolčnih vezi", timestamp: "19. 4. 2016", therapy: "Operacija", recoveryTime: "90", recovered: false, location: "Barcelona", lat: 41.380670, lng: 2.123011}
            ]
        }
    }

    if (data) {
        var callback = function(ehrId, firstName, lastName) {
            if (ehrId && firstName && lastName) {
                document.getElementById("playersDropdown").innerHTML += '<li><a href="#" id="' + ehrId + '" onclick="selectPlayer(this)">' + firstName + ' ' + lastName + '</a></li>';

                ehrIdList.push(ehrId);
                // If this is the first entry... display its data
                if (ehrIdList.length === 1) {
                    //displayData(ehrIdList[0]);
                }
            }
        };

        addEhrSubject(data, callback);
    }
}
//endregion

//region EHR ACCESS
function addEhrSubject(subjectData, callback) {
    // Check if the session ID was already retrieved.. If not retrieve it.
    if (!sessionID) {
        sessionID = getSessionId();
    }

    $.ajaxSetup({
        headers: {"Ehr-Session": sessionID}
    });
    $.ajax({
        url: baseUrl + "/ehr",
        type: 'POST',
        success: function (data) {
            var ehrId = data.ehrId;
            // Hacks.. Hacks everywhere !!!  (╯°□°）╯︵ ┻━┻
            var partyData = {
                firstNames: subjectData.firstName,
                lastNames: subjectData.lastName,
                dateOfBirth: subjectData.dateOfBirth,

                partyAdditionalInfo: [
                    {key: "ehrId", value: ehrId},
                    {key: "age", value: subjectData.age},
                    {key: "sex", value: subjectData.sex},
                    {key: "nationality", value: subjectData.nationality},
                    {key: "height", value: subjectData.height},
                    {key: "weightMeasurements", value: stringifyGraphData(subjectData.weightMeasurements)},
                    {key: "temparatureMeasurements", value: stringifyGraphData(subjectData.temparatureMeasurements)},
                    {key: "saturationMeasurements", value: stringifyGraphData(subjectData.saturationMeasurements)},
                    {key: "bpLowMeasurements", value: stringifyGraphData(subjectData.bpLowMeasurements)},
                    {key: "bpHighMeasurements", value: stringifyGraphData(subjectData.bpHighMeasurements)},
                    {key: "injuries", value: stringifyInjiries(subjectData.injuries)}
                ]
            };

            $.ajax({
                url: baseUrl + "/demographics/party",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(partyData),

                success: function (party) {
                    if (party.action == 'CREATE') {
                        callback(ehrId, subjectData.firstName, subjectData.lastName);
                        console.log("Successfully created a new entry.")
                    }
                },
                error: function(err) {
                    callback();
                    console.error("Something went wrong while creating a new entry.");
                }
            });
        }
    });
}

function fetchEhrSubjectData(ehrId, callback) {
    sessionID = getSessionId();

    $.ajax({
        url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
        type: 'GET',
        headers: {"Ehr-Session": sessionID},
        success: function (data) {
            callback(data.party)
        },
        error: function(err) {
            callback();
        }
    });
}
//endregion

//region STRINGIFY HELPER FUNCTIONS
function stringifyInjiries(input) {
    var stringified = "";

    for (var i = 0; i < input.length; i++) {
        stringified += input[i].type + "/" + input[i].timestamp + "/" + input[i].therapy + "/" + input[i].recoveryTime + "/" + input[i].recovered + "/" + input[i].location + "/" + input[i].lat + "/" + input[i].lng + "/";
    }

    return stringified;
}

// Stringify JS objects to fool the ehrscape
function stringifyGraphData(input) {
    var stringified = "";
    for (var i = 0; i < input.length; i++) {
        stringified += input[i].timestamp + "/" + input[i].value + "/";
    }

    return stringified;
}

function destringifyInjuries(input) {
    var splitted = input.split("/");
    var injuries = [];

    for (var i = 0; i < splitted.length - 8; i+= 8) {
        injuries.push({type: splitted[i], timestamp: splitted[i+1], therapy: splitted[i+2], recoveryTime: parseFloat(splitted[i+3]), recovered: "true" === splitted[i+4], location: splitted[i+5], lat: parseFloat(splitted[i+6]), lng: parseFloat(splitted[i+7])});
    }

    return injuries;
}

// Convert stringified JS graph objects back to JS objects
function destringifyGraphData(input) {
    var splitted = input.split("/");

    var graphData = [];
    for (var i = 0; i < splitted.length-2; i+=2) {
        graphData.push({timestamp: splitted[i], value: parseFloat(splitted[i+1])});
    }

    return graphData;
}
//endregion

//region CLICK LISTENERS
function generatorOnClick() {
    generateData(0);
    generateData(1);
    generateData(2);
}

function selectPlayer(obj) {
    document.getElementById("ehrIdHolder").value = obj.id;
    displayData(obj.id);
}

function selectEhr() {
    var ehrId = document.getElementById("ehrIdHolder").value;
    displayData(ehrId);
}
//endregion

//region PLOTTING
function plotBloodPressure (inputLow, inputHigh) {
    var w = document.getElementById('bloodPressurePlot').offsetWidth;

    var xVal = [];
    var yLowVal = [];
    var yHighVal = [];

    for (var i = 0; i < inputHigh.length; i++) {
        xVal.push(inputLow[i].timestamp);
        yLowVal.push(inputLow[i].value);
        yHighVal.push(inputHigh[i].value);
    }

    var lines = [
        {x: xVal, y: yLowVal, fill: 'tozeroy', line: {color: 'rgb(200, 0, 0)'}, name: "Diastolični"},
        {x: xVal, y: yHighVal, fill: 'tonexty', line: {color: 'rgb(255, 0, 0))'}, name: "Sistolični"}
    ];

    for(var i=1; i<lines.length; i++) {
        for(var j=0; j<(Math.min(lines[i]['y'].length, lines[i-1]['y'].length)); j++) {
            lines[i]['y'][j] += lines[i-1]['y'][j];
        }
    }


    var layout = {
        title: "Krvni tlak",
        width: w,
        height: w,
        margin: {
            l: 50,
            r: 40,
            b: 50,
            t: 40
        },

        xaxis: {
            title: 'Datum',
            showgrid: false
        },
        yaxis: {
            title: 'BP (mm/kg)'
        },
        showlegend: false
    };
    Plotly.newPlot('bloodPressurePlot', lines, layout);
}

function plotWeight (input) {
    var w = document.getElementById('weightPlot').offsetWidth;

    var xVal = [];
    var yVal = [];

    for (var i = 0; i < input.length; i++) {
        xVal.push(input[i].timestamp);
        yVal.push(input[i].value);
    }

    var data = [
        {
            x: xVal,
            y: yVal,
            type: 'scatter'
        }
    ];

    var layout = {
        title: "Teža",
        width: w,
        height: w,
        margin: {
            l: 50,
            r: 40,
            b: 50,
            t: 40
        },
        xaxis: {
            title: 'Datum',
            showgrid: false,
        },
        yaxis: {
            title: 'Teža (kg)',
        }
    };
    Plotly.newPlot('weightPlot', data, layout);
}

function plotBodyTemparature (input) {
    var w = document.getElementById('bodyTemparaturePlot').offsetWidth;

    var xVal = [];
    var yVal = [];

    for (var i = 0; i < input.length; i++) {
        xVal.push(input[i].timestamp);
        yVal.push(input[i].value);
    }

    var data = [
        {
            x: xVal,
            y: yVal,
            type: 'scatter'
        }
    ];

    var layout = {
        title: "Telesna temparatura",
        width: w,
        height: w,
        margin: {
            l: 50,
            r: 40,
            b: 50,
            t: 40
        },
        xaxis: {
            title: 'Datum',
            showgrid: false,
        },
        yaxis: {
            title: 'Telesna temparatura (°C)',
        }
    };
    Plotly.newPlot('bodyTemparaturePlot', data, layout);
}

function plotOxygenSaturation (input) {
    var w = document.getElementById('oxygenSaturationPlot').offsetWidth;

    var xVal = [];
    var yVal = [];

    for (var i = 0; i < input.length; i++) {
        xVal.push(input[i].timestamp);
        yVal.push(input[i].value);
    }

    var data = [
        {
            x: xVal,
            y: yVal,
            type: 'scatter'
        }
    ];

    var layout = {
        title: "Nasičenost krvi s kisikom",
        width: w,
        height: w,
        margin: {
            l: 50,
            r: 40,
            b: 50,
            t: 40
        },
        xaxis: {
            title: 'Datum',
            showgrid: false,
        },
        yaxis: {
            title: 'Nasičenost (%)',
        }
    };
    Plotly.newPlot('oxygenSaturationPlot', data, layout);
}

$(document).ready(function() {
    plotWeight([]);
    plotBloodPressure([], []);
    plotBodyTemparature([]);
    plotOxygenSaturation([]);
});
//endregion

// Google map initialization
function initMap() {
    googleMap = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: {lat: 49.0, lng: 16.0}
    });
}