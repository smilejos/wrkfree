FROM ubuntu:14.04.2
MAINTAINER george_chen (bamoo456@gmail.com)

RUN groupadd -r wrkfree && useradd -r -g wrkfree wrkfree

#important! to ensure apt-get related command can work on docker build
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update

# install modules for wrkfree app env
RUN apt-get install -y gcc mono-mcs libssl-dev wget make

RUN mkdir -p /data && chown -R wrkfree:wrkfree /data

WORKDIR /data

# install dependency module
RUN wget https://github.com/downloads/libevent/libevent/libevent-2.0.21-stable.tar.gz

RUN tar xzf libevent-2.0.21-stable.tar.gz; cd libevent-2.0.21-stable/; ./configure ; make; make install; cd ../

# install rfc-5766-turn-server.
RUN wget http://http.debian.net/debian/pool/main/c/coturn/coturn_4.2.1.2.orig.tar.gz

RUN tar xzf coturn_4.2.1.2.orig.tar.gz; cd turnserver-4.2.1.2/; ./configure; make ; make install

# add default turnserver user
RUN turnadmin -a -u wrkfree -r wrkfree.com -p user@wrkfree

EXPOSE 3478

CMD ["turnserver", "-a", "-v", "-u", "--db=/data/turnuserdb.conf", "-f", "-r", "wrkfree.com"]
