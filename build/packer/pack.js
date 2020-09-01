"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = void 0;
var pako_deflate_1 = require("pako/dist/pako_deflate");
var base_1 = require("./base");
exports.pack = function (event) {
    var _e = __assign(__assign({}, event), { v: base_1.MARK });
    return pako_deflate_1.deflate(JSON.stringify(_e), { to: 'string' });
};
//# sourceMappingURL=pack.js.map