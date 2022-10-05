const PipedreamSingleton = require("../pipedream/pipedream")
const EcommerceManager = require("./ecommerce_manager")
const WebhookManager = require("./webhook_manager")

module.exports = class EcommerceManagerFactory {
    constructor(){
        throw new Error("Use getInstance")
    }

    static getInstance(){
        const pipedream = PipedreamSingleton.getInstance()

        switch(pipedream.module){
            case "ecommerce":
                return new EcommerceManager()

            case "webhook":
                return new WebhookManager()

            default:
                throw new Error(`No Event Manager for module '${pipedream.module}'`)
        }
    }
}