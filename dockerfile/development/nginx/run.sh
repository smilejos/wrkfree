#!/bin/bash

# the flag tells bash to exit if a command fails
set -e

# we need to attach worksapce container before running this 
# deployment container need to build first to make configs in /workspace/...
if [ -d /workspace/wrkfree2.0/nginxConfigs/docker_development/ ] ; then
    cp -rf /workspace/wrkfree2.0/nginxConfigs/docker_development/* /etc/nginx
    if [ -d /etc/nginx/sites-enabled/ ] ; then
        rm -r /etc/nginx/sites-enabled
    fi
    mkdir -p /etc/nginx/sites-enabled/
    ln -s  /etc/nginx/sites-available/wrkfree.conf /etc/nginx/sites-enabled/wrkfree.conf
fi

echo "daemon off;" >> /etc/nginx/nginx.conf

nginx
