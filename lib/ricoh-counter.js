const snmp = require('snmp-native');
const Promise = require('bluebird');

const CONFIG = require('../config/printerConfig.json');

var snmpClient = new snmp.Session();
var snmpGetAsync = Promise.promisify(snmpClient.get, {context: snmpClient});

/**
 * returns true if the printer is supported
 * @param modelName
 * @returns {boolean}
 */
function printerHasConfig(modelName) {
    return CONFIG.counters[modelName] !== undefined;
}

/**
 * returns the counter oid path
 * @param modelName
 * @param func
 * @param color
 * @returns {string}
 */
function getCounterOid(modelName, func, color) {
    var bw = color === 'black' ? 'Black' : 'Color';
    var propName = func + bw;
    return [CONFIG.counterOid, CONFIG.counters[modelName][propName]].join('.');
}

/**
 * fetches a simple snmp value
 * will parse integers as javascript integers instead of strings
 */
var getSimpleSnmpValue = Promise.coroutine(function* (host, oid) {

    try {

        var snmpResponse = yield snmpGetAsync({ host, oid: '.' + oid, timeouts: [5000,5000,5000] });
        var isInt = snmpResponse[0].type === 2;
        var value = snmpResponse[0].value;

        if ( value !== 'noSuchInstance' ) {
            return isInt ? parseInt(value) : value;
        }
        else {
            return null;
        }

    } catch(e) {
        console.error(e);
        return 0;
    }

});

/**
 * main function
 * @param host or ip of the printer
 */
var getCounters = Promise.coroutine(function* (host) {

    try {

        var modelName = yield getSimpleSnmpValue(host, CONFIG.modelOid);
        var serial = yield getSimpleSnmpValue(host, CONFIG.serialOid);

        if (printerHasConfig(modelName)) {
            var copyBlackCounter = yield getSimpleSnmpValue(host, getCounterOid(modelName, 'copy', 'black'));
            var printBlackCounter = yield getSimpleSnmpValue(host, getCounterOid(modelName, 'print', 'black'));
            var faxBlackCounter = yield getSimpleSnmpValue(host, getCounterOid(modelName, 'fax', 'black'));
            var copyColorCounter = yield getSimpleSnmpValue(host, getCounterOid(modelName, 'copy', 'color'));
            var printColorCounter = yield getSimpleSnmpValue(host, getCounterOid(modelName, 'print', 'color'));
        }

    }
    catch (e) {
        console.error(e);
    }

    var output = {
        host: host,
        modelName: modelName,
        serial: serial,
        hasCounterConfig: false
    };

    if (printerHasConfig(modelName)) {

        output.hasCounterConfig = true;

        output.copy = {
            black: copyBlackCounter,
            color: copyColorCounter,
        };

        output.print = {
            black: printBlackCounter,
            color: printColorCounter
        };

        output.fax = {
            black: faxBlackCounter
        };

        output.blackTotal = copyBlackCounter + printBlackCounter + faxBlackCounter;

        output.colorTotal = copyColorCounter + printColorCounter;

    }

    return output;

});

module.exports = getCounters;