class TxtBuffer extends ELEM{
    constructor(){
        super("div",0,0,"overflow-x:hidden;overflow-y:scroll;width:100%;height:70vh;box-sizing:border-box;border:1px solid #aaa;");
    }
    strlen = 0;
    strlimit = 3000;
    append(str){
        this.strlen += str.length;
        if(this.strlen > this.strlimit){
            let head = this.children.getHead();
            this.strlen -= head.strlen;
            head.remove();
        }
        let tail = this.add("p",0,str,"margin:10px 0px;width:100%;padding:10px;border:1px solid #000;box-sizing:border-box;");
        tail.strlen = str.length;
    }
};

const DEBUG = true;
const PACKETS = false;

let main = async function() {
    // Create WebSocket connection.
    const socket = new WebSocket("ws://"+location.host);

    // Connection opened
    /*socket.addEventListener('open', function (event) {
        socket.send('Hello Server!');
    });*/
    
    
    
    let body = new ELEM(document.body);

    let btn = body.add("input", "type:button;value:play");
    let tbuff;
    if(DEBUG)tbuff = body.add(new TxtBuffer());
    if(DEBUG)tbuff.append("hello");
    if(DEBUG)tbuff.append(JSON.stringify(navigator.userAgent));
    btn.on("click", () => {
        let ctx = new AudioContext();
        let rate = 44100;
        let channels = 2;
        let startAt = 0;
        //start a fake buffer to warm it up
        {
            const source = ctx.createBufferSource();
            const buffer = ctx.createBuffer(2, 1, rate);
            buffer.getChannelData(0).set(new Float32Array([0]));
            buffer.getChannelData(1).set(new Float32Array([0]));
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        }
        
        let cnt = 0;
        
        //I'll work on authentication later, but the mockup it is.
        socket.addEventListener("message", async function (e) {
            if(DEBUG&&PACKETS)tbuff.append(`got new message ${cnt}`);
            let vals = new Float32Array(await e.data.arrayBuffer());
            
            let len = vals.length/2;
            let left = new Float32Array(len);
            let right = new Float32Array(len);
            for(let i = 0; i < len; i++){
                left[i] = vals[i*2];
                right[i] = vals[i*2+1];
            }
            if(DEBUG&&PACKETS)tbuff.append(`length: ${len}<br>left sample: ${JSON.stringify([...left.slice(0,5)])}`);
            
            cnt++;
            /*
            if(cnt%1000 === 0){
                console.log(1);
                //console.log(left,right);
            }else{
                //console.log(1);
            }
            cnt++;
            //console.log('Message from server ', event.data);
            */
            const source = ctx.createBufferSource();
            const buffer = ctx.createBuffer(2, left.length, rate);
            buffer.getChannelData(0).set(left);
            buffer.getChannelData(1).set(right);
            source.buffer = buffer;
            source.connect(ctx.destination);
            if(DEBUG&&PACKETS)tbuff.append(`dt: ${ctx.currentTime-startAt}`);
            if(Math.abs(ctx.currentTime-startAt) > 0.08){
                startAt = ctx.currentTime;
            }else{
                startAt = Math.max(ctx.currentTime, startAt);
            }
            source.start(startAt);
            startAt += buffer.duration;
        });
    });
};

main();