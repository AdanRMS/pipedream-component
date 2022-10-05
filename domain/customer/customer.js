const PipedreamSingleton = require("../pipedream/pipedream")
const StoreSingleton = require("../store/store")
const ReturnDataSingleton = require("../return_data/return_data")
const MongoClient = require('mongodb').MongoClient

module.exports = class Customer {

    constructor() {
        this.pipedream = PipedreamSingleton.getInstance()
        this.return_data = ReturnDataSingleton.getInstance()
        this.eventType = this.pipedream.eventData.query.action
        this.resourceID = this.pipedream.body.resource.id
    }

    async initialize() {
        await this.setStore()
    }

    async format() {
        this.payload = {
            "store": this.store,
            "create_action": this.eventType,
            "data": this.pipedream.body,
            "last_action": this.eventType,
            "resourceID": this.resourceID,
            "full_name": this.full_name,
            "first_name": this.first_name,
            "last_name": this.last_name,
            "email": this.email,
            "phone": this.phone,
            "cpf": this.cpf,
            "created_at": this.created_at
        }
    }

    async setStore() {
        this.storeEntity = StoreSingleton.getInstance()
        this.store = await this.storeEntity.getStoreData()
        await this.format()
    }

    async customer_create() {
        throw new Error("This class didn't implemented customer_reated")
    }

    get_created_date() {
        throw new Error("This class didn't implemented get_created_date")
    }

    async upsert() {

        try {
            this.populate_customer_data()
        } catch (e) {
            this.return_data.add_data("message", e.message)
            return this.return_data.toJSON()
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

        this.res = await db.collection("customers").replaceOne(
            {
                "resourceID": this.resourceID,
                "store": this.store
            },
            this.payload,
            {
                "upsert": true
            })

        await client.close()

        return { "message" : "Customer Created", "result": this.res, "data": this.payload }
    }
}