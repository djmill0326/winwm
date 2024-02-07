const http = require("http");
const fs = require("fs");

const static = (url, cb, fallback="/about.html", onerror=()=>{}) => {
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
 
http.createServer((request, response) => {
    let url = request.url;
    console.log(request.url);
    switch (request.url) {
        case "/favicon.ico":
            url = "/folder.png";
            break;
        case "":
        case "/":
            url = "/index.html";
    }
    let ext = url.split(".");
    ext = ext[ext.length - 1];
    let mime = "application/octet-stream";
    switch (ext) {
        case "html":
            mime = "text/html";
            break;
        case "js":
            mime = "text/javascript";
            break;
        case "css":
            mime = "text/css";
            break;
        case "png":
            mime = "image/png";
            break;
    }
    response.setHeader("Content-Type", mime);
    static(url, (data) => {
        response.write(data, "binary");
        response.end();
    });
}).listen(80);
 
console.log("Server started on port 80");