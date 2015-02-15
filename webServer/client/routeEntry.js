

exports.getDashboard = function(routeInfo, callback){
    console.log('[routesHandler]  client Routes get dashboard', routeInfo);
    setTimeout(function(){
        callback();
    }, 100);
}


exports.getChannel = function(routeInfo, callback){
    console.log('[routesHandler]  client Routes get channel');
}
