import { centered, create_managed, create_window } from "./wm.js";
import { abs } from "./util/offsets.js";
import termemu from "./termemu.js";
import wm, { add_control } from "./controls.js";
import { authReqUrl, parse_callback} from "./util/api.js";

const auth = {};

const program_list = (x, y, w, h) => ({
    wm_hello: () => create_window(window.welcomed ? "John's iMac - About" : "Welcome to John's iMac", 441, 321, 320, 240, true, (ctx) => {
        add_control(wm.Frame("HelloFrame", "./about.html", 314, 214, 0.75), ctx.control);
    }),
    wm_does: () => create_window("wmdoes.jpg", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
        add_control(wm.Frame("Wmdoes", "./wmdoes.jpg", 314, 214, 1, true), ctx.control);
    }),
    wm_term: () => create_window("termemu", centered(640, w), centered(480, h), 640, 480, true, (ctx) => {
        add_control(termemu(), ctx.control);
    }),
    wm_ctl: () => create_window("Control Panel", 600, 80, 160, 72, false, (ctx) => {
        add_control(wm.ControlPanel(document.body), ctx.control);
    }),
    wm_burg: () => create_window("'burgh.exe (recursive)", centered(800, w), centered(184, h), 800, 185, true, (ctx) => {
        add_control(wm.ProxyFrame("http://ehpt.org/vending"), ctx.control);
    }),
    osauthu: () => create_window("osu!auth token request", centered(540, w), centered(480, h), 540, 657, true, (ctx) => {
        add_control(wm.Frame("auth-frame", authReqUrl, 534, 631, 4, false, (ev) => {
            const response = parse_callback(ev.target.contentWindow.location);
            if (!response) return;
            if (response.tag && response.params.code) {
                auth[response.tag] = response.params.code;
                console.log(`[wm-auth/${response.tag}] Authentication succeeded, closing frame window.`);
                console.debug("tok: " + response.params.code);
                ctx.control.close();
            }
        }), ctx.control);
    }),
    Browser: () => create_window("Browser", centered(abs.x, w), centered(abs.y, h), abs.x, abs.y, true, (ctx) => {
        add_control(wm.Browser(), ctx.control);
    })
});

create_managed("winwm", document.body, 800, 600, program_list)();