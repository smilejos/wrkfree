'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * notificationOwner, the owner uid who own this notification
 * channelId, the channel id of this channel notification
 * sender, member who send this channel notification
 * type, the type of channel notification
 *     NOTE: now support "channel", "chat", "draw" and "rtc"
 *
 * action, an action description based on notification "type"
 *     NOTE: "invitation", "request" and "response" are actions based on "channel"
 *           "send" and "off" are actions on "chat"
 *           "paint" and "off" are actions on "draw"
 *           "call" and "off" are actions on "rtc"
 *           
 * optionalInfo, some optional information based on the "type" and "action"
 *     NOTE: type="channel", action="response", will have answer of this response ('Y/N')
 *           type="chat", action="send", will have "msg contents" as extra info
 *           type="draw", action="paint", will have "color" as extra info
 *           type="rtc", action="call", will have "video/audio/screen" as extra info
 *           
 * createdTime, the timestamp which notification happen
 */
var ChannelNotificationSchema = new Schema({
    notificationOwner: {type : String, default : '', trim : true, index: true},
    channelId:         {type : String, default : '', trim : true},
    sender:            {type : String, default : '', trim : true},
    type:              {type : String, default : '', trim : true},
    action:            {type : String, default : '', trim : true},
    optionalInfo:      {type : String, default : '', trim : true},
    createdTime:       {type : Date,   default : Date.now}
});


ChannelNotificationSchema.set('autoIndex', false);

Mongoose.model('ChannelActivity', ChannelNotificationSchema);
