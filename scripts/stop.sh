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

if [ $(docker ps -a |grep nginx |awk '{print $1}') ] ; then
    echo "stop nginx ...."
    docker stop nginx
    docker rm nginx
fi
