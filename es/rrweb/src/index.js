export { EventType, IncrementalSource, MouseInteractions, ReplayerEvents } from './types.js';
import * as utils from './utils.js';
export { utils };
export { mirror } from './utils.js';
import record from './record/index.js';
export { default as record } from './record/index.js';
export { Replayer } from './replay/index.js';

var addCustomEvent = record.addCustomEvent;

export { addCustomEvent };
