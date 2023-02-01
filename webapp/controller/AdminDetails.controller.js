/*global _,moment*/
sap.ui.define(
  [
    "hcm/ux/hapv3/controller/DetailController",
    "sap/ui/core/routing/History",
    "hcm/ux/hapv3/model/formatter",
  ],
  function (DetailController, History, formatter) {
    "use strict";

    return DetailController.extend("hcm.ux.hapv3.controller.AdminDetails", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        this.initializeModel();

        this.getRouter()
          .getRoute("admindetail")
          .attachPatternMatched(this._onPatternMatched, this);
      },

      onExit: function () {
        this._initializeViewModel();
      },
      _doNavToMain: function () {
        var that = this;

        this._clearUI().then(function () {
          that._initializeViewModel();

          //
          var oHistory = History.getInstance();
          var sPreviousHash = oHistory.getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.go(-1);
          } else {
            that.getRouter().navTo("adminlist", null, true);
          }
        });
      },
    });
  }
);
