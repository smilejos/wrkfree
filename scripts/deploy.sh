#!/bin/bash

# pull code and build 
if [ $1 ] ; then
    docker run --rm --volumes-from workspace --name deployment -v /home/deploy/.ssh:/root/.ssh/ wrkfree/deploy /build.sh $1
else 
    # default will pull and build master branch
    docker run --rm --volumes-from workspace --name deployment -v /home/deploy/.ssh:/root/.ssh/ wrkfree/deploy /build.sh
fi
