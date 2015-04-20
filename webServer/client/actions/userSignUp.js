'use strict';
var Request = require('superagent');
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var CompleteSignup = require('./completeSignup');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used for handling signup submission from "SignUp.jsx"
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Function}    submitInfo.transitionHandler, the mixin handler from signup component
 * @param {Object}      submitInfo.signUpInfo, infomation for signup
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, submitInfo, callback) {
    return new Promise(function(resolve) {
        Request.post('/app/signup')
            .send(submitInfo.signUpInfo)
            .set('Content-Type', 'application/json')
            .end(resolve);
    }).then(function(res) {
        if (!res.ok) {
            throw new Error(res.text);
        }
        if (res.body.error) {
            throw new Error('operational error from server');
        }
        var successInfo = {
            user: res.body.user,
            transitionHandler: submitInfo.transitionHandler,
            nextRoute: res.body.route
        };
        return actionContext.executeAction(CompleteSignup, successInfo);
    }).catch(function(err) {
        SharedUtils.printError('SignUp', '_onSubmit', err);
    }).nodeify(callback);
};
