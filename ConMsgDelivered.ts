/**
 * Created by bruenni on 22.11.15.
 */

/// <reference path="typings/tsd.d.ts" />

import {Connection} from "amqplib";
import {Promise} from "when";
import {Channel} from "amqplib";
import {Replies, Options} from "amqplib/properties";

export class ConMsgDelivered {
    private _con:Connection;
    private _exchange;
    private _routingKey:string;

    constructor(con: Connection, exchange: string, routingKey: string) {
        this._con = con;
        this._exchange = exchange;
        this._routingKey = routingKey;
    }

    Init(): Promise<Replies.AssertQueue> {
        this._con.createChannel().then(function(channel: Channel) {
            return channel.assertQueue("msg.delivered", {exclusive: false});
        })
    }
}
