const Stage = require("./ac_stage")

module.exports = class ACCRM {
    constructor(integration_stages) {
        this.integration_stages = integration_stages
        this._build_pipelines()
    }

    _build_pipelines() {
        var _lookup = {}
        this.pipelines = []
        for (const stage of this.integration_stages) {
            var group = stage.group

            if (!(group in _lookup)) {
                _lookup[group] = 1
                this.pipelines.push({ group: group, stages: [] })
            }

            const _pipeline = this.pipelines.find(pipeline => pipeline.group === group)

            _pipeline.stages.push(Stage.fromJSON(stage))
        }
    }

    get_stage_by_name(stage_name){
        for(const _pipe of this.pipelines){
            for(const _stage of _pipe.stages){
                if(_stage.name === stage_name){
                    return _stage
                }
            }
        }

        throw new Error(`Stage ${stage_name} not found in integration.`)
    }
}