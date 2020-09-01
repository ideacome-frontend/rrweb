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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpeedService = exports.createPlayerService = exports.discardPriorSnapshots = void 0;
var fsm_1 = require("@xstate/fsm");
var types_1 = require("../types");
var timer_1 = require("./timer");
var utils_1 = require("../utils");
function discardPriorSnapshots(events, baselineTime) {
    for (var idx = events.length - 1; idx >= 0; idx--) {
        var event_1 = events[idx];
        if (event_1.type === types_1.EventType.Meta) {
            if (event_1.timestamp <= baselineTime) {
                return events.slice(idx);
            }
        }
    }
    return events;
}
exports.discardPriorSnapshots = discardPriorSnapshots;
function createPlayerService(context, _a) {
    var getCastFn = _a.getCastFn, emitter = _a.emitter;
    var playerMachine = fsm_1.createMachine({
        id: 'player',
        context: context,
        initial: 'paused',
        states: {
            playing: {
                on: {
                    PAUSE: {
                        target: 'paused',
                        actions: ['pause'],
                    },
                    CAST_EVENT: {
                        target: 'playing',
                        actions: 'castEvent',
                    },
                    END: {
                        target: 'paused',
                        actions: ['resetLastPlayedEvent', 'pause'],
                    },
                },
            },
            paused: {
                on: {
                    PLAY: {
                        target: 'playing',
                        actions: ['recordTimeOffset', 'play'],
                    },
                    CAST_EVENT: {
                        target: 'paused',
                        actions: 'castEvent',
                    },
                    TO_LIVE: {
                        target: 'live',
                        actions: ['startLive']
                    }
                },
            },
            live: {
                on: {
                    ADD_EVENT: {
                        target: 'live',
                        actions: ['addEvent'],
                    },
                },
            },
        },
    }, {
        actions: {
            castEvent: fsm_1.assign({
                lastPlayedEvent: function (ctx, event) {
                    if (event.type === 'CAST_EVENT') {
                        return event.payload.event;
                    }
                    return ctx.lastPlayedEvent;
                },
            }),
            recordTimeOffset: fsm_1.assign(function (ctx, event) {
                var timeOffset = ctx.timeOffset;
                if ('payload' in event && 'timeOffset' in event.payload) {
                    timeOffset = event.payload.timeOffset;
                }
                return __assign(__assign({}, ctx), { timeOffset: timeOffset, baselineTime: ctx.events[0].timestamp + timeOffset });
            }),
            play: function (ctx) {
                var e_1, _a, e_2, _b;
                var timer = ctx.timer, events = ctx.events, baselineTime = ctx.baselineTime, lastPlayedEvent = ctx.lastPlayedEvent;
                timer.clear();
                try {
                    for (var events_1 = __values(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
                        var event_2 = events_1_1.value;
                        timer_1.addDelay(event_2, baselineTime);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var neededEvents = discardPriorSnapshots(events, baselineTime);
                var actions = new Array();
                var _loop_1 = function (event_3) {
                    if (lastPlayedEvent &&
                        lastPlayedEvent.timestamp < baselineTime &&
                        (event_3.timestamp <= lastPlayedEvent.timestamp ||
                            event_3 === lastPlayedEvent)) {
                        return "continue";
                    }
                    var isSync = event_3.timestamp < baselineTime;
                    if (isSync && !utils_1.needCastInSyncMode(event_3)) {
                        return "continue";
                    }
                    var castFn = getCastFn(event_3, isSync);
                    if (isSync) {
                        castFn();
                    }
                    else {
                        actions.push({
                            doAction: function () {
                                castFn();
                                emitter.emit(types_1.ReplayerEvents.EventCast, event_3);
                            },
                            delay: event_3.delay,
                        });
                    }
                };
                try {
                    for (var neededEvents_1 = __values(neededEvents), neededEvents_1_1 = neededEvents_1.next(); !neededEvents_1_1.done; neededEvents_1_1 = neededEvents_1.next()) {
                        var event_3 = neededEvents_1_1.value;
                        _loop_1(event_3);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (neededEvents_1_1 && !neededEvents_1_1.done && (_b = neededEvents_1.return)) _b.call(neededEvents_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                emitter.emit(types_1.ReplayerEvents.Flush);
                timer.addActions(actions);
                timer.start();
            },
            pause: function (ctx) {
                ctx.timer.clear();
            },
            resetLastPlayedEvent: fsm_1.assign(function (ctx) {
                return __assign(__assign({}, ctx), { lastPlayedEvent: null });
            }),
            startLive: fsm_1.assign({
                baselineTime: function (ctx, event) {
                    ctx.timer.toggleLiveMode(true);
                    ctx.timer.start();
                    if (event.type === 'TO_LIVE' && event.payload.baselineTime) {
                        return event.payload.baselineTime;
                    }
                    return Date.now();
                },
            }),
            addEvent: fsm_1.assign(function (ctx, machineEvent) {
                var baselineTime = ctx.baselineTime, timer = ctx.timer, events = ctx.events;
                if (machineEvent.type === 'ADD_EVENT') {
                    var event_4 = machineEvent.payload.event;
                    timer_1.addDelay(event_4, baselineTime);
                    events.push(event_4);
                    var isSync = event_4.timestamp < baselineTime;
                    var castFn_1 = getCastFn(event_4, isSync);
                    if (isSync) {
                        castFn_1();
                    }
                    else {
                        timer.addAction({
                            doAction: function () {
                                castFn_1();
                                emitter.emit(types_1.ReplayerEvents.EventCast, event_4);
                            },
                            delay: event_4.delay,
                        });
                    }
                }
                return __assign(__assign({}, ctx), { events: events });
            }),
        },
    });
    return fsm_1.interpret(playerMachine);
}
exports.createPlayerService = createPlayerService;
function createSpeedService(context) {
    var speedMachine = fsm_1.createMachine({
        id: 'speed',
        context: context,
        initial: 'normal',
        states: {
            normal: {
                on: {
                    FAST_FORWARD: {
                        target: 'skipping',
                        actions: ['recordSpeed', 'setSpeed'],
                    },
                    SET_SPEED: {
                        target: 'normal',
                        actions: ['setSpeed'],
                    },
                },
            },
            skipping: {
                on: {
                    BACK_TO_NORMAL: {
                        target: 'normal',
                        actions: ['restoreSpeed'],
                    },
                    SET_SPEED: {
                        target: 'normal',
                        actions: ['setSpeed'],
                    },
                },
            },
        },
    }, {
        actions: {
            setSpeed: function (ctx, event) {
                if ('payload' in event) {
                    ctx.timer.setSpeed(event.payload.speed);
                }
            },
            recordSpeed: fsm_1.assign({
                normalSpeed: function (ctx) { return ctx.timer.speed; },
            }),
            restoreSpeed: function (ctx) {
                ctx.timer.setSpeed(ctx.normalSpeed);
            },
        },
    });
    return fsm_1.interpret(speedMachine);
}
exports.createSpeedService = createSpeedService;
//# sourceMappingURL=machine.js.map