//--- Types -----

export type Attrs = {
    id?: string,
    label?: string,
    valid?: boolean,
    pattern?: RegExp,
    warnmsg?: string,
    errormsg?: string,
    disabled?: boolean,
    readonly?: boolean,
    logerror?: boolean,
    maxLength?: number,
    minLength?: number,
    throttling?: number,
    withButton?: boolean,
    placeholder?: string,
    inText?: {
        prefix: string,
        suffix: string,
    },
    value: () => string,
    oninput: (input: string) => void,
    onblur?: (param?: unknown) => void,
    load: (name: string) => Promise<unknown>,
    query: (input?: string) => Promise<Array<string>>,
}

export type State = {
    value: string,
    valid: boolean,
    focused: number,
    loading: boolean,
    error: Error|null,
    match: string|null,
    result: Array<string>|null
}

export type Events = {
    ESCAPE: ((e: KeyboardEvent) => void) | null,
    ARROW: ((e: KeyboardEvent) => void) | null
}