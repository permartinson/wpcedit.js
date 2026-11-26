import { WPC, WriteTypes } from "../resources/Constants.js";
export class PlaneWriter {
    constructor(data, direction, cols = WPC.DmdCols, rows = WPC.DmdRows) {
        this.data = data;
        this.direction = direction;
        this.cols = cols;
        this.rows = rows;
        this.pos = 0;
        this.count = 0;
        this.capacity = Math.ceil(Math.ceil(cols / 8) * 8 * rows) / 8;
    }
    static fullFrame(direction) {
        return new PlaneWriter(new Uint8Array(WPC.DmdPageBytes), direction);
    }
    get full() {
        return this.count >= this.capacity;
    }
    write(value) {
        this.data.set([value], this.pos);
        this.count++;
        if (this.count >= this.capacity) {
            return;
        }
        if (this.direction == WriteTypes.Rows) {
            this.pos++;
            return;
        }
        if (!(this.count % this.rows)) {
            this.pos -= (this.cols / 8) * (this.rows - 2) + (this.cols / 8 - 1);
        }
        else {
            this.pos += this.cols / 8;
        }
    }
}
