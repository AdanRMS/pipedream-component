const ReturnDataSingleton = require("../../return_data/return_data")
const Erp = require("./erp")

module.exports = class ErpBling extends Erp {
    constructor(integration, event) {
        super(integration, event)
        this.shouldProccess = this.shouldProccess.bind(this)
        this.apikey = this.configs.api_credentials.apikey
    }

    async updateTrackingCode() {
        const _updateData = {
            "$addToSet": {
                "integration": {
                    "id": this.integration._id,
                    "provider": "bling",
                    "type": "erp",
                    "numero": this.numero,
                    "idPedido": this.idPedido,
                    "date": new Date()
                }
            },
            "$set": {
                "tracking": {
                    "tracking_code": this.tracking_code,
                },
                "last_action": "order.shipment.tracking_code_generate"
            }
        }

        await this.order.update(_updateData)

        if (this.tracking_code === null) {
            throw new Error("Tracking Code wasn't generated")
        }
    }

    async _get_integration_from_db() {

        const _orderFromDB = await this.order.getOrderFromDB()

        if (_orderFromDB === null) {
            throw new Error("Order not found in DB")
        }

        if (_orderFromDB.integration !== undefined) {
            this.bling_integration = _orderFromDB.integration.find(integration => integration.provider == "bling")
        }
    }

    async is_already_integrated() {

        await this._get_integration_from_db()

        if (this.bling_integration === undefined) {
            return false
        }

        const _return = {
            "message": `Bling already integrated with ID ${this.bling_integration.numero}`,
            "bling": {
                "idPedido": this.bling_integration.idPedido,
                "numero": this.bling_integration.numero,
                "tracking_code": this.tracking_code
            }
        }

        this.return_data.add_data("data", _return)
        return true
    }

    async sendRequest() {
        const axios = require("axios")
        const config = {
            method: "POST",
            url: "https://bling.com.br/Api/v2/pedido/json/",
            params: {
                "apikey": this.apikey,
                "xml": this.payload
            },
            headers: {
                "ContentType": "application/x-www-form-urlencoded"
            }
        }

        this.resSendOrder = await axios(config)

        if (this.resSendOrder.status != 201) {
            throw new Error(`cod: ${this.resSendOrder.data.retorno.erros[0].erro.cod} : ${this.resSendOrder.data.retorno.erros[0].erro.msg}`)
        }

        try {
            this.tracking_code = this.resSendOrder.data.retorno.pedidos[0].pedido.codigos_rastreamento.codigo_rastreamento
            this.numero = this.resSendOrder.data.retorno.pedidos[0].pedido.numero
            this.idPedido = this.resSendOrder.data.retorno.pedidos[0].pedido.idPedido
        } catch (error) {
            this.return_data.add_data("error", {"data" : this.resSendOrder.data, "error" : error.message})
            throw new Error(`${error.message}`)
        }

        const _return = {
            "tracking_code": this.tracking_code,
            "idPedido": this.idPedido,
            "numero": this.numero
        }

        this.return_data.add_data("bling", _return)
    }

    async payloadPrepare() {
        var builder = require('xmlbuilder');

        var pedido = builder.create('pedido')
        var _cpf_cnpj = this.order.getCpfOrCnpj()

        pedido
            .ele('numero_loja', this.order.orderMap.id).up()
            .ele('vlr_frete', this.order.orderMap.payment.value_shipment).up()
            .ele('cliente')
            .ele("tipoPessoa", this.order.orderMap.customer.type).up()
            .ele("cpf_cnpj", _cpf_cnpj).up()
            .ele("nome", this.order.orderMap.customer.full_name).up()
            .ele("email", this.order.orderMap.customer.email).up()
            .ele("celular", this.order.orderMap.customer.phone).up()
            .ele("endereco", this.order.orderMap.address.street).up()
            .ele("numero", this.order.orderMap.address.number).up()
            .ele("ie", this.order.orderMap.address.state_register).up()
            .ele("complemento", this.order.orderMap.address.complement).up()
            .ele("cidade", this.order.orderMap.address.city).up()
            .ele("uf", this.order.orderMap.address.uf).up()
            .ele("cep", this.order.orderMap.address.zip).up()
            .ele("bairro", this.order.orderMap.address.neigborhood).up().up()
            .ele("transporte")
            .ele("servico_correios", this.order.orderMap.shipments.service).up()
            .ele("dados_etiqueta")
            .ele("nome", this.order.orderMap.customer.full_name).up()
            .ele("endereco", this.order.orderMap.address.street).up()
            .ele("numero", this.order.orderMap.address.number).up()
            .ele("municipio", this.order.orderMap.address.city).up()
            .ele("complemento", this.order.orderMap.address.complement).up()
            .ele("uf", this.order.orderMap.address.uf).up()
            .ele("cep", this.order.orderMap.address.zip).up()
            .ele("bairro", this.order.orderMap.address.neigborhood).up()

        for (const item of this.order.orderMap.itens) {
            pedido.ele("itens").ele("item")
                .ele("descrição", item.description).up()
                .ele("qtde", item.quantity).up()
                .ele("vlr_unit", item.price).up()
                .ele("codigo", item.sku)
        }

        this.payload = pedido.end({ pretty: true });

        var convert = require('xml-js');
        var result2 = convert.xml2json(this.payload, { compact: true });

        this.return_data.add_data("data", JSON.parse(result2))
    }
}