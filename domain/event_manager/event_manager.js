const PipedreamSingleton = require("../pipedream/pipedream")

module.exports = class EventManager {

    constructor() {
        this.pipedream = PipedreamSingleton.getInstance()
    }

    async proccess(){
        throw new Error("This class didn't have 'proccess' implementation.")
    }
}