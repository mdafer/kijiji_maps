/*
** this controller is responsible for the Queue
** the Queue currently acts as a singleton
*/
function Queue(timeout) {
    //timeout between processing different queue objects 
    this.defaultQTimeout = 13000;
    this.timeout = timeout || this.defaultQTimeout;
    this.originalTimeout = this.timeout;
    this.queue = [];
    this.ready = true;
}

Queue.prototype.send = function(qObject) {
    qObject.func(qObject.args);
    if (qObject.callback) qObject.callback();
};

Queue.prototype.exec = function() {
    this.queue.push(arguments);
    this.process();
};

Queue.prototype.process = function() {
    if (this.queue.length === 0) return;
    
    //if not ready, increase timeout
    /*if (!this.ready){
        this.timeout+=100; return;
    }
    else
        this.timeout=this.originalTimeout;*/
    if (!this.ready)
        return;
    
    console.log("Queue length: "+this.queue.length+", timeout: "+ this.timeout);
    var self = this;
    this.ready = false;
    this.send.apply(this, this.queue.shift());
    setTimeout(function () {
        self.ready = true;
        self.process();
    }, this.timeout);
};

//Function responsible for removing all graph API requests from Queue that are related to the groups 
Queue.prototype.removeByGroup = function(groupID) {
    for(let i=0;i<this.queue.length;i+=1)
    {
        //use "this.queue[i][0].args.group" in order to prevent undefined exception
        if(this.queue[i][0].args && this.queue[i][0].args.group && this.queue[i][0].args.group.id == groupID)
        {
            this.queue.splice(i, 1);
            i--;
        }
    }
};

module.exports = Queue;