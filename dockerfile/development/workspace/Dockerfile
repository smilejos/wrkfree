FROM ubuntu:14.04.2
MAINTAINER george_chen (bamoo456@gmail.com)

RUN groupadd -r wrkfree && useradd -r -g wrkfree wrkfree

#important! to ensure apt-get related command can work on docker build
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

# install modules for wrkfree app env

RUN apt-get install -y curl

RUN curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -

RUN apt-get install -y \
        nodejs \
        python \
        pkg-config \
        libcairo2-dev \
        libjpeg8-dev \
        libpango1.0-dev \
        libgif-dev \
        build-essential \
        g++ \
        ruby-compass \
        git \
        vim

# install gulp as global module
RUN npm install gulp -g

WORKDIR /workspace
