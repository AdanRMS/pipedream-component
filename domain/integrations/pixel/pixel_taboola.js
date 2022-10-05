
const Pixel = require("./pixel");
const axios = require("axios");

module.exports = class PixelTaboola extends Pixel {
    constructor(integration, event) {
        super(integration, event)
        this.pixel_id = this.configs.api_credentials.pixel_id
    }

    async doSendConversion() {
        const _base_url = `https://trc.taboola.com/actions-handler/log/3/s2s-action`
        await this.build_conversion_data()

        const _params = { params: this.conversionData }

        this.result = await axios.get(
            _base_url,
            _params
        )

        this.return_data.add_data("pixel_data", _params)
    }

    async build_conversion_data() {
        await this.order.map()
        const _tbclid = await this._get_tbclid()
        const _custom_data = await this.build_conversion_custom_data()

        this.conversionData = {
            "name": this.event_name,
            "click-id": _tbclid,
            "id": this.pixel_id,
            "notify": "event",
            "currency": _custom_data.currency,
            "revenue": _custom_data.revenue,
        }

        for (const _key of Object.keys(this.conversionData)) {
            if (this.conversionData[_key] === undefined) {
                delete (this.conversionData[_key])
            }
        }
    }

    async _get_tbclid() {

        console.log("_get_tbclid")
        console.log(this.order.orderMap.metadata.tbclid)
        console.log(this.order.orderMap.metadata)
        console.log(this.order.orderMap)


        if (this.order.orderMap.metadata.tbclid) {
            this.tbclid = this.order.orderMap.metadata.tbclid
        }

        return this.tbclid
    }

    async build_conversion_custom_data() {

        this.custom_data = {}

        this.custom_data["currency"] = this.order.orderMap.payment.currency.toUpperCase()
        this.custom_data["revenue"] = this.order.orderMap.payment.value_total

        for (const _key of Object.keys(this.custom_data)) {
            if (this.custom_data[_key] === undefined) {
                delete (this.custom_data[_key])
            }
        }

        return this.custom_data
    }

    conversionTypeSelect() {

        this.should_trigg_conversion = false

        if (this.order.orderMap.payment.status == "paid") {
            this.event_name = "PurchaseAPI"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "ticket") {
            this.event_name = "BoletoCriado"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "pix") {
            this.event_name = "PixCriado"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "checkout") {
            this.event_name = "start_checkout"
            this.should_trigg_conversion = true
        }
    }
}