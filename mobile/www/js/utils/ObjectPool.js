export class ObjectPool {
    constructor(factoryFn, resetFn, initialSize = 10) {
        this.factoryFn = factoryFn;
        this.resetFn = resetFn;
        this.pool = [];
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factoryFn());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factoryFn();
        }
        
        // Initialize/Reset the object before giving it out
        if (this.resetFn) {
            this.resetFn(obj, ...Array.from(arguments));
        }
        
        return obj;
    }

    release(obj) {
        this.pool.push(obj);
    }

    clear() {
        this.pool = [];
    }
}

