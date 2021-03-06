import {Encode} from "./Encode";

export class Decode {

    static login(parts: string[]) : [string, string, string, string] {
        return [
            parts[1],
            Decode.decodeString(parts[2]),
            parts[3],
            parts[4]];
    }

    static loginResponse(parts: string[]) : [string, string] {
        return [
            parts[1],
            parts[2]];
    }

    static add(parts: string[]) : [string, number, number, number, number, number, number, number, string, string] {
        return [
            parts[1],
            parseFloat(parts[2]),
            parseFloat(parts[3]),
            parseFloat(parts[4]),
            parseFloat(parts[5]),
            parseFloat(parts[6]),
            parseFloat(parts[7]),
            parseFloat(parts[8]),
            parts[9],
            parts[10]];
    }

    static added(parts: string[]) : [number, string, number, number, number, number, number, number, number, string, string] {
        return [
            parseInt(parts[1]),
            parts[2],
            parseFloat(parts[3]),
            parseFloat(parts[4]),
            parseFloat(parts[5]),
            parseFloat(parts[6]),
            parseFloat(parts[7]),
            parseFloat(parts[8]),
            parseFloat(parts[9]),
            parts[10],
            parts[11]];
    }

    static update(parts: string[]) : [string, number, number, number, number, number, number, number] {
        return [
            parts[1],
            parseFloat(parts[2]),
            parseFloat(parts[3]),
            parseFloat(parts[4]),
            parseFloat(parts[5]),
            parseFloat(parts[6]),
            parseFloat(parts[7]),
            parseFloat(parts[8])];
    }

    static updated(parts: string[]) : [number, number, number, number, number, number, number, number] {
        return [
            parseInt(parts[1]),
            parseFloat(parts[2]),
            parseFloat(parts[3]),
            parseFloat(parts[4]),
            parseFloat(parts[5]),
            parseFloat(parts[6]),
            parseFloat(parts[7]),
            parseFloat(parts[8])];
    }

    static remove(parts: string[]) : [string] {
        return [
            parts[1],
        ];
    }

    static removed(parts: string[]) : [number, string] {
        return [
            parseInt(parts[1]),
            parts[2]
        ];
    }

    static describe(parts: string[]) : [string, string] {
        return [
            parts[1],
            parts[2],
        ];
    }

    static described(parts: string[]) : [number, string] {
        return [
            parseInt(parts[1]),
            parts[2]
        ];
    }

    static act(parts: string[]) : [string, string, string] {
        return [
            parts[1],
            parts[2],
            parts[3]
        ];
    }

    static acted(parts: string[]) : [number, string, string] {
        return [
            parseInt(parts[1]),
            parts[2],
            parts[3]
        ];
    }

    static notify(parts: string[]) : [string, string] {
        return [
            parts[1],
            parts[2]
        ];
    }

    static notified(parts: string[]) : [string, string] {
        return [
            parts[1],
            parts[2]
        ];
    }

    static decodeString(value: string): string {
        if (value.indexOf('\\') != -1) {
            return value.replace("\\\\1", "\\").replace("\\\\2", Encode.SEPARATOR)
        } else {
            return value;
        }
    }

}
