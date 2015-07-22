FROM ubuntu:14.04.2
MAINTAINER george_chen (bamoo456@gmail.com)

#important! to ensure apt-get related command can work on docker build
ENV DEBIAN_FRONTEND noninteractive

# Install python
RUN apt-get update
RUN apt-get install -y wget python

#Install mongo-connector
RUN wget https://bootstrap.pypa.io/get-pip.py
RUN python ./get-pip.py
RUN pip install mongo-connector

# copy run script into image
COPY ./run.sh /run.sh

RUN chmod 755 /run.sh

ENTRYPOINT ["/run.sh"]
