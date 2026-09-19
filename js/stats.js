/* ===== 数据看板：ECharts 柱状图 + Chart.js 环形图 + ECharts 折线图 ===== */
$(function () {
  var barChart = null;
  var lineChart = null;
  var doughnut = null;

  // 指标卡片
  function renderCards(data) {
    var dishes = data.dishes;
    var totalSales = dishes.reduce(function (s, d) { return s + d.monthlySales; }, 0);
    var avgPrice = (dishes.reduce(function (s, d) { return s + d.price; }, 0) / dishes.length).toFixed(1);
    var avgRating = (dishes.reduce(function (s, d) { return s + d.rating; }, 0) / dishes.length).toFixed(1);
    var weekTotal = data.weekVisits.reduce(function (s, d) { return s + d.visits; }, 0);

    var cards = [
      { label: '在售菜品', value: dishes.length + ' 道' },
      { label: '月总销量', value: totalSales.toLocaleString() + ' 份' },
      { label: '菜品均价', value: '¥' + avgPrice },
      { label: '平均评分', value: avgRating + ' 分' },
      { label: '本周就餐', value: weekTotal.toLocaleString() + ' 人次' },
      { label: '最高单价', value: '¥' + Math.max.apply(null, dishes.map(function (d) { return d.price; })).toFixed(1) }
    ];
    $('#stat-cards').html(cards.map(function (c) {
      return '<div class="col-6 col-md-4 col-lg-2"><div class="card cf-card cf-stat h-100"><div class="card-body text-center">' +
        '<p class="text-muted small mb-1">' + c.label + '</p><p class="num mb-0" style="font-size:1.4rem;">' + c.value + '</p>' +
        '</div></div></div>';
    }).join(''));
  }

  // ECharts 柱状图：各食堂月销量（按食堂聚合）
  function renderBar(data) {
    var map = {};
    data.canteens.forEach(function (c) { map[c.name] = 0; });
    data.dishes.forEach(function (d) {
      if (map[d.canteen] !== undefined) map[d.canteen] += d.monthlySales;
    });
    var names = Object.keys(map);
    var values = names.map(function (n) { return map[n]; });

    barChart = echarts.init(document.getElementById('bar-chart'));
    barChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 60, right: 20, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: names, axisLabel: { fontSize: 12 } },
      yAxis: { type: 'value', name: '份/月' },
      series: [{
        type: 'bar', data: values, barWidth: '45%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f08c00' }, { offset: 1, color: '#d9480f' }
          ])
        },
        label: { show: true, position: 'top', fontSize: 11 }
      }]
    });
  }

  // Chart.js 环形图：品类销量占比（按品类聚合）
  function renderDoughnut(data) {
    var map = {};
    data.dishes.forEach(function (d) {
      map[d.category] = (map[d.category] || 0) + d.monthlySales;
    });
    var labels = Object.keys(map);
    var values = labels.map(function (k) { return map[k]; });
    var colors = ['#e8590c', '#f08c00', '#fcc419', '#94d82d', '#38d9a9', '#4dabf7'];

    if (doughnut) doughnut.destroy();
    doughnut = new Chart(document.getElementById('doughnut-chart'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = (ctx.parsed / total * 100).toFixed(1);
                return ctx.label + '：' + ctx.parsed + ' 份（' + pct + '%）';
              }
            }
          }
        }
      }
    });
  }

  // ECharts 折线图：一周就餐人次
  function renderLine(data) {
    lineChart = echarts.init(document.getElementById('line-chart'));
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 30, top: 30, bottom: 40 },
      xAxis: { type: 'category', data: data.weekVisits.map(function (d) { return d.day; }), boundaryGap: false },
      yAxis: { type: 'value', name: '人次' },
      series: [{
        name: '就餐人次',
        type: 'line',
        smooth: true,
        data: data.weekVisits.map(function (d) { return d.visits; }),
        lineStyle: { width: 3, color: '#e8590c' },
        itemStyle: { color: '#d9480f' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(232,89,12,.35)' }, { offset: 1, color: 'rgba(232,89,12,.02)' }
          ])
        },
        markPoint: {
          data: [{ type: 'max', name: '峰值' }, { type: 'min', name: '低谷' }]
        }
      }]
    });
  }

  // 加载并渲染
  getCanteenData().then(function (data) {
    if (!data.dishes.length || !data.weekVisits.length) {
      showStatus('暂无统计数据', 'warning');
      return;
    }
    hideStatus();
    $('#data-source').text('数据来源：' + data.source + '（管理页修改菜品后，本页数据同步更新）');
    renderCards(data);
    renderBar(data);
    renderDoughnut(data);
    renderLine(data);
  }).catch(function (err) {
    showStatus('看板数据加载失败：' + err.message + '。请确认通过本地服务器访问（不要直接双击 HTML）。', 'error');
  });

  // 响应式
  $(window).on('resize', function () {
    if (barChart) barChart.resize();
    if (lineChart) lineChart.resize();
  });
});
