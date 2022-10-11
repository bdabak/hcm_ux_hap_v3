sap.ui.define(
  [
    "sap/ui/core/Control",
    "hcm/ux/hapv2_1/control/SmodCalibrationGridBlock",
    "hcm/ux/hapv2_1/control/SmodCalibrationGridHeader",
    "hcm/ux/hapv2_1/control/SmodCalibrationGridFilter",
    "hcm/ux/hapv2_1/control/SmodCalibrationGridFilterBlock",
    "sap/ui/core/dnd/DragDropInfo",
  ],
  function (
    Control,
    GridBlock,
    GridHeader,
    GridFilter,
    GridFilterBlock,
    DragDropInfo
  ) {
    "use strict";
    var E = Control.extend("hcm.ux.hapv2_1.control.SmodCalibrationGrid", {
      metadata: {
        properties: {
          gridTitle: {
            type: "string",
            bindable: true,
          },
        },
        aggregations: {
          blockList: {
            type: "hcm.ux.hapv2_1.control.SmodCalibrationGridBlock",
            multiple: true,
            singularName: "block",
          },
          filterBar: {
            type: "hcm.ux.hapv2_1.control.SmodCalibrationGridFilter",
            multiple: false,
          },
          graph: {
            type: "sap.ui.core.Control",
            multiple: false,
          },
          footer: {
            type: "sap.ui.core.Control",
            multiple: false,
          },
        },
        events: {
          dragdrop: {
            parameters: {
              draggedItem: {
                type: "object",
              },
              targetBlock: {
                type: "object",
              },
            },
          },
        },
      },
      init: function () {
        var libraryPath = jQuery.sap.getModulePath("hcm.ux.hapv2_1"); //get the server location of the ui library
        jQuery.sap.includeStyleSheet(
          libraryPath + "/control/SmodCalibrationGrid.css"
        );
      },

      // onDragStart: function (oEvent) {
      // 	console.log(oEvent);
      // },
      // onDrop: function (oEvent) {
      // 	console.log(oEvent);
      // },

      // onAfterRendering: function () {
      // 	var aBlocks = this.getBlockList();
      // 	var oThis = this;
      // 	var aDragDropInfo = [];
      // 	if (aBlocks.length > 0) {
      // 		$.each(aBlocks, function (sInd2, oBlock) {
      // 			aDragDropInfo.push(
      // 				new DragDropInfo({
      // 					sourceAggregation: "itemList",
      // 					targetAggregation: "itemList",
      // 					targetElement: oBlock.getId(),
      // 					dropPosition: "On",
      // 					dragStart: oThis.onDragStart.bind(oThis),
      // 					drop: oThis.onDrop.bind(oThis)
      // 				})
      // 			);
      // 		});

      // 		$.each(aBlocks, function (sInd1, oBlock) {
      // 			$.each(aDragDropInfo, function (sInd3, oDD) {
      // 				oBlock.addDragDropConfig(oDD);
      // 			});
      // 		});
      // 	}
      // },

      renderer: function (oRM, oControl) {
        var aBlocks = oControl.getBlockList();
        oRM.write("<div"); // <Div 1 begin>
        oRM.writeControlData(oControl);
        oRM.addClass("scg-grid");
        oRM.writeClasses();
        oRM.write(">");
        oRM.renderControl(
          new GridHeader({
            title: oControl.getGridTitle(),
          })
        );
        oRM.write("<div"); // <Div 2 begin>
        oRM.addClass("scg-grid-block-container");
        if (oControl.getGraph()) {
          oRM.addClass("scg-graph-visible");
        }
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); //Block begin
        oRM.addClass("scg-grid-blocks");
        oRM.writeClasses();
        oRM.write(">");
        $.each(aBlocks, function (sIndex, oBlock) {
          oRM.renderControl(oBlock);
        });

        oRM.write("</div>"); //Block end
        oRM.write("<div"); // Legend Begin
        oRM.addClass("scg-grid-block-legend");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // Legend Row Begin
        oRM.addClass("scg-grid-block-legend-row");
        oRM.writeClasses();
        oRM.write(">");

        oRM.write("<div"); // Legend cell Begin
        oRM.addClass("scg-grid-block-legend-cell");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-item-content-status");
        oRM.addClass("scg-grid-block-item-content-status-red");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write(
          "</div><span>Bir önceki sürecin tamamlanması bekleniyor</span>"
        ); // </Div 3 end >
        oRM.write("</div>");

        oRM.write("<div"); // Legend cell Begin
        oRM.addClass("scg-grid-block-legend-cell");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-item-content-status");
        oRM.addClass("scg-grid-block-item-content-status-orange");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("</div><span>İşlem yapılması bekleniyor</span>"); // </Div 3 end >
        oRM.write("</div>");

        oRM.write("<div"); // Legend cell Begin
        oRM.addClass("scg-grid-block-legend-cell");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-item-content-status");
        oRM.addClass("scg-grid-block-item-content-status-green");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("</div><span>Süreç tamamlandı</span>"); // </Div 3 end >
        oRM.write("</div>");

        oRM.write("</div></div>"); // Legend End
        oRM.write("</div>"); // </Div 2 end >

        if (oControl.getGraph()) {
          oRM.write("<div"); // <Div 2 begin>
          oRM.addClass("scg-grid-graph-container");
          oRM.writeClasses();
          oRM.write(">");
          oRM.renderControl(oControl.getGraph());
          oRM.write("</div>");
        } // </Div 2 end >

        if (oControl.getFilterBar()) {
          oRM.renderControl(oControl.getFilterBar());
        }
        if (oControl.getGraph()) {
          oRM.write("<a"); // <a 1 begin>
          oRM.addClass("scg-grid-graph-toggler");
          oRM.writeClasses();
          oRM.write(">");
          oRM.write("</a>"); // </a 2 end >
        }
        oRM.write("</div>"); // </Div 1 end >
      },
    });

    E.prototype.ontap = function (e) {
      if ($(e.target).hasClass("scg-grid-graph-toggler")) {
        $(".scg-grid-block-container").toggleClass("scg-graph-visible");
        $(".scg-grid-block-legend").toggleClass("scg-graph-visible");
        $(".scg-grid-graph-container").toggleClass("scg-graph-not-visible");
      }
    };

    return E;
  }
);
