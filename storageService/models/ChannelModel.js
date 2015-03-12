'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * host, the host of this channel
 * name, the full name of this channel ex: "bamoo456@gmail.com#test"
 * type, the type of channel,
 *     NOTE: the "public" type of channel can be searched,
 *           the "private" type of channel can not be searched
 *           
 * rtc.isAuthorized, means channel members can start rtc or not
 * drawing.boardNum, save how many draw board that are used
 * msg.sender, the latest msg sender's uid
 * msg.contents, the latest msg contents
 * msg.timestamp, the latest msg's sent time
 *
 * 
 * TODO: future support
 * 
 * isOpen, means that channel will be shown on home page or not
 * organization, the name of organization that this channel belong to 
 * isAnonymousLogin: means channel support anonymous login or not
 * anonymousPassword: an password for anonymous login user
 */

var ChannelSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    host:               {type : String, default : '', trim : true},
    name:               {type : String, default : '', trim : true},
    type:               {type : String, default : '', trim : true},
    rtc:                {
        isAuthorized:   {type : Boolean, default : true, trim : true}
    },
    drawing:            {
        boardNum:       {type : Number, default : 1, trim : true}
    },
    msg:                {
        sender:         {type : String, default : '', trim : true},
        contents:       {type : String, default : '', trim : true},
        timestamp:      {type : Date,   default : new Date(0) }
    },
    isOpen:             {type : Boolean,default : false, trim : true},
    organization:       {type : String, default : '', trim : true},
    isAnonymousLogin:   {type : Boolean, default : false, trim : true},
    anonymousPassword:  {type : String, default : '', trim : true}
});

ChannelSchema.set('autoIndex', false);

Mongoose.model('Channel', ChannelSchema);
