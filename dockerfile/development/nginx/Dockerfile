FROM nginx:1.9.5
MAINTAINER george_chen (bamoo456@gmail.com)

RUN groupadd -r wrkfree && useradd -r -g wrkfree wrkfree

COPY ./run.sh /

RUN chmod 755 /run.sh

ENTRYPOINT ["/run.sh"]
