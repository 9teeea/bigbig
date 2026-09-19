/* ===== 菜品浏览页：搜索 + 食堂筛选 + 品类筛选 + 排序 ===== */
$(function () {
  var allDishes = [];
  var canteens = [];
  var keyword = '';
  var currentCanteen = '全部';
  var currentCategory = '全部';
  var currentSort = 'default';

  // 转义 HTML，防止菜名中特殊字符破坏页面
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function render() {
    var list = allDishes.filter(function (d) {
      // 搜索：菜名或窗口名包含关键字
      var matchKw = !keyword || d.name.indexOf(keyword) > -1 || d.window.indexOf(keyword) > -1;
      var matchCanteen = currentCanteen === '全部' || d.canteen === currentCanteen;
      var matchCat = currentCategory === '全部' || d.category === currentCategory;
      return matchKw && matchCanteen && matchCat;
    });

    // 排序
    if (currentSort === 'priceAsc') list.sort(function (a, b) { return a.price - b.price; });
    if (currentSort === 'priceDesc') list.sort(function (a, b) { return b.price - a.price; });
    if (currentSort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
    if (currentSort === 'sales') list.sort(function (a, b) { return b.monthlySales - a.monthlySales; });

    $('#result-count').text('共找到 ' + list.length + ' 道菜');

    if (list.length === 0) {
      $('#dish-grid').html('<div class="col-12"><div class="empty-tip">😕 没有符合条件的菜品，换个关键字或筛选条件试试</div></div>');
      return;
    }

    $('#dish-grid').html(list.map(function (d) {
      var tags = (d.tags || []).map(function (t) {
        var hot = (t === '招牌' || t === '人气') ? ' hot' : '';
        return '<span class="dish-tag' + hot + '">' + esc(t) + '</span>';
      }).join('');
      return '<div class="col-6 col-md-4 col-lg-3">' +
        '<div class="card cf-card dish-card h-100"><div class="card-body">' +
        '<div class="d-flex justify-content-between align-items-start">' +
        '<h5 class="card-title mb-1">' + esc(d.name) + '</h5>' +
        '<span class="price">¥' + d.price.toFixed(1) + '</span></div>' +
        '<p class="small text-muted mb-1">🏪 ' + esc(d.canteen) + ' · ' + esc(d.window) + '</p>' +
        '<p class="small mb-1"><span class="stars">★</span> ' + d.rating +
        ' 分 · 月售 ' + d.monthlySales + ' 份 · ' + d.calorie + ' 千卡</p>' +
        '<div class="mb-0">' + tags + '</div>' +
        '</div></div></div>';
    }).join(''));
  }

  // 加载数据并初始化筛选项
  getCanteenData().then(function (data) {
    hideStatus();
    allDishes = data.dishes;
    canteens = data.canteens;

    if (allDishes.length === 0) {
      showStatus('暂无菜品数据', 'warning');
      $('#dish-grid').html('<div class="col-12"><div class="empty-tip">今天还没有上架菜品</div></div>');
      return;
    }

    // 食堂下拉
    $('#canteen-select').append(canteens.map(function (c) {
      return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    }).join(''));

    // 品类按钮（从数据中动态提取，避免写死）
    var cats = [];
    allDishes.forEach(function (d) { if (cats.indexOf(d.category) === -1) cats.push(d.category); });
    $('#category-filters').append(cats.map(function (c) {
      return '<button class="filter-btn" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    }).join(''));

    render();
  }).catch(function (err) {
    showStatus('菜品数据加载失败：' + err.message + '。请确认通过本地服务器访问（不要直接双击 HTML）。', 'error');
    $('#result-count').text('');
  });

  // 事件绑定
  $('#search-input').on('input', function () {
    keyword = $(this).val().trim();
    render();
  });
  $('#canteen-select').on('change', function () {
    currentCanteen = $(this).val();
    render();
  });
  $('#sort-select').on('change', function () {
    currentSort = $(this).val();
    render();
  });
  $('#category-filters').on('click', '.filter-btn', function () {
    $('#category-filters .filter-btn').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('cat');
    render();
  });
});
