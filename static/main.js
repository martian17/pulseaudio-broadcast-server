let main = async function() {
    // Create WebSocket connection.
    const socket = new WebSocket("ws://"+location.host);

    // Connection opened
    /*socket.addEventListener('open', function (event) {
        socket.send('Hello Server!');
    });*/
    
    
    
    let body = new ELEM(document.body);

    let btn = body.add("input", "type:button;value:play");
    btn.on("click", () => {
        let ctx = new AudioContext();
        let rate = 44100;
        let channels = 2;
        let startAt = 0;
        
        let cnt = 0;
        
        //gonna deal with the socket mess later, work on the server now
        socket.addEventListener("message", async function (e) {
            let vals = new Float32Array(await e.data.arrayBuffer());
            
            let len = vals.length/2;
            let left = new Float32Array(len);
            let right = new Float32Array(len);
            for(let i = 0; i < len; i++){
                left[i] = vals[i*2];
                right[i] = vals[i*2+1];
            }
            
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
            //console.log(ctx.currentTime-startAt)
            if(Math.abs(ctx.currentTime-startAt) > 0.08){
                startAt = ctx.currentTime;
            }else{
                startAt = Math.max(ctx.currentTime, startAt);
            }
            source.start(startAt);
            startAt += buffer.duration;
        });
        /*
        socket.onmessage = function(e) {
            let [left,right] = e.data.map(d=>new Float32Array(d));
            const source = ctx.createBufferSource();
            const buffer = ctx.createBuffer(2, left.length, rate);
            buffer.getChannelData(0).set(left);
            buffer.getChannelData(1).set(rigth);
            source.buffer = buffer;
            source.connect(ctx.destination);
            startAt = Math.max(ctx.currentTime, startAt);
            source.start(startAt);
            startAt += buffer.duration;
        };
        */
    });
};

main();