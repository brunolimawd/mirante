// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {

  // We'll ask the browser to use strict code to help us catch errors earlier.
  // https://developer.mozilla.org/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
  'use strict';

  var translate = navigator.mozL10n.get;
  var buttonFindMe = document.getElementById('button-reload');
  var clientIdInstagram = '310accf4e9724819bb42902d1634d774';
  var apiURL = 'https://api.instagram.com/v1/media/search?client_id=' + clientIdInstagram;
  var errorMsg = document.getElementById('error');
  var results = document.getElementById('results');
  var request = null;
  var latitude = null;
  var longitude = null;
  var distance = '5000';


  // We want to wait until the localisations library has loaded all the strings.
  // So we'll tell it to let us know once it's ready.
  navigator.mozL10n.once(start);

  // ---

  function start() {
    //geoFindMe();
  }

  function geoFindMe() {
    if (!navigator.geolocation){
      errorMsg.innerHTML = "<p>Geolocation is not supported by your browser</p>";
      return;
    }

    function success(position) {
      latitude  = position.coords.latitude;
      longitude = position.coords.longitude;
      search();
    };

    function error() {
      errorMsg.innerHTML = "Unable to retrieve your location";
    };

    results.innerHTML = "<p>Locating…</p>";

    navigator.geolocation.getCurrentPosition(success, error);
  }


  buttonFindMe.addEventListener('click', function(e) {
      geoFindMe();
  }, false);


  // Get photos by location on Instagram
  function search() {

    // Are we searching already? Then stop that search
    if(request && request.abort) {
      request.abort();
    }


    results.textContent = translate('searching');

    // We will be using the 'hidden' attribute throughout the app rather than a
    // 'hidden' CSS class because it enhances accessibility.
    // See: http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#the-hidden-attribute
    results.hidden = false;
    errorMsg.hidden = true;


    var term = '&lat=' + latitude + '&lng=' + longitude + '&distance=' + distance;

    var url = apiURL + term;

    // If you don't set the mozSystem option, you'll get CORS errors (Cross Origin Resource Sharing)
    // You can read more about CORS here: https://developer.mozilla.org/docs/HTTP/Access_control_CORS
    request = new XMLHttpRequest({ mozSystem: true });

    request.open('get', url, true);
    request.responseType = 'json';

    // We're setting some handlers here for dealing with both error and
    // data received. We could just declare the functions here, but they are in
    // separate functions so that search() is shorter, and more readable.
    request.addEventListener('error', onRequestError);
    request.addEventListener('load', onRequestLoad);

    request.send();
  }


  function onRequestError() {
    var errorMessage = request.error;
      if(!errorMessage) {
        errorMessage = translate('searching_error');
      }
      showError(errorMessage);
  }


  function onRequestLoad() {
    var response = request.response;

    if(response === null) {
      showError(translate('searching_error'));
      return;
    }

    results.textContent = '';

    var photos = response.data;
    var ul = document.createElement('ul');

    if(photos.length === 0) {

      var p = document.createElement('p');
      p.textContent = translate('search_no_results');
      results.appendChild(p);

    } else {

      photos.forEach(function(item) {

        // We're using textContent because inserting content from external sources into your page using innerHTML can be dangerous.
        // https://developer.mozilla.org/Web/API/Element.innerHTML#Security_considerations
        var img = document.createElement('img');
        img.src = item.images.low_resolution.url;
        img.alt = item.caption.text;

        var li = document.createElement('li');
        li.appendChild(img);
        ul.appendChild(li);
        results.appendChild(ul);

      });

    }

    // And once we have all the content in place, we can show it.
    results.hidden = false;

  }


  function showError(text) {
    errorMsg.textContent = text;
    errorMsg.hidden = false;
    results.hidden = true;
  }


});
