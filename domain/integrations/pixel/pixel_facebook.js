
const UtilitiesMLife = require("../../utilities");
const Pixel = require("./pixel");
const axios = require("axios");

module.exports = class PixelFacebook extends Pixel {
    constructor(integration, event) {
        super(integration, event)
        this.pixel_id = this.configs.api_credentials.pixel_id
        this.access_token = this.configs.api_credentials.access_token
    }

    async doSendConversion() {
        const _base_url = `https://graph.facebook.com/v11.0/${this.pixel_id}/events?access_token=${this.access_token}`
        await this.build_conversion_data()

        const _data = {
            "data": [this.conversionData]
        }

        this.result = await axios.post(
            _base_url,
            _data
        )

        this.return_data.add_data("pixel_data", _data)
    }

    async build_conversion_data() {
        this.order.map()
        const _source = this.getSourceURL()
        const _user_data = await this.build_conversion_user_data()
        const _custom_data = await this.build_conversion_custom_data()

        this.conversionData = {
            "event_name": this.event_name,
            "event_time": UtilitiesMLife.get_timestamp_now(),
            // "event_time" : 1631097705,
            "action_source": "other",
            "event_source_url": _source,
            "event_id": this.order.orderMap.id + "_" + this.order.orderMap.payment.status,
            "user_data": _user_data,
            "custom_data": _custom_data
        }

        for (const _key of Object.keys(this.conversionData)) {
            if (this.conversionData[_key] === undefined) {
                delete (this.conversionData[_key])
            }
        }
    }

    getSourceURL() {
        if (this.order.orderMap.metadata.http_referer) {
            return this.order.orderMap.metadata.http_referer
        }

        return this.configs.api_credentials.default_source_url
    }

    async build_conversion_user_data() {

        this.user_data = {}
        this.user_data["em"] = []
        this.user_data["em"].push(await UtilitiesMLife.sha256(this.order.orderMap.customer.email))

        let _gbclid_timestamp = Math.floor(new Date(Date.parse(this.order.orderMap.date)) / 1000);

        if (this.order.orderMap.metadata.fbclid) {
            this.user_data["fbc"] = `fb.1.${_gbclid_timestamp}.${this.order.orderMap.metadata.fbclid}`
        }

        this.user_data["client_ip_address"] = this.order.orderMap.customer.ip
        this.user_data["client_user_agent"] = this.order.orderMap.customer.user_agent

        if (this.order.orderMap.customer.phone) {
            this.user_data["ph"] = []
            this.user_data["ph"].push(await UtilitiesMLife.sha256(this.order.orderMap.customer.phone.replace("+", "").replace(" ", "").replace("-", "")))
        }

        for (const _key of Object.keys(this.user_data)) {
            if (this.user_data[_key] === undefined) {
                delete (this.user_data[_key])
            }
        }

        return this.user_data
    }

    async build_conversion_custom_data() {

        this.custom_data = {}

        const _customerHistory = await this.order.getCustomerHistory()

        let _client_type = "new_client"
        if (_customerHistory !== undefined) {
            if (_customerHistory.is_recurrent) {
                _client_type = "recurrent_client"
            }
        }

        this.custom_data["client_type"] = _client_type
        this.custom_data["currency"] = this.order.orderMap.payment.currency
        this.custom_data["payment_status"] = this.order.orderMap.payment.status
        this.custom_data["payment_method"] = this.order.orderMap.payment.method
        this.custom_data["installments"] = this.order.orderMap.payment.installments
        this.custom_data["value"] = this.order.orderMap.payment.value_total.toFixed(2)
        this.custom_data["value_shipment"] = this.order.orderMap.payment.value_shipment.toFixed(2)
        this.custom_data["order_id"] = this.order.orderMap.id
        this.custom_data["coupon"] = this.order.orderMap.payment.coupon_code
        this.custom_data["variation_name"] = this.order.orderMap.metadata.variation_name
        this.custom_data["ab_test_name"] = this.order.orderMap.metadata.ab_test_name
        this.custom_data["contents"] = this.getContents()

        for (const _key of Object.keys(this.custom_data)) {
            if (this.custom_data[_key] === undefined) {
                delete (this.custom_data[_key])
            }
        }

        return this.custom_data
    }

    getContents() {
        const _contents = []
        for (const _item of this.order.orderMap.itens) {
            _contents.push(
                { 'id': _item.sku, 'quantity': _item.quantity, 'item_price': _item.price.toFixed(2) }
            )
        }

        return _contents
    }
}