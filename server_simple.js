const { open } = require("fs/promises");
const http = require("http");
const { createGzip, constants } = require("zlib");

const memcache = {
    recall: new Map(),
    blob: new Uint8Array()
};

const COMPRESS = true;
const static = async (url, res, fallback="/about.html", onerror=()=>console.log("failed to file.")) => {
    try {
        const stream = (await open(url)).createReadStream("." + url, );
        if (COMPRESS) stream.pipe(createGzip({ level: 1 })).pipe(res);
        else stream.pipe(res);
    } catch (error) {
        console.warn(error);
        static(fallback, res, "/50x.html");
    }
};

module.exports = http.createServer((request, response) => {
    let ext_override = null;
    const url = request.url;
    let out = request.url;
    const path = out.split("/");
    const file = path[path.length - 1].split(".");
    if (path.length) {
        // root directory override
        switch(file[0]) {
            case "":
            case "/":
                out = "index.html";
                break;
            default:
                if(file.length === 1)
                    out = request.url + "/index.html";
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
    console.log(out);
    response.setHeader("Content-Type", mime);
    if (COMPRESS) response.setHeader("Content-Encoding", "gzip");
    static("./" + out, response);
});