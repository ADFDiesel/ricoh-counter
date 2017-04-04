const getCounters = require('../index');

getCounters('10.1.1.101')
    .then(data => {
        console.log(data);
        process.exit();
    })
    .catch(console.error);
