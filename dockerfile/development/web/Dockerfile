FROM ubuntu:14.04.2
MAINTAINER george_chen (bamoo456@gmail.com)

RUN groupadd -r wrkfree && useradd -r -g wrkfree wrkfree

#important! to ensure apt-get related command can work on docker build
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

# install modules for wrkfree app env

RUN apt-get install -y curl

RUN curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -

RUN apt-get install -y nodejs

# setup NODE_ENV for production
ENV NODE_ENV=docker_development

# web server is listen to 3000, so we expose it
EXPOSE 3000

# user should start process directly by the docker command-line
# e.g. node /workspace/wrkfree2.0/webServer/server/server.js
