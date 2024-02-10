const req_location = "http://localhost/vending/data";

const trim = x => x.trim();
const trim_array_by_index_length = arr => arr.filter(x => x.length !== 0);

const read_csv = uri => fetch(req_location + "/" + uri).then(res => res.text()).then(text => trim_array_by_index_length(text
    .split("\n")
    .map(row => row
        .split(",")
        .map(trim)
    )
    .map(trim_array_by_index_length)
));

const to_csv = data => data.map(row => row.join(",")).join("<br/>");

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
    page_data.forEach((row, index) => {
        const row_el = document.createElement("tr");
        row_el.dataset.index = index;
        row.forEach((col, index) => {
            const col_el = document.createElement("td");
            col_el.dataset.index = index;
            col_el.innerText = col;
            row_el.append(col_el);
        });
        row_el.addEventListener("click", () => open_editor(name, row, row_el));
        root.append(row_el);
    })
    return root;
}

const schema = ["Product", "Size", "Type", "Vendor", "Cost/pkg", "Units/pkg", "Price"];

const editor_frame = document.getElementById("editor");
const open_editor = (page, row, row_el) => {
    if (editor_frame.children.length !== 0) editor_frame.children[0].remove();
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
    close_btn.addEventListener("click", () => root.remove());
    heading.append(label, close_btn);
    const control_frame = document.createElement("section");
    control_frame.className = "wm window focus pad";
    row.forEach((col, index) => {
        const label = document.createElement("label");
        label.for = "editor-" + schema[index];
        label.innerText = schema[index];
        const root = document.createElement("input");
        root.type = "input";
        root.placeholder = schema[index];
        root.value = col;
        root.id = "editor-" + schema[index];
        root.addEventListener("input", () => {
            row[index] = root.value;
            row_el.children[index].innerText = root.value;
        });
        control_frame.append(label, root);
    });
    root.append(heading, control_frame);
    editor_frame.append(root);
}

const main = document.getElementById("main");
const selector = document.getElementById("selector");
const frame = document.getElementById("frame");
const navigate_page = ev => {
    if(window.pages) {
        const page = window.pages[ev.target.dataset.arg];
        if (window.active_page) window.active_page.root.remove();
        window.active_page = page;
        frame.append(page.root);
        console.debug("selected page", page);
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

const page_names = ["Snack", "Candy", "Meal", "Drink", "Water", "Soda", "Energy"];
const page_data_req = Promise.all(page_names.map(async name => await read_csv(name + ".csv")));
page_data_req.then(page_data => {
    const pages = page_data.map((x, i) => create_page(page_names[i], x));
    window.pages = {};
    pages.forEach(page => {
        selector.append(page.selector);
        window.pages[page.name] = page;
    });
    init_links();
    document.getElementById("loading").remove();
    navigate_page({ target: { dataset: { arg: "Snack" } } });
    console.log("Page data loaded successfully.", pages);
    const table_normalized = {};
    pages.forEach(page => page.page_data.forEach(row => {
        const p_group = row[2];
        row[2] = page.name;
        if(!table_normalized[p_group]) table_normalized[p_group] = [];
        table_normalized[p_group].push(row);
    }));
    /* reversible normalization-scheme conversion
    Object.keys(table_normalized).forEach(page => {
        const cache = {};
        table_normalized[page] = table_normalized[page].filter(row => {
            if(!cache[row[0]]) {
                cache[row[0]] = true;
                return true;
            } else return false;
        });
    });
    document.body.innerHTML += "<br/>" + Object.keys(table_normalized).map(key => "<h1>" + key + "</h1>" + to_csv(table_normalized[key])).join("<br/>");*/
});