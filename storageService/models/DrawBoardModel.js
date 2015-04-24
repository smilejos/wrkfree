'use strict';
var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;

/**
 * channelId, the channel's id
 * boardId, the board id of this snapshot
 * baseImg, the base image data object
 * baseImg.encode, the encode of base image
 * baseImg.contentType, the content type of base image
 * baseImg.chunks, the raw data of base image
 */
var DrawBoardSchema = new Schema({
    channelId:        {type: String, default: '', trim: true, index: true},
    boardId:          {type: Number, default: 0, trim: true},
    baseImg:          {
        contentType:  String,
        encode:       String,
        chunks:       Buffer
    }
});

DrawBoardSchema.set('autoIndex', false);

Mongoose.model('DrawBoard', DrawBoardSchema);
