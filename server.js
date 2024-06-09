const server = require("./server_simple.js");
const { Server } = require("socket.io");
const process = require("process");
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
    process.openStdin();

    io.on('connection', (socket) => {
        console.info("[socket.io] user connected");

        socket.on("request_link", () => {
            socket.emit("init_link", [
                { name: "stdout", mode: "out" },
                { name: "stdin", mode: "in"}
            ]);
            socket.on("link", async (data) => {
                if (data.stdout) {
                    socket.emit("out", "[termemu-direct] socket-connection:out/stdout (always-on)\n");
                    console.debug("[socket.io] hooked to stdout (hypothetically)");
                }
                if (data.stdin) {
                    socket.emit("out", "[termemu-direct] socket-connection:in/stdin\n");
                    console.debug("[socket.io] hooked to socket");
                    process.stdout.write("termemu://" + socket.id + ": ");
                    process.stdin.addListener("data", data => {
                        socket.emit("in", data.toString("utf-8").split("\n").map(x => x.trim()).join("\n\r"));
                        process.stdout.write("termemu://" + socket.id + ": ");
                    });
                }
            });
            socket.on("out", (data) => {
                process.stdout.write("[termemu://" + socket.id + "] " + data + "\n");
            });
            socket.on("in", (data) => {
                process.stdout.write("termemu-direct $ " + data + "\n");
                parse_request(socket, data);
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