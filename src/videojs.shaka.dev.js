(function() {
  'use strict';

  var Html5 = videojs.getComponent('Html5');

  var Shaka = videojs.extend(Html5, {
    constructor: function(options, ready) {
      var player = this;

      // Remove the application/dash+xml source so that the browser
      // doesn't try to play it
      var source = options.source;
      delete options.source;

      Html5.call(player, options, ready);
      shaka.polyfill.installAll();

      var video = player.el();
      this.shakaPlayer = new shaka.player.Player(video);
      var estimator = new shaka.util.EWMABandwidthEstimator();
      var shakaSource = new shaka.player.DashVideoSource(source.src, null, estimator);

      this.shakaPlayer.load(shakaSource).then(function() {
        player.initShakaMenus();
      });
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
        shakaPlayer.enableAdaptation(true);
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
            shakaPlayer.enableAdaptation(false);
            shakaPlayer.selectVideoTrack(index, false);
            // TODO: Make opt_clearBuffer a property of this tech
            // If above is set to true, you may wish to uncomment the below
            // player.trigger('waiting');
          })
          shakaMenuContent.appendChild(el);
        }())
      }
      var controlBar = playerEL.parentNode.querySelectorAll('.vjs-control-bar')[0];

      if (controlBar) {
        controlBar.appendChild(shakaButton);
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

  videojs.registerComponent('Shaka', Shaka);
})();
