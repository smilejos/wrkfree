'use strict';
var Request = require('superagent');
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var SignUpStore = require('../../shared/stores/SignUpStore');

/**
 * After store this reference, we can cancel the "server request"
 * when we detect that user still typing email
 */
var EmailQuery = null;

/**
 * @Public API
 * @Author: George_Chen
 * @Description: an runtime check action for signup form
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      item.type, the field type
 * @param {Object}      item.value, the field value for checking
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, item, callback) {
    return Promise.try(function() {
        if (item.type === 'email') {
            return _isEmailUsed(item.fieldValue);
        }
        return SharedUtils.isNormalChar(item.fieldValue);
    }).then(function(result) {
        var signUpStore = actionContext.getStore(SignUpStore);
        return signUpStore.updateValidStatus(item.type, result);
    }).catch(function(err) {
        SharedUtils.printError('inputValidator', 'action', err);
        return false;
    }).nodeify(callback);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: runtime check the user email is already used or not
 * NOTE: "res.ok" means email is available to applied
 *
 * @param {String}      userEmail, user email
 */
function _isEmailUsed(userEmail) {
    if (EmailQuery && EmailQuery.isPending()) {
        EmailQuery.cancel('User typing is not completed');
    }
    if (SharedUtils.isEmail(userEmail)) {
        EmailQuery = Promise.delay(1000).cancellable();
        return EmailQuery.then(function() {
            return new Promise(function(resolve, reject) {
                Request.head('/app/checkuser')
                    .query({email: userEmail})
                    .end(function(err, res) {
                        return (err ? reject(err) : resolve(res.ok));
                    });
            });
        }).catch(function(err) {
            SharedUtils.printError('inputValidator', '_checkUserAsync', err);
            return false;
        });
    }
    return false;
}
