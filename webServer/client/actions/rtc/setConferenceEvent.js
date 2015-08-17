'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var EventPrefix = 'Rtc';
var PlaySystemSound = require('../playSystemSound');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to customize toast event for conference call
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.isShown, the channel id
 * @param {String}      data.title, the channel id
 * @param {String}      data.message, the channel id
 * @param {Number}      data.ttl, the ttl of conference event
 */
module.exports = function(actionContext, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.isShown, 'boolean'),
        SharedUtils.argsCheckAsync(data.title, 'string'),
        SharedUtils.argsCheckAsync(data.message, 'string'),
        function(cid, isEventShown, evtTitle, evtMessage) {
            if (!SharedUtils.isFunction(data.callHandler)) {
                throw new Error('no callHandler assigned');
            }
            var eid = EventPrefix + ':' + cid;
            if (!isEventShown) {
                return actionContext.dispatch('CLOSE_TOAST_EVENT', {
                    eventId: eid
                });
            }
            actionContext.executeAction(PlaySystemSound, {
                type: 'phonecall'
            });
            actionContext.dispatch('ON_CUSTOM_EVENT', {
                eventId: eid,
                ttl: data.ttl,
                title: evtTitle,
                message: evtMessage,
                actionLabel: 'join',
                actionHandler: function() {
                    data.callHandler();
                    return actionContext.dispatch('CLOSE_TOAST_EVENT', {
                        eventId: eid
                    });
                }
            });
        }).catch(function(err) {
            SharedUtils.printError('setConferenceEvent.js', 'core', err);
            ActionUtils.showErrorEvent('RTC', 'abnormal conference event');
        });
};
