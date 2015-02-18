var Promise = require('bluebird');

module.exports = {
    execCallback: function () {
        var err = arguments[0];
        var fn = arguments[arguments.length - 1];
        if (!this.isFunction(fn)) {
            return new Error('[execCallback] callback is needed');
        }
        if (err) {
            if (err instanceof Error) {
                console.log('[execCallback] ', err);
            } else {
                return console.log(new Error('[execCallback] not the node style callback'));
            }
        }
        // use for-loop avoiding argument leak
        var args = [];
        for (var i = 0; i < arguments.length - 1; ++i) {
            args.push(arguments[i]);
        }
        return setTimeout(function(){
            fn.apply(this, args);
        }, 0);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: getting the arguments array without leaking it
     *
     * @param {Object}      rawArguments, the arguments object in function
     * 
     * https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
     */
    getArgs: function(rawArguments){
        var args = new Array(rawArguments.length);
        for(var i = 0; i < args.length; ++i) {
                    //i is always valid index in the rawArguments object
            args[i] = rawArguments[i];
        }
        return args;
    },

    isBoolean: function(object) {
        return (typeof object === 'boolean');
    },

    isFunction: function(object) {
        return (typeof object === 'function');
    },

    isString: function(object) {
        return (typeof object === 'string');
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: initialize the msg model
     *
     * @param {Object}      object, the object under check
     */
    isValidTime: function(object) {
        // define 2015/1/1 to be an time threshold
        var timeString = 'January 1, 2015  00:00:00';
        var timeMinimum = new Date(timeString).getTime();
        return (typeof object === 'number' && object > timeMinimum);
    },

    isArray: function(object) {
        return (object instanceof Array);
    },

    isNumber: function (object) {
        return (typeof object === 'number');
    },

    isError: function (object) {
        return (object instanceof Error);
    },

    isNormalChar: function(string) {
        if (!this.isString(string)) {
            return false;
        }
        var regx = /[\W]+/;
        return !regx.test(string);
    },

    isEmail: function (email) {
        if (!this.isString(email)) {
            return false;
        }
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },

    isChannelId: function (channelId) {
        if (!this.isString(channelId)) {
            return false;
        }
        var re = /^[0-9a-f]{32}$/;
        return re.test(channelId);
    },

    isChannelName: function(channelName) {
        if (this.isString(channelName)) {
            if (channelName.search('#') !== -1) {
                return this._isPublicChannel(channelName);
            } else if (channelName.search('&') !== -1) {
                return this._isPrivateChannel(channelName);
            }
        }
        return false;
    },

    _isPublicChannel: function(publicName) {
        var name = publicName.split('#');
        return (this.isEmail(name[0]) && this.isNormalChar(name[1]));
    },

    _isPrivateChannel: function(privateName) {
        var name = privateName.split('&');
        return (this.isEmail(name[0]) && this.isEmail(name[1]));
    },
    // an promisify version of args check
    // return the input arg while this arg pass the check
    argsCheckAsync: Promise.method(function(arg, chkType){
        switch(chkType) {
            case 'uid':
                if (this.isEmail(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] uid check error');
            case 'string':
                if (this.isString(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] string check error');
            case 'timestamp':
                if (this.isValidTime(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] timestamp check error');
            case 'array':
                if (this.isArray(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] array check error');
            case 'alphabet':
                if (this.isNormalChar(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] alphabet check error');
            case 'channelId':
                if (this.isChannelId(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] channelId check error');
            case 'channelName':
                if (this.isChannelName(arg)) {
                    return arg;
                }
                throw new Error('[argsCheckAsync] channel name check error');
            default:
                throw new Error('[argsCheckAsync] no support args type check');
        }
    })
};
