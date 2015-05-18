'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * _id, the channel's id
 * host, the host uid,
 * name, the name of channel
 * is1on1, to indicate channel is 1on1 or not
 * isPublic, to indicate the channel can be searched or not
 * 
 * TODO: future support
 * isOpen, means that channel will be shown on home page or not
 * isAnonymousLogin: means channel support anonymous login or not
 * organization, the name of organization that this channel belong to 
 * anonymousPassword: an password for anonymous login user
 */

var ChannelSchema = new Schema({
    _id:                {type : String, default : '', trim : true, index: true},
    host:               {type : String, default : '', trim : true, index: true},
    name:               {type : String, default : '', trim : true, index: true},
    is1on1:             {type : Boolean,default : false, index: true},
    isPublic:           {type : Boolean,default : true, index: true},
    isOpen:             {type : Boolean,default : false},
    isAnonymousLogin:   {type : Boolean,default : false},
    organization:       {type : String, default : '', trim : true},
    anonymousPassword:  {type : String, default : '', trim : true},
});

ChannelSchema.set('autoIndex', false);

Mongoose.model('Channel', ChannelSchema);
