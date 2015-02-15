

exports.getDashboard = function(routeInfo, callback){
    console.log('[routesHandler]  server Routes get dashboard', routeInfo);
    setTimeout(function(){
        callback();
    }, 100);
}


exports.getChannel = function(routeInfo, callback){
    console.log('[routesHandler]  server Routes get channel');
}
