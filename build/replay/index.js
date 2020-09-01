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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
exports.Replayer = void 0;
var rrweb_snapshot_1 = require("rrweb-snapshot");
var mittProxy = require("mitt");
var smoothscroll = require("smoothscroll-polyfill");
var timer_1 = require("./timer");
var machine_1 = require("./machine");
var types_1 = require("../types");
var utils_1 = require("../utils");
var inject_style_1 = require("./styles/inject-style");
require("./styles/style.css");
var SKIP_TIME_THRESHOLD = 10 * 1000;
var SKIP_TIME_INTERVAL = 5 * 1000;
var mitt = mittProxy.default || mittProxy;
var REPLAY_CONSOLE_PREFIX = '[replayer]';
var defaultConfig = {
    speed: 1,
    root: document.body,
    loadTimeout: 0,
    skipInactive: false,
    showWarning: true,
    showDebug: false,
    blockClass: 'rr-block',
    liveMode: false,
    insertStyleRules: [],
    triggerFocus: true,
    UNSAFE_replayCanvas: false,
};
var Replayer = (function () {
    function Replayer(events, config) {
        var _this = this;
        this.emitter = mitt();
        this.legacy_missingNodeRetryMap = {};
        this.imageMap = new Map();
        if (!(config === null || config === void 0 ? void 0 : config.liveMode) && events.length < 2) {
            throw new Error('Replayer need at least 2 events.');
        }
        this.config = Object.assign({}, defaultConfig, config);
        this.handleResize = this.handleResize.bind(this);
        this.getCastFn = this.getCastFn.bind(this);
        this.emitter.on(types_1.ReplayerEvents.Resize, this.handleResize);
        smoothscroll.polyfill();
        utils_1.polyfill();
        this.setupDom();
        this.treeIndex = new utils_1.TreeIndex();
        this.fragmentParentMap = new Map();
        this.emitter.on(types_1.ReplayerEvents.Flush, function () {
            var e_1, _a, e_2, _b, e_3, _c;
            var _d = _this.treeIndex.flush(), scrollMap = _d.scrollMap, inputMap = _d.inputMap;
            try {
                for (var _e = __values(scrollMap.values()), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var d = _f.value;
                    _this.applyScroll(d);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                for (var _g = __values(inputMap.values()), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var d = _h.value;
                    _this.applyInput(d);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_2) throw e_2.error; }
            }
            try {
                for (var _j = __values(_this.fragmentParentMap.entries()), _k = _j.next(); !_k.done; _k = _j.next()) {
                    var _l = __read(_k.value, 2), frag = _l[0], parent_1 = _l[1];
                    utils_1.mirror.map[parent_1.__sn.id] = parent_1;
                    if (parent_1.__sn.type === rrweb_snapshot_1.NodeType.Element &&
                        parent_1.__sn.tagName === 'textarea' &&
                        frag.textContent) {
                        parent_1.value = frag.textContent;
                    }
                    parent_1.appendChild(frag);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                }
                finally { if (e_3) throw e_3.error; }
            }
            _this.fragmentParentMap.clear();
        });
        var timer = new timer_1.Timer([], (config === null || config === void 0 ? void 0 : config.speed) || defaultConfig.speed);
        this.service = machine_1.createPlayerService({
            events: events.map(function (e) {
                if (config && config.unpackFn) {
                    return config.unpackFn(e);
                }
                return e;
            }),
            timer: timer,
            timeOffset: 0,
            baselineTime: 0,
            lastPlayedEvent: null,
        }, {
            getCastFn: this.getCastFn,
            emitter: this.emitter,
        });
        this.service.start();
        this.service.subscribe(function (state) {
            _this.emitter.emit(types_1.ReplayerEvents.StateChange, {
                player: state,
            });
        });
        this.speedService = machine_1.createSpeedService({
            normalSpeed: -1,
            timer: timer,
        });
        this.speedService.start();
        this.speedService.subscribe(function (state) {
            _this.emitter.emit(types_1.ReplayerEvents.StateChange, {
                speed: state,
            });
        });
        var firstMeta = this.service.state.context.events.find(function (e) { return e.type === types_1.EventType.Meta; });
        var firstFullsnapshot = this.service.state.context.events.find(function (e) { return e.type === types_1.EventType.FullSnapshot; });
        if (firstMeta) {
            var _a = firstMeta.data, width_1 = _a.width, height_1 = _a.height;
            setTimeout(function () {
                _this.emitter.emit(types_1.ReplayerEvents.Resize, {
                    width: width_1,
                    height: height_1,
                });
            }, 0);
        }
        if (firstFullsnapshot) {
            this.rebuildFullSnapshot(firstFullsnapshot);
        }
    }
    Object.defineProperty(Replayer.prototype, "timer", {
        get: function () {
            return this.service.state.context.timer;
        },
        enumerable: false,
        configurable: true
    });
    Replayer.prototype.on = function (event, handler) {
        this.emitter.on(event, handler);
    };
    Replayer.prototype.setConfig = function (config) {
        var _this = this;
        Object.keys(config).forEach(function (key) {
            _this.config[key] = config[key];
        });
        if (!this.config.skipInactive) {
            this.backToNormal();
        }
    };
    Replayer.prototype.getMetaData = function () {
        var firstEvent = this.service.state.context.events[0];
        var lastEvent = this.service.state.context.events[this.service.state.context.events.length - 1];
        return {
            startTime: firstEvent.timestamp,
            endTime: lastEvent.timestamp,
            totalTime: lastEvent.timestamp - firstEvent.timestamp,
        };
    };
    Replayer.prototype.getCurrentTime = function () {
        return this.timer.timeOffset + this.getTimeOffset();
    };
    Replayer.prototype.getTimeOffset = function () {
        var _a = this.service.state.context, baselineTime = _a.baselineTime, events = _a.events;
        return baselineTime - events[0].timestamp;
    };
    Replayer.prototype.play = function (timeOffset) {
        if (timeOffset === void 0) { timeOffset = 0; }
        if (this.service.state.matches('paused')) {
            this.service.send({ type: 'PLAY', payload: { timeOffset: timeOffset } });
        }
        else {
            this.service.send({ type: 'PAUSE' });
            this.service.send({ type: 'PLAY', payload: { timeOffset: timeOffset } });
        }
        this.emitter.emit(types_1.ReplayerEvents.Start);
    };
    Replayer.prototype.pause = function (timeOffset) {
        if (timeOffset === undefined && this.service.state.matches('playing')) {
            this.service.send({ type: 'PAUSE' });
        }
        if (typeof timeOffset === 'number') {
            this.play(timeOffset);
            this.service.send({ type: 'PAUSE' });
        }
        this.emitter.emit(types_1.ReplayerEvents.Pause);
    };
    Replayer.prototype.resume = function (timeOffset) {
        if (timeOffset === void 0) { timeOffset = 0; }
        console.warn("The 'resume' will be departed in 1.0. Please use 'play' method which has the same interface.");
        this.play(timeOffset);
        this.emitter.emit(types_1.ReplayerEvents.Resume);
    };
    Replayer.prototype.startLive = function (baselineTime) {
        this.service.send({ type: 'TO_LIVE', payload: { baselineTime: baselineTime } });
    };
    Replayer.prototype.addEvent = function (rawEvent) {
        var _this = this;
        var event = this.config.unpackFn
            ? this.config.unpackFn(rawEvent)
            : rawEvent;
        Promise.resolve().then(function () {
            return _this.service.send({ type: 'ADD_EVENT', payload: { event: event } });
        });
    };
    Replayer.prototype.enableInteract = function () {
        this.iframe.setAttribute('scrolling', 'auto');
        this.iframe.style.pointerEvents = 'auto';
    };
    Replayer.prototype.disableInteract = function () {
        this.iframe.setAttribute('scrolling', 'no');
        this.iframe.style.pointerEvents = 'none';
    };
    Replayer.prototype.setupDom = function () {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('replayer-wrapper');
        this.config.root.appendChild(this.wrapper);
        this.mouse = document.createElement('div');
        this.mouse.classList.add('replayer-mouse');
        this.wrapper.appendChild(this.mouse);
        this.iframe = document.createElement('iframe');
        var attributes = ['allow-same-origin'];
        if (this.config.UNSAFE_replayCanvas) {
            attributes.push('allow-scripts');
        }
        this.iframe.setAttribute('sandbox', attributes.join(' '));
        this.disableInteract();
        this.wrapper.appendChild(this.iframe);
    };
    Replayer.prototype.handleResize = function (dimension) {
        this.iframe.setAttribute('width', String(dimension.width));
        this.iframe.setAttribute('height', String(dimension.height));
    };
    Replayer.prototype.getCastFn = function (event, isSync) {
        var _this = this;
        if (isSync === void 0) { isSync = false; }
        var castFn;
        switch (event.type) {
            case types_1.EventType.DomContentLoaded:
            case types_1.EventType.Load:
                break;
            case types_1.EventType.Custom:
                castFn = function () {
                    _this.emitter.emit(types_1.ReplayerEvents.CustomEvent, event);
                };
                break;
            case types_1.EventType.Meta:
                castFn = function () {
                    return _this.emitter.emit(types_1.ReplayerEvents.Resize, {
                        width: event.data.width,
                        height: event.data.height,
                    });
                };
                break;
            case types_1.EventType.FullSnapshot:
                castFn = function () {
                    _this.rebuildFullSnapshot(event);
                    _this.iframe.contentWindow.scrollTo(event.data.initialOffset);
                };
                break;
            case types_1.EventType.IncrementalSnapshot:
                castFn = function () {
                    var e_4, _a;
                    _this.applyIncremental(event, isSync);
                    if (isSync) {
                        return;
                    }
                    if (event === _this.nextUserInteractionEvent) {
                        _this.nextUserInteractionEvent = null;
                        _this.backToNormal();
                    }
                    if (_this.config.skipInactive && !_this.nextUserInteractionEvent) {
                        try {
                            for (var _b = __values(_this.service.state.context.events), _c = _b.next(); !_c.done; _c = _b.next()) {
                                var _event = _c.value;
                                if (_event.timestamp <= event.timestamp) {
                                    continue;
                                }
                                if (_this.isUserInteraction(_event)) {
                                    if (_event.delay - event.delay >
                                        SKIP_TIME_THRESHOLD *
                                            _this.speedService.state.context.timer.speed) {
                                        _this.nextUserInteractionEvent = _event;
                                    }
                                    break;
                                }
                            }
                        }
                        catch (e_4_1) { e_4 = { error: e_4_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_4) throw e_4.error; }
                        }
                        if (_this.nextUserInteractionEvent) {
                            var skipTime = _this.nextUserInteractionEvent.delay - event.delay;
                            var payload = {
                                speed: Math.min(Math.round(skipTime / SKIP_TIME_INTERVAL), 360),
                            };
                            _this.speedService.send({ type: 'FAST_FORWARD', payload: payload });
                            _this.emitter.emit(types_1.ReplayerEvents.SkipStart, payload);
                        }
                    }
                };
                break;
            default:
        }
        var wrappedCastFn = function () {
            if (castFn) {
                castFn();
            }
            _this.service.send({ type: 'CAST_EVENT', payload: { event: event } });
            if (event ===
                _this.service.state.context.events[_this.service.state.context.events.length - 1]) {
                _this.backToNormal();
                _this.service.send('END');
                _this.emitter.emit(types_1.ReplayerEvents.Finish);
            }
        };
        return wrappedCastFn;
    };
    Replayer.prototype.rebuildFullSnapshot = function (event) {
        if (!this.iframe.contentDocument) {
            return console.warn('Looks like your replayer has been destroyed.');
        }
        if (Object.keys(this.legacy_missingNodeRetryMap).length) {
            console.warn('Found unresolved missing node map', this.legacy_missingNodeRetryMap);
        }
        this.legacy_missingNodeRetryMap = {};
        utils_1.mirror.map = rrweb_snapshot_1.rebuild(event.data.node, this.iframe.contentDocument)[1];
        var styleEl = document.createElement('style');
        var _a = this.iframe.contentDocument, documentElement = _a.documentElement, head = _a.head;
        documentElement.insertBefore(styleEl, head);
        var injectStylesRules = inject_style_1.default(this.config.blockClass).concat(this.config.insertStyleRules);
        for (var idx = 0; idx < injectStylesRules.length; idx++) {
            styleEl.sheet.insertRule(injectStylesRules[idx], idx);
        }
        this.emitter.emit(types_1.ReplayerEvents.FullsnapshotRebuilded, event);
        this.waitForStylesheetLoad();
        if (this.config.UNSAFE_replayCanvas) {
            this.preloadAllImages();
        }
    };
    Replayer.prototype.waitForStylesheetLoad = function () {
        var _this = this;
        var _a;
        var head = (_a = this.iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.head;
        if (head) {
            var unloadSheets_1 = new Set();
            var timer_2;
            var beforeLoadState_1 = this.service.state;
            var unsubscribe_1 = this.service.subscribe(function (state) {
                beforeLoadState_1 = state;
            }).unsubscribe;
            head
                .querySelectorAll('link[rel="stylesheet"]')
                .forEach(function (css) {
                if (!css.sheet) {
                    unloadSheets_1.add(css);
                    css.addEventListener('load', function () {
                        unloadSheets_1.delete(css);
                        if (unloadSheets_1.size === 0 && timer_2 !== -1) {
                            if (beforeLoadState_1.matches('playing')) {
                                _this.play(_this.getCurrentTime());
                            }
                            _this.emitter.emit(types_1.ReplayerEvents.LoadStylesheetEnd);
                            if (timer_2) {
                                window.clearTimeout(timer_2);
                            }
                            unsubscribe_1();
                        }
                    });
                }
            });
            if (unloadSheets_1.size > 0) {
                this.service.send({ type: 'PAUSE' });
                this.emitter.emit(types_1.ReplayerEvents.LoadStylesheetStart);
                timer_2 = window.setTimeout(function () {
                    if (beforeLoadState_1.matches('playing')) {
                        _this.play(_this.getCurrentTime());
                    }
                    timer_2 = -1;
                    unsubscribe_1();
                }, this.config.loadTimeout);
            }
        }
    };
    Replayer.prototype.preloadAllImages = function () {
        var e_5, _a;
        var _this = this;
        var beforeLoadState = this.service.state;
        var unsubscribe = this.service.subscribe(function (state) {
            beforeLoadState = state;
        }).unsubscribe;
        var count = 0;
        var resolved = 0;
        try {
            for (var _b = __values(this.service.state.context.events), _c = _b.next(); !_c.done; _c = _b.next()) {
                var event_1 = _c.value;
                if (event_1.type === types_1.EventType.IncrementalSnapshot &&
                    event_1.data.source === types_1.IncrementalSource.CanvasMutation &&
                    event_1.data.property === 'drawImage' &&
                    typeof event_1.data.args[0] === 'string' &&
                    !this.imageMap.has(event_1)) {
                    count++;
                    var image = document.createElement('img');
                    image.src = event_1.data.args[0];
                    this.imageMap.set(event_1, image);
                    image.onload = function () {
                        resolved++;
                        if (resolved === count) {
                            if (beforeLoadState.matches('playing')) {
                                _this.play(_this.getCurrentTime());
                            }
                            unsubscribe();
                        }
                    };
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
        if (count !== resolved) {
            this.service.send({ type: 'PAUSE' });
        }
    };
    Replayer.prototype.applyIncremental = function (e, isSync) {
        var _this = this;
        var d = e.data;
        switch (d.source) {
            case types_1.IncrementalSource.Mutation: {
                if (isSync) {
                    d.adds.forEach(function (m) { return _this.treeIndex.add(m); });
                    d.texts.forEach(function (m) { return _this.treeIndex.text(m); });
                    d.attributes.forEach(function (m) { return _this.treeIndex.attribute(m); });
                    d.removes.forEach(function (m) { return _this.treeIndex.remove(m); });
                }
                this.applyMutation(d, isSync);
                break;
            }
            case types_1.IncrementalSource.MouseMove:
                if (isSync) {
                    var lastPosition = d.positions[d.positions.length - 1];
                    this.moveAndHover(d, lastPosition.x, lastPosition.y, lastPosition.id);
                }
                else {
                    d.positions.forEach(function (p) {
                        var action = {
                            doAction: function () {
                                _this.moveAndHover(d, p.x, p.y, p.id);
                            },
                            delay: p.timeOffset +
                                e.timestamp -
                                _this.service.state.context.baselineTime,
                        };
                        _this.timer.addAction(action);
                    });
                }
                break;
            case types_1.IncrementalSource.MouseInteraction: {
                if (d.id === -1) {
                    break;
                }
                var event_2 = new Event(types_1.MouseInteractions[d.type].toLowerCase());
                var target = utils_1.mirror.getNode(d.id);
                if (!target) {
                    return this.debugNodeNotFound(d, d.id);
                }
                this.emitter.emit(types_1.ReplayerEvents.MouseInteraction, {
                    type: d.type,
                    target: target,
                });
                var triggerFocus = this.config.triggerFocus;
                switch (d.type) {
                    case types_1.MouseInteractions.Blur:
                        if ('blur' in target) {
                            target.blur();
                        }
                        break;
                    case types_1.MouseInteractions.Focus:
                        if (triggerFocus && target.focus) {
                            target.focus({
                                preventScroll: true,
                            });
                        }
                        break;
                    case types_1.MouseInteractions.Click:
                    case types_1.MouseInteractions.TouchStart:
                    case types_1.MouseInteractions.TouchEnd:
                        if (!isSync) {
                            this.moveAndHover(d, d.x, d.y, d.id);
                            this.mouse.classList.remove('active');
                            void this.mouse.offsetWidth;
                            this.mouse.classList.add('active');
                        }
                        break;
                    default:
                        target.dispatchEvent(event_2);
                }
                break;
            }
            case types_1.IncrementalSource.Scroll: {
                if (d.id === -1) {
                    break;
                }
                if (isSync) {
                    this.treeIndex.scroll(d);
                    break;
                }
                this.applyScroll(d);
                break;
            }
            case types_1.IncrementalSource.ViewportResize:
                this.emitter.emit(types_1.ReplayerEvents.Resize, {
                    width: d.width,
                    height: d.height,
                });
                break;
            case types_1.IncrementalSource.Input: {
                if (d.id === -1) {
                    break;
                }
                if (isSync) {
                    this.treeIndex.input(d);
                    break;
                }
                this.applyInput(d);
                break;
            }
            case types_1.IncrementalSource.MediaInteraction: {
                var target = utils_1.mirror.getNode(d.id);
                if (!target) {
                    return this.debugNodeNotFound(d, d.id);
                }
                var mediaEl_1 = target;
                if (d.type === 1) {
                    mediaEl_1.pause();
                }
                if (d.type === 0) {
                    if (mediaEl_1.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                        mediaEl_1.play();
                    }
                    else {
                        mediaEl_1.addEventListener('canplay', function () {
                            mediaEl_1.play();
                        });
                    }
                }
                break;
            }
            case types_1.IncrementalSource.StyleSheetRule: {
                var target = utils_1.mirror.getNode(d.id);
                if (!target) {
                    return this.debugNodeNotFound(d, d.id);
                }
                var styleEl = target;
                var styleSheet_1 = styleEl.sheet;
                if (d.adds) {
                    d.adds.forEach(function (_a) {
                        var rule = _a.rule, index = _a.index;
                        var _index = index === undefined
                            ? undefined
                            : Math.min(index, styleSheet_1.rules.length);
                        try {
                            styleSheet_1.insertRule(rule, _index);
                        }
                        catch (e) {
                        }
                    });
                }
                if (d.removes) {
                    d.removes.forEach(function (_a) {
                        var index = _a.index;
                        styleSheet_1.deleteRule(index);
                    });
                }
                break;
            }
            case types_1.IncrementalSource.CanvasMutation: {
                if (!this.config.UNSAFE_replayCanvas) {
                    return;
                }
                var target = utils_1.mirror.getNode(d.id);
                if (!target) {
                    return this.debugNodeNotFound(d, d.id);
                }
                try {
                    var ctx = target.getContext('2d');
                    if (d.setter) {
                        ctx[d.property] = d.args[0];
                        return;
                    }
                    var original = ctx[d.property];
                    if (d.property === 'drawImage' && typeof d.args[0] === 'string') {
                        var image = this.imageMap.get(e);
                        d.args[0] = image;
                        original.apply(ctx, d.args);
                    }
                    else {
                        original.apply(ctx, d.args);
                    }
                }
                catch (error) {
                    this.warnCanvasMutationFailed(d, d.id, error);
                }
            }
            default:
        }
    };
    Replayer.prototype.applyMutation = function (d, useVirtualParent) {
        var _this = this;
        d.removes.forEach(function (mutation) {
            var target = utils_1.mirror.getNode(mutation.id);
            if (!target) {
                return _this.warnNodeNotFound(d, mutation.id);
            }
            var parent = utils_1.mirror.getNode(mutation.parentId);
            if (!parent) {
                return _this.warnNodeNotFound(d, mutation.parentId);
            }
            utils_1.mirror.removeNodeFromMap(target);
            if (parent) {
                var realParent = _this.fragmentParentMap.get(parent);
                if (realParent && realParent.contains(target)) {
                    realParent.removeChild(target);
                }
                else {
                    parent.removeChild(target);
                }
            }
        });
        var legacy_missingNodeMap = __assign({}, this.legacy_missingNodeRetryMap);
        var queue = [];
        var appendNode = function (mutation) {
            if (!_this.iframe.contentDocument) {
                return console.warn('Looks like your replayer has been destroyed.');
            }
            var parent = utils_1.mirror.getNode(mutation.parentId);
            if (!parent) {
                return queue.push(mutation);
            }
            var parentInDocument = _this.iframe.contentDocument.contains(parent);
            if (useVirtualParent && parentInDocument) {
                var virtualParent = document.createDocumentFragment();
                utils_1.mirror.map[mutation.parentId] = virtualParent;
                _this.fragmentParentMap.set(virtualParent, parent);
                while (parent.firstChild) {
                    virtualParent.appendChild(parent.firstChild);
                }
                parent = virtualParent;
            }
            var previous = null;
            var next = null;
            if (mutation.previousId) {
                previous = utils_1.mirror.getNode(mutation.previousId);
            }
            if (mutation.nextId) {
                next = utils_1.mirror.getNode(mutation.nextId);
            }
            if (mutation.nextId !== null && mutation.nextId !== -1 && !next) {
                return queue.push(mutation);
            }
            var target = rrweb_snapshot_1.buildNodeWithSN(mutation.node, _this.iframe.contentDocument, utils_1.mirror.map, true);
            if (mutation.previousId === -1 || mutation.nextId === -1) {
                legacy_missingNodeMap[mutation.node.id] = {
                    node: target,
                    mutation: mutation,
                };
                return;
            }
            if (previous && previous.nextSibling && previous.nextSibling.parentNode) {
                parent.insertBefore(target, previous.nextSibling);
            }
            else if (next && next.parentNode) {
                parent.contains(next)
                    ? parent.insertBefore(target, next)
                    : parent.insertBefore(target, null);
            }
            else {
                parent.appendChild(target);
            }
            if (mutation.previousId || mutation.nextId) {
                _this.legacy_resolveMissingNode(legacy_missingNodeMap, parent, target, mutation);
            }
        };
        d.adds.forEach(function (mutation) {
            appendNode(mutation);
        });
        while (queue.length) {
            if (queue.every(function (m) { return !Boolean(utils_1.mirror.getNode(m.parentId)); })) {
                return queue.forEach(function (m) { return _this.warnNodeNotFound(d, m.node.id); });
            }
            var mutation = queue.shift();
            appendNode(mutation);
        }
        if (Object.keys(legacy_missingNodeMap).length) {
            Object.assign(this.legacy_missingNodeRetryMap, legacy_missingNodeMap);
        }
        d.texts.forEach(function (mutation) {
            var target = utils_1.mirror.getNode(mutation.id);
            if (!target) {
                return _this.warnNodeNotFound(d, mutation.id);
            }
            if (_this.fragmentParentMap.has(target)) {
                target = _this.fragmentParentMap.get(target);
            }
            target.textContent = mutation.value;
        });
        d.attributes.forEach(function (mutation) {
            var target = utils_1.mirror.getNode(mutation.id);
            if (!target) {
                return _this.warnNodeNotFound(d, mutation.id);
            }
            if (_this.fragmentParentMap.has(target)) {
                target = _this.fragmentParentMap.get(target);
            }
            for (var attributeName in mutation.attributes) {
                if (typeof attributeName === 'string') {
                    var value = mutation.attributes[attributeName];
                    if (value !== null) {
                        target.setAttribute(attributeName, value);
                    }
                    else {
                        target.removeAttribute(attributeName);
                    }
                }
            }
        });
    };
    Replayer.prototype.applyScroll = function (d) {
        var target = utils_1.mirror.getNode(d.id);
        if (!target) {
            return this.debugNodeNotFound(d, d.id);
        }
        if (target === this.iframe.contentDocument) {
            this.iframe.contentWindow.scrollTo({
                top: d.y,
                left: d.x,
                behavior: 'smooth',
            });
        }
        else {
            try {
                target.scrollTop = d.y;
                target.scrollLeft = d.x;
            }
            catch (error) {
            }
        }
    };
    Replayer.prototype.applyInput = function (d) {
        var target = utils_1.mirror.getNode(d.id);
        if (!target) {
            return this.debugNodeNotFound(d, d.id);
        }
        try {
            target.checked = d.isChecked;
            target.value = d.text;
        }
        catch (error) {
        }
    };
    Replayer.prototype.legacy_resolveMissingNode = function (map, parent, target, targetMutation) {
        var previousId = targetMutation.previousId, nextId = targetMutation.nextId;
        var previousInMap = previousId && map[previousId];
        var nextInMap = nextId && map[nextId];
        if (previousInMap) {
            var _a = previousInMap, node = _a.node, mutation = _a.mutation;
            parent.insertBefore(node, target);
            delete map[mutation.node.id];
            delete this.legacy_missingNodeRetryMap[mutation.node.id];
            if (mutation.previousId || mutation.nextId) {
                this.legacy_resolveMissingNode(map, parent, node, mutation);
            }
        }
        if (nextInMap) {
            var _b = nextInMap, node = _b.node, mutation = _b.mutation;
            parent.insertBefore(node, target.nextSibling);
            delete map[mutation.node.id];
            delete this.legacy_missingNodeRetryMap[mutation.node.id];
            if (mutation.previousId || mutation.nextId) {
                this.legacy_resolveMissingNode(map, parent, node, mutation);
            }
        }
    };
    Replayer.prototype.moveAndHover = function (d, x, y, id) {
        this.mouse.style.left = x + "px";
        this.mouse.style.top = y + "px";
        var target = utils_1.mirror.getNode(id);
        if (!target) {
            return this.debugNodeNotFound(d, id);
        }
        this.hoverElements(target);
    };
    Replayer.prototype.hoverElements = function (el) {
        var _a;
        (_a = this.iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelectorAll('.\\:hover').forEach(function (hoveredEl) {
            hoveredEl.classList.remove(':hover');
        });
        var currentEl = el;
        while (currentEl) {
            if (currentEl.classList) {
                currentEl.classList.add(':hover');
            }
            currentEl = currentEl.parentElement;
        }
    };
    Replayer.prototype.isUserInteraction = function (event) {
        if (event.type !== types_1.EventType.IncrementalSnapshot) {
            return false;
        }
        return (event.data.source > types_1.IncrementalSource.Mutation &&
            event.data.source <= types_1.IncrementalSource.Input);
    };
    Replayer.prototype.backToNormal = function () {
        this.nextUserInteractionEvent = null;
        if (this.speedService.state.matches('normal')) {
            return;
        }
        this.speedService.send({ type: 'BACK_TO_NORMAL' });
        this.emitter.emit(types_1.ReplayerEvents.SkipEnd, {
            speed: this.speedService.state.context.normalSpeed,
        });
    };
    Replayer.prototype.warnNodeNotFound = function (d, id) {
        if (!this.config.showWarning) {
            return;
        }
        console.warn(REPLAY_CONSOLE_PREFIX, "Node with id '" + id + "' not found in", d);
    };
    Replayer.prototype.warnCanvasMutationFailed = function (d, id, error) {
        console.warn(REPLAY_CONSOLE_PREFIX, "Has error on update canvas '" + id + "'", d, error);
    };
    Replayer.prototype.debugNodeNotFound = function (d, id) {
        if (!this.config.showDebug) {
            return;
        }
        console.log(REPLAY_CONSOLE_PREFIX, "Node with id '" + id + "' not found in", d);
    };
    return Replayer;
}());
exports.Replayer = Replayer;
//# sourceMappingURL=index.js.map