const { readFile } = require("fs/promises");
const { gzip } = require("zlib");
const http = require("http");

const memcache = new Map();

const cd = '\u001b[3';
const cl = '\u001b[9';
const cr = '\u001b[39m';

const static = async (url, res, fallback="about.html", onerror=()=>console.log("failed to file.")) => {
    try {
        let cached = memcache.get(url);
        if (cached) {
            res.write(cached);
            res.end();
        } else {
            gzip(await readFile("./" + url), (err, data) => {
                console.log(`${cl}0mgot${cr} \t${cd}6m${url}${cr}`);
                if (err) throw err;
                memcache.set(url, data);
                res.write(data);
                res.end();
            });
        }
    } catch (error) {
        console.log(`${cl}1mfag${cl}0mgot\t${cl}1m[${cl}0mdetected${cl}1m] ${cd}3m404 ${cl}0m${error.message}${cr}`);
        static(fallback, res, "50x.html");
    }
};

module.exports = http.createServer((request, response) => {
    let   href = request.url;
    const path = href.split("/");
    const file = path[path.length - 1].split(".");
    if (path.length) {
        // root directory override
        switch(file[0]) {
            case "":
            case "/":
                href = "index.html";
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