import { wm, add_control, add_hook, Control } from "./controls.js";

export const create_window = (name, x=0, y=0, width=800, height=600, can_close=true, cb=()=>{}) => wm.Control(name, Control, {
    children: [],
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
    run: run,
    util: {
        centered
    }
};

let first_run = true;
const ctx = create_program("Root", document.body, (x, y, w, h) => {
    const program_list = {
        wm_hello: () => create_window(first_run ? "Welcome to John's iMac!" : "John's iMac - About", centered(320, w), centered(240, h), 320, 240, true, (ctx) => {
            add_control(wm.Frame("HelloFrame", "./about.html", 314, 214), ctx.control);
        })
    };
    const programs = {};
    const open_programs = new Set();
    
    const wm_root = create_window("John's iMac - Desktop", x, y, w, h, false);
    const wm_desktop = wm.Control("Desktop", Control, {
        children: [],
        init: (ctx) => {
            const root = document.createElement("section");
            root.className = "wm desktop";
            const desktop_programs = Object.keys(program_list).map(name => {
                programs[name] = () => create_program(name, root, () => {
                    const window = program_list[name]();
                    add_hook(window, "onclose", () => open_programs.delete(name));
                    return window;
                });

                const container = document.createElement("button");
                container.className = "wm desktop-icon";
                const icon = document.createElement("img");
                icon.className = "wm shadow";
                icon.src = "./folder.png";
                const label = document.createElement("a");
                label.className = "wm shadow";
                label.innerText = name;

                container.addEventListener("click", () => {
                    if (open_programs.has(name)) return;
                    run(programs[name]());
                    open_programs.add(name);
                });

                container.append(icon, label);
                return container;
            });
            root.append(...desktop_programs);
            ctx.element = root;
            ctx.root.append(root);
            run(programs.wm_hello());
            open_programs.add("wm_hello");
        }
    });
    add_control(wm_desktop, wm_root);
    return wm_root;
});
run(ctx);
first_run = false;