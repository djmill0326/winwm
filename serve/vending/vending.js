import { read_managed, get_row } from "./csv.js";
import schema from "./schema.js";
import wm, { centered } from "../wm/wm.js";
import {opt} from "../wm/options.js";

// frankenstein-ass program

const req_location = "http://ehpt.org/vending/data/";
const request = uri => read_managed(req_location + uri, schema);

const create_page = (name, page_data) => {
    const root = document.createElement("section");
    root.id = "page-" + name;
    root.className = "wm fancy pad";
    const heading = document.createElement("h1");
    heading.className = "page-heading";
    heading.innerText = name;
    root.append(heading);
    const table = create_table(name, page_data);
    root.append(table);
    const selector = document.createElement("a");
    selector.href = "#" + name;
    selector.className = "link";
    selector.innerText = name;
    selector.dataset.arg = name;
    selector.dataset.onclick = "navigate_page";
    return { name, page_data, root, selector };
};

const create_table = (name, page_data) => {
    const root = document.createElement("table");
    root.dataset.name = name;
    root.className = "wm page-table";
    const heading = document.createElement("thead");
    schema.forEach(({ x }) => {
        const td = document.createElement("td");
        td.innerText = x;
        heading.append(td);
    });
    root.append(heading);
    page_data.forEach((row, index) => {
        const row_el = document.createElement("tbody");
        populate_row(name, index, row, row_el, root);
        root.append(row_el);
    });
    return root;
}

const editor = { active: false, page: null, row: null };
const editor_frame_old = document.getElementById("editor");
let editor_frame_ctl = null;
const editor_window = () => {
    // query isn't necessary here, I'm just lazy
    const existent = document.querySelector('[data-prg="edit"]');
    if (existent) return;
    return wm.Window("VendingEditor", 20, 88, 420, 420, true, ctx => {
        wm.set_hook(ctx.control, "onclose", () => dirty());
        if (editor_frame_ctl) wm.add_immediate(wm.Basic("editor-inner", editor_frame_ctl), ctx);
        else {
            const page = localStorage.savedPage;
            const index = localStorage.savedIndex;
            console.log(page, index);
            if (page || index) {
                const fixer = () => {
                    if (!window.pages) return setTimeout(fixer, 100/6);
                    ctx.control.emit("wm_close", "@editor-patch");
                    if (page) document.querySelector(`[data-arg="${page}"]`).click();
                    if (index) document.querySelector(`tr[data-index="${index}"]`).click();
                }; fixer();
            }
        }
    });
}

const open_editor = (page, index, row_el) => {
    dirty();
    editor.active = true;
    editor.page = page;
    editor.row = index;
    const row = window.pages[page].page_data[index];
    const root = document.createElement("section");
    root.className = "wm window focus";
    const heading = document.createElement("section");
    heading.className = "wm toolbar";
    const label = document.createElement("label");
    label.innerText = `Editing (${page}, ${row[0]})`;
    label.className = "title";
    const close_btn = document.createElement("button");
    close_btn.className = "button";
    close_btn.innerHTML = "&#10006;";
    close_btn.addEventListener("click", () => dirty());
    heading.append(label, close_btn);
    const control_frame = document.createElement("section");
    control_frame.className = "wm window pad focus";
    row.forEach((col, index) => {
        const name = schema[index].x;
        const label = document.createElement("label");
        label.for = "editor-" + name;
        label.innerText = name;
        const root = document.createElement("input");
        root.type = "input";
        root.placeholder = name;
        root.value = col;
        root.id = "editor-" + name;
        if (index > 6) root.disabled = true;
        root.addEventListener("input", () => {
            row[index] = root.value;
            row_el.children[index].innerText = root.value;
        });
        control_frame.append(label, root);
    });
    root.append(heading, control_frame);
    editor_frame_ctl = control_frame;
    // editor_frame_old.append(root, control_frame);
    const ctx = wm.run(window.wm.programs.edit());
    ctx.control.title(label.innerText);
    localStorage.savedPage = page;
    localStorage.savedIndex = index;
}

const selector = document.getElementById("selector");
const frame = document.getElementById("frame");
const navigate_page = ev => {
    if(window.pages) {
        dirty();
        const page = window.pages[ev.target.dataset.arg];
        if (window.active_page) window.active_page.root.remove();
        window.active_page = page;
        frame.append(page.root);
        console.info(`[Vending] selected page *${page.name}*`, page);
    }
};

const init_links = () => {
    const links = document.querySelectorAll("a.link");
    for (let i = 0; i < links.length; i++) {
        const el = links.item(i);
        if (el.dataset.onclick) {
            const fn = eval(el.dataset.onclick);
            fn.bind(this);
            el.addEventListener("click", ev => fn(ev, el.dataset.arg));
        }
    }
}

const page_names = ["Snacks", "Candy", "Meals", "Drinks", "Water", "Soda", "Energy"];
const page_data_req = Promise.all(page_names.map(async name => await request(name + ".csv")));
page_data_req.then(managed_data => {
    const page_data = managed_data.map(x => x.resolve());
    const pages = page_data.map((x, i) => create_page(page_names[i], x));
    window.pages = {};
    pages.forEach(page => {
        selector.append(page.selector);
        window.pages[page.name] = page;
    });
    init_links();
    document.getElementById("loading").remove();
    navigate_page({ target: { dataset: { arg: "Snacks" } } });
    console.info("Page data loaded successfully.");
    pages.forEach(page => console.debug(page))
    const table_normalized = {};
    pages.forEach(page => page.page_data.forEach(row => {
        const p_group = row[2];
        if(!table_normalized[p_group]) table_normalized[p_group] = [];
        table_normalized[p_group].push(row);
    }));
});

const populate_row = (table_name, index, data, row_el) => {
    const root = document.createElement("tr");
    root.dataset.index = index;
    data.forEach((col, i) => {
        const col_el = document.createElement("td");
        col_el.dataset.index = i;
        col_el.innerText = col;
        root.append(col_el);
    });
    root.addEventListener("click", () => open_editor(table_name, index, root));
    if (row_el.children[0]) row_el.children[0].remove();
    row_el.append(root);
};

const update_one = (page, index) => {
    const table_el = page.root.children[1];
    const row_el = table_el.children[index + 1];
    const row_data = get_row(schema, page.page_data, index);
    populate_row(page.name, index, row_data, row_el, table_el);
};

const dirty = () => {
    if (editor.active) {
        editor.active = false;
        // note: there's an interesting bug here where the original computed values remain
        // within the editor even if they should've changed. i'm not fixing it. it's cool
        if (editor_frame_old.children.length !== 0) editor_frame_old.children[0].remove();
        update_one(window.pages[editor.page], editor.row);
        console.info("Updated editor state.", editor);
    }
};

const ww = window.innerWidth;
const wh = window.innerHeight;
const program_list = (_, __, w) => ({
    wm_hello: () => wm.Window(window.welcomed ? "winwm — About" : "Welcome to winwm.", centered(320, ww), centered(240, wh), 320, 240, true, (ctx) => {
        wm.add(wm.Frame("HelloFrame", "/vending/about.html", 314, 214, 75), ctx.control);
    }, 1),
    wm_ctl: () => wm.Window("Control Panel", ww - 160, wh - 123, 160, 123, false, (ctx) => {
        wm.add(wm.ControlPanel(document.body), ctx.control);
    }),
    wm_does: () => wm.Window("wmdoes.jpg", 0, 0, 320, 240, true, (ctx) => {
        wm.add(wm.Frame("Wmdoes", "/res/wmdoes.jpg", 314, 214, 100, true), ctx.control);
    }),
    wm_burg: () => wm.Window("'burgh.exe (recursive)", 0, 0, w, 271, true, (ctx) => {
        wm.add(wm.ProxyFrame("http://ehpt.org/vending"), ctx.control);
    }),
    edit: editor_window
});

wm.Full("winwm-VendingCompat", document.body, 350, 420, program_list, null, ()=>{}, opt(({ hiddenCtl: true, unrooted: true })))();
document.querySelector(".wm.desktop.row").style["flex-direction"] = "row";