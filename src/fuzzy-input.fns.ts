import {MINLENGTH, THROTTLING, ID} from './fuzzy-input.consts';
import {State, Attrs} from './fuzzy-input.types';
import m from 'mithril';

//--- Funktionen -----

export function setValue(input: string, state:State, attrs: Attrs): void {
    attrs.oninput ? attrs.oninput(input) : Object.assign(state, {value: input});
}
export function getValue(state: State, attrs: Attrs): string {
    return attrs.value ? attrs.value() : state.value;
}

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
        && input === getValue(state, attrs)
        && !state.loading;
}

export function reset(state: State, e?: KeyboardEvent): void {
    if(!e || e.key === 'Escape') {
        state.focused = -1;
        state.error = null;
        state.match = null;
        state.result = null;
        state.loading = false;
        m.redraw();
    }
}

export function findMatch(input: string, prefix: string): string|null {
    // Prefix gefolgt von erlaubten Zeichen, endend mit Leerzeichen oder EOL.
    const pattern = `${prefix}[0-9a-zA-ZüöäÜÖÄß_#%\\?\\-\\+]*(\\s|$)`;
    const regex = new RegExp(pattern, 'gmi');
    return input.match(regex)?.[0]?.trim() ?? null;
}

export function callQuery(state: State, attrs: Attrs, needle?: string): Promise<void> {
    state.error = null;
    state.loading = true;
    return attrs.query(needle)
        .then((result: Array<string>) => {
            state.result = (attrs.inText && (needle?.length))
                ? result.filter(item => item.includes(needle))
                : result;
        })
        .catch((error) => {
            state.error = error;
            if(attrs.logerror) {
                console.error(error);
            }
        })
        .finally(() => {
            state.loading = false;
            m.redraw();
        });
}

export function search(input: string, state: State, attrs: Attrs, query = callQuery): void {
    setTimeout(() => {
        if(attrs.inText && !state.loading) {
            const {prefix} = attrs.inText;
            const match = findMatch(input, prefix);
            if(match) {
                state.match = match;
                const needle = match.replace('{{', '').trim();
                query(state, attrs, needle);
            } else {
                reset(state);
            }
        } else if(isReady(input, state, attrs) && isValid(input, attrs)) {
            query(state, attrs, input)
        } else if(!input.length) {
            reset(state);
        }
    }, (attrs.throttling || THROTTLING));
    setValue(input, state, attrs);
}

export function load(choice: string, state: State, attrs: Attrs): Promise<unknown> {
    return attrs.load(choice)
        .then(() => {
            if(attrs.inText) {
                const {prefix, suffix} = attrs.inText;
                // Ein Platzhalter wurde angefangen, dann ausgewählt.
                // Das Getippte wird durch Auswahl ersetzt bzw. vervollständigt.
                if(state.match) {
                    const value = getValue(state, attrs);
                    const pattern = new RegExp(`${state.match}(\\s|$)`);
                    setValue(value.replace(pattern, `${prefix}${choice}${suffix} `), state, attrs);
                }
                // Es wurde einfach ein Platzhalter aus der Liste ausgewählt (z.B. über Button)
                // und wird an aktueller Cursor-Position eingefügt.
                else {
                    const $input = document.querySelector(`#${attrs.id || ID}`) as HTMLInputElement;
                    const cursorPosition = $input?.selectionStart ?? undefined;
                    if(typeof cursorPosition !== 'undefined') {
                        const start = getValue(state, attrs).substring(0, cursorPosition);
                        const end = getValue(state, attrs).substring(cursorPosition);
                        setValue(`${start}${prefix}${choice}${suffix}${end}`, state, attrs);
                    } else {
                        setValue(`${getValue(state, attrs)}${prefix}${choice}${suffix}`, state, attrs);
                    }
                }
                (document.querySelector(`#${attrs.id || ID}`) as HTMLElement)?.focus();
                m.redraw();
            } else {
                setValue(choice, state, attrs);
            }
            reset(state);
        })
        .catch((error) => {
            state.error = error;
            if(attrs.logerror) {
                console.error(error);
            }
        })
        .finally(() => {
            m.redraw();
        });
}

export function focus(state: State, attrs: Attrs, e: KeyboardEvent, callback = search): void {
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
        const id = `#${attrs.id || ID}-item-${state.focused}`;
        const $el = document.querySelector(id) as HTMLElement;
        $el?.focus();
    } else if(move && !result && (value?.length)) {
        callback?.(value, state, attrs);
    }
}