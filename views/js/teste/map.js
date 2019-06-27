var map;
var directionsDisplay;
var latitude  = $('#latlng').data("lat");
var longitude = $('#latlng').data("long");

function initMap() {
	var uluru = {lat: latitude, lng: longitude}; 
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: uluru,
	});
	var marker = new google.maps.Marker({
		position: uluru,
		map: map
	});
	directionsDisplay = new google.maps.DirectionsRenderer();
}

function calcularRota() {
	var start = $.trim( $('.form-mapa').find('#q').val() );
	var end = latitude + ', ' + longitude;
	var request = {
		origin: start, 
		destination: end,
		travelMode: google.maps.DirectionsTravelMode.DRIVING
	};

	var directionsService = new google.maps.DirectionsService();
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(response);
		} else {
			//alert(status);
			alert("Localização não encontrada.");
		}
	});
}

$('.form-mapa').submit(calcularRota);