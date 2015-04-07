'use strict';
var Promise = require('bluebird');

/**
 * Public API
 * @Author: George_Chen
 * @Description: the array map function implmented by for-loop
 *         NOTE: provide better performance
 *
 * @param {Array}       array, the array will be applied to map
 * @param {Function}    fn, the mapper function
 * @return              newArray, return an array after processed by mapper
 */
exports.fastArrayMap = function(array, fn) {
    var nweArray = [];
    if (this.isArray(array) || this.isFunction(fn)) {
        for (var i = 0; i < array.length; ++i) {
            nweArray[i] = fn(array[i], i, array);
        }
    }
    return nweArray;
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: 
 *
 * @param {Error}       arguments[0], the error paramter
 * @param ...           
 * @param {Function}    arguments[n-1], the callback function
 * @return {No Return}
 */
exports.execCallback = function() {
    var err = arguments[0];
    var fn = arguments[arguments.length - 1];
    if (!this.isFunction(fn)) {
        err = new Error('callback is needed');
        return this.printError('utils', 'execCallback', err);
    }
    if (err instanceof Error || err === null) {
        // use for-loop avoiding argument leak
        var args = exports.getArgs(arguments);
        var execFn = function() {
            fn.apply(this, args);
        };
        return (this.isBrowser() ? setTimeout(execFn, 0) : process.nextTick(execFn));
    }
    err = new Error('first argument must be error object');
    return this.printError('utils', 'execCallback', err);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: print the error log message
 *
 * @param {String}      fileName, the filename of caller
 * @param {String}      funcName, the function name of caller
 * @param {Error}       error, the error instance
 */
exports.printError = function(fileName, funcName, error) {
    var logPrefix = _getLogPrefix(fileName, funcName);
    if (error instanceof Error) {
        console.log(logPrefix, error);
    }
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: getting the arguments array without leaking it
 *
 * @param {Object}      rawArguments, the arguments object in function
 *
 * https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
 */
exports.getArgs = function(rawArguments) {
    var args = new Array(rawArguments.length);
    for (var i = 0; i < args.length; ++i) {
        //i is always valid index in the rawArguments object
        args[i] = rawArguments[i];
    }
    return args;
};

/************************************************
 *
 *           args checker
 *
 ************************************************/

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check current env is browser or nodejs
 */
exports.isBrowser = function() {
    return (typeof window !== 'undefined');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is boolean or not
 *
 * @param {Object}      object, the object under check
 */
exports.isBoolean = function(object) {
    return (typeof object === 'boolean');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is function or not
 *
 * @param {Object}      object, the object under check
 */
exports.isFunction = function(object) {
    return (typeof object === 'function');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is string or not
 *
 * @param {Object}      object, the object under check
 */
exports.isString = function(object) {
    return (typeof object === 'string');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is number or not
 *
 * @param {Object}      object, the object under check
 */
exports.isNumber = function(object) {
    return (typeof object === 'number');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is error or not
 *
 * @param {Object}      object, the object under check
 */
exports.isError = function(object) {
    return (object instanceof Error);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is array or not
 *
 * @param {Object}      object, the object under check
 */
exports.isArray = function(object) {
    return (object instanceof Array);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is Date or not
 *
 * @param {Object}      object, the object under check
 */
exports.isDate = function(object) {
    return (object instanceof Date);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is empty array or not
 *
 * @param {Object}      object, the object under check
 */
exports.isEmptyArray = function(object) {
    if (!this.isArray(object)) {
        throw new Error('object is not an array');
    }
    return (object.length === 0);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check whether object is valid channel type or not
 *
 * @param {Object}      object, the object under check
 */
exports.isValidChannelType = function(object) {
    return (object === 'public' || object === 'private');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check object is valid timestamp or not
 *
 * @param {Object}      object, the object under check
 */
exports.isValidTime = function(object) {
    // define 2015/1/1 to be an time threshold
    var timeMinimum = Date.parse('January 1, 2015  00:00:00');
    return (typeof object === 'number' && object > timeMinimum);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check string is normal character or not
 * NOTE: if "string" with special character like (#$%^@!&*()_+ ...) will return false
 * 
 * @param {String}      string, the string under check
 */
exports.isNormalChar = function(string) {
    if (!this.isString(string)) {
        return false;
    }
    var regx = /[\W]+/;
    return !regx.test(string);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check candidate "str" is email or not
 * 
 * @param {String}      str, the string under check
 */
exports.isEmail = function(str) {
    if (!this.isString(str)) {
        return false;
    }
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check user's nickName is valid or not
 * NOTE: nickName support 'chinese' and 'english'
 * 
 * @param {String}      nickName, user's nickName
 */
exports.isNickName = function(nickName) {
    if (!this.isString(nickName)) {
        return false;
    }
    /**
     * any nickName match follow policy:
     * english name can have following format: 'georgechen', 'george chen', 'george-chen', 'george_chen'
     * NOTE: name must start and end with "a-z, A-Z, 0-9"
     *
     * chinese name can have following format: '陳家駒'
     * NOTE: name must start and end with "中文
     *
     * combination with english and chinese name format: 'george陳', '陳george'
     * NOTE: with combination, the symbol "-", "_" and " " is not allowed
     */
    var regx = /^[a-zA-Z0-9\u4e00-\u9fa5]+([a-zA-Z0-9](_|-|\s)[a-zA-Z0-9])*[a-zA-Z0-9\u4e00-\u9fa5]+$/;
    return regx.test(nickName);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check the user avatar url is valid or not
 * NOTE: we only check avatar pattern match 'facebook' and 'google'
 * 
 * @param {String}      avatarUrl, avatar's url
 */
exports.isAvatarUrl = function(avatarUrl) {
    if (!this.isString(avatarUrl)) {
        return false;
    }
    var regex = {
        // any string start with "https://graph.facebook.com" with be consider as valid
        facebook: /^(https\:\/\/graph.facebook.com).*$/,
        // any string start with "https://lh3.googleusercontent.com" with be consider as valid
        google: /^(https\:\/\/lh3.googleusercontent.com).*$/
    };
    return (regex.facebook.test(avatarUrl) || regex.google.test(avatarUrl));
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check channel id is valid or not
 * NOTE: the format of channel id is md5 hash, so any string with
 *     md5 hash style will be set to true
 * 
 * @param {String}      channelId, channel's id
 */
exports.isChannelId = function(channelId) {
    if (!this.isString(channelId)) {
        return false;
    }
    var re = /^[0-9a-f]{32}$/;
    return re.test(channelId);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to check the id format is an valid mongodb _id or not
 *  NOTE: only strings with 24 char length 
 *          and constituted by "number" and "lower case letters"
 * 
 * @param {String/ObjectId}      id, document _id
 */
exports.isDbId = function(id) {
    var re = /^[0-9a-z]{24}$/;
    return re.test(id.toString());
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check the full channel name based on channel type
 * 
 * @param {String}      name, channel's full name
 * @param {String}      type, channel's type
 */
exports.isChannelName = function(name, type) {
    if (!this.isString(name)) {
        return false;
    }
    if (!this.isValidChannelType(type)) {
        return false;
    }
    return (type === 'public' ? _isPublicChannel(name) : _isPrivateChannel(name));
};

/**
 * @Author: George_Chen
 * @Description: get the log prefix, for debug purpose
 * NOTE: public channel name is constituted by "host uid" and "channel name"
 *       the conjunction used "#"
 * 
 * @param {String}      publicName, public channel name
 */
function _isPublicChannel(publicName) {
    var name = publicName.split('#');
    return (exports.isDbId(name[0]) && exports.isNormalChar(name[1]));
}

/**
 * @Author: George_Chen
 * @Description: to check the private channel name is valid or not
 * NOTE: private channel name is constituted by two or more "uid" , 
 *       and the conjunction between "uid" is "&"
 * 
 * @param {String}      privateName, public channel name
 */
function _isPrivateChannel(privateName) {
    var name = privateName.split('&');
    for (var i = 0; i < name.length; ++i) {
        if (!exports.isDbId(name[i])) {
            return false;
        }
    }
    return true;
}

/**
 * @Author: George_Chen
 * @Description: get the log prefix, for debug purpose
 *
 * @param {String}      fileName, the filename of caller
 * @param {String}      funcName, the function name of caller
 */
function _getLogPrefix(fileName, funcName) {
    if (exports.isString(fileName) && exports.isString(funcName)) {
        return '[' + fileName + '-' + funcName + ']';
    }
    return null;
}

/************************************************
 *
 *             promisify version
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: the promise version of args checker, 
 *
 * @param {Object}      arg, argument for check
 * @param {String}      chkType, checking type for arg
 * @param {String}      option, optional option for arg check
 */
exports.argsCheckAsync = function(arg, chkType, option) {
    return Promise.try(function() {
        switch (chkType) {
            case 'email':
                if (exports.isEmail(arg)) {
                    return arg;
                }
                throw new Error('email check error');
            case '_id':
                if (exports.isDbId(arg)) {
                    return arg;
                }
                throw new Error('_id check error');
            case 'string':
                if (exports.isString(arg)) {
                    return arg;
                }
                throw new Error('string check error');
            case 'timestamp':
                if (exports.isValidTime(arg)) {
                    return arg;
                }
                throw new Error('timestamp check error');
            case 'array':
                if (exports.isArray(arg)) {
                    return arg;
                }
                throw new Error('array check error');
            case 'alphabet':
                if (exports.isNormalChar(arg)) {
                    return arg;
                }
                throw new Error('alphabet check error');
            case 'channelId':
                if (exports.isChannelId(arg)) {
                    return arg;
                }
                throw new Error('channelId check error');
            case 'channelName':
                if (exports.isChannelName(arg, option)) {
                    return arg;
                }
                throw new Error('channel name check error');
            case 'nickName':
                if (exports.isNickName(arg)) {
                    return arg;
                }
                throw new Error('nickName check error');
            case 'avatar':
                if (exports.isAvatarUrl(arg)) {
                    return arg;
                }
                throw new Error('avatar check error');
            case 'channelType':
                if (exports.isValidChannelType(arg)) {
                    return arg;
                }
                throw new Error('channel type check error');
            case 'boolean':
                if (exports.isBoolean(arg)) {
                    return arg;
                }
                throw new Error('boolean value check error');
            default:
                throw new Error('no support args type check');
        }
    });
};
