FROM nginx:1.7.7
MAINTAINER george_chen (bamoo456@gmail.com)

COPY ./run.sh /

RUN chmod 755 /run.sh

ENTRYPOINT ["/run.sh"]
