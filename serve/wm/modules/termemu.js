// module. count: 2
import wm, { $ } from "/wm/wm.js";

let  _       = 0;
const strmap = new Map();
const catc   = new Map();
const cat    = strtocat => new Function("return " + strtocat);
const catadd = str => { if (catc.has(strmap.get(str))) return; strmap.set(str, _); catc.set(_, cat(str)); return _++; };
const catrem = str => { const v = strmap.get(str); catc.delete(v); strmap.delete(str) };
const catdel = idx => { return catc.delete(idx) };
const catcal = (id, ...xargs) => { const f = catc.get(id); return f(...xargs) }
const acache = str => { const id = catadd(str); setTimeout(() => catdel(id), 0); return catcal(id) }

const l = 80;
export const lilJit = f => (...x) => {
    try { return f(...x); } catch (e) {
    const namelength = e.name.length;
    const msglength  = namelength + e.message.length;
    const length_returnable = Math.min(msglength, l-3);
    let msg = nothing;
    if (length_returnable < msglength) msg = `Error<${e.name} — ${e.message.substring(0, (l-6) - namelength)}>...`;
    else msg = `Error<${e.name} — ${e.message}`;
    if(el.ref && el.ref.innerHTML) el.ref.innerHTML += "<b color='c e'>runtime error: eval failure</b>";
    console.warn("[WARN] downgraded(captured) Error<" + e.name + ">");
    el.log.push(msg);
}}; const evl = lilJit(acache);

export const el = { ref: null, log: [] }, nothing = "", is_empty = x => x.length === nothing.length;

export const create_term = (outer_ctx={}) => wm.Control("termemu", {
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
            line-break: anywhere;
            text-wrap: wrap;
        `;
        const input = document.createElement("input");
        input.style = `
            width: 100%;
            background: #111;
            color: #eee;
            font-size: 14px;
            margin: 0px;
            font-family: monospace!important;
            outline: none!important;
        `;
        input.type = "text";
        input.className = "wm input";
        const div = document.createElement("div");
        div.className = "wm grow clear";
        
        const autoscroll = el => el.scrollTo(0, el.scrollHeight - el.clientHeight);
        autoscroll(terminal);

        const onload = () => {
            const socket = io();
            socket.on("connect", () => {
                socket.emit("request_link");
            });
            
            socket.on("init_link", data => {
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
                        input.select();
                    };
                    root.append(el);
                });
                let popped = [];
                const drain = (add) => {
                    let build = "";
                    if (popped.length) build += "$" + popped.reverse().join("$");
                    if (add) build += "$" + add;
                    const h = localStorage.termemuHistory;
                    // rolling chunk buffer model... localStorage👍
                    if (h.length + build.length > 80 * 24 * 2) localStorage.termemuHistory = h.substring(build.length) + build;
                    else localStorage.termemuHistory += build;
                    popped = [];
                };
                input.addEventListener("keypress", ev => {
                    if (!ev.isTrusted) throw new Error('(untrusted) user-agent "touched" a key.');
                    if(ev.key === "Enter") { // sending message.
                        const value = input.value.trimEnd();
                        if (!value.length) return;
                        socket.emit("in", value);
                        const b = document.createElement("b");
                        b.innerHTML = `<a href='#clicked_on_terminal_socket_id' class='c m'>termemu-${socket.id}</a>: ${value}`;
                        b.className = "c i";
                        terminal.append(b);
                        autoscroll(terminal);
                        drain(input.value);
                        input.placeholder = input.value;
                        input.value = "";
                    }
                    if(ev.key === "<") {
                        ev.preventDefault();
                        const h = localStorage.termemuHistory;
                        if (!typeof h === "string" || h.length < 1) return;
                        let i = h.lastIndexOf("$");
                        if (i !== -1) {
                            const slice = h.substring(i + 1);
                            popped.push(slice);
                            input.value = slice;
                            localStorage.termemuHistory = h.substring(0, i);
                        }
                    }
                });
                wrapper.append(div, root);
            });
            
            let has_term = false;
    
            const single_init = (also) => {
                if (!has_term) {
                    has_term = true;
                    div.before(terminal);
                    root.before(input);
                    input.select();
                    if(also) also();
                    if (outer_ctx.control) outer_ctx.control.cleanup = () => {
                        socket.emit("close");
                        console.info("[termemu] Program closed, sockets detached.");
                    }
                    return true;
                }
            };
            
            socket.on("out", (data) => {
                single_init();
                terminal.innerHTML += "<i class='c x'>" + data + "</i>";
                autoscroll(terminal);
            });
            
            socket.on("in", (data) => {
                if (single_init(() => {
                    terminal.innerHTML += "<i class='c x'>" + data + "</i>";
                })) return;
                terminal.innerHTML += "<span><a href='#clicked_on_terminal_username' class='c m'>termemu-direct</a>: " + data.split("\n")[0].trim() + "</span>";
                const args = data.split(":");
                switch (args[0]) {
                    case "eval":
                        const output = evl(args[1]);
                        terminal.innerHTML += `<i class='c w'>${output}</i>`; break;
                    default:
                        if (args.length > 1) terminal.innerHTML += "<b class='c e'>runtime error: unexpected string</b>";
                }
                autoscroll(terminal, socket);
            });
    
            socket.on("disconnect", () => ctx.element.remove());
    
            ctx.element = wrapper;
            ctx.root.append(wrapper);
        };

        let t = performance.now();
        const revive = () => setTimeout(loader, Math.max(0, t - (t = performance.now()) + 5000));
        const loader = () => {
            if (window.io) return onload();
            console.info("Waiting for socket.io...");
            fetch("/socket.io/socket.io.js").then(res => res.text().then(text => {
                if (!text.length || text.startsWith("<")) {
                    alert("Broken instance detected. Try refreshing?");
                    console.error("Failed to read script [socket.io.js]\n", text);
                    return;
                }
                $(document.head).add($("script").html(text));
                if (!window.io) revive();
                console.warn("Socket.io now available.");
                return onload();
            })).catch(revive);
        };
        loader();
    }
});

if (!localStorage.termemuHistory) localStorage.termemuHistory = "";
export default create_term;

if (window.injected && window.injected.has("termemu")) {
    inject("Jit", lilJit);
    inject("Terminal", create_term)
} 