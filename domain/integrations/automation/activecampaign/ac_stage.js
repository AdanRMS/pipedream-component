module.exports = class ACStage {
    constructor(deal_group, deal_id, deal_name, deal_order) {
        this.group = deal_group
        this.id = deal_id
        this.order = deal_order
        this.name = deal_name
    }

    static fromJSON(stage_json) {
        return new ACStage(stage_json.group, stage_json.id, stage_json.title, stage_json.order)
    }
}