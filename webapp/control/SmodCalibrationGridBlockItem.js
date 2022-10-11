sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";
  var E = Control.extend(
    "hcm.ux.hapv2_1.control.SmodCalibrationGridBlockItem",
    {
      metadata: {
        properties: {
          itemData: {
            type: "object",
            bindable: true,
          },
        },

        events: {
          itemSelected: {
            parameters: {
              itemData: {
                type: "object",
              },
            },
          },
        },
      },
      init: function () {},

      onAfterRendering: function () {
        var t = this;
        $("#" + t.sImageId).on("load", function () {
          $("#" + t.sLoaderId).hide();
          $(this).css({
            visibility: "visible",
            opacity: "1",
          });
        });
      },

      ondragstart: function (oEvent) {
        var aBlocks = this.getParent().getParent().getBlockList();
        var oGrid = this.getParent().getParent();
        var oParent = this.getParent();
        var oUnfinished = null;
        var sBlockKey = oParent.getBlockKey();
        var aDZ = [];

        if (oParent.getBlockKey() === "") {
          return false;
        }

        if ($(oEvent.target).hasClass("scg-grid-block-item")) {
          oGrid.data("draggedItem", this);
          oGrid.data("droppableItems", aDZ);
          if (this.getItemData().isDraggable) {
            $.each(aBlocks, function (sIndex, oBlock) {
              if (oBlock.getBlockKey() === "") {
                oUnfinished = oBlock;
                return false;
              }
            });
            switch (sBlockKey) {
              case "A":
                aDZ.push("B");
                break;
              case "B":
                aDZ.push("A");
                aDZ.push("C");
                break;
              case "C":
                aDZ.push("B");
                aDZ.push("D");
                break;
              case "D":
                aDZ.push("C");
                aDZ.push("E");
                break;
              case "E":
                aDZ.push("D");
                break;
              default:
            }

            $.each(aBlocks, function (sIndex, oBlock) {
              var sCurrentBlockKey = oBlock.getBlockKey();
              if (aDZ.indexOf(sCurrentBlockKey) !== -1) {
                $(
                  $("#" + oBlock.getId()).find(".scg-grid-block-content")[0]
                ).addClass("scg-grid-dropzone");
              }
            });
            // if (oUnfinished) {
            // 	$(".scg-grid-block-content")
            // 		.not($("#" + oParent.getId()).find(".scg-grid-block-content")[0])
            // 		.not($("#" + oUnfinished.getId()).find(".scg-grid-block-content")[0])
            // 		.addClass("scg-grid-dropzone");
            // } else {
            // 	$(".scg-grid-block-content")
            // 		.not($("#" + oParent.getId()).find(".scg-grid-block-content")[0])
            // 		.addClass("scg-grid-dropzone");
            // }
            oEvent.dataTransfer.setData("text", oEvent.target.id);
          }
        }
      },

      renderer: function (oRM, oControl) {
        var oItem = oControl.getItemData();
        oControl.sImageId = oControl.getId() + "-image-content";
        oControl.sLoaderId = oControl.getId() + "-image-loader";
        oRM.write("<div"); // <Div 1 begin>
        oRM.writeControlData(oControl);
        oRM.addClass("scg-grid-block-item");
        oRM.writeClasses();
        oRM.writeAttributeEscaped("draggable", true);
        oRM.write(">");

        oRM.write("<div"); // <Div 2 begin>
        oRM.addClass("scg-grid-block-item-content");
        oRM.writeClasses();
        oRM.write(">");

        oRM.write("<div"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-item-content-image");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div id='" + oControl.sLoaderId + "'"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-item-content-image-loader");
        oRM.writeClasses();
        oRM.write("></div>");
        oRM.write("<img");
        oRM.writeAttributeEscaped("src", oItem.imagePath);
        oRM.writeAttributeEscaped("id", oControl.sImageId);
        oRM.addClass("scg-grid-block-item-content-image-content");
        oRM.writeClasses();
        oRM.write("/>");

        oRM.write("</div>"); // </Div 3 end>
        oRM.write("<div"); // <Div 6 begin>
        oRM.addClass("scg-grid-block-item-content-right");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // <Div 4 begin>
        oRM.addClass("scg-grid-block-item-content-title");
        oRM.writeClasses();
        oRM.write(">");
        oRM.writeEscaped(oItem.title);
        oRM.write("</div>"); // </Div 4 end>
        oRM.write("<div"); // <Div 5 begin>
        oRM.addClass("scg-grid-block-item-content-subtitle");
        oRM.writeClasses();
        oRM.write(">");
        oRM.writeEscaped(oItem.subtitle);
        oRM.write("</div>"); // </Div 6 end>

        oRM.write("</div>"); // </Div 5 end>
        /*box*/
        oRM.write("<div"); // <Div 5 begin>
        oRM.addClass("scg-grid-block-item-content-status");
        oRM.addClass("scg-grid-block-item-content-status-" + oItem.status);
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("</div>"); // </Div 6 end>
        /*box*/
        oRM.write("</div>"); // </Div 2 end>
        oRM.write("</div>"); // </Div 1 end>
      },
    }
  );

  E.prototype.ontap = function (e) {
    var t = this;
    this.fireItemSelected({
      itemData: t.getItemData(),
    });
  };

  return E;
});
