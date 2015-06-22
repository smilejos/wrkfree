'use strict';
var OnToastEvent = require('./onToastEvent');

/**
 * all below API only allowed four arguments list here:
 * 
 * NOTE: actionTips and actionHandler is optional
 *
 * @param {String}      title, the event message title
 * @param {String}      message, the event message
 * @param {String}      actionTips, the label tips of extra-action
 * @param {Function}    actionHandler, the handler of extra-action
 */

/**
 * @Public API
 * @Author: George_Chen
 * @Description: show success toast event.
 */
exports.showSuccessEvent = function(title, message, actionTips, actionHandler) {
    return _toastEvent('success', title, message, actionTips, actionHandler);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: show info toast event.
 */
exports.showInfoEvent = function(title, message, actionTips, actionHandler) {
    return _toastEvent('info', title, message, actionTips, actionHandler);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: show warning toast event.
 */
exports.showWarningEvt = function(title, message, actionTips, actionHandler) {
    return _toastEvent('warning', title, message, actionTips, actionHandler);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: show error toast event.
 */
exports.showErrorEvent = function(title, message, actionTips, actionHandler) {
    return _toastEvent('error', title, message, actionTips, actionHandler);
};

/**
 * @Author: George_Chen
 * @Description: execute toast event action
 */
function _toastEvent(evtType, evtTitle, evtMessage, evtAction, evtHandler) {
    var context = window.context;
    return context.executeAction(OnToastEvent, {
        type: evtType,
        title: evtTitle,
        message: evtMessage,
        actionLabel: evtAction,
        actionHandler: evtHandler
    });
}
