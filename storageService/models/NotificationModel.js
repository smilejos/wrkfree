'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * _id, we use string as our docuement _id
 * target, the target user's uid
 * sender, the sender's uid
 * type, the type of request
 * extraInfo, the extra information of this notification (channel id  or ...)
 * updatedTime, the latest updated time
 */
var NotificationSchema = new Schema({
    _id:                {type : String, default : '', trim : true, index: true}, 
    sender:             {type : String, default : '', trim : true, index: true},
    target:             {type : String, default : '', trim : true, index: true},
    content:            {type : String, default : '', trim : true},
    type:               {type : String, default : '', trim : true},
    extraInfo:          {type : String, default : '', trim : true},
    updatedTime:        {type : Date, default : Date.now }
});

NotificationSchema.set('autoIndex', false);

Mongoose.model('Notification', NotificationSchema);
