FROM busybox:latest
MAINTAINER george_chen (bamoo456@gmail.com)

RUN groupadd -r wrkfree && useradd -r -g wrkfree wrkfree

# Create the MongoDB data directory
RUN mkdir -p /data/db
