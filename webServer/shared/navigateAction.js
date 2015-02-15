module.exports = function (actionContext, payload, done) {
    var info = actionContext.getRouteInfo();
    actionContext.getRouteResource('/dashboard', info, function(){
        console.log('[navigate] get the route resource back');
    });

    actionContext.dispatch('CHANGE_ROUTE', payload);
    done();
};