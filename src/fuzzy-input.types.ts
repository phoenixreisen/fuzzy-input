//--- Types -----

export type Attrs = {
    label?: 'string',
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
    placeholder?: string,
    load: (name: string) => Promise<any>,
    query: (input: string) => Promise<Array<string>>
}

export type State = {
    value: string,
    valid: boolean,
    focused: number,
    loading: boolean,
    error: Error|null,
    result: Array<string>|null
}

export type Events = {
    ESCAPE: ((e: KeyboardEvent) => void) | null,
    ARROW: ((e: KeyboardEvent) => void) | null
}