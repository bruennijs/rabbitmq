#!/usr/bin/env node

var amqp = require('amqplib');
var msglib = require("./msglib");

amqp.connect('amqp://rmqlink').then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });

    return new msglib.ConMsgDeliver(conn, 'msg', process.argv[2], process.argv[3] === "master");
}).then(function(instance) {
    console.log("Listening on queue...");
});
