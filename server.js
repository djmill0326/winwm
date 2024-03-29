const server = require("./server_simple.js");
const { Server } = require("socket.io");
const process = require("process");

const parse_request = (socket, data) => {
    const args = data.split(":");
    switch (args[0]) {
        default:
            if (args.length > 1) {
                console.warn("runtime error: unexpected string");
            }
    }
};

const sockets = true;
if (sockets) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log("[socket.io] user connected");

        socket.on("request_link", () => {
            socket.emit("init_link", [
                { name: "stdout", mode: "out" },
                { name: "stdin", mode: "in"}
            ]);
            socket.on("link", async (data) => {
                if (data.stdout) {
                    socket.emit("out", "[termemu-direct] socket-connection:out/stdout\n");
                    console.debug("[socket.io] hooked to stdout");
                }
                if (data.stdin) {
                    socket.emit("out", "[termemu-direct] socket-connection:in/stdin\n");
                    console.debug("[socket.io] hooked to stdin");
                    process.openStdin();
                    process.stdout.write("termemu://" + socket.id + " $ ");
                    process.stdin.addListener("data", data => {
                        socket.emit("in", data.toString("utf8"));
                        process.stdout.write("termemu://" + socket.id + " $ ");
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
            console.log("[socket.io] user disconnected");
        });
    });

    server.listen(80, () => {
        console.log("Server started on port 80", "[sockets: enabled]");
    })
} else {
    server.listen(80, () => {
        console.log("Server started on port 80", "[sockets: disabled");
    });
}