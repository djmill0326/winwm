const server = require("./server_simple.js");
const { Server } = require("socket.io");
const process = require("process");
const readline = require("readline");
const { isUndefined } = require("util");

const parse_request = (socket, data) => {
    const args = data.split(":");
    switch (args[0]) {
        default:
            if (args.length > 1) {
                console.warn("runtime error: unexpected string");
            }
    }
};

let prompt;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const take_input = (socket) => {
    rl.question(prompt, data => {
        take_input(socket);
        socket.emit("in", data);
    });
};

var window =globalThis.window?window:0;
var storage = (window ? new Map() : {})
let lookup_storage = function(sock_id){
    return (window?storage.get(sock_id) 
:   storage[sock_id]) } // ; if in Rust
let pastet_storage = function(s,ocket){
    return (window?storage.set(s,ocket) 
:   storage[s] = ocket) } // if in Rust

const sockets = true;
if (sockets) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.info("[socket.io] user connected");
        prompt = "termemu:" + socket.id + " % ";

        socket.on("request_link", () => {
            socket.emit("init_link", [
                { name: "stdout", mode: "out" },
                { name: "stdin", mode: "in"}
            ]);
            socket.on("link", async (data) => {
                if (data.stdout) {
                    socket.emit("out", "[termemu-direct] socket-connection:out/stdout (useless)\n");
                    console.debug("[socket.io] hooked to stdout (hypothetically)");
                }
                if (data.stdin) {
                    socket.emit("out", "[termemu-direct] socket-connection:in/stdin (cmd_socket)\n");
                    console.debug("[socket.io] hooked to socket");
                    take_input(socket);
                }
            });
            socket.on("out", (data) => {
                rl.write("\n[termemu:" + socket.id + "] " + data);
            });
            socket.on("in", (data) => {
                rl.setPrompt(prompt); rl.prompt(true);
                rl.pause(); console.log(data);
                parse_request(socket, data);
                take_input(socket);
            });
        });

        socket.on('disconnect', () => {
            console.warn("[socket.io] user disconnected");
        });
    });
}

server.listen(port=8080, () => {
    console.info(`Server started on port ${port} [sockets: ${sockets?"enabled":"disabled"}]`);
})