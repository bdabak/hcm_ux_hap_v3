sap.ui.define(
  ["sap/ui/core/Control", "./SmodRatingItem"],
  function (Control, SmodRatingItem) {
    "use strict";

    return Control.extend("hcm.ux.hapv2_1.control.SmodRatingIndicator", {
      metadata: {
        properties: {
          selectedValue: { type: "string", bindable: true },
          selectedValueText: { type: "string", bindable: true },
          editable: { type: "boolean", bindable: true, defaultValue: true },
          radioName: { type: "string", bindable: false },
          excludedValues: { type: "object", bindable: true },
        },
        aggregations: {
          ratingItems: {
            type: "hcm.ux.hapv2_1.control.SmodRatingItem",
            multiple: true,
            singularName: "ratingItem",
          },
        },
        defaultAggregation: "ratingItems",
        events: {
          change: {},
        },
      },
      init: function () {
        //initialisation code, in this case, ensure css is imported
        var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv2_1"); //get the server location of the ui library
        jQuery.sap.includeStyleSheet(
          sLibraryPath + "/control/SmodRatingIndicator.css"
        );
        // var vRadioName = crypto.randomUUID();
        var vRadioName = _.uniqueId("RIRG_") + new Date().getTime();
        this.setProperty("radioName", vRadioName, true);
      },
      renderer: function (oRM, oControl) {
        var items = oControl.getRatingItems();
        var radioName = oControl.getRadioName();

        var initialValueItem = new SmodRatingItem({
          value: -1,
          valueText: "",
          selected:
            !oControl.getSelectedValue() || oControl.getSelectedValue() === -1,
          hidden: true,
        }).setParent(oControl);

        //Main content begin
        oRM.openStart("div");
        oRM.writeControlData(oControl);
        oRM.class("smod-rating-container");
        oRM.attr("control-id", radioName);
        oRM.openEnd();

        oRM.openStart("div");
        oRM.class("smod-rating-group");
        oRM.openEnd();

        //Add aggregation rating items
        oRM.openStart("div");
        oRM.class("smod-rating-group-items");
        oRM.openEnd();
        items.unshift(initialValueItem);
        items.forEach(function (item) {
          var isSelected = oControl.getSelectedValue() === item.getValue();

          item.setSelected(isSelected);
          if (isSelected) oControl.setSelectedValueText(item.getValueText());
          oRM.renderControl(item);
        });
        oRM.close("div"); //Rating group end
        oRM.openStart("div");
        oRM.class("smod-rating-value-text");
        if (oControl.getSelectedValueText()) {
          oRM.class("show");
        }
        oRM.openEnd();
        oRM.text(oControl.getSelectedValueText());
        oRM.close("div"); //Rating group end

        oRM.close("div"); //Rating group end

        oRM.close("div"); //Rating container end
      },
    });
  }
);
