const Order = require("./order");
var moment = require('moment-timezone');

module.exports = class OrderCustom extends Order {

    constructor() {
        super()

        this.orderData = this.body
        this.resourceID = this.orderData.order_id
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
        return this.orderData.payment.installment_count
    }

    getTextWithGatewayID() {
        if (this.orderData.payment.payment_id) {
            return this.orderData.payment.payment_id.toString()
        }

        return ""

    }

    getCreatedAtDate() {
        // const _date = new Date.parse(this.orderData.created_at)
        const _offset = moment.tz(this.store.default_time_zone).utcOffset();
        const _date_string = this.orderData.created_at + " GMT" + _offset / 60 * 100
        const _created_at = new Date(_date_string)
        return _created_at

    }

    getDate(dateString) {
        if (dateString) {
            const _offset = moment.tz(this.store.default_time_zone).utcOffset();
            const _date_string = dateString + " GMT" + _offset / 60 * 100
            const _final_date = new Date(_date_string)
            return _final_date
        }
    }

    getPaidAtDate() {

        if (this.orderData.payment.paid_at) {
            const _offset = moment.tz(this.store.default_time_zone).utcOffset();
            const _date_string = this.orderData.payment.paid_at + " GMT" + _offset / 60 * 100
            const _paid_at = new Date(_date_string)
            return _paid_at
        }
    }

    prepareMetadata() {
        this.metadata = this.orderData.metadata
    }

    getItemData(sku, quantity) {
        const _itemData = {
            "sku": "",
            "quantity": "",
            "description": ""
        }
        switch (sku) {
            case "fixaderme-combo24cx":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 24 * quantity
                break

            case "kit-2-mulher":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 3 * quantity
                break

            case "kit-3-mulher":
            case "practivar-mulher-p2l3":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 6 * quantity
                break

            case "kit-1-mulher":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 1 * quantity
                break

            case "kit1-homem":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 1 * quantity
                break

            case "kit-2-homem":
            case "kit-homem-p2l3":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 3 * quantity
                break

            case "kit-3-homem":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 6 * quantity
                break

            case "practivar-homem-p3l5":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 5 * quantity
                break

            case "practivar-compre6-leve10":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 10 * quantity
                break

            case "practivar-homem-compre6-leve12":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 12 * quantity
                break

            case "practivar-mulher-p3l5":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 5 * quantity
                break

            case "practivar-mulher-compre6-leve10":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 10 * quantity
                break

            case "practivar-mulher-compre6-leve12":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 12 * quantity
                break

            case "practivar-homem-1plus1":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 2 * quantity
                break

            case "practivar-homem-2plus2":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 4 * quantity
                break

            case "practivar-homem-3plus3":
                _itemData.sku = "M0001L0002P000001"
                _itemData.description = "Practivar Homem",
                    _itemData.quantity = 6 * quantity
                break

            case "practivar-mulher-1plus1":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 2 * quantity
                break

            case "practivar-mulher-2plus2":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 4 * quantity
                break

            case "practivar-mulher-3plus3":
                _itemData.sku = "M0001L0002P000002"
                _itemData.description = "Practivar Mulher",
                    _itemData.quantity = 6 * quantity
                break

            case "fixaderme-1cx":
            case "fixaderme-1cx-b":
            case "00540":
            case "00541":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 1 * quantity
                break

            case "fixaderme-combo12cx":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 12 * quantity
                break

            case "fixaderme-combo2cx":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 2 * quantity
                break

            case "fixaderme-combo4cx":
            case "fixaderme-combo4cx-por-180":
            case "fixaderme-combo4cx-por-198":
            case "fixaderme-combo4cx-por-200":
            case "00540comp3+1":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 4 * quantity
                break

            case "fixaderme-combo6cx":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 6 * quantity
                break

            case "fixaderme-combo8cx":
            case "00540comp6+2":
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"
                _itemData.quantity = 8 * quantity
                break

            case "inovecalcio-1cx":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 1 * quantity
                break

            case "inovecalcio-2cx":
            case "inovecalcio-1mais1":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 2 * quantity
                break

            case "inovecalcio-3cx":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 3 * quantity
                break

            case "inovecalcio-4cx":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 4 * quantity
                break

            case "inovecalcio-6cx":
            case "inovecalcio-3mais3":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 6 * quantity
                break

            case "inovecalcio-8cx":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 8 * quantity
                break

            case "inovecalcio-8mais8":
                _itemData.sku = "M0001L0003P000001"
                _itemData.description = "Inove Cálcio"
                _itemData.quantity = 16 * quantity
                break

            case "valda-imune-adulto-1un":
                _itemData.sku = "M0001L0004P000001"
                _itemData.description = "Valda Imune Adulto"
                _itemData.quantity = 1 * quantity
                break

            case "valda-imune-adulto-kit3un":
                _itemData.sku = "M0001L0004P000001"
                _itemData.description = "Valda Imune Adulto"
                _itemData.quantity = 3 * quantity
                break

            case "valda-imune-adulto-kit6un":
                _itemData.sku = "M0001L0004P000001"
                _itemData.description = "Valda Imune Adulto"
                _itemData.quantity = 6 * quantity
                break

            case "valda-imune-adulto-kit12un":
                _itemData.sku = "M0001L0004P000001"
                _itemData.description = "Valda Imune Adulto"
                _itemData.quantity = 12 * quantity
                break

            case "valda-imune-kids-1un":
                _itemData.sku = "M0001L0004P000002"
                _itemData.description = "Valda Imune Kids"
                _itemData.quantity = 1 * quantity
                break

            case "valda-imune-kids-kit3un":
                _itemData.sku = "M0001L0004P000002"
                _itemData.description = "Valda Imune Kids"
                _itemData.quantity = 3 * quantity
                break

            case "valda-imune-kids-kit6un":
                _itemData.sku = "M0001L0004P000002"
                _itemData.description = "Valda Imune Kids"
                _itemData.quantity = 6 * quantity
                break

            case "valda-imune-kids-kit12un":
                _itemData.sku = "M0001L0004P000002"
                _itemData.description = "Valda Imune Kids"
                _itemData.quantity = 12 * quantity
                break

            case "valda-imune-family-12adulto-12kids":
                _itemData.sku = "M0001L0004P000003"
                _itemData.description = "Valda Imune Family"
                _itemData.quantity = 12 * quantity
                break

            case "valda-imune-family-6adulto-6kids":
                _itemData.sku = "M0001L0004P000003"
                _itemData.description = "Valda Imune Family"
                _itemData.quantity = 6 * quantity
                break

            case "valda-imune-family-3adulto-3kids":
                _itemData.sku = "M0001L0004P000003"
                _itemData.description = "Valda Imune Family"
                _itemData.quantity = 3 * quantity
                break

            default:
                _itemData.sku = "M0001L0001P000001"
                _itemData.description = "Fixa Derme - Colágeno Verisol"

                switch (parseFloat(this.orderData.payment.total)) {
                    case 2138.4:
                        _itemData.quantity = 48
                        break

                    case 1188:
                    case 1069.2:
                        _itemData.quantity = 24
                        break

                    case 718.8:
                    case 610.92:
                    case 646.72:
                    case 610.98:
                    case 600:
                    case 755.77:
                        _itemData.quantity = 12
                        break

                    case 419.4:
                    case 389.4:
                    case 454.84:
                        _itemData.quantity = 8
                        break

                    case 279.8:
                        _itemData.quantity = 4
                        break

                    case 138.99:
                    case 139.90:
                    case 148, 13:
                    case 168.05:
                    case 144.68:
                    case 162.12:
                    case 152.68:
                    case 158.67:
                    case 159.30:
                        _itemData.quantity = 2
                        break
                }
        }

        return _itemData
    }

    prepareItems() {
        this.itens = []
        const _itens = []
        let _count = 0

        while (_count < 4) {
            if (this.orderData.items.hasOwnProperty('item_' + _count + '_sku')) {
                const _sku = this.orderData.items['item_' + _count + '_sku']
                const _qty = this.orderData.items['item_' + _count + '_qty']

                const _current_item = this.getItemData(_sku, _qty)
                if (_count > 0) {
                    _current_item["price"] = 0
                } else {
                    _current_item["price"] = ((this.orderMap.payment.value_total * 1000) / _current_item.quantity) / 1000
                }

                _itens.push(_current_item)
            }

            _count++
        }

        _count = 0
        for (const _current_item of _itens) {
            if (_count === 0) {
                this.itens.push(_current_item)
            } else {

                const _sameSKU = this.itens.find(element => element.sku == _current_item.sku);

                if (_sameSKU === undefined) {
                    this.itens.push(_current_item)
                } else {
                    const _newQuantity = parseInt(_sameSKU.quantity) + parseInt(_current_item.quantity)
                    const _newPrice = ((this.orderMap.payment.value_total * 1000) / _newQuantity) / 1000

                    this.itens[_count - 1] = {
                        "sku": _current_item.sku,
                        "description": _current_item.description,
                        "price": _newPrice,
                        "quantity": _newQuantity
                    }

                }
            }
            _count++
        }

    }

    getStatus() {
        return this.orderData.payment.status
    }

    getPaymentMethod() {
        return this.orderData.payment.payment_method
    }

    getSourceURL() {
        return ""
    }

    getPhone() {
        if (this.orderData.person.whatsapp) {
            return this.orderData.person.whatsapp
        }
        if (this.orderData.person.phone) {
            return this.orderData.person.phone.replace("-", "").replace(" ", "").replace("(", "").replace(")", "").replace("+", "")
        }
    }

    map() {
        this.prepareMetadata()
        Order.prototype.map.call(this)

        this.orderMap["date"] = this.getCreatedAtDate()
        this.orderMap["address"] = {}
        if (this.orderData.shipping_address) {
            this.orderMap["address"]["street"] = this.orderData.shipping_address.address1
            this.orderMap["address"]["number"] = this.orderData.shipping_address.number
            this.orderMap["address"]["complement"] = this.orderData.shipping_address.address2
            this.orderMap["address"]["neigborhood"] = this.orderData.shipping_address.neighborhood
            this.orderMap["address"]["zip"] = this.orderData.shipping_address.postcode
            this.orderMap["address"]["city"] = this.orderData.shipping_address.city
            this.orderMap["address"]["uf"] = this.orderData.shipping_address.state
            // this.orderMap["address"]["obs"] = this.orderMap["id"] + " | " + this.orderData.shipping_address.data.reference
            this.orderMap["address"]["obs"] = this.orderMap["id"]
            this.orderMap["address"]["receiver"] = this.orderData.shipping_address.destinatario
            this.orderMap["shipments"] = {}
            this.orderMap["shipments"]["service"] = this.orderData.shipping_address.description
        }
        this.orderMap["customer"] = {}
        this.orderMap["customer"]["ip"] = this.orderData.person.ip
        this.orderMap["customer"]["phone"] = this.getPhone()
        this.orderMap["customer"]["email"] = this.orderData.person.email
        this.orderMap["customer"]["first_name"] = this.orderData.person.first_name
        this.orderMap["customer"]["last_name"] = this.orderData.person.last_name
        this.orderMap["customer"]["full_name"] = this.orderData.person.first_name + " " + this.orderData.person.last_name
        // this.orderMap["customer"]["type"] = this.orderData.customer.data.type.toUpperCase()
        this.orderMap["customer"]["cpf"] = this.orderData.person.cpf
        if (this.metadata) {
            this.orderMap["metadata"] = this.metadata
            this.orderMap["utm_campaign"] = this.orderData.metadata.utm_campaign
            this.orderMap["utm_content"] = this.orderData.metadata.utm_content
            this.orderMap["utm_medium"] = this.orderData.metadata.utm_medium
            this.orderMap["utm_source"] = this.orderData.metadata.utm_source
            this.orderMap["utm_term"] = this.orderData.metadata.utm_term
            this.orderMap["customer"]["mlife_uuid"] = this.orderData.metadata.mlife_uuid
            this.orderMap["metadata"]["user_agent"] = this.orderData.person.user_agent
            // this.orderMap["metadata"]["fbclid"] = this.metadata.fbclid
            this.orderMap["metadata"]["variation_name"] = this.metadata.variation_name
            this.orderMap["metadata"]["ab_test_name"] = this.metadata.ab_test_name
        }
        this.orderMap["payment"] = {}
        this.orderMap["payment"]["installments"] = parseInt(this.getInstallments())
        this.orderMap["payment"]["value_total"] = parseFloat(this.orderData.payment.total)
        // this.orderMap["payment"]["value_products"] = this.orderData.value_products
        // this.orderMap["payment"]["value_shipment"] = this.orderData.value_shipment
        this.orderMap["payment"]["value_discount"] = parseFloat(this.orderData.payment.discount)
        this.orderMap["payment"]["coupon_code"] = this.orderData.payment.coupon_code
        this.orderMap["payment"]["gateway_id"] = this.orderData.payment.payment_id
        // this.orderMap["payment"]["ticket_url"] = this.orderData.transactions.data[0].billet_url
        this.orderMap["itens"] = this.itens
        // this.orderMap["metadata"]["http_referer"] = this.getSourceURL()
        this.orderMap["payment"]["status"] = this.getStatus()
        this.orderMap["payment"]["method"] = this.getPaymentMethod()
        this.orderMap["payment"]["gateway"] = Order.prototype.getGatewayDataFromText.call(this).gateway
        this.orderMap["payment"]["currency"] = "BRL"
        this.orderMap["shipments"] = {}
        this.orderMap["shipments"]["service"] = this.orderData.shipping.description
        this.orderMap["shipments"]["tracking_code"] = this.orderData.shipping.tracking_code
        this.orderMap["shipments"]["date_delivered"] = this.getDate(this.orderData.shipping.date_delivered)
        this.orderMap["shipments"]["status"] = this.orderData.shipping.status

        this.prepareItems()
    }
}