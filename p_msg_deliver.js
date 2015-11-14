#!/usr/bin/env node

var amqp = require('amqplib');
var msglib = require("./msglib");

var ok = amqp.connect('amqp://rmqlink').then(function(conn) {
    //process.stdout.write("OKI DO");
    process.once('SIGINT', function() { conn.close(); });

    return new msglib.PubMsgDeliver(conn, "msg", process.argv[2]);
})

ok.then(function(pub) {
    console.log("Enter message:")
    process.stdin.on("readable", function() {
        var data = process.stdin.read();
        if (data !== null) {
            if (data === "q")
            {
                process.exit(0);
            }

            console.log("Sending[" + data + "]");
            pub.sendMessage(data);
        }
    });
});
