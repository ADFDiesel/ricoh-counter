# ricoh-counter

Module that fetches Ricoh printer counter data. Useful for automatic counter retrieval for cost accounting.

## Install

```
npm install ricoh-counter
```

## Usage

```javascript
const getCounters = require('ricoh-counter');

getCounters('printer-ip-or-host').then(counterData => console.log(counterData));
```

### counterData

getCounters function returns a counterData object with the following format:

```
{
  host,
  modelName,
  serial,
  hasCounterConfig,
  copy: {
       black,
       color
  }
  print: {
    black,
    color
  },
  fax: {
    black
  },
  blackTotal,
  colorTotal
}
```

## Supported printers

Working on the following RICOH printers:

* MP C2503
* Aficio MP 301
* MP C3003
* MP C3004
* Aficio MP 2352
* Aficio MP 171
* Aficio MP 201
* Aficio MP C3002
* Aficio MP 4000
* Aficio MP C2550
* MP 2554

## Known issues

Not counting two-colors counters.

## Author

Jacques Lareau, ADF Diesel Inc. <jacques.lareau@adfdiesel.com>