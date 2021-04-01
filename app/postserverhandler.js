"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const terrariaserverpackethandler_1 = require("dimensions/extension/terrariaserverpackethandler");
const packetreader_1 = require("dimensions/packets/packetreader");
const packetwriter_1 = require("dimensions/packets/packetwriter");
const packettypes_1 = require("dimensions/packettypes");
const bitsbyte_1 = require("dimensions/datatypes/bitsbyte");
const tileframeimportant_1 = require("./tileframeimportant");
class PriorServerHandler extends terrariaserverpackethandler_1.default {
    constructor(mcl) {
        super();
        this._mcl = mcl;
    }
    handlePacket(server, packet) {
        let handled = false;
        if ((!this._mcl.clients.has(server.client) && !this._mcl.pcClients.has(server.client)) && packet.packetType !== packettypes_1.default.ConnectRequest) {
            return false;
        }
        else if (this._mcl.pcClients.has(server.client) && packet.packetType !== packettypes_1.default.ConnectRequest) {
            switch (packet.packetType) {
                case packettypes_1.default.SendTileSquare:
                    handled = this.handleSendTileSquare(server, packet);
                    break;
            }
        }
        else {
            switch (packet.packetType) {
                case packettypes_1.default.NPCUpdate:
                    this.handleNpcUpdate(server, packet);
                    break;
                case packettypes_1.default.ProjectileUpdate:
                    this.handleProjectileUpdate(server, packet);
                    break;
                case packettypes_1.default.LoadNetModule:
                    this.handleLoadNetModule(server, packet);
                    break;
            }
        }
        return handled;
    }
    handleNpcUpdate(server, packet) {
        const reader = new packetreader_1.default(packet.data);
        const npcSlotId = reader.readInt16();
        const position = {
            x: reader.readSingle(),
            y: reader.readSingle()
        };
        const velocity = {
            x: reader.readSingle(),
            y: reader.readSingle()
        };
        const target = reader.readUInt16();
        const npcFlags1 = new bitsbyte_1.default(reader.readByte());
        const npcFlags2 = new bitsbyte_1.default(reader.readByte());
        const ai = [null, null, null, null];
        if (npcFlags1[2]) {
            ai[0] = reader.readSingle();
        }
        if (npcFlags1[3]) {
            ai[1] = reader.readSingle();
        }
        if (npcFlags1[4]) {
            ai[2] = reader.readSingle();
        }
        if (npcFlags1[5]) {
            ai[3] = reader.readSingle();
        }
        const npcNetId = reader.readInt16();
        if (npcNetId > 662) { // 662 is the last supported mobile npc id
            packet.data = Buffer.allocUnsafe(0);
            return true;
        }
        let playerCountForMultiplayerDifficultyOverride = null;
        if (npcFlags2[0]) {
            playerCountForMultiplayerDifficultyOverride = reader.readByte();
        }
        let strengthMultiplier = null;
        if (npcFlags2[2]) {
            strengthMultiplier = reader.readSingle();
        }
        let life = null;
        let lifeBytes = null;
        if (!npcFlags1[7]) {
            lifeBytes = reader.readByte();
            if (lifeBytes == 2) {
                life = reader.readInt16();
            }
            else if (lifeBytes == 4) {
                life = reader.readInt32();
            }
            else {
                life = reader.readSByte();
            }
        }
        let releaseOwner = null;
        if (reader.head < packet.data.length) {
            releaseOwner = reader.readByte();
        }
        return false;
    }
    handleProjectileUpdate(server, packet) {
        const reader = new packetreader_1.default(packet.data);
        const ident = reader.readInt16();
        const positionX = reader.readSingle();
        const positionY = reader.readSingle();
        const velocityX = reader.readSingle();
        const velocityY = reader.readSingle();
        const owner = reader.readByte();
        const projType = reader.readInt16();
        const ai = reader.readByte();
        const hasDamage = (ai & 16) === 16;
        const hasKnockback = (ai & 32) === 32;
        const needsUuid = (ai & 128) === 128;
        const hasOriginalDamage = (ai & 64) === 64;
        const hasAi0 = (ai & 1) === 1;
        const hasAi1 = (ai & 2) === 2;
        let ai0 = 0;
        if (hasAi0) {
            ai0 = reader.readSingle();
        }
        let ai1 = 0;
        if (hasAi1) {
            ai1 = reader.readSingle();
        }
        let damage = 0;
        if (hasDamage) {
            damage = reader.readInt16();
        }
        let knockback = 0;
        if (hasKnockback) {
            knockback = reader.readSingle();
        }
        let originalDamage = 0;
        if (hasOriginalDamage) {
            originalDamage = reader.readInt16();
        }
        let uuid = 0;
        if (needsUuid) {
            uuid = reader.readInt16();
        }
        // 948 is last supported projectile type on mobile (from wiki)
        if (projType > 849) {
            packet.data = Buffer.allocUnsafe(0);
            return true;
        }
        return false;
    }
    handleLoadNetModule(server, packet) {
        const reader = new packetreader_1.default(packet.data);
        const netModuleId = reader.readUInt16();
        /// Creative Unlocks Module
        if (netModuleId === 5) {
            const itemId = reader.readInt16();
            // Is 5043 and 5044 from 1.4.0.5?
            if (itemId > 5044) {
                packet.data = Buffer.allocUnsafe(0);
                return true;
            }
            // Bestiary
        }
        else if (netModuleId === 4) {
            const unlockType = reader.readByte();
            let killCount = null;
            const npcId = reader.readInt16();
            if (unlockType === 0) {
                killCount = reader.readUInt16();
            }
            if (npcId >= 663) {
                packet.data = Buffer.allocUnsafe(0);
                return true;
            }
        }
        return false;
    }
    handleSendTileSquare(server, packet) {
        const reader = new packetreader_1.default(packet.data);
        const size = reader.readUInt16();
        const count = (size & 32767);
        const flag = (count & 32768) > 0;
        let eventType = 0;
        if (flag) {
            eventType = reader.readByte();
        }
        const tileX = reader.readInt16();
        console.log(tileX);
        const tileY = reader.readInt16();
        const maxTilesX = 8400;
        const maxTilesY = 2400;
        // if (!WorldGen.InWorld(tileX, tileY, 3))
        if (!(tileX >= 3 && tileX < maxTilesX - 3 && tileY >= 3 && tileY < maxTilesY - 3)) {
            return true;
        }
        let tileChangeType = 0;
        let bitsByte = 0;
        let bitsByte2 = 0;
        let packetWriter = new packetwriter_1.default();
        packetWriter.setType(20)
            .packInt16(tileX)
            .packInt16(tileY)
            .packByte(size)
            .packByte(size)
            .packByte(eventType);
        for (let i = tileX; i < tileX + size; i++) {
            for (let j = tileY; j < tileY + size; j++) {
                const value = reader.readByte();
                const value2 = reader.readByte();
                bitsByte = new bitsbyte_1.default(value);
                bitsByte2 = new bitsbyte_1.default(value2);
                packetWriter.packByte(value)
                    .packByte(value2);
                let color = 0;
                let wallColor = 0;
                if (bitsByte2[2]) {
                    color = reader.readByte();
                    packetWriter.packByte(color);
                }
                if (bitsByte2[3]) {
                    wallColor = reader.readByte();
                    packetWriter.packByte(wallColor);
                }
                // tile.active()
                if (bitsByte[0]) {
                    const tileType = reader.readInt16();
                    packetWriter.packInt16(tileType);
                    let frameX = 0;
                    let frameY = 0;
                    if (tileframeimportant_1.default[tileType]) {
                        frameX = reader.readInt16();
                        frameY = reader.readInt16();
                        packetWriter.packInt16(frameX)
                            .packInt16(frameY);
                    }
                }
                let wall = 0;
                // tile.wall()
                if (bitsByte[2]) {
                    wall = reader.readUInt16();
                    packetWriter.packUInt16(wall);
                }
                // tile.liquid() ?
                let liquid = 0;
                let liquidType = 0;
                if (bitsByte[3]) {
                    liquid = reader.readByte();
                    liquidType = reader.readByte();
                    packetWriter.packByte(liquid)
                        .packByte(liquidType);
                }
            }
        }
        packet.data = packetWriter.data;
        return false;
    }
}
exports.default = PriorServerHandler;
