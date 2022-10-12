sap.ui.define(
  ["hcm/ux/hapv2_1/controller/BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv2_1.controller.App", {
      onInit: function () {
        var oViewModel,
          fnSetAppNotBusy,
          iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        oViewModel = new JSONModel({
          busy: true,
          delay: 0,
          busyImageSource: jQuery.sap.getModulePath(
            "hcm.ux.hapv2_1",
            "/images/loading.svg"
          ),
        });
        this.setModel(oViewModel, "appView");

        fnSetAppNotBusy = function () {
          oViewModel.setProperty("/busy", false);
          oViewModel.setProperty("/delay", iOriginalBusyDelay);
        };

        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(fnSetAppNotBusy);

        // apply content density mode to root view
        this.getView().addStyleClass(
          this.getOwnerComponent().getContentDensityClass()
        );
      },
    });
  }
);
