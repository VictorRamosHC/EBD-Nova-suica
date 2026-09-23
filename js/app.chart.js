// ChartLib — wrapper minimalista para Chart.js
var ChartLib = {
  chartEl: null,
  targetCanvasClass: '.campo-chart',
  render: function(canvasEl) {
    if (!canvasEl) return;
    console.log('[ChartLib] render chamado para:', canvasEl);
  },
  update: function(chart, data) {
    if (!chart) return;
    chart.data.datasets[0].data = data;
    chart.update();
  },
  destroy: function(chart) {
    if (chart) {
      chart.destroy();
    }
  }
};
