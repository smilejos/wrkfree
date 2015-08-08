#!/bin/bash

# stop current services
if [ $(docker ps -a |grep web |awk '{print $1}') ] ; then
    echo "stop web service ...."
    docker stop web
    docker rm web
fi

if [ $(docker ps -a |grep ws |awk '{print $1}') ] ; then
    echo "stop socket service ...."
    docker stop ws
    docker rm ws
fi

# start new web and socket service
echo "start web service ... "
docker run -d --name web  --link search:search --link db:db --link cache:cache --volumes-from workspace wrkfree/web node /workspace/wrkfree2.0/webServer/server/server.js

echo "start socket service ... "
docker run -d --name ws --link search:search --link db:db --link cache:cache --volumes-from workspace wrkfree/ws node /workspace/wrkfree2.0/socketServer/server.js

# re-deploy nginx service
if [ $(docker ps -a |grep nginx |awk '{print $1}') ] ; then
    echo "stop nginx ...."
    docker stop nginx
    docker rm nginx
fi

echo "start nginx ... "
docker run --name nginx --volumes-from workspace --link web:web --link ws:ws -d -p 80:80 -p 443:443 wrkfree/nginx
