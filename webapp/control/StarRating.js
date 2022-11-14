sap.ui.define(
  ["sap/ui/core/Control", "./StarRatingItem"],
  function (Control, StarRatingItem) {
    "use strict";

    return Control.extend("hcm.ux.hapv2_1.control.StarRating", {
      metadata: {
        properties: {
          selectedValue: { type: "string", bindable: true },
          selectedValueText: { type: "string", bindable: true },
          editable: { type: "boolean", bindable: true, defaultValue: true },
          radioName: { type: "string", bindable: false },
          nullValue: { type: "string", bindable: true },
          excludedValues: { type: "object", bindable: true },
        },
        aggregations: {
          ratingItems: {
            type: "hcm.ux.hapv2_1.control.StarRatingItem",
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
        jQuery.sap.includeStyleSheet(sLibraryPath + "/control/StarRating.css");

        //Set a unique radio name
        var vRadioName = _.uniqueId("RIRG_") + "_" + new Date().getTime();
        this.setProperty("radioName", vRadioName, true);
      },
      /**
       * @override
       */
      onAfterRendering: function () {
        var that = this;

        setTimeout(function () {
          //SVG bug
          $("#" + that.getId()).removeClass("hidden");
        }, 100);
      },
      renderer: function (oRM, oControl) {
        var items = oControl.getRatingItems();
        var availableItems = [];
        var radioName = oControl.getRadioName();
        var editable = oControl.getEditable();
        var excludedValues = oControl.getExcludedValues() || [];
        var nullValue = oControl.getNullValue() || null;
        var itemIndex = 0;

        if (!nullValue) {
          var initialValueItem = new StarRatingItem({
            value: null,
            valueText: "",
            selected:
              !oControl.getSelectedValue() ||
              oControl.getSelectedValue() === null,
            hidden: true,
          }).setParent(oControl);

          availableItems.push(initialValueItem);
        }

        items.forEach(function (item) {
          if (!excludedValues.includes(item.getValue())) {
            var isSelected = oControl.getSelectedValue() === item.getValue();
            item.setSelected(isSelected);
            item.setIndex(itemIndex);
            if (isSelected) oControl.setSelectedValueText(item.getValueText());
            availableItems.push(item);
            itemIndex++;
          }
        });

        //Main container begin
        oRM.openStart("div");
        oRM.writeControlData(oControl);
        oRM.class("star-rating-main-container");
        oRM.class("hidden");
        oRM.attr("control-id", radioName);
        oRM.openEnd();

        //Main content begin
        oRM.openStart("div");
        oRM.class("star-rating-main");
        oRM.openEnd();

        oRM.openStart("div");
        oRM.class("star-rating-items");
        oRM.openEnd();

        availableItems.forEach(function (item, index) {
          var sStarName =
            item.getValue() === nullValue ? "star-null" : "star-" + index;
          //Input begin
          oRM.openStart("input");
          oRM.class("star-rating-item-input");
          oRM.class(sStarName);
          oRM.attr("type", "radio");
          oRM.attr("name", radioName);
          oRM.attr("value", item.getValue());
          if (oControl.getSelectedValue() === item.getValue()) {
            oRM.attr("checked", true);
          }
          if (!editable) {
            oRM.attr("disabled", true);
          }

          oRM.attr("id", "id-" + radioName + "-" + sStarName);

          oRM.openEnd(); //Input
          oRM.close("input"); //Input
        });

        //Rating container begin
        oRM.openStart("section");
        oRM.class("star-rating-container");
        oRM.openEnd();

        availableItems.forEach(function (item) {
          oRM.renderControl(item);
        });
        oRM.close("section");
        //Rating container end

        //Label
        // oRM.openStart("label");
        // oRM.class("star-rating-item-label");
        // oRM.attr("for", "id-" + radioName + "-star-null");
        // oRM.openEnd(); //Label
        // oRM.text("Clear");
        // oRM.close("label"); //Label

        oRM.close("div");

        //Rating value text begin
        oRM.openStart("div");
        oRM.class("star-rating-value-text");
        if (oControl.getSelectedValueText()) {
          oRM.class("show");
        }
        oRM.openEnd();
        oRM.text(oControl.getSelectedValueText());
        oRM.close("div");
        //Rating value text end

        oRM.close("div");
        //Main content end
        oRM.close("div");
        //Main container end
      },
    });
  }
);
