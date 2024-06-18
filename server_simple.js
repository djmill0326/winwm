const http = require("http");
const fs   = require("fs");

const static = (url, cb, fallback="/about.html", onerror=()=>console.log("failed to file.")) => {
    fs.readFile("." + url, 'binary', function(err, data) {
        if(err) {
            onerror(err);
            console.log(err);
            static(fallback, cb, "/50x.html");
            return;
        }
        cb(data);
    });
}

module.exports = http.createServer((request, response) => {
    let ext_override = null;
    let url = request.url;
    const path = url.split("/");
    const file = path[path.length - 1].split(".");
    if (path.length) {
        // root directory override
        switch(file[0]) {
            case "":
            case "/":
                url = "index.html";
                break;
            default:
                if(file.length === 1)
                    url = request.url + "/index.html";
        }
    }
    if (file.length >= 2) {
        // file with extension
        switch (file[0]) {
            case "favicon":
                url = "folder.png";
                ext_override = "ico";
                break;
            case "index":
                url = path.slice(0, path.length - 1) + "/index.html"
                ext_override = "html";
        }
    }
    let mime = "text/html";
    if (ext_override || file.length > 1) {
        switch (ext_override ? ext_override : file[file.length - 1]) {
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
                mime = "image/png";
            case "ico":
                break;
                mime = "image/ico";
        }
    }
    console.log(url);
    response.setHeader("Content-Type", mime);
    static("/" + url, (data) => {
        response.write(data, "binary");
        response.end();
    });
});