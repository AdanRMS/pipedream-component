const Integration = require("../integration")

module.exports = class Automation extends Integration {
    constructor(integration, event) {
        super(integration, event)
    }

    async sendOrder() {
        await this.payloadPrepare()
        this.resSendOrder = await this.sendRequest()
        this.insertResponse()
    }

    insertResponse() {}

    async payloadPrepare() { }



    // async sendConversion() { }

    // prepareSendConversion() {
    //     this.conversionTypeSelect()
    // }

    // conversionTypeSelect() {

    //     this.should_trigg_conversion = false

    //     if (this.event.payment.status == "paid") {
    //         this.event_name = "Purchase"
    //         this.should_trigg_conversion = true
    //     }

    //     if (this.event.payment.status == "pending" && this.event.payment.method == "ticket") {
    //         this.event_name = "Boleto Gerado"
    //         this.should_trigg_conversion = true
    //     }

    //     if (this.event.payment.status == "checkout") {
    //         this.event_name = "Checkout Filled"
    //         this.should_trigg_conversion = true
    //     }
    // }
}