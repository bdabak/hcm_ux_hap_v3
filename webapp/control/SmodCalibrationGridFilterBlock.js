sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";
  var E = Control.extend(
    "hcm.ux.hapv2.1.control.SmodCalibrationGridFilterBlock",
    {
      metadata: {
        properties: {
          filterData: {
            type: "object",
            bindable: true,
          },
        },
        aggregations: {
          filterItem: {
            type: "sap.ui.core.Control",
            multiple: false,
          },
        },
        events: {
          filterChanged: {
            parameters: {
              filterData: {
                type: "object",
              },
            },
          },
        },
      },
      init: function () {},
      renderer: function (oRM, oControl) {
        var oFilterData = oControl.getFilterData();

        oRM.write("<div"); // <Div 1 begin>
        oRM.writeControlData(oControl);
        oRM.addClass("scg-grid-filter-block");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<h4"); // <h4 begin>
        oRM.addClass("scg-grid-filter-block-header");
        oRM.writeClasses();
        oRM.write(">");
        oRM.writeEscaped(oFilterData.filterLabel);
        oRM.write("</h4>"); // </h4 end>

        // var oFB = new sap.m.FlexBox({
        // 	direction: "Column"
        // }).addStyleClass("scg-grid-filter-block-content");
        // $.each(oFilterData.filterValues, function (sValueIndex, oFilterValue) {
        // 	oFB.addItem(new sap.m.CheckBox({
        // 		selected: oFilterValue.Selected,
        // 		text: oFilterValue.Text + " (" + oFilterValue.Count + ")",
        // 		select: function () {
        // 			oControl.fireFilterChanged({
        // 				filterData: oFilterValue
        // 			});
        // 			//console.log(oFilterValue.Seqno, oFilterValue.FilterField, oFilterValue.Value);
        // 		}
        // 	}));
        // });

        oRM.renderControl(oControl.getFilterItem());

        oRM.write("</div>"); // </Div 1 end >
      },
    }
  );

  E.prototype.ontap = function (e) {
    if ($(e.target).hasClass("scg-grid-filter-block-header")) {
      if ($(e.target).hasClass("closed")) {
        $(e.target).removeClass("closed");
        $(e.target).siblings().removeClass("closed");
      } else {
        $(e.target).addClass("closed");
        $(e.target).siblings().addClass("closed");
      }
    }
  };

  return E;
});
