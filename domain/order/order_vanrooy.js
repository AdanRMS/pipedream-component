const Order = require("./order");
var moment = require('moment-timezone');

module.exports = class OrderVanRooy extends Order {

    constructor() {
        super()
        this.resourceID = this.orderData.NumeroPedido
    }

    async orderInsert() {
        await this.format()
        this.outputContent = this.payload

        const _save_result = await Order.prototype.save.call(this)

        if (this.res.acknowledged === true) {
            await this.updateVanRooy()
        }
    }

    async orderPaid() {
        this.event_last = "order.paid"
        await this.orderInsert()
        return this.return_data.toJSON()
    }

    getInstallments() {
        return this.orderData.Pagamento.Parcelas.length
    }

    getTextWithGatewayID() {
        const _transacoes_tef = this.orderData.TransacaoesTEF === undefined ? this.orderData.TransacoesTEF : this.orderData.TransacaoesTEF
        if (_transacoes_tef) {
            if (Array.isArray(_transacoes_tef)) {
                if (_transacoes_tef.length > 0) {
                    const _esitef = _transacoes_tef[0]
                    if (_esitef.NSU2) {
                        if (_esitef.DescricaoConfiguracaoTEF === "MERCADO PAGO") {
                            return _esitef.NSU2
                        }
                    }
                }
            }
        }
        return this.orderData.TextoLiberado
    }

    getCreatedAtDate() {
        const _offset = moment.tz(this.store.default_time_zone).utcOffset();
        const _date_string = this.orderData.DataPedido.replace("T", " ") + " GMT" + _offset / 60 * 100
        const _created_at = new Date(_date_string)
        return _created_at

    }

    getPaidAtDate() {
        const _offset = moment.tz(this.store.default_time_zone).utcOffset();
        const _date_string = this.orderData.Venc1aParc.replace("T", " ") + " GMT" + _offset / 60 * 100
        const _paid_at = new Date(_date_string)
        return _paid_at
    }

    async format() {
        await Order.prototype.format.call(this)
        this.payload["last_action"] = this.event_last
        this.payload["integration"] = [{
            "provider": "vanrooy",
            "integrated": true,
            "NumeroPedido": this.resourceID,
            "date": new Date()
        }]
    }

    prepareItems() {
        this.itens = []
        for (const item of this.orderData.Produtos) {
            if (item.CodProdutoOrigem == null) {
                throw new Error("Prduct don't have SKU. Mandatory for integrations.")
            }

            if (item.ValorUnitario == null) {
                throw new Error("Prduct don't have Price. Mandatory for integrations.")
            }

            if (item.Qtd == null) {
                throw new Error("Prduct don't have Quantity. Mandatory for integrations.")
            }

            let _price
            switch (item.TipoDesconto) {
                case "P":
                    const _base = Math.floor(item.ValorUnitario * 1000000)
                    const _discount = item.ValorDesconto/100
                    const _finalDiscount = (_base * _discount)/1000000
                    const _finalPrice = item.ValorUnitario - _finalDiscount
                    _price = _finalPrice
                    break;
                default:
                    _price = (Math.floor(item.ValorUnitario * 1000000) - Math.floor(item.ValorDesconto * 1000000))/1000000
                    break;
            }
            
         
            this.itens.push({
                "sku": item.CodProdutoOrigem,
                "price": _price,
                "quantity": item.Qtd,
                "discount" : item.Desconto
            })
 
        }
    }

    getDiscount() {
        let _sumProducts = 0

        for (const item of this.itens) {
            _sumProducts = _sumProducts + item.ValorUnitario
        }

        return _sumProducts
    }

    getStatus() {
        return "paid"
    }

    getPaymentMethod() {
        switch (this.orderData.Pagamento.CodFormaPag) {
            case "01":
                return "ticket"
            case "02":
            case "05":
            case "06":
            case "07":
            case "08":
                return "credit_card"
            case "03":
                return "pix"
            case "04":
                return "misto"
            default:
                return "manual"
        }
    }

    async updateVanRooy() {
        // await this.pipedream.functions.send.emit(
        //     {
        //         raw_event: {
        //             labcanID: this.labcanID,
        //             vanrooyID: this.resourceID
        //         }
        //     }
        // )
        await this.pipedream.functions.send.http({
            method: "GET",
            url: `https://en8y4z19g5drobp.m.pipedream.net?labcanID=${this.labcanID}&vanrooyID=${this.resourceID}`
            // url: `https://en1tg3hgas9d7el.m.pipedream.net?labcanID=${this.labcanID}&vanrooyID=${this.resourceID}`
        })
    }

    _get_email(){
        if(this.customer_email !== undefined){
            return this.customer_email
        }

        if(this.orderData.Cliente.Email1){
            this.customer_email = this.orderData.Cliente.Email1
            return this.customer_email
        }

        if(this.orderData.Cliente.Email2){
            this.customer_email = this.orderData.Cliente.Email2
            return this.customer_email
        }

        this.customer_email = `${this.orderData.Cliente.DDD1}${this.orderData.Cliente.Tel1}@suafarmaciaemcasa.com.br`
        return this.customer_email
    }

    map() {
        // this.prepareMetadata()
        this.prepareItems()
        Order.prototype.map.call(this)

        const _name = this.orderData.Cliente.Nome.split(" ")

        this.orderMap["date"] = this.orderData.DataPedido
        this.orderMap["address"] = {}
        this.orderMap["address"]["street"] = this.orderData.Cliente.Endereco
        this.orderMap["address"]["number"] = this.orderData.Cliente.Numero
        this.orderMap["address"]["complement"] = this.orderData.Cliente.Compl
        this.orderMap["address"]["neigborhood"] = this.orderData.Cliente.Bairro
        this.orderMap["address"]["zip"] = this.orderData.Cliente.CEP
        this.orderMap["address"]["city"] = this.orderData.Cliente.Cidade
        this.orderMap["address"]["uf"] = this.orderData.Cliente.Estado
        this.orderMap["address"]["obs"] = this.orderMap["id"] + " | " + this.orderData.Cliente.ObsEndereco
        this.orderMap["address"]["receiver"] = this.orderData.Cliente.Nome
        this.orderMap["shipments"] = {}
        this.orderMap["shipments"]["service"] = this.orderData.CdModalEntr
        this.orderMap["metadata"] = {}
        // this.orderMap["metadata"]["user_agent"] = this.metadata.user_agent
        // this.orderMap["metadata"]["fbclid"] = this.metadata.fbclid
        // this.orderMap["metadata"]["variation_name"] = this.metadata.variation_name
        // this.orderMap["metadata"]["ab_test_name"] = this.metadata.ab_test_name
        // this.orderMap["utm_campaign"] = this.orderData.utm_campaign
        // this.orderMap["utm_content"] = this.orderData.utm_content
        // this.orderMap["utm_medium"] = this.orderData.utm_medium
        // this.orderMap["utm_source"] = this.orderData.utm_source
        // this.orderMap["utm_term"] = this.orderData.utm_term
        this.orderMap["metadata"]["vendedor"] = this.orderData.CdVend
        this.orderMap["metadata"]["midia"] = this.orderData.Midia
        this.orderMap["metadata"]["Campanha"] = this.orderData.Campanha
        this.orderMap["customer"] = {}
        // this.orderMap["customer"]["ip"] = this.orderData.customer.data.ip
        this.orderMap["customer"]["phone"] = `${this.orderData.Cliente.DDD1}${this.orderData.Cliente.Tel1}`
        this.orderMap["customer"]["email"] = this._get_email()
        // this.orderMap["customer"]["mlife_uuid"] = this.metadata.mlife_uuid
        this.orderMap["customer"]["full_name"] = this.orderData.Cliente.Nome
        this.orderMap["customer"]["first_name"] = _name[0]
        this.orderMap["customer"]["last_name"] = _name[1]
        this.orderMap["customer"]["type"] = this.orderData.Cliente.FisJur.toUpperCase()
        this.orderMap["customer"]["cpf"] = this.orderData.Cliente.CPF
        this.orderMap["customer"]["cnpj"] = this.orderData.Cliente.CNPJ
        this.orderMap["customer"]["state_register"] = this.orderData.Cliente.InscricaoEstadual
        this.orderMap["payment"] = {}
        this.orderMap["payment"]["status"] = "paid"
        this.orderMap["payment"]["installments"] = this.getInstallments()
        this.orderMap["payment"]["value_total"] = this.orderData.TotalPedido
        this.orderMap["payment"]["value_products"] = this.orderData.TotalPedido - this.orderData.ValorFrete
        this.orderMap["payment"]["value_shipment"] = this.orderData.ValorFrete

        this.orderMap["payment"]["value_discount"] = this.getDiscount()
        // this.orderMap["payment"]["coupon_code"] = this.orderData.promocode.promocode_id
        this.orderMap["itens"] = this.itens
        // this.orderMap["metadata"]["http_referer"] = this.getSourceURL()
        this.orderMap["payment"]["status"] = this.getStatus()
        Order.prototype.getGatewayDataFromText.call(this)
        this.orderMap["payment"]["method"] = this.getPaymentMethod()
        this.orderMap["payment"]["gateway_id"] = this.gateway_payment_id
        this.orderMap["payment"]["gateway"] = this.gateway
        this.orderMap["payment"]["currency"] = "BRL"


    }
}