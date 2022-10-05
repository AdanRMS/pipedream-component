const Erp = require("./erp")

module.exports = class ErpCustom extends Erp {
    constructor(integration, event) {
        super(integration, event)
        this.shouldProccess = this.shouldProccess.bind(this)
        this.url = this.configs.api_credentials.url
    }

    insertResponse() {
        if (this.resSendOrder.data.success != true) {
            throw new Error(`Erro ao inserir ${this.resSendOrder.status}`)
        }
    }

    async is_already_integrated() {
        return false
    }

    async updateTrackingCode(){
        throw new Error("Custom ERP didn't have an updateTracking Code")
    }

    async sendRequest() {
        const axios = require("axios")
        const config = {
            method: "POST",
            url: this.url,
            // params: {
                // "apikey": this.apikey,
                // "orderMap": this.payload
            // },
            data: this.payload,
            headers: {
                "ContentType": "application/json"
            }
        }

        return await axios(config)
    }

    async payloadPrepare() {
        this.payload = this.order.orderMap
    }
}