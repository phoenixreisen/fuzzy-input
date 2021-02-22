# Phoenix Fuzzy-Suche

**Ein Eingabefeld, das während des Tippens bereits Suchergebnisse anzeigt.** Die Komponente stellt nur die Implementierung mittels Mithril.js, die Styles kommen wie immer aus dem Design-System.

Die Komponente ist Teil des [Phoenix Reisen Design-Systems](https://design-system.phoenixreisen.net).

## Demo

https://phoenixreisen.github.io/fuzzy-input

## Installation

[Mithril](https://mithril.js.org/) wird benötigt.

```bash
npm install --save @phoenixreisen/fuzzy-input
```

## Anwendung

#### Parameter / Props

```ts
type Attrs = {
    label?: 'string',
    valid?: boolean,
    pattern?: RegExp,
    warnmsg?: string,
    errormsg?: string,
    maxLength?: number,
    minLength?: number,
    logerror?: boolean,
    disabled?: boolean,
    readonly?: boolean,
    placeholder?: string,
    load: (name: string) => Promise<any>,
    query: (input: string) => Promise<Array<string>>
}
```

#### Aufruf

```ts
import m from 'mithril';
import FuzzyInput from '@phoenixreisen/fuzzy-input';

// Entweder JSX
<FuzzyInput
    label={'Vorlagensuche'}
    pattern={new RegExp(/[a-Z]/)}
    warnmsg={'Ungueltige Eingabe'}
    errormsg={'Huch, ein Fehler ist aufgetreten.'}
    query={(needle: string) => console.log('search it')}
    load={(choice: string) => console.log('get it')}
/>

//oder Hypescript bzw. JS
m(FuzzyInput, {
    disabled: false
    label: 'Vorlagensuche'
    pattern: new RegExp(/[0-9]/)
    warnmsg: 'Ungültige Eingabe'
    errormsg: 'Es ist ein Fehler aufgetreten.'
    load: (name: string) => setTemplate(form, name)
    query: (input: string) => Functions.getTemplateNames(User.jwt, input)
});
```

## Test

```bash
[npm install]
npm run test
```

## Deployment

```bash
[npm install]                       # Abhängigkeiten installieren
npm version [major|minor|patch]     # increase version x.x.x => major.minor.patch
npm publish                         # upload to npm
git push
```

## Github Page

Demo kann manuell mittels Rollup gebaut werden.

```bash
[npm install]
npm run compile:example
```

Nach `git push` automatisch zu erreichen unter:
https://phoenixreisen.github.io/fuzzy/