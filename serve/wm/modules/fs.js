import wm from "../controls.js";

export const read_file = (file_list) => {
    const file = file_list[0];
    if(!file) return null;
    console.log("read file", file);
    return file.arrayBuffer();
};

export const create_file_selector = (cb) => wm.Button("File", () => {
    const root = document.createElement("input");
    root.type = "file";
    root.dispatchEvent(new PointerEvent("click"));
    root.addEventListener("input", () => cb(read_file(root.files)));
});

export const create_menu_bar = (cb=console.debug) => wm.Control("FileSelector", {
    children: [],
    init: (ctx) => {
        const root = document.createElement("section");
        root.className = "wm menubar";
        wm.add(create_file_selector(cb), ctx.control);
        wm.add(wm.Clock(), ctx.control);
        ctx.element = root;
        ctx.root.append(root);
    }
})

export default create_file_selector;