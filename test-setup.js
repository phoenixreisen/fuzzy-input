const register = require('ignore-styles').default;
const jsdom = require('jsdom');
const test = require('ospec');

const dom = new jsdom.JSDOM('', {
    // für `requestAnimationFrame`
    pretendToBeVisual: true,
});

Object.assign(global, {
    window: dom.window,
    document: dom.window.document,
    requestAnimationFrame: dom.window.requestAnimationFrame,
});
require('mithril');
register(['.css', '.sass', '.scss']);

test.after(function() {
    dom.window.close();
});