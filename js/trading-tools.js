const PIP_SIZES = {
  EURUSD: 0.0001, GBPUSD: 0.0001, USDJPY: 0.01, USDCHF: 0.0001,
  AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001, XAUUSD: 0.01, EURGBP: 0.0001
};
const CONTRACT = {
  EURUSD: 100000, GBPUSD: 100000, USDJPY: 100000, USDCHF: 100000,
  AUDUSD: 100000, USDCAD: 100000, NZDUSD: 100000, XAUUSD: 100, EURGBP: 100000
};

function pairOptions() {
  return Object.keys(PIP_SIZES).map(p => {
    const label = p.slice(0, 3) + '/' + p.slice(3);
    return '<option value="' + p + '">' + label + '</option>';
  }).join('');
}

function calcPositionSize(balance, riskPct, slPips, pair) {
  const riskAmount = balance * (riskPct / 100);
  const pipSize = PIP_SIZES[pair];
  const contract = CONTRACT[pair];
  let pipValue = pipSize * contract;
  if (pair === 'USDJPY') pipValue = pipValue / 150;
  if (pair === 'XAUUSD') pipValue = pipSize * contract;
  const lots = riskAmount / (slPips * pipValue);
  return {
    lots: Math.max(0.01, Math.floor(lots * 100) / 100),
    riskAmount: riskAmount,
    pipValue: pipValue.toFixed(2)
  };
}

function calcPipValue(pair, lots) {
  const pipSize = PIP_SIZES[pair];
  const contract = CONTRACT[pair];
  let val = pipSize * contract * lots;
  if (pair === 'USDJPY') val = val / 150;
  return val.toFixed(2);
}

function calcRiskReward(entry, sl, tp) {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  const pipDiv = entry > 10 ? 0.01 : 0.0001;
  return {
    rr: (reward / risk).toFixed(2),
    riskPips: (risk / pipDiv).toFixed(1),
    rewardPips: (reward / pipDiv).toFixed(1)
  };
}

function calcFibonacci(high, low, direction) {
  const diff = high - low;
  const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  return ratios.map(function(lvl) {
    const price = direction === 'up' ? low + diff * lvl : high - diff * lvl;
    return { level: (lvl * 100).toFixed(1) + '%', price: price.toFixed(5) };
  });
}

function calcMargin(lots, pair, leverage, price) {
  const notional = CONTRACT[pair] * lots * price;
  return (notional / leverage).toFixed(2);
}

function buildToolPanels() {
  const panels = document.getElementById('toolPanels');
  if (!panels || panels.dataset.built) return;
  panels.dataset.built = '1';
  const opts = pairOptions();

  panels.innerHTML =
    '<div class="tool-panel active" id="panel-position">' +
      '<h3 data-i18n="tools.positionTitle"></h3>' +
      '<form class="tool-form" id="form-position">' +
        '<label><span data-i18n="tools.balance"></span><input type="number" id="pos-balance" value="10000"></label>' +
        '<label><span data-i18n="tools.riskPct"></span><input type="number" id="pos-risk" value="1" step="0.1"></label>' +
        '<label><span data-i18n="tools.slPips"></span><input type="number" id="pos-sl" value="30"></label>' +
        '<label><span data-i18n="tools.pair"></span><select id="pos-pair">' + opts + '</select></label>' +
        '<button type="submit" class="btn btn-primary" data-i18n="tools.calc"></button>' +
      '</form>' +
      '<div class="tool-result" id="result-position"></motion>' +
    '</div>' +
    '<motion class="tool-panel" id="panel-pip">' +
      '<h3 data-i18n="tools.pipTitle"></h3>' +
      '<form class="tool-form" id="form-pip">' +
        '<label><span data-i18n="tools.pair"></span><select id="pip-pair">' + opts + '</select></label>' +
        '<label><span data-i18n="tools.lotSize"></span><input type="number" id="pip-lots" value="1" step="0.01"></label>' +
        '<button type="submit" class="btn btn-primary" data-i18n="tools.calc"></button>' +
      '</form>' +
      '<div class="tool-result" id="result-pip"></div>' +
    '</div>' +
    '<div class="tool-panel" id="panel-rr">' +
      '<h3 data-i18n="tools.rrTitle"></h3>' +
      '<form class="tool-form" id="form-rr">' +
        '<label><span data-i18n="tools.entry"></span><input type="number" id="rr-entry" value="1.0850" step="0.0001"></label>' +
        '<label><span data-i18n="tools.sl"></span><input type="number" id="rr-sl" value="1.0820" step="0.0001"></label>' +
        '<label><span data-i18n="tools.tp"></span><input type="number" id="rr-tp" value="1.0910" step="0.0001"></label>' +
        '<button type="submit" class="btn btn-primary" data-i18n="tools.calc"></button>' +
      '</form>' +
      '<div class="tool-result" id="result-rr"></div>' +
    '</div>' +
    '<div class="tool-panel" id="panel-fib">' +
      '<h3 data-i18n="tools.fibTitle"></h3>' +
      '<form class="tool-form" id="form-fib">' +
        '<label><span data-i18n="tools.high"></span><input type="number" id="fib-high" value="1.0900" step="0.0001"></label>' +
        '<label><span data-i18n="tools.low"></span><input type="number" id="fib-low" value="1.0800" step="0.0001"></label>' +
        '<label>Dir<select id="fib-dir"><option value="up">Up</option><option value="down">Down</option></select></label>' +
        '<button type="submit" class="btn btn-primary" data-i18n="tools.calc"></button>' +
      '</form>' +
      '<div class="tool-result" id="result-fib"></div>' +
    '</div>' +
    '<div class="tool-panel" id="panel-margin">' +
      '<h3 data-i18n="tools.marginTitle"></h3>' +
      '<form class="tool-form" id="form-margin">' +
        '<label><span data-i18n="tools.lotSize"></span><input type="number" id="margin-lots" value="1" step="0.01"></label>' +
        '<label><span data-i18n="tools.pair"></span><select id="margin-pair">' + opts + '</select></label>' +
        '<label><span data-i18n="tools.leverage"></span><input type="number" id="margin-leverage" value="100"></label>' +
        '<label><span data-i18n="tools.entry"></span><input type="number" id="margin-price" value="1.0850" step="0.0001"></label>' +
        '<button type="submit" class="btn btn-primary" data-i18n="tools.calc"></button>' +
      '</form>' +
      '<motion class="tool-result" id="result-margin"></div>' +
    '</div>';

  panels.innerHTML = panels.innerHTML.split('motion').join('div');

  bindToolForms();
  if (typeof setLanguage === 'function') setLanguage(currentLang);
}

function val(id) { return parseFloat(document.getElementById(id).value); }

function bindToolForms() {
  document.getElementById('form-position').addEventListener('submit', function(e) {
    e.preventDefault();
    var r = calcPositionSize(val('pos-balance'), val('pos-risk'), val('pos-sl'), document.getElementById('pos-pair').value);
    document.getElementById('result-position').innerHTML =
      '<span class="result-highlight">' + r.lots + '</span> lots | Risk: $' + r.riskAmount.toFixed(2) + ' | Pip: $' + r.pipValue;
  });

  document.getElementById('form-pip').addEventListener('submit', function(e) {
    e.preventDefault();
    var v = calcPipValue(document.getElementById('pip-pair').value, val('pip-lots'));
    document.getElementById('result-pip').innerHTML = '<span class="result-highlight">$' + v + '</span> / pip';
  });

  document.getElementById('form-rr').addEventListener('submit', function(e) {
    e.preventDefault();
    var r = calcRiskReward(val('rr-entry'), val('rr-sl'), val('rr-tp'));
    document.getElementById('result-rr').innerHTML =
      '<span class="result-highlight result-good">1:' + r.rr + '</span> | Risk: ' + r.riskPips + ' pips | Reward: ' + r.rewardPips + ' pips';
  });

  document.getElementById('form-fib').addEventListener('submit', function(e) {
    e.preventDefault();
    var levels = calcFibonacci(val('fib-high'), val('fib-low'), document.getElementById('fib-dir').value);
    document.getElementById('result-fib').innerHTML = levels.map(function(l) {
      return '<div><strong>' + l.level + '</strong> → ' + l.price + '</div>';
    }).join('');
  });

  document.getElementById('form-margin').addEventListener('submit', function(e) {
    e.preventDefault();
    var m = calcMargin(val('margin-lots'), document.getElementById('margin-pair').value, val('margin-leverage'), val('margin-price'));
    document.getElementById('result-margin').innerHTML = '<span class="result-highlight">$' + m + '</span> margin';
  });
}

function initToolTabs() {
  document.querySelectorAll('.tools-tabs .tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tools-tabs .tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.tool-panel').forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  buildToolPanels();
  initToolTabs();
});

document.addEventListener('langchange', function() {
  document.querySelectorAll('#toolPanels [data-i18n]').forEach(function(el) {
    if (typeof t === 'function') el.textContent = t(el.getAttribute('data-i18n'));
  });
});
