const IntegrationFactory = require("../integrations/integration_factory")
const StoreSingleton = require("../store/store")
const EventManager = require("./event_manager")

module.exports = class WebhookManager extends EventManager {

    async proccess() {
        await this._setWebhookIntegrations()
        return await this._doIntegrations()
    }

    async _doIntegrations() {

        this.results = {
            "success": [],
            "errors": [],
            "void": []
        }
        for (const integration of this.storeIntegrations) {
            const _currentIntegrationIdentifier = `${integration.integrations.name} (${integration.integrations.provider})`
            let _integration_response
            let _status

            try {
                this.integration = IntegrationFactory.getInstance(integration)
                // await this.integration.initialize()
                _integration_response = await this.integration.proccess()
                _status = "success"
                this.results[_status].push({ "integration": _currentIntegrationIdentifier, "data": _integration_response })
            } catch (e) {
                _integration_response = { "message": e.message, "stack": Error.captureStackTrace(e) }

                if (e.message.includes("match")) {
                    _status = "void"
                    this.results[_status].push({ "integration": _currentIntegrationIdentifier, "message": e.message })
                } else {
                    _status = "errors"
                    this.results[_status].push({ "integration": _currentIntegrationIdentifier, "message": e.message })

                    await this.integration.log(
                        _status,
                        _integration_response
                    );
                }
            }
        }

        let _status = 200
        let _message = "Integrations proccessed."
        let _success = true

        if (this.results.errors.length > 0) {
            _message = "Some integrations returned Errors."
            _success = false
            _status = 400
        }

        await this.pipedream.respond(_status, _message, this.results, _success)
    }

    async _setWebhookIntegrations() {
        this.storeEntity = StoreSingleton.getInstance()
        await this.storeEntity.initialize()
        this.storeIntegrations = await this.storeEntity.getWebhookIntegrations()
    }


}