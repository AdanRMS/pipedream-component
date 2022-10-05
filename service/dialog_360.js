module.exports = class Dialog360 {
    constructor(api_key) {
        this.api_key = api_key
    }

    async check_numbers(numbers) {
        const axios = require('axios')
        const _url = `https://waba.360dialog.io/v1/contacts`

        try {
            const result = await axios.post(
                _url,
                {
                    blocking: "wait",
                    contacts: numbers,
                    force_check: true
                },
                {
                    headers: {
                        "D360-API-KEY": this.api_key
                    }
                }
            )

            const _wa_ids = []

            for (const _contact of result.data.contacts) {
                _wa_ids.push(_contact)
            }

            return _wa_ids
        } catch (error) {
            if (error.response) {
                // Request made and server responded
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                // The request was made but no response was received
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            return error
        }
    }
}