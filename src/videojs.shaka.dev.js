(function() {
    'use strict';

    var Html5 = videojs.getTech('Html5');
    var _mpdSource = {};

    var Shaka = videojs.extend(Html5, {
        constructor: function(options, ready) {
            var player = this;
            // Remove the application/dash+xml source so that the browser
            // doesn't try to play it
            _mpdSource = options.source;
            delete options.source;

            Html5.call(player, options, ready);
            shaka.polyfill.installAll();

            var video = player.el();
            video.setAttribute('crossorigin', 'anonymous');
            this.shakaPlayer = new shaka.player.Player(video);
            var estimator = new shaka.util.EWMABandwidthEstimator();

            var shakaSource = new shaka.player.DashVideoSource(_mpdSource.src, player.interpretContentProtection_, estimator);

            this.shakaPlayer.load(shakaSource).then(function() {
                player.initShakaMenus();
            });
        },

        interpretContentProtection_: function(schemeIdUri, contentProtection) {
            var Uint8ArrayUtils = shaka.util.Uint8ArrayUtils;

            var wvLicenseServerUrlOverride = _mpdSource['proxy-url'];
            if (schemeIdUri.toLowerCase() ==
                'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed') {
                // This is the UUID which represents Widevine in the edash-packager.
                var licenseServerUrl =
                    wvLicenseServerUrlOverride || '//widevine-proxy.appspot.com/proxy';
                return [{
                    'keySystem': 'com.widevine.alpha',
                    'licenseServerUrl': licenseServerUrl,
                    /*'licensePreProcessor': function(info) {
                        var body = shaka.util.Uint8ArrayUtils.fromString(JSON.stringify({
                            custom: {
                                data: 'vasd'
                            },
                            request: window.btoa(String.fromCharCode.apply(null, new Uint8Array(info.body)))
                        }));
                        info.body = body.buffer;
                    }*/
                }];
            }

            if (schemeIdUri == 'urn:mpeg:dash:mp4protection:2011') {
                // Ignore without a warning.
                return null;
            }

            console.warn('Unrecognized scheme:', schemeIdUri);
            return null;
        },

        initShakaMenus: function() {
            this.initAudioTrackMenu();

            //this.initBandwidthMenu();
        },

        initSubtitleMenu: function() {
            var player = this;
            var shakaPlayer = this.shakaPlayer;

            var textTracks = shakaPlayer.getTextTracks();
            if (textTracks.length <= 1) return;

            var playerEL = player.el();
            playerEL.className += ' vjs-shaka';

            var shakaButton = document.createElement('div');
            shakaButton.setAttribute('class', 'vjs-shaka-button vjs-menu-button vjs-menu-button-popup vjs-control vjs-icon-captions');

            var shakaMenu = document.createElement('div');
            shakaMenu.setAttribute('class', 'vjs-menu');
            shakaButton.appendChild(shakaMenu);

            var shakaMenuContent = document.createElement('ul');
            shakaMenuContent.setAttribute('class', 'vjs-menu-content');
            shakaMenu.appendChild(shakaMenuContent);

            for (var i = 0; i < textTracks.length; ++i) {
                (function() {
                    var id = textTracks[i].id;
                    var lang = textTracks[i].lang;
                    var active = textTracks[i].active;
                    var el = document.createElement('li');
                    el.setAttribute('class', 'vjs-menu-item ' + (active ? 'vjs-selected' : ''));
                    el.setAttribute('data-id', id);
                    var label = document.createElement('span');
                    setInnerText(label, lang);
                    el.appendChild(label);
                    el.addEventListener('click', function() {
                        var selected = shakaMenuContent.querySelector('.vjs-selected');
                        if (selected) {
                            selected.className = selected.className.replace('vjs-selected', '');
                        }
                        this.className = this.className + " vjs-selected";

                        // Set track
                        shakaPlayer.selectAudioTrack(id, true);
                    });
                    shakaMenuContent.appendChild(el);
                }());
            }
            var controlBar = playerEL.parentNode.querySelectorAll('.vjs-control-bar')[0];

            if (controlBar) {
                controlBar.appendChild(shakaButton);
            }
        },

        initAudioTrackMenu: function() {
            var player = this;
            var shakaPlayer = this.shakaPlayer;

            var audioTracks = shakaPlayer.getAudioTracks();
            if (audioTracks.length <= 1) return;

            var playerEL = player.el();
            playerEL.className += ' vjs-shaka';

            var shakaButton = document.createElement('div');
            shakaButton.setAttribute('class', 'vjs-shaka-button vjs-menu-button vjs-menu-button-popup vjs-control icon-mic');

            var shakaMenu = document.createElement('div');
            shakaMenu.setAttribute('class', 'vjs-menu');
            shakaButton.appendChild(shakaMenu);

            var shakaMenuContent = document.createElement('ul');
            shakaMenuContent.setAttribute('class', 'vjs-menu-content');
            shakaMenu.appendChild(shakaMenuContent);

            for (var i = 0; i < audioTracks.length; ++i) {
                (function() {
                    var id = audioTracks[i].id;
                    var lang = audioTracks[i].lang;
                    var active = audioTracks[i].active;
                    var el = document.createElement('li');
                    el.setAttribute('class', 'vjs-menu-item ' + (active ? 'vjs-selected' : ''));
                    el.setAttribute('data-id', id);
                    var label = document.createElement('span');
                    setInnerText(label, lang);
                    el.appendChild(label);
                    el.addEventListener('click', function() {
                        var selected = shakaMenuContent.querySelector('.vjs-selected');
                        if (selected) {
                            selected.className = selected.className.replace('vjs-selected', '');
                        }
                        this.className = this.className + " vjs-selected";

                        // Set track
                        shakaPlayer.selectAudioTrack(id, true);
                    });
                    shakaMenuContent.appendChild(el);
                }());
            }
            var controlBar = playerEL.parentNode.querySelectorAll('.vjs-control-bar')[0];
            var fullScreenButton = playerEL.parentNode.querySelector('.vjs-fullscreen-control');

            if (controlBar) {
                controlBar.insertBefore(shakaButton, fullScreenButton);
            }
        },

        initBandwidthMenu: function() {
            var player = this;


            var shakaPlayer = this.shakaPlayer;

            player.options_.playbackRates = [];
            var playerEL = player.el();
            playerEL.className += ' vjs-shaka';

            var shakaButton = document.createElement('div');
            shakaButton.id = 'bandwidth-selector';
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
            setInnerText(label, "Otomatik");
            el.appendChild(label);
            el.addEventListener('click', function() {
                var selected = shakaMenuContent.querySelector('.vjs-selected');
                if (selected) {
                    selected.className = selected.className.replace('vjs-selected', '');
                }
                this.className = this.className + " vjs-selected";
                shakaPlayer.enableAdaptation(true);
            });
            shakaMenuContent.appendChild(el);

            for (var i = 0; i < videoTracks.length; ++i) {
                (function() {
                    var index = videoTracks[i].id;
                    var rate = (videoTracks[i].bandwidth / 1000).toFixed(0);
                    var height = videoTracks[i].height;
                    var el = document.createElement('li');
                    el.setAttribute('class', 'vjs-menu-item');
                    el.setAttribute('data-val', rate);
                    var label = document.createElement('span');
                    setInnerText(label, height + "p (" + rate + "k)");
                    //setInnerText(label, rate + "kbps");
                    el.appendChild(label);
                    el.addEventListener('click', function() {
                        var selected = shakaMenuContent.querySelector('.vjs-selected');
                        if (selected) {
                            selected.className = selected.className.replace('vjs-selected', '');
                        }
                        this.className = this.className + " vjs-selected";
                        shakaPlayer.enableAdaptation(false);
                        shakaPlayer.selectVideoTrack(index, false);
                        // TODO: Make opt_clearBuffer a property of this tech
                        // If above is set to true, you may wish to uncomment the below
                        // player.trigger('waiting');
                    });
                    shakaMenuContent.appendChild(el);
                }());
            }
            var controlBar = playerEL.parentNode.querySelectorAll('.vjs-control-bar')[0];
            var fullScreenButton = playerEL.parentNode.querySelector('.vjs-fullscreen-control');

            if (controlBar) {
                controlBar.insertBefore(shakaButton, fullScreenButton);
            }
        }
    });

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
})();
