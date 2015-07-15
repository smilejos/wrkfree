'use strict';
var SharedUtils = require('./utils');
var LogEngine = null;
var Loggers = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to init log engine from logs.json, any process must
 *               init before use
 *         NOTE: only nodejs process need to init
 *
 * @param {Object}      configs, configs in logs.json
 */
exports.init = function(configs) {
    if (!LogEngine && typeof window === 'undefined') {
        var categories = Object.keys(configs);
        LogEngine = require('bunyan');
        var settings = null;
        SharedUtils.fastArrayMap(categories, function(category) {
            settings = configs[category].settings;
            Loggers[category] = LogEngine.createLogger({
                name: category,
                streams: SharedUtils.fastArrayMap(settings, function(info) {
                    return _setLogStream(info);
                })
            });
        });
    }
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to log message with "DEBUG" type
 *
 * @param {String}      category, logger category
 * @param {Object}      meta, meta data of this log
 * @param {String}      msg, log message
 */
exports.debug = function(category, meta, msg) {
    var logger = _getLogger(category);
    // if category is not defined, the original "console" module not support ".debug"
    // so we must transform to another log module -> logger.info
    return (logger.debug ? logger.debug(meta, msg) : logger.info(meta, msg));
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to log message with "INFO" type
 *
 * @param {String}      category, logger category
 * @param {Object}      meta, meta data of this log
 * @param {String}      msg, log message
 */
exports.info = function(category, meta, msg) {
    var logger = _getLogger(category);
    return logger.info(meta, msg);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to log message with "WARN" type
 *
 * @param {String}      category, logger category
 * @param {Object}      meta, meta data of this log
 * @param {String}      msg, log message
 */
exports.warn = function(category, meta, msg) {
    var logger = _getLogger(category);
    return logger.warn(meta, msg);
};

/**
 * @Author: George_Chen
 * @Description: to log message with "ERROR" type
 *
 * @param {String}      category, logger category
 * @param {Object}      meta, meta data of this log
 * @param {String}      msg, log message
 */
exports.error = function(category, meta, msg) {
    var logger = _getLogger(category);
    return logger.error(meta, msg);
};


/**
 * @Author: George_Chen
 * @Description: to get the logger on current category
 *
 * @param {String}      category, logger category
 */
function _getLogger(category) {
    var logger = Loggers[category];
    if (!logger) {
        console.log('logger category:', category, ' is not defined for used: ');
        return console;
    }
    return logger;
}

/**
 * @Author: George_Chen
 * @Description: set the log stream based on configs info
 *
 * @param {Object}      info, logger stream info
 */
function _setLogStream(info) {
    if (info.type === 'console') {
        return {
            level: info.level,
            stream: process.stdout
        };
    }
    return info;
}
