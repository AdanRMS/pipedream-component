const Customer = require("./customer")
var moment = require('moment-timezone');

module.exports = class CustomerYampi extends Customer {

    async customer_create() {
        return await this.upsert()
    }

    populate_customer_data() {
        try {
            this.full_name = this.pipedream.body.resource.customer.data.generic_name
            this.first_name = this.pipedream.body.resource.customer.data.first_name
            this.last_name = this.pipedream.body.resource.customer.data.last_name
            this.email = this.pipedream.body.resource.customer.data.email
            this.phone = this.pipedream.body.resource.customer.data.phone.full_number
            this.cpf = this.pipedream.body.resource.customer.data.cpf
            this.created_at = this.get_created_date()
        }catch(e){
            this.return_data.add_data("error", e.message)
            this.return_data.add_data("customer", this.pipedream.body.resource.customer.data)
            throw new Error("Error trying to populate customer.")
        }
    }

    get_created_date() {
        const _offset = moment.tz(this.pipedream.body.resource.customer.data.created_at.timezone).utcOffset();
        const _date_string = this.pipedream.body.resource.customer.data.created_at.date + " GMT" + _offset / 60 * 100
        const _date = new Date(_date_string)
        return _date
    }
}