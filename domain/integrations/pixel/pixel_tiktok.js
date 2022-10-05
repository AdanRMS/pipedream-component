
const Pixel = require("./pixel");
const axios = require("axios");
const UtilitiesMLife = require("../../utilities");

module.exports = class PixelTiktok extends Pixel {
    constructor(integration, event) {
        super(integration, event)
        this.pixel_code = this.configs.api_credentials.pixel_code
        this.access_token = this.configs.api_credentials.access_token
    }

    async doSendConversion() {
        const _base_url = `https://business-api.tiktok.com/open_api/v1.2/pixel/track/`
        this.conversionData = await this._build_conversion_data()

        const _params = this.conversionData
        const _headers = {
            "Content-Type": "application/json",
            "Access-Token": this.access_token
        }

        this.result = await axios.post(
            _base_url,
            _params,
            {headers: _headers}
        )

        this.return_data.add_data("pixel_data", { result: this.result.data, url: _base_url, params: _params, headers: _headers })
    }

    async _build_conversion_data() {
        this.order.map()

        return {
            "pixel_code": this.pixel_code,
            "event": this.event_name,
            "event_id": this.order.orderMap.payment.status + "_" + this.order.resourceID,
            "timestamp": UtilitiesMLife.get_time_ISO_now(),
            "context": await this._build_context_data(),
            "properties": this._build_properties_data()
        }
    }

    async _build_context_data() {
        const _customer_uuid = this.order.orderMap.metadata.mlife_uuid
        const _tbclid = this.order.orderMap.metadata.tbclid
        const _page_url = "https://" + this.order.orderMap.metadata.domain + this.order.orderMap.metadata.path
        const _phone_number_hash = await UtilitiesMLife.sha256("+" + this.order.orderMap.customer.phone.toLowerCase())
        const _email_hash = await UtilitiesMLife.sha256(this.order.orderMap.customer.email.toLowerCase())
        const _customer_ip = this.order.orderMap.customer.ip

        return {
            "ad": {
                "callback": _tbclid
            },
            "page": {
                "url": _page_url
            },
            "user": {
                "external_id": _customer_uuid,
                "phone_number": _phone_number_hash,
                "email": _email_hash
            },
            "ip": _customer_ip
        }
    }

    _build_properties_data() {

        return {
            "currency": this.order.orderMap.payment.currency.toUpperCase(),
            "value": this.order.orderMap.payment.value_total,
            "contents": this._build_contents_data()
        }
    }

    _build_contents_data() {
        const _contents = []
        for (const _item of this.order.orderMap.itens) {
            _contents.push(
                {
                    'content_type' : "product",
                    'content_id': _item.sku,
                    'quantity': _item.quantity,
                    'price': _item.price
                }
            )
        }

        return _contents
    }

    conversionTypeSelect() {

        this.should_trigg_conversion = false

        if (this.order.orderMap.payment.status == "paid") {
            this.event_name = "CompletePayment"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "ticket") {
            this.event_name = "PlaceAnOrder"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "pending" && this.order.orderMap.payment.method == "pix") {
            this.event_name = "PlaceAnOrder"
            this.should_trigg_conversion = true
        }

        if (this.order.orderMap.payment.status == "checkout") {
            this.event_name = "InitiateCheckout"
            this.should_trigg_conversion = true
        }
    }
}