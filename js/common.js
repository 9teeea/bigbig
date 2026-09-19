/* ===== 公共脚本：统一数据加载 / 离线提示 / 导航高亮 ===== */

// 统一数据加载：所有页面都从 data/dishes.json 取数
// 支持 ?demo=error（模拟网络失败）和 ?demo=empty（模拟空数据）
async function loadCanteenData() {
  const demo = new URLSearchParams(location.search).get('demo');
  if (demo === 'error') {
    // 故意制造失败，用于测试错误提示
    throw new Error('演示模式：模拟网络失败');
  }
  const res = await fetch('data/dishes.json');
  if (!res.ok) {
    throw new Error('数据请求失败（HTTP ' + res.status + '）');
  }
  const data = await res.json();
  if (demo === 'empty') {
    // 模拟空数据，用于测试空状态
    return $.extend({}, data, { dishes: [], weekVisits: [] });
  }
  return data;
}

// 业务数据加载：优先使用管理页保存到 localStorage 的菜品，
// 没有本地修改时用 JSON 原始数据，实现"管理 → 浏览/看板"的数据联动
async function getCanteenData() {
  const data = await loadCanteenData();
  const local = localStorage.getItem('cf_dishes');
  if (local) {
    try {
      data.dishes = JSON.parse(local);
    } catch (e) {
      // 本地数据损坏时清除并回退到 JSON
      localStorage.removeItem('cf_dishes');
    }
  }
  return data;
}

// 显示/隐藏全局状态提示条（用法：showStatus('xxx','danger')）
function showStatus(msg, type) {
  const el = $('#status-tip');
  if (!el.length) return;
  el.removeClass('d-none alert-danger alert-warning alert-success')
    .addClass(type === 'error' ? 'alert-danger' : type === 'success' ? 'alert-success' : 'alert-warning')
    .text(msg)
    .show();
}
function hideStatus() {
  $('#status-tip').addClass('d-none').hide();
}

$(function () {
  // 导航高亮：根据当前文件名匹配
  const page = location.pathname.split('/').pop() || 'index.html';
  $('.cf-nav .nav-link').each(function () {
    if ($(this).attr('href') === page) $(this).addClass('active');
  });

  // 断网提示
  const $offline = $('#offline-tip');
  function updateOnline() {
    $offline.toggleClass('d-none', navigator.onLine);
  }
  $(window).on('online offline', updateOnline);
  updateOnline();
});
