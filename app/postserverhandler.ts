import ClientPacketHandler from 'dimensions/extension/clientpackethandler';
import Client from 'dimensions/client';
import Packet from 'dimensions/packet';
import PacketTypes from 'dimensions/packettypes';
import PacketWriter from 'dimensions/packets/packetwriter';
import PacketReader from 'dimensions/packets/packetreader';
import BitsByte from 'dimensions/datatypes/bitsbyte';
import CL from './';

class PriorClientHandler extends ClientPacketHandler {
    protected _cl: CL;

    constructor(cl: CL) {
        super();
        this._cl = cl;
    }

    public handlePacket(client: Client, packet: Packet) {
        let handled = false;
        handled = this.handleIncompatiblePacket(client, packet);
        return handled;
    }

    private handleIncompatiblePacket(client: Client, packet: Packet) {
        let handled = false;
        if (!this._cl.clients.has(client) && packet.packetType !== PacketTypes.ConnectRequest) {
            return false;
        }
        switch (packet.packetType) {
            case PacketTypes.ConnectRequest:
                handled = this.handleConnectRequest(client, packet);
                break;
            case PacketTypes.ProjectileUpdate:
                handled = this.handleProjectileUpdate(client, packet);
                break;
            case PacketTypes.SendTileSquare:
                handled = this.handleSendTileSquare(client, packet);
                break;
        }
        return handled;
    }


    private handleConnectRequest(client: Client, packet: Packet) {
        let reader = new PacketReader(packet.data);
        let version = reader.readString();
        // 1.4.1.2 Version || 1.4.2 Version
        if (version === "Terraria234" || version === "Terraria235" || version === "Terraria236") {
            this._cl.clients.add(client);
            packet.data = new PacketWriter()
                .setType(PacketTypes.ConnectRequest)
                .packString("Terraria233")
                .data;
            return false;
        }
        return false;
    }

    private handleProjectileUpdate(client, packet: Packet) {
        const reader = new PacketReader(packet.data);
        const id = reader.readInt16();
        const location = {
            x: reader.readSingle(),
            y: reader.readSingle(),
        }
        const velocity = {
            x: reader.readSingle(),
            y: reader.readSingle(),
        }
        const owner = reader.readByte();
        const startFrom = reader.head;
        const type = reader.readInt16();

        if (type === 954) {
            packet.data.writeInt16LE(504, startFrom);
        }

        if (type === 955) {
            packet.data.writeInt16LE(12, startFrom);
        }
        return false;
    }
    handleSendTileSquare(client, packet) {
        const reader = new PacketReader(packet.data);
        const tileX = reader.readInt16();
        const tileY = reader.readInt16();
        const width = reader.readByte();
        const length = reader.readByte();
        const changeByte = reader.readByte();
        const size = Math.max(width, length);
        const packetWriter = new PacketWriter()
            .setType(20)
            .packUInt16(size);
        if (((size & 32767) & 32768) > 0) {
            packetWriter.packByte(changeByte);
        }
        const tileData: Buffer = reader.readBuffer(packet.data.length - reader.head);
        packetWriter.packInt16(tileX)
                    .packInt16(tileY)
                    .packBuffer(tileData);
        packet.data = packetWriter.data;
        return false;
    }
}

export default PriorClientHandler;
