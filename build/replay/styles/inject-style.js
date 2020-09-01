"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rules = function (blockClass) { return [
    "iframe, ." + blockClass + " { background: #ccc }",
    'noscript { display: none !important; }',
]; };
exports.default = rules;
//# sourceMappingURL=inject-style.js.map