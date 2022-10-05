class ReturnData {
    constructor(){
        this.return_data = {}
    }

    add_data(key,value){
        this.return_data[key] = value
    }

    toJSON(){
        return this.return_data
    }
}

class ReturnDataSingleton {
    constructor() {
        throw new Error('Use ReturnDataSingleton.getInstance() or PipedreamSingleton.newInstance');
    }

    static newInstance() {
        ReturnDataSingleton.instance = null
        ReturnDataSingleton.instance = new ReturnData();
        return ReturnDataSingleton.instance;
    }

    static getInstance(pipedream, functions) {
        if (!ReturnDataSingleton.instance) {
            if (pipedream === null || functions === null) {
                throw new Error("To build ReturnDataSingleton instance you need pipedream and functions arguments")
            }
            ReturnDataSingleton.instance = new ReturnData();
        }
        return ReturnDataSingleton.instance;
    }
}

module.exports = ReturnDataSingleton