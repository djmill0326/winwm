import { wm, add_control, add_hook, Control } from "./controls.js";
import { create_file_selector as cfs, create_menu_bar as cmb } from "./fs.js";

export const create_window = (name, x=0, y=0, width=800, height=600, can_close=true, cb=ctx=>{}) => wm.Control(name, Control, {
    children: [],
    hooks: ["mousedown"],
    init: (ctx) => {
        const root = document.createElement("div");
        root.style = `
            position: absolute;
            width: ${width}px;
            height: ${height}px;
            left: ${x}px;
            top: ${y}px;
        `;
        root.className = "wm window shadow";
        if(ctx.name) root.dataset.prg = ctx.name;
        ctx.element = root;
        add_control(wm.Toolbar(name, ctx.control, can_close), ctx.control, true);

        ctx.control.hooks.forEach(hook => {
            root.addEventListener(hook, (ev) => {
                hooks[hook].forEach(cb => cb(ctx, ev))
            });
        });

        cb(ctx);
        ctx.root.append(root);
    },
    dimensions: (ctx) => ({
        x: ctx.element.attributeStyleMap.get("left"), 
        y: ctx.element.attributeStyleMap.get("top"), 
        width: ctx.element.attributeStyleMap.get("width"), 
        height: ctx.element.attributeStyleMap.get("height")
    })
});

export const create_ctx = (name, control, el_root) => wm.Object(name, {
    root: el_root,
    element: null,
    control, name
});

const init_barebones = (ctx) => ctx.control.init(ctx);

const init_children = (ctx) => {
    ctx.control.children.forEach(ctl => {
        const ctx_sub = create_ctx(ctx.name = "::" + ctl.name, ctl, ctx.element);
        run(ctx_sub);
    });
};

const global_focus = {
    element: [],
    z: 0,
    in_flight: []
};

export const focus_window = (ctx) => {
    console.debug("[FocusHandler] Window focused.", ctx.control);
    ctx.element.style["z-index"] = global_focus.z;
    global_focus.in_flight.push(ctx.element);
    if (global_focus.in_flight.length !== 1) return;
    setTimeout(() => {
        global_focus.z += 1;
        global_focus.element.forEach(el => el.classList.toggle("focus"));
        global_focus.element = global_focus.in_flight;
        global_focus.element.forEach(el => el.classList.toggle("focus"));
        global_focus.in_flight = [];
    }, 0);
}

export const run = (ctx) => {
    if(ctx.element) return;
    init_barebones(ctx);
    init_children(ctx);
    return ctx;
};

export const centered = (size, parent_size) => (parent_size - size) / 2;

export const create_program = (name, root, cb, width=800, height=600) => {
    const x = Math.max(centered(width, root.clientWidth), 0);
    const y = Math.max(centered(height, root.clientHeight), 0);
    return create_ctx(name, cb(x, y, width, height), root);
};

export const Full = {
    ...wm, util: { centered },
    Ctx: create_ctx, run: run,
    Window: create_window,
    Program: create_program,
    FileSelector: cfs, MenuBar: cmb
}; window.Wm = Full;
export default Full;

const hooks = {}; // don't use this unless you actually know why I'm writing this comment     /* unreachable code (ts-in-js) */
const register_hook = (name, cb=_=>{ throw new Error("[idiot-detector] unconfigured callback?"); return typeof object }) => {
    if(!hooks[name]) hooks[name] = [];
    hooks[name].push(cb);
};

let first_run = true;
export const create_root = (addl_programs, postinit=sys=>sys) => (x, y, w, h) => {
    const program_list = {
        wm_hello: () => create_window(first_run ? "Welcome to winwm." : "winwm — About", 14, 148, 320, 240, true, (ctx) => {
            add_control(wm.Frame("HelloFrame", "/vending/about.html", 314, 214, 0.75), ctx.control);
        }),
        wm_does: () => create_window("wmdoes.jpg", 0, 0, 320, 240, true, (ctx) => {
            add_control(wm.Frame("Wmdoes", "./wmdoes.jpg", 314, 214, 1, true), ctx.control);
        }),
        wm_ctl: () => create_window("Control Panel", 144, 222, 160, 48, true, (ctx) => {
            add_control(wm.ControlPanel(document.body), ctx.control);
        }),
        wm_burg: () => create_window("'burgh.exe (recursive)", 0, 0, w, 271, true, (ctx) => {
            add_control(wm.ProxyFrame("http://ehpt.org/vending"), ctx.control);
        }),
        ...addl_programs
    };

    const programs = {};
    const open_programs = new Map();
    
    const wm_root = create_window("winwm — Available Programs", x, y, 350, 136, false);
    const wm_desktop = wm.Control("Desktop", Control, {
        children: [],
        init: (ctx) => {
            const root = document.createElement("section");
            root.className = "wm desktop row";
            const desktop_programs = Object.keys(program_list).map(name => {
                programs[name] = () => create_program(name, root, () => {
                    const window = program_list[name]();
                    add_hook(window, "onclose", () => open_programs.delete(name));
                    return window;
                });

                const container = document.createElement("button");
                container.className = "wm simple desktop-icon";
                const icon = document.createElement("img");
                icon.className = "wm shadow ico";
                icon.src = "/folder.png";
                const label = document.createElement("a");
                label.className = "wm shadow";
                label.innerText = name;

                container.addEventListener("click", () => {
                    let  prog;
                    if  (prog = open_programs.get(name)) return focus_window(prog);
                    else prog = programs[name]();
                    run (prog);
                    focus_window(prog);
                    open_programs.set(name, prog);
                });

                container.append(icon, label);
                return container;
            });
            root.append(...desktop_programs);
            ctx.element = root;
            ctx.root.append(root);
            open_programs.set("wm_hello", run(programs.wm_hello()));
            open_programs.set("wm_ctl", run(programs.wm_ctl()));
            wm.spool_animations();
            const info = { wm_root, wm_desktop, programs, open_programs };
            window.wm = info;
            console.warn("[winwm] system initialized. runtime info:", info)
            postinit(info);
        }
    });

    register_hook("mousedown", focus_window);
    add_control(cmb(), wm_root);
    add_control(wm_desktop, wm_root);
    return wm_root;
};

export const managed_run = (root_ctx) => {
    return (with_context) => {
        const ctx = with_context ? with_context : root_ctx;
        run(ctx);
        focus_window(ctx);
        first_run = false;
    };
};