import {focus, isValid, load, reset, search} from './fuzzy-input.fns';
import {events, MAXLENGTH} from './fuzzy-input.consts';
import {Attrs, State} from './fuzzy-input.types';
import m from 'mithril';

//--- Komponente -----

export class FuzzyInput {

    oninit({state}: m.Vnode<Attrs, State>) {
        state.value = '';
        state.error = null;
        state.result = null;
        state.loading = false;
        state.focused = -1;
    }

    oncreate({state, attrs}: m.Vnode<Attrs, State>) {
        events.ESCAPE = (e: KeyboardEvent) => reset(state, e);
        events.ARROW_DOWN = (e: KeyboardEvent) => focus(state, attrs, e);
        document.body.addEventListener('keydown', events.ARROW_DOWN, true);
        document.body.addEventListener('keyup', events.ESCAPE, true);
    }

    onremove() {
        if(events.ESCAPE)
            document.body.removeEventListener('keyup', events.ESCAPE, true);
        if(events.ARROW_DOWN)
            document.body.removeEventListener('keydown', events.ARROW_DOWN, true);
    }

    view({state, attrs}: m.Vnode<Attrs, State>) {
        const {label, maxLength, placeholder} = attrs;
        const {loading, value, result, error} = state;

        const showErrormsg = !!(error && (attrs.errormsg !== ''));
        const showResultlist = !!(value && (result?.map) && !loading);
        const showWarnmsg = !!((attrs.warnmsg !== '') && (value.length > 0) && !isValid(value, attrs));

        return (
            <article class="fuzzy-search fuzzy-show-result">
                {showErrormsg &&
                    <div class="bounceIn animated fuzzy-error">
                        <div class="alert alert--danger alert--icon">
                            <i class="fas fa-times"></i>
                            {attrs.errormsg || 'Oha, während der Abfrage ist ein  Fehler aufgetreten.'}
                        </div>
                    </div>
                }
                {showWarnmsg &&
                    <div class="bounceIn animated fuzzy-warning">
                        <div class="alert alert--warning alert--icon">
                            <i class="fas fa-exclamation-triangle"></i>
                            {attrs.warnmsg || 'Ungültige Eingabe.'}
                        </div>
                    </div>
                }
                <label class={`textfield fuzzy-input ${attrs.disabled ? 'disabled':''}`}>
                    <input
                        type="text"
                        name="fuzzy"
                        value={value}
                        id="fuzzy-input"
                        autocomplete="fuzzy"
                        readonly={attrs.readonly || false}
                        placeholder={placeholder || '...'}
                        maxlength={maxLength || MAXLENGTH}
                        oninput={(e) => search(e.target.value, state, attrs)}
                    />
                    <span class="textfield__label">
                        {label || 'Suche'}
                    </span>
                </label>

                {showResultlist && [
                    <div class="fuzzy-overlay fuzzy-result fuzzy-style">
                        <div class="fadeIn animated faster">
                            {result?.map((name, index) =>
                                <a id={`fuzzy-item-${index}`} href="javascript:"
                                    onclick={() => load(name, state, attrs)}>
                                    {name}
                                </a>,
                            )}
                        </div>
                    </div>,
                    <div class="fuzzy-bg-layer" onclick={() => reset(state)}></div>,
                ]}
            </article>
        );
    }
}

export default FuzzyInput;