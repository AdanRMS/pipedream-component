module.exports = class UtilitiesMLife {

    static getMonthNames() {
        return {
            "0": "Janeiro",
            "1": "Fevereiro",
            "2": "Março",
            "3": "Abril",
            "4": "Maio",
            "5": "Junho",
            "6": "Julho",
            "7": "Agosto",
            "8": "Setembro",
            "9": "Outubro",
            "10": "Novembro",
            "11": "Dezembro"
        }
    }

    static toTitleCase(str, includeAllCaps, includeMinorWords) {
        includeAllCaps = (includeAllCaps ? (includeAllCaps == true ? true : false) : false);
        includeMinorWords = (includeMinorWords ? (includeMinorWords == true ? true : false) : false);
        var i, j, lowers;
        str = str.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
            if (!/[a-z]/.test(txt) && /[A-Z]/.test(txt) && !includeAllCaps) {
                return txt;
            } else {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        });

        if (includeMinorWords) {
            return str;
        } else {
            // Certain minor words should be left lowercase unless 
            // they are the first or last words in the string
            lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
                'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'
            ];
            for (i = 0, j = lowers.length; i < j; i++)
                str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
                    function (txt) {
                        return txt.toLowerCase();
                    });

            return str;
        }
    }

    static parse_number_br(number_try) {
        try {
            var parsePhoneNumber = require('libphonenumber-js');
            let _phone_try = number_try

            const phoneNumber = parsePhoneNumber.parsePhoneNumber(_phone_try, "BR")
            return phoneNumber.number

        } catch (error) {
            return ""
        }
    }

    static async sha256(text) {
        const sha256 = require('simple-sha256')
        const hash = await sha256(text)
        return hash
    }

    static get_timestamp_now() {
        return Math.floor(new Date() / 1000)
    }

    static get_time_ISO_now() {
        const _date = new Date()
        return _date.toISOString()
    }

    static get_timestamp_for_date(date) {
        return Math.floor(new Date(date) / 1000)
    }
}