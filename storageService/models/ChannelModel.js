'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * name, the full name of this channel ex: "bamoo456@gmail.com#test"
 * type, the type of channel,
 *     NOTE: the "public" type of channel can be searched,
 *           the "private" type of channel can not be searched
 * 
 * TODO: future support
 * 
 * isOpen, means that channel will be shown on home page or not
 * isAnonymousLogin: means channel support anonymous login or not
 * organization, the name of organization that this channel belong to 
 * anonymousPassword: an password for anonymous login user
 */

var ChannelSchema = new Schema({
    channelId:          {type : String, default : '', trim : true, index: true},
    name:               {type : String, default : '', trim : true},
    type:               {type : String, default : '', trim : true},
    isOpen:             {type : Boolean,default : false, trim : true},
    isAnonymousLogin:   {type : Boolean,default : false, trim : true},
    organization:       {type : String, default : '', trim : true},
    anonymousPassword:  {type : String, default : '', trim : true}
});

ChannelSchema.set('autoIndex', false);

Mongoose.model('Channel', ChannelSchema);
