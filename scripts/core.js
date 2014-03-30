/*
 * Usman Bashir
 * http://usmanbashir.com
 *
 * core.js : The core code behind the app.
 *
 * Version: 1.0.0
 */

var map;
var twitterURL = "http://search.twitter.com/search.json?callback=?&rpp=10&result=mixed";
var sinceID = "";
var markup = "";
var isLocationChanged = false;
var tmrUpdateUI;
var isRequestComplete = true;
var markersArray = [];
var locationRegExp = new RegExp("[^-0-9\.]","g");
var infoWindow = new google.maps.InfoWindow();

$(function() {
    // Initialize Matrix v0.1
    initializeMap();
    resizeTweetsList();
    requestData();
    requestCurrentPosition();


    // Setup UI Events
    $(window).resize(function() { resizeTweetsList });

    setupUpdateTimer();


    // UI Stuff
    var lnkPauseResume = $("#pause-and-resume");
    lnkPauseResume.click(function(e) {
	e.preventDefault();

	if (lnkPauseResume.text() == "Pause") {
	    lnkPauseResume.text("Resume");
	    window.clearInterval(tmrUpdateUI);
	} else {
	    lnkPauseResume.text("Pause");
	    setupUpdateTimer();
	}
    });

    var lnkAbout = $("#about-app");
    lnkAbout.click(function(e) {
	e.preventDefault();

	if (lnkAbout.text() == "Back to Tweets") {
	    lnkAbout.text("About");
	    $("#about").hide("fast");
	    $("#content").show("slow");
	} else {
	    lnkAbout.text("Back to Tweets");
	    $("#content").hide("fast");
	    $("#about").show("slow");
	}
    });
});

function setupUpdateTimer() {
    tmrUpdateUI = setInterval(function() {
	 requestData()
    }, 5000);
}

function resizeTweetsList() {
    $("#content").height( $(this).height() - 93 );
}

function initializeMap() {
    $(".google").text("loading map...");

    var latlng = new google.maps.LatLng(21.523, 39.164);
    var myOptions = { zoom: 15, center: latlng, mapTypeId: google.maps.MapTypeId.ROADMAP };

    map = new google.maps.Map(document.getElementById("map"), myOptions);

    google.maps.event.addListener(map, 'center_changed', function() {
	sinceID = "";
	isLocationChanged = true;
    });

    google.maps.event.addListener(map, 'tilesloaded', function() {
	$(".google").text("map ready.");
	setTimeout(function() {
	    $(".google").hide("fast");
	}, 2000);
    });
}

function requestData() {
    if ( isRequestComplete == false ) { return; }

    var twitterStatus = $(".twitter");
    twitterStatus.text("requesting tweets...");

    var elmTweetsList = $("#tweets");
    var queryURL = twitterURL + "&geocode=" + map.getCenter().lat() + "," + map.getCenter().lng() + ",1mi&since_id=" + sinceID;

    var xhr = $.getJSON(queryURL);

    xhr.success(function(data, status) {
	if (isLocationChanged) {
	    if (data.results.toString() !== "") { elmTweetsList.empty(); }
	    
	    isLocationChanged = false;
	}

	if (data.results.toString() !== "") {
	    // we found some tweets. Oh Yeah!!!
	    twitterStatus.text("loading new tweets...");
	} else {
	    // heck, no more new tweets? what is the world coming to?
	   twitterStatus.text("no new tweets.");
	}

	var tweetsArray = new Array();
	for (var tweet in data.results) {
	    markup = '<li><img src="' + data.results[tweet].profile_image_url + '" /><a href="http://twitter.com/' + data.results[tweet].from_user + '">' + data.results[tweet].from_user + '</a><span>' + data.results[tweet].text + '</span><small>' + data.results[tweet].created_at + '</small></li>';

	    tweetsArray.push(markup);

	    var locationArray = new Array();
	    locationArray = data.results[tweet].location.split(",");

	    addMarker(locationArray[0].replace(locationRegExp, ""), locationArray[1], data.results[tweet].from_user + ": " + data.results[tweet].text);
	}

	tweetsArray = tweetsArray.reverse();

	for (var i = 0; i < tweetsArray.length; i++) {
	    elmTweetsList.prepend(tweetsArray[i]);
	}

	sinceID = data.max_id_str;
    });

    xhr.error(function(e) { twitterStatus.text("error with tweets."); });
    xhr.complete(function(e) {
	isRequestComplete = true;
	twitterStatus.text("done.");
    });
}

function requestCurrentPosition() {
    var eLocation = $(".geolocation");

    // lets see if the oracle is home...
    if (navigator.geolocation) {
	eLocation.text("positioning...");
	navigator.geolocation.getCurrentPosition(geoLocationFound, geoLocationError);
    } else {
	// fish!!!
	//
	// there is nothing else to do if she is not home.
	// we don't need an oracle that can't even see us coming to meet her and wait for us.
	// just take off & forget about her.
	alert("oracle not found.\nthanks for wasting your time morpheus.");

	eLocation.text("not found.");
	setTimeout(function() {
	    eLocation.hide("fast");
	}, 2000);
    }
}

function geoLocationFound(position) {
    // we found NEO now do something about it you jackass.

    var eLocation = $(".geolocation");
    eLocation.text("location found.");
    setTimeout(function() { eLocation.hide("fast"); }, 2000);

    setTimeout(function() {
	var currPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.setCenter(currPosition);

	addMarker(position.coords.latitude, position.coords.longitude, "You're current location has been found NEO.");
    }, 500);
}

function geoLocationError(err) {
    // fish!!! now what?
    // alert("i did not see this one coming!");

    switch(err.code) {
	case err.PERMISSION_DENIED:
	    alert("so you took the blue pill didn't you?\nhey if you don't want to be found then it's your choice but quit wasting our time kid.");
	    break;
	case err.POSITION_UNAVAILABLE:
	    alert("ok this is a bit embarrassing but it seems the red pill was just not big enough to trace your current position.");
	    break;
	case err.TIMEOUT:
	    alert("oh fish!, would you look at that.\nthe trace program has timed out.\nwe have to get out before the agents arrive!!!");
	    break;
	default:
	    alert("404 - The error you where looking for was not found because it does not exists anymore if it ever did or it has gone dark.\n      Either way move along as there is nothing else to do here.");
	    break;
    }

    var eLocation = $(".geolocation");

    eLocation.text("location error.");
    setTimeout(function() {
	eLocation.hide("fast");
    }, 2000);
}

function addMarker(iLat, iLng, title) {
    setTimeout(function() {
	// the variable names just seem redundant.
	var marker = new google.maps.Marker({ position: new google.maps.LatLng(iLat, iLng), map: map, title: title });
	markersArray.push(marker);

	google.maps.event.addListener(marker, 'click', function() {
	    infoWindow.setContent(marker.getTitle());
	    infoWindow.open(map, marker);
	});
    }, 500);
}
