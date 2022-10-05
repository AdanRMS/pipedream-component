module.exports = {
  name: "WhatsApp - Get WhatsApp ID From Numbers",
  description: "Get WhatsApp ID for a phone numbers list.",
  key: "whatsapp_number_validator",
  version: "0.2.7",
  type: "action",
  props: {
    whatsapp_numbers: {
      type: "string[]",
      label: "WhatsApp Number List",
      description: "List of Phone Numbers in international format. Example: +5527999985588",
    },
    api_key_360_dialog: {
      type: "string",
      label: "API Key 360 Dialog",
      secret: true
    }
  },
  async run() {
    const WhatsAppNumberValidator = require("../domain/whatsapp_number_validator")
    const _wa_number_validator = new WhatsAppNumberValidator(this.api_key_360_dialog)
    return await _wa_number_validator.check_numbers(this.whatsapp_numbers)
  },
}