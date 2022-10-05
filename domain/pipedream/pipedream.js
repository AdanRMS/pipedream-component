class Pipedream {
    constructor(pipedream, functions) {
        this.pipedream = pipedream
        this.functions = functions
        this.eventData = pipedream.event_data
        this.body = pipedream.event_data.body
        this.platform = this.eventData.query.platform
        this.channel = this.eventData.query.channel
        this.action = this.eventData.query.action
        this.event = this.eventData.query.event
        this.module = this.pipedream.mentoringlifeModule
        this._populateBody()
        this._populateOrderData()
    }

    async respond(status, message, data, success) {
        const _body = { message: message, data: data }
        const _response = {
            "status": status,
            "body": _body
        }

        await this.functions.respond(_response)
        if (success !== true) {
            throw new Error(message)
        } else {
            return this.functions.flow.exit(message)
        }
    }

    _populateBody() {
        try {
            this.body = JSON.parse(this.eventData.body)
        } catch (e) {
            this.body = this.eventData.body

            if (this.body === null || this.body === undefined || Object.keys(this.body).length < 1) {
                throw new Error("Error while trying to parse body.")
            }
        }
    }

    _populateOrderData() {
        if (Object.keys(this.body).includes("_id")) {
            this.orderData = this.body.data.resource
        } else {
            this.orderData = this.body.resource
        }
    }
}

class PipedreamSingleton {
    constructor() {
        throw new Error('Use PipedreamSingleton.getInstance() or PipedreamSingleton.newInstance');
    }

    static newInstance(pipedream, functions) {
        PipedreamSingleton.instance = null
        PipedreamSingleton.instance = new Pipedream(pipedream, functions);
        return PipedreamSingleton.instance;
    }

    static getInstance(pipedream, functions) {
        if (!PipedreamSingleton.instance) {
            if (pipedream === null || functions === null) {
                throw new Error("To build PipedreamSingleton instance you need pipedream and functions arguments")
            }
            PipedreamSingleton.instance = new Pipedream(pipedream, functions);
        }
        return PipedreamSingleton.instance;
    }
}

module.exports = PipedreamSingleton