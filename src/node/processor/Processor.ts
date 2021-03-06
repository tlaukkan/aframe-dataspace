import {Connection} from "./Connection";
import {Grid} from "./Grid";
import {Encode} from "../../common/reality/Encode";
import {Decode} from "../../common/reality/Decode";
import Timer = NodeJS.Timer;
import {Sanitizer} from "../../common/reality/Sanitizer";
import {RegionConfiguration} from "../../common/reality/Configuration";

export class Processor {

    static readonly UPDATE_INTERVAL_MILLIS: number = 300;
    static readonly TICK_INTERVAL_MILLIS: number = 5;
    static readonly TICKS_PER_UPDATE_INTERVAL: number = Processor.UPDATE_INTERVAL_MILLIS / Processor.TICK_INTERVAL_MILLIS;

    processorConfig: RegionConfiguration;
    spaceName: string;
    region: string;
    dynamic: boolean;

    grid: Grid;
    sanitizer: Sanitizer;
    connections: Map<string, Connection> = new Map();
    intervalHandle: Timer | undefined = undefined;
    lastProcessTime: number = new Date().getTime();

    constructor(processorConfig: RegionConfiguration, spaceName: string, region: string, grid: Grid, sanitizer: Sanitizer, dynamic: boolean) {
        this.processorConfig = processorConfig;
        this.spaceName = spaceName;
        this.region = region;
        this.grid = grid;
        this.sanitizer = sanitizer;
        this.dynamic = dynamic;
    }

    start() {
        this.intervalHandle = setInterval(this.tick, Processor.TICK_INTERVAL_MILLIS);
    }

    stop() {
        if (this.intervalHandle !== undefined) {
            clearInterval(this.intervalHandle);
        }
        this.intervalHandle = undefined;
    }

    tick = () => {
        try {
            const currentProcessTime: number = new Date().getTime()
            const delta = currentProcessTime - this.lastProcessTime;
            //console.log("processing, delta: " + delta + " ms.")
            this.connections.forEach((connection: Connection, id: string) => {
                const queueSize = connection.outQueue.size();
                const toSendInThisTick = Math.ceil(queueSize / Processor.TICKS_PER_UPDATE_INTERVAL);

                //console.log("Sending for " + connection.id + " " + toSendInThisTick + "/" + queueSize);
                for (let i = 0; i < toSendInThisTick; i++) {
                    const typeAndMessage = connection.outQueue.dequeue()!!;
                    const type: string = typeAndMessage[0];
                    const message: string = typeAndMessage[1];
                    connection.send(message);
                }
            });
            this.lastProcessTime = currentProcessTime;
        } catch (error) {
            console.error("Error in control process loop.", error);
        }
    }

    add(connection: Connection) {
        this.connections.set(connection.id, connection);

        connection.receive = (message: String) => {
            try {
                const parts = message.split(Encode.SEPARATOR);
                const type = parts[0];
                if (type === Encode.ADD) {
                    const decoded = Decode.add(parts);
                    const entityId = connection.principal!!.userId + ":" + decoded[0];
                    const x: number = decoded[1];
                    const y: number = decoded[2];
                    const z: number = decoded[3];
                    const rx: number = decoded[4];
                    const ry: number = decoded[5];
                    const rz: number = decoded[6];
                    const rw: number = decoded[7];

                    const description = this.sanitizer.sanitize(decoded[8], this.getUserIdentificationAttributes(connection));
                    const type = decoded[9];

                    if (connection.entityIds.has(entityId)) {
                        throw new Error("Connection already owns: " + entityId);
                    }

                    const success = this.grid.add(connection, entityId, x, y, z, rx, ry, rz, rw, description, type);

                    if (!success) {
                        console.warn("Failed to add entity to grid due to entity being outside grid boundaries: ", message);
                        return;
                    }

                    connection.entityIds.add(entityId);
                    return;
                }
                if (type === Encode.UPDATE) {
                    const decoded = Decode.update(parts);
                    const entityId = connection.principal!!.userId + ":" + decoded[0];
                    const x: number = decoded[1];
                    const y: number = decoded[2];
                    const z: number = decoded[3];
                    const rx: number = decoded[4];
                    const ry: number = decoded[5];
                    const rz: number = decoded[6];
                    const rw: number = decoded[7];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.update(entityId, x, y, z, rx, ry, rz, rw);

                    return;
                }
                if (type === Encode.REMOVE) {
                    const decoded = Decode.remove(parts);
                    const entityId = connection.principal!!.userId + ":" + decoded[0];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.remove(entityId);

                    connection.entityIds.delete(entityId);

                    return;
                }
                if (type === Encode.DESCRIBE) {
                    const decoded = Decode.describe(parts);
                    const entityId = connection.principal!!.userId + ":" + decoded[0];
                    const description = this.sanitizer.sanitize(decoded[1], this.getUserIdentificationAttributes(connection));

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.describe(entityId, description);

                    return;
                }
                if (type === Encode.ACT) {
                    const decoded = Decode.act(parts);
                    const entityId = connection.principal!!.userId + ":" + decoded[0];
                    const action = decoded[1];
                    const description = decoded[2];

                    if (!connection.entityIds.has(entityId)) {
                        throw new Error("Connection does not own: " + entityId);
                    }

                    this.grid.act(entityId, action, description);
                    return;
                }
                if (type === Encode.NOTIFY) {
                    const decoded = Decode.notify(parts);
                    const notification = decoded[0];
                    const description = decoded[1];
                    this.grid.notify(notification, description);
                    return;
                }
            } catch (error) {
                console.warn("Message processing failed: " + message, error);
            }

        }

    }

    private getUserIdentificationAttributes(connection: Connection) {
        const attributesToInject: Map<string, string> = new Map([
            ["user-id", connection.principal!!.userId],
            ["user-name", connection.principal!!.userName]
        ]);
        return attributesToInject;
    }

    remove(connection: Connection) {
        this.connections.delete(connection.id);

        for (let entityId of connection.entityIds) {
            connection.entityIds.delete(entityId);
            this.grid.remove(entityId);
        }
    }


}