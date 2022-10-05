const PipedreamSingleton = require("../domain/pipedream/pipedream");
const EventManagerFactory = require("../domain/event_manager/event_manager_factory");

module.exports = {
  id: "mentoringlife_api",
  name: "MentoringLife API",
  description: "MentoringLife Endpoint API for Orders -v0.17.1",
  key: "mentoringlife_api",
  version: "0.17.1",
  type: "action",
  props: {
    mongodbAuth: {
      type: "app",
      app: "mongodb"
    },
    mentoringlifeModule: {
      type: "string",
      options: [
        {
          label: 'Ecommerce Proccess',
          value: 'ecommerce'
        },
        {
          label: 'Webhook Proccess',
          value: 'webhook'
        }
      ]
    },
    event_data: {
      type: "object",
      label: "Event",
      description: "The event data.",
    }
  },
  async run({ $ }) {
    PipedreamSingleton.newInstance(this, $)
    this.eventManager = EventManagerFactory.getInstance()
    return await this.eventManager.proccess()
    // const _instance = new MentoringLifeAPI()
    // await _instance.proccessRequest()
  },
}
