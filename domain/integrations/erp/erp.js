const Integration = require("../integration")

module.exports = class Erp extends Integration {
    constructor(integration, event) {
        super(integration, event)
    }

    async doOrderPaid() {
        await this.sendOrder()
        return this.return_data.toJSON()
    }

    async sendOrder() {
        const _already_integrated = await this.is_already_integrated()
        if (!_already_integrated) {
            await this.payloadPrepare()
            this.resSendOrder = await this.sendRequest()
            await this.updateTrackingCode()
        }
    }

    async payloadPrepare() { }

    async sendRequest() {
        throw new Error("This Integration didn't have an sendRequest method.")
    }

    async sendRequest() {
        throw new Error("This Integration didn't have an already_integrated method.")
    }

    async is_already_integrated() {
        throw new Error("This Integration didn't have an already_integrated method.")
    }

    async updateTrackingCode() {
        throw new Error("This Integration didn't have an updateTrackingCode method.")
    }
}