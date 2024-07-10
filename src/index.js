const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs/promises');
const utils = require('./utils');

const directoryToWatch = path.resolve('/Users/chathuranga/Documents/metastock/TDWL');

const watcher = chokidar.watch(directoryToWatch, {
  persistent: true,
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  depth: 5, // Watch nested directories up to 99 levels deep
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },
});

watcher.on('change', (filePath) => onFileChange(filePath));

const onFileChange = async (filePath) => {
  const isIntraday = filePath.includes('intraday');
  console.log(`${new Date().toISOString().replace('T', ' ').replace('Z', '')} - File modified: ${filePath}`);

  if (path.extname(filePath) !== '.DAT') {
    return;
  }

  const fieldsCount = isIntraday ? 8 : 7;
  const data = await fs.readFile(filePath);
  const recordsLength = data.readUInt16LE(2);
  let lastRecordOffset = recordsLength * fieldsCount * 4;
  const dateBuffer = data.slice(lastRecordOffset, lastRecordOffset + 4);
  const convertedDate = utils.float2date(utils.fmsbin2ieee(dateBuffer));

  lastRecordOffset += 4;

  const record = {
    date: convertedDate,
  };

  if (isIntraday) {
    const timeStr = utils.fmsbin2ieee(data.slice(lastRecordOffset, lastRecordOffset + 4)).toString();
    record.time = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
    lastRecordOffset += 4;
  }

  ['open', 'high', 'low', 'close', 'volume', 'openInterest'].forEach((field, i) => {
    const offset = lastRecordOffset + i * 4;
    record[field] = utils.fmsbin2ieee(data.slice(offset, offset + 4)).toFixed(2);
  });

  console.log(`recordsLength: ${recordsLength}`);
  console.log(JSON.stringify(record, null, 2));
};

console.log(`Watching for changes in ${directoryToWatch}`);
