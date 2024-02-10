import wm from "./wm.js";
import "/socket.io/socket.io.js";

export const create_term = () => wm.Control("termemu", {
    children: [],
    init: (ctx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "wm dark bound focus";
        let root = null;
        const terminal = document.createElement("pre");
        terminal.className = "wm window bound";
        terminal.style = `
            background: #111;
            color: #eee;
            font-size: 14px;
            margin: 0px;
            padding: 4px;
            font-family: monospace!important;
            max-height: calc(100% - 64px);
        `;
        const input = document.createElement("input");
        input.style = `
            width: 100%;
            background: #111;
            color: #eee;
            font-size: 14px;
            margin: 0px;
            padding: 4px;
            font-family: monospace!important;
            outline: none!important;
        `;
        input.type = "text";
        input.className = "wm window";
        const div = document.createElement("div");
        div.className = "wm grow clear";
        
        const autoscroll = (el) => {
            el.scrollTo(0, el.scrollHeight - el.clientHeight)
        };
        
        autoscroll(terminal);
        
        const socket = io();
        socket.on("connect", () => {
            socket.emit("request_link");
        });
        
        socket.on("init_link", (data) => {
            if (root) root.remove();
            root = document.createElement("div");
            root.className = "wm window";
            root.style = `
                flex-direction: row;
            `;
            data.forEach(handle => {
                const el = document.createElement("button");
                el.className = "wm termlink";
                el.style = `
                    flex-direction: row;
                    text-align: left;
                    margin: 2px;
                    min-width: 80px;
                `;
                const info_name = document.createElement("span");
                info_name.style = "flex-grow:1";
                const info_mode = document.createElement("span");
                info_name.innerText = handle.name;
                info_mode.innerText = handle.mode;
                info_mode.style = "color: crimson;";
                el.append(info_name, info_mode);
                el.onclick = () => {
                    socket.emit("link", { [handle.name]: handle.mode });
                }
                root.append(el);
            });
            let i_give_you_one_history = null;
            input.addEventListener("keypress", (ev) => {
                if(ev.key === "Enter") {
                    socket.emit("in", input.value);
                    terminal.innerText += "termemu://" + socket.id + " 🗣️ " + input.value + "\n";
                    autoscroll(terminal);
                    input.placeholder = input.value;
                    input.value = "";
                    
                }
                if(ev.key === "<") {
                    i_give_you_one_history = input.value;
                    input.value = input.placeholder;
                    ev.preventDefault();
                }
                if(ev.key === ">") {
                    input.placeholder = input.value;
                    input.value = i_give_you_one_history;
                    ev.preventDefault();
                }
            });
            wrapper.append(div, root);
        });
        
        let has_term = false;
        let has_recv_in = false;
        
        socket.on("out", (data) => {
            if (!has_term) {
                div.before(terminal);
                root.before(input);
                has_term = true;
            }
            terminal.innerText += data;
            autoscroll(terminal);
        });
        
        socket.on("in", (data) => {
            if(!has_recv_in) {
                div.before(terminal);
                root.before(input);
                terminal.innerText += data + "\n";
                has_recv_in = true;
                return;
            }
            terminal.innerText += "termemu-direct 🗣️ " + data;
            const args = data.split(":");
            switch (args[0]) {
                case "eval":
                    try {
                        terminal.innerHTML += JSON.stringify(eval(args[1])) + "\n";
                    } catch (err) {
                        terminal.innerHTML += "<b>runtime error: eval failure</b>";
                    }
                    break;
                default:
                    if (args.length > 1) {
                        terminal.innerHTML += "<b>runtime error: unexpected string</b>";
                        break;
                    }
            }
            autoscroll(terminal);
        });

        ctx.element = wrapper;
        ctx.root.append(wrapper);
    }
});

export default create_term;