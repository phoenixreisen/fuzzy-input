import {Events} from './fuzzy-input.types';

//--- Konstanten, Variablen & Objekte -----

/** Defaults */
export const THROTTLING = 500; // ms
export const MAXLENGTH = 100; // chars
export const MINLENGTH = 3; // chars

/** Refs */
export const events: Events = {
    ESCAPE: null,
    ARROW_DOWN: null,
};