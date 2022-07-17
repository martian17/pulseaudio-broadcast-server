const Events = function(){
    let that = this;
    const eventTable = {};
    this.eventTable = eventTable;
    this.on = function(type, cb){
        if(!(type in eventTable)){
            eventTable[type] = [];
        }
        eventTable[type].push(cb);
        return {
            fire:function(){
                cb.apply(arguments);
            },
            remove:function(){
                let l = eventTable[type];
                l.splice(l.indexOf(cb),1);//garbage collection
                if(l.length === 0){
                    delete eventTable[type];
                    return true;//all listeners removed
                }else{
                    return false;
                }
            }
        }
    };
    this.emit = function(type){
        const elist = eventTable[type] || [];
        for(let i = 0; i < elist.length; i++){
            elist[i].apply(this,[...arguments].slice(1));
        }
    };
    this.wait = function(type){
        return new Promise((res,rej)=>{
            let ev = that.on(type,(val)=>{
                res(val);
                ev.remove();
            });
        });
    };
};

module.exports = Events;