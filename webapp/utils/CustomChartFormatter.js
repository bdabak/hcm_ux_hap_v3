sap.ui.define([
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format'
], function(ChartFormatter, Format) {
	return {
		HAP_NUM_FORMATTER: "__HAP_NUMERIC_WITH_DECIMALS",
		chartFormatter: null,
		registerCustomFormat: function() {
			var chartFormatter = this.chartFormatter = ChartFormatter.getInstance();
			chartFormatter.registerCustomFormatter(this.HAP_NUM_FORMATTER, function(value) {
				var fixedFloat = sap.ui.core.format.NumberFormat.getFloatInstance({
					minFractionDigits: 0,
					maxFractionDigits: 2
				});
				if (fixedFloat.format(value) == 0) {
					return "";
				} else {
					return fixedFloat.format(value) + " Puan";
				}
			});
			Format.numericFormatter(chartFormatter);
		}
	};
});