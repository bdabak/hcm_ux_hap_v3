sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";
  var E = Control.extend("hcm.ux.hapv3.control.SmodCalibrationGridHeader", {
    metadata: {
      properties: {
        title: {
          type: "string",
          bindable: true,
        },
      },
      aggregations: {},
      events: {},
    },
    init: function () {},
    renderer: function (oRM, oControl) {
      var sTitle = oControl.getTitle();
      oRM.write("<div"); // <Div 1 begin>
      oRM.writeControlData(oControl);
      oRM.addClass("scg-grid-header-wrapper");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("<div"); // <Div 2 begin>
      oRM.addClass("scg-grid-header");
      oRM.writeClasses();
      oRM.write(">");
      oRM.writeEscaped(sTitle);
      oRM.write("</div>"); // </Div 2 end >
      oRM.write("</div>"); // </Div 1 end >
    },
  });

  E.prototype.ontap = function (e) {};

  return E;
});
