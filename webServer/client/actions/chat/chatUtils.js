'use strict';
var UserService = require('../../services/userService');

exports.fillUserInfo = function(msgDoc) {
    return UserService.getInfoAsync(msgDoc.from)
        .then(function(senderInfo) {
            if (!senderInfo) {
                throw new Error('message sender is invalid');
            }
            msgDoc.nickName = senderInfo.nickName;
            msgDoc.avatar = senderInfo.avatar;
            return msgDoc;
        });
};
