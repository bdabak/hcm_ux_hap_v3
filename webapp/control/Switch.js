sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv3.control.Switch", {
    metadata: {
      properties: {},
      aggregations: {
        switch: {
          type: "sap.m.Switch",
          multiple: false,
          singularName: "switch",
        },
        popover: {
          type: "sap.m.Popover",
          multiple: false,
          singularName: "popover",
        },
      },
    },
    init: function () {
      this.addStyleClass("hap-switch");
    },

    renderer: function (oRM, oControl) {
      oRM.write("<div");
      oRM.writeControlData(oControl);
      oRM.writeClasses(oControl);
      oRM.writeStyles(oControl);
      oRM.write(">");
      oRM.renderControl(oControl.getAggregation("switch"));
      oRM.write("</div>");
    },

    onmouseover: function (e) {
      const popOver = this.getAggregation("popover");
      popOver.openBy(this.getAggregation("switch"));
    },

    onmouseout: function (e) {
      if (!this.getDomRef().contains(e.toElement)) {
        const popOver = this.getAggregation("popover");
        popOver.close();
      }
    },
  });
});
