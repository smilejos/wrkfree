#!/bin/bash

# run mongo-connector
mongo-connector -m db:27017 -t search:9200 -d elastic_doc_manager
