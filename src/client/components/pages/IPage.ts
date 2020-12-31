import { Vnode } from "mithril";

export interface IPage {
    hideMainLayout?: boolean,
    view(vnode?: Vnode): Vnode,
}