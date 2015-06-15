'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var EventTypes = ['success', 'info', 'warning', 'error'];

/**
 * Public API
 * @Author: George_Chen
 * @Description: handler on receive toast event
 *         
 * @param {String}      data.type, the type of event
 * @param {String}      data.title, the event message title
 * @param {String}      data.message, the event message
 * @param {String}      data.actionLabel, the label of extra-action
 * @param {Function}    data.actionHandler, the handler of extra-action
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        type: _checkEventType(data.type),
        title: SharedUtils.argsCheckAsync(data.title, 'string'),
        message: SharedUtils.argsCheckAsync(data.message, 'string')
    }).then(function(eventData) {
        eventData.actionLabel = data.actionLabel;
        eventData.actionHandler = data.actionHandler;
        actionContext.dispatch('ON_TOAST_EVENT', eventData);
    }).catch(function(err) {
        SharedUtils.printError('onToastEvent.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: check the toast event type is valid or not
 *         
 * @param {String}      type, the type of event
 */
function _checkEventType(type) {
    if (EventTypes.indexOf(type) !== -1) {
        return type;
    }
    throw new Error('no supported event type!');
}
