const query = document.querySelector('#query');
const region = document.querySelector('#region');
const category = document.querySelector('#category');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const categories = {
  cafe: '咖啡茶饮', fastfood: '快餐', restaurant: '餐厅', hotel: '酒店',
  airport: '机场', transit: '交通', mall: '商场', public: '公共设施',
  coworking: '联合办公', leisure: '景区与文娱', other: '其他',
};
const auth = { password: '密码', portal: '网页认证', sms: '短信验证', open: '开放网络', unknown: '连接方式待确认' };
const names = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
const regionName = code => code === 'GLOBAL' ? '全球' : /^[A-Z]{2}$/.test(code) ? names.of(code) : code;

function addText(parent, tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  parent.append(element);
  return element;
}

function renderCard(record) {
  const card = document.createElement('article');
  addText(card, 'h2', record.brandZh || record.brand);
  const city = record.city && record.city !== '*' ? record.city : '';
  addText(card, 'p', [
    record.brandZh && record.brandZh !== record.brand ? record.brand : '',
    regionName(record.region), city, auth[record.auth] ?? record.auth,
  ].filter(Boolean).join(' · '), 'meta');
  if (record.address) addText(card, 'p', record.address, 'meta');
  addText(addText(card, 'p', 'SSID  '), 'code', record.ssid.join(' / ') || '待确认');
  if (record.password) {
    const line = addText(card, 'p', '密码  ');
    addText(line, 'code', record.password);
    line.append(' ');
    const copy = addText(line, 'button', '复制');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(record.password);
        copy.textContent = '已复制';
      } catch {
        copy.textContent = '请手动复制';
      }
    });
  }
  if (record.tips) addText(card, 'p', record.tips, 'tips');
  if (record.source?.startsWith('https://')) {
    const details = addText(card, 'p', '', 'meta');
    const source = addText(details, 'a', record.sourceLabel || '官方来源');
    source.href = record.source;
    if (record.updated) details.append(' · 核验于 ' + record.updated);
  }
  return card;
}

async function init() {
  const response = await fetch('data.json');
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const records = await response.json();
  for (const [select, field, label] of [
    [region, 'region', regionName],
    [category, 'category', code => categories[code] ?? code],
  ]) {
    for (const value of new Set(records.map(record => record[field]))) {
      select.add(new Option(label(value), value));
    }
  }

  function render() {
    const keyword = query.value.trim().toLowerCase();
    const matches = records.filter(record =>
      (!region.value || record.region === region.value) &&
      (!category.value || record.category === category.value) &&
      [record.brand, record.brandZh, record.city, record.address, record.password, ...record.ssid]
        .some(value => String(value ?? '').toLowerCase().includes(keyword)),
    );
    status.textContent = matches.length
      ? '显示 ' + matches.length + ' / ' + records.length + ' 条记录'
      : '没有匹配的 Wi-Fi 记录';
    results.replaceChildren(...matches.map(renderCard));
  }

  query.addEventListener('input', render);
  region.addEventListener('change', render);
  category.addEventListener('change', render);
  render();
}

init().catch(() => {
  status.textContent = 'Wi-Fi 数据加载失败，请刷新重试。';
});
