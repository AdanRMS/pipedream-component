const Dialog360 = require('../service/dialog_360')

module.exports = class WhatsAppNumberValidator {

    constructor(api_key, country = "BR") {
        this.dialog_360_service = new Dialog360(api_key)
        this.country = country
    }

    async check_contact_numbers(contacts, phone_key) {

        this.contacts = contacts
        this.phone_key = phone_key

        this.phone_numbers = []

        for (_contact of this.contacts) {
            this.phone_numbers.push(this.phone_list_parse())
        }

        const _numbers_checked = await this.dialog_360_service.check_numbers()

        let i = 0
        for (_number of _numbers_checked) {
            this.contacts[i]["phonekey"] = _number
            i++
        }

        return this.contacts
    }

    async check_numbers(phone_numbers) {
        this.phone_numbers = phone_numbers
        this.phone_numbers_checked = this.phone_list_parse()
        return await this.dialog_360_service.check_numbers(this.phone_numbers_checked)
    }

    phone_list_parse() {
        const _final_phone_list = []
        for (const phone of this.phone_numbers) {
            _final_phone_list.push(this.phone_number_parse(phone))
        }

        return _final_phone_list
    }

    phone_number_parse(number_try) {
        try {
            var parsePhoneNumber = require('libphonenumber-js');
            const phoneNumber = parsePhoneNumber.parsePhoneNumber(number_try, this.country)
            return phoneNumber.number

        } catch (error) {
            return ""
        }
    }
}