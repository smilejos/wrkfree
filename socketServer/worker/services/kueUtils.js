'use strict';
var Promise = require('bluebird');
var Kue = require('kue');
var SharedUtils = require('../../../sharedUtils/utils');
var GetJobAsync = Promise.promisify(Kue.Job.get);

/**
 * setup queue environment
 */
var Configs = require('../../../configs/config');
var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}
var Queue = Kue.createQueue({
    jobEvents: false,
    redis: {
        host: DbConfigs.cacheEnv.global.host,
        port: DbConfigs.cacheEnv.global.port,
        options: DbConfigs.cacheEnv.global.options,
        db: 2,
    }
});

/**
 * @Author: George_Chen
 * @Description: for getting kue singleton instance
 */
exports.getKue = function() {
    return Queue;
};

/**
 * @Author: George_Chen
 * @Description: to remove completed or failed job from kue
 *
 * @param {Number}          jobId, the kue's job id
 */
exports.delKueJobAsync = function(jobId) {
    return GetJobAsync(jobId)
        .then(function(job) {
            job.remove(function(err) {
                if (err) throw err;
            });
        });
};

Queue.on('job complete', function(id) {
    return exports.delKueJobAsync(id)
        .catch(function(err) {
            SharedUtils.printError('kueUtils.js', 'Queue-jobComplete', err);
        });
}).on('job failed', function(id, failReason) {
    SharedUtils.printError('kueUtils.js', 'Queue-failed', new Error(failReason));
    return exports.delKueJobAsync(id)
        .catch(function(err) {
            SharedUtils.printError('kueUtils.js', 'Queue-failed', err);
        });
});
