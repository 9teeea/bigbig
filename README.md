# 校园食堂信息与数据展示中心

软件开发综合实践 · 期末大作业
学号 202510060366 · 沈芝宇

## 运行方式

必须通过本地 HTTP 服务器访问（直接双击 HTML 会导致 fetch 读取 JSON 被浏览器拦截）：

```bash
# 进入项目目录后，任选一种方式启动
python -m http.server 8080
# 或
npx serve .
```

浏览器打开 http://localhost:8080/ 即可。

## 页面清单

| 页面 | 功能 |
|------|------|
| index.html | 信息首页：本周概览指标、三大食堂介绍、功能入口 |
| menu.html | 菜品浏览：关键字搜索、食堂筛选、品类筛选、价格/评分/销量排序 |
| admin.html | 菜品管理：添加、修改、删除菜品，localStorage 持久化 |
| stats.html | 数据看板：ECharts 柱状图、Chart.js 环形图、ECharts 折线图 |
| canteen-3d.html | Three.js 三维食堂大厅，支持旋转/缩放/点击窗口 |

## 技术栈

- HTML5 语义化标签 + CSS3（媒体查询、Flex/Grid）
- Bootstrap 5（栅格、导航栏、卡片、模态框、表格）
- jQuery 3.7（DOM 操作、事件委托）
- ECharts 5（柱状图、折线图）
- Chart.js 4（环形图）
- Three.js r128 + OrbitControls（三维场景）
- 数据：本地 data/dishes.json + localStorage

## 异常演示参数

- menu.html?demo=error / stats.html?demo=error：模拟数据加载失败
- menu.html?demo=empty / stats.html?demo=empty：模拟空数据
- admin.html 中点"恢复原始数据"可清除本地修改

## 数据来源

data/dishes.json 为按学校食堂常见菜品自建的教学示例数据，weekVisits 为模拟的一周就餐统计。
所有第三方库（Bootstrap、jQuery、ECharts、Chart.js、Three.js）均放在 libs/ 目录，离线可运行。
