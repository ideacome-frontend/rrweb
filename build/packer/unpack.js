"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack = void 0;
var pako_inflate_1 = require("pako/dist/pako_inflate");
var base_1 = require("./base");
exports.unpack = function (raw) {
    if (typeof raw !== 'string') {
        return raw;
    }
    try {
        var e = JSON.parse(raw);
        if (e.timestamp) {
            return e;
        }
    }
    catch (error) {
    }
    try {
        var e = JSON.parse(pako_inflate_1.inflate(raw, { to: 'string' }));
        if (e.v === base_1.MARK) {
            return e;
        }
        throw new Error("These events were packed with packer " + e.v + " which is incompatible with current packer " + base_1.MARK + ".");
    }
    catch (error) {
        console.error(error);
        throw new Error('Unknown data format.');
    }
};
//# sourceMappingURL=unpack.js.map