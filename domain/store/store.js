const PipedreamSingleton = require("../pipedream/pipedream");
const MongoClient = require('mongodb').MongoClient;

class Store {

    constructor() {
        this.pipedream = PipedreamSingleton.getInstance()
    }

    async initialize() {
        await this.getStoreData()
    }

    async getWebhookIntegrations() {
        if (this.storeIntegrations !== undefined) {
            return this.storeIntegrations
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

        const pipeline = []
        pipeline.push({
            '$match': {
                'slug': this.pipedream.event
            }
        })

        pipeline.push(
            {
                '$lookup': {
                    from: 'integrations',
                    localField: 'slug',
                    foreignField: 'webhookSubscriptions',
                    as: 'integrations'
                }
            }
        )

        pipeline.push(
            {
                "$unwind": {
                    path: "$integrations",
                    preserveNullAndEmptyArrays: false
                }
            })

        pipeline.push({
            '$match': {
                "integrations.store": this.store.slug
            }
        })

        let collection = db.collection("webhooks")
        const res = await collection.aggregate(pipeline)

        const _storeConfigurations = []

        await res.forEach(store => {
            _storeConfigurations.push(store)
        });

        client.close();

        if (_storeConfigurations.length < 1) {
            const _message = `No integrations attached to '${this.pipedream.event}' for channel '${this.pipedream.channel}'`
            // const _body = {message : _message}
            await this.pipedream.respond(404,_message)
            // throw new Error(_message)
        }

        this.storeIntegrations = _storeConfigurations

        return this.storeIntegrations
    }

    // async getStoreIntegrationsByType(type = null) {
    //     if (this.storeIntegrations !== undefined) {
    //         return this.storeIntegrations
    //     }

    //     const {
    //         database,
    //         hostname,
    //         username,
    //         password,
    //     } = this.pipedream.pipedream.mongodbAuth.$auth

    //     const url = `mongodb+srv://${username}:${password}@${hostname}/test?retryWrites=true&w=majority`
    //     const client = await MongoClient.connect(url, {
    //         useNewUrlParser: true,
    //         useUnifiedTopology: true
    //     })
    //     const db = client.db(database)

    //     const pipeline = []
    //     pipeline.push({
    //         '$match': {
    //             'slug': this.pipedream.channel
    //         }
    //     })

    //     pipeline.push({
    //         '$lookup': {
    //             'from': 'integrations',
    //             'localField': 'slug',
    //             'foreignField': 'store',
    //             'as': 'integrations'
    //         }
    //     })

    //     if (type !== null) {
    //         pipeline.push(
    //             {
    //                 "$addFields": {
    //                     "integrations": {
    //                         "$filter": {
    //                             input: "$integrations",
    //                             as: "integration",
    //                             cond: { $eq: [type, "$$integration.type"] }
    //                         }
    //                     }
    //                 }
    //             })
    //     }

    //     pipeline.push(
    //         {
    //             "$unwind": {
    //                 path: "$integrations",
    //                 preserveNullAndEmptyArrays: false
    //             }
    //         })

    //     let collection = db.collection("stores")
    //     const res = await collection.aggregate(pipeline)

    //     const _storeConfigurations = []

    //     await res.forEach(store => {
    //         _storeConfigurations.push(store)
    //     });

    //     if (_storeConfigurations.length < 1) {
    //         const _message = `No '${type}' integrations for channel '${this.pipedream.channel}'`
    //         await this.pipedream.respond(404,_message)
    //         throw new Error(_message)
    //     }

    //     this.storeIntegrations = _storeConfigurations

    //     client.close();

    //     return this.storeIntegrations

    // }

    async getStoreData() {
        // if (this.store !== null && this.store !== undefined) {
        //     return this.store
        // }

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

        let collection = db.collection("stores")
        const res = await collection.findOne({ "slug": this.pipedream.channel })
        this.store = res

        client.close();

        if (this.store === null || this.store === undefined) {
            const _message = `store '${this.pipedream.channel}' doesn't exists`
            await this.pipedream.respond(404,_message)
            // throw new Error(_message)
        }

        return this.store
    }

}

class StoreSingleton {
    constructor() {
        throw new Error('Use Singleton.getInstance()');
    }
    static getInstance() {
        this.pipedream = PipedreamSingleton.getInstance()
        if(StoreSingleton.instance){
            if(StoreSingleton.instance.slug == this.pipedream.channel){
                return StoreSingleton.instance;
            }
        }

        StoreSingleton.instance = new Store();

        return StoreSingleton.instance;
    }
}

module.exports = StoreSingleton