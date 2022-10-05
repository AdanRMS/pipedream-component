var mktParams = [
    "utm_term",
    "utm_campaign",
    "utm_content",
    "utm_source",
    "utm_medium",
    "fbclid",
    "gclid",
    "ttclid",
    "tblid"
]

var utmParams = [
    "utm_term",
    "utm_campaign",
    "utm_content",
    "utm_source",
    "utm_medium"
]

function isValidValue(value) {
    if (value !== "null" && value !== "undefined" && value !== null & value !== undefined) {
        return true;
    }

    return false;
}

function saveParameter(key, value) {
    localStorage.setItem(key, value);
}

function findParameterGet(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }

    return result;
}

function findParameter(parameterName) {
    var _value = findParameterGet(parameterName);

    if (isValidValue(_value)) {
        saveParameter(parameterName, _value);
        return _value;
    }

    var _parameter_persist = localStorage.getItem(parameterName);

    if (isValidValue(_parameter_persist)) {
        return _parameter_persist;
    }
}

function _saveUTMParametersToStorage() {

    var _paramObj = _getAllQueryParamters();
    var _paramValues = Object.entries(_paramObj);
    var _utmSetIsDifferent = false;
    var _returnData = {}

    for (var i = 0; i < _paramValues.length; i++) {
        var _param = _paramValues[i][0];
        if (_param.includes("utm_")) {
            var _queryValue = _paramObj[_param]
            var _localValue = localStorage.getItem(_param);

            if (isValidValue(_queryValue) && _queryValue != _localValue) {
                _utmSetIsDifferent = true;
            }
        }
    }

    if (_utmSetIsDifferent) {
        for (var i = 0; i < utmParams.length; i++) {
            var _param = utmParams[i];
            var _queryValue = _paramObj[_param]
            if (_param.includes("utm_")) {
                if (isValidValue(_queryValue)) {
                    _returnData[_param] = _queryValue;
                    localStorage.setItem(_param, _queryValue);
                } else {
                    localStorage.removeItem(_param);
                }
            }
        }
    } else {
        for (var i = 0; i < utmParams.length; i++) {
            var _param = utmParams[i];
            _returnData[_param] = localStorage.getItem(_param);
        }
    }

    return _returnData;
}

function saveParameterToStorage() {
    var _utm_params = _saveUTMParametersToStorage();
    var _paramObj = _getAllQueryParamters();
    _paramObj = mergeObjects(_paramObj, _utm_params)

    for (var i = 0; i < mktParams.length; i++) {
        var _param = mktParams[i];
        var _value = _paramObj[_param]
        if (isValidValue(_value)) {
            localStorage.setItem(_param, _value);
        }
    }

    return _paramObj;
}

function getUUID() {
    var _uuid = findParameter("apt_uuid");

    if (isValidValue(_uuid)) {
        return _uuid;
    }

    _uuid = generateUUID();
    saveParameter("apt_uuid", _uuid);
    return _uuid;
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function _visitTracker() {
    var _mktParams = saveParameterToStorage();

    var _payload = {
        event_type: "pageView",
        landing_page: {
            domain: window.location.hostname,
            slug: window.location.pathname,
            title: document.title
        },
        person_id: getUUID(),
        query: _mktParams
    };

    jQuery.ajax({
        type: "POST",
        url: "https://enkioll4823c4np.m.pipedream.net",
        data: JSON.stringify(_payload),
        dataType: "json",
        success: function (response) {
            console.log(response)
        }
    });
}

function _getAllQueryParamters(url) {
    var _query
    if(url){
        var _url = new URL(url)
        _query = _url.search;
    }

    if (_query === undefined) {
        _query = window.location.search
    }

    var _urlSearchParams = new URLSearchParams(_query);
    var _entries = _urlSearchParams.entries();
    var _paramObj = {};

    var i = false;
    while (i == false) {

        var _entry = _entries.next();
        if (_entry.done) {
            break;
        }

        var _key = _entry.value[0];
        var _value = _entry.value[1];
        _paramObj[_key] = _value;

        i = _entry.done;
    }

    return _paramObj;
}

function mergeObjects(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

function _embedUTMinMetadata(_params) {
    var _finalParams = { "metadata": {} };
    var _entries = Object.entries(_params);

    _entries.forEach(
        function (element) {
            if (element[0].includes("utm_")) {
                _finalParams[element[0]] = element[1];
            } else {
                _finalParams["metadata"][element[0]] = element[1];
            }
        }
    );

    return _finalParams;
}

function _urlBuildParameters() {
    jQuery(".apt-params-meta a").each(
        function (index) {
            var _originalURL = jQuery(this).attr("href");
            var _url = new URL(_originalURL);
            var _paramsVisit = _getAllQueryParamters();
            var _paramsButton = _getAllQueryParamters(_originalURL);
            var _paramsFinal = mergeObjects(_paramsButton, _paramsVisit);
            var _paramsWithMetadata = _embedUTMinMetadata(_paramsFinal);

            _paramsWithMetadata["metadata"]["mlife_uuid"] = getUUID();
            _paramsWithMetadata["metadata"]["path"] = window.location.pathname;
            _paramsWithMetadata["metadata"]["domain"] = window.location.hostname;

            var _queryString = jQuery.param(_paramsWithMetadata);
            var _finalURL = _url.origin + _url.pathname + "?" + _queryString;

            jQuery(this).attr("href", _finalURL);
        }
    );
}

function is_wp_admin() {
    if(window.location.toString().includes("action=architect")){
        return true;
    }

    if(window.location.toString().includes("action=edit")){
        return true;
    }

    if(window.location.toString().includes("action=elementor")){
        return true;
    }

    return false;
}

if (!is_wp_admin()) {
    _visitTracker();
    _urlBuildParameters();
}