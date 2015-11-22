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
// =============================================


function ConMsgDeliver(rmqConnection, exchangeName, routingkey, isMaster) {
    this.connection = rmqConnection;
    this.exchange = exchangeName;
    this.routingkey = routingkey;
    if (isMaster !== undefined) {
        this.isMaster = isMaster;
    }
    else
        this.isMaster = true;

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
            return ch.assertQueue("", {exclusive: true});
        });

        ok = ok.then(function(qok) {
            // queue created
            ch.bindQueue(qok.queue, that.exchange, that.routingkey, {}).then(function() {
                return qok.queue;
            });
        });

        ok = ok.then(function(queue) {
            //// consume from queue
            ch.consume(queue, function(msg) { that.consumeMsg(msg); }, {noAck: false});
        });
    });
};

ConMsgDeliver.prototype.consumeMsg = function (msg) {
    if (this.isMaster)
    {
        console.log("ACK message[" + msg.content.toString() + "]");
        this.channel.ack(msg)
    }
    else
    {
        console.log("nack msg");
        this.channel.nack(msg, true, true);
    }
}

module.exports.ConMsgDeliver = ConMsgDeliver;
module.exports.PubMsgDeliver = PubMsgDeliver;
