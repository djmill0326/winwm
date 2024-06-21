const fsp   = require("fs/promises");
const fs   = require("fs");
const zlib = require("zlib");
const http = require("http");

const cd = '\u001b[3';
const cl = '\u001b[9';
const cr = '\u001b[39m';

const memcache = new Map();
fs.watch("./").on("change", (_, file) => {
    if (memcache.delete("/" + file)) console.log(
        `${cd}3m(hotcache)${cl}0m removed cached file ${cd}6m/${file}${cl}0m from memory${cr}`
    );
});

const static = async (url, res, fallback="/about.html", onerror=()=>console.log("failed to file.")) => {
    const origin = res.req.socket.remoteAddress;
    try {
        let cached = memcache.get(url);
        if (cached) {
            res.write(cached);
            console.log(`${cl}0m[${cd}3m${origin}${cl}0m] got ${cd}6m${url} ${cd}3m(cached)${cr}`);
            res.end();
        } else {
            zlib.gzip(await fsp.readFile("." + url), (err, data) => {
                if (err) throw err;
                memcache.set(url, data);
                res.write(data);
                console.log(`${cl}0m[${cd}3m${origin}${cl}0m] got${cr} ${cd}6m${url}${cr}`);
                res.end();
            });
        }
    } catch (error) {
        console.log(`${cl}0m[${cl}1m${origin}${cl}0m]${cd}1m 404 ${cd}3mCan't Send ${cl}0m${url}${cr}`);
        static(fallback, res, "/index.html");
    }
};

module.exports = http.createServer((request, response) => {
    let   href = request.url;
    const path = href.split("/");
    const file = path[path.length - 1].split(".");
    if (path.length) {
        if (path[1] === "cb") {
            response.setHeader("Content-Type", "text/plain");
            response.write("you probably can close this window now.");
            response.end();
            return;
        }
        // root directory override
        switch(file[0]) {
            case "":
            case "/":
                href = "/index.html";
                break;
            default:
                if(file.length === 1)
                    href = request.url + "/index.html";
        }
    }
    let mime = "text/html";
    if (file.length > 1) {
        switch (file[file.length - 1]) {
            case "txt":
                mime = "text/plain";
                break;
            case "js":
                mime = "application/javascript";
                break;
            case "css":
                mime = "text/css";
                break;
            case "png":
            case "jpg":
            case "ico":
                mime = "image/png";
        }
    }
    response.setHeader("Content-Type", mime);
    response.setHeader("Content-Encoding", "gzip");
    static(href, response);
});