const OrderCustom = require("./order_custom");
const OrderVanRooy = require("./order_vanrooy");
const OrderYampi = require("./order_yampi");

module.exports = class OrderFactory {
    static create(platform) {
        switch (platform) {
            case "yampi":
                return new OrderYampi()
            case "vanrooy":
                return new OrderVanRooy()
            case "custom":
                return new OrderCustom()
            default:
                throw new Error("Unknown platform")
        }
    }
}