import { centered, create_managed, create_window } from "./wm.js";
import { abs } from "./util/offsets.js";
import termemu from "./termemu.js";
import wm, { add_control } from "./controls.js";

const program_list = (x, y, w, h) => ({
    wm_hello: () => create_window(window.welcomed ? "John's iMac - About" : "Welcome to John's iMac", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
        add_control(wm.Frame("HelloFrame", "./about.html", 314, 214, 0.75), ctx.control);
    }),
    wm_does: () => create_window("wmdoes.jpg", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
        add_control(wm.Frame("Wmdoes", "./wmdoes.jpg", 314, 214, 1, true), ctx.control);
    }),
    wm_term: () => create_window("termemu", centered(640, w), centered(480, h), 640, 480, true, (ctx) => {
        add_control(termemu(), ctx.control);
    }),
    wm_ctl: () => create_window("Control Panel", 800 - 192, 72, 160, 72, false, (ctx) => {
        add_control(wm.ControlPanel(document.body), ctx.control);
    }),
    wm_burg: () => create_window("'burgh.exe (recursive)", centered(801, w), centered(184, h), 800, 185, true, (ctx) => {
        add_control(wm.ProxyFrame("http://ehpt.org/vending"), ctx.control);
    }),
    Browser: () => create_window("Browser", centered(abs.x, w), centered(abs.y, h), abs.x, abs.y, true, (ctx) => {
        add_control(wm.Browser("http://ehpt.org/vending"), ctx.control);
    }),
});

create_managed("winwm", document.body, 800, 600, program_list)();