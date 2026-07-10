#!/bin/bash
# check if /usr/bin/makedb is missing
if [ ! -f /usr/bin/makedb ]; then
    echo "makedb is missing, installing it..."
    apt-get update && apt-get install -y libnss-db
fi