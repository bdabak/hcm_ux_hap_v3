sap.ui.define(
  ["sap/ui/core/Control", "hcm/ux/hapv3/control/SmodCalibrationGridBlockItem"],
  function (Control, GridBlockItem) {
    "use strict";
    var E = Control.extend("hcm.ux.hapv3.control.SmodCalibrationGridBlock", {
      metadata: {
        properties: {
          headerText: {
            type: "string",
            bindable: true,
          },
          blockNumber: {
            type: "string",
            bindable: true,
          },
          blockKey: {
            type: "string",
            bindable: true,
          },
        },
        aggregations: {
          itemList: {
            type: "hcm.ux.hapv3.control.SmodCalibrationGridBlockItem",
            multiple: true,
            singularName: "item",
          },
        },
        events: {},
      },
      init: function () {},

      ondragenter: function (oEvent) {
        var oGrid = this.getParent();
        var oDraggedElement = oGrid.data("draggedItem");
        var aDZ = oGrid.data("droppableItems");

        if (!oDraggedElement) {
          return false;
        }

        if (aDZ.indexOf(this.getBlockKey()) === -1) {
          return false;
        }

        if (
          this.getBlockKey() === "" ||
          this.getBlockKey() === oDraggedElement.getParent().getBlockKey()
        ) {
          return false;
        }

        if ($(oEvent.target).hasClass("scg-grid-block-content")) {
          $(oEvent.target).addClass("scg-grid-dropzone-active");
        } else if ($(oEvent.target).hasClass("scg-grid-block")) {
          $(oEvent.target)
            .find(".scg-grid-block-content")
            .addClass("scg-grid-dropzone-active");
        } else if ($(oEvent.target).hasClass("scg-grid-block-header")) {
          $(oEvent.target)
            .parent()
            .find(".scg-grid-block-content")
            .addClass("scg-grid-dropzone-active");
        }
      },

      ondragleave: function (oEvent) {
        $(".scg-grid-block-content").removeClass("scg-grid-dropzone-active");
      },

      ondragover: function (oEvent) {
        oEvent.preventDefault();
      },

      ondragend: function (oEvent) {
        $(".scg-grid-block-content").removeClass("scg-grid-dropzone");
      },

      ondrop: function (oEvent) {
        var t = this;
        var oGrid = this.getParent();
        oEvent.preventDefault();

        var aDZ = oGrid.data("droppableItems");

        if (aDZ.indexOf(this.getBlockKey()) === -1) {
          oGrid.data("draggedItem", null);
          oGrid.data("droppableItems", []);
          return false;
        }

        $(".scg-grid-block-content")
          .removeClass("scg-grid-dropzone")
          .removeClass("scg-grid-dropzone-active");
        if ($(oEvent.target).hasClass("scg-grid-block-content")) {
          //	console.log("Dropped to:", this.getHeaderText());
          //console.log("Dropped to:", oGrid.data("draggedItem"));
          var oDraggedItem = oGrid.data("draggedItem");
          oGrid.fireEvent("dragdrop", {
            draggedItem: oDraggedItem,
            targetBlock: t,
          });

          oGrid.data("draggedItem", null);
          oGrid.data("droppableItems", []);
        }
      },

      renderer: function (oRM, oControl) {
        var aItems = oControl.getItemList();
        var sBlockStyle = oControl.getBlockNumber();
        var sBlockKey = oControl.getBlockKey();
        var sBlockKeyNo = sBlockKey + sBlockStyle;
        //süreci tamamlanmayanlar olursa block renkleri kaymasın
        switch (sBlockKeyNo) {
          case "E0":
          case "D1":
          case "C2":
          case "B3":
          case "A4":
            sBlockStyle++;
            break;
        }
        if (sBlockStyle) {
          sBlockStyle = "scg-grid-block-header-style" + sBlockStyle;
        }
        oRM.write("<div"); // <Div 1 begin>
        oRM.writeControlData(oControl);
        oRM.addClass("scg-grid-block");
        oRM.writeClasses();
        oRM.write(">");
        oRM.write("<div"); // <Div 2 begin>
        oRM.addClass("scg-grid-block-header");
        if (sBlockStyle) oRM.addClass(sBlockStyle);
        oRM.writeClasses();
        oRM.write(">");
        oRM.writeEscaped(oControl.getHeaderText());
        oRM.write("</div>"); // </Div 2 end >
        oRM.write("<div"); // <Div 3 begin>
        oRM.addClass("scg-grid-block-content");
        oRM.writeClasses();
        oRM.write(">");
        $.each(aItems, function (sIndex, oItem) {
          oRM.renderControl(oItem);
        });
        oRM.write("</div>"); // </Div 3 end >
        oRM.write("</div>"); // </Div 1 end >
      },
    });

    E.prototype.ontap = function (e) {};

    return E;
  }
);
