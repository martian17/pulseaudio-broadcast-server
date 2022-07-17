const pulse_worker = require('./build/Release/pulse_worker.node');
const Events = require("./events.js");

let bus = new Events();

//console.log(pulse_worker);
pulse_worker.onChunk((chunk) => {
    //console.log(chunk);
    bus.emit("chunk",chunk);
});

module.exports = bus;

/*

//websocket

const WebSocket = require("ws"); // websocket server
const wss = new WebSocket.Server({
    port: 8082
});
console.log("WebSocket Server Started on port 8082");

wss.binaryType = 'nodebuffer';
const content_base64 = "c3RyZWFtIGV2ZW50"; // Place your base64 content here.
const binaryData = base64ToArrayBuffer(content_base64);

wss.on("connection", (ws) => {
    console.log("opening");
    let chunkEvt = bus.on("chunk",()=>{
        ws.send(binaryData);
    });
    ws.addEventListener("close",()=>{
        console.log("closing");
        chunkEvt.remove();
    });
});
*/