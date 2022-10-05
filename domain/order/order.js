const PipedreamSingleton = require("../pipedream/pipedream");
const StoreSingleton = require("../store/store");
const ReturnDataSingleton = require("../return_data/return_data")
const MongoClient = require('mongodb').MongoClient

class Order {

    constructor() {
        this.pipedream = PipedreamSingleton.getInstance()
        this.return_data = ReturnDataSingleton.getInstance()
        this.body = this.pipedream.body
        this.orderData = this.pipedream.orderData
        this.eventType = this.pipedream.eventData.body.event
    }

    async initialize() {
        await this.setStore()
        this.map()
        this._prepare_itens()
    }

    async getOrderFromDB() {
        const {
            database,
            hostname,
            username,
            password,
        } = this.pipedream.pipedream.mongodbAuth.$auth

        const url = `mongodb+srv://${username}:${password}@${hostname}/test?retryWrites=true&w=majority`

        const client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        const db = client.db(database)

        const _query = { "orderMap.id": this.orderMap.id, "store.slug": this.pipedream.channel }

        try {
            this.res = await db.collection("order_events").findOne(_query)
        } finally {
            await client.close()
        }

        return this.res
    }

    async getCustomerHistory(){

        if(this.customer_history !== undefined){
            return this.customer_history
        }

        const {
            database,
            hostname,
            username,
            password,
        } = this.pipedream.pipedream.mongodbAuth.$auth

        const url = `mongodb+srv://${username}:${password}@${hostname}/test?retryWrites=true&w=majority`

        const client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        const db = client.db(database)

        let _cpf_or_cnpj = this.orderMap.customer.cpf
        let _document_to_use = "cpf"
        if(_cpf_or_cnpj === undefined){
            _document_to_use = "cnpj"
            _cpf_or_cnpj = this.orderMap.customer.cnpj
        }


        const _pipeline = [
            {
              '$match': {
                $expr: {
                  $or: [{
                    $eq: ["$orderMap.customer.cpf", _cpf_or_cnpj]
                  }, {
                    $eq: ["$orderMap.customer.cnpj", _cpf_or_cnpj]
                  }]
                }
              }
            }, {
              '$group': {
                '_id': '$orderMap.customer.'+_document_to_use, 
                'first_order_paid_at': {
                  '$min': '$paid_at'
                }, 
                'last_order_paid_at': {
                  '$max': '$paid_at'
                }, 
                'ticket_max': {
                  '$max': '$orderMap.payment.value_total'
                }, 
                'ticket_min': {
                  '$min': '$orderMap.payment.value_total'
                }, 
                'ticket_avg': {
                  '$avg': '$orderMap.payment.value_total'
                }, 
                'total_value_paid': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$eq': [
                          'paid', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': '$orderMap.payment.value_total', 
                      'else': 0
                    }
                  }
                }, 
                'total_value_pending': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$eq': [
                          'pending', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': '$orderMap.payment.value_total', 
                      'else': 0
                    }
                  }
                }, 
                'total_value_canceled': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$ne': [
                          'paid', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': '$orderMap.payment.value_total', 
                      'else': 0
                    }
                  }
                }, 
                'orders_paid': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$eq': [
                          'paid', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': 1, 
                      'else': 0
                    }
                  }
                }, 
                'orders_pending': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$eq': [
                          'pending', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': 1, 
                      'else': 0
                    }
                  }
                }, 
                'orders_canceled': {
                  '$sum': {
                    '$cond': {
                      'if': {
                        '$ne': [
                          'paid', '$orderMap.payment.status'
                        ]
                      }, 
                      'then': 1, 
                      'else': 0
                    }
                  }
                }
              }
            }, {
              '$addFields': {
                'is_recurrent': {
                  '$cond': {
                    'if': {
                      '$gte': [
                        '$orders_paid', 2
                      ]
                    }, 
                    'then': true, 
                    'else': false
                  }
                }
              }
            }
          ]

        try {
            const aggCursor = await db.collection("order_events").aggregate(_pipeline);
            for await (const doc of aggCursor) {
                this.customer_history = doc
            }
        } finally {
            await client.close()
        }

        return this.customer_history

    }

    async orderInsert() {
        await this.format()
        this.outputContent = this.payload

        await this.save()
        return this.return_data.toJSON()
    }

    async cartAbandonment() {
        await this.format()
        this.outputContent = this.payload

        await this.save()
    }

    _prepare_itens() {
        const _itens_prepared = Order.get_main_product(this.orderMap.itens)
        this.product_others = _itens_prepared.product_others
        this.product_main = _itens_prepared.product_main
    }

    static get_main_product(itens_list) {
        let _max_item
        let _others = []
        let _array_index = 0

        for (const item of itens_list) {
            if (_max_item === undefined) {
                _max_item = item
                continue
            }

            if (_max_item.quantity < item.quantity) {
                _max_item = item
            }

            _others.push({ sku: item.sku, qty: item.quantity, price: item.price })

            _array_index++
        }

        return {
            "product_others": _others,
            "product_main": _max_item
        }
    }

    async orderStatusUpdated() {
        await this.map()

        switch (this.orderMap.payment.status) {
            case "paid":
            case "pending":
                return await this.pipedream.respond(
                    202,
                    "Ignore pending|paid(will be updated by another proccesss)",
                    { "resourceID": this.resourceID },
                    true
                )
        }

        this.data_to_update = this.prepareStatusUpdateData()

        const _updateRes = await this.update(this.data_to_update)
        if (_updateRes.modifiedCount < 1) {
            await this.orderInsert()
        }
    }

    async orderImport() {
        this.event_last = "order.import"
        this.eventType = "import"
        await this.orderInsert()
        this.return_data.add_data("order_data", this.payload)
        return this.return_data.toJSON()
    }

    async orderPaid() {
        this.event_last = "order.paid"
        this.data_to_update = this.prepareStatusUpdateData()

        this.data_to_update["$set"]["paid_at"] = this.getPaidAtDate()

        const _updateRes = await this.update(this.data_to_update)

        if (_updateRes.result.modifiedCount >= 1) {
            this.return_data.add_data("order_update_data", this.data_to_update)
            this.return_data.add_data("order_update_result", _updateRes)
            return this.return_data.toJSON()

        }

        if (_updateRes.result.matchedCount < 1) {
            await this.orderInsert()
            return this.return_data.toJSON()
        }

        if (_updateRes.result.modifiedCount < 1) {
            this.return_data.add_data("message", "Order found but not changed")
            return this.return_data.toJSON()
        }
    }

    async save() {
        const {
            database,
            hostname,
            username,
            password,
        } = this.pipedream.pipedream.mongodbAuth.$auth

        const url = `mongodb+srv://${username}:${password}@${hostname}/test?retryWrites=true&w=majority`

        const client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        const db = client.db(database)
        // await this.format()

        try {
            this.res = await db.collection("order_events").insertOne(this.payload)
            this.labcanID = this.res.insertedId.toString()
            this.return_data.add_data("labcanID", this.labcanID)
            this.return_data.add_data("result_order", this.res)
            this.return_data.add_data("payload", this.payload)
        } catch (e) {
            this.return_data.add_data("error", e.message)
            this.return_data.add_data("result_order", this.res)
        }
        finally {
            await client.close()
        }
    }

    async update(data, upsert = false) {

        const {
            database,
            hostname,
            username,
            password,
        } = this.pipedream.pipedream.mongodbAuth.$auth

        const url = `mongodb+srv://${username}:${password}@${hostname}/test?retryWrites=true&w=majority`

        const client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })

        const db = client.db(database)

        this.res = await db.collection("order_events").updateOne(
            {
                "resourceID": this.resourceID,
                "store": this.store
            },
            data,
            {
                "upsert": upsert
            })

        await client.close()

        return {
            "resourceID": this.resourceID,
            "store": this.store,
            "result": this.res,
            "data": this.payload,
            "update": data
        }
    }

    async setStore() {
        this.storeEntity = StoreSingleton.getInstance()
        this.store = await this.storeEntity.getStoreData()
        await this.format()
    }

    async format() {
        this.map()
        this.payload = {
            "store": this.store,
            "create_action": this.eventType,
            "resourceID": this.resourceID,
            "created_at": this.getCreatedAtDate(),
            "paid_at": this.getPaidAtDate(),
            "orderMap": this.orderMap,
            // "payment": this.getGatewayDataFromText(),
            "data": this.pipedream.body,
            "last_action": this.event_last != undefined ? this.event_last : this.eventType
        }
    }

    _returnGatewayData() {
        return {
            "gateway": this.gateway,
            "gateway_payment_id": this.gateway_payment_id,
            "method": this.getPaymentMethod(),
            "installments": this.getInstallments(),
            "status": this.orderMap.payment.status
        }
    }

    getGatewayDataFromText() {

        this.text_to_find_gateway = this.getTextWithGatewayID()
        var regex_pagSeguroObs = RegExp('([a-zA-Z0-9]{8}[-]{1}[a-zA-Z0-9]{4}[-]{1}[a-zA-Z0-9]{4}[-]{1}[a-zA-Z0-9]{4}[-]{1}[a-zA-Z0-9]{12})')
        let test_pagSeguroObs

        test_pagSeguroObs = this.text_to_find_gateway.match(regex_pagSeguroObs)
        if (test_pagSeguroObs !== null) {
            this.gateway = "pagseguro"
            this.gateway_payment_id = test_pagSeguroObs[0]
            return this._returnGatewayData()
        }

        var regex = RegExp('([0-9]{11})')
        let test

        test = this.text_to_find_gateway.match(regex)

        if (test) {
            this.gateway = "mercadopago"
            this.gateway_payment_id = test[0]
            return this._returnGatewayData()
        }

        regex = RegExp('([0-9]{9})')
        test = this.text_to_find_gateway.match(regex)

        if (test) {
            this.gateway = "pagar.me"
            this.gateway_payment_id = test[0]
            return this._returnGatewayData()
        }

        if (test === null) {
            this.gateway = "manual"
            this.gateway_payment_id = this.text_to_find_gateway
            return this._returnGatewayData()
        }
    }

    getInstallments() {
        throw new Error("This class didn't have a concrete implementation of getInstallments method.")
    }

    getCreatedAtDate() {
        throw new Error("This class didn't have a concrete implementation of getCreatedAtDate method.")
    }

    getPaymentData() {
        throw new Error("This class didn't have a concrete implementation of getPaymentData method.")
    }

    getPaidAtDate() {
        throw new Error("This class didn't have a concrete implementation of getPaidAtDate method.")
    }

    map() {
        this.orderMap = {}
        this.orderMap["id"] = this.pipedream.channel + "_" + this.resourceID
    }

    getCpfOrCnpj() {
        let _cpf_cnpj

        if (this.orderMap.customer.type === "j" || this.orderMap.customer.type === "J") {
            _cpf_cnpj = this.orderMap.customer.cnpj
        } else {
            _cpf_cnpj = this.orderMap.customer.cpf
        }

        return _cpf_cnpj
    }

    getParamFromMap(param) {
        switch (param) {
            case "sku":
                const _allSkus = []
                for (const item of this.orderMap.itens) {
                    _allSkus.push(item.sku)
                }
                return _allSkus
        }
    }

    prepareStatusUpdateData() {
        throw new Error("This concrete class didn't have prepareStatusUpdateData implementation")
    }
}

module.exports = Order