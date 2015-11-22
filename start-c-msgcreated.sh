#!/bin/sh

docker run --rm -w /data -v $(pwd):/data --link rmq:rmqlink  bruenni/webapp:14.04-mean node c_msg_deliver.js msg.created master
