import wm, { centered } from "./wm/wm.js";
import { pos, DefaultProgramOptions } from "./wm/options.js";
import { load } from "./wm/modules/loader.js";

const program_list = (x, y, w, h) => ({
    "Explorer": () => wm.Window("Browser - Explore", centered(pos.x, w), centered(pos.y, h), pos.x, pos.y, true, (ctx) => {
        wm.add(wm.Browser(), ctx.control);
    }),
    wm_hello: () => wm.Window(window.welcomed ? "John's iMac - About" : "Welcome to John's iMac", 441, 321, 320, 240, true, (ctx) => {
        wm.add(wm.Frame("HelloFrame", "./about.html", 314, 214, 75), ctx.control);
    }),
    wm_ctl: () => wm.Window("Control Panel", 600, 80, 159, 123, DefaultProgramOptions.optionalCtl, (ctx) => {
        wm.add(wm.ControlPanel(document.body), ctx.control);
    }),
    wm_term: () => wm.Window("termemu", centered(640, w), centered(480, h), 640, 480, true, (ctx) => {
        wm.add(termemu.Terminal(ctx), ctx.control);
    }),
    wm_does: () => wm.Window("wmdoes.jpg", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
        wm.add(wm.Frame("Wmdoes", "/res/wmdoes.jpg", 314, 214, 100, true), ctx.control);
    }),
    wm_burg: () => wm.Window("'burgh.exe (recursive)", centered(800, w), centered(184, h), 800, 185, true, (ctx) => {
        wm.add(wm.ProxyFrame("http://ehpt.org/vending"), ctx.control);
    }),
    osauthu: () => wm.Window("osu!auth token request", centered(540, w), centered(480, h), 540, 657, true, (ctx) => {
        wm.add(wm.Frame("auth-frame", api.authReqUrl, 534, 631, 4, false, (ev) => {
            const tag = api.parse_callback(ev.target.contentWindow.location);
            if (!tag) return;
            console.log(`[wm-auth/${tag}] Authentication succeeded, closing frame window.`);
            ctx.control.emit("wm_close", "@wm-auth");
        }), ctx.control);
    })
});

load("termemu", () => load("api", () => fetch("./melu.css").then(res => res.text().then(css => {
    const s = document.createElement("style");
    s.innerHTML = css;
    document.head.append(s);
    wm.Full("winwm", document.body, 800, 600, program_list)();
}))));