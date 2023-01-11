/*global setTimeout*/
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "hcm/ux/hapv3/utils/UIHelper",
    "com/smod/smoduxlib/thirdparty/moment",
    "com/smod/smoduxlib/thirdparty/lodash",
  ],
  function (Controller, Dialog, UIHelper, momentJS, lodashJS) {
    "use strict";

    return Controller.extend("hcm.ux.hapv3.controller.BaseController", {
      onInit: function () {},
      /**
       * Convenience method for accessing the router.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter: function () {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },

      /**
       * Convenience method for getting the view model by name.
       * @public
       * @param {string} [sName] the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for get UI Helper.
       * @public
       * @returns {UI Helper} instance
       */
      getUIHelper: function () {
        return UIHelper;
      },
      /**
       * Convenience method for setting the view model.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel: function (oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      setAppState: function (bState) {
        var oAppModel = this.getModel("appView");
        oAppModel.setProperty("/busy", bState);
      },

      /**
       * Getter for the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      getText: function (sText, aParam = []) {
        return this.getResourceBundle().getText(sText, aParam);
      },

      _openBusyFragment: function (sTextCode, aMessageParameters) {
        var oDialog = this._getBusyFragment();
        var oThis = this;
        if (sTextCode) {
          oDialog.setText(this.getText(sTextCode, aMessageParameters));
        } else {
          oDialog.setText(this.getText("pleaseWait"));
        }

        setTimeout(function () {
          oDialog.open();
        }, 200);
      },

      _closeBusyFragment: function () {
        var oDialog = this._getBusyFragment();
        var oThis = this;
        var _close = function () {
          oDialog.close();
        };
        setTimeout(_close, 300);
      },

      _getBusyFragment: function () {
        if (!this.oBusyDialog) {
          this.oBusyDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.GenericBusyDialog",
            this
          );

          this.getView().addDependent(this.oBusyDialog);
        } else {
          this.oBusyDialog.close();
        }

        return this.oBusyDialog;
      },
      _callConfirmDialog: function (
        sTitle,
        sDialogType,
        sState,
        sConfirmation,
        oBeginButtonProp,
        oEndButtonProp
      ) {
        var oEndButton;
        var oBeginButton;
        var dialog;

        if (oEndButtonProp) {
          oEndButton = new sap.m.Button({
            text: oEndButtonProp.text,
            type: oEndButtonProp.type,
            icon: oEndButtonProp.icon,
            /*,
						press: oEndButtonProp.onPressed*/
          });
          oEndButton.attachPress(function () {
            dialog.close();
            oEndButtonProp.onPressed();
          });
        } else {
          oEndButton = new sap.m.Button({
            text: "İptal",
            press: function () {
              dialog.close();
            },
          });
        }

        oBeginButton = new sap.m.Button({
          text: oBeginButtonProp.text,
          type: oBeginButtonProp.type,
          icon: oBeginButtonProp.icon,
        });

        oBeginButton.attachPress(function () {
          dialog.close();
          oBeginButtonProp.onPressed();
        });

        dialog = new Dialog({
          title: sTitle,
          type: sDialogType,
          state: sState,
          content: new sap.m.Text({
            text: sConfirmation,
          }),
          beginButton: oBeginButton,
          endButton: oEndButton,
          afterClose: function () {
            dialog.destroy();
          },
          escapeHandler: function (oPromise) {
            oPromise.reject();
          },
        });
        this.getView().addDependent(dialog);
        return dialog;
      },
    });
  }
);
