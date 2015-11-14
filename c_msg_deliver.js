#!/usr/bin/env node

var amqp = require('amqplib');
var msglib = require("./msglib");

amqp.connect('amqp://rmqlink').then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });

    var c = new msglib.ConMsgDeliver(conn, 'msg', process.argv[2]);
}).then(null, console.warn);
