"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKET_HEADER_BYTES = exports.PACKET_TYPE_BYTES = exports.PACKET_LEN_BYTES = void 0;
const priorpackethandler_1 = require("./priorpackethandler");
const postpackethandler_1 = require("./postpackethandler");
exports.PACKET_LEN_BYTES = 2;
exports.PACKET_TYPE_BYTES = 1;
exports.PACKET_HEADER_BYTES = exports.PACKET_LEN_BYTES + exports.PACKET_TYPE_BYTES;
class MobileCompatibilityLayer {
    constructor() {
        this.clients = new Set();
        this.pcClients = new Set();
        this.name = "Mobile Compatibility Layer 1.4.0.5 -> 1.4.1.1. With iOS support!";
        this.version = "v1.4";
        this.author = "popstarfreas";
        this.reloadable = false;
        this.priorPacketHandlers = new priorpackethandler_1.default(this);
        this.postPacketHandlers = new postpackethandler_1.default(this);
    }
    setListenServers(listenServers) {
        this.listenServers = listenServers;
    }
    socketClosePostHandler(_socket, client) {
        this.clients.delete(client);
        this.pcClients.delete(client);
    }
}
exports.default = MobileCompatibilityLayer;
