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

  function getRelativeTime(time) { 

    var parsed_date = new Date (time * 1000);
    var relative_to = (arguments.length > 1) ? arguments[1] : new Date(); // Defines relative to what ... default is now
    var delta = parseInt((relative_to.getTime()-parsed_date)/1000);
    delta=(delta<2)?2:delta;

    var r = '';

    // Parse delta
    if (delta < 60) {
      r = delta + ' seconds ago';
    } else if(delta < 120) {
      r = 'a minute ago';
    } else if(delta < (45*60)) {
      r = (parseInt(delta / 60, 10)).toString() + ' minutes ago';
    } else if(delta < (2*60*60)) {
      r = 'an hour ago';
    } else if(delta < (24*60*60)) {
      r = '' + (parseInt(delta / 3600, 10)).toString() + ' hours ago';
    } else if(delta < (48*60*60)) {
      r = 'a day ago';
    } else {
      r = (parseInt(delta / 86400, 10)).toString() + ' days ago';
    }

    return r;

  };


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
    
    if(photos.length === 0) {

      var p = document.createElement('p');
      p.textContent = translate('search_no_results');
      results.appendChild(p);

    } else {

      var listPhotos = document.createElement('ul');
      results.appendChild(listPhotos);

      photos.forEach(function(item) {

        // We're using textContent because inserting content from external sources into your page using innerHTML can be dangerous.
        // https://developer.mozilla.org/Web/API/Element.innerHTML#Security_considerations

        var liPhoto = document.createElement('li');
        var header = document.createElement('header');
        var profileAvatar = document.createElement('img');
        var profileName = document.createElement('h2');
        var timeAgo = document.createElement('span');
        var wrapPhoto = document.createElement('figure');
        var photo = document.createElement('img');
        var photoCaption = document.createElement('figcaption');
        var photoMenu = document.createElement('menu');
        var liShare = document.createElement('li');
        var buttonSahre = document.createElement('button');

        liPhoto.className = 'photo';
        profileAvatar.src = item.user.profile_picture;
        profileAvatar.alt = item.user.username;
        profileName.textContent = item.user.full_name;
        timeAgo.className = 'time-ago';
        timeAgo.textContent = getRelativeTime(item.created_time);
        photo.src = item.images.low_resolution.url;
        if ( item.caption ) {
          photo.alt = item.caption.text;
          photoCaption.textContent = item.caption.text;  
        } else {
          photo.alt = 'Photo by ' + item.user.username;
        }        
        photoMenu.type = 'toolbar';
        buttonSahre.className = 'button-share';
        buttonSahre.value = 'Share';
        buttonSahre.textContent = 'Share';

        header.appendChild(profileAvatar);
        header.appendChild(profileName);
        header.appendChild(timeAgo);
        
        wrapPhoto.appendChild(photo);
        wrapPhoto.appendChild(photoCaption);

        liShare.appendChild(buttonSahre);
        photoMenu.appendChild(liShare);
        
        liPhoto.appendChild(header);
        liPhoto.appendChild(wrapPhoto);
        liPhoto.appendChild(photoMenu);

        listPhotos.appendChild(liPhoto);

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
