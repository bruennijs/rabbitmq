#!/usr/bin/env node

var amqp = require('amqplib');
var msgDelivery = require("./RabbitMqMessageDelivery");
var msgDeliveryStatus = require("./RabbitMqMessageDeliveryStatus");

amqp.connect('amqp://rmqlink').then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });

    console.log("node=" + process.argv[2]);

    var delivery = new msgDelivery.RabbitMqMessageDelivery(conn);
    var deliveryStatus = new msgDeliveryStatus.RabbitMqMessageDeliveryStatus(conn);

    console.log("Initializing...");

    var initAllOk = Promise.all([deliveryStatus.InitConsumer(), delivery.InitProducer()]);

    initAllOk.then(function () {

        deliveryStatus.Subscribe(function(data) {
            console.log("Status event received[" + data.toString() + "]");
            return process.argv[2] === "master";    //// ack only when we are master node
        }, false);
    });

    console.log("Publish message to queue...");

    //// deliver message for delivery
    delivery.Deliver(new Buffer(JSON.stringify({data: process.argv[3]})));
});
