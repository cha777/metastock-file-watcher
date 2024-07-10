module.exports = (function () {
  const fmsbin2ieee = function (msbin) {
    const sign = msbin[2] & 0x80;
    const ieee = Buffer.alloc(4);

    if (msbin[3] === 0) {
      return 0.0;
    }

    ieee[3] |= sign;
    const ieee_exp = msbin[3] - 2;
    ieee[3] |= ieee_exp >> 1;
    ieee[2] |= ieee_exp << 7;
    ieee[2] |= msbin[2] & 0x7f;
    ieee[1] = msbin[1];
    ieee[0] = msbin[0];

    return ieee.readFloatLE();
  };

  const float2date = function (date) {
    date = Math.round(date);

    if (date < 101) {
      date = 101;
    }

    const year = 1900 + Math.floor(date / 10000);
    const month = ('0' + Math.floor((date % 10000) / 100)).slice(-2);
    const day = ('0' + (date % 100)).slice(-2);

    return [year, month, day].join('');
  };

  const fieee2msbm = function (value) {
    const ieee = Buffer.alloc(4);
    ieee.writeFloatLE(value);

    const sign = ieee[3] & 0x80;
    let msbin_exp = ieee[3] << 1;
    msbin_exp |= ieee[2] >> 7;

    if (msbin_exp === 0xfe) {
      return 1;
    }

    msbin_exp += 2;
    let msbin = Buffer.alloc(4);

    msbin[3] = msbin_exp;

    msbin[2] |= sign;
    msbin[2] |= ieee[2] & 0x7f;
    msbin[1] = ieee[1];
    msbin[0] = ieee[0];

    return msbin;
  };

  const date2msbm = function (date) {
    const floatValue = parseFloat(_normalizeDate(date));

    return fieee2msbm(floatValue);
  };

  const getFormattedDate = function (date) {
    return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
  };

  const _normalizeDate = function (date = '') {
    const year = parseInt(date.slice(0, 4)) - 1900;
    return `${year}${date.slice(4)}`;
  };

  return {
    fmsbin2ieee,
    float2date,
    fieee2msbm,
    date2msbm,
    getFormattedDate,
  };
})();
