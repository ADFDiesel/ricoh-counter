const snmp = require('snmp-native');
const Promise = require('bluebird');

const CONFIG = require('../config/printerConfig.json');

const snmpClient = new snmp.Session();
const snmpGetAsync = Promise.promisify(snmpClient.get, {context: snmpClient});

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
    let bw = color === 'black' ? 'Black' : 'Color';
    let propName = func + bw;
    return [CONFIG.counterOid, CONFIG.counters[modelName][propName]].join('.');
}

/**
 * fetches a simple snmp value
 * will parse integers as javascript integers instead of strings
 */
async function getSimpleSnmpValue(host, oid) {

    try {

        let snmpResponse = await snmpGetAsync({ host, oid: '.' + oid, timeouts: [5000,5000,5000] });
        let isInt = snmpResponse[0].type === 2;
        let value = snmpResponse[0].value;

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

}

/**
 * main function
 * @param host or ip of the printer
 */
async function getCounters(host) {

    try {

        let modelName = await getSimpleSnmpValue(host, CONFIG.modelOid);
        let serial = await getSimpleSnmpValue(host, CONFIG.serialOid);

        let counters, copyBlackCounter, printBlackCounter, faxBlackCounter, copyColorCounter, printColorCounter;

        if (printerHasConfig(modelName)) {

            copyBlackCounter = await getSimpleSnmpValue(host, getCounterOid(modelName, 'copy', 'black'));
            printBlackCounter = await getSimpleSnmpValue(host, getCounterOid(modelName, 'print', 'black'));
            faxBlackCounter = await getSimpleSnmpValue(host, getCounterOid(modelName, 'fax', 'black'));
            copyColorCounter = await getSimpleSnmpValue(host, getCounterOid(modelName, 'copy', 'color'));
            printColorCounter = await getSimpleSnmpValue(host, getCounterOid(modelName, 'print', 'color'));

            counters = {
                hasCounterConfig: true,
                copy: {
                    black: copyBlackCounter,
                    color: copyColorCounter,
                },
                print: {
                    black: printBlackCounter,
                    color: printColorCounter
                },
                fax: {
                    black: faxBlackCounter
                },
                blackTotal: copyBlackCounter + printBlackCounter + faxBlackCounter,
                colorTotal: copyColorCounter + printColorCounter
            };

        }

        return Object.assign({
            host: host,
            modelName: modelName,
            serial: serial,
            hasCounterConfig: false
        }, counters);

    }
    catch (e) {
        console.error(e);
    }

}

module.exports = getCounters;