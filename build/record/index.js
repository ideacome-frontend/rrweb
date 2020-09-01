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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var rrweb_snapshot_1 = require("rrweb-snapshot");
var observer_1 = require("./observer");
var utils_1 = require("../utils");
var types_1 = require("../types");
function wrapEvent(e) {
    return __assign(__assign({}, e), { timestamp: Date.now() });
}
var wrappedEmit;
function record(options) {
    if (options === void 0) { options = {}; }
    var emit = options.emit, checkoutEveryNms = options.checkoutEveryNms, checkoutEveryNth = options.checkoutEveryNth, _a = options.blockClass, blockClass = _a === void 0 ? 'rr-block' : _a, _b = options.ignoreClass, ignoreClass = _b === void 0 ? 'rr-ignore' : _b, _c = options.inlineStylesheet, inlineStylesheet = _c === void 0 ? true : _c, maskAllInputs = options.maskAllInputs, _maskInputOptions = options.maskInputOptions, hooks = options.hooks, packFn = options.packFn, _d = options.sampling, sampling = _d === void 0 ? {} : _d, mousemoveWait = options.mousemoveWait, _e = options.recordCanvas, recordCanvas = _e === void 0 ? false : _e;
    if (!emit) {
        throw new Error('emit function is required');
    }
    if (mousemoveWait !== undefined && sampling.mousemove === undefined) {
        sampling.mousemove = mousemoveWait;
    }
    var maskInputOptions = maskAllInputs === true
        ? {
            color: true,
            date: true,
            'datetime-local': true,
            email: true,
            month: true,
            number: true,
            range: true,
            search: true,
            tel: true,
            text: true,
            time: true,
            url: true,
            week: true,
            textarea: true,
            select: true,
        }
        : _maskInputOptions !== undefined
            ? _maskInputOptions
            : {};
    utils_1.polyfill();
    var lastFullSnapshotEvent;
    var incrementalSnapshotCount = 0;
    wrappedEmit = function (e, isCheckout) {
        emit((packFn ? packFn(e) : e), isCheckout);
        if (e.type === types_1.EventType.FullSnapshot) {
            lastFullSnapshotEvent = e;
            incrementalSnapshotCount = 0;
        }
        else if (e.type === types_1.EventType.IncrementalSnapshot) {
            incrementalSnapshotCount++;
            var exceedCount = checkoutEveryNth && incrementalSnapshotCount >= checkoutEveryNth;
            var exceedTime = checkoutEveryNms &&
                e.timestamp - lastFullSnapshotEvent.timestamp > checkoutEveryNms;
            if (exceedCount || exceedTime) {
                takeFullSnapshot(true);
            }
        }
    };
    function takeFullSnapshot(isCheckout) {
        var _a, _b, _c, _d;
        if (isCheckout === void 0) { isCheckout = false; }
        wrappedEmit(wrapEvent({
            type: types_1.EventType.Meta,
            data: {
                href: window.location.href,
                width: utils_1.getWindowWidth(),
                height: utils_1.getWindowHeight(),
            },
        }), isCheckout);
        var _e = __read(rrweb_snapshot_1.snapshot(document, blockClass, inlineStylesheet, maskInputOptions, recordCanvas), 2), node = _e[0], idNodeMap = _e[1];
        if (!node) {
            return console.warn('Failed to snapshot the document');
        }
        utils_1.mirror.map = idNodeMap;
        wrappedEmit(wrapEvent({
            type: types_1.EventType.FullSnapshot,
            data: {
                node: node,
                initialOffset: {
                    left: window.pageXOffset !== undefined
                        ? window.pageXOffset
                        : (document === null || document === void 0 ? void 0 : document.documentElement.scrollLeft) || ((_b = (_a = document === null || document === void 0 ? void 0 : document.body) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.scrollLeft) || (document === null || document === void 0 ? void 0 : document.body.scrollLeft) ||
                            0,
                    top: window.pageYOffset !== undefined
                        ? window.pageYOffset
                        : (document === null || document === void 0 ? void 0 : document.documentElement.scrollTop) || ((_d = (_c = document === null || document === void 0 ? void 0 : document.body) === null || _c === void 0 ? void 0 : _c.parentElement) === null || _d === void 0 ? void 0 : _d.scrollTop) || (document === null || document === void 0 ? void 0 : document.body.scrollTop) ||
                            0,
                },
            },
        }));
    }
    try {
        var handlers_1 = [];
        handlers_1.push(utils_1.on('DOMContentLoaded', function () {
            wrappedEmit(wrapEvent({
                type: types_1.EventType.DomContentLoaded,
                data: {},
            }));
        }));
        var init_1 = function () {
            takeFullSnapshot();
            handlers_1.push(observer_1.default({
                mutationCb: function (m) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Mutation }, m),
                    }));
                },
                mousemoveCb: function (positions, source) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: {
                            source: source,
                            positions: positions,
                        },
                    }));
                },
                mouseInteractionCb: function (d) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.MouseInteraction }, d),
                    }));
                },
                scrollCb: function (p) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Scroll }, p),
                    }));
                },
                viewportResizeCb: function (d) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.ViewportResize }, d),
                    }));
                },
                inputCb: function (v) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.Input }, v),
                    }));
                },
                mediaInteractionCb: function (p) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.MediaInteraction }, p),
                    }));
                },
                styleSheetRuleCb: function (r) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.StyleSheetRule }, r),
                    }));
                },
                canvasMutationCb: function (p) {
                    return wrappedEmit(wrapEvent({
                        type: types_1.EventType.IncrementalSnapshot,
                        data: __assign({ source: types_1.IncrementalSource.CanvasMutation }, p),
                    }));
                },
                blockClass: blockClass,
                ignoreClass: ignoreClass,
                maskInputOptions: maskInputOptions,
                inlineStylesheet: inlineStylesheet,
                sampling: sampling,
                recordCanvas: recordCanvas,
            }, hooks));
        };
        if (document.readyState === 'interactive' ||
            document.readyState === 'complete') {
            init_1();
        }
        else {
            handlers_1.push(utils_1.on('load', function () {
                wrappedEmit(wrapEvent({
                    type: types_1.EventType.Load,
                    data: {},
                }));
                init_1();
            }, window));
        }
        return function () {
            handlers_1.forEach(function (h) { return h(); });
        };
    }
    catch (error) {
        console.warn(error);
    }
}
record.addCustomEvent = function (tag, payload) {
    if (!wrappedEmit) {
        throw new Error('please add custom event after start recording');
    }
    wrappedEmit(wrapEvent({
        type: types_1.EventType.Custom,
        data: {
            tag: tag,
            payload: payload,
        },
    }));
};
exports.default = record;
//# sourceMappingURL=index.js.map