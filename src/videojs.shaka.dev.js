videojs.Shaka = videojs.Html5.extend({
    init: function (player, options, ready) {
        videojs.Html5.call(this, player, options, ready);
        shaka.polyfill.installAll();
        var video = document.getElementById('video').getElementsByTagName('video')[0];
        var shakaPlayer = new shaka.player.Player(video);
        var estimator = new shaka.util.EWMABandwidthEstimator();
        var source = new shaka.player.DashVideoSource(options.source.src, null, estimator);
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
              shakaPlayer.selectVideoTrack(index, true);
              player.trigger('waiting');
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
