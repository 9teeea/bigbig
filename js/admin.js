/* ===== 菜品管理页：添加 / 修改 / 删除（localStorage 持久化） ===== */
$(function () {
  var dishes = [];
  var canteens = [];
  var modal = new bootstrap.Modal(document.getElementById('dish-modal'));
  var editingId = null; // null=新增，数字=编辑中

  function save() {
    localStorage.setItem('cf_dishes', JSON.stringify(dishes));
  }

  function renderTable() {
    $('#dish-total').text(dishes.length);
    if (dishes.length === 0) {
      $('#dish-tbody').html('<tr><td colspan="10" class="empty-tip">暂无菜品，点击"添加菜品"开始维护</td></tr>');
      return;
    }
    $('#dish-tbody').html(dishes.map(function (d) {
      return '<tr>' +
        '<td>' + d.id + '</td>' +
        '<td>' + $('<div>').text(d.name).html() + '</td>' +
        '<td>' + $('<div>').text(d.canteen).html() + '</td>' +
        '<td>' + $('<div>').text(d.window).html() + '</td>' +
        '<td><span class="dish-tag">' + d.category + '</span></td>' +
        '<td>¥' + d.price.toFixed(1) + '</td>' +
        '<td>★ ' + d.rating + '</td>' +
        '<td>' + d.monthlySales + '</td>' +
        '<td>' + d.stock + '</td>' +
        '<td>' +
          '<button class="btn btn-outline-primary btn-sm btn-edit" data-id="' + d.id + '">修改</button> ' +
          '<button class="btn btn-outline-danger btn-sm btn-del" data-id="' + d.id + '">删除</button>' +
        '</td></tr>';
    }).join(''));
  }

  // 打开模态框（新增或编辑）
  function openModal(d) {
    $('#form-error').text('');
    editingId = d ? d.id : null;
    $('#modal-title').text(d ? '修改菜品（ID ' + d.id + '）' : '添加菜品');
    $('#f-id').val(d ? d.id : '');
    $('#f-name').val(d ? d.name : '');
    $('#f-canteen').val(d ? d.canteen : canteens[0].name);
    $('#f-window').val(d ? d.window : '');
    $('#f-category').val(d ? d.category : '荤菜');
    $('#f-tags').val(d ? (d.tags || []).join(',') : '');
    $('#f-price').val(d ? d.price : '');
    $('#f-rating').val(d ? d.rating : '');
    $('#f-stock').val(d ? d.stock : '');
    $('#f-calorie').val(d ? d.calorie : '');
    modal.show();
  }

  // 表单校验并保存
  $('#dish-form').on('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name').val().trim();
    var windowName = $('#f-window').val().trim();
    var price = parseFloat($('#f-price').val());
    var rating = parseFloat($('#f-rating').val());
    var stock = parseInt($('#f-stock').val(), 10);
    var calorieVal = $('#f-calorie').val();
    var calorie = calorieVal === '' ? 0 : parseInt(calorieVal, 10);
    var tags = $('#f-tags').val().split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean);

    // 校验：非空 + 范围
    if (!name) { $('#form-error').text('菜名不能为空'); return; }
    if (!windowName) { $('#form-error').text('窗口名称不能为空'); return; }
    if (isNaN(price) || price <= 0 || price > 100) { $('#form-error').text('价格必须在 0.1 ~ 100 元之间'); return; }
    if (isNaN(rating) || rating < 0 || rating > 5) { $('#form-error').text('评分必须在 0 ~ 5 分之间'); return; }
    if (isNaN(stock) || stock < 0 || stock > 9999) { $('#form-error').text('库存必须是 0 ~ 9999 的整数'); return; }

    if (editingId === null) {
      // 新增：生成新 id（现有最大 id + 1）
      var newId = dishes.length ? Math.max.apply(null, dishes.map(function (d) { return d.id; })) + 1 : 1;
      dishes.push({
        id: newId, name: name, canteen: $('#f-canteen').val(), window: windowName,
        category: $('#f-category').val(), price: price, rating: rating, calorie: calorie,
        monthlySales: 0, stock: stock, tags: tags
      });
      showStatus('已添加菜品：' + name, 'success');
    } else {
      // 修改：按 id 找到原记录，覆盖可编辑字段（保留月销量）
      var target = dishes.find(function (d) { return d.id === editingId; });
      if (target) {
        target.name = name;
        target.canteen = $('#f-canteen').val();
        target.window = windowName;
        target.category = $('#f-category').val();
        target.price = price;
        target.rating = rating;
        target.calorie = calorie;
        target.stock = stock;
        target.tags = tags;
      }
      showStatus('已修改菜品：' + name, 'success');
    }
    save();
    renderTable();
    modal.hide();
  });

  // 添加按钮
  $('#btn-add').on('click', function () { openModal(null); });

  // 修改 / 删除：事件委托
  $('#dish-tbody').on('click', '.btn-edit', function () {
    var d = dishes.find(function (x) { return x.id === $(this).data('id'); }.bind(this));
    openModal(d);
  }).on('click', '.btn-del', function () {
    var id = $(this).data('id');
    var d = dishes.find(function (x) { return x.id === id; });
    if (!d) return;
    if (confirm('确定要删除「' + d.name + '」吗？删除后浏览页和看板将同步更新。')) {
      dishes = dishes.filter(function (x) { return x.id !== id; });
      save();
      renderTable();
      showStatus('已删除菜品：' + d.name, 'success');
    }
  });

  // 恢复原始数据：清除本地修改，重新从 JSON 加载
  $('#btn-reset').on('click', function () {
    if (!confirm('确定恢复为 JSON 原始数据吗？你在本地做的全部增删改将丢失。')) return;
    localStorage.removeItem('cf_dishes');
    location.reload();
  });

  // 初始化：加载数据
  getCanteenData().then(function (data) {
    hideStatus();
    dishes = data.dishes;
    canteens = data.canteens;
    $('#f-canteen').html(canteens.map(function (c) {
      return '<option>' + $('<div>').text(c.name).html() + '</option>';
    }).join(''));
    renderTable();
  }).catch(function (err) {
    showStatus('数据加载失败：' + err.message + '。请确认通过本地服务器访问（不要直接双击 HTML）。', 'error');
  });
});
