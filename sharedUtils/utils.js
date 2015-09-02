'use strict';
var Promise = require('bluebird');
var CryptoUtils = require('./cryptoUtils');
var GLOBAL_MAXIMUM_DRAW_BOARD_NUM = 10;

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
    if (this.isArray(array) && this.isFunction(fn)) {
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
 * @Description: for handling executed result of functions
 *
 * @param {Object}      result, the executed result
 * @param {String}      failMsg, the error message if result is null
 */
exports.checkExecuteResult = function(result, failMsg) {
    var errMsg = failMsg || 'operation fail';
    if (result === null) {
        throw new Error(errMsg);
    }
    return result;
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to count the bytes of candidate string
 *
 * @param {String}      str, the candidate string
 */
exports.stringToBytes = function(str) {
    var len = 0;
    var symbol;
    for (var i = 0; i < str.length; ++i) {
        symbol = str.charCodeAt(i);
        while (symbol > 0) {
            ++len;
            // right shift 1 bytes (8 bits)
            symbol = symbol >> 8;
        }
    }
    return len;
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

/**
 * @Public API
 * @Author: George_Chen
 * @Description: generate formatted host string for 1on1 channel
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.get1on1ChannelHost = function(user1, user2) {
    return [user1, user2].sort().join('&');
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: generate 1on1 channel id
 *
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.get1on1ChannelId = function(user1, user2) {
    var str = exports.get1on1ChannelHost(user1, user2);
    return CryptoUtils.getMd5Hex(str);
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to set the formatted time period object
 *
 * @param {Number}      period.start, the start timestamp of this period
 * @param {Number}      period.end, the end timestamp of this period
 */
exports.setQueryPeriod = function(period) {
    var queryPeriod = {};
    if (!period) {
        return queryPeriod;
    }
    if (period.start && this.isNumber(period.start)) {
        queryPeriod.start = period.start;
    }
    if (period.end && this.isNumber(period.end)) {
        queryPeriod.end = period.end;
    }
    return queryPeriod;
};

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: to format datetime display string
 *
 * @param {Date}      Javascript DateTime
 * @param {String}    format, please refer to below info  
 * @param {String}    options  
 *
 * @param {String} a date object into a string value.
 *  The format can be combinations of the following:
 *  a - Ante meridiem and post meridiem
 *  d  - day of month (no leading zero)
 *  dd - day of month (two digit)
 *  o  - day of year (no leading zeros)
 *  oo - day of year (three digit)
 *  D  - day name short
 *  DD - day name long
 *  g  - 12-hour hour format of day (no leading zero)
 *  gg - 12-hour hour format of day (two digit)
 *  h  - 24-hour hour format of day (no leading zero)
 *  hh - 24-hour hour format of day (two digit)
 *  u  - millisecond of second (no leading zeros)
 *  uu - millisecond of second (three digit)
 *  i  - minute of hour (no leading zero)
 *  ii - minute of hour (two digit)
 *  m  - month of year (no leading zero)
 *  mm - month of year (two digit)
 *  M  - month name short
 *  MM - month name long
 *  S  - ordinal suffix for the previous unit
 *  s  - second of minute (no leading zero)
 *  ss - second of minute (two digit)
 *  y  - year (two digit)
 *  yy - year (four digit)
 *  @  - Unix timestamp (ms since 01/01/1970)
 *  !  - Windows ticks (100ns since 01/01/0001)
 *  '...' - literal text
 *  '' - single quote
 *
 *  @param {String}  options          
 *  ampmNames        string[2] - am/pm (optional)
 *  dayNamesShort    string[7] - abbreviated names of the days
 *                               from Sunday (optional)
 *  dayNames         string[7] - names of the days from Sunday (optional)
 *  monthNamesShort  string[12] - abbreviated names of the months
 *                                (optional)
 *  monthNames       string[12] - names of the months (optional)
 *  getSuffix        function(num) - accepts a number and returns
 *                                   its suffix
 *  attribute        string - Attribute which stores datetime, defaults
 *                            to data-datetime, only valid when called
 *                            on dom element(s). If not present,
 *                            uses text.
 *  formatAttribute  string - Attribute which stores the format, defaults
 *                            to data-dateformat.
 *  utc              bool - render dates using UTC instead of local time
 */
exports.formatDateTime = function(date, format, options)
{
    var settings = {
        monthNames: ['January','February','March','April','May','June',
                     'July','August','September','October','November',
                     'December'],
        monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                   'Friday', 'Saturday'],
        dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        ampmNames: ['AM', 'PM'],
        getSuffix: function (num) {
            if (num > 3 && num < 21) {
                return 'th';
            }

            switch (num % 10) {
            case 1:  return "st";
            case 2:  return "nd";
            case 3:  return "rd";
            default: return "th";
            }
        },
        attribute: 'data-datetime',
        formatAttribute: 'data-dateformat',
        utc: false
    };

    if (options){
        for (var attrname in options) { 
            settings[attrname] = options[attrname]; 
        }    
    }

    var ticksTo1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4)
                        - Math.floor(1970 / 100)
                        + Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);
    var output = '';
    var literal = false;
    var iFormat = 0;

    // Check whether a format character is doubled
    var lookAhead = function(match) {
        var matches = (iFormat + 1 < format.length
                       && format.charAt(iFormat + 1) == match);
        if (matches) {
            iFormat++;
        }
        return matches;
    };

    // Format a number, with leading zero if necessary
    var formatNumber = function(match, value, len) {
        var num = '' + value;
        if (lookAhead(match)) {
            while (num.length < len) {
                num = '0' + num;
            }
        }
        return num;
    };

    // Format a name, short or long as requested
    var formatName = function(match, value, shortNames, longNames) {
        return (lookAhead(match) ? longNames[value] : shortNames[value]);
    };

    // Get the value for the supplied unit, e.g. year for y
    var getUnitValue = function(unit) {
        var utc = settings.utc;
        switch (unit) {
        case 'y': return utc ? date.getUTCFullYear() : date.getFullYear();
        case 'm': return (utc ? date.getUTCMonth() : date.getMonth()) + 1;
        case 'M': return utc ? date.getUTCMonth() : date.getMonth();
        case 'd': return utc ? date.getUTCDate() : date.getDate();
        case 'D': return utc ? date.getUTCDay() : date.getDay();
        case 'g':
            return (utc ? date.getUTCHours() : date.getHours()) % 12 || 12;
        case 'h': return utc ? date.getUTCHours() : date.getHours();
        case 'i': return utc ? date.getUTCMinutes() : date.getMinutes();
        case 's': return utc ? date.getUTCSeconds() : date.getSeconds();
        case 'u':
            return utc ? date.getUTCMilliseconds() : date.getMilliseconds();
        default: return '';
        }
    };

    for (iFormat = 0; iFormat < format.length; iFormat++) {
        if (literal) {
            if (format.charAt(iFormat) == "'" && !lookAhead("'")) {
                literal = false;
            }
            else {
                output += format.charAt(iFormat);
            }
        } else {
            switch (format.charAt(iFormat)) {
            case 'a':
                output += getUnitValue('h') < 12
                    ? settings.ampmNames[0]
                    : settings.ampmNames[1];
                break;
            case 'd':
                output += formatNumber('d', getUnitValue('d'), 2);
                break;
            case 'S':
                var v = getUnitValue(iFormat && format.charAt(iFormat-1));
                output += (v && (settings.getSuffix || $.noop)(v)) || '';
                break;
            case 'D':
                output += formatName('D',
                                     getUnitValue('D'),
                                     settings.dayNamesShort,
                                     settings.dayNames);
                break;
            case 'o':
                var end = new Date(date.getFullYear(),
                                   date.getMonth(),
                                   date.getDate()).getTime();
                var start = new Date(date.getFullYear(), 0, 0).getTime();
                output += formatNumber(
                    'o', Math.round((end - start) / 86400000), 3);
                break;
            case 'g':
                output += formatNumber('g', getUnitValue('g'), 2);
                break;
            case 'h':
                output += formatNumber('h', getUnitValue('h'), 2);
                break;
            case 'u':
                output += formatNumber('u', getUnitValue('u'), 3);
                break;
            case 'i':
                output += formatNumber('i', getUnitValue('i'), 2);
                break;
            case 'm':
                output += formatNumber('m', getUnitValue('m'), 2);
                break;
            case 'M':
                output += formatName('M',
                                     getUnitValue('M'),
                                     settings.monthNamesShort,
                                     settings.monthNames);
                break;
            case 's':
                output += formatNumber('s', getUnitValue('s'), 2);
                break;
            case 'y':
                output += (lookAhead('y')
                           ? getUnitValue('y')
                           : ('' + getUnitValue('y')).substr(2));
                break;
            case '@':
                output += date.getTime();
                break;
            case '!':
                output += date.getTime() * 10000 + ticksTo1970;
                break;
            case "'":
                if (lookAhead("'")) {
                    output += "'";
                } else {
                    literal = true;
                }
                break;
            default:
                output += format.charAt(iFormat);
            }
        }
    }
    return output;
}

/************************************************
 *
 *           args checker
 *
 ************************************************/

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: to check first date and senond date is same or not
 */
exports.isSameDate = function(baseDate, compareDate) {
    return (baseDate.getDate() == compareDate.getDate() 
        && baseDate.getMonth() == compareDate.getMonth()
        && baseDate.getFullYear() == compareDate.getFullYear())
};

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

exports.isBuffer = function(object) {
    return (object instanceof Buffer);
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
        google: /^(https\:\/\/.+\.googleusercontent\.com).+/
    };
    return (regex.facebook.test(avatarUrl) || regex.google.test(avatarUrl));
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to check string is valid md5 hex or not
 * 
 * @param {String}      string, hex string
 */
exports.isMd5Hex = function(string) {
    if (!this.isString(string)) {
        return false;
    }
    var re = /^[0-9a-f]{32}$/;
    return re.test(string);
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
 * @Description: to check the channel name is valid or not
 *         NOTE: any char in name should be: english, number, chinese or "-" and "_"
 * 
 * @param {String}      name, channel's full name
 */
exports.isChannelName = function(name) {
    if (!this.isString(name)) {
        return false;
    }
    var regx = /^[\u4e00-\u9fa5a-zA-Z0-9\-\_]+$/;
    return regx.test(name);
};

exports.isDrawBoardId = function(boardId) {
    if (!this.isNumber(boardId)) {
        return false;
    }
    return (boardId >= 0 && boardId < GLOBAL_MAXIMUM_DRAW_BOARD_NUM);
};

/**
 * TODO: implement check functions for each mode
 * @Author: George_Chen
 * @Description: to check draw options is valid or not
 * 
 * @param {Object}      options, draw options
 */
exports.isDrawOptions = function(options) {
    if (!options) {
        return false;
    }
    switch (options.mode) {
        case 'pen':
        case 'eraser':
        case 'text':
        case 'rect':
        case 'circle':
            return true;
        default:
            return false;
    }
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
    return (exports.isMd5Hex(name[0]) && exports.isNormalChar(name[1]));
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
        if (!exports.isMd5Hex(name[i])) {
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
            case 'md5':
                if (exports.isMd5Hex(arg)) {
                    return arg;
                }
                throw new Error('md5 check error');
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
            case 'number':
                if (exports.isNumber(arg)) {
                    return arg;
                }
                throw new Error('number check error');
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
            case 'boardId':
                if (exports.isDrawBoardId(arg)) {
                    return arg;
                }
                throw new Error('draw boardId check error');
            case 'buffer':
                if (exports.isBuffer(arg)) {
                    return arg;
                }
                throw new Error('buffer check error');
            case 'drawOptions':
                if (exports.isDrawOptions(arg)) {
                    return arg;
                }
                throw new Error('draw options check error');
            default:
                throw new Error('no support args type check');
        }
    });
};
