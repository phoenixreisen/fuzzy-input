const mq = require("mithril-query");
const m = require('mithril');
const test = require("ospec");

Object.assign(global, m);

test.spec('Fuzzy Input', () => {
    test.specTimeout(1000);

    // component functions
    const Functions = require('../dist/fuzzy-input.fns.js');
    const FuzzyView = require('../dist/fuzzy-input.m.js').default;
    const Fuzzy = mq(m(new FuzzyView(), {
        query: () => Promise.resolve(['S1', 'S2', 'S3']),
        load: () => Promise.resolve({ type: 'success', value: 'String 2'}),
        throttling: 5,
    }));

    test('should render correctly oninit', () => {
        test(Fuzzy.should.have(1, 'article.fuzzy-search')).equals(true);
        test(Fuzzy.should.have(1, 'input#fuzzy-input')).equals(true);
        //---
        test(Fuzzy.should.have(1, '.textfield.fuzzy-input')).equals(true);
        test(Fuzzy.should.have(1, '.fuzzy-show-result')).equals(true);
        test(Fuzzy.should.not.have('.fuzzy-bg-layer')).equals(true);
        test(Fuzzy.should.not.have('.fuzzy-overlay')).equals(true);
        test(Fuzzy.should.not.have('.fuzzy-result')).equals(true);
    });

    test('should correctly validate input', () => {
        const { isValid } = Functions;
        const attrsMock = { valid: true, pattern: undefined };
        test(isValid('test', attrsMock)).equals(true);
        attrsMock.valid = false;
        test(isValid('test', attrsMock)).equals(false);
        attrsMock.valid = true;
        attrsMock.pattern = new RegExp(/^[0-9]+$/);
        test(isValid('123', attrsMock)).equals(true);
        test(isValid('test', attrsMock)).equals(false);
        test(isValid('test123', attrsMock)).equals(false);
        attrsMock.valid = undefined;
        attrsMock.pattern = undefined;
        test(isValid('test', attrsMock)).equals(true);
    });

    test('should correctly determine if input is ready for search', () => {
        const state = { loading: false, value: 'test' };
        const attrs = { minLength: undefined };
        const { isReady } = Functions;
        let input = 'test';
        test(isReady(input, state, attrs)).equals(true); // ok
        state.loading = true;
        test(isReady(input, state, attrs)).equals(false); // still loading prev req.
        state.loading = false;
        state.value = 'something other';
        test(isReady(input, state, attrs)).equals(false); // state.value !== input
        state.value = 'te';
        input = 'te';
        test(isReady(input, state, attrs)).equals(false); // default min length is 3
        attrs.minLength = 2;
        test(isReady(input, state, attrs)).equals(true); // 2 chars is ok now
    });

    test('should correctly focus a certain DOM item by Id', () => {
        const down = { key: 'ArrowDown' };
        const up = { key: 'ArrowUp' };
        const { focus } = Functions;
        let searchSpyCount = 0;

        const spy = (input, state, attrs) => {
            Functions.search(input, state, attrs);
            searchSpyCount += 1;
        }
        const attrs = {
            query: () => Promise.resolve(['S1', 'S2', 'S3']),
            load: () => Promise.resolve({type: 'success', result: 'String 2'}),
        };
        const state = {
            focused: -1,
            value: 'test',
            result: ['S1', 'S2', 'S3'],
        };
        focus(state, attrs, down);
        test(searchSpyCount).equals(0);
        test(state.focused).equals(0);
        focus(state, attrs, down);
        test(state.focused).equals(1);
        focus(state, attrs, down);
        test(state.focused).equals(2);
        focus(state, attrs, up);
        test(searchSpyCount).equals(0);
        test(state.focused).equals(1);
        // If there's an input value & user clicked arrow,
        // but no result is already given => call search
        state.result = undefined;
        focus(state, attrs, up, spy);
        test(searchSpyCount).equals(1);
    });

    test('should be able to reset component state', () => {
        const event = { key: 'Escape' };
        const state = {
            focused: 2,
            loading: true,
            error: Error('blabla'),
            result: ['S1', 'S2', 'S3'],
        };
        const reset = {
            focused: -1,
            error: null,
            result: null,
            loading: false
        };
        Functions.reset(state, event);
        test(state).deepEquals(reset)
    });

    test('should call search callback correctly', (done) => {
        const input = 'test';
        const state = { result: null, loading: false, value: '' };
        const attrs = { query: () => Promise.resolve(['S1', 'S2', 'S3']), throttling: 5 };
        Functions.search(input, state, attrs);
        setTimeout(() => {
            test(state).deepEquals({
                error: null,
                value: 'test',
                loading: false,
                result: ['S1', 'S2', 'S3'],
            });
        }, 10);
        setTimeout(done, 20);
    });

    test('should call load callback correctly', (done) => {
        const name = 'test-name';
        const state = { 'value': 'test-na' };
        const attrs = { load: () => Promise.resolve({ type: 'success', result: 'bla' }) };
        Functions.load(name, state, attrs);
        setTimeout(() => {
            test(state.value).equals(name);
        }, 10)
        setTimeout(done, 20);
    });

    test('should toggle overlay, if result is given or not', (done) => {
        test.timeout(100);
        Fuzzy.setValue('#fuzzy-input', 'test');
        setTimeout(() => {
            Fuzzy.redraw();
            test(Fuzzy.should.have(1, '.fuzzy-result')).equals(true);
        }, 10);
        setTimeout(done, 50);
    });

    test('should show warning, when input is invalid', (done) => {
        const Fuzzy = mq(m(new FuzzyView(), {
            pattern: new RegExp(/[0-9]/),
        }));
        Fuzzy.setValue('#fuzzy-input', 'test');
        setTimeout(() => {
            Fuzzy.redraw();
            test(Fuzzy.should.have(1, '.fuzzy-warning')).equals(true);
        }, 10);
        setTimeout(done, 20);
    });

    test('should show error, when search failed', (done) => {
        const FuzzyQuery = mq(m(new FuzzyView(), {
            query: () => Promise.reject('query error'),
            throttling: 5,
        }));
        test(FuzzyQuery.should.not.have('.fuzzy-error')).equals(true);
        FuzzyQuery.setValue('#fuzzy-input', 'test');
        setTimeout(() => {
            FuzzyQuery.redraw();
            test(FuzzyQuery.should.have(1, '.fuzzy-error')).equals(true);
        }, 10);
        setTimeout(done, 50);
    });

    test('should show error, when load failed', (done) => {
        const FuzzyLoad = mq(m(new FuzzyView(), {
            query: () => Promise.resolve(['S1', 'S2', 'S3']),
            load: () => Promise.reject('load error'),
            throttling: 5,
        }));
        test(FuzzyLoad.should.not.have('.fuzzy-error')).equals(true);
        FuzzyLoad.setValue('#fuzzy-input', 'test');
        setTimeout(() => {
            FuzzyLoad.redraw();
            test(FuzzyLoad.should.have(1, '.fuzzy-result')).equals(true);
            test(FuzzyLoad.should.have(1, '#fuzzy-item-0')).equals(true);
            FuzzyLoad.click('#fuzzy-item-0');
            setTimeout(() => {
                FuzzyLoad.redraw();
                test(FuzzyLoad.should.have(1, '.fuzzy-error')).equals(true);
            }, 20)
        }, 20);
        setTimeout(done, 50);
    });
});