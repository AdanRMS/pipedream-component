const OperationContains = require("./operation_contains")

module.exports = class OperationFactory {
    constructor(){
        throw new Error("Use getInstance")
    }

    static getInstance(operation,rules, content){
        switch(operation){
            case "contains":
                return new OperationContains(rules, content)
        }
    }
}