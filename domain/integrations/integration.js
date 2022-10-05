const OperationFactory = require("../operations/operations_factory")
const OrderFactory = require("../order/order_factory")
const PipedreamSingleton = require("../pipedream/pipedream")
const ReturnDataSingleton = require("../return_data/return_data")
const MongoClient = require('mongodb').MongoClient;

module.exports = class Integration {
    constructor(integration) {
        this.integration = integration
        this.configs = integration.configs
        this.pipedream = PipedreamSingleton.getInstance()
        this.return_data = ReturnDataSingleton.newInstance()
    }

    async setOrder() {
        this.order = OrderFactory.create(this.pipedream.platform)
        await this.order.initialize()
    }

    async proccess() {
        switch (this.pipedream.event) {

            case "customer.created":
                this.shouldProccess()
                return await this.do_customer_created()
            case "order.created":
                await this.setOrder()
                this.shouldProccess()
                if (this.order.orderMap.payment.status === "paid") {
                    return await this.doOrderPaid()
                }
                return await this.doOrderCreated()

            case "order.paid":
                await this.setOrder()
                this.shouldProccess()
                return await this.doOrderPaid()

            case "order.import":
                await this.setOrder()
                this.shouldProccess()
                return await this.doOrderImport()

            case "order.shipment.tracking_code_generated":
                await this.setOrder()
                this.shouldProccess()
                return await this.doShipmentTrackingCodeGenerated()

            default:
                throw new Error(`Event ${this.pipedream.event} don't have actions associated with.`)

        }
        // this.doProccess()
    }

    // async doProccess(){}

    async doOrderCreated() {
        throw new Error("This Integration didn't have an OrderCreated method.")
    }

    async doOrderPaid() {
        throw new Error("This Integration didn't have an OrderPaid method.")
    }

    async doOrderImport() {
        throw new Error("This Integration didn't have an doOrderImport method.")
    }

    async do_customer_created() {
        throw new Error("This Integration didn't have an do_customer_created method.")
    }

    async doShipmentTrackingCodeGenerated() {
        throw new Error("This Integration didn't have an doShipmentTrackingCodeGenerated method.")
    }

    shouldProccess() {
        this.inclusion_rules = this.configs.filter
        this.exclusion_rules = this.configs.exclude

        if (this.inclusion_rules) {
            this._proccessInclusionRules()
        }

        if (this.exclusion_rules) {
            this._proccessExclusionRules()
        }

        return true
    }

    async log(status, response) {

        const _log_body = {
            order: this.pipedream.body._id,
            integration : this.integration,
            last_status: status,
            last_response: response,
            responses: [
                {
                    status : status,
                    response: response
                }
            ],
            event: this.pipedream.eventData
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
        // await this.format()

        try {
            this.res = await db.collection("integration_errors").insertOne(_log_body)
        } catch (e) {
            console.log(e.message)
            return
        }
        finally {
            await client.close()
        }
    }

    _proccessInclusionRules() {
        if (this._proccessRule(this.inclusion_rules) === false) {
            throw new Error(`Order didn't match the inclusion criteria: '${JSON.stringify(this.inclusion_rules)}'`)
        }
    }

    _proccessExclusionRules() {
        if (this._proccessRule(this.exclusion_rules) === true) {
            throw new Error(`Order match the exclusion criteria: '${JSON.stringify(this.exclusion_rules)}'`)
        }

    }

    _proccessRule(rule) {
        if (rule === undefined || rule === null) {
            return
        }

        for (const _rule of Object.keys(rule)) {
            const _operation = rule[_rule].operation
            const _rules = rule[_rule].value

            const _param = this.order.getParamFromMap(_rule)

            if (_operation == null || _rules == null || _param == null) {
                throw new Error(`Not posible to check criteria. Data invalid: operation: '${_operation}' | _rules: '${_rules}' | order parameter comparison: '${_rule}'`)
            }

            const operation = OperationFactory.getInstance(_operation, _rules, _param)
            return operation.calculate()
        }
    }
}