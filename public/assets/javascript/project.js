// GLOBAL VARIABLES
// chris - variable used for timer function
var time = 179; // chris - time has to be 1 second less than the time you want to display
var minutes = Math.trunc(time / 60);
var seconds = time % 60;
var timeString = minutes + ":" + seconds;
var intervalId;

// chris - variable that will be part of limiting results selection to three
var resultsSelect = 0;

// chris - array used to store checked restaurants
var selectionArray = [];
// chris - array used to store map markers
var markers = [];
var map;

// chris - boolean that is used to disable checkbox clicks while poll is running
var isPollRunning = false;

// FIREBASE
// chris - code for loading Firebase
var firebaseConfig =
{
  apiKey: "AIzaSyCZmpMUDLA55Li2JKm8K42Jv_gCAG_v5Lg",
  authDomain: "bootcamp-project-09242019.firebaseapp.com",
  databaseURL: "https://bootcamp-project-09242019.firebaseio.com",
  projectId: "bootcamp-project-09242019",
  storageBucket: "bootcamp-project-09242019.appspot.com",
  messagingSenderId: "344953998725",
  appId: "1:344953998725:web:119bcabddb32ce5dbd48ec"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();

$(document).ready(function () {
    //variables for Yelp API calls
    var term = '';
    var location = '';
    var name = '';
    //var city = '';
    //var longitude;
    //var latitude;
    //initMap();   
    geoInitialize()

    // chris - used to display 3:00 for timer div
    // if you change the time in the global variable for the timer, you need to change it here to
    $("#timer").html("3:00");

    //search onclick that grabs values and stores from term and location
    $("#search").on("click", function (event) {

        if(isPollRunning === true)
        {
            console.log("button disabled");
            return;
        }

        location = $("#locationInput").val().trim();
        term = $("#termInput").val().trim();
        yelpAPI();
        geoFirstClick()
        //console.log(location);
        //console.log(term);
    });
  
    //Ajax Call for Yelp API
    function yelpAPI() {
        var queryUrl = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?term=" + term + "&location=" + location;

        $.ajax({
            url: queryUrl,
            headers: {
                'Authorization': 'Bearer u5IOLfLv5NDHJQEgaAnpyOMD904ThILvNdDS5ldBH2VX7a3fuCvRX6MEASunCHQEofphTnitG_YdiO9-pN9xcEDs11XZcbbqRYaIotN0SmE0ySvkvThDNCt7TxmWXXYx',
            },
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $.each(data.businesses, function (i, response) {
                    //console.log(response);
                    name = response.name;
                    location = response.location;
                    // city = response.location.city;
                    // longitude = response.coordinates.longitude;
                    // latitude = response.coordinates.latitude;
                    var resultsDiv = $("<div>");
console.log(response)
                    // chris - checkbox code
                    var label = $("<label>");
                    var checkbox = $("<input>");
                    var span = $("<span>");

                    checkbox.attr("type", "checkbox", "class", "ml-1 form-checkbox", "checked", "false");
                    span.attr("class", "ml-2");

                    label.append(checkbox);
                    label.append(span);

                    // chris - self variable had to be created to reference a proper scope
                    // for the variables needed
                    var self = this;

                    // chris - code that tracks the amount of results selected
                    // chris - checkbox.on click is a call back function
                    checkbox.on("click", function (event)
                    {
                        //chris - this function disables the checkbox onclick even from processing
                        //data and from removing or adding the visual check mark
                        if(isPollRunning === true)
                        {
                            console.log("button disabled");
                            var status = checkbox.prop("checked");
                            checkbox.prop("checked", !status);
                            return;
                        }

                        // console.log("Restaurant selected");
                        if ($(this).prop("checked") === true)
                        {
                            if (resultsSelect >= 3)
                            {
                                checkbox.prop("checked", false);
                                // chris - enables Begin Poll button once 3 restaurant options are selected
                                $("#beginPollBtn").removeClass("opacity-50 cursor-not-allowed");

                                console.log("Max selections already reached.");
                            }
                            else
                            {
                                resultsSelect++;

                                // chris - checks to see if 3 selections have been made. if three selections have 
                                // been made, then the poll button is enabled.
                                if(resultsSelect === 3)
                                {
                                    $("#beginPollBtn").removeClass("opacity-50 cursor-not-allowed");
                                }
                                else
                                {
                                    $("#beginPollBtn").addClass("opacity-50 cursor-not-allowed");

                                }

                                // chris - object that stores items that will be pushed into array
                                // and added to firebase
                                var selectionObject =
                                {
                                    name:   self.name,
                                    lng:    self.coordinates.longitude,
                                    lat:    self.coordinates.latitude,
                                    addr:   self.location.display_address,
                                    rating: self.rating,
                                    reviewCount: self.review_count,
                                    price: self.price,
                                    phone: self.phone,
                                    city: self.location.city,
                                    url:    self.url,                                   
                                };

                                // chris - command that pushes object into selectionArray
                                selectionArray.push(selectionObject);
                                //console.log("SelectionArray: " + JSON.stringify(selectionArray));
                                //console.log(selectionObject);
                                addMarker(selectionObject);

                                //console.log("Selection added.");
                            }
                        }
                        else
                        {
                            resultsSelect--;
                            // chris - disables Begin Poll button until 3 restaurant options are selected
                            $("#beginPollBtn").addClass("opacity-50 cursor-not-allowed");

                            // chris - iterates through the array and finds the name of the restaurant 
                            // to be removed.
                            for(let i = 0; i < selectionArray.length; i++)
                            {
                                // chris -
                                // if statement below checks the name, latitude and longitude that is being deleted. 
                                // rounding errors also need to betaken into account so the numbers are cut off
                                // at 5 decimal places. this whole piece is important because if multiple 
                                // restaurants with the same name, but different location are selected (i.e. McDonald's 
                                // and other chains), then all of them would be deleted. including lat and long
                                // helps account for that.
                                if
                                (
                                    selectionArray[i].name === self.name &&
                                    selectionArray[i].lng  === self.coordinates.longitude &&
                                    selectionArray[i].lat  === self.coordinates.latitude
                                )
                                {
                                    removeMarker(selectionArray[i]);
                                    selectionArray.splice(i, 1);
                                }
                            }
                            
                            //console.log("SelectionArray: " + JSON.stringify(selectionArray));
                            //console.log("Selection removed.");

                        }
                        //console.log("Selections checked: " + resultsSelect);
                    });
                    
                    //var nameResult = $("<a>")
                    resultsDiv.attr('class', 'selectedRes border-solid border-2 mt-1 border-black');
                    //nameResult.append(name);
                    // chris - changed to span.append from nameResult.append
                    span.append(name);
                    resultsDiv.attr('data-longitude', response.coordinates.longitude);
                    resultsDiv.attr('data-latitude', response.coordinates.latitude);
                    resultsDiv.attr('data-name', response.name);
                    resultsDiv.attr('data-price', response.price);
                    // chris - changed append to label from nameResult
                    resultsDiv.append(label);
                    $("#results").append(resultsDiv);

                });
            }
        });
    }

    // chris - function to add a marker to google map
    function addMarker(selectionObject)
    {
        // chris - create a marker and adds it to google maps
        var thisMarker = new google.maps.Marker
        ({
            position: {lat: selectionObject.lat, lng: selectionObject.lng},
            map: map,
            title: selectionObject.name,
            price: selectionObject.price,
            rating: selectionObject.rating,
            reviewCount: selectionObject.reviewCount,
            city: selectionObject.city

            
        });
        //adds info window to click.
    var contentString = '<div id="content">'+
    '<div id="siteNotice">'+
        '</div>'+
        '<h1 id="firstHeading" class="firstHeading">'+selectionObject.name+'</h1>'+
        '<div id="bodyContent">'+
        '<ul><li>Rating: '+selectionObject.rating+'</li><li>Total Reviews: '+selectionObject.reviewCount+'</li><li>Price Level: '+selectionObject.price+'</li><li>City: '+selectionObject.city+ '</li>';
  
    var infowindow = new google.maps.InfoWindow({
      content: contentString
    });
  
    thisMarker.addListener('click', function() {
      infowindow.open(map, thisMarker);
    });

        // chris - adds a new marker to the markers array
        markers.push(thisMarker);
        //console.log(thisMarker);
    }

    // chris - function to remove a marker from the map
    function removeMarker(selectionObject)
    {
        for(let i = 0; i < markers.length; i++)
        {
            // chris -
            // if statement below checks the name, latitude and longitude that is being deleted. 
            // rounding errors also need to betaken into account so the numbers are cut off
            // at 5 decimal places. this whole piece is important because if multiple 
            // restaurants with the same name, but different location are selected (i.e. McDonald's 
            // and other chains), then all of them would be deleted. including lat and long
            // helps account for that.
            if
            (
                markers[i].title === selectionObject.name &&
                markers[i].position.lat().toFixed(5) === selectionObject.lat.toFixed(5) &&
                markers[i].position.lng().toFixed(5) === selectionObject.lng.toFixed(5)
            )
            {
                // chris - removes the marker from the map and the marker array.
                markers[i].setMap(null);
                markers.splice(i, 1);
            }
        }
    }

    /*
    chris - i was trying to build a remove marker function based on this information but, since we
    weren't using arrays yet, it wasn't working right. the functions to add markers had to be rebuilt
    with arrays in mind. once the arrays were set up, that same information could be used to remove
    markers as well.

    //click function that currently console.logs the latitude and longitude of the selected location
    var mapLongitude = '';
    var mapLatitude = '';

    function checkBoxMap ()
    {
        mapLongitude = $(this).attr('data-longitude')
        mapLatitude = $(this).attr('data-latitude')
        name = $(this).attr('data-name')
        console.log(mapLatitude);
        console.log(mapLongitude);
    }
    */

  /*
   function clickSelection(){
    $('.selectedRes').on("click", function () {
        mapLongitude = $(this).attr('data-longitude')
        mapLatitude = $(this).attr('data-latitude')
        name = $(this).attr('data-name')
        geoMarker();
        console.log(mapLatitude);
        console.log(mapLongitude);
    });
   }
   */

  
    //google map API js

      function geoInitialize() {
        // Create a map centered in SLC.
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 40.7608, lng: -111.8910 },
            zoom: 15
        });
    }

    function geoFirstClick(city) {

        var geoApiKey = 'AIzaSyCK4EWTo5MHbt_OTstSiYYGKw5twoR8xuk'
        var geoQueryUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=' + geoApiKey;

        //console.log(geoQueryUrl)

        $.ajax({
            url: geoQueryUrl,
            method: "GET"
        }).then(function (response) {

            var geoResponse = response.results[0].geometry.location

            geoFirstClickUpdate(geoResponse)
        });
    }

    function geoFirstClickUpdate(geoResponse) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: geoResponse,
            zoom: 15
        });
    }

    /*
    chris - i was trying to build a remove marker function based on this information but, since we
    weren't using arrays yet, it wasn't working right. the functions to add markers had to be rebuilt
    with arrays in mind. once the arrays were set up, that same information could be used to remove
    markers as well.

    function geoMarker() {
        // CURRENTLY: will add pin for roosters brewery in OGDEN. CITY SEARCH: OGDEN to test.
        var request = {
            location: map.getCenter(),
            radius: '1000',
            query: name
        };

        console.log(request)
        var service = new google.maps.places.PlacesService(map);
        service.textSearch(request, callback);

        // Checks that the PlacesServiceStatus is OK, and adds a marker
        // using the place ID and location from the PlacesService.
        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var marker = new google.maps.Marker({
                    map: map,
                    place: {
                        placeId: results[0].place_id,
                        location: results[0].geometry.location
                    }
                });
            }
        }
    }
    */

    // chris - functions that starts time when start timer button is clicked. 
    // this will be tweaked when the polling section works.

    /*
    $("#startTimer").on("click", function (event)
    {
        // chris - boolean is set to true so that search and checkbox are disabled
        isPollRunning = true;
        
        $("#search").addClass("opacity-50 cursor-not-allowed");
        $("#beginPollBtn").addClass("opacity-50 cursor-not-allowed");
        clearInterval(intervalId);
        intervalId = setInterval(countDown, 1000);
    });
    */

    $("#beginPollBtn").on("click", function (event)
    {   
        if(isPollRunning === true)
        {
            console.log("button disabled");
            return;
        }

        isPollRunning = true;

        clearInterval(intervalId);
        intervalId = setInterval(countDown, 1000);
        $("#search").addClass("opacity-50 cursor-not-allowed");
        //$("#startTimer").addClass("opacity-50 cursor-not-allowed");
        // chris - uploads yelp data to firebase in sub-folder called "projectUno"
        database.ref("projectUno/pollChoices").push(selectionArray); 
    });

    database.ref("projectUno/pollChoices").on("child_added", function(childSnapshot)
    {
        console.log(childSnapshot.val());

        var cs = childSnapshot.val();

        // chris - this might not be needed
        var childKey = childSnapshot.key;

        // chris - store snapshot information into a variable
        var restName0 = cs[0].name;
        var restAddress0 = cs[0].addr;
        var restRating0 = cs[0].rating;
        var restURL0 = cs[0].url;

        var restName1 = cs[1].name;
        var restAddress1 = cs[1].addr;
        var restRating1 = cs[1].rating;
        var restURL1 = cs[1].url;

        var restName2 = cs[2].name;
        var restAddress2 = cs[2].addr;
        var restRating2 = cs[2].rating;
        var restURL2 = cs[2].url;

        // chris - console log information to make sure it displays correctly
        console.log(restName0);
        console.log(restAddress0);
        console.log(restRating0);
        console.log(restURL0);

        console.log(restName1);
        console.log(restAddress1);
        console.log(restRating1);
        console.log(restURL1);

        console.log(restName2);
        console.log(restAddress2);
        console.log(restRating2);
        console.log(restURL2);

        // chris - code for option 1
        var voteName0 = $("<p>");
        var voteAddress0 = $("<p>");
        var voteRating0 = $("<p>");
        var voteURL0 = $("<p>");

        var voteButton0 = $("<button>");
        voteButton0.attr("id", "voteBtn");
        voteButton0.addClass("bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded");
        voteButton0.text("Vote");
        var voteLabel0 = $("<div>");
        var voteDiv0 = $("<div>").addClass("mx-2 w-1/3 m-auto h-48 bg-blue-200 border border-white rounded");

        voteName0.text(restName0);
        voteAddress0.text(restAddress0);
        voteRating0.text("Rating: " + restRating0);
        //voteURL0.text(restURL0);

        voteLabel0.append(voteName0);
        voteLabel0.append(voteAddress0);
        voteLabel0.append(voteRating0);
        //voteLabel0.append(voteURL0);
        voteLabel0.append(voteButton0);
        voteDiv0.append(voteLabel0);
        $("#pollDiv").append(voteDiv0);

        //chris - code for option 2
        var voteName1 = $("<p>");
        var voteAddress1 = $("<p>");
        var voteRating1 = $("<p>");
        var voteURL1 = $("<p>");

        var voteButton1 = $("<button>");
        voteButton1.attr("id", "voteBtn");
        voteButton1.addClass("bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded");
        voteButton1.text("Vote");
        var voteLabel1 = $("<div>");
        var voteDiv1 = $("<div>").addClass("w-1/3 m-auto h-48 bg-blue-200 border border-white rounded");

        voteName1.text(restName1);
        voteAddress1.text(restAddress1);
        voteRating1.text("Rating: " + restRating1);
        //voteURL1.text(restURL1);

        voteLabel1.append(voteName1);
        voteLabel1.append(voteAddress1);
        voteLabel1.append(voteRating1);
        //voteLabel1.append(voteURL1);
        voteLabel1.append(voteButton1);
        voteDiv1.append(voteLabel1);
        $("#pollDiv").append(voteDiv1);

        //chris - code for option 3
        var voteName2 = $("<p>");
        var voteAddress2 = $("<p>");
        var voteRating2 = $("<p>");
        var voteURL2 = $("<p>");

        var voteButton2 = $("<button>");
        voteButton2.attr("id", "voteBtn");
        voteButton2.addClass("bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 border-b-4 border-green-700 hover:border-green-500 rounded");
        voteButton2.text("Vote");
        var voteLabel2 = $("<div>");
        var voteDiv2 = $("<div>").addClass("mx-2 w-1/3 m-auto h-48 bg-blue-200 border border-white rounded");

        voteName2.text(restName2);
        voteAddress2.text(restAddress2);
        voteRating2.text("Rating: " + restRating2);
        //voteURL2.text(restURL2);

        voteLabel2.append(voteName2);
        voteLabel2.append(voteAddress2);
        voteLabel2.append(voteRating2);
        //voteLabel2.append(voteURL2);
        voteLabel2.append(voteButton2);
        voteDiv2.append(voteLabel2);
        $("#pollDiv").append(voteDiv2);

    });

});

// chris - function that handles timer when polling is open
function countDown()
{
    $("#timer").html(timeString);
    //console.log(timeString);

    if(time <= 0)
    {
        clearInterval(intervalId);
        $("#timer").html("0:00");
        console.log("time's up!")
        // chris - this function below isn't built yet, it will display poll results when time hits zero.
        //voteResult();
    }

    time--;
    minutes = Math.trunc(time / 60);
    seconds = time % 60;
    if (seconds < 10)
    {
        seconds = "0" + seconds;
    }
    timeString = minutes + ":" + seconds;
}




