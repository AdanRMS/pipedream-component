const axios = require("axios")
const Order = require("../../../order/order")
const PipedreamSingleton = require("../../../pipedream/pipedream")
const ReturnDataSingleton = require("../../../return_data/return_data")

module.exports = class ACDeal {

    constructor(integration, order) {
        this.pipedream = PipedreamSingleton.getInstance()
        this.order = order
        this.integration = integration
        this.api_token = integration.configs.api_credentials.api_token
        this.account_name = integration.configs.api_credentials.account_name
        this.return_data = ReturnDataSingleton.getInstance()
    }

    set_stage(stage) {
        this.stage_id = stage.id
        this.stage_group = stage.group
    }

    set_contact_id(contact_id) {
        this.contact_id = contact_id
    }

    set_title(title) {
        this.title = title
    }

    set_description(description) {
        this.description = description
    }

    set_value(value) {
        this.value = parseInt(`${value.toFixed(2)}`.replace(".", "").replace(".", ""))
    }

    async upsert() {

        if (this.order.body.integration !== undefined) {
            const _ac_integration = this.order.body.integration.find(int => int.provider === "activecampaign")
            if (_ac_integration !== undefined) {
                this.id = _ac_integration.dealID
                this.already_integrated = true
                this.return_data.add_data("deal_id", this.id)
                this.return_data.add_data("message", "ID already exists. Should update.")
                return
            }
        }

        const _deal = await this.search()

        if (_deal !== undefined) {

            this.id = _deal.id

            if (this.id) {
                this.return_data.add_data("deal_id", this.id)
                this.return_data.add_data("message", "Deal found in AC")
                return
            }
        }

        await this.create()
    }

    prepare_deal_data_create() {

        this.deal_data = {
            "deal": {
                "contact": this.contact_id,
                // "account": "45",
                "description": this.description,
                "currency": "brl",
                "group": this.stage_group,
                // "owner": "1",
                // "percent": null,
                "stage": this.stage_id,
                // "stage": "1",
                "status": 0,
                "title": this.title,
                "value": this.value,
            }
        }

    }

    async create() {

        this.prepare_deal_data_create()

        let config = {
            method: "post",
            url: `https://${this.account_name}.api-us1.com/api/3/deals`,
            headers: {
                "Api-Token": `${this.api_token}`,
                "Content-Type": "application/json"
            },
            data: this.deal_data
        }

        this.return_data.add_data("request", config)

        const _res = await this.requestLoop(config)

        this.return_data.add_data("response", _res.data)

        this.id = _res.data.deal.id

        this.return_data.add_data("response", _res.data)

        this.prepareFieldsCreate()

        if (this.fieldsDeal) {
            if (this.fieldsDeal.length > 0) {
                this.deal_data["fields"] = this.fieldsDeal
            }
        }

        await this.update(
            { "fields": this.fieldsDeal }, this.id
        )
    }

    async update(update_data, deal_id) {

        const config = {
            method: "put",
            url: `https://${this.account_name}.api-us1.com/api/3/deals/${deal_id}`,
            headers: {
                "Api-Token": `${this.api_token}`,
            },
            data: {
                deal: update_data
            }
        }

        this.return_data.add_data("request", config)

        const _res = await this.requestLoop(config)

        this.return_data.add_data("response", _res.data)
    }

    async search() {
        const config = {
            method: "get",
            url: `https://${this.account_name}.api-us1.com/api/3/deals?filters[search]=${this.order.orderMap.id}`,
            headers: {
                "Api-Token": `${this.api_token}`,
                "Content-Type": "application/json"
            }
        }

        const _res = await this.requestLoop(config)

        if (_res.data.deals.length > 0) {
            return _res.data.deals[0]
        }
    }

    async requestLoop(config) {

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        let _status = 0
        let _count = 0
        let _delay = 0
        let _res

        while (_status == 0 && _count < 10) {
            await delay(_delay);
            try {
                _res = await axios(config)
                _status = 2
                _count++
                this.return_data.add_data("attempt", _count)
            } catch (e) {
                if (e.response.status === 503 || e.response.status === 504) {
                    _delay = _delay + 300
                    _count++
                } else {
                    _status = 2
                    throw new Error(`AC Deal message: ${e.message} (${e.response.status})`)
                }
            }
        }
        return _res

    }

    addCustomField(id, value) {
        if (value) {
            this.fieldsDeal.push({ "customFieldId": id, "fieldValue": value })
        }
        return
    }

    prepareFieldsCreate() {
        if (this.order === undefined) {
            this.fieldsFromCustomer()
        } else {
            this.fieldsFromOrder()
        }
    }

    fieldsFromCustomer() {
        this.itens = []
        for (const item of this.pipedream.body.data.resource.items.data) {
            this.itens.push({
                "sku": item.sku.data.sku,
                "price": item.price,
                "quantity": item.quantity,
                "description": item.sku.data.title,
                "bundle_id": item.bundle_id,
                "bundle_name": item.bundle_name
            })
        }

        const _itens_prepared = Order.get_main_product(this.itens)

        this.fieldsDeal = []
        for (const field of this.integration.configs.fields.deal) {
            switch (field.personalization) {
                // case "DEAL_CODIGO_DE_RASTREIO":
                //     this.fieldsContact.push({ "customFieldId": field.id, "fieldValue": this.order.orderMap.customer.cpf })
                //     break

                case "DEAL_OUTROS_PRODTOS":
                    this.addCustomField(field.id, JSON.stringify(_itens_prepared.product_others))
                    break

                case "DEAL_PRODUTO_PRINCIPAL_SKU":
                    this.addCustomField(field.id, _itens_prepared.product_main.sku)
                    break

                case "DEAL_PRODUTO_PRINCIPAL":
                    this.addCustomField(field.id, _itens_prepared.product_main.description)
                    break

                case "DEAL_PRODUTO_PRINCIPAL_PREO_UNITRIO":
                    this.addCustomField(field.id, parseInt(`${_itens_prepared.product_main.price.toFixed(2)}`.replace(".", "").replace(".", "")))
                    break

                case "DEAL_PRODUTO_PRINCIPAL_QUANTIDADE":
                    this.addCustomField(field.id, _itens_prepared.product_main.quantity)
                    break

                case "DEAL_KIT_NOME":
                    this.addCustomField(field.id, _itens_prepared.product_main.bundle_name)
                    break

                case "DEAL_KIT_ID":
                    this.addCustomField(field.id, _itens_prepared.product_main.bundle_id)
                    break

                case "DEAL_ID_LOJA":
                    this.addCustomField(field.id, this.pipedream.platform + "_" + this.pipedream.body.data.resource.id)
                    break
            }

        }

    }

    fieldsFromOrder() {

        if (this.order === undefined) {
            throw new Error("Order need to be defined.")
        }

        this.description = this.order.orderMap.id
        // this.title = this.order.orderMap.id
        // this.set_value(this.order.orderMap.payment.value_total)

        this.fieldsDeal = []
        for (const field of this.integration.configs.fields.deal) {
            switch (field.personalization) {
                // case "DEAL_CODIGO_DE_RASTREIO":
                //     this.fieldsContact.push({ "customFieldId": field.id, "fieldValue": this.order.orderMap.customer.cpf })
                //     break

                case "DEAL_URL_BOLETO":
                    this.addCustomField(field.id, this.order.orderMap.payment.ticket_url)
                    break

                case "DEAL_OUTROS_PRODTOS":
                    this.addCustomField(field.id, JSON.stringify(this.order.product_others))
                    break

                case "DEAL_PRODUTO_PRINCIPAL_SKU":
                    this.addCustomField(field.id, this.order.product_main.sku)
                    break

                case "DEAL_PRODUTO_PRINCIPAL":
                    this.addCustomField(field.id, this.order.product_main.description)
                    break

                case "DEAL_PRODUTO_PRINCIPAL_PREO_UNITRIO":
                    this.addCustomField(field.id, parseInt(`${this.order.product_main.price.toFixed(2)}`.replace(".", "").replace(".", "")))
                    break

                case "DEAL_PRODUTO_PRINCIPAL_QUANTIDADE":
                    this.addCustomField(field.id, this.order.product_main.quantity)
                    break

                case "DEAL_KIT_NOME":
                    this.addCustomField(field.id, this.order.product_main.bundle_name)
                    break

                case "DEAL_KIT_ID":
                    this.addCustomField(field.id, this.order.product_main.bundle_id)
                    break

                case "DEAL_ID_LOJA":
                    this.addCustomField(field.id, this.order.orderMap.id)
                    break

                case "DEAL_METODO":
                    this.addCustomField(field.id, this.order.orderMap.payment.method)
                    break

                case "DEAL_FRETE_CUSTO":
                    if (this.order.orderMap.payment.value_shipment) {
                        this.addCustomField(field.id, parseInt(`${this.order.orderMap.payment.value_shipment.toFixed(2)}`.replace(".", "").replace(".", "")))
                    }
                    this.addCustomField(field.id, 0)
                    break

                case "DEAL_PARCELAS":
                    this.addCustomField(field.id, this.order.orderMap.payment.installments)
                    break

                case "DEAL_LOGRADOURO":
                    this.addCustomField(field.id, this.order.orderMap.address.street)
                    break

                case "DEAL_NUMERO":
                    this.addCustomField(field.id, this.order.orderMap.address.number)
                    break

                case "DEAL_COMPLEMENTO":
                    this.addCustomField(field.id, this.order.orderMap.address.complement)
                    break

                case "DEAL_BAIRRO":
                    this.addCustomField(field.id, this.order.orderMap.address.neigborhood)
                    break

                case "DEAL_CIDADE":
                    this.addCustomField(field.id, this.order.orderMap.address.city)
                    break

                case "DEAL_CEP":
                    this.addCustomField(field.id, this.order.orderMap.address.zip)
                    break

                case "DEAL_OBSERVACOES":
                    this.addCustomField(field.id, this.order.orderMap.address.obs)
                    break

                case "DEAL_DESTINATARIO":
                    this.addCustomField(field.id, this.order.orderMap.address.receiver)
                    break
            }

        }
    }
}
