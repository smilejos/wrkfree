FROM ubuntu:14.04.2
MAINTAINER george_chen (bamoo456@gmail.com)

# Add 10gen official apt source to the sources list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list


# Install MongoDB
RUN apt-get update
RUN apt-get install -y mongodb-org

EXPOSE 27017
ENTRYPOINT ["usr/bin/mongod"]
