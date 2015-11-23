/**
 * Created by bruenni on 22.11.15.
 */

/// <reference path="typings/tsd.d.ts" />

import {Connection} from "amqplib";
import {Promise} from "when";
import {Channel} from "amqplib";
import {Replies, Options} from "amqplib/properties";

export class RabbitMqMessageDeliveryStatus {
    private _con:Connection;
    private _exchange:string = "msg.delivered";
    private _queue:string = "msg.delivered";
    private _routingKey:string = "msg.delivered";
    private _exchangeType: string = "direct";

    constructor(con: Connection) {
        this._con = con;
    }

    /**
     * Consumers are senders of msg deliver messages to handle delivered events.
     * Direct exchange, non exclusive queue so that master node can handle save
     * delivered state of message to database.
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
            return channel.assertQueue(that._queue, {exclusive: false});
        });

        var okBinding = okQueue.then(function (ret: Replies.AssertQueue) {
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
    PublishDeliveredEvent(msg: Buffer): Promise<boolean> {
        var that = this;

        // 1) publish event

        return this._con.createChannel().then(function(newChannel: Channel) {
            //// send message
            return newChannel.publish(that._exchange, that._routingKey, msg, {});
        });
    }

    /**
     * Subscribes for message delivered events. When nacked messages are requeued so next consumer to this queue
     * can handle message.
     * ack: If true messages must be acked whether they are processed or not
     * onMessage: Function called on each message receive. Return value is value of ack. If false nack is sent.
     */
    Subscribe(onMessage: (data: Buffer) => boolean, noAck?: boolean): void {
        var that = this;

        this._con.createChannel().then(function(newChannel: Channel) {
            //// send message
            return newChannel.consume(that._queue,
                function (msg:any) {
                    var isAcked = onMessage(msg.content);

                    if (!noAck) {
                        isAcked === true ? newChannel.ack(msg, true) : newChannel.nack(msg, true, true);
                    }

                    return {};
                },
                {
                    noAck: noAck
                });
        });
    }
}
