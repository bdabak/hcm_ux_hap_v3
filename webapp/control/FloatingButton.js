/*global _*/
sap.ui.define(
  ["sap/ui/core/Control", "sap/ui/core/IconPool"],
  function (Control, IconPool) {
    "use strict";

    return Control.extend("hcm.ux.hapv2_1.control.FloatingButton", {
      metadata: {
        properties: {
          icon: { type: "string", bindable: true },
          iconColor: { type: "string", bindable: true },
          iconSize: { type: "sap.ui.core.CSSSize", bindable: true },
        },
        events: {
          pressed: {},
        },
      },
      init: function () {
        //initialisation code, in this case, ensure css is imported
        var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv2_1"); //get the server location of the ui library
        jQuery.sap.includeStyleSheet(
          sLibraryPath + "/control/FloatingButton.css"
        );
      },
      renderer: function (oRM, oControl) {
        var oIcon = new sap.ui.core.Icon({
          src: oControl.getIcon(),
          color: oControl.getIconColor(),
          size: oControl.getIconSize(),
        });

        oRM.openStart("div");
        oRM.writeControlData(oControl);
        oRM.class("smod-floating-button-container");
        oRM.openEnd();
        oRM.openStart("div");
        oRM.class("smod-floating-button");
        oRM.openEnd();
        oRM.renderControl(oIcon);
        oRM.close("div");
        oRM.close("div");
      },

      ontap: function () {
        this.firePressed();
      },
    });
  }
);
