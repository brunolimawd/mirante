window.addEventListener('DOMContentLoaded', function() {

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


  // Start App
  function start() {
    geoFindMe();
    
    // Display Control msg
    results.className = 'hidden';
    errorMsg.className = 'hidden';
  };

  // Show error msg
  function showError(text) {
    errorMsg.textContent = text;
    results.className = 'hidden';
    errorMsg.className = '';
  }

  // Get geolocation
  function geoFindMe() {
    function success(position) {
      latitude  = position.coords.latitude;
      longitude = position.coords.longitude;

      // Init search
      search();
    };

    function error() {
      showError(translate('unable_location'));
    };

    // Show status to user
    results.textContent = translate('locating');
    results.className = 'searching';
    errorMsg.className = 'hidden';

    navigator.geolocation.getCurrentPosition(success, error);
  };


  // Listening reload button
  buttonFindMe.addEventListener('click', function(e) {
      geoFindMe();
  }, false);


  // Convert created time to time ago
  function getRelativeTime(time) {
    var parsed_date = new Date (time * 1000);
    // Defines relative to what ... default is now
    var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
    var delta = parseInt((relative_to.getTime()-parsed_date)/1000);
    delta=(delta<2)?2:delta;
    var timeAgo = '';

    // Parse delta
    if (delta < 60) {
      timeAgo = delta + ' ' + translate('seconds_ago');
    } else if(delta < 120) {
      timeAgo = translate('a_minute_ago');
    } else if(delta < (45*60)) {
      timeAgo = (parseInt(delta / 60, 10)).toString() + ' ' + translate('minutes_ago');
    } else if(delta < (2*60*60)) {
      timeAgo = translate('an_hour_ago');
    } else if(delta < (24*60*60)) {
      timeAgo = '' + (parseInt(delta / 3600, 10)).toString() + ' ' + translate('hours_ago');
    } else if(delta < (48*60*60)) {
      timeAgo = translate('a_day_ago');
    } else {
      timeAgo = (parseInt(delta / 86400, 10)).toString() + ' ' + translate('days_ago');
    }

    return timeAgo;
  };


  // Web activity for share url photo
  function sharePhoto(photoUrl){
    var activityShare = new MozActivity({
      name: 'share',
      data: {
        type: 'url',
        url: photoUrl
      }
    });

    activityShare.onsuccess = function() {
      console.log('Success');
    };

    activityShare.onerror = function() {
      console.log(this.error);
    };
  };  


  // Get photos by location on Instagram
  function search() {
    // Are we searching already? Then stop that search
    if(request && request.abort) {
      request.abort();
    }

    // Show status to user
    results.textContent = translate('searching');
    results.className = 'searching';
    errorMsg.className = 'hidden';

    // Creat url for request
    var term = '&lat=' + latitude + '&lng=' + longitude + '&distance=' + distance;
    var url = apiURL + term;

    request = new XMLHttpRequest({ mozSystem: true });
    request.open('get', url, true);
    request.responseType = 'json';

    // Return for request
    request.addEventListener('error', onRequestError);
    request.addEventListener('load', onRequestLoad);

    request.send();
  };


  // Request error msg
  function onRequestError() {
    console.log(request.error);    
    showError(translate('searching_error'));
  };

  // Request and load complete
  function onRequestLoad() {
    var response = request.response;

    // Check response
    if(response === null) {
      showError(translate('searching_error'));
      return;
    }

    // Clear results content
    results.textContent = '';
    results.className = '';

    var photos = response.data;
    
    if(photos.length === 0) {
      results.textContent = translate('search_no_results');
      results.className = 'searching';
      errorMsg.className = 'hidden';
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

        // Set values
        liPhoto.className = 'photo';
        profileAvatar.src = item.user.profile_picture;
        profileAvatar.alt = item.user.username;
        profileName.textContent = item.user.full_name;
        timeAgo.className = 'time-ago';
        timeAgo.textContent = getRelativeTime(item.created_time);
        photo.src = item.images.low_resolution.url;
        if ( item.caption ) {
          photoCaption.textContent = item.caption.text;  
        }
        photo.alt = 'Photo by ' + item.user.username;        
        photoMenu.type = 'toolbar';
        buttonSahre.className = 'button-share';
        buttonSahre.value = item.link;
        buttonSahre.textContent = 'Share';

        // Creat photo template 
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

        // Convert emoji
        profileName.innerHTML = emoji.a(profileName.innerHTML);
        photoCaption.innerHTML = emoji.a(photoCaption.innerHTML);

        // Listening share button
        buttonSahre.addEventListener('click', function(e) {
            sharePhoto(this.value);
        }, false);
      });
    }

    results.className = '';
  };
});
