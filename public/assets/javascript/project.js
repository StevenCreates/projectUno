$(document).ready(function () {
    initMap();
    
    //variables for Yelp API calls
    var term = '';
    var location = '';
    var name = '';
    var city = '';
    var longitude = '';
    var latitude = '';
    // initMap();   
    geoInitialize()
    //Global variables for map functions:
    var map

    

    //search onclick that grabs values and stores from term and location
    $("#search").on("click", function (event) {
        location = $("#locationInput").val().trim();
        term = $("#termInput").val().trim();
        yelpAPI();
        geoFirstClick()
        console.log(location);
        console.log(term);
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
                    // console.log(response);
                    name = response.name;
                    location = response.location;
                    city = response.location.city;
                    longitude = response.coordinates.longitude;
                    latitude = response.coordinates.latitude;
                    var resultsDiv = $("<div>");
                    var nameResult = $("<a>")
                    
                    resultsDiv.attr('class', 'selectedRes border-solid border-2 mt-1 border-black')
                    nameResult.append(name);
                    resultsDiv.attr('data-longitude', response.coordinates.longitude);
                    resultsDiv.attr('data-latitude', response.coordinates.latitude);
                    resultsDiv.append(nameResult);
                    $("#results").append(resultsDiv);
                });
                clickSelection();
                geoMarker();
            }
        });

    }


    //click function that currently console.logs the latitude and longitude of the selected location
    var mapLongitude = '';
    var mapLatitude = '';


   function clickSelection(){
    $('.selectedRes').on("click", function () {
        mapLongitude = $(this).attr('data-longitude')
        mapLatitude = $(this).attr('data-latitude')
        console.log(mapLatitude);
        console.log(mapLongitude);
    });
   }

  
    //google map API js
    

    var map
    var slc = {lat: 40.7608, lng: -111.8910};
    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7608, lng: -111.8910},
        zoom: 8
      });
    }

    function searchMap() {
        // The location of Uluru
        var searchLocation = {lat: 41.7608, lng: -115.8910}
        // The map, centered at Uluru
        var map = new google.maps.Map(
            document.getElementById('map'), {zoom: 4, center: slc});
        // The marker, positioned at Uluru
        var marker = new google.maps.Marker({position: searchLocation, map: map});
      }
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

        console.log(geoQueryUrl)

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

    function geoMarker() {
        // CURRENTLY: will add pin for roosters brewery in OGDEN. CITY SEARCH: OGDEN to test.
        var request = {
            location: map.getCenter(),
            radius: '1000',
            query: "Rooster's brewing"
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
   
});