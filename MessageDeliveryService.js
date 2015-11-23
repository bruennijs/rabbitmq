#!/usr/bin/env node

var amqp = require('amqplib');
var msgDelivery = require("./RabbitMqMessageDelivery");
var msgDeliveryStatus = require("./RabbitMqMessageDeliveryStatus");

amqp.connect('amqp://rmqlink').then(function(conn) {
    process.once('SIGINT', function() { conn.close(); });

    var delivery = new msgDelivery.RabbitMqMessageDelivery(conn);
    var deliveryStatus = new msgDeliveryStatus.RabbitMqMessageDeliveryStatus(conn);

    console.log("Initializing...");

    var initAllOk = Promise.all([delivery.InitConsumer(), deliveryStatus.InitProducer()]);

    initAllOk.then(function () {
        delivery.Subscribe(function(data) {
            console.log("Message received[" + data.toString() + "]");

            //// send message status
            deliveryStatus.PublishDeliveredEvent(new Buffer("delivered"));

            return true;    //// always ack received message
        });

        console.log("Listening on queue...");
    });
});
