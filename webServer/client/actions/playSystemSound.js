'use strict';
var ActionUtils = require('./actionUtils');

/**
 * current supported system sounds id
 * check SystemSounds.jsx for more detail
 */
var SoundsId = {
    'message': 'message_sound',
    'notification': 'notification_sound',
    'phonecall': 'phonecall_sound'
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to play specific system sound effect
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.type, the type of system sound
 */
module.exports = function(actionContext, data) {
    var eid = SoundsId[data.type];
    if (!eid) {
        return _showWarning();
    }
    // TODO:
    // we should also check user has turned-off sound effect or not ?
    var sound = document.getElementById(eid);
    if (!sound) {
        return _showWarning();
    }
    sound.play();
};

/**
 * @Author: George_Chen
 * @Description: show warning message for failing to play sound
 */
function _showWarning() {
    ActionUtils.showWarningEvent('WARN', 'fail to sound effect');
}
