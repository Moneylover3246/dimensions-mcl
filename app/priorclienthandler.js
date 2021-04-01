"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clientpackethandler_1 = require("dimensions/extension/clientpackethandler");
const packettypes_1 = require("dimensions/packettypes");
const packetwriter_1 = require("dimensions/packets/packetwriter");
const packetreader_1 = require("dimensions/packets/packetreader");
const bitsbyte_1 = require("dimensions/datatypes/bitsbyte");
const tileframeimportant_1 = require("./tileframeimportant");
class PriorClientHandler extends clientpackethandler_1.default {
    constructor(mcl) {
        super();
        this._mcl = mcl;
    }
    handlePacket(client, packet) {
        let handled = false;
        handled = this.handleIncompatiblePacket(client, packet);
        return handled;
    }
    handleIncompatiblePacket(client, packet) {
        let handled = false;
        if ((!this._mcl.clients.has(client) && !this._mcl.pcClients.has(client)) && packet.packetType !== packettypes_1.default.ConnectRequest) {
            return false;
        }
        else if (this._mcl.pcClients.has(client) && packet.packetType !== packettypes_1.default.ConnectRequest) {
            switch (packet.packetType) {
                case packettypes_1.default.SendTileSquare:
                    handled = this.handleSendTileSquare(client, packet);
                    break;

            }
        }
        else {
            switch (packet.packetType) {
                case packettypes_1.default.ConnectRequest:
                    handled = this.handleConnectRequest(client, packet);
                    break;
            }
        }
        return handled;
    }
    handleConnectRequest(client, packet) {
        let reader = new packetreader_1.default(packet.data);
        let version = reader.readString();
        if (version === "Terraria230") {
            this._mcl.clients.add(client);
            packet.data = new packetwriter_1.default()
                .setType(packettypes_1.default.ConnectRequest)
                .packString("Terraria233")
                .data;
            return false;
        }
        else if (version === "Terraria235" || version === "Terraria236") {
            this._mcl.pcClients.add(client);
            packet.data = new packetwriter_1.default()
                .setType(packettypes_1.default.ConnectRequest)
                .packString("Terraria233")
                .data;
            return false;
        }
        return false;
    }
    /**
     * Handles client => server STS so pc clients send the properly formatted data
     * @param client the client the packet came from
     * @param packet the packet and it's data
     * @returns whether or not the packet was handled
     */
    handleSendTileSquare(client, packet) {
        const reader = new packetreader_1.default(packet.data);
        const packetWriter = new packetwriter_1.default();
        const tileX = reader.readInt16();
        const tileY = reader.readInt16();
        const width = reader.readByte();
        const length = reader.readByte();
        const changeByte = reader.readByte();
        const size = Math.max(width, length);
        packetWriter.setType(20)
            .packUInt16(size);
        if (((size & 32767) & 32768) > 0) {
            packetWriter.packByte(changeByte);
        }
        packetWriter.packInt16(tileX)
            .packInt16(tileY);
        let bitsByte = 0;
        let bitsByte2 = 0;
        for (let i = tileX; i < tileX + size; i++) {
            for (let j = tileY; j < tileY + size; j++) {
                const value = reader.readByte();
                const value2 = reader.readByte();
                bitsByte = new bitsbyte_1.default(value);
                bitsByte2 = new bitsbyte_1.default(value2);
                packetWriter.packByte(value)
                    .packByte(value2);
                if (bitsByte2[2]) {
                    packetWriter.packByte(reader.readByte()); // tile.Color
                }
                if (bitsByte2[3]) {
                    packetWriter.packByte(reader.readByte()); // tile.wallColor
                }
                // tile.active()
                if (bitsByte[0]) {
                    const tileType = reader.readInt16();
                    packetWriter.packInt16(tileType);
                    if (tileframeimportant_1.default[tileType]) {
                        packetWriter.packInt16(reader.readInt16()) // tile.frameX
                            .packInt16(reader.readInt16()); // tile.frameY
                    }
                }
                // tile.wall()
                if (bitsByte[2]) {
                    packetWriter.packUInt16(reader.readUInt16()); // wall type
                }
                // checks if tile is a liquid?
                if (bitsByte[3]) {
                    packetWriter.packByte(reader.readByte()) //tile.liquid
                        .packByte(reader.readByte()); //tile.liquidType
                }
            }
        }
        packet.data = packetWriter.data;
        return false;
    }
}
exports.default = PriorClientHandler;
