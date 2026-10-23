// Shim de compatibilidade para ChartLib
var ChartLib = {
  render: function(canvasEl) {},
  update: function(chart, data) { if (chart && chart.data) { chart.data.datasets[0].data = data; chart.update(); } },
  destroy: function(chart) { if (chart) chart.destroy(); }
};
