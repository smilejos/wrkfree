'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * _id, we use string as our docuement _id
 * target, the target user's uid
 * sender, the sender's uid
 * type, the type of request
 * extraInfo, the extra information of this request/response
 * isReq, to indicate this is request or response
 * isReaded, to indicate that this document is readed or not
 * respToPermitted, for response only, to indicate the response answser
 * updatedTime, the latest updated time
 */
var ReqResp = new Schema({
    _id:               {type : String, default : '', trim : true, index: true}, 
    target:            {type : String, default : '', trim : true, index: true},
    sender:            {type : String, default : '', trim : true, index: true},
    type:              {type : String, default : '', trim : true},
    extraInfo:         {type : String, default : '', trim : true},
    isReq:             {type : Boolean, default : true},
    isReaded:          {type : Boolean, default : false},
    respToPermitted:   {type : Boolean, default : false},
    updatedTime:       {type : Date, default: Date.now}
});

ReqResp.set('autoIndex', false);

Mongoose.model('ReqResp', ReqResp);
