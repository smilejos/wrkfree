FROM nginx:1.9.5
MAINTAINER george_chen (bamoo456@gmail.com)

COPY ./run.sh /

RUN chmod 755 /run.sh

ENTRYPOINT ["/run.sh"]
