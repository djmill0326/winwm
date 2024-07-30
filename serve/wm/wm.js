import { wm as c, add, Control, wmid_wsprefix } from "./controls.js";
import { DefaultProgramOptions } from "./options.js";
import { create_file_selector as cfs, create_menu_bar as cmb } from "./modules/fs.js";

import $$ from "./$.js";
export const $ = $$;

export const create_window = (name, x=0, y=0, width=800, height=600, can_close=true, post_init=_ctx=>void 0, z=0, defer=false) => wm.Control(name, Control, {
    children: [],
    hooks: ["mousedown"],
    init: (ctx) => {
        const root = document.createElement("div");
        root.style = `
            position: absolute;
            left:     ${x}px;
            top:      ${y}px;
            width:    ${width}px;
            height:   ${height}px;
        `;
        root.style.zIndex = z;
        root.className = "wm window shadow";
        if(ctx.name) root.dataset.prg = ctx.name;
        ctx.element = root;

        // this will become an actual event system, I promise. TODO: make it work clean and correct
        if (can_close) ctx.control.on("wm_close", data => {
            const filename = ctx.control.filename;
            if (filename) {
                window.wm.open_programs.delete(filename, ctx);
                if (window.wm.wm_bar) window.wm.wm_bar.control.remove(filename);
            }
            ctx.control.ignore("wm_close");
            if (ctx.control.onclose) ctx.control.onclose(ctx);
            root.remove();
            console.debug(`[Terminator] Closed window ${ctx.control.evid} (${name}). <info: ${data}>`);
        });

        const toolbar = c.Toolbar(name, ctx, can_close);
        add(toolbar, ctx.control, true);

        ctx.control.hooks.forEach(hook => root.addEventListener(hook, ev => hooks[hook].forEach(cb => cb(ctx, ev))));

        post_init(ctx);
        ctx.root.append(root);
    }
}, true);

export const create_ctx = (name, control, el_root) => c.Object(name, {
    root: el_root,
    element: null,
    control, name
});

const init_barebones = (ctx) => ctx.control.init(ctx);

const init_children = (ctx) => {
    ctx.control.children.forEach(ctl => {
        const ctx_sub = create_ctx(ctx.name + "::" + ctl.name, ctl, ctx.element);
        run(ctx_sub);
    });
};

export const run = (ctx, minimized) => {
    console.debug(`[run-ctx:${ctx.name}]`, ctx);
    if(ctx.element) ctx.element = void 0;
    try {
        const load = () => {
            init_barebones(ctx);
            init_children(ctx);
            if (ctx.element && minimized) ctx.element.classList.add("hidden");
            const name = ctx.control.filename;
            if (name) {
                if (!window.wm) window.wm = {};
                if (!window.wm.open_programs) window.wm.open_programs = new Map();
                window.wm.open_programs.set(name, ctx);
                if (window.wm.wm_bar) window.wm.wm_bar.control.add(name);
            }
        };
        if (ctx.control.wait) ctx.control.load = load;
        else load();
    } catch (err) {
        alert(`Failed to initialize '${ctx.name}'\nProgram may be in incomplete/unrecoverable state.\nTry clearing LocalStorage.\nLog information is available in DevTools/Inspect Element Console.`);
        console.error(err, "ctx", ctx);
    }
    return ctx;
};

export const add_immediate = (control, ctx) => {
    add(control, ctx.control);
    const ctx_sub = create_ctx(ctx.control.name + "::" + control.name, control, ctx.element);
    run(ctx_sub);
}

const focus = {
    z: 0,
    in_flight: null,
    prev: null
};

export const focus_window = (ctx, _=void 0, lock=false) => {
    if (focus.in_flight) return;
    focus.in_flight = ctx.element;
    ctx.element.classList.remove("hidden");
    ctx.element.style["z-index"] = ++focus.z;
    if (lock) ctx.element.dataset.fLock = lock;
    setTimeout(() => {
        if (focus.prev && !focus.prev.dataset.fLock) focus.prev.classList.remove("focus");
        (focus.prev = focus.in_flight).classList.add("focus");
        focus.in_flight = null;
        console.debug("[HandleFocus] Window focused.", ctx.control);
    }, 0);
}

export const centered = (size, parent_size) => (parent_size - size) / 2;

export const create_program = (name, root, cb, width=800, height=600) => {
    const x = Math.max(centered(width, root.clientWidth), 0);
    const y = Math.max(centered(height, root.clientHeight), 0);
    return create_ctx(name, cb(x, y, width, height), root);
};

const hooks = {};
const register_hook = (name, cb=_=>{ throw new Error("[idiot-detector] unconfigured callback?") }) => {
    if(!hooks[name]) hooks[name] = [];
    hooks[name].push(cb);
};

export const create_root = (name, program_list_factory, title="John's iMac - Desktop", postinit=sys=>sys, opt=DefaultProgramOptions) => (x, y, w, h) => {
    const program_list = program_list_factory(x, y, w, h);
    const programs = {};
    const open_programs = new Map();

    const read_program_state = () => {
        const state = localStorage.getItem(wmid_wsprefix());
        if  (!state) return [];
        const read = state.split(",");
        read.pop();
        return read;
    };
    
    const wm_root = create_window(title, x, y, w, h, opt.unrooted);
    const wm_desktop = c.Control("Desktop", Control, {
        children: [],
        init: (ctx) => {
            const root = document.createElement("section");
            root.className = "wm desktop row";
            const desktop_programs = Object.keys(program_list).map(name => {
                programs[name] = () => create_program(name, opt.unrooted ? document.body : root, () => {
                    const wnd = program_list[name]();
                    wnd.filename = name;
                    return wnd;
                });

                const container = document.createElement("button");
                container.className = "wm simple desktop-icon";
                const icon = document.createElement("img");
                icon.className = "wm shadow ico";
                icon.src = "/favicon.ico";
                const label = document.createElement("a");
                label.className = "wm shadow";
                label.innerText = name;

                container.addEventListener("click", () => {
                    let  prog = open_programs.get(name);
                    if  (prog) return focus_window(prog);
                    else prog = programs[name]();
                    run (prog);
                    focus_window(prog);
                });

                container.append(label, icon);
                return container;
            });
            root.append(...desktop_programs);
            ctx.element = root;
            ctx.root.append(root);

            run(programs.wm_ctl(), true);
            if (!window.welcomed || opt.alwaysWelcome) run(programs.wm_hello());

            const to_open = read_program_state();
            to_open.forEach(name => {
                if (open_programs.has(name)) return;
                run(programs[name](), opt.hiddenCtl && name === "wm_ctl");
            });

            c.spool_animations();
            if (window.wm && window.wm.open_programs) window.wm.open_programs.forEach((prg, name) => open_programs.set(name, prg));
            const info = { wm_root, wm_desktop, programs, open_programs };
            window.wm = info;
            console.info("[winwm] System initialized. Runtime data:", info)
            postinit(info);
        }
    });

    register_hook("mousedown", focus_window);
    add(cmb(), wm_root);
    add(wm_desktop, wm_root);

    const save_program_state = (e) => {
        if(window.wmid && e) clearInterval(window.wmid.psint);
        let x = "";
        open_programs.forEach((_, v) => x += v + ",");
        localStorage.setItem(wmid_wsprefix(), x);
        if (window.icw) localStorage.setItem("wasteful_clock", "yea");
        else localStorage.removeItem("wasteful_clock");
        console.debug("[QuickSave] saved.");
    };

    window.wmid = { psint: setInterval(save_program_state, 60000) };
    window.addEventListener("beforeunload", save_program_state);

    setTimeout(() => run(create_ctx("wm-bar", c.Taskbar(name, open_programs), document.body)), 0);

    return wm_root;
};

const check_welcomeness = () => {
    window.welcomed = localStorage.getItem("welcomed") === "yea";
};

export const create_managed = (name, root_el, width, height,  program_factory, title, postinit=sys=>sys, opt=DefaultProgramOptions) => {
    const program = create_program(name, root_el, create_root(name, program_factory, title, postinit, opt), width, height);
    window.wmid.ref = name;
    check_welcomeness();
    return (swap_ctx=void 0) => {
        const ctx = swap_ctx ? swap_ctx : program;
        run(ctx);
        focus_window(ctx, void 0, true);
        window.welcomed = true;
        localStorage.setItem("welcomed", "yea");
    };
};

export const wm = window.Wm = {
    ...c, run, add_immediate, util: { centered },
    FileSelector: cfs,
    MenuBar: cmb,
    Ctx: create_ctx,
    Window: create_window,
    Program: create_program,
    Full: create_managed,
    focus: focus_window
};  export default wm;