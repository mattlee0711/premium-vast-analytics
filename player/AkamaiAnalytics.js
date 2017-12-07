var AkamaiAnalytics = function(analyticsConfigUrl, player, viewerId) {
  var isPlayerPaused = false;
  var akaPlugin;

  var functionMap = {
    'onSourceLoaded': function(e) {
      if (player.getConfig().source.title != undefined) {
        akaPlugin.setData('title', player.getConfig().source.title);
      }
    },
    'onPlay': function() {
      console.log("This is onPlay");
      if (isPlayerPaused) {
        akaPlugin.handleResume();
      } else {
        akaPlugin.handlePlaying();
      }
      isPlayerPaused = false;
    },
    'onPaused': function() {
      console.log("This is onPause");
      akaPlugin.handlePause();
      isPlayerPaused = true;
    },
    'onPlaybackFinished': function() {
      console.log("This is onPlaybackFinished");
      akaPlugin.handlePlayEnd("Play.End.Detected");
    },
    'onVideoPlaybackQualityChanged': function(e) {
      console.log("Bitrate Switch:-" + player.getVideoQuality().bitrate);
      if (player.getVideoQuality().id != "auto") {
        akaPlugin.handleBitRateSwitch(player.getVideoQuality().bitrate || 0);
      }
    },
    'onStallStarted': function() {
      console.log("Buffering Start");
      akaPlugin.handleBufferStart();
    },
    'onStallEnded': function() {
      console.log("Buffering End");
      akaPlugin.handleBufferEnd();
    },
    'onAdStarted': function(e) {
      akaPlugin.handleAdStarted(createAdObject(e));
    },
    'onAdSkipped': function(e) {
      akaPlugin.handleAdStopped(createAdObject(e));
    },
    'onAdFinished': function(e) {
      akaPlugin.handleAdCompleted(createAdObject(e));
    },
    'onError': function(e) {
      akaPlugin.handleError('Error' + e.code);
    },
    'onDestroy': function() {
      akaPlugin.handleApplicationExit();
    }
  };

  var createAkaPluginCallback = function(player) {
    var akaPluginCallBack = {};
    akaPluginCallBack['streamHeadPosition'] = player.getCurrentTime;
    akaPluginCallBack['streamLength'] = player.getDuration;
    akaPluginCallBack['streamURL'] = function() {
      var config = player.getConfig();
      var streamType = player.getStreamType();
      return config.source[streamType];
    };
    return akaPluginCallBack;
  };

  var createAdObject = function(e) {

    // ad info not available (yet) through player event

    var adObject = {
      adDuration: undefined,
      adTitle: undefined,
      adCategory: undefined,
      adPartnerId: undefined,
      adServer: undefined,
      adDaypart: undefined,
      adIndustryCategory: undefined,
      adEvent: undefined,
    };
    return adObject;
  };

  var setupAkamaiAnalytics = function(player) {

    for (var fnName in functionMap) {
      player.addEventHandler(fnName, functionMap[fnName]);
    }

    akaPlugin = new AkaHTML5MediaAnalytics(createAkaPluginCallback(player));

    akaPlugin.setData('viewerId', viewerId);
    akaPlugin.setData("playerId", 'bitmovin player ' + player.version);

    console.log("Initiating Session");
    akaPlugin.handleSessionInit();
  };

  var setConfigUrl = function(url) {
    // make sure generic api is used
    if (url.indexOf('?enableGenericAPI=1') === -1) {
      url += '?enableGenericAPI=1&AkamaiAnalytics_debug=1';
    }
    window.AKAMAI_MEDIA_ANALYTICS_CONFIG_FILE_PATH = url;
  };

  var destroy = function() {
    for (var fnName in functionMap) {
      player.removeEventHandler(fnName, functionMap[fnName]);
    }
    akaPlugin = null;
  };

  var init = function() {
    if (window.AkaHTML5MediaAnalytics === undefined) {
      console.error('Error creating Akamai Analytics: window.AkaHTML5MediaAnalytics is undefined (possible reason: Akamai Analytics script missing)');
      return;
    }

    if (!analyticsConfigUrl || analyticsConfigUrl === 'INSERT-CONFIG-PATH-HERE') {
      console.error('Error creating Akamai Analytics: Akamai Analytics Config Path not set');
      return;
    }

    viewerId = viewerId || 'DefaultViewer';

    setConfigUrl(analyticsConfigUrl);
    setupAkamaiAnalytics(player);
  };
  init();

  return {
    destroy: destroy
  };
};
