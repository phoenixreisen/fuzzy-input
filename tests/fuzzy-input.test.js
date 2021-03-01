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

    test('should render button correctly', () => {
        const attrs = {
            inText: undefined,
            withButton: false,
            query: () => Promise.resolve(['S1', 'S2', 'S3']),
            load: () => Promise.resolve({ type: 'success', value: 'String 2'})
        };

        const Fuzzy1 = mq(m(new FuzzyView(), attrs));
        test(Fuzzy1.should.not.have('.fuzzy-with-button')).equals(true);
        test(Fuzzy1.should.not.have('button')).equals(true);

        attrs.withButton = true;
        attrs.inText = {prefix: '{', suffix: '}'}
        const Fuzzy2 = mq(m(new FuzzyView(), attrs));
        test(Fuzzy2.should.have(1, '.fuzzy-with-button')).equals(true);
        test(Fuzzy2.should.have(1, 'button')).equals(true);
    });

    test('should correctly set input value', () => {
        const state = { value: '' };
        const outerState = { value: '' };
        const attrs = { oninput: undefined };
        Functions.setValue('test', state, attrs)
        // without external set function
        test(state.value).equals('test');
        test(outerState.value).equals('');
        // with external set function
        attrs.oninput = (value) => outerState.value = value;
        Functions.setValue('test2', state, attrs);
        test(state.value).equals('test');
        test(outerState.value).equals('test2');
    });

    test('should correctly return input value', () => {
        const state = { value: 'state-value' };
        const attrs = { value: undefined };
        test(Functions.getValue(state, attrs)).equals('state-value');
        attrs.value = () => 'attrs-value';
        test(Functions.getValue(state, attrs)).equals('attrs-value');
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
            match: null,
            result: null,
            loading: false
        };
        Functions.reset(state, event);
        test(state).deepEquals(reset)
    });

    test('should correctly find placeholder matches', (done) => {
        // test findMatch() directly
        const prefix = '{{';
        const inputs = [
            {value: 'Mein Name ist {{Name', expected: '{{Name'},
            {value: 'Die {{Schiff ist ein tolles Schiff', expected: '{{Schiff'},
            {value: 'Die {{Schiff}} ist ein tolles Schiff', expected: null},
            {value: '{{Blabla noch nachträglich an den Anfang tippen...', expected: '{{Blabla'},
            {value: '{eine Klammer zu wenig...', expected: null},
            {value: 'Fabian Marcus - Entwickler, Bonn', expected: null}
        ];
        for(const input of inputs) {
            test(Functions.findMatch(input.value, prefix)).equals(input.expected);
        }
        // test findMatch() in search()
        const input = 'Ich bin der {{Name . Hallo.';
        const input2 = 'Ich bin der {{Name}}. Hallo.';
        const state2 = { match: null };
        const state = { match: null };
        const attrs = {
            throttling: 5,
            inText: { prefix: '{{' },
        };
        const querySpy = (_state, _attrs, needle) => {
            test(needle).equals('Name');
        };
        Functions.search(input, state, attrs, querySpy);
        setTimeout(() => test(state.match).equals('{{Name'), 10);
        Functions.search(input2, state2, attrs, querySpy);
        setTimeout(() => test(state2.match).equals(null), 20);
        setTimeout(done, 30);
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

    test('should call query correctly', (done) => {
        const query = async () => ['S1', 'S11', 'S111', 'S2', 'S22', 'S3'];
        const error = async () => Promise.reject({type: 'failure', msg: 'bla'});
        const needle = 'S1';

        // In Text Search
        const state = { error: null, loading: false, result: null, error: null };
        const attrs = { query: query, inText: true, logerror: false };
        Functions.callQuery(state, attrs, needle);
        setTimeout(() => {
            test(state.loading).equals(false);
            test(state.result.length).equals(3);
        }, 10);

        // Autocomplete
        const state2 = { error: null, loading: false, result: null, error: null };
        const attrs2 = { query: query, inText: false, logerror: false };
        Functions.callQuery(state2, attrs2, needle);
        setTimeout(() => {
            test(state2.loading).equals(false);
            test(state2.result.length).equals(6);
        }, 20);

        // Request Error
        const state3 = { error: null, loading: false, result: null, error: null };
        const attrs3 = { query: error, inText: true, logerror: false };
        Functions.callQuery(state3, attrs3, needle);
        setTimeout(() => {
            test(state3.loading).equals(false);
            test(state3.result).equals(null);
            test(state3.error).deepEquals({type: 'failure', msg: 'bla'});
        }, 30);

        setTimeout(done, 50);
    });

    test('should call load callback correctly', (done) => {
        const name = 'test-name';
        const state = { 'value': 'test-na' };
        const attrs = { load: () => Promise.resolve({ type: 'success', result: 'bla' }) };
        Functions.load(name, state, attrs);
        setTimeout(() => {
            test(state.value).equals(name);
        }, 10)
        setTimeout(done, 50);
    });

    test('should replace placeholder correctly', (done) => {
        const load = (choice) => Promise.resolve(choice);
        const before = 'Irgendwas';
        const choice = 'Fabian Marcus - Entwickler, Bonnn';
        const attrs = { inText: { prefix: '{{', suffix: '}}' }, load: load };
        const state = { match: 'Irgendwas', value: before };
        const state2 = { match: null, value: before };

        Functions.load(choice, state, attrs);
        setTimeout(() => test(state.value).equals(`${attrs.inText.prefix}${choice}${attrs.inText.suffix} `), 10);
        Functions.load(choice, state2, attrs);
        setTimeout(() => test(state2.value).equals(`${before}${attrs.inText.prefix}${choice}${attrs.inText.suffix}`), 20);
        setTimeout(done, 50);
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
        setTimeout(done, 50);
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
            test(FuzzyLoad.should.have(1, '#fuzzy-input-item-0')).equals(true);
            FuzzyLoad.click('#fuzzy-input-item-0');
            setTimeout(() => {
                FuzzyLoad.redraw();
                test(FuzzyLoad.should.have(1, '.fuzzy-error')).equals(true);
            }, 20)
        }, 20);
        setTimeout(done, 50);
    });
});