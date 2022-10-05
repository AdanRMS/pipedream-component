const ReturnDataSingleton = require("../../return_data/return_data")
const Integration = require("../integration")

module.exports = class Pixel extends Integration {
    constructor(integration, event) {
        super(integration,event)
        this.return_data = ReturnDataSingleton.getInstance()
    }

    async doOrderPaid(){
        await this.sendConversion()
        return this.return_data.toJSON()
    }

    async doOrderCreated(){
        await this.sendConversion()
        return this.return_data.toJSON()
    }
    
    async sendConversion() {
        this.conversionTypeSelect()
        if (this.should_trigg_conversion) {
            this.send_result = await this.doSendConversion()
            return this.send_result
        }

        this.return_data.add_data("reason", `No conversion event for ${this.order.orderMap.payment}`)
    }

    conversionTypeSelect() {

        this.should_trigg_conversion = false

        if (this.order.orderMap.payment.status == "paid") {
            this.event_name = "Purchase"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "ticket") {
            this.event_name = "Boleto Gerado"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "pix") {
            this.event_name = "Pix Gerado"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "checkout") {
            this.event_name = "Checkout Filled"
            this.should_trigg_conversion = true
        }
    }
}