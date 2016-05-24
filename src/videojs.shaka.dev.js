(function() {
  'use strict';

  var Html5 = videojs.getComponent('Html5'),
      source = null,
      cachedlicenseServerURL,
      widevineUrn = "urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed",
      widevineKeySys = "com.widevine.alpha",
      playreadyUrn = "urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95",
      playreadyKeySys = "com.microsoft.playready";



  var interpreContentProtection = function(schemeIdUri, contentProtection) {
    /*
      I'm expecting source to have this structure:

        source: {
            src: mpd
            licenseServers: {
              'widevine': 'http://servidorwidevine.com/blah',
              'playready': 'http://servidorplayready.com/bleh'
            }
          }
    */

    if (!source) {
      console.warn('source has not DRM data.');
      return null;
    }

    if ( (schemeIdUri === widevineUrn) && source.licenseServers['widevine'] ) {
        return [{
          keySystem: widevineKeySys,
          licenseServerUrl: source.licenseServers['widevine']
        }];
    }

    if ( (schemeIdUri === playreadyUrn) && source.licenseServers['playready'] ) {
        return [{
          keySystem: playreadyKeySys,
          licenseServerUrl: source.licenseServers['playready']
        }];
    }


    console.warn('schemeIdUri is not valid.');
    return null;
  };

  var Shaka = videojs.extend(Html5, {
    constructor: function(options, ready) {
      var player = this;

      // Remove the application/dash+xml source so that the browser
      // doesn't try to play it
      source = options.source;
      delete options.source;

      Html5.call(player, options, ready);
      shaka.polyfill.installAll();

      var video = player.el();
      console.log('player.el(), video: ', video);
      this.shakaPlayer = new shaka.player.Player(video);
      /*
      Set event listener on the current video element, in order to provide
      a way for the outer world to communicate with us, insted of exposing
      this.shakaPlayer in the global scope.
      */
      // Events to provide the audio tracks
      videojs.on(video, "getAudioTracks", function() {
        var audioTracks = player.shakaPlayer.getAudioTracks();
        videojs.trigger(video, "audioTracks", { audioTracks: audioTracks });
      });

      videojs.on(video, "setAudioTrack", function(event, data) {
        var trackId = data.audioTrackId;
        player.shakaPlayer.selectAudioTrack( data.audioTrackId );
      });

      // Event to reload
      videojs.on(video, "reload", function(event, data) {
        player.reload(data.mpd, data.source);
      });

      var estimator = new shaka.util.EWMABandwidthEstimator();
      var shakaSource;
      if (source.licenseServers && ( Object.getOwnPropertyNames(source.licenseServers).length > 0 )) {
        shakaSource = new shaka.player.DashVideoSource(source.src, interpreContentProtection, estimator);
      }
      else {
        shakaSource = new shaka.player.DashVideoSource(source.src, null, estimator);
      }

      player.source = shakaSource;

      this.shakaPlayer.load(shakaSource).then(function() {
        if (options.shakaMenus) {
          player.initShakaMenus();
        }
      });
    },

    reload: function(channelMpd, source_) {
      this.shakaPlayer.unload();

      var estimator = new shaka.util.EWMABandwidthEstimator();
      var abrManager = new shaka.media.SimpleAbrManager();
      var shakaSource;

      if (source_) {
        source = source_;
      }

      shakaSource = new shaka.player.DashVideoSource(
        channelMpd, interpreContentProtection, estimator, abrManager);

      this.shakaPlayer.load(shakaSource);
    },

    initShakaMenus: function() {
      var player = this;
      var shakaPlayer = this.shakaPlayer;

      player.options_['playbackRates'] = [];
      var playerEL = player.el();
      playerEL.className += ' vjs-shaka';

      var shakaButton = document.createElement('div');
      shakaButton.setAttribute('class', 'vjs-shaka-button vjs-menu-button vjs-menu-button-popup vjs-control vjs-icon-cog');

      var shakaMenu = document.createElement('div');
      shakaMenu.setAttribute('class', 'vjs-menu');
      shakaButton.appendChild(shakaMenu);

      var shakaMenuContent = document.createElement('ul');
      shakaMenuContent.setAttribute('class', 'vjs-menu-content');
      shakaMenu.appendChild(shakaMenuContent);

      var videoTracks = shakaPlayer.getVideoTracks();

      var el = document.createElement('li');
      el.setAttribute('class', 'vjs-menu-item vjs-selected');
      var label = document.createElement('span');
      setInnerText(label, "Auto");
      el.appendChild(label);
      el.addEventListener('click', function() {
        var selected = shakaMenuContent.querySelector('.vjs-selected');
        if (selected) {
          selected.className = selected.className.replace('vjs-selected', '')
        }
        this.className = this.className + " vjs-selected";
        shakaPlayer.configure({ 'enableAdaptation': true });
      });
      shakaMenuContent.appendChild(el);

      for (var i = 0; i < videoTracks.length; ++i) {
        (function() {
          var index = videoTracks[i].id;
          var rate = (videoTracks[i].bandwidth / 1024).toFixed(0);
          var height = videoTracks[i].height;
          var el = document.createElement('li');
          el.setAttribute('class', 'vjs-menu-item');
          el.setAttribute('data-val', rate);
          var label = document.createElement('span');
          setInnerText(label, height + "p (" + rate + "k)");
          el.appendChild(label);
          el.addEventListener('click', function() {
            var selected = shakaMenuContent.querySelector('.vjs-selected');
            if (selected) {
              selected.className = selected.className.replace('vjs-selected', '')
            }
            this.className = this.className + " vjs-selected";
            shakaPlayer.configure({ 'enableAdaptation': false });
            shakaPlayer.selectVideoTrack(index, false);
            // TODO: Make opt_clearBuffer a property of this tech
            // If above is set to true, you may wish to uncomment the below
            // player.trigger('waiting');
          })
          shakaMenuContent.appendChild(el);
        }())
      }
      var controlBar = playerEL.parentNode.querySelector('.vjs-control-bar');

      if (controlBar) {
        controlBar.insertBefore(shakaButton, controlBar.lastChild);
      }
    }
  })

  Shaka.isSupported = function() {
    return !!window.MediaSource;
  };

  Shaka.canPlaySource = function(srcObj) {
    if (srcObj.type === 'application/dash+xml') {
      return 'maybe';
    } else {
      return '';
    }
  };

  videojs.options.techOrder.unshift('shaka');

  function setInnerText(element, text) {
    if (typeof element === 'undefined') {
      return false;
    }
    var textProperty = ('innerText' in element) ? 'innerText' : 'textContent';
    try {
      element[textProperty] = text;
    } catch (anException) {
      element.setAttribute('innerText', text);
    }
  }

  videojs.registerTech('Shaka', Shaka);
  window.Shaka = Shaka;
})();
