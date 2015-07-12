#!/bin/bash

if [ -e /workspace/ ] ; then
    echo "start build procedure ... "
    cd /workspace/
    rm -r wrkfree2.0/
    git clone git@github.com:wrkfree-co/wrkfree2.0.git
    cd /workspace/wrkfree2.0/

    # to check target branch has assign or not
    if [ $1 ] ; then
        git checkout --track origin/$1
    fi

    # install and build dependency modules
    ./npm-install.sh
else
    echo "currently not connect to workspace container !"
fi
