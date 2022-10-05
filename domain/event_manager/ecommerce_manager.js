const CustomerFactory = require("../customer/customer_factory")
const IntegrationFactory = require("../integrations/integration_factory")
const OrderFactory = require("../order/order_factory")
const PipedreamSingleton = require("../pipedream/pipedream")
const StoreSingleton = require("../store/store")
const EventManager = require("./event_manager")

module.exports = class EcommerceManager extends EventManager {

    async proccess() {
        let _response
        switch (this.pipedream.action) {
            case "order.new":
                this.order = await this.orderGetInitiatedInstance()
                if (this.order.orderMap.payment.status == "paid") {
                    return await this.pipedream.respond(201, "order.new >> paid", {"message" : "Ignored. Should update in order.paid event"}, true)
                }
                _response = await this.order.orderInsert()
                return await this.pipedream.respond(201, "order.new", _response, true)

            case "order.paid":
                this.order = await this.orderGetInitiatedInstance()
                _response = await this.order.orderPaid()
                return await this.pipedream.respond(201, "order.paid", _response, true)

            case "order.import":
                this.order = await this.orderGetInitiatedInstance()
                _response = await this.order.orderImport()
                return await this.pipedream.respond(201, "order.import", _response, true)

            case "order.status_update":
                this.order = await this.orderGetInitiatedInstance()
                _response = await this.order.orderStatusUpdated()
                return await this.pipedream.respond(201, "order.status_update", _response, true)
            case "customer.create":
                this.customer = await this.customerGetInitiatedInstance()
                _response = await this.customer.customer_create()
                return await this.pipedream.respond(201, _response.message, _response, true)
            default:
                throw new Error(`No action '${this.pipedream.action}' found.`)
        }
    }

    async orderGetInitiatedInstance() {
        const _order = OrderFactory.create(this.pipedream.platform)
        await _order.initialize()
        return _order
    }

    async customerGetInitiatedInstance() {
        const _customer = CustomerFactory.create(this.pipedream.platform)
        await _customer.initialize()
        return _customer
    }


}