const Order = require("./order");
var moment = require('moment-timezone');

module.exports = class OrderYampi extends Order {

    constructor() {
        super()
        this.event_created = this.pipedream.eventData.body.event
        this.resourceID = this.orderData.id
    }

    prepareStatusUpdateData() {

        const _change_data = {
            "$set": {
                "last_action": this.pipedream.action,
                "resourceID": this.resourceID,
                "data": this.body,
                "orderMap.payment.status": this.orderMap.payment.status
            }
        }

        return _change_data
    }

    getInstallments() {
        return this.orderData.transactions.data[0].installments
    }

    getTextWithGatewayID() {
        return this.orderData.transactions.data[0].gateway_transaction_id
    }

    getCreatedAtDate() {
        const _offset = moment.tz(this.orderData.transactions.data[0].created_at.timezone).utcOffset();
        const _date_string = this.orderData.transactions.data[0].created_at.date + " GMT" + _offset / 60 * 100
        const _created_at = new Date(_date_string)
        return _created_at

    }

    getPaidAtDate() {

        if (this.orderData.transactions.data[0].captured_at) {
            const _offset = moment.tz(this.orderData.transactions.data[0].captured_at.timezone).utcOffset();
            const _date_string = this.orderData.transactions.data[0].captured_at.date + " GMT" + _offset / 60 * 100
            const _paid_at = new Date(_date_string)
            return _paid_at
        }
    }

    prepareMetadata() {
        this.metadata = {}

        if (this.orderData.metadata === undefined) {
            return
        }

        for (const content of this.orderData.metadata.data) {
            this.metadata[content.key] = content.value
        }
    }

    prepareItems() {
        this.itens = []
        for (const item of this.orderData.items.data) {
            this.itens.push({
                "sku": item.item_sku,
                "price": item.price,
                "quantity": item.quantity,
                "description": item.sku.data.title,
                "bundle_id": item.bundle_id,
                "bundle_name": item.bundle_name,
                "discount": item.sku.data.price_discount,
            })
        }

    }

    getStatus() {
        switch (this.orderData.status.data.alias) {
            case "waiting_payment":
                return "pending"
            case "cancelled":
                return "canceled"
            default:
                return this.orderData.status.data.alias
        }
    }

    getPaymentMethod() {
        switch (this.orderData.transactions.data[0].payment.data.alias) {
            case "billet":
                return "ticket"
            case "pix":
                return "pix"
            case "mastercard":
            case "visa":
            case "hipercard":
            case "americanexpress":
            default:
                return "credit_card"
            // return this.orderData.transactions.data[0].payment.data.alias
        }
    }

    getSourceURL() {
        if (this.metadata.http_referer) {
            const _url = new URL(this.metadata.http_referer);
            return _http_referer = _url.origin + _url.pathname
        }
    }

    map() {
        this.prepareMetadata()
        this.prepareItems()
        Order.prototype.map.call(this)

        this.orderMap["date"] = this.orderData.created_at.date
        this.orderMap["address"] = {}
        this.orderMap["address"]["street"] = this.orderData.shipping_address.data.street
        this.orderMap["address"]["number"] = this.orderData.shipping_address.data.number
        this.orderMap["address"]["complement"] = this.orderData.shipping_address.data.complement
        this.orderMap["address"]["neigborhood"] = this.orderData.shipping_address.data.neighborhood
        this.orderMap["address"]["zip"] = this.orderData.shipping_address.data.zipcode
        this.orderMap["address"]["city"] = this.orderData.shipping_address.data.city
        this.orderMap["address"]["uf"] = this.orderData.shipping_address.data.uf
        this.orderMap["address"]["obs"] = this.orderMap["id"] + " | " + this.orderData.shipping_address.data.reference
        this.orderMap["address"]["receiver"] = this.orderData.shipping_address.data.receiver
        this.orderMap["shipments"] = {}
        this.orderMap["shipments"]["service"] = this.orderData.shipment_service
        this.orderMap["metadata"] = this.metadata
        // this.orderMap["metadata"]["user_agent"] = this.metadata.user_agent
        // this.orderMap["metadata"]["fbclid"] = this.metadata.fbclid
        // this.orderMap["metadata"]["variation_name"] = this.metadata.variation_name
        // this.orderMap["metadata"]["ab_test_name"] = this.metadata.ab_test_name
        this.orderMap["utm_campaign"] = this.orderData.utm_campaign
        this.orderMap["utm_content"] = this.orderData.utm_content
        this.orderMap["utm_medium"] = this.orderData.utm_medium
        this.orderMap["utm_source"] = this.orderData.utm_source
        this.orderMap["utm_term"] = this.orderData.utm_term
        this.orderMap["customer"] = {}
        this.orderMap["customer"]["ip"] = this.orderData.customer.data.ip
        this.orderMap["customer"]["phone"] = this.orderData.customer.data.phone.full_number
        this.orderMap["customer"]["email"] = this.orderData.customer.data.email
        this.orderMap["customer"]["mlife_uuid"] = this.metadata.mlife_uuid
        this.orderMap["customer"]["full_name"] = this.orderData.customer.data.generic_name
        this.orderMap["customer"]["first_name"] = this.orderData.customer.data.first_name
        this.orderMap["customer"]["last_name"] = this.orderData.customer.data.last_name
        this.orderMap["customer"]["type"] = this.orderData.customer.data.type.toUpperCase()
        this.orderMap["customer"]["cpf"] = this.orderData.customer.data.cpf
        this.orderMap["payment"] = {}
        this.orderMap["payment"]["installments"] = this.getInstallments()
        this.orderMap["payment"]["value_total"] = this.orderData.value_total
        this.orderMap["payment"]["value_products"] = this.orderData.value_products
        this.orderMap["payment"]["value_shipment"] = this.orderData.value_shipment
        this.orderMap["payment"]["value_discount"] = this.orderData.value_discount
        this.orderMap["payment"]["coupon_code"] = this.orderData.promocode.data.code
        this.orderMap["payment"]["gateway_id"] = this.orderData.transactions.data[0].gateway_transaction_id
        this.orderMap["payment"]["ticket_url"] = this.orderData.transactions.data[0].billet_url
        this.orderMap["itens"] = this.itens
        this.orderMap["metadata"]["http_referer"] = this.getSourceURL()
        this.orderMap["payment"]["status"] = this.getStatus()
        this.orderMap["payment"]["method"] = this.getPaymentMethod()
        this.orderMap["payment"]["gateway"] = Order.prototype.getGatewayDataFromText.call(this).gateway
        this.orderMap["payment"]["currency"] = "BRL"
    }
}