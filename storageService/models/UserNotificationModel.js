'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * NotificationOwner, the owner uid who own this notification
 * sender, user who send this channel notification
 * type, the type of user notification
 *     NOTE: now support "friend" and "notify"
 *     
 * action, an action description based on notification "type"
 *     NOTE: "request" and "response" are actions based on "friend"
 *           "newChannel", "enterChannel" and "newFriend" are actions on "notify"
 *           
 * optionalInfo, some optional information based on the "type" and "action"
 *     NOTE: type="freind", action="response", will have answer of this response ('Y/N')
 *           type="notify", action="enterChannel", will have "channelId" as extra info
 *           type="notify", action="newChannel", will have "channelId" as extra info
 *           type="notify", action="newFriend", will have "newFriend Uid" as extra info
 *           
 * createdTime, the timestamp which notification happen
 */
var UserNotificationSchema = new Schema({
    notificationOwner: {type : String, default : '', trim : true, index: true},
    sender:            {type : String, default : '', trim : true},
    type:              {type : String, default : '', trim : true},
    action:            {type : String, default : '', trim : true},
    optionalInfo:      {type : String, default : '', trim : true},
    createdTime:       {type : Date,   default : Date.now}
});


UserNotificationSchema.set('autoIndex', false);

Mongoose.model('UserNotification', UserNotificationSchema);
