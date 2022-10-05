const AutomationActiveCampaign = require("./automation/automation_activecampaign")
const ErpBling = require("./erp/erp_bling")
const ErpCustom = require("./erp/erp_custom")
const PixelFacebook = require("./pixel/pixel_facebook")
const PixelTaboola = require("./pixel/pixel_taboola")
const PixelTiktok = require("./pixel/pixel_tiktok")

module.exports = class IntegrationFactory {
    constructor() {
        throw new Error("Use getInstance")
    }

    static getInstance(integration) {
        switch (integration.integrations.provider) {
            case "bling":
                return new ErpBling(integration.integrations)
            case "custom-webhook":
                return new ErpCustom(integration.integrations)
            case "facebook":
                return new PixelFacebook(integration.integrations)
            case "taboola":
                return new PixelTaboola(integration.integrations)
            case "tiktok":
                return new PixelTiktok(integration.integrations)
            case "activecampaign":
                return new AutomationActiveCampaign(integration.integrations)
            default:
                throw new Error("Integration Provider not found")
        }
    }
}