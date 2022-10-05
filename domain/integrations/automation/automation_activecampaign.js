const Automation = require("./automation")
const axios = require("axios")
const ACDeal = require("./activecampaign/ac_deal")
const ACCRM = require("./activecampaign/ac_crm")

module.exports = class AutomationActiveCampaign extends Automation {
    constructor(integration, event) {
        super(integration, event)
        this.shouldProccess = this.shouldProccess.bind(this)
        this.api_token = this.configs.api_credentials.api_token
        this.account_name = this.configs.api_credentials.account_name
        this._populate_crm()
    }

    async do_customer_created() {
        await this._upsertContact()
        this.deal = new ACDeal(this.integration, this.order)
        this.deal.set_contact_id(this.contact_id)
        const _stage_init = this.crm.get_stage_by_name("Iniciado")
        this.deal.set_stage(_stage_init)
        this.deal.set_title(`[order.initiated]`)
        this.deal.set_description(`${this._addFields("email")} iniciou compra`)
        this.deal.set_value(this.pipedream.body.data.resource.totalizers.total)
        await this.deal.create()
        return this.return_data.toJSON()
    }

    async doOrderImport() {
        await this._upsertContact()
        this.deal = new ACDeal(this.integration, this.order)
        const _stage_created = this.crm.get_stage_by_name("Pedidos Importados")
        this.deal.set_stage(_stage_created)
        this.deal.set_contact_id(this.contact_id)
        this.deal.set_title(`[order.imported] ${this.order.orderMap.id}`)
        this.deal.set_value(this.order.orderMap.payment.value_total)
        await this.deal.upsert()
        await this._update_contact_and_deal_ID_on_integration()
        return this.return_data.toJSON()
    }

    async doOrderCreated() {
        await this._upsertContact()
        this.deal = new ACDeal(this.integration, this.order)
        const _stage_created = this.crm.get_stage_by_name("Pedido Gerado")
        this.deal.set_stage(_stage_created)
        this.deal.set_contact_id(this.contact_id)
        this.deal.set_title(`[order.created][method.${this.order.orderMap.payment.method}] ${this.order.orderMap.id}`)
        this.deal.set_value(this.order.orderMap.payment.value_total)
        await this.deal.upsert()
        await this._update_contact_and_deal_ID_on_integration()
        return this.return_data.toJSON()
    }

    async doOrderPaid() {
        await this._upsertContact()
        this.deal = new ACDeal(this.integration, this.order)
        this.deal.set_title(`[order.paid][method.${this.order.orderMap.payment.method}] ${this.order.orderMap.id}`)
        this.deal.set_value(this.order.orderMap.payment.value_total)
        await this._populate_ac_integration()
        const _stage_paid = this.crm.get_stage_by_name("Pedido Pago")
        this.deal.set_stage(_stage_paid)

        if (this.ac_integration === undefined) {
            // const _stage_paid = this.crm.get_stage_by_name("Pedido Pago")
            // this.deal.set_stage(_stage_paid)
            this.deal.set_contact_id(this.contact_id)
            await this.deal.upsert()
            await this._update_contact_and_deal_ID_on_integration()
        } else {
            this.deal.prepareFieldsCreate()
            await this.deal.update(
                {
                    // "status": _stage_paid,
                    "stage": this.deal.stage_id,
                    "title": `[order.paid][method.${this.order.orderMap.payment.method}] ${this.order.orderMap.id}`,
                    "fields": this.deal.fieldsDeal
                }, this.ac_integration.dealID)
        }

        return this.return_data.toJSON()
    }

    async doShipmentTrackingCodeGenerated() {
        // try {
        let _field
        let _deal_id

        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        await delay(10000);

        await this._populate_ac_integration()
        this._populate_tracking_code()
        _field = this._get_custom_field_by_slug("DEAL_CODIGO_DE_RASTREIO")
        this.deal = new ACDeal(this.integration, this.order)
        this.deal.set_title(`[tracking.generated] ${this.order.orderMap.id}`)
        this.deal.set_value(this.order.orderMap.payment.value_total)

        try {
            _deal_id = this.ac_integration.dealID
            await this.deal.update(
                {
                    "fields": [
                        {
                            "customFieldId": _field.id,
                            "fieldValue": this.tracking_code
                        }
                    ]
                }, _deal_id)

        } catch (e) {
            await this._upsertContact()
            this.deal.set_contact_id(this.contact_id)
            const _stage_created = this.crm.get_stage_by_name("Pedido Pago")
            this.deal.set_stage(_stage_created)

            await this.deal.upsert()
            _deal_id = this.deal.id
            if (this.deal.already_integrated === undefined) {
                await this._update_contact_and_deal_ID_on_integration()
            }


            await this.deal.update(
                {
                    "fields": [
                        {
                            "customFieldId": _field.id,
                            "fieldValue": this.tracking_code
                        }
                    ]
                }, _deal_id)
        }

        return this.return_data.toJSON()
    }

    _populate_tracking_code() {
        this.tracking_code = this.pipedream.body.tracking.tracking_code
    }

    async _get_integration_from_db() {

        const _orderFromDB = await this.order.getOrderFromDB()

        if (_orderFromDB === null) {
            throw new Error("Order not found in DB")
        }

        if (_orderFromDB.integration !== undefined) {
            this.ac_integration = _orderFromDB.integration.find(integration => integration.provider == "activecampaign")
        }
    }

    _populate_crm() {
        this.crm = new ACCRM(this.configs.crm_stages.dealStages)
    }

    async _populate_ac_integration() {

        if (this.integration === undefined) {
            // throw new Error("Didn't found integrations for current order.")
            return false
        }

        if (Array.isArray(this.ac_integration)) {
            this.ac_integration = this.integration.find(integration => integration.provider === "activecampaign")
        }

        if (this.ac_integration === undefined || this.ac_integration === null) {
            await this._get_integration_from_db()
        }
    }

    async _update_contact_and_deal_ID_on_integration() {
        const _updateData = {
            "$addToSet": {
                "integration": {
                    "id": this.integration._id,
                    "provider": "activecampaign",
                    "contactID": this.contact_id,
                    "dealID": this.deal.id,
                    "date": new Date()
                }
            }
        }

        await this.order.update(_updateData)
    }

    async _upsertContact() {
        this._prepareContactFields()
        await this._saveContact()
    }

    _prepareContactFields() {
        this.fieldsContact = []
        this._prepareContactCustomFields()
    }



    async _saveContact() {

        const _contact_data = {
            contact: {
                email: this._addFields("email"),
                firstName: this._addFields("first_name"),
                lastName: this._addFields("last_name"),
                phone: this._addFields("phone"),
                fieldValues: this.fieldsContact,
                // orgid: parseInt(params.orgid),
                // deleted: params.deleted
            }
        }

        const config = {
            method: "post",
            url: `https://${this.account_name}.api-us1.com/api/3/contact/sync`,
            headers: {
                "Api-Token": `${this.api_token}`,
            },
            data: _contact_data
        }

        const _res = await this.requestLoop(config)

        this.contact_id = _res.data.contact.id

        this.return_data.add_data("contact_data", _contact_data)
        this.return_data.add_data("contact_id", this.contact_id)
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
                    throw new Error(`AC Contact message: ${e.message} (${e.response.status})`)
                }
            }
        }

        return _res

    }

    _addFields(field) {
        if (this.order) {
            return this._addFieldFromOrder(field)
        } else {
            return this._addFieldFromCustomer(field)
        }
    }

    _addFieldFromOrder(field) {
        switch (field) {
            case "cpf":
                return this.order.orderMap.customer.cpf
            case "email":
                return this.order.orderMap.customer.email
            case "first_name":
                return this.order.orderMap.customer.first_name
            case "last_name":
                return this.order.orderMap.customer.last_name
            case "phone":
                return this.order.orderMap.customer.phone
            case "value":
                return this.order.orderMap.payment.value_total
        }
    }

    _addFieldFromCustomer(field) {

        switch (field) {
            case "cpf":
                return this.pipedream.body.data.resource.customer.data.cpf
            case "email":
                return this.pipedream.body.data.resource.customer.data.email
            case "first_name":
                return this.pipedream.body.data.resource.customer.data.first_name
            case "last_name":
                return this.pipedream.body.data.resource.customer.data.last_name
            case "phone":
                return this.pipedream.body.data.resource.customer.data.phone.full_number
            case "value":
                return this.pipedream.body.data.resource.totalizers.total
        }
    }

    _prepareContactFields() {
        this.fieldsContact = []
        for (const field of this.configs.fields.contact) {
            switch (field.perstag) {
                case "CPF":
                    this.fieldsContact.push({ "field": field.id, "value": this._addFields("cpf") })
            }
        }
    }

    _get_custom_field_by_slug(search) {
        return this.configs.fields.deal.find(field => field.personalization === search)
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

    insertResponse() {
        if (this.resSendOrder.data.success != true) {
            throw new Error(`Erro ao inserir ${this.resSendOrder.status}`)
        }
    }

    async payloadPrepare() {
        this.payload = this.order.orderMap
    }
}
