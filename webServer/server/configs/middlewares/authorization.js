'use strict';

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure user is logged in.
 */
exports.ensureAuthed = function(req, res, next) {
    return (req.isAuthenticated() ? next() : res.redirect('/'));
};
