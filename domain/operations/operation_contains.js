const Operations = require("./operations")

module.exports = class OperationContains extends Operations {

    calculate() {
        if (Array.isArray(this.content)) {
            return this._containsArray()
        }

        return this._containsSingle()
    }

    _containsArray() {
        for (const _part of this.content) {
            if (_part.includes(this.rules)) {
                return true
            }
        }
        return false
    }

    _containsSingle() {
        if (this.content.includes(this.rules)) {
            return true
        }
        return false
    }
}