/**
 * Created by bruenni on 22.11.15.
 */

/// <reference path="typings/tsd.d.ts" />

import {Connection} from "amqplib";
import {Promise} from "when";
import {Channel} from "amqplib";
import {Replies, Options} from "amqplib/properties";
import {Message} from "amqplib/properties";

export class RabbitMqMessageDelivery {
    private _con:Connection;
    private _exchange:string = "msg";
    private _queue:string = "";
    private _routingKey:string = "msg.deliver";
    private _exchangeType: string = "topic"

    constructor(con: Connection) {
        this._con = con;
    }

    /**
     * Inits the rabbitmq infrastructure to consume with an exclusive queue
     * to an topic exchange listening to a specific routing key.
     * @returns {Promise<boolean>}
     * @constructor
     */
    InitConsumer(): Promise<boolean> {
        var that = this;
        var channel = null;

        // assert exchange
        var ok = this._con.createChannel().then(function (newChannel: Channel) {
            // create exchange
            channel = newChannel;
            return that.createExchange(newChannel);
        });

        var okQueue = ok.then(function(ret: Replies.AssertExchange) {
            return channel.assertQueue("", {exclusive: true});
        });

        var okBinding = okQueue.then(function (ret: Replies.AssertQueue) {
            that._queue = ret.queue;
            //init binding
            return channel.bindQueue(ret.queue, that._exchange, that._routingKey, {});
        });

        return okBinding.then(function (ret: Replies.Empty) {
            return true;
        });
    }

    /**
     * Asserts topic exchange
     * @returns {Promise<boolean>}
     * @constructor
     */
    InitProducer(): Promise<boolean> {
        var that = this;
        var channel = null;

        // assert exchange
        var ok = this._con.createChannel().then(function (newChannel: Channel) {
            // create exchange
            channel = newChannel;
            return that.createExchange(newChannel);
        });

        return ok.then(function (ret: Replies.AssertExchange) {
            return true;
        });
    }

    /**
     * Creates exchange
     * @param channel
     * @returns {when.Promise<Replies.AssertExchange>}
     */
    private createExchange(channel: Channel): Promise<Replies.AssertExchange> {
        var that = this;
        return channel.assertExchange(that._exchange, that._exchangeType, {durable: false});
    };

    /**
     * Deliver a message by topic echange to multiple consumers for delivery.
     * @param msg to be delivered
     * @constructor
     */
    Deliver(data: Buffer): Promise<boolean> {
        var that = this;

        // 1) deliver message

        return this._con.createChannel().then(function(newChannel: Channel) {
            //// send message
            return newChannel.publish(that._exchange, that._routingKey, data, {});
        });
    }

    /**
     * Subscribes for message deliver events.
     * ack: If true messages must be acked whether they are processed or not
     * onMessage: Function called on each message receive. Return value is value of ack. If false nack is sent.
     */
    Subscribe(onMessage: (msg: Buffer) => boolean, noAck?: boolean): void {
        var that = this;

        this._con.createChannel().then(function(newChannel: Channel) {
            //// send message
            return newChannel.consume(that._queue,
                function (msg: Message) {
                    var ack = onMessage(msg.content);

                    if (!noAck) {
                        ack === true ? newChannel.ack(msg) : newChannel.nack(msg, true, false);
                    }

                    return {};
                },
                {
                    noAck: noAck
                });
        });
    }
}
