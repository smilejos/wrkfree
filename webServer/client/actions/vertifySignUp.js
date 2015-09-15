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
    // workaround for rendering signup page fail
    if (typeof window === 'undefined') return;
    return Promise.try(function() {
        var value = item.fieldValue;
        switch (item.type) {
            case 'email':
                return _isEmailUsed(value);
            case 'givenName':
                return _getVertifyStatus(SharedUtils.isGivenName(value));
            case 'familyName':
                return _getVertifyStatus(SharedUtils.isFamilyName(value));
            default:
                return _getVertifyStatus(SharedUtils.isNormalChar(value));
        }
    }).then(function(result) {
        var signUpStore = actionContext.getStore(SignUpStore);
        return signUpStore.updateStore(item.type, item.fieldValue, result);
    }).catch(function(err) {
        SharedUtils.printError('inputValidator', 'action', err);
        return false;
    }).nodeify(callback);
};

/**
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
                    .query({
                        email: userEmail
                    })
                    .end(function(err, res) {
                        var result = _getVertifyStatus(res.ok, 'email has been used');
                        return (err ? reject(err) : resolve(result));
                    });
            });
        }).catch(function(err) {
            SharedUtils.printError('inputValidator', '_checkUserAsync', err);
            return _getVertifyStatus(false, 'operational error');
        });
    }
    return _getVertifyStatus(false);
}

/**
 * @Author: George_Chen
 * @Description: get the vertified status object of signup field
 *
 * @param {Boolean}     valid, the valid status of signup field
 * @param {String}      errMsg, the error message will be passed to store
 */
function _getVertifyStatus(valid, errMsg) {
    var errorMsg = errMsg || 'format is not correct';
    return {
        isValid: valid,
        err: (valid ? '' : errorMsg)
    };
}
