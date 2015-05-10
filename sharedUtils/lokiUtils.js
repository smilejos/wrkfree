'use strict';

/**
 * Publis API
 * @Author: George_Chen
 * @Description: to search result on lokijs dynamic view
 *         NOTE: sort object is like
 *               {
 *                   field: 'drawTime',
 *                   isDesc: false
 *               }
 * @param {Object}      view, lokijs dynamic view
 * @param {Object}      condition, lokijs query condition
 * @param {Number}      sort, the sort object
 * @param {Number}      limitNum, the number of msgs will be query
 */
exports.searchOnView = function(view, condition, sort, limitNum) {
    var number = 0 || limitNum;
    var sortField = '$loki';
    var isDesc = false;
    if (sort) {
        sortField = sort.field || sortField;
        isDesc = sort.isDesc || isDesc;
    }
    return view
        .resultset
        .copy()
        .find(condition)
        .simplesort(sortField, isDesc)
        .limit(number);
};
