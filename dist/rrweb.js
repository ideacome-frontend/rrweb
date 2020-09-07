var rrweb = (function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
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
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    var NodeType;
    (function (NodeType) {
        NodeType[NodeType["Document"] = 0] = "Document";
        NodeType[NodeType["DocumentType"] = 1] = "DocumentType";
        NodeType[NodeType["Element"] = 2] = "Element";
        NodeType[NodeType["Text"] = 3] = "Text";
        NodeType[NodeType["CDATA"] = 4] = "CDATA";
        NodeType[NodeType["Comment"] = 5] = "Comment";
    })(NodeType || (NodeType = {}));

    var _id = 1;
    var tagNameRegex = RegExp('[^a-z1-6-_]');
    function genId() {
        return _id++;
    }
    function getValidTagName(tagName) {
        var processedTagName = tagName.toLowerCase().trim();
        if (tagNameRegex.test(processedTagName)) {
            return 'div';
        }
        return processedTagName;
    }
    function getCssRulesString(s) {
        try {
            var rules = s.rules || s.cssRules;
            return rules
                ? Array.from(rules).reduce(function (prev, cur) { return prev + getCssRuleString(cur); }, '')
                : null;
        }
        catch (error) {
            return null;
        }
    }
    function getCssRuleString(rule) {
        return isCSSImportRule(rule)
            ? getCssRulesString(rule.styleSheet) || ''
            : rule.cssText;
    }
    function isCSSImportRule(rule) {
        return 'styleSheet' in rule;
    }
    function extractOrigin(url) {
        var origin;
        if (url.indexOf('//') > -1) {
            origin = url.split('/').slice(0, 3).join('/');
        }
        else {
            origin = url.split('/')[0];
        }
        origin = origin.split('?')[0];
        return origin;
    }
    var URL_IN_CSS_REF = /url\((?:'([^']*)'|"([^"]*)"|([^)]*))\)/gm;
    var RELATIVE_PATH = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/).*/;
    var DATA_URI = /^(data:)([\w\/\+\-]+);(charset=[\w-]+|base64).*,(.*)/i;
    function absoluteToStylesheet(cssText, href) {
        return (cssText || '').replace(URL_IN_CSS_REF, function (origin, path1, path2, path3) {
            var filePath = path1 || path2 || path3;
            if (!filePath) {
                return origin;
            }
            if (!RELATIVE_PATH.test(filePath)) {
                return "url('" + filePath + "')";
            }
            if (DATA_URI.test(filePath)) {
                return "url(" + filePath + ")";
            }
            if (filePath[0] === '/') {
                return "url('" + (extractOrigin(href) + filePath) + "')";
            }
            var stack = href.split('/');
            var parts = filePath.split('/');
            stack.pop();
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                if (part === '.') {
                    continue;
                }
                else if (part === '..') {
                    stack.pop();
                }
                else {
                    stack.push(part);
                }
            }
            return "url('" + stack.join('/') + "')";
        });
    }
    function getAbsoluteSrcsetString(doc, attributeValue) {
        if (attributeValue.trim() === '') {
            return attributeValue;
        }
        var srcsetValues = attributeValue.split(',');
        var resultingSrcsetString = srcsetValues
            .map(function (srcItem) {
            var trimmedSrcItem = srcItem.trimLeft().trimRight();
            var urlAndSize = trimmedSrcItem.split(' ');
            if (urlAndSize.length === 2) {
                var absUrl = absoluteToDoc(doc, urlAndSize[0]);
                return absUrl + " " + urlAndSize[1];
            }
            else if (urlAndSize.length === 1) {
                var absUrl = absoluteToDoc(doc, urlAndSize[0]);
                return "" + absUrl;
            }
            return '';
        })
            .join(', ');
        return resultingSrcsetString;
    }
    function absoluteToDoc(doc, attributeValue) {
        if (!attributeValue || attributeValue.trim() === '') {
            return attributeValue;
        }
        var a = doc.createElement('a');
        a.href = attributeValue;
        return a.href;
    }
    function isSVGElement(el) {
        return el.tagName === 'svg' || el instanceof SVGElement;
    }
    function transformAttribute(doc, name, value) {
        if (name === 'src' || (name === 'href' && value)) {
            return absoluteToDoc(doc, value);
        }
        else if (name === 'srcset' && value) {
            return getAbsoluteSrcsetString(doc, value);
        }
        else if (name === 'style' && value) {
            return absoluteToStylesheet(value, location.href);
        }
        else {
            return value;
        }
    }
    function serializeNode(n, doc, blockClass, inlineStylesheet, maskInputOptions, recordCanvas) {
        if (maskInputOptions === void 0) { maskInputOptions = {}; }
        switch (n.nodeType) {
            case n.DOCUMENT_NODE:
                return {
                    type: NodeType.Document,
                    childNodes: [],
                };
            case n.DOCUMENT_TYPE_NODE:
                return {
                    type: NodeType.DocumentType,
                    name: n.name,
                    publicId: n.publicId,
                    systemId: n.systemId,
                };
            case n.ELEMENT_NODE:
                var needBlock_1 = false;
                if (typeof blockClass === 'string') {
                    needBlock_1 = n.classList.contains(blockClass);
                }
                else {
                    n.classList.forEach(function (className) {
                        if (blockClass.test(className)) {
                            needBlock_1 = true;
                        }
                    });
                }
                var tagName = getValidTagName(n.tagName);
                var attributes_1 = {};
                for (var _i = 0, _a = Array.from(n.attributes); _i < _a.length; _i++) {
                    var _b = _a[_i], name = _b.name, value = _b.value;
                    attributes_1[name] = transformAttribute(doc, name, value);
                }
                if (tagName === 'link' && inlineStylesheet) {
                    var stylesheet = Array.from(doc.styleSheets).find(function (s) {
                        return s.href === n.href;
                    });
                    var cssText = getCssRulesString(stylesheet);
                    if (cssText) {
                        delete attributes_1.rel;
                        delete attributes_1.href;
                        attributes_1._cssText = absoluteToStylesheet(cssText, stylesheet.href);
                    }
                }
                if (tagName === 'style' &&
                    n.sheet &&
                    !(n.innerText ||
                        n.textContent ||
                        '').trim().length) {
                    var cssText = getCssRulesString(n.sheet);
                    if (cssText) {
                        attributes_1._cssText = absoluteToStylesheet(cssText, location.href);
                    }
                }
                if (tagName === 'input' ||
                    tagName === 'textarea' ||
                    tagName === 'select') {
                    var value = n.value;
                    if (attributes_1.type !== 'radio' &&
                        attributes_1.type !== 'checkbox' &&
                        attributes_1.type !== 'submit' &&
                        attributes_1.type !== 'button' &&
                        value) {
                        attributes_1.value =
                            maskInputOptions[attributes_1.type] ||
                                maskInputOptions[tagName]
                                ? '*'.repeat(value.length)
                                : value;
                    }
                    else if (n.checked) {
                        attributes_1.checked = n.checked;
                    }
                }
                if (tagName === 'option') {
                    var selectValue = n.parentElement;
                    if (attributes_1.value === selectValue.value) {
                        attributes_1.selected = n.selected;
                    }
                }
                if (tagName === 'canvas' && recordCanvas) {
                    attributes_1.rr_dataURL = n.toDataURL();
                }
                if (tagName === 'audio' || tagName === 'video') {
                    attributes_1.rr_mediaState = n.paused
                        ? 'paused'
                        : 'played';
                }
                if (n.scrollLeft) {
                    attributes_1.rr_scrollLeft = n.scrollLeft;
                }
                if (n.scrollTop) {
                    attributes_1.rr_scrollTop = n.scrollTop;
                }
                if (needBlock_1) {
                    var _c = n.getBoundingClientRect(), width = _c.width, height = _c.height;
                    attributes_1.rr_width = width + "px";
                    attributes_1.rr_height = height + "px";
                }
                return {
                    type: NodeType.Element,
                    tagName: tagName,
                    attributes: attributes_1,
                    childNodes: [],
                    isSVG: isSVGElement(n) || undefined,
                    needBlock: needBlock_1,
                };
            case n.TEXT_NODE:
                var parentTagName = n.parentNode && n.parentNode.tagName;
                var textContent = n.textContent;
                var isStyle = parentTagName === 'STYLE' ? true : undefined;
                if (isStyle && textContent) {
                    textContent = absoluteToStylesheet(textContent, location.href);
                }
                if (parentTagName === 'SCRIPT') {
                    textContent = 'SCRIPT_PLACEHOLDER';
                }
                return {
                    type: NodeType.Text,
                    textContent: textContent || '',
                    isStyle: isStyle,
                };
            case n.CDATA_SECTION_NODE:
                return {
                    type: NodeType.CDATA,
                    textContent: '',
                };
            case n.COMMENT_NODE:
                return {
                    type: NodeType.Comment,
                    textContent: n.textContent || '',
                };
            default:
                return false;
        }
    }
    function serializeNodeWithId(n, doc, map, blockClass, skipChild, inlineStylesheet, maskInputOptions, recordCanvas) {
        if (skipChild === void 0) { skipChild = false; }
        if (inlineStylesheet === void 0) { inlineStylesheet = true; }
        var _serializedNode = serializeNode(n, doc, blockClass, inlineStylesheet, maskInputOptions, recordCanvas || false);
        if (!_serializedNode) {
            console.warn(n, 'not serialized');
            return null;
        }
        var id;
        if ('__sn' in n) {
            id = n.__sn.id;
        }
        else {
            id = genId();
        }
        var serializedNode = Object.assign(_serializedNode, { id: id });
        n.__sn = serializedNode;
        map[id] = n;
        var recordChild = !skipChild;
        if (serializedNode.type === NodeType.Element) {
            recordChild = recordChild && !serializedNode.needBlock;
            delete serializedNode.needBlock;
        }
        if ((serializedNode.type === NodeType.Document ||
            serializedNode.type === NodeType.Element) &&
            recordChild) {
            for (var _i = 0, _a = Array.from(n.childNodes); _i < _a.length; _i++) {
                var childN = _a[_i];
                var serializedChildNode = serializeNodeWithId(childN, doc, map, blockClass, skipChild, inlineStylesheet, maskInputOptions, recordCanvas);
                if (serializedChildNode) {
                    serializedNode.childNodes.push(serializedChildNode);
                }
            }
        }
        return serializedNode;
    }
    function snapshot(n, blockClass, inlineStylesheet, maskAllInputsOrOptions, recordCanvas) {
        if (blockClass === void 0) { blockClass = 'rr-block'; }
        if (inlineStylesheet === void 0) { inlineStylesheet = true; }
        var idNodeMap = {};
        var maskInputOptions = maskAllInputsOrOptions === true
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
            : maskAllInputsOrOptions === false
                ? {}
                : maskAllInputsOrOptions;
        return [
            serializeNodeWithId(n, n, idNodeMap, blockClass, false, inlineStylesheet, maskInputOptions, recordCanvas),
            idNodeMap,
        ];
    }

    var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;
    function parse(css, options) {
        if (options === void 0) { options = {}; }
        var lineno = 1;
        var column = 1;
        function updatePosition(str) {
            var lines = str.match(/\n/g);
            if (lines) {
                lineno += lines.length;
            }
            var i = str.lastIndexOf('\n');
            column = i === -1 ? column + str.length : str.length - i;
        }
        function position() {
            var start = { line: lineno, column: column };
            return function (node) {
                node.position = new Position(start);
                whitespace();
                return node;
            };
        }
        var Position = (function () {
            function Position(start) {
                this.start = start;
                this.end = { line: lineno, column: column };
                this.source = options.source;
            }
            return Position;
        }());
        Position.prototype.content = css;
        var errorsList = [];
        function error(msg) {
            var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
            err.reason = msg;
            err.filename = options.source;
            err.line = lineno;
            err.column = column;
            err.source = css;
            if (options.silent) {
                errorsList.push(err);
            }
            else {
                throw err;
            }
        }
        function stylesheet() {
            var rulesList = rules();
            return {
                type: 'stylesheet',
                stylesheet: {
                    source: options.source,
                    rules: rulesList,
                    parsingErrors: errorsList,
                },
            };
        }
        function open() {
            return match(/^{\s*/);
        }
        function close() {
            return match(/^}/);
        }
        function rules() {
            var node;
            var rules = [];
            whitespace();
            comments(rules);
            while (css.length && css.charAt(0) !== '}' && (node = atrule() || rule())) {
                if (node !== false) {
                    rules.push(node);
                    comments(rules);
                }
            }
            return rules;
        }
        function match(re) {
            var m = re.exec(css);
            if (!m) {
                return;
            }
            var str = m[0];
            updatePosition(str);
            css = css.slice(str.length);
            return m;
        }
        function whitespace() {
            match(/^\s*/);
        }
        function comments(rules) {
            if (rules === void 0) { rules = []; }
            var c;
            while ((c = comment())) {
                if (c !== false) {
                    rules.push(c);
                }
                c = comment();
            }
            return rules;
        }
        function comment() {
            var pos = position();
            if ('/' !== css.charAt(0) || '*' !== css.charAt(1)) {
                return;
            }
            var i = 2;
            while ('' !== css.charAt(i) &&
                ('*' !== css.charAt(i) || '/' !== css.charAt(i + 1))) {
                ++i;
            }
            i += 2;
            if ('' === css.charAt(i - 1)) {
                return error('End of comment missing');
            }
            var str = css.slice(2, i - 2);
            column += 2;
            updatePosition(str);
            css = css.slice(i);
            column += 2;
            return pos({
                type: 'comment',
                comment: str,
            });
        }
        function selector() {
            var m = match(/^([^{]+)/);
            if (!m) {
                return;
            }
            return trim(m[0])
                .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
                .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (m) {
                return m.replace(/,/g, '\u200C');
            })
                .split(/\s*(?![^(]*\)),\s*/)
                .map(function (s) {
                return s.replace(/\u200C/g, ',');
            });
        }
        function declaration() {
            var pos = position();
            var propMatch = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
            if (!propMatch) {
                return;
            }
            var prop = trim(propMatch[0]);
            if (!match(/^:\s*/)) {
                return error("property missing ':'");
            }
            var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);
            var ret = pos({
                type: 'declaration',
                property: prop.replace(commentre, ''),
                value: val ? trim(val[0]).replace(commentre, '') : '',
            });
            match(/^[;\s]*/);
            return ret;
        }
        function declarations() {
            var decls = [];
            if (!open()) {
                return error("missing '{'");
            }
            comments(decls);
            var decl;
            while ((decl = declaration())) {
                if (decl !== false) {
                    decls.push(decl);
                    comments(decls);
                }
                decl = declaration();
            }
            if (!close()) {
                return error("missing '}'");
            }
            return decls;
        }
        function keyframe() {
            var m;
            var vals = [];
            var pos = position();
            while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
                vals.push(m[1]);
                match(/^,\s*/);
            }
            if (!vals.length) {
                return;
            }
            return pos({
                type: 'keyframe',
                values: vals,
                declarations: declarations(),
            });
        }
        function atkeyframes() {
            var pos = position();
            var m = match(/^@([-\w]+)?keyframes\s*/);
            if (!m) {
                return;
            }
            var vendor = m[1];
            m = match(/^([-\w]+)\s*/);
            if (!m) {
                return error('@keyframes missing name');
            }
            var name = m[1];
            if (!open()) {
                return error("@keyframes missing '{'");
            }
            var frame;
            var frames = comments();
            while ((frame = keyframe())) {
                frames.push(frame);
                frames = frames.concat(comments());
            }
            if (!close()) {
                return error("@keyframes missing '}'");
            }
            return pos({
                type: 'keyframes',
                name: name,
                vendor: vendor,
                keyframes: frames,
            });
        }
        function atsupports() {
            var pos = position();
            var m = match(/^@supports *([^{]+)/);
            if (!m) {
                return;
            }
            var supports = trim(m[1]);
            if (!open()) {
                return error("@supports missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@supports missing '}'");
            }
            return pos({
                type: 'supports',
                supports: supports,
                rules: style,
            });
        }
        function athost() {
            var pos = position();
            var m = match(/^@host\s*/);
            if (!m) {
                return;
            }
            if (!open()) {
                return error("@host missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@host missing '}'");
            }
            return pos({
                type: 'host',
                rules: style,
            });
        }
        function atmedia() {
            var pos = position();
            var m = match(/^@media *([^{]+)/);
            if (!m) {
                return;
            }
            var media = trim(m[1]);
            if (!open()) {
                return error("@media missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@media missing '}'");
            }
            return pos({
                type: 'media',
                media: media,
                rules: style,
            });
        }
        function atcustommedia() {
            var pos = position();
            var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
            if (!m) {
                return;
            }
            return pos({
                type: 'custom-media',
                name: trim(m[1]),
                media: trim(m[2]),
            });
        }
        function atpage() {
            var pos = position();
            var m = match(/^@page */);
            if (!m) {
                return;
            }
            var sel = selector() || [];
            if (!open()) {
                return error("@page missing '{'");
            }
            var decls = comments();
            var decl;
            while ((decl = declaration())) {
                decls.push(decl);
                decls = decls.concat(comments());
            }
            if (!close()) {
                return error("@page missing '}'");
            }
            return pos({
                type: 'page',
                selectors: sel,
                declarations: decls,
            });
        }
        function atdocument() {
            var pos = position();
            var m = match(/^@([-\w]+)?document *([^{]+)/);
            if (!m) {
                return;
            }
            var vendor = trim(m[1]);
            var doc = trim(m[2]);
            if (!open()) {
                return error("@document missing '{'");
            }
            var style = comments().concat(rules());
            if (!close()) {
                return error("@document missing '}'");
            }
            return pos({
                type: 'document',
                document: doc,
                vendor: vendor,
                rules: style,
            });
        }
        function atfontface() {
            var pos = position();
            var m = match(/^@font-face\s*/);
            if (!m) {
                return;
            }
            if (!open()) {
                return error("@font-face missing '{'");
            }
            var decls = comments();
            var decl;
            while ((decl = declaration())) {
                decls.push(decl);
                decls = decls.concat(comments());
            }
            if (!close()) {
                return error("@font-face missing '}'");
            }
            return pos({
                type: 'font-face',
                declarations: decls,
            });
        }
        var atimport = _compileAtrule('import');
        var atcharset = _compileAtrule('charset');
        var atnamespace = _compileAtrule('namespace');
        function _compileAtrule(name) {
            var re = new RegExp('^@' + name + '\\s*([^;]+);');
            return function () {
                var pos = position();
                var m = match(re);
                if (!m) {
                    return;
                }
                var ret = { type: name };
                ret[name] = m[1].trim();
                return pos(ret);
            };
        }
        function atrule() {
            if (css[0] !== '@') {
                return;
            }
            return (atkeyframes() ||
                atmedia() ||
                atcustommedia() ||
                atsupports() ||
                atimport() ||
                atcharset() ||
                atnamespace() ||
                atdocument() ||
                atpage() ||
                athost() ||
                atfontface());
        }
        function rule() {
            var pos = position();
            var sel = selector();
            if (!sel) {
                return error('selector missing');
            }
            comments();
            return pos({
                type: 'rule',
                selectors: sel,
                declarations: declarations(),
            });
        }
        return addParent(stylesheet());
    }
    function trim(str) {
        return str ? str.replace(/^\s+|\s+$/g, '') : '';
    }
    function addParent(obj, parent) {
        var isNode = obj && typeof obj.type === 'string';
        var childParent = isNode ? obj : parent;
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            var value = obj[k];
            if (Array.isArray(value)) {
                value.forEach(function (v) {
                    addParent(v, childParent);
                });
            }
            else if (value && typeof value === 'object') {
                addParent(value, childParent);
            }
        }
        if (isNode) {
            Object.defineProperty(obj, 'parent', {
                configurable: true,
                writable: true,
                enumerable: false,
                value: parent || null,
            });
        }
        return obj;
    }

    var tagMap = {
        script: 'noscript',
        altglyph: 'altGlyph',
        altglyphdef: 'altGlyphDef',
        altglyphitem: 'altGlyphItem',
        animatecolor: 'animateColor',
        animatemotion: 'animateMotion',
        animatetransform: 'animateTransform',
        clippath: 'clipPath',
        feblend: 'feBlend',
        fecolormatrix: 'feColorMatrix',
        fecomponenttransfer: 'feComponentTransfer',
        fecomposite: 'feComposite',
        feconvolvematrix: 'feConvolveMatrix',
        fediffuselighting: 'feDiffuseLighting',
        fedisplacementmap: 'feDisplacementMap',
        fedistantlight: 'feDistantLight',
        fedropshadow: 'feDropShadow',
        feflood: 'feFlood',
        fefunca: 'feFuncA',
        fefuncb: 'feFuncB',
        fefuncg: 'feFuncG',
        fefuncr: 'feFuncR',
        fegaussianblur: 'feGaussianBlur',
        feimage: 'feImage',
        femerge: 'feMerge',
        femergenode: 'feMergeNode',
        femorphology: 'feMorphology',
        feoffset: 'feOffset',
        fepointlight: 'fePointLight',
        fespecularlighting: 'feSpecularLighting',
        fespotlight: 'feSpotLight',
        fetile: 'feTile',
        feturbulence: 'feTurbulence',
        foreignobject: 'foreignObject',
        glyphref: 'glyphRef',
        lineargradient: 'linearGradient',
        radialgradient: 'radialGradient',
    };
    function getTagName(n) {
        var tagName = tagMap[n.tagName] ? tagMap[n.tagName] : n.tagName;
        if (tagName === 'link' && n.attributes._cssText) {
            tagName = 'style';
        }
        return tagName;
    }
    var HOVER_SELECTOR = /([^\\]):hover/g;
    function addHoverClass(cssText) {
        var ast = parse(cssText, { silent: true });
        if (!ast.stylesheet) {
            return cssText;
        }
        ast.stylesheet.rules.forEach(function (rule) {
            if ('selectors' in rule) {
                (rule.selectors || []).forEach(function (selector) {
                    if (HOVER_SELECTOR.test(selector)) {
                        var newSelector = selector.replace(HOVER_SELECTOR, '$1.\\:hover');
                        cssText = cssText.replace(selector, selector + ", " + newSelector);
                    }
                });
            }
        });
        return cssText;
    }
    function buildNode(n, doc, HACK_CSS) {
        switch (n.type) {
            case NodeType.Document:
                return doc.implementation.createDocument(null, '', null);
            case NodeType.DocumentType:
                return doc.implementation.createDocumentType(n.name, n.publicId, n.systemId);
            case NodeType.Element:
                var tagName = getTagName(n);
                var node_1;
                if (n.isSVG) {
                    node_1 = doc.createElementNS('http://www.w3.org/2000/svg', tagName);
                }
                else {
                    node_1 = doc.createElement(tagName);
                }
                var _loop_1 = function (name) {
                    if (!n.attributes.hasOwnProperty(name)) {
                        return "continue";
                    }
                    var value = n.attributes[name];
                    value =
                        typeof value === 'boolean' || typeof value === 'number' ? '' : value;
                    if (!name.startsWith('rr_')) {
                        var isTextarea = tagName === 'textarea' && name === 'value';
                        var isRemoteOrDynamicCss = tagName === 'style' && name === '_cssText';
                        if (isRemoteOrDynamicCss && HACK_CSS) {
                            value = addHoverClass(value);
                        }
                        if (isTextarea || isRemoteOrDynamicCss) {
                            var child = doc.createTextNode(value);
                            for (var _i = 0, _a = Array.from(node_1.childNodes); _i < _a.length; _i++) {
                                var c = _a[_i];
                                if (c.nodeType === node_1.TEXT_NODE) {
                                    node_1.removeChild(c);
                                }
                            }
                            node_1.appendChild(child);
                            return "continue";
                        }
                        try {
                            if (n.isSVG && name === 'xlink:href') {
                                node_1.setAttributeNS('http://www.w3.org/1999/xlink', name, value);
                            }
                            else if (name === 'onload' ||
                                name === 'onclick' ||
                                name.substring(0, 7) === 'onmouse') {
                                node_1.setAttribute('_' + name, value);
                            }
                            else {
                                node_1.setAttribute(name, value);
                            }
                        }
                        catch (error) {
                        }
                    }
                    else {
                        if (tagName === 'canvas' && name === 'rr_dataURL') {
                            var image_1 = document.createElement('img');
                            image_1.src = value;
                            image_1.onload = function () {
                                var ctx = node_1.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(image_1, 0, 0, image_1.width, image_1.height);
                                }
                            };
                        }
                        if (name === 'rr_width') {
                            node_1.style.width = value;
                        }
                        if (name === 'rr_height') {
                            node_1.style.height = value;
                        }
                        if (name === 'rr_mediaState') {
                            switch (value) {
                                case 'played':
                                    node_1.play();
                                case 'paused':
                                    node_1.pause();
                                    break;
                            }
                        }
                    }
                };
                for (var name in n.attributes) {
                    _loop_1(name);
                }
                return node_1;
            case NodeType.Text:
                return doc.createTextNode(n.isStyle && HACK_CSS ? addHoverClass(n.textContent) : n.textContent);
            case NodeType.CDATA:
                return doc.createCDATASection(n.textContent);
            case NodeType.Comment:
                return doc.createComment(n.textContent);
            default:
                return null;
        }
    }
    function buildNodeWithSN(n, doc, map, skipChild, HACK_CSS) {
        if (skipChild === void 0) { skipChild = false; }
        if (HACK_CSS === void 0) { HACK_CSS = true; }
        var node = buildNode(n, doc, HACK_CSS);
        if (!node) {
            return null;
        }
        if (n.type === NodeType.Document) {
            doc.close();
            doc.open();
            node = doc;
        }
        node.__sn = n;
        map[n.id] = node;
        if ((n.type === NodeType.Document || n.type === NodeType.Element) &&
            !skipChild) {
            for (var _i = 0, _a = n.childNodes; _i < _a.length; _i++) {
                var childN = _a[_i];
                var childNode = buildNodeWithSN(childN, doc, map, false, HACK_CSS);
                if (!childNode) {
                    console.warn('Failed to rebuild', childN);
                }
                else {
                    node.appendChild(childNode);
                }
            }
        }
        return node;
    }
    function visit(idNodeMap, onVisit) {
        function walk(node) {
            onVisit(node);
        }
        for (var key in idNodeMap) {
            if (idNodeMap[key]) {
                walk(idNodeMap[key]);
            }
        }
    }
    function handleScroll(node) {
        var n = node.__sn;
        if (n.type !== NodeType.Element) {
            return;
        }
        var el = node;
        for (var name in n.attributes) {
            if (!(n.attributes.hasOwnProperty(name) && name.startsWith('rr_'))) {
                continue;
            }
            var value = n.attributes[name];
            if (name === 'rr_scrollLeft') {
                el.scrollLeft = value;
            }
            if (name === 'rr_scrollTop') {
                el.scrollTop = value;
            }
        }
    }
    function rebuild(n, doc, onVisit, HACK_CSS) {
        if (HACK_CSS === void 0) { HACK_CSS = true; }
        var idNodeMap = {};
        var node = buildNodeWithSN(n, doc, idNodeMap, false, HACK_CSS);
        visit(idNodeMap, function (visitedNode) {
            if (onVisit) {
                onVisit(visitedNode);
            }
            handleScroll(visitedNode);
        });
        return [node, idNodeMap];
    }

    (function (EventType) {
        EventType[EventType["DomContentLoaded"] = 0] = "DomContentLoaded";
        EventType[EventType["Load"] = 1] = "Load";
        EventType[EventType["FullSnapshot"] = 2] = "FullSnapshot";
        EventType[EventType["IncrementalSnapshot"] = 3] = "IncrementalSnapshot";
        EventType[EventType["Meta"] = 4] = "Meta";
        EventType[EventType["Custom"] = 5] = "Custom";
    })(exports.EventType || (exports.EventType = {}));
    (function (IncrementalSource) {
        IncrementalSource[IncrementalSource["Mutation"] = 0] = "Mutation";
        IncrementalSource[IncrementalSource["MouseMove"] = 1] = "MouseMove";
        IncrementalSource[IncrementalSource["MouseInteraction"] = 2] = "MouseInteraction";
        IncrementalSource[IncrementalSource["Scroll"] = 3] = "Scroll";
        IncrementalSource[IncrementalSource["ViewportResize"] = 4] = "ViewportResize";
        IncrementalSource[IncrementalSource["Input"] = 5] = "Input";
        IncrementalSource[IncrementalSource["TouchMove"] = 6] = "TouchMove";
        IncrementalSource[IncrementalSource["MediaInteraction"] = 7] = "MediaInteraction";
        IncrementalSource[IncrementalSource["StyleSheetRule"] = 8] = "StyleSheetRule";
        IncrementalSource[IncrementalSource["CanvasMutation"] = 9] = "CanvasMutation";
    })(exports.IncrementalSource || (exports.IncrementalSource = {}));
    (function (MouseInteractions) {
        MouseInteractions[MouseInteractions["MouseUp"] = 0] = "MouseUp";
        MouseInteractions[MouseInteractions["MouseDown"] = 1] = "MouseDown";
        MouseInteractions[MouseInteractions["Click"] = 2] = "Click";
        MouseInteractions[MouseInteractions["ContextMenu"] = 3] = "ContextMenu";
        MouseInteractions[MouseInteractions["DblClick"] = 4] = "DblClick";
        MouseInteractions[MouseInteractions["Focus"] = 5] = "Focus";
        MouseInteractions[MouseInteractions["Blur"] = 6] = "Blur";
        MouseInteractions[MouseInteractions["TouchStart"] = 7] = "TouchStart";
        MouseInteractions[MouseInteractions["TouchMove_Departed"] = 8] = "TouchMove_Departed";
        MouseInteractions[MouseInteractions["TouchEnd"] = 9] = "TouchEnd";
    })(exports.MouseInteractions || (exports.MouseInteractions = {}));
    var MediaInteractions;
    (function (MediaInteractions) {
        MediaInteractions[MediaInteractions["Play"] = 0] = "Play";
        MediaInteractions[MediaInteractions["Pause"] = 1] = "Pause";
    })(MediaInteractions || (MediaInteractions = {}));
    (function (ReplayerEvents) {
        ReplayerEvents["Start"] = "start";
        ReplayerEvents["Pause"] = "pause";
        ReplayerEvents["Resume"] = "resume";
        ReplayerEvents["Resize"] = "resize";
        ReplayerEvents["Finish"] = "finish";
        ReplayerEvents["FullsnapshotRebuilded"] = "fullsnapshot-rebuilded";
        ReplayerEvents["LoadStylesheetStart"] = "load-stylesheet-start";
        ReplayerEvents["LoadStylesheetEnd"] = "load-stylesheet-end";
        ReplayerEvents["SkipStart"] = "skip-start";
        ReplayerEvents["SkipEnd"] = "skip-end";
        ReplayerEvents["MouseInteraction"] = "mouse-interaction";
        ReplayerEvents["EventCast"] = "event-cast";
        ReplayerEvents["CustomEvent"] = "custom-event";
        ReplayerEvents["Flush"] = "flush";
        ReplayerEvents["StateChange"] = "state-change";
    })(exports.ReplayerEvents || (exports.ReplayerEvents = {}));

    function on(type, fn, target) {
        if (target === void 0) { target = document; }
        var options = { capture: true, passive: true };
        target.addEventListener(type, fn, options);
        return function () { return target.removeEventListener(type, fn, options); };
    }
    var mirror = {
        map: {},
        getId: function (n) {
            if (!n.__sn) {
                return -1;
            }
            return n.__sn.id;
        },
        getNode: function (id) {
            return mirror.map[id] || null;
        },
        removeNodeFromMap: function (n) {
            var id = n.__sn && n.__sn.id;
            delete mirror.map[id];
            if (n.childNodes) {
                n.childNodes.forEach(function (child) {
                    return mirror.removeNodeFromMap(child);
                });
            }
        },
        has: function (id) {
            return mirror.map.hasOwnProperty(id);
        },
    };
    function throttle(func, wait, options) {
        if (options === void 0) { options = {}; }
        var timeout = null;
        var previous = 0;
        return function (arg) {
            var now = Date.now();
            if (!previous && options.leading === false) {
                previous = now;
            }
            var remaining = wait - (now - previous);
            var context = this;
            var args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    window.clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(context, args);
            }
            else if (!timeout && options.trailing !== false) {
                timeout = window.setTimeout(function () {
                    previous = options.leading === false ? 0 : Date.now();
                    timeout = null;
                    func.apply(context, args);
                }, remaining);
            }
        };
    }
    function hookSetter(target, key, d, isRevoked, win) {
        if (win === void 0) { win = window; }
        var original = win.Object.getOwnPropertyDescriptor(target, key);
        win.Object.defineProperty(target, key, isRevoked
            ? d
            : {
                set: function (value) {
                    var _this = this;
                    setTimeout(function () {
                        d.set.call(_this, value);
                    }, 0);
                    if (original && original.set) {
                        original.set.call(this, value);
                    }
                },
            });
        return function () { return hookSetter(target, key, original || {}, true); };
    }
    function patch(source, name, replacement) {
        try {
            if (!(name in source)) {
                return function () { };
            }
            var original_1 = source[name];
            var wrapped = replacement(original_1);
            if (typeof wrapped === 'function') {
                wrapped.prototype = wrapped.prototype || {};
                Object.defineProperties(wrapped, {
                    __rrweb_original__: {
                        enumerable: false,
                        value: original_1,
                    },
                });
            }
            source[name] = wrapped;
            return function () {
                source[name] = original_1;
            };
        }
        catch (_a) {
            return function () { };
        }
    }
    function getWindowHeight() {
        return (window.innerHeight ||
            (document.documentElement && document.documentElement.clientHeight) ||
            (document.body && document.body.clientHeight));
    }
    function getWindowWidth() {
        return (window.innerWidth ||
            (document.documentElement && document.documentElement.clientWidth) ||
            (document.body && document.body.clientWidth));
    }
    function isBlocked(node, blockClass) {
        if (!node) {
            return false;
        }
        if (node.nodeType === node.ELEMENT_NODE) {
            var needBlock_1 = false;
            if (typeof blockClass === 'string') {
                needBlock_1 = node.classList.contains(blockClass);
            }
            else {
                node.classList.forEach(function (className) {
                    if (blockClass.test(className)) {
                        needBlock_1 = true;
                    }
                });
            }
            return needBlock_1 || isBlocked(node.parentNode, blockClass);
        }
        if (node.nodeType === node.TEXT_NODE) {
            return isBlocked(node.parentNode, blockClass);
        }
        return isBlocked(node.parentNode, blockClass);
    }
    function isAncestorRemoved(target) {
        var id = mirror.getId(target);
        if (!mirror.has(id)) {
            return true;
        }
        if (target.parentNode &&
            target.parentNode.nodeType === target.DOCUMENT_NODE) {
            return false;
        }
        if (!target.parentNode) {
            return true;
        }
        return isAncestorRemoved(target.parentNode);
    }
    function isTouchEvent(event) {
        return Boolean(event.changedTouches);
    }
    function polyfill() {
        if ('NodeList' in window && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = Array.prototype
                .forEach;
        }
    }
    function needCastInSyncMode(event) {
        switch (event.type) {
            case exports.EventType.DomContentLoaded:
            case exports.EventType.Load:
            case exports.EventType.Custom:
                return false;
            case exports.EventType.FullSnapshot:
            case exports.EventType.Meta:
                return true;
        }
        switch (event.data.source) {
            case exports.IncrementalSource.MouseMove:
            case exports.IncrementalSource.MouseInteraction:
            case exports.IncrementalSource.TouchMove:
            case exports.IncrementalSource.MediaInteraction:
                return false;
            case exports.IncrementalSource.ViewportResize:
            case exports.IncrementalSource.StyleSheetRule:
            case exports.IncrementalSource.Scroll:
            case exports.IncrementalSource.Input:
                return true;
        }
        return true;
    }
    var TreeIndex = (function () {
        function TreeIndex() {
            this.reset();
        }
        TreeIndex.prototype.add = function (mutation) {
            var parentTreeNode = this.indexes.get(mutation.parentId);
            var treeNode = {
                id: mutation.node.id,
                mutation: mutation,
                children: [],
                texts: [],
                attributes: [],
            };
            if (!parentTreeNode) {
                this.tree[treeNode.id] = treeNode;
            }
            else {
                treeNode.parent = parentTreeNode;
                parentTreeNode.children[treeNode.id] = treeNode;
            }
            this.indexes.set(treeNode.id, treeNode);
        };
        TreeIndex.prototype.remove = function (mutation) {
            var _this = this;
            var parentTreeNode = this.indexes.get(mutation.parentId);
            var treeNode = this.indexes.get(mutation.id);
            var deepRemoveFromMirror = function (id) {
                _this.removeIdSet.add(id);
                var node = mirror.getNode(id);
                node === null || node === void 0 ? void 0 : node.childNodes.forEach(function (childNode) {
                    return deepRemoveFromMirror(childNode.__sn.id);
                });
            };
            var deepRemoveFromTreeIndex = function (node) {
                _this.removeIdSet.add(node.id);
                Object.values(node.children).forEach(function (n) { return deepRemoveFromTreeIndex(n); });
                var _treeNode = _this.indexes.get(node.id);
                if (_treeNode) {
                    var _parentTreeNode = _treeNode.parent;
                    if (_parentTreeNode) {
                        delete _treeNode.parent;
                        delete _parentTreeNode.children[_treeNode.id];
                        _this.indexes.delete(mutation.id);
                    }
                }
            };
            if (!treeNode) {
                this.removeNodeMutations.push(mutation);
                deepRemoveFromMirror(mutation.id);
            }
            else if (!parentTreeNode) {
                delete this.tree[treeNode.id];
                this.indexes.delete(treeNode.id);
                deepRemoveFromTreeIndex(treeNode);
            }
            else {
                delete treeNode.parent;
                delete parentTreeNode.children[treeNode.id];
                this.indexes.delete(mutation.id);
                deepRemoveFromTreeIndex(treeNode);
            }
        };
        TreeIndex.prototype.text = function (mutation) {
            var treeNode = this.indexes.get(mutation.id);
            if (treeNode) {
                treeNode.texts.push(mutation);
            }
            else {
                this.textMutations.push(mutation);
            }
        };
        TreeIndex.prototype.attribute = function (mutation) {
            var treeNode = this.indexes.get(mutation.id);
            if (treeNode) {
                treeNode.attributes.push(mutation);
            }
            else {
                this.attributeMutations.push(mutation);
            }
        };
        TreeIndex.prototype.scroll = function (d) {
            this.scrollMap.set(d.id, d);
        };
        TreeIndex.prototype.input = function (d) {
            this.inputMap.set(d.id, d);
        };
        TreeIndex.prototype.flush = function () {
            var e_1, _a, e_2, _b;
            var _this = this;
            var _c = this, tree = _c.tree, removeNodeMutations = _c.removeNodeMutations, textMutations = _c.textMutations, attributeMutations = _c.attributeMutations;
            var batchMutationData = {
                source: exports.IncrementalSource.Mutation,
                removes: removeNodeMutations,
                texts: textMutations,
                attributes: attributeMutations,
                adds: [],
            };
            var walk = function (treeNode, removed) {
                if (removed) {
                    _this.removeIdSet.add(treeNode.id);
                }
                batchMutationData.texts = batchMutationData.texts
                    .concat(removed ? [] : treeNode.texts)
                    .filter(function (m) { return !_this.removeIdSet.has(m.id); });
                batchMutationData.attributes = batchMutationData.attributes
                    .concat(removed ? [] : treeNode.attributes)
                    .filter(function (m) { return !_this.removeIdSet.has(m.id); });
                if (!_this.removeIdSet.has(treeNode.id) &&
                    !_this.removeIdSet.has(treeNode.mutation.parentId) &&
                    !removed) {
                    batchMutationData.adds.push(treeNode.mutation);
                    if (treeNode.children) {
                        Object.values(treeNode.children).forEach(function (n) { return walk(n, false); });
                    }
                }
                else {
                    Object.values(treeNode.children).forEach(function (n) { return walk(n, true); });
                }
            };
            Object.values(tree).forEach(function (n) { return walk(n, false); });
            try {
                for (var _d = __values(this.scrollMap.keys()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var id = _e.value;
                    if (this.removeIdSet.has(id)) {
                        this.scrollMap.delete(id);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                for (var _f = __values(this.inputMap.keys()), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var id = _g.value;
                    if (this.removeIdSet.has(id)) {
                        this.inputMap.delete(id);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_2) throw e_2.error; }
            }
            var scrollMap = new Map(this.scrollMap);
            var inputMap = new Map(this.inputMap);
            this.reset();
            return {
                mutationData: batchMutationData,
                scrollMap: scrollMap,
                inputMap: inputMap,
            };
        };
        TreeIndex.prototype.reset = function () {
            this.tree = [];
            this.indexes = new Map();
            this.removeNodeMutations = [];
            this.textMutations = [];
            this.attributeMutations = [];
            this.removeIdSet = new Set();
            this.scrollMap = new Map();
            this.inputMap = new Map();
        };
        return TreeIndex;
    }());

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        on: on,
        mirror: mirror,
        throttle: throttle,
        hookSetter: hookSetter,
        patch: patch,
        getWindowHeight: getWindowHeight,
        getWindowWidth: getWindowWidth,
        isBlocked: isBlocked,
        isAncestorRemoved: isAncestorRemoved,
        isTouchEvent: isTouchEvent,
        polyfill: polyfill,
        needCastInSyncMode: needCastInSyncMode,
        TreeIndex: TreeIndex
    });

    function isNodeInLinkedList(n) {
        return '__ln' in n;
    }
    var DoubleLinkedList = (function () {
        function DoubleLinkedList() {
            this.length = 0;
            this.head = null;
        }
        DoubleLinkedList.prototype.get = function (position) {
            if (position >= this.length) {
                throw new Error('Position outside of list range');
            }
            var current = this.head;
            for (var index = 0; index < position; index++) {
                current = (current === null || current === void 0 ? void 0 : current.next) || null;
            }
            return current;
        };
        DoubleLinkedList.prototype.addNode = function (n) {
            var node = {
                value: n,
                previous: null,
                next: null,
            };
            n.__ln = node;
            if (n.previousSibling && isNodeInLinkedList(n.previousSibling)) {
                var current = n.previousSibling.__ln.next;
                node.next = current;
                node.previous = n.previousSibling.__ln;
                n.previousSibling.__ln.next = node;
                if (current) {
                    current.previous = node;
                }
            }
            else if (n.nextSibling && isNodeInLinkedList(n.nextSibling)) {
                var current = n.nextSibling.__ln.previous;
                node.previous = current;
                node.next = n.nextSibling.__ln;
                n.nextSibling.__ln.previous = node;
                if (current) {
                    current.next = node;
                }
            }
            else {
                if (this.head) {
                    this.head.previous = node;
                }
                node.next = this.head;
                this.head = node;
            }
            this.length++;
        };
        DoubleLinkedList.prototype.removeNode = function (n) {
            var current = n.__ln;
            if (!this.head) {
                return;
            }
            if (!current.previous) {
                this.head = current.next;
                if (this.head) {
                    this.head.previous = null;
                }
            }
            else {
                current.previous.next = current.next;
                if (current.next) {
                    current.next.previous = current.previous;
                }
            }
            this.length--;
        };
        return DoubleLinkedList;
    }());
    var moveKey = function (id, parentId) { return id + "@" + parentId; };
    function isINode(n) {
        return '__sn' in n;
    }
    var MutationBuffer = (function () {
        function MutationBuffer(cb, blockClass, inlineStylesheet, maskInputOptions, recordCanvas) {
            var _this = this;
            this.texts = [];
            this.attributes = [];
            this.removes = [];
            this.adds = [];
            this.movedMap = {};
            this.addedSet = new Set();
            this.movedSet = new Set();
            this.droppedSet = new Set();
            this.processMutations = function (mutations) {
                var e_1, _a, e_2, _b;
                mutations.forEach(_this.processMutation);
                var addList = new DoubleLinkedList();
                var getNextId = function (n) {
                    var nextId = n.nextSibling && mirror.getId(n.nextSibling);
                    if (nextId === -1 && isBlocked(n.nextSibling, _this.blockClass)) {
                        nextId = null;
                    }
                    return nextId;
                };
                var pushAdd = function (n) {
                    if (!n.parentNode) {
                        return;
                    }
                    var parentId = mirror.getId(n.parentNode);
                    var nextId = getNextId(n);
                    if (parentId === -1 || nextId === -1) {
                        return addList.addNode(n);
                    }
                    _this.adds.push({
                        parentId: parentId,
                        nextId: nextId,
                        node: serializeNodeWithId(n, document, mirror.map, _this.blockClass, true, _this.inlineStylesheet, _this.maskInputOptions, _this.recordCanvas),
                    });
                };
                try {
                    for (var _c = __values(_this.movedSet), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var n = _d.value;
                        pushAdd(n);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                try {
                    for (var _e = __values(_this.addedSet), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var n = _f.value;
                        if (!isAncestorInSet(_this.droppedSet, n) &&
                            !isParentRemoved(_this.removes, n)) {
                            pushAdd(n);
                        }
                        else if (isAncestorInSet(_this.movedSet, n)) {
                            pushAdd(n);
                        }
                        else {
                            _this.droppedSet.add(n);
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                var candidate = null;
                while (addList.length) {
                    var node = null;
                    if (candidate) {
                        var parentId = mirror.getId(candidate.value.parentNode);
                        var nextId = getNextId(candidate.value);
                        if (parentId !== -1 && nextId !== -1) {
                            node = candidate;
                        }
                    }
                    if (!node) {
                        for (var index = addList.length - 1; index >= 0; index--) {
                            var _node = addList.get(index);
                            var parentId = mirror.getId(_node.value.parentNode);
                            var nextId = getNextId(_node.value);
                            if (parentId !== -1 && nextId !== -1) {
                                node = _node;
                                break;
                            }
                        }
                    }
                    if (!node) {
                        break;
                    }
                    candidate = node.previous;
                    addList.removeNode(node.value);
                    pushAdd(node.value);
                }
                _this.emit();
            };
            this.emit = function () {
                var payload = {
                    texts: _this.texts
                        .map(function (text) { return ({
                        id: mirror.getId(text.node),
                        value: text.value,
                    }); })
                        .filter(function (text) { return mirror.has(text.id); }),
                    attributes: _this.attributes
                        .map(function (attribute) { return ({
                        id: mirror.getId(attribute.node),
                        attributes: attribute.attributes,
                    }); })
                        .filter(function (attribute) { return mirror.has(attribute.id); }),
                    removes: _this.removes,
                    adds: _this.adds,
                };
                if (!payload.texts.length &&
                    !payload.attributes.length &&
                    !payload.removes.length &&
                    !payload.adds.length) {
                    return;
                }
                _this.emissionCallback(payload);
                _this.texts = [];
                _this.attributes = [];
                _this.removes = [];
                _this.adds = [];
                _this.addedSet = new Set();
                _this.movedSet = new Set();
                _this.droppedSet = new Set();
                _this.movedMap = {};
            };
            this.processMutation = function (m) {
                switch (m.type) {
                    case 'characterData': {
                        var value = m.target.textContent;
                        if (!isBlocked(m.target, _this.blockClass) && value !== m.oldValue) {
                            _this.texts.push({
                                value: value,
                                node: m.target,
                            });
                        }
                        break;
                    }
                    case 'attributes': {
                        var value = m.target.getAttribute(m.attributeName);
                        if (isBlocked(m.target, _this.blockClass) || value === m.oldValue) {
                            return;
                        }
                        var item = _this.attributes.find(function (a) { return a.node === m.target; });
                        if (!item) {
                            item = {
                                node: m.target,
                                attributes: {},
                            };
                            _this.attributes.push(item);
                        }
                        item.attributes[m.attributeName] = transformAttribute(document, m.attributeName, value);
                        break;
                    }
                    case 'childList': {
                        m.addedNodes.forEach(function (n) { return _this.genAdds(n, m.target); });
                        m.removedNodes.forEach(function (n) {
                            var nodeId = mirror.getId(n);
                            var parentId = mirror.getId(m.target);
                            if (isBlocked(n, _this.blockClass) ||
                                isBlocked(m.target, _this.blockClass)) {
                                return;
                            }
                            if (_this.addedSet.has(n)) {
                                deepDelete(_this.addedSet, n);
                                _this.droppedSet.add(n);
                            }
                            else if (_this.addedSet.has(m.target) && nodeId === -1) ;
                            else if (isAncestorRemoved(m.target)) ;
                            else if (_this.movedSet.has(n) &&
                                _this.movedMap[moveKey(nodeId, parentId)]) {
                                deepDelete(_this.movedSet, n);
                            }
                            else {
                                _this.removes.push({
                                    parentId: parentId,
                                    id: nodeId,
                                });
                            }
                            mirror.removeNodeFromMap(n);
                        });
                        break;
                    }
                }
            };
            this.genAdds = function (n, target) {
                if (isBlocked(n, _this.blockClass)) {
                    return;
                }
                if (isINode(n)) {
                    _this.movedSet.add(n);
                    var targetId = null;
                    if (target && isINode(target)) {
                        targetId = target.__sn.id;
                    }
                    if (targetId) {
                        _this.movedMap[moveKey(n.__sn.id, targetId)] = true;
                    }
                }
                else {
                    _this.addedSet.add(n);
                    _this.droppedSet.delete(n);
                }
                n.childNodes.forEach(function (childN) { return _this.genAdds(childN); });
            };
            this.blockClass = blockClass;
            this.inlineStylesheet = inlineStylesheet;
            this.maskInputOptions = maskInputOptions;
            this.recordCanvas = recordCanvas;
            this.emissionCallback = cb;
        }
        return MutationBuffer;
    }());
    function deepDelete(addsSet, n) {
        addsSet.delete(n);
        n.childNodes.forEach(function (childN) { return deepDelete(addsSet, childN); });
    }
    function isParentRemoved(removes, n) {
        var parentNode = n.parentNode;
        if (!parentNode) {
            return false;
        }
        var parentId = mirror.getId(parentNode);
        if (removes.some(function (r) { return r.id === parentId; })) {
            return true;
        }
        return isParentRemoved(removes, parentNode);
    }
    function isAncestorInSet(set, n) {
        var parentNode = n.parentNode;
        if (!parentNode) {
            return false;
        }
        if (set.has(parentNode)) {
            return true;
        }
        return isAncestorInSet(set, parentNode);
    }

    function initMutationObserver(cb, blockClass, inlineStylesheet, maskInputOptions, recordCanvas) {
        var mutationBuffer = new MutationBuffer(cb, blockClass, inlineStylesheet, maskInputOptions, recordCanvas);
        var observer = new MutationObserver(mutationBuffer.processMutations);
        observer.observe(document, {
            attributes: true,
            attributeOldValue: true,
            characterData: true,
            characterDataOldValue: true,
            childList: true,
            subtree: true,
        });
        return observer;
    }
    function initMoveObserver(cb, sampling) {
        if (sampling.mousemove === false) {
            return function () { };
        }
        var threshold = typeof sampling.mousemove === 'number' ? sampling.mousemove : 50;
        var positions = [];
        var timeBaseline;
        var wrappedCb = throttle(function (isTouch) {
            var totalOffset = Date.now() - timeBaseline;
            cb(positions.map(function (p) {
                p.timeOffset -= totalOffset;
                return p;
            }), isTouch ? exports.IncrementalSource.TouchMove : exports.IncrementalSource.MouseMove);
            positions = [];
            timeBaseline = null;
        }, 500);
        var updatePosition = throttle(function (evt) {
            var target = evt.target;
            var _a = isTouchEvent(evt)
                ? evt.changedTouches[0]
                : evt, clientX = _a.clientX, clientY = _a.clientY;
            if (!timeBaseline) {
                timeBaseline = Date.now();
            }
            positions.push({
                x: clientX,
                y: clientY,
                id: mirror.getId(target),
                timeOffset: Date.now() - timeBaseline,
            });
            wrappedCb(isTouchEvent(evt));
        }, threshold, {
            trailing: false,
        });
        var handlers = [
            on('mousemove', updatePosition),
            on('touchmove', updatePosition),
        ];
        return function () {
            handlers.forEach(function (h) { return h(); });
        };
    }
    function initMouseInteractionObserver(cb, blockClass, sampling) {
        if (sampling.mouseInteraction === false) {
            return function () { };
        }
        var disableMap = sampling.mouseInteraction === true ||
            sampling.mouseInteraction === undefined
            ? {}
            : sampling.mouseInteraction;
        var handlers = [];
        var getHandler = function (eventKey) {
            return function (event) {
                if (isBlocked(event.target, blockClass)) {
                    return;
                }
                var id = mirror.getId(event.target);
                var _a = isTouchEvent(event)
                    ? event.changedTouches[0]
                    : event, clientX = _a.clientX, clientY = _a.clientY;
                cb({
                    type: exports.MouseInteractions[eventKey],
                    id: id,
                    x: clientX,
                    y: clientY,
                });
            };
        };
        Object.keys(exports.MouseInteractions)
            .filter(function (key) {
            return Number.isNaN(Number(key)) &&
                !key.endsWith('_Departed') &&
                disableMap[key] !== false;
        })
            .forEach(function (eventKey) {
            var eventName = eventKey.toLowerCase();
            var handler = getHandler(eventKey);
            handlers.push(on(eventName, handler));
        });
        return function () {
            handlers.forEach(function (h) { return h(); });
        };
    }
    function initScrollObserver(cb, blockClass, sampling) {
        var updatePosition = throttle(function (evt) {
            if (!evt.target || isBlocked(evt.target, blockClass)) {
                return;
            }
            var id = mirror.getId(evt.target);
            if (evt.target === document) {
                var scrollEl = (document.scrollingElement || document.documentElement);
                cb({
                    id: id,
                    x: scrollEl.scrollLeft,
                    y: scrollEl.scrollTop,
                });
            }
            else {
                cb({
                    id: id,
                    x: evt.target.scrollLeft,
                    y: evt.target.scrollTop,
                });
            }
        }, sampling.scroll || 100);
        return on('scroll', updatePosition);
    }
    function initViewportResizeObserver(cb) {
        var updateDimension = throttle(function () {
            var height = getWindowHeight();
            var width = getWindowWidth();
            cb({
                width: Number(width),
                height: Number(height),
            });
        }, 200);
        return on('resize', updateDimension, window);
    }
    var INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];
    var lastInputValueMap = new WeakMap();
    function initInputObserver(cb, blockClass, ignoreClass, maskInputOptions, sampling) {
        function eventHandler(event) {
            var target = event.target;
            if (!target ||
                !target.tagName ||
                INPUT_TAGS.indexOf(target.tagName) < 0 ||
                isBlocked(target, blockClass)) {
                return;
            }
            var type = target.type;
            if (type === 'password' ||
                target.classList.contains(ignoreClass)) {
                return;
            }
            var text = target.value;
            var isChecked = false;
            if (type === 'radio' || type === 'checkbox') {
                isChecked = target.checked;
            }
            else if (maskInputOptions[target.tagName.toLowerCase()] ||
                maskInputOptions[type]) {
                text = '*'.repeat(text.length);
            }
            cbWithDedup(target, { text: text, isChecked: isChecked });
            var name = target.name;
            if (type === 'radio' && name && isChecked) {
                document
                    .querySelectorAll("input[type=\"radio\"][name=\"" + name + "\"]")
                    .forEach(function (el) {
                    if (el !== target) {
                        cbWithDedup(el, {
                            text: el.value,
                            isChecked: !isChecked,
                        });
                    }
                });
            }
        }
        function cbWithDedup(target, v) {
            var lastInputValue = lastInputValueMap.get(target);
            if (!lastInputValue ||
                lastInputValue.text !== v.text ||
                lastInputValue.isChecked !== v.isChecked) {
                lastInputValueMap.set(target, v);
                var id = mirror.getId(target);
                cb(__assign(__assign({}, v), { id: id }));
            }
        }
        var events = sampling.input === 'last' ? ['change'] : ['input', 'change'];
        var handlers = events.map(function (eventName) { return on(eventName, eventHandler); });
        var propertyDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        var hookProperties = [
            [HTMLInputElement.prototype, 'value'],
            [HTMLInputElement.prototype, 'checked'],
            [HTMLSelectElement.prototype, 'value'],
            [HTMLTextAreaElement.prototype, 'value'],
        ];
        if (propertyDescriptor && propertyDescriptor.set) {
            handlers.push.apply(handlers, __spread(hookProperties.map(function (p) {
                return hookSetter(p[0], p[1], {
                    set: function () {
                        eventHandler({ target: this });
                    },
                });
            })));
        }
        return function () {
            handlers.forEach(function (h) { return h(); });
        };
    }
    function initStyleSheetObserver(cb) {
        var insertRule = CSSStyleSheet.prototype.insertRule;
        CSSStyleSheet.prototype.insertRule = function (rule, index) {
            var id = mirror.getId(this.ownerNode);
            if (id !== -1) {
                cb({
                    id: id,
                    adds: [{ rule: rule, index: index }],
                });
            }
            return insertRule.apply(this, arguments);
        };
        var deleteRule = CSSStyleSheet.prototype.deleteRule;
        CSSStyleSheet.prototype.deleteRule = function (index) {
            var id = mirror.getId(this.ownerNode);
            if (id !== -1) {
                cb({
                    id: id,
                    removes: [{ index: index }],
                });
            }
            return deleteRule.apply(this, arguments);
        };
        return function () {
            CSSStyleSheet.prototype.insertRule = insertRule;
            CSSStyleSheet.prototype.deleteRule = deleteRule;
        };
    }
    function initMediaInteractionObserver(mediaInteractionCb, blockClass) {
        var handler = function (type) { return function (event) {
            var target = event.target;
            if (!target || isBlocked(target, blockClass)) {
                return;
            }
            mediaInteractionCb({
                type: type === 'play' ? MediaInteractions.Play : MediaInteractions.Pause,
                id: mirror.getId(target),
            });
        }; };
        var handlers = [on('play', handler('play')), on('pause', handler('pause'))];
        return function () {
            handlers.forEach(function (h) { return h(); });
        };
    }
    function initCanvasMutationObserver(cb, blockClass) {
        var e_1, _a;
        var props = Object.getOwnPropertyNames(CanvasRenderingContext2D.prototype);
        var handlers = [];
        var _loop_1 = function (prop) {
            try {
                if (typeof CanvasRenderingContext2D.prototype[prop] !== 'function') {
                    return "continue";
                }
                var restoreHandler = patch(CanvasRenderingContext2D.prototype, prop, function (original) {
                    return function () {
                        var _this = this;
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        if (!isBlocked(this.canvas, blockClass)) {
                            setTimeout(function () {
                                var recordArgs = __spread(args);
                                if (prop === 'drawImage') {
                                    if (recordArgs[0] &&
                                        recordArgs[0] instanceof HTMLCanvasElement) {
                                        recordArgs[0] = recordArgs[0].toDataURL();
                                    }
                                }
                                cb({
                                    id: mirror.getId(_this.canvas),
                                    property: prop,
                                    args: recordArgs,
                                });
                            }, 0);
                        }
                        return original.apply(this, args);
                    };
                });
                handlers.push(restoreHandler);
            }
            catch (_a) {
                var hookHandler = hookSetter(CanvasRenderingContext2D.prototype, prop, {
                    set: function (v) {
                        cb({
                            id: mirror.getId(this.canvas),
                            property: prop,
                            args: [v],
                            setter: true,
                        });
                    },
                });
                handlers.push(hookHandler);
            }
        };
        try {
            for (var props_1 = __values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
                var prop = props_1_1.value;
                _loop_1(prop);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return function () {
            handlers.forEach(function (h) { return h(); });
        };
    }
    function mergeHooks(o, hooks) {
        var mutationCb = o.mutationCb, mousemoveCb = o.mousemoveCb, mouseInteractionCb = o.mouseInteractionCb, scrollCb = o.scrollCb, viewportResizeCb = o.viewportResizeCb, inputCb = o.inputCb, mediaInteractionCb = o.mediaInteractionCb, styleSheetRuleCb = o.styleSheetRuleCb, canvasMutationCb = o.canvasMutationCb;
        o.mutationCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.mutation) {
                hooks.mutation.apply(hooks, __spread(p));
            }
            mutationCb.apply(void 0, __spread(p));
        };
        o.mousemoveCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.mousemove) {
                hooks.mousemove.apply(hooks, __spread(p));
            }
            mousemoveCb.apply(void 0, __spread(p));
        };
        o.mouseInteractionCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.mouseInteraction) {
                hooks.mouseInteraction.apply(hooks, __spread(p));
            }
            mouseInteractionCb.apply(void 0, __spread(p));
        };
        o.scrollCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.scroll) {
                hooks.scroll.apply(hooks, __spread(p));
            }
            scrollCb.apply(void 0, __spread(p));
        };
        o.viewportResizeCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.viewportResize) {
                hooks.viewportResize.apply(hooks, __spread(p));
            }
            viewportResizeCb.apply(void 0, __spread(p));
        };
        o.inputCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.input) {
                hooks.input.apply(hooks, __spread(p));
            }
            inputCb.apply(void 0, __spread(p));
        };
        o.mediaInteractionCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.mediaInteaction) {
                hooks.mediaInteaction.apply(hooks, __spread(p));
            }
            mediaInteractionCb.apply(void 0, __spread(p));
        };
        o.styleSheetRuleCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.styleSheetRule) {
                hooks.styleSheetRule.apply(hooks, __spread(p));
            }
            styleSheetRuleCb.apply(void 0, __spread(p));
        };
        o.canvasMutationCb = function () {
            var p = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                p[_i] = arguments[_i];
            }
            if (hooks.canvasMutation) {
                hooks.canvasMutation.apply(hooks, __spread(p));
            }
            canvasMutationCb.apply(void 0, __spread(p));
        };
    }
    function initObservers(o, hooks) {
        if (hooks === void 0) { hooks = {}; }
        mergeHooks(o, hooks);
        var mutationObserver = initMutationObserver(o.mutationCb, o.blockClass, o.inlineStylesheet, o.maskInputOptions, o.recordCanvas);
        var mousemoveHandler = initMoveObserver(o.mousemoveCb, o.sampling);
        var mouseInteractionHandler = initMouseInteractionObserver(o.mouseInteractionCb, o.blockClass, o.sampling);
        var scrollHandler = initScrollObserver(o.scrollCb, o.blockClass, o.sampling);
        var viewportResizeHandler = initViewportResizeObserver(o.viewportResizeCb);
        var inputHandler = initInputObserver(o.inputCb, o.blockClass, o.ignoreClass, o.maskInputOptions, o.sampling);
        var mediaInteractionHandler = initMediaInteractionObserver(o.mediaInteractionCb, o.blockClass);
        var styleSheetObserver = initStyleSheetObserver(o.styleSheetRuleCb);
        var canvasMutationObserver = o.recordCanvas
            ? initCanvasMutationObserver(o.canvasMutationCb, o.blockClass)
            : function () { };
        return function () {
            mutationObserver.disconnect();
            mousemoveHandler();
            mouseInteractionHandler();
            scrollHandler();
            viewportResizeHandler();
            inputHandler();
            mediaInteractionHandler();
            styleSheetObserver();
            canvasMutationObserver();
        };
    }

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
        polyfill();
        var lastFullSnapshotEvent;
        var incrementalSnapshotCount = 0;
        wrappedEmit = function (e, isCheckout) {
            emit((packFn ? packFn(e) : e), isCheckout);
            if (e.type === exports.EventType.FullSnapshot) {
                lastFullSnapshotEvent = e;
                incrementalSnapshotCount = 0;
            }
            else if (e.type === exports.EventType.IncrementalSnapshot) {
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
                type: exports.EventType.Meta,
                data: {
                    href: window.location.href,
                    width: getWindowWidth(),
                    height: getWindowHeight(),
                },
            }), isCheckout);
            var _e = __read(snapshot(document, blockClass, inlineStylesheet, maskInputOptions, recordCanvas), 2), node = _e[0], idNodeMap = _e[1];
            if (!node) {
                return console.warn('Failed to snapshot the document');
            }
            mirror.map = idNodeMap;
            wrappedEmit(wrapEvent({
                type: exports.EventType.FullSnapshot,
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
            handlers_1.push(on('DOMContentLoaded', function () {
                wrappedEmit(wrapEvent({
                    type: exports.EventType.DomContentLoaded,
                    data: {},
                }));
            }));
            var init_1 = function () {
                takeFullSnapshot();
                handlers_1.push(initObservers({
                    mutationCb: function (m) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.Mutation }, m),
                        }));
                    },
                    mousemoveCb: function (positions, source) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: {
                                source: source,
                                positions: positions,
                            },
                        }));
                    },
                    mouseInteractionCb: function (d) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.MouseInteraction }, d),
                        }));
                    },
                    scrollCb: function (p) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.Scroll }, p),
                        }));
                    },
                    viewportResizeCb: function (d) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.ViewportResize }, d),
                        }));
                    },
                    inputCb: function (v) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.Input }, v),
                        }));
                    },
                    mediaInteractionCb: function (p) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.MediaInteraction }, p),
                        }));
                    },
                    styleSheetRuleCb: function (r) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.StyleSheetRule }, r),
                        }));
                    },
                    canvasMutationCb: function (p) {
                        return wrappedEmit(wrapEvent({
                            type: exports.EventType.IncrementalSnapshot,
                            data: __assign({ source: exports.IncrementalSource.CanvasMutation }, p),
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
                handlers_1.push(on('load', function () {
                    wrappedEmit(wrapEvent({
                        type: exports.EventType.Load,
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
            type: exports.EventType.Custom,
            data: {
                tag: tag,
                payload: payload,
            },
        }));
    };

    //      
    // An event handler can take an optional event argument
    // and should not return a value
                                              
                                                                   

    // An array of all currently registered event handlers for a type
                                                
                                                                
    // A map of event types and their corresponding event handlers.
                            
                                     
                                       
      

    /** Mitt: Tiny (~200b) functional event emitter / pubsub.
     *  @name mitt
     *  @returns {Mitt}
     */
    function mitt(all                 ) {
    	all = all || Object.create(null);

    	return {
    		/**
    		 * Register an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to listen for, or `"*"` for all events
    		 * @param  {Function} handler Function to call in response to given event
    		 * @memberOf mitt
    		 */
    		on: function on(type        , handler              ) {
    			(all[type] || (all[type] = [])).push(handler);
    		},

    		/**
    		 * Remove an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
    		 * @param  {Function} handler Handler function to remove
    		 * @memberOf mitt
    		 */
    		off: function off(type        , handler              ) {
    			if (all[type]) {
    				all[type].splice(all[type].indexOf(handler) >>> 0, 1);
    			}
    		},

    		/**
    		 * Invoke all handlers for the given type.
    		 * If present, `"*"` handlers are invoked after type-matched handlers.
    		 *
    		 * @param {String} type  The event type to invoke
    		 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
    		 * @memberOf mitt
    		 */
    		emit: function emit(type        , evt     ) {
    			(all[type] || []).slice().map(function (handler) { handler(evt); });
    			(all['*'] || []).slice().map(function (handler) { handler(type, evt); });
    		}
    	};
    }

    var mittProxy = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': mitt
    });

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var smoothscroll = createCommonjsModule(function (module, exports) {
    /* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */
    (function () {

      // polyfill
      function polyfill() {
        // aliases
        var w = window;
        var d = document;

        // return if scroll behavior is supported and polyfill is not forced
        if (
          'scrollBehavior' in d.documentElement.style &&
          w.__forceSmoothScrollPolyfill__ !== true
        ) {
          return;
        }

        // globals
        var Element = w.HTMLElement || w.Element;
        var SCROLL_TIME = 468;

        // object gathering original scroll methods
        var original = {
          scroll: w.scroll || w.scrollTo,
          scrollBy: w.scrollBy,
          elementScroll: Element.prototype.scroll || scrollElement,
          scrollIntoView: Element.prototype.scrollIntoView
        };

        // define timing method
        var now =
          w.performance && w.performance.now
            ? w.performance.now.bind(w.performance)
            : Date.now;

        /**
         * indicates if a the current browser is made by Microsoft
         * @method isMicrosoftBrowser
         * @param {String} userAgent
         * @returns {Boolean}
         */
        function isMicrosoftBrowser(userAgent) {
          var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

          return new RegExp(userAgentPatterns.join('|')).test(userAgent);
        }

        /*
         * IE has rounding bug rounding down clientHeight and clientWidth and
         * rounding up scrollHeight and scrollWidth causing false positives
         * on hasScrollableSpace
         */
        var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

        /**
         * changes scroll position inside an element
         * @method scrollElement
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function scrollElement(x, y) {
          this.scrollLeft = x;
          this.scrollTop = y;
        }

        /**
         * returns result of applying ease math function to a number
         * @method ease
         * @param {Number} k
         * @returns {Number}
         */
        function ease(k) {
          return 0.5 * (1 - Math.cos(Math.PI * k));
        }

        /**
         * indicates if a smooth behavior should be applied
         * @method shouldBailOut
         * @param {Number|Object} firstArg
         * @returns {Boolean}
         */
        function shouldBailOut(firstArg) {
          if (
            firstArg === null ||
            typeof firstArg !== 'object' ||
            firstArg.behavior === undefined ||
            firstArg.behavior === 'auto' ||
            firstArg.behavior === 'instant'
          ) {
            // first argument is not an object/null
            // or behavior is auto, instant or undefined
            return true;
          }

          if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
            // first argument is an object and behavior is smooth
            return false;
          }

          // throw error when behavior is not supported
          throw new TypeError(
            'behavior member of ScrollOptions ' +
              firstArg.behavior +
              ' is not a valid value for enumeration ScrollBehavior.'
          );
        }

        /**
         * indicates if an element has scrollable space in the provided axis
         * @method hasScrollableSpace
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function hasScrollableSpace(el, axis) {
          if (axis === 'Y') {
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
          }

          if (axis === 'X') {
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
          }
        }

        /**
         * indicates if an element has a scrollable overflow property in the axis
         * @method canOverflow
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function canOverflow(el, axis) {
          var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

          return overflowValue === 'auto' || overflowValue === 'scroll';
        }

        /**
         * indicates if an element can be scrolled in either axis
         * @method isScrollable
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function isScrollable(el) {
          var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
          var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

          return isScrollableY || isScrollableX;
        }

        /**
         * finds scrollable parent of an element
         * @method findScrollableParent
         * @param {Node} el
         * @returns {Node} el
         */
        function findScrollableParent(el) {
          while (el !== d.body && isScrollable(el) === false) {
            el = el.parentNode || el.host;
          }

          return el;
        }

        /**
         * self invoked function that, given a context, steps through scrolling
         * @method step
         * @param {Object} context
         * @returns {undefined}
         */
        function step(context) {
          var time = now();
          var value;
          var currentX;
          var currentY;
          var elapsed = (time - context.startTime) / SCROLL_TIME;

          // avoid elapsed times higher than one
          elapsed = elapsed > 1 ? 1 : elapsed;

          // apply easing to elapsed time
          value = ease(elapsed);

          currentX = context.startX + (context.x - context.startX) * value;
          currentY = context.startY + (context.y - context.startY) * value;

          context.method.call(context.scrollable, currentX, currentY);

          // scroll more if we have not reached our destination
          if (currentX !== context.x || currentY !== context.y) {
            w.requestAnimationFrame(step.bind(w, context));
          }
        }

        /**
         * scrolls window or element with a smooth behavior
         * @method smoothScroll
         * @param {Object|Node} el
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function smoothScroll(el, x, y) {
          var scrollable;
          var startX;
          var startY;
          var method;
          var startTime = now();

          // define scroll context
          if (el === d.body) {
            scrollable = w;
            startX = w.scrollX || w.pageXOffset;
            startY = w.scrollY || w.pageYOffset;
            method = original.scroll;
          } else {
            scrollable = el;
            startX = el.scrollLeft;
            startY = el.scrollTop;
            method = scrollElement;
          }

          // scroll looping over a frame
          step({
            scrollable: scrollable,
            method: method,
            startTime: startTime,
            startX: startX,
            startY: startY,
            x: x,
            y: y
          });
        }

        // ORIGINAL METHODS OVERRIDES
        // w.scroll and w.scrollTo
        w.scroll = w.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scroll.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object'
                  ? arguments[0]
                  : w.scrollX || w.pageXOffset,
              // use top prop, second argument if present or fallback to scrollY
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined
                  ? arguments[1]
                  : w.scrollY || w.pageYOffset
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            arguments[0].left !== undefined
              ? ~~arguments[0].left
              : w.scrollX || w.pageXOffset,
            arguments[0].top !== undefined
              ? ~~arguments[0].top
              : w.scrollY || w.pageYOffset
          );
        };

        // w.scrollBy
        w.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0])) {
            original.scrollBy.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object' ? arguments[0] : 0,
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined ? arguments[1] : 0
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            ~~arguments[0].left + (w.scrollX || w.pageXOffset),
            ~~arguments[0].top + (w.scrollY || w.pageYOffset)
          );
        };

        // Element.prototype.scroll and Element.prototype.scrollTo
        Element.prototype.scroll = Element.prototype.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            // if one number is passed, throw error to match Firefox implementation
            if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
              throw new SyntaxError('Value could not be converted');
            }

            original.elementScroll.call(
              this,
              // use left prop, first number argument or fallback to scrollLeft
              arguments[0].left !== undefined
                ? ~~arguments[0].left
                : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
              // use top prop, second argument or fallback to scrollTop
              arguments[0].top !== undefined
                ? ~~arguments[0].top
                : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
            );

            return;
          }

          var left = arguments[0].left;
          var top = arguments[0].top;

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            this,
            this,
            typeof left === 'undefined' ? this.scrollLeft : ~~left,
            typeof top === 'undefined' ? this.scrollTop : ~~top
          );
        };

        // Element.prototype.scrollBy
        Element.prototype.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.elementScroll.call(
              this,
              arguments[0].left !== undefined
                ? ~~arguments[0].left + this.scrollLeft
                : ~~arguments[0] + this.scrollLeft,
              arguments[0].top !== undefined
                ? ~~arguments[0].top + this.scrollTop
                : ~~arguments[1] + this.scrollTop
            );

            return;
          }

          this.scroll({
            left: ~~arguments[0].left + this.scrollLeft,
            top: ~~arguments[0].top + this.scrollTop,
            behavior: arguments[0].behavior
          });
        };

        // Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = function() {
          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scrollIntoView.call(
              this,
              arguments[0] === undefined ? true : arguments[0]
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          var scrollableParent = findScrollableParent(this);
          var parentRects = scrollableParent.getBoundingClientRect();
          var clientRects = this.getBoundingClientRect();

          if (scrollableParent !== d.body) {
            // reveal element inside parent
            smoothScroll.call(
              this,
              scrollableParent,
              scrollableParent.scrollLeft + clientRects.left - parentRects.left,
              scrollableParent.scrollTop + clientRects.top - parentRects.top
            );

            // reveal parent in viewport unless is fixed
            if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
              w.scrollBy({
                left: parentRects.left,
                top: parentRects.top,
                behavior: 'smooth'
              });
            }
          } else {
            // reveal element in viewport
            w.scrollBy({
              left: clientRects.left,
              top: clientRects.top,
              behavior: 'smooth'
            });
          }
        };
      }

      {
        // commonjs
        module.exports = { polyfill: polyfill };
      }

    }());
    });
    var smoothscroll_1 = smoothscroll.polyfill;

    var Timer = (function () {
        function Timer(actions, speed) {
            if (actions === void 0) { actions = []; }
            this.timeOffset = 0;
            this.actions = actions;
            this.speed = speed;
        }
        Timer.prototype.addAction = function (action) {
            var index = this.findActionIndex(action);
            this.actions.splice(index, 0, action);
        };
        Timer.prototype.addActions = function (actions) {
            var _a;
            (_a = this.actions).push.apply(_a, __spread(actions));
        };
        Timer.prototype.start = function () {
            this.actions.sort(function (a1, a2) { return a1.delay - a2.delay; });
            this.timeOffset = 0;
            var lastTimestamp = performance.now();
            var actions = this.actions;
            var self = this;
            function check(time) {
                self.timeOffset += (time - lastTimestamp) * self.speed;
                lastTimestamp = time;
                while (actions.length) {
                    var action = actions[0];
                    if (self.timeOffset >= action.delay) {
                        actions.shift();
                        action.doAction();
                    }
                    else {
                        break;
                    }
                }
                if (actions.length > 0 || self.liveMode) {
                    self.raf = requestAnimationFrame(check);
                }
            }
            this.raf = requestAnimationFrame(check);
        };
        Timer.prototype.clear = function () {
            if (this.raf) {
                cancelAnimationFrame(this.raf);
            }
            this.actions.length = 0;
        };
        Timer.prototype.setSpeed = function (speed) {
            this.speed = speed;
        };
        Timer.prototype.toggleLiveMode = function (mode) {
            this.liveMode = mode;
        };
        Timer.prototype.findActionIndex = function (action) {
            var start = 0;
            var end = this.actions.length - 1;
            while (start <= end) {
                var mid = Math.floor((start + end) / 2);
                if (this.actions[mid].delay < action.delay) {
                    start = mid + 1;
                }
                else if (this.actions[mid].delay > action.delay) {
                    end = mid - 1;
                }
                else {
                    return mid;
                }
            }
            return start;
        };
        return Timer;
    }());
    function addDelay(event, baselineTime) {
        if (event.type === exports.EventType.IncrementalSnapshot &&
            event.data.source === exports.IncrementalSource.MouseMove) {
            var firstOffset = event.data.positions[0].timeOffset;
            var firstTimestamp = event.timestamp + firstOffset;
            event.delay = firstTimestamp - baselineTime;
            return firstTimestamp - baselineTime;
        }
        event.delay = event.timestamp - baselineTime;
        return event.delay;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    var t;!function(t){t[t.NotStarted=0]="NotStarted",t[t.Running=1]="Running",t[t.Stopped=2]="Stopped";}(t||(t={}));var n={type:"xstate.init"};function e(t){return void 0===t?[]:[].concat(t)}function r(t){return {type:"xstate.assign",assignment:t}}function i(t,n){return "string"==typeof(t="string"==typeof t&&n&&n[t]?n[t]:t)?{type:t}:"function"==typeof t?{type:t.name,exec:t}:t}function o(t){return function(n){return t===n}}function a(t){return "string"==typeof t?{type:t}:t}function u(t,n){return {value:t,context:n,actions:[],changed:!1,matches:o(t)}}function c(t,n){void 0===n&&(n={});var r={config:t,_options:n,initialState:{value:t.initial,actions:e(t.states[t.initial].entry).map((function(t){return i(t,n.actions)})),context:t.context,matches:o(t.initial)},transition:function(n,c){var s,f,v="string"==typeof n?{value:n,context:t.context}:n,l=v.value,p=v.context,g=a(c),y=t.states[l];if(y.on){var d=e(y.on[g.type]),x=function(n){if(void 0===n)return {value:u(l,p)};var e="string"==typeof n?{target:n}:n,a=e.target,c=void 0===a?l:a,s=e.actions,f=void 0===s?[]:s,v=e.cond,d=p;if((void 0===v?function(){return !0}:v)(p,g)){var x=t.states[c],m=!1,h=[].concat(y.exit,f,x.entry).filter((function(t){return t})).map((function(t){return i(t,r._options.actions)})).filter((function(t){if("xstate.assign"===t.type){m=!0;var n=Object.assign({},d);return "function"==typeof t.assignment?n=t.assignment(d,g):Object.keys(t.assignment).forEach((function(e){n[e]="function"==typeof t.assignment[e]?t.assignment[e](d,g):t.assignment[e];})),d=n,!1}return !0}));return {value:{value:c,context:d,actions:h,changed:c!==l||h.length>0||m,matches:o(c)}}}};try{for(var m=function(t){var n="function"==typeof Symbol&&t[Symbol.iterator],e=0;return n?n.call(t):{next:function(){return t&&e>=t.length&&(t=void 0),{value:t&&t[e++],done:!t}}}}(d),h=m.next();!h.done;h=m.next()){var S=x(h.value);if("object"==typeof S)return S.value}}catch(t){s={error:t};}finally{try{h&&!h.done&&(f=m.return)&&f.call(m);}finally{if(s)throw s.error}}}return u(l,p)}};return r}var s=function(t,n){return t.actions.forEach((function(e){var r=e.exec;return r&&r(t.context,n)}))};function f(e){var r=e.initialState,i=t.NotStarted,u=new Set,c={_machine:e,send:function(n){i===t.Running&&(r=e.transition(r,n),s(r,a(n)),u.forEach((function(t){return t(r)})));},subscribe:function(t){return u.add(t),t(r),{unsubscribe:function(){return u.delete(t)}}},start:function(a){if(a){var u="object"==typeof a?a:{context:e.config.context,value:a};r={value:u.value,actions:[],context:u.context,matches:o(u.value)};}return i=t.Running,s(r,n),c},stop:function(){return i=t.Stopped,u.clear(),c},get state(){return r},get status(){return i}};return c}

    function discardPriorSnapshots(events, baselineTime) {
        for (var idx = events.length - 1; idx >= 0; idx--) {
            var event = events[idx];
            if (event.type === exports.EventType.Meta) {
                if (event.timestamp <= baselineTime) {
                    return events.slice(idx);
                }
            }
        }
        return events;
    }
    function createPlayerService(context, _a) {
        var getCastFn = _a.getCastFn, emitter = _a.emitter;
        var playerMachine = c({
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
                castEvent: r({
                    lastPlayedEvent: function (ctx, event) {
                        if (event.type === 'CAST_EVENT') {
                            return event.payload.event;
                        }
                        return ctx.lastPlayedEvent;
                    },
                }),
                recordTimeOffset: r(function (ctx, event) {
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
                            var event = events_1_1.value;
                            addDelay(event, baselineTime);
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
                    var _loop_1 = function (event) {
                        if (lastPlayedEvent &&
                            lastPlayedEvent.timestamp < baselineTime &&
                            (event.timestamp <= lastPlayedEvent.timestamp ||
                                event === lastPlayedEvent)) {
                            return "continue";
                        }
                        var isSync = event.timestamp < baselineTime;
                        if (isSync && !needCastInSyncMode(event)) {
                            return "continue";
                        }
                        var castFn = getCastFn(event, isSync);
                        if (isSync) {
                            castFn();
                        }
                        else {
                            actions.push({
                                doAction: function () {
                                    castFn();
                                    emitter.emit(exports.ReplayerEvents.EventCast, event);
                                },
                                delay: event.delay,
                            });
                        }
                    };
                    try {
                        for (var neededEvents_1 = __values(neededEvents), neededEvents_1_1 = neededEvents_1.next(); !neededEvents_1_1.done; neededEvents_1_1 = neededEvents_1.next()) {
                            var event = neededEvents_1_1.value;
                            _loop_1(event);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (neededEvents_1_1 && !neededEvents_1_1.done && (_b = neededEvents_1.return)) _b.call(neededEvents_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    emitter.emit(exports.ReplayerEvents.Flush);
                    timer.addActions(actions);
                    timer.start();
                },
                pause: function (ctx) {
                    ctx.timer.clear();
                },
                resetLastPlayedEvent: r(function (ctx) {
                    return __assign(__assign({}, ctx), { lastPlayedEvent: null });
                }),
                startLive: r({
                    baselineTime: function (ctx, event) {
                        ctx.timer.toggleLiveMode(true);
                        ctx.timer.start();
                        if (event.type === 'TO_LIVE' && event.payload.baselineTime) {
                            return event.payload.baselineTime;
                        }
                        return Date.now();
                    },
                }),
                addEvent: r(function (ctx, machineEvent) {
                    var baselineTime = ctx.baselineTime, timer = ctx.timer, events = ctx.events;
                    if (machineEvent.type === 'ADD_EVENT') {
                        var event_1 = machineEvent.payload.event;
                        addDelay(event_1, baselineTime);
                        events.push(event_1);
                        var isSync = event_1.timestamp < baselineTime;
                        var castFn_1 = getCastFn(event_1, isSync);
                        if (isSync) {
                            castFn_1();
                        }
                        else {
                            timer.addAction({
                                doAction: function () {
                                    castFn_1();
                                    emitter.emit(exports.ReplayerEvents.EventCast, event_1);
                                },
                                delay: event_1.delay,
                            });
                        }
                    }
                    return __assign(__assign({}, ctx), { events: events });
                }),
            },
        });
        return f(playerMachine);
    }
    function createSpeedService(context) {
        var speedMachine = c({
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
                recordSpeed: r({
                    normalSpeed: function (ctx) { return ctx.timer.speed; },
                }),
                restoreSpeed: function (ctx) {
                    ctx.timer.setSpeed(ctx.normalSpeed);
                },
            },
        });
        return f(speedMachine);
    }

    var rules = function (blockClass) { return [
        "iframe, ." + blockClass + " { background: #ccc }",
        'noscript { display: none !important; }',
    ]; };

    var SKIP_TIME_THRESHOLD = 10 * 1000;
    var SKIP_TIME_INTERVAL = 5 * 1000;
    var mitt$1 = mitt || mittProxy;
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
            this.emitter = mitt$1();
            this.legacy_missingNodeRetryMap = {};
            this.imageMap = new Map();
            if (!(config === null || config === void 0 ? void 0 : config.liveMode) && events.length < 2) {
                throw new Error('Replayer need at least 2 events.');
            }
            this.config = Object.assign({}, defaultConfig, config);
            this.handleResize = this.handleResize.bind(this);
            this.getCastFn = this.getCastFn.bind(this);
            this.emitter.on(exports.ReplayerEvents.Resize, this.handleResize);
            smoothscroll_1();
            polyfill();
            this.setupDom();
            this.treeIndex = new TreeIndex();
            this.fragmentParentMap = new Map();
            this.emitter.on(exports.ReplayerEvents.Flush, function () {
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
                        var _l = __read(_k.value, 2), frag = _l[0], parent = _l[1];
                        mirror.map[parent.__sn.id] = parent;
                        if (parent.__sn.type === NodeType.Element &&
                            parent.__sn.tagName === 'textarea' &&
                            frag.textContent) {
                            parent.value = frag.textContent;
                        }
                        parent.appendChild(frag);
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
            var timer = new Timer([], (config === null || config === void 0 ? void 0 : config.speed) || defaultConfig.speed);
            this.service = createPlayerService({
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
                _this.emitter.emit(exports.ReplayerEvents.StateChange, {
                    player: state,
                });
            });
            this.speedService = createSpeedService({
                normalSpeed: -1,
                timer: timer,
            });
            this.speedService.start();
            this.speedService.subscribe(function (state) {
                _this.emitter.emit(exports.ReplayerEvents.StateChange, {
                    speed: state,
                });
            });
            var firstMeta = this.service.state.context.events.find(function (e) { return e.type === exports.EventType.Meta; });
            var firstFullsnapshot = this.service.state.context.events.find(function (e) { return e.type === exports.EventType.FullSnapshot; });
            if (firstMeta) {
                var _a = firstMeta.data, width_1 = _a.width, height_1 = _a.height;
                setTimeout(function () {
                    _this.emitter.emit(exports.ReplayerEvents.Resize, {
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
            this.emitter.emit(exports.ReplayerEvents.Start);
        };
        Replayer.prototype.pause = function (timeOffset) {
            if (timeOffset === undefined && this.service.state.matches('playing')) {
                this.service.send({ type: 'PAUSE' });
            }
            if (typeof timeOffset === 'number') {
                this.play(timeOffset);
                this.service.send({ type: 'PAUSE' });
            }
            this.emitter.emit(exports.ReplayerEvents.Pause);
        };
        Replayer.prototype.resume = function (timeOffset) {
            if (timeOffset === void 0) { timeOffset = 0; }
            console.warn("The 'resume' will be departed in 1.0. Please use 'play' method which has the same interface.");
            this.play(timeOffset);
            this.emitter.emit(exports.ReplayerEvents.Resume);
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
                case exports.EventType.DomContentLoaded:
                case exports.EventType.Load:
                    break;
                case exports.EventType.Custom:
                    castFn = function () {
                        _this.emitter.emit(exports.ReplayerEvents.CustomEvent, event);
                    };
                    break;
                case exports.EventType.Meta:
                    castFn = function () {
                        return _this.emitter.emit(exports.ReplayerEvents.Resize, {
                            width: event.data.width,
                            height: event.data.height,
                        });
                    };
                    break;
                case exports.EventType.FullSnapshot:
                    castFn = function () {
                        _this.rebuildFullSnapshot(event);
                        _this.iframe.contentWindow.scrollTo(event.data.initialOffset);
                    };
                    break;
                case exports.EventType.IncrementalSnapshot:
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
                                _this.emitter.emit(exports.ReplayerEvents.SkipStart, payload);
                            }
                        }
                    };
                    break;
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
                    _this.emitter.emit(exports.ReplayerEvents.Finish);
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
            mirror.map = rebuild(event.data.node, this.iframe.contentDocument)[1];
            var styleEl = document.createElement('style');
            var _a = this.iframe.contentDocument, documentElement = _a.documentElement, head = _a.head;
            documentElement.insertBefore(styleEl, head);
            var injectStylesRules = rules(this.config.blockClass).concat(this.config.insertStyleRules);
            for (var idx = 0; idx < injectStylesRules.length; idx++) {
                styleEl.sheet.insertRule(injectStylesRules[idx], idx);
            }
            this.emitter.emit(exports.ReplayerEvents.FullsnapshotRebuilded, event);
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
                var timer_1;
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
                            if (unloadSheets_1.size === 0 && timer_1 !== -1) {
                                if (beforeLoadState_1.matches('playing')) {
                                    _this.play(_this.getCurrentTime());
                                }
                                _this.emitter.emit(exports.ReplayerEvents.LoadStylesheetEnd);
                                if (timer_1) {
                                    window.clearTimeout(timer_1);
                                }
                                unsubscribe_1();
                            }
                        });
                    }
                });
                if (unloadSheets_1.size > 0) {
                    this.service.send({ type: 'PAUSE' });
                    this.emitter.emit(exports.ReplayerEvents.LoadStylesheetStart);
                    timer_1 = window.setTimeout(function () {
                        if (beforeLoadState_1.matches('playing')) {
                            _this.play(_this.getCurrentTime());
                        }
                        timer_1 = -1;
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
                    var event = _c.value;
                    if (event.type === exports.EventType.IncrementalSnapshot &&
                        event.data.source === exports.IncrementalSource.CanvasMutation &&
                        event.data.property === 'drawImage' &&
                        typeof event.data.args[0] === 'string' &&
                        !this.imageMap.has(event)) {
                        count++;
                        var image = document.createElement('img');
                        image.src = event.data.args[0];
                        this.imageMap.set(event, image);
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
                case exports.IncrementalSource.Mutation: {
                    if (isSync) {
                        d.adds.forEach(function (m) { return _this.treeIndex.add(m); });
                        d.texts.forEach(function (m) { return _this.treeIndex.text(m); });
                        d.attributes.forEach(function (m) { return _this.treeIndex.attribute(m); });
                        d.removes.forEach(function (m) { return _this.treeIndex.remove(m); });
                    }
                    this.applyMutation(d, isSync);
                    break;
                }
                case exports.IncrementalSource.MouseMove:
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
                case exports.IncrementalSource.MouseInteraction: {
                    if (d.id === -1) {
                        break;
                    }
                    var event = new Event(exports.MouseInteractions[d.type].toLowerCase());
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    this.emitter.emit(exports.ReplayerEvents.MouseInteraction, {
                        type: d.type,
                        target: target,
                    });
                    var triggerFocus = this.config.triggerFocus;
                    switch (d.type) {
                        case exports.MouseInteractions.Blur:
                            if ('blur' in target) {
                                target.blur();
                            }
                            break;
                        case exports.MouseInteractions.Focus:
                            if (triggerFocus && target.focus) {
                                target.focus({
                                    preventScroll: true,
                                });
                            }
                            break;
                        case exports.MouseInteractions.Click:
                        case exports.MouseInteractions.TouchStart:
                        case exports.MouseInteractions.TouchEnd:
                            if (!isSync) {
                                this.moveAndHover(d, d.x, d.y, d.id);
                                this.mouse.classList.remove('active');
                                void this.mouse.offsetWidth;
                                this.mouse.classList.add('active');
                            }
                            break;
                        default:
                            target.dispatchEvent(event);
                    }
                    break;
                }
                case exports.IncrementalSource.Scroll: {
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
                case exports.IncrementalSource.ViewportResize:
                    this.emitter.emit(exports.ReplayerEvents.Resize, {
                        width: d.width,
                        height: d.height,
                    });
                    break;
                case exports.IncrementalSource.Input: {
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
                case exports.IncrementalSource.MediaInteraction: {
                    var target = mirror.getNode(d.id);
                    if (!target) {
                        return this.debugNodeNotFound(d, d.id);
                    }
                    var mediaEl_1 = target;
                    if (d.type === MediaInteractions.Pause) {
                        mediaEl_1.pause();
                    }
                    if (d.type === MediaInteractions.Play) {
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
                case exports.IncrementalSource.StyleSheetRule: {
                    var target = mirror.getNode(d.id);
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
                case exports.IncrementalSource.CanvasMutation: {
                    if (!this.config.UNSAFE_replayCanvas) {
                        return;
                    }
                    var target = mirror.getNode(d.id);
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
            }
        };
        Replayer.prototype.applyMutation = function (d, useVirtualParent) {
            var _this = this;
            d.removes.forEach(function (mutation) {
                var target = mirror.getNode(mutation.id);
                if (!target) {
                    return _this.warnNodeNotFound(d, mutation.id);
                }
                var parent = mirror.getNode(mutation.parentId);
                if (!parent) {
                    return _this.warnNodeNotFound(d, mutation.parentId);
                }
                mirror.removeNodeFromMap(target);
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
                var parent = mirror.getNode(mutation.parentId);
                if (!parent) {
                    return queue.push(mutation);
                }
                var parentInDocument = _this.iframe.contentDocument.contains(parent);
                if (useVirtualParent && parentInDocument) {
                    var virtualParent = document.createDocumentFragment();
                    mirror.map[mutation.parentId] = virtualParent;
                    _this.fragmentParentMap.set(virtualParent, parent);
                    while (parent.firstChild) {
                        virtualParent.appendChild(parent.firstChild);
                    }
                    parent = virtualParent;
                }
                var previous = null;
                var next = null;
                if (mutation.previousId) {
                    previous = mirror.getNode(mutation.previousId);
                }
                if (mutation.nextId) {
                    next = mirror.getNode(mutation.nextId);
                }
                if (mutation.nextId !== null && mutation.nextId !== -1 && !next) {
                    return queue.push(mutation);
                }
                var target = buildNodeWithSN(mutation.node, _this.iframe.contentDocument, mirror.map, true);
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
                if (queue.every(function (m) { return !Boolean(mirror.getNode(m.parentId)); })) {
                    return queue.forEach(function (m) { return _this.warnNodeNotFound(d, m.node.id); });
                }
                var mutation = queue.shift();
                appendNode(mutation);
            }
            if (Object.keys(legacy_missingNodeMap).length) {
                Object.assign(this.legacy_missingNodeRetryMap, legacy_missingNodeMap);
            }
            d.texts.forEach(function (mutation) {
                var target = mirror.getNode(mutation.id);
                if (!target) {
                    return _this.warnNodeNotFound(d, mutation.id);
                }
                if (_this.fragmentParentMap.has(target)) {
                    target = _this.fragmentParentMap.get(target);
                }
                target.textContent = mutation.value;
            });
            d.attributes.forEach(function (mutation) {
                var target = mirror.getNode(mutation.id);
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
            var target = mirror.getNode(d.id);
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
            var target = mirror.getNode(d.id);
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
            var target = mirror.getNode(id);
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
            if (event.type !== exports.EventType.IncrementalSnapshot) {
                return false;
            }
            return (event.data.source > exports.IncrementalSource.Mutation &&
                event.data.source <= exports.IncrementalSource.Input);
        };
        Replayer.prototype.backToNormal = function () {
            this.nextUserInteractionEvent = null;
            if (this.speedService.state.matches('normal')) {
                return;
            }
            this.speedService.send({ type: 'BACK_TO_NORMAL' });
            this.emitter.emit(exports.ReplayerEvents.SkipEnd, {
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

    var addCustomEvent = record.addCustomEvent;

    exports.Replayer = Replayer;
    exports.addCustomEvent = addCustomEvent;
    exports.mirror = mirror;
    exports.record = record;
    exports.utils = utils;

    return exports;

}({}));
