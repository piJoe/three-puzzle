import { Vnode } from "mithril";

export interface IPage {
    hideMainLayout?: boolean,
    view(): Vnode,
}