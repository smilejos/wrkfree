#!/bin/bash

if [ -e /workspace/wrkfree2.0/webServer/server/server.js ] ; then
    echo "start web service ... "
    NODE_ENV=production node /workspace/wrkfree2.0/webServer/server/server.js
else
    echo "server script is not exist !"
fi
