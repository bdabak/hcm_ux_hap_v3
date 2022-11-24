sap.ui.define(
  ["hcm/ux/hapv3/controller/BaseController"],
  function (BaseController) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv3.controller.NotFound", {
      /**
       * Navigates to the worklist when the link is pressed
       * @public
       */
      onLinkPressed: function () {
        this.getRouter().navTo("worklist");
      },
    });
  }
);
