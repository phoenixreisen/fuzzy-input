import {Demo} from './fuzzy.demo';
import m from 'mithril';

const Root: m.Component<{}> = {
    view() {
        return m(Demo);
    },
};

const container = document.querySelector('.example-app');
container && m.mount(container, Root);