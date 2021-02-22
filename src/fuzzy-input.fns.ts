import {MINLENGTH, THROTTLING} from './fuzzy-input.consts';
import {State, Attrs} from './fuzzy-input.types';
import m from 'mithril';

//--- Funktionen -----

export function isValid(input: string, attrs: Attrs): boolean {
    if((typeof attrs.valid !== 'undefined') && !attrs.valid) {
        return false;
    } else if(attrs.pattern) {
        return attrs.pattern.test(input);
    } else {
        return true;
    }
}

export function isReady(input: string, state: State, attrs: Attrs): boolean {
    const minLength = (typeof attrs.minLength !== 'undefined') ? attrs.minLength : MINLENGTH;
    return input.length >= minLength
        && input === state.value
        && !state.loading;
}

export function reset(state: State, e?: KeyboardEvent): void {
    if(!e || e.key === 'Escape') {
        state.focused = -1;
        state.error = null;
        state.result = null;
        state.loading = false;
        m.redraw();
    }
}

export function search(input: string, state: State, attrs: Attrs): void {
    setTimeout(() => {
        if(isReady(input, state, attrs) && isValid(input, attrs)) {
            state.error = null;
            state.loading = true;
            attrs.query(input)
                .then((result: Array<string>) => {
                    state.result = result;
                })
                .catch((error: any) => {
                    state.error = error;
                    attrs.logerror &&
                        console.error(error);
                })
                .finally(() => {
                    state.loading = false;
                    m.redraw();
                });
        } else if(!input.length) {
            reset(state);
        }
    }, (attrs.throttling || THROTTLING));
    state.value = input;
}

export function load(name: string, state: State, attrs: Attrs): Promise<any> {
    return attrs.load(name)
        .then(() => {
            reset(state);
            state.value = name;
        })
        .catch((error) => {
            state.error = error;
            attrs.logerror &&
                console.error(error);
        })
        .finally(() => {
            m.redraw();
        });
}

export function focus(state: State, attrs: Attrs, e: KeyboardEvent, callback = search): HTMLElement|void {
    const {focused:current, result, value} = state;

    const move = {
        'ArrowUp': () => {
            const prev = current - 1;
            return (prev > -1) ? prev : current;
        },
        'ArrowDown': () => {
            const next = current + 1;
            return (result && (next < result.length)) ? next : current;
        },
    }[e.key];

    // if arrow down or up was pressed and result list is not empty
    if(move && (result?.length)) {
        state.focused = move();
        const id = `#fuzzy-item-${state.focused}`;
        const $el = document.querySelector(id) as HTMLElement;
        $el?.focus();
        return $el;
    } else if(move && !result && (value?.length)) {
        callback?.(value, state, attrs);
    }
}