sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";
  var E = Control.extend("hcm.ux.hapv3.control.SmodCalibrationGridFilter", {
    metadata: {
      properties: {},
      aggregations: {
        filterBlocks: {
          type: "hcm.ux.hapv3.control.SmodCalibrationGridFilterBlock",
          multiple: true,
          singularName: "filterBlock",
        },
      },
      events: {},
    },
    init: function () {},
    renderer: function (oRM, oControl) {
      oRM.write("<div"); // <Div 1 begin>
      oRM.writeControlData(oControl);
      oRM.addClass("scg-grid-filter-container");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("<div"); // <Div 2 begin>
      oRM.addClass("scg-grid-filter");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("<span>Filtrele</span>");
      oRM.write("<form>");
      $.each(oControl.getFilterBlocks(), function (sIndex, oFilterBlock) {
        oRM.renderControl(oFilterBlock);
      });
      oRM.write("</form>");

      oRM.write("<a"); // <a 1 begin>
      oRM.addClass("scg-grid-filter-close");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("</a>"); // </a 2 end >
      oRM.write("</div>"); // </Div 2 end >
      oRM.write("<a"); // <a 1 begin>
      oRM.addClass("scg-grid-filter-trigger");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("</a>"); // </a 2 end >
      oRM.write("<div"); // <Div 3 begin>
      oRM.addClass("scg-grid-filter-cover");
      oRM.writeClasses();
      oRM.write(">");
      oRM.write("</div>"); //</Div 3 end >

      oRM.write("</div>"); // </Div 1 end >
    },
  });

  E.prototype.ontap = function (e) {
    if ($(e.target).hasClass("scg-grid-filter-trigger")) {
      $(
        ".scg-grid-filter-trigger, .scg-grid-filter, .scg-grid-filter-cover, .scg-grid-block-container, .scg-grid-graph-container, .scg-grid-header-wrapper"
      ).addClass("filter-is-visible");
    }

    if (
      $(e.target).hasClass("scg-grid-filter-close") ||
      $(e.target).hasClass("scg-grid-filter-cover")
    ) {
      $(
        ".scg-grid-filter-trigger, .scg-grid-filter, .scg-grid-filter-cover, .scg-grid-block-container, .scg-grid-graph-container, .scg-grid-header-wrapper"
      ).removeClass("filter-is-visible");
    }
  };

  return E;
});
