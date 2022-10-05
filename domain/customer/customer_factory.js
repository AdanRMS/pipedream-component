const CustomerYampi = require("./customer_yampi");

module.exports = class CustomerFactory {
    static create(platform) {
        switch (platform) {
            case "yampi":
                return new CustomerYampi()
            // case "vanrooy":
            //     return new CustomerVanRooy()
            default:
                throw new Error("Unknown platform")
        }
    }
}