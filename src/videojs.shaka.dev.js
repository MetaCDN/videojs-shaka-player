videojs.Shaka = videojs.Html5.extend({
    init: function (player, options, ready) {
        videojs.Html5.call(this, player, options, ready);
        shaka.polyfill.installAll();
        var video = document.getElementById(player.id_).getElementsByTagName('video')[0];
        var shakaPlayer = new shaka.player.Player(video);
        var estimator = new shaka.util.EWMABandwidthEstimator();
        var source = new shaka.player.DashVideoSource(options.source.src, interpretContentProtection, estimator);
        shakaPlayer.load(source).then(function(){initMenus(player, shakaPlayer)});
    }
})

videojs.Shaka.isSupported = function(){
    return !!window.MediaSource;
};

videojs.Shaka.canPlaySource = function(srcObj){
    if (srcObj.type === 'application/dash+xml') {
        return 'maybe';
    } else {
        return '';
    }
};

videojs.options.techOrder.unshift('shaka');

function setInnerText(element, text) {
    if(typeof element === 'undefined') {
      return false;
    }
    var textProperty = ('innerText' in element) ? 'innerText' : 'textContent';
    try {
      element[textProperty] = text;
    } catch(anException) {
      element.setAttribute('innerText', text);
    }
}
                                                       
function initMenus(player, shakaPlayer) {
	player.options()['playbackRates'] = [];
    var playerEL = player.el();
    playerEL.className += ' vjs-shaka';

    var shakaButton = document.createElement('div');
    shakaButton.setAttribute('class', 'vjs-shaka-button vjs-menu-button vjs-control vjs-icon-cog');

    var shakaContent = document.createElement('div');
    shakaContent.setAttribute('class', 'vjs-control-content');
    shakaButton.appendChild(shakaContent);

    var shakaTitle = document.createElement('span');
    shakaTitle.setAttribute('class', 'vjs-control-text');
    shakaContent.appendChild(shakaTitle);

    var shakaMenu = document.createElement('div');
    shakaMenu.setAttribute('class', 'vjs-menu');
    shakaContent.appendChild(shakaMenu);

    var shakaMenuContent = document.createElement('ul');
    shakaMenuContent.setAttribute('class', 'vjs-menu-content');
    shakaMenu.appendChild(shakaMenuContent);

    var videoTracks = shakaPlayer.getVideoTracks();

    var el = document.createElement('li');
    el.setAttribute('class', 'vjs-menu-item vjs-selected');
    var label = document.createElement('span');
    setInnerText(label, "Auto");
    el.appendChild(label);
    el.addEventListener('click', function(){
        var selected = shakaMenuContent.querySelector('.vjs-selected');
        if (selected) {
            selected.className = selected.className.replace('vjs-selected', '')
        }
        this.className = this.className + " vjs-selected";
        shakaPlayer.enableAdaptation(true);
    });
    shakaMenuContent.appendChild(el);

    for (var i = 0 ; i < videoTracks.length; ++ i) {
        (function () {
          var index = videoTracks[i].id;
          var rate = (videoTracks[i].bandwidth / 1024).toFixed(0);
          var height = videoTracks[i].height;
          var el = document.createElement('li');
          el.setAttribute('class', 'vjs-menu-item');
          el.setAttribute('data-val', rate);
          var label = document.createElement('span');
          setInnerText(label, height + "p (" + rate + "k)");
          el.appendChild(label);
          el.addEventListener('click', function(){
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
    if (player.options()['controls']) {
        var controlBar = playerEL.querySelectorAll('.vjs-control-bar')[0];
        if (controlBar) {
            controlBar.appendChild(shakaButton);
        }
    }
}

/**
  * Streamshark clearkey DRM interpretation
  *
  * @param {string} schemeIdUri The ContentProtection's scheme ID URI.
  * @param {!Element} contentProtection The ContentProtection element.
  * @return {!Array.<shaka.player.DrmInfo.Config>} An array of Config
  *     objects or null if the element is not understood by this application.
  */
function interpretContentProtection(schemeIdUri, contentProtection) {
    if (schemeIdUri == 'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b' && contentProtection.getAttribute('value') == 'SSDRM' ) {
        var keySystem = 'org.w3.clearkey';          

        var pssh = new Uint8Array([
            0x00, 0x00, 0x00, 0x34, 0x70, 0x73, 0x73, 0x68,
            0x01, 0x00, 0x00, 0x00, 
            0x10, 0x77, 0xef, 0xec, 0xc0, 0xb2, 0x4d, 0x02,
            0xac, 0xe3, 0x3c, 0x1e, 0x52, 0xe2, 0xfb, 0x4b,
            0x00, 0x00, 0x00, 0x01, 
        ]);

        var keyId = null;
        var licenseUrl = null;
        var streamName = null;
        for (var i = 0; i < contentProtection.childNodes.length; ++i) {
            var child = contentProtection.childNodes[i];
            if (child.nodeName == 'ssdrm:id') {
                keyId = fromBase64(child.childNodes[0].nodeValue);
            } else if (child.nodeName == 'ssdrm:licUrl') {
                licenseUrl = fromBase64(child.childNodes[0].nodeValue);
            } else if (child.nodeName == 'ssdrm:strId') {
                streamName = fromBase64(child.childNodes[0].nodeValue);
            }
        }

        if ( licenseUrl == null ) {
            return null; // no license url in pssh
        } else if ( streamName != null ) {
            // append stream name to the license url as param
            licenseUrl += "?ident=" + streamName;
        }

        // Wowza cenc pssh format doesn't seem to conform to new spec.  Build the version 1 PSSH box using
        // the supplied key value.
        var concat = null;
        if ( keyId != null ) {
            keyId = keyId.replace(/-/g,'');
            var keyBytes = shaka.util.Uint8ArrayUtils.fromHex(keyId);
            concat = new Uint8Array((pssh.length + keyBytes.length + 4));
            concat.set(pssh, 0);
            concat.set(keyBytes, pssh.length);
            concat.fill(0x00, (pssh.length + keyBytes.length));
        } else {
            // don't set init data, pass through
            return [{
              'keySystem': keySystem,
              'licenseServerUrl': licenseUrl
            }]; 
        }
          
        var initData = {
            'initData': concat,
            'initDataType': 'cenc'
        };
        return [{
            'keySystem': keySystem,
            'licenseServerUrl': licenseUrl,
            'initData': initData
        }];
    }

  return null;
};

function fromBase64(str) {
    return window.atob(str.replace(/-/g, '+').replace(/_/g, '/'));
};                 
