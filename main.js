const process  = require("process");
const readline = require("readline");

let server; // error handling provided by Microsoft Bing Copilot: Precise Mode. [lines 4-10]
try {
    server = require("./static.js");
} catch (error) {
    console.error("Failed to load static.js module. Please ensure the module exists and is error-free.");
    process.exit(1); // Exit the process with a 'failure' code
}

const parse_request = (_, data) => {
    const args = data.split(":");
    switch (args[0]) {
        case "eval":
            const [label, ...xs] = args; // label === "eval"
            console.error("[Insecure Warning] you might be getting fucked...");
            console.info(`[${label}]`, ...xs);
            try {
                console.trace((new Function(`return ${xs.join(" ").trim()}`)).apply(void 0, []));
            } catch(err) {
                console.info("dipshit couldn't write their script correctly");
                console.trace(err);
            }
            
            console.warn("you should probably end this session. idk how JavaScript works :(");
            break;
        default: if (args.length > 1) console.warn("runtime error: unexpected string");
    }
};

const connections = new Set();
let i, prompt = "";
let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("close", () => rl = readline.createInterface({ input: process.stdin, output: process.stdout }));
const take_input = (socket) => {
    prompt = "termemu ~ ";
    rl.question(prompt, data => {
        connections.forEach(x => x.emit("in", data));
        setTimeout(() => take_input(socket), 10);
    });
};

const log = globalThis.log = (msg, ...x) => console.log(prompt + msg, ...x);

const sockets = true;
if (sockets) {
    const { Server } = require("socket.io");
    const io = new Server(server);

    io.on('connection', (socket) => {
        ++i;
        socket.on("request_link", () => {
            // set up like this because it can be. make it extensible as a chore
            let enabled = [false, false];
            socket.emit("init_link", [
                { name: "stdout", mode: "out" },
                { name: "stdin", mode: "in"}
            ]);
            socket.on("link", async (data) => {
                const first = !connections.has(socket);
                if (first) {
                    connections.add(socket);
                    log("* user connected");
                }
                if (data.stdout && !enabled[1]) {
                    enabled[1] = true;
                    socket.emit("out", "[termemu-direct] socket-connection:out/stdout (broadcast)\n");
                    log(`* user hooked 'out'`);
                }
                if (data.stdin && !enabled[0]) {
                    enabled[0] = true;
                    socket.emit("out", "[termemu-direct] socket-connection:in/stdin (direct)\n");
                    log(`* user hooked 'in'`);
                    take_input(socket);
                }
            });
            socket.on("out", (data) => {
                rl.write("\n[termemu:" + socket.id + "] " + data);
            });
            socket.on("in", (data) => {
                rl.setPrompt(prompt); rl.prompt(true);
                console.warn(data);
                parse_request(socket, data);
                take_input(socket);
            });
        });

        const cleanup = () => {
            if (connections.size === 1) prompt = "";
            if (connections.delete(socket)) log(`* user disconnected`);
        };

        socket.on("close", cleanup);
        socket.on('disconnect', cleanup);
    });
}

server.listen(port=8080, () => {
    console.log(`Server started on port ${port} [sockets: ${sockets?"enabled":"disabled"}]`);
})