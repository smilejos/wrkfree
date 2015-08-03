'use strict';
var WildEmitter = require('wildemitter');
var Promise = require('bluebird');
var RtcService = require('../../services/rtcService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * rtc connections for each channel
 */
var Connections = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to release current rtc connection
 *         
 * @param {String}          id, the connection id
 */
exports.releaseConnection = function(id) {
    var connection = Connections[id];
    connection.stopLocalVideo();
    if (connection) {
        delete Connections[id];
    }
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check target rtc connection has exist or not
 *       
 * @param {String}          id, the connection id
 */
exports.hasConnection = function(id) {
    var conn = Connections[id];
    return (conn && conn.webrtc.localStreams.length > 0);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting target rtc connection
 *       
 * @param {String}          id, the connection id
 */
exports.getConnection = function(id, options) {
    var opts = options || {};
    if (!Connections[id]) {
        return (Connections[id] = new rtcConnection(id, opts));
    }
    return Connections[id];
};

/**
 * @Author: George_Chen
 * @Description: constructor of rtc connection
 *       
 * @param {String}          channelId, channel's id
 * @param {Object}          opts, the options
 */
var rtcConnection = function(channelId, opts) {
    var self = this;
    var WebRTC = require('webrtc');
    this.config = {
        debug: false,
        enableDataChannels: true,
        autoRequestMedia: false,
        autoRemoveVideos: true,
        adjustPeerVolume: true,
        peerVolumeWhenSpeaking: 0.25,
        media: {
            video: true,
            audio: true
        },
        receiveMedia: { // FIXME: remove old chrome <= 37 constraints format
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        },
        localVideo: {
            autoplay: true,
            mirror: true,
            muted: true
        }
    };

    // assign channelId as the rtc connection id
    this.id = channelId;

    // call WildEmitter constructor
    WildEmitter.call(this);

    // bind to webrtc module
    this.webrtc = new WebRTC(opts || {});

    // attach a few methods from underlying lib to simple.
    ['mute', 'unmute', 'pauseVideo', 'resumeVideo', 'pause', 'resume', 'sendToAll', 'sendDirectlyToAll'].forEach(function(method) {
        self[method] = self.webrtc[method].bind(self.webrtc);
    });

    // proxy events from WebRTC
    this.webrtc.on('*', function() {
        self.emit.apply(self, arguments);
    });

    // log all events in debug mode
    if (this.config.debug) {
        this.on('*', this.logger.log.bind(this.logger, 'RtcHelper event:'));
    }

    // exchange signaling message
    this.webrtc.on('message', function(payload) {
        payload.channelId = channelId;
        RtcService.signaling(payload);
    });

    this.webrtc.on('peerStreamAdded', function(peer) {
        self.handleStreamAsync(peer, true);
    });

    this.webrtc.on('peerStreamRemoved', function(peer) {
        self.handleStreamAsync(peer, false);
    });

    // echo cancellation attempts
    if (this.config.adjustPeerVolume) {
        this.webrtc.on('speaking', this.setVolumeForAll.bind(this, this.config.peerVolumeWhenSpeaking));
        this.webrtc.on('stoppedSpeaking', this.setVolumeForAll.bind(this, 1));
    }

    // sending mute/unmute to all peers
    this.webrtc.on('audioOn', function() {
        self.webrtc.sendToAll('unmute', {
            name: 'audio'
        });
    });
    this.webrtc.on('audioOff', function() {
        self.webrtc.sendToAll('mute', {
            name: 'audio'
        });
    });
    this.webrtc.on('videoOn', function() {
        self.webrtc.sendToAll('unmute', {
            name: 'video'
        });
    });
    this.webrtc.on('videoOff', function() {
        self.webrtc.sendToAll('mute', {
            name: 'video'
        });
    });

    // used for handling data channel message
    this.webrtc.on('channelMessage', function(peer, label, data) {
        if (data.type == 'volume') {
            self.emit('remoteVolumeChange', peer, data.volume);
        }
    });
};

/**
 * @Author: George_Chen
 * @Description: inherit the prototype of WildEmitter 
 */
rtcConnection.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: rtcConnection
    }
});

/**
 * @Author: George_Chen
 * @Description: handler for rtc signaling mechanism
 *       
 * @param {Object}          message, the signaling message
 */
rtcConnection.prototype.onSignaling = function(message) {
    var peers = this.webrtc.getPeers(message.from, message.roomType);
    var peer;
    if (message.type === 'offer') {
        SharedUtils.fastArrayMap(peers, function(p) {
            if (p.sid === message.sid) {
                peer = p;
            }
        });
        if (!peer) {
            peer = this.webrtc.createPeer({
                id: message.from,
                sid: message.sid,
                type: message.roomType,
                enableDataChannels: this.config.enableDataChannels && message.roomType !== 'screen',
                sharemyscreen: message.roomType === 'screen' && !message.broadcaster,
                // broadcaster: message.roomType === 'screen' && !message.broadcaster ? this.connection.getSessionid() : null
                // use socket id as broadcaster
            });
            this.emit('createdPeer', peer);
        }
        peer.handleMessage(message);
    } else if (peers.length) {
        SharedUtils.fastArrayMap(peers, function(p) {
            if (!message.sid || p.sid === message.sid) {
                return p.handleMessage(message);
            }
        });
    }
};

/**
 * @Author: George_Chen
 * @Description: remove connected peers which are not in live clients
 *       
 * @param {Array}          clients, live peers on server sdie
 */
rtcConnection.prototype.removeHangupPeersAsync = function(clients) {
    var webrtc = this.webrtc;
    return Promise.filter(webrtc.peers, function(peer) {
        return (clients.indexOf(peer.id) === -1);
    }).map(function(targetPeer) {
        return webrtc.removePeers(targetPeer.id, targetPeer.type);
    });
};

/**
 * @Author: George_Chen
 * @Description: send offer to target peers based on sdps
 *       
 * @param {Object}          sessionSdps, sdp of target peers
 */
rtcConnection.prototype.connectAsync = function(sessionSdps) {
    var self = this;
    var offerTargets = Object.keys(sessionSdps);
    return Promise.map(offerTargets, function(targetId) {
        var targetSdp = sessionSdps[targetId];
        return Promise.filter(Object.keys(targetSdp), function(sdpType) {
            return !!targetSdp[sdpType];
        }).map(function(targetSdpTYpe) {
            var peer = self.webrtc.createPeer({
                id: targetId,
                type: targetSdpTYpe,
                enableDataChannels: self.config.enableDataChannels && targetSdpTYpe !== 'screen',
                receiveMedia: {
                    mandatory: {
                        OfferToReceiveAudio: targetSdpTYpe !== 'screen' && self.config.receiveMedia.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: self.config.receiveMedia.mandatory.OfferToReceiveVideo
                    }
                }
            });
            self.emit('createdPeer', peer);
            peer.start();
        });
    }).catch(function(err) {
        SharedUtils.printError('rtcHelper.js', 'connectAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to control rtc media on current rtc connection
 *       
 * @param {Boolean}          isVideo, indicate target media is video or audio
 * @param {Boolean}          isOn, indicate mode is on or not
 */
rtcConnection.prototype.controlMedia = function(isVideo, isOn) {
    var webrtc = this.webrtc;
    if (isVideo) {
        return (isOn ? webrtc.resumeVideo() : webrtc.pauseVideo());
    } else {
        return (isOn ? webrtc.unmute() : webrtc.mute());
    }
};

/**
 * @Author: George_Chen
 * @Description: hangup on all connected peers
 *         NOTE: each time we call peer.end(), the peer will be removed
 *               from the this.webrtc.peers; so we always call peer[0].end
 */
rtcConnection.prototype.hangupAsync = function() {
    var peers = this.webrtc.peers;
    return Promise.each(peers, function() {
        if (peers[0]) {
            peers[0].end();
        }
    });
};

/**
 * @Author: George_Chen
 * @Description: for getting local meadia stream
 *         NOTE: get both video and audio on default
 * 
 * @param {Object}          mediaConfig, the config of getting media
 */
rtcConnection.prototype.getLocalStreamAsync = function(mediaConfig) {
    var self = this;
    var media = mediaConfig || this.config.media;
    return new Promise(function(resolver, rejector) {
        self.webrtc.startLocalMedia(media, function(err, stream) {
            return (err ? rejector(err) : resolver(stream));
        });
    });
};

/**
 * @Author: George_Chen
 * @Description: stop all local media
 */
rtcConnection.prototype.stopLocalVideo = function() {
    this.webrtc.stopLocalMedia();
};

/**
 * @Author: George_Chen
 * @Description: handler on remote rtc stream added or removed
 *
 * @param {Object}          peer, the remote peer
 * @param {Boolean}         isAdded, indicate stream is added or not
 */
rtcConnection.prototype.handleStreamAsync = function(peer, isAdded) {
    var self = this;
    return Promise.try(function() {
        RtcService.onRemoteStream({
            channelId: self.id,
            clientId: peer.id,
            stream: (isAdded ? peer.stream : null)
        });
    }).delay(250).then(function() {
        if (!isAdded) {
            return;
        }
        if (!self.webrtc.isAudioEnabled()) {
            peer.send('mute', {
                name: 'audio'
            });
        }
        if (!self.webrtc.isVideoEnabled()) {
            peer.send('mute', {
                name: 'video'
            });
        }
    });
};

/**
 * @Author: George_Chen
 * @Description: to check target peer has connected or not
 *
 * @param {String}          id, the peer id
 * @param {String}          type, the rtc type (video/audio/screen)
 */
rtcConnection.prototype.hasPeerConnected = function(id, type) {
    return (this.webrtc.getPeers(id, type).length > 0);
};

/**
 * TODO: set volume
 * @Author: George_Chen
 * @Description:
 */
rtcConnection.prototype.setVolumeForAll = function() {
    // TODO: handling volume change 
};
