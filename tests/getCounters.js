const getCounters = require('../index');

try {

    test();

} catch(e) {

    console.error(e);

}


async function test() {

    let counters = await getCounters('10.1.1.101');
    console.log(counters);

}