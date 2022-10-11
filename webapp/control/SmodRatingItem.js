sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv2.1.control.SmodRatingItem", {
    metadata: {
      properties: {
        value: { type: "string", bindable: true },
        valueText: { type: "string", bindable: true },
        selected: { type: "boolean", bindable: true, defaultValue: false },
        hidden: { type: "boolean", bindable: true, defaultValue: false },
      },
      aggregations: {},
      events: {},
    },

    /**
     * @override
     */
    onAfterRendering: function () {
      this._refreshActive();
    },

    renderer: function (oRM, oControl) {
      var sSelectedValue = oControl.getParent()?.getSelectedValue();
      var editable = oControl.getParent()?.getEditable();
      var radioName = oControl.getParent()?.getRadioName();
      var excludedValues = oControl.getParent()?.getExcludedValues() || [];
      var sValue = oControl.getValue();
      var sValueText = oControl.getValueText();

      if (sSelectedValue) {
        sSelectedValue = -1;
      }
      //Label begin
      oRM.openStart("label");
      oRM.class("smod-rating-item-label");
      if (!editable) {
        oRM.class("disabled");
      }
      if (oControl.getHidden() || excludedValues.includes(sValue)) {
        oRM.class("initial");
      }
      oRM.writeControlData(oControl);
      oRM.attr("for", "id-" + radioName + "-" + sValue);
      // oRM.attr("data-tooltip", oControl.getValueText());
      oRM.openEnd();

      oRM.openStart("i"); //Icon begin
      oRM.class("smod-rating-item-icon");
      oRM.openEnd();
      oRM.openStart("span");
      oRM.class("smod-rating-item-tooltip");
      // oRM.attr("data-tooltip", sValueText);
      oRM.openEnd();
      oRM.text(sValueText);
      oRM.close("span"); //Tooltip

      oRM.close("i"); //Label  end
      oRM.close("label"); //Label  end

      //Input begin
      oRM.openStart("input");
      oRM.class("smod-rating-item-input");
      if (oControl.getHidden() || excludedValues.includes(sValue)) {
        oRM.class("initial");
      }
      oRM.attr("type", "radio");
      oRM.attr("name", radioName);
      oRM.attr("value", sValue);
      if (oControl.getSelected()) {
        oRM.attr("checked", true);
      }

      oRM.attr("id", "id-" + radioName + "-" + sValue);

      oRM.openEnd(); //Input
      oRM.close("input"); //Input
    },

    onmouseover: function (event) {
      var editable = this.getParent()?.getEditable();

      if (editable) {
        if (event.target.className.includes("smod-rating-item-icon")) {
          $(event.currentTarget)
            .parent()
            .find(".smod-rating-item-icon")
            .removeClass("hover-active");
          $(event.currentTarget)
            .nextUntil(":last", ".smod-rating-item-label")
            .find(".smod-rating-item-icon")
            .addClass("hover-passive");

          //--Make active
          $(event.currentTarget)
            .next()
            .prevUntil(
              $(event.currentTarget).parent(),
              ".smod-rating-item-label"
            )
            .find(".smod-rating-item-icon")
            .removeClass("hover-passive")
            .addClass("hover-active");
        }
      }
    },

    onmouseout: function (event) {
      var editable = this.getParent()?.getEditable();
      if (editable) {
        var hint = this.getParent().$().find(".smod-rating-value-hint");
        if (hint) {
          $(hint).fadeOut(function () {
            $(hint).text("");
          });
        }

        this.$()
          .parent()
          .find(".smod-rating-item-icon")
          .removeClass("hover-active")
          .removeClass("hover-passive");
      }
    },

    ontap: function (event) {
      var that = this;
      var editable = this.getParent()?.getEditable();

      if (editable) {
        if (event.target.className.includes("smod-rating-item-icon")) {
          this.getParent().setProperty("selectedValue", this.getValue(), true);
          this.getParent().setProperty(
            "selectedValueText",
            this.getValueText(),
            true
          );
          $(".smod-rating-item-input").prop("checked", false);
          this.$().find(".smod-rating-item-input").prop("checked", true);
          var valueText = this.getParent().$().find(".smod-rating-value-text");
          if (valueText) {
            $(valueText).fadeOut(50, function () {
              $(valueText).text(that.getValueText()).fadeIn();
              $(valueText).addClass("show");
            });
          }

          this.getParent().fireEvent("change");

          this._refreshActive();
        }
      }
    },

    _refreshActive: function () {
      var excludedValues = this.getParent()?.getExcludedValues() || [];
      var sSelectedValue = this.getParent().getSelectedValue();
      try {
        if (
          excludedValues.length > 0 &&
          sSelectedValue &&
          excludedValues.includes(sSelectedValue)
        ) {
          this.$()
            .parent()
            .find(".smod-rating-item-icon")
            .addClass("invalidate");
          return;
        }
      } catch (e) {}

      if (this.getParent().getSelectedValue() === this.getValue()) {
        //--Make selected column and previous active
        this.$().parent().find(".smod-rating-item-icon").removeClass("active");
        this.$()
          .parent()
          .find(".smod-rating-item-icon")
          .removeClass("invalidate");

        this.$()
          .next()
          .prevUntil(this.$().parent(), ".smod-rating-item-label")
          .find(".smod-rating-item-icon")
          .addClass("active");
      }
    },
  });
});
