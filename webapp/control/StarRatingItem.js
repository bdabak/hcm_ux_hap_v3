sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv2_1.control.StarRatingItem", {
    metadata: {
      properties: {
        value: { type: "string", bindable: true },
        valueText: { type: "string", bindable: true },
        selected: { type: "boolean", bindable: true, defaultValue: false },
        hidden: { type: "boolean", bindable: true, defaultValue: false },
        index: { type: "int", bindable: true },
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
      var nullValue = oControl.getParent()?.getNullValue() || null;
      var sValue = oControl.getValue();
      var sValueText = oControl.getValueText();
      var sStarName =
        sValue === nullValue ? "star-null" : "star-" + oControl.getIndex();

      if (sSelectedValue) {
        sSelectedValue = null;
      }
      //Label begin
      oRM.openStart("label");
      oRM.class("star-rating-item-label");
      if (!editable) {
        oRM.class("disabled");
      }
      if (oControl.getHidden() || excludedValues.includes(sValue)) {
        oRM.class("initial");
      }
      oRM.writeControlData(oControl);

      oRM.attr("for", "id-" + radioName + "-" + sStarName);
      // oRM.attr("data-tooltip", oControl.getValueText());
      oRM.openEnd();

      oRM.openStart("svg"); //Svg begin
      oRM.attr("width", "245");
      oRM.attr("height", "240");
      oRM.attr("viewBox", "0 0 50 50");
      oRM.class("star-rating-item");
      oRM.openEnd();

      if (sValue === nullValue) {
        oRM.openStart("g"); //G begin
        oRM.attr(
          "transform",
          "translate(0.000000,50.000000) scale(0.065,-0.065)"
        );
        // oRM.attr("fill", "#f00");
        // oRM.attr("stroke", "#f00");
        oRM.openEnd();
        oRM.openStart("path"); //Path begin
        oRM.attr(
          "d",
          "M245 631 c-132 -32 -229 -146 -242 -286 -6 -69 13 -150 47 -195 l19 -25 -35 -36 -34 -35 28 -27 28 -27 34 35 33 34 26 -18 c106 -76 276 -61 388 33 47 40 93 135 100 209 6 71 -13 152 -47 197 l-19 25 35 36 34 35 -28 27 -28 27 -34 -35 -33 -34 -26 18 c-61 43 -166 61 -246 42z m168 -97 c18 -9 34 -18 37 -21 4 -4 -311 -323 -321 -323 -16 0 -39 77 -39 133 0 130 97 227 228 227 39 0 75 -6 95 -16z m120 -119 c10 -22 17 -60 17 -98 0 -130 -97 -227 -228 -227 -54 0 -108 15 -132 37 -4 4 311 323 321 323 3 0 13 -16 22 -35z"
        );
        oRM.openEnd();
        oRM.close("path"); //Path end
        oRM.close("g"); //Path end
      } else {
        oRM.openStart("path"); //Path begin
        oRM.attr("d", "m25,1 6,17h18l-14,11 5,17-15-10-15,10 5-17-14-11h18z");
        oRM.openEnd();
        oRM.close("path"); //Path end
      }

      oRM.close("svg"); //Svg  end

      //Tooltip
      if (sValue) {
        oRM.openStart("div"); //Icon begin
        oRM.class("star-rating-item-tooltip");
        oRM.openEnd(); //Icon begin
        oRM.text(sValueText);
        oRM.close("div"); //Icon begin
      }
      //Tooltip

      oRM.close("label"); //Label  end
    },

    //   onmouseover: function (event) {
    //     var editable = this.getParent()?.getEditable();

    //     if (editable) {
    //       if (event.target.className.includes("smod-rating-item-icon")) {
    //         $(event.currentTarget)
    //           .parent()
    //           .find(".smod-rating-item-icon")
    //           .removeClass("hover-active");
    //         $(event.currentTarget)
    //           .nextUntil(":last", ".smod-rating-item-label")
    //           .find(".smod-rating-item-icon")
    //           .addClass("hover-passive");

    //         //--Make active
    //         $(event.currentTarget)
    //           .next()
    //           .prevUntil(
    //             $(event.currentTarget).parent(),
    //             ".smod-rating-item-label"
    //           )
    //           .find(".smod-rating-item-icon")
    //           .removeClass("hover-passive")
    //           .addClass("hover-active");
    //       }
    //     }
    //   },

    //   onmouseout: function (event) {
    //     var editable = this.getParent()?.getEditable();
    //     if (editable) {
    //       var hint = this.getParent().$().find(".smod-rating-value-hint");
    //       if (hint) {
    //         $(hint).fadeOut(function () {
    //           $(hint).text("");
    //         });
    //       }

    //       this.$()
    //         .parent()
    //         .find(".smod-rating-item-icon")
    //         .removeClass("hover-active")
    //         .removeClass("hover-passive");
    //     }
    //   },

    ontap: function (event) {
      var that = this;
      var editable = this.getParent()?.getEditable();

      if (editable) {
        if (this.getValue() === this.getParent().getSelectedValue()) {
          return;
        }

        this.getParent().setProperty("selectedValue", this.getValue(), true);
        this.getParent().setProperty(
          "selectedValueText",
          this.getValueText(),
          true
        );
        // $(".s-rating-item-input").prop("checked", false);
        // this.$().find(".smod-rating-item-input").prop("checked", true);
        var valueText = this.getParent().$().find(".star-rating-value-text");
        if (valueText) {
          $(valueText).fadeOut(50, function () {
            $(valueText).text(that.getValueText()).fadeIn();
            $(valueText).addClass("show");
          });
        }

        this.getParent().fireEvent("change");

        //this._refreshActive();
      }
    },

    _refreshActive: function () {
      // var excludedValues = this.getParent()?.getExcludedValues() || [];
      // var sSelectedValue = this.getParent().getSelectedValue();
      // try {
      //   if (
      //     excludedValues.length > 0 &&
      //     sSelectedValue &&
      //     excludedValues.includes(sSelectedValue)
      //   ) {
      //     this.$()
      //       .parent()
      //       .find(".smod-rating-item-icon")
      //       .addClass("invalidate");
      //     return;
      //   }
      // } catch (e) {}
      // if (this.getParent().getSelectedValue() === this.getValue()) {
      //   //--Make selected column and previous active
      //   this.$()
      //     .parent()
      //     .find(".smod-rating-item-icon")
      //     .removeClass("active");
      //   this.$()
      //     .parent()
      //     .find(".smod-rating-item-icon")
      //     .removeClass("invalidate");
      //   this.$()
      //     .next()
      //     .prevUntil(this.$().parent(), ".smod-rating-item-label")
      //     .find(".smod-rating-item-icon")
      //     .addClass("active");
      // }
    },
  });
});
