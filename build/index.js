"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.mirror = exports.Replayer = exports.addCustomEvent = exports.record = void 0;
var record_1 = require("./record");
exports.record = record_1.default;
var replay_1 = require("./replay");
Object.defineProperty(exports, "Replayer", { enumerable: true, get: function () { return replay_1.Replayer; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "mirror", { enumerable: true, get: function () { return utils_1.mirror; } });
var utils = require("./utils");
exports.utils = utils;
var types_1 = require("./types");
Object.defineProperty(exports, "EventType", { enumerable: true, get: function () { return types_1.EventType; } });
Object.defineProperty(exports, "IncrementalSource", { enumerable: true, get: function () { return types_1.IncrementalSource; } });
Object.defineProperty(exports, "MouseInteractions", { enumerable: true, get: function () { return types_1.MouseInteractions; } });
Object.defineProperty(exports, "ReplayerEvents", { enumerable: true, get: function () { return types_1.ReplayerEvents; } });
var addCustomEvent = record_1.default.addCustomEvent;
exports.addCustomEvent = addCustomEvent;
//# sourceMappingURL=index.js.map