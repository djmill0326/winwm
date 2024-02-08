import { wm, add_control, add_hook, Control } from "./controls.mjs";
import { create_file_selector, create_menu_bar } from "./fs.mjs";

export const create_window = (name, x=0, y=0, width=800, height=600, can_close=true, cb=()=>{}) => wm.Control(name, Control, {
    children: [],
    hooks: ["click"],
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
    control
});

const init_barebones = (ctx) => {
    ctx.control.init(ctx);
};

const init_children = (ctx) => {
    ctx.control.children.forEach(ctl => {
        const ctx_sub = create_ctx(ctx.name = "::" + ctl.name, ctl, ctx.element);
        run(ctx_sub);
    });
};

const global_focus = {
    element: [],
    z: 1,
    in_flight: []
};

const focus_window = (ctx) => {
    ctx.element.attributeStyleMap.set("z-index", global_focus.z);
    global_focus.in_flight.push(ctx.element);
    if (global_focus.in_flight.length !== 1) return;
    setTimeout(() => {
        global_focus.z += 1;
        global_focus.element.forEach(el => el.classList.toggle("focus"));
        global_focus.element = global_focus.in_flight;
        global_focus.element.forEach(el => el.classList.toggle("focus"));
        global_focus.in_flight = [];
    }, 20);
    
}

export const run = (ctx) => {
    if(ctx.element) return;
    init_barebones(ctx);
    init_children(ctx);
};

export const centered = (size, parent_size) => (parent_size - size) / 2;

export const create_program = (name, root, cb, width=800, height=600) => {
    const x = Math.max(centered(width, root.clientWidth), 0);
    const y = Math.max(centered(height, root.clientHeight), 0);
    return create_ctx(name, cb(x, y, width, height), root);
};

export default {
    ...wm,
    Ctx: create_ctx,
    Window: create_window,
    Program: create_program,
    FileSelector: create_file_selector,
    MenuBar: create_menu_bar,
    run: run,
    util: {
        centered
    }
};

const hooks = {};
const add_global_hook = (hook, cb) => {
    if(!hooks[hook]) hooks[hook] = [];
    hooks[hook].push(cb);
};