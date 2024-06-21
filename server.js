const server     = require("./server_simple.js");
const { Server } = require("socket.io");
const process    = require("process");
const readline   = require("readline");

const parse_request = (_, data) => {
    const args = data.split(":");
    switch (args[0]) {
        default: if (args.length > 1) console.warn("runtime error: unexpected string");
    }
};

const connections = new Set();
let   prompt, i;
let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("close", () => rl = readline.createInterface({ input: process.stdin, output: process.stdout }));
const take_input = (socket) => {
    rl.question(prompt, data => {
        connections.forEach(x => x.emit("in", data));
        setTimeout(() => take_input(socket), 50);
    });
};

const sockets = true;
if (sockets) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        ++i;
        console.log("* user connected");
        prompt = "termemu ~ ";

        socket.on("request_link", () => {
            let enabled = [false, false];
            socket.emit("init_link", [
                { name: "stdout", mode: "out" },
                { name: "stdin", mode: "in"}
            ]);
            socket.on("link", async (data) => {
                connections.add(socket);
                if (data.stdout && !enabled[1]) {
                    enabled[1] = true;
                    socket.emit("out", "[termemu-direct] socket-connection:out/stdout (broadcast)\n");
                    console.log(`* user hooked 'out'`);
                }
                if (data.stdin && !enabled[0]) {
                    enabled[0] = true;
                    socket.emit("out", "[termemu-direct] socket-connection:in/stdin (direct)\n");
                    console.log(`* user hooked 'in'`);
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
            connections.delete(socket);
            console.log(`* user disconnected`);
        });
    });
}

server.listen(port=8080, () => {
    console.log(`Server started on port ${port} [sockets: ${sockets?"enabled":"disabled"}]`);
})