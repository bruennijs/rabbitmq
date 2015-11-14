#!/usr/bin/env node

var amqp = require('amqplib');

function PubMsgDeliver(rmqConnection, exchangeName, routingkey) {
    this.connection = rmqConnection;
    this.exchange = exchangeName;
    this.routingkey = routingkey;
    this.Init(this.connection);
}

PubMsgDeliver.prototype.Init = function(conn) {

    var that = this;
    return conn.createChannel().then(function(ch) {

        that.channel = ch;

        console.log("Exchange[" + that.exchange + "]");

        var ok = ch.assertExchange(that.exchange, "topic", {durable: true});

        //var ok = ch.assertQueue('hello', {durable: false});

        ok = ok.then(function() {
            // exchange OK
            console.log("Exchange [" + that.exchange + "] created");
        });
    });
};

PubMsgDeliver.prototype.sendMessage = function(msg) {
    this.channel.publish(this.exchange, this.routingkey, msg, {});
}

// =============================================
function ConMsgDeliver(rmqConnection, exchangeName, routingkey) {
    this.connection = rmqConnection;
    this.exchange = exchangeName;
    this.routingkey = routingkey;
    var qok = this.Init(this.connection);
}

ConMsgDeliver.prototype.Init = function(conn) {

    var that = this;
    return conn.createChannel().then(function(ch) {

        that.channel = ch;

        console.log("Exchange[" + that.exchange + ", routingkey=" + that.routingkey + "]");
        var ok = ch.assertExchange(that.exchange, "topic", {durable: true});

        //var ok = ch.assertQueue('hello', {durable: false});

        ok = ok.then(function() {
            console.log("Exchange [" + that.exchange + "] created");

            // exchange OK
            return ch.assertQueue("", {exclusive: true, noAck: false});
        });

        ok = ok.then(function(qok) {
            // queue created
            ch.bindQueue(qok.queue, that.exchange, that.routingkey, {}).then(function() {
                return qok.queue;
            });
        });

        ok = ok.then(function(queue) {
            //// consume from queue
            ch.consume(queue, that.consumeMsg, {noAck: true});
        });
    });
};

ConMsgDeliver.prototype.consumeMsg = function (msg) {
    console.log(msg);
    this.channel.ack(msg)
}

module.exports.ConMsgDeliver = ConMsgDeliver;
module.exports.PubMsgDeliver = PubMsgDeliver;
