/*global introJs,_*/
sap.ui.define(
  [
    "hcm/ux/hapv3/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "hcm/ux/hapv3/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    Fragment,
    momentJS
  ) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv3.controller.AdminList", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        var oViewModel,
          iOriginalBusyDelay,
          oTable = this.byId("idAdminListTable"),
          oIconTabBar = this.byId("idFormListTabs"),
          that = this;

        // Put down worklist table's original value for busy indicator delay,
        // so it can be restored later on. Busy handling on the table is
        // taken care of by the table itself.
        iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
        this._oTable = oTable;
        this._oIconTabBar = oIconTabBar;
        this._aFormList = [];
        // keeps the search state
        this._oTableSearchState = [];

        // Model used to manipulate control states
        oViewModel = new JSONModel({
          formListTableTitle: this.getResourceBundle().getText(
            "formListTableTitleME"
          ),
          tableNoDataText:
            this.getResourceBundle().getText("formListNoDataText"),
          appraisalPeriodBeginDate: new Date(
            new Date().getFullYear() - 2,
            0,
            1
          ),
          appraisalPeriodEndDate: new Date(new Date().getFullYear(), 11, 31),
          appraisalPeriodBeginYear: new Date().getFullYear(), // - 1,
          appraisalPeriodEndYear: new Date().getFullYear(),
          tableBusyDelay: 0,
          currentFormList: [],
          formCount: 0,
          selectionToggle: "sap-icon://hide",
          dateSelection: that._initiateYears(),
          selectedDates: (function () {
            return [new Date().getFullYear()];
          })(),
          formTypes: [
            { Type: "appraisal", Value: "Değerlendirme formları" },
            { Type: "probation", Value: "Deneme süresi formları" },
          ],
          selectedFormTypes: [],
          selectedFormStatuses: [],
          formStatusState: false,
          selectedFormTemplate: null,
          viewBusy: false,
          showFooter: false,
          roleChange: {},
          currentForm: {},
        });
        this.setModel(oViewModel, "adminListModel");
        this.getUIHelper().setListViewModel(oViewModel);

        this.getRouter()
          .getRoute("formlist")
          .attachPatternMatched(this._onListPatternMatched, this);

        // Make sure, busy indication is showing immediately so there is no
        // break after the busy indication for loading the view's meta data is
        // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
        oTable.attachEventOnce("updateFinished", function () {
          // Restore original busy indicator delay for worklist's table
          oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
        });

        //this._initiateYears();

        /*Form list will be automatically upgraded*/
        this.getUIHelper().setFormListUpdated(false);
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */

      /**
       * Triggered by the table's 'updateFinished' event: after new table
       * data is available, this handler method updates the table counter.
       * This should only happen if the update was successful, which is
       * why this handler is attached to 'updateFinished' and not to the
       * table's list binding's 'dataReceived' method.
       * @param {sap.ui.base.Event} oEvent the update finished event
       * @public
       */
      onUpdateFinished: function (oEvent) {
        // update the worklist's object counter after the table updatev2.
        var sTitle,
          oTable = oEvent.getSource(),
          iTotalItems = oEvent.getParameter("total");

        // only update the counter if the length is final and
        // the table is not empty
        // if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
        // 	sTitle = this.getResourceBundle().getText("formListTableTitleCount" + sSelTab, [iTotalItems]);
        // } else {
        sTitle = this.getResourceBundle().getText("formAdminListTableTitle");
        // }
        this.getModel("adminListModel").setProperty(
          "/formListTableTitle",
          sTitle
        );
      },

      /**
       * Event handler when a table item gets pressed
       * @param {sap.ui.base.Event} oEvent the table selectionChange event
       * @public
       */
      onNavHome: function (oEvent) {
        var oCrossAppNavigator = sap.ushell.Container.getService(
          "CrossApplicationNavigation"
        );
        var oRenderer = sap.ushell.Container.getRenderer("fiori2");
        oRenderer.setHeaderVisibility(true, true, ["app"]);

        oCrossAppNavigator.toExternal({
          target: {
            semanticObject: "#",
          },
        });
      },
      onFormShowHide: function (oEvent) {
        this._doShowHideSelection();
      },

      onTemplateSelected: function () {
        var oViewModel = this.getModel("adminListModel");
        oViewModel.setProperty("/selectedFormStatuses", []);
        this.onRefreshFormStatus();
      },

      resetFormTemplateState: function () {
        this.byId("idAdminFormTemplateSelection").setValueState(
          sap.ui.core.ValueState.None
        );
        this.byId("idAdminFormTemplateSelection").setValueStateText("");
      },

      onRefreshFormStatus: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("adminListModel");
        var sSelectedFormTemplate = oViewModel.getProperty(
          "/selectedFormTemplate"
        );
        var oMC = this.byId("idAdminFormStatusSelection");
        var oBinding = oMC.getBinding("items");

        oBinding.aFilters = [];
        oBinding.filter([
          new Filter("Id", FilterOperator.EQ, "AppraisalStatus"),
          new Filter("Query", FilterOperator.EQ, sSelectedFormTemplate),
        ]);
        // oBinding.refresh();
      },
      getStatusGroupHeader: function (oGroup) {
        return new sap.ui.core.SeparatorItem({
          text: oGroup.key,
        });
      },
      onStatusesRequested: function (oEvent) {
        this.handleStatusBusyState(true);
      },
      onStatusesReceived: function () {
        this.handleStatusBusyState(false);
      },
      handleStatusBusyState: function (bState) {
        var oViewModel = this.getModel("adminListModel");
        oViewModel.setProperty("formStatusState", bState);
      },
      onRefreshFormList: function (oEvent) {
        var oModel = this.getModel();
        var oViewModel = this.getModel("adminListModel");
        var that = this;
        var aSelectedDates = oViewModel.getProperty("/selectedDates");
        var aSelectedFormTypes = oViewModel.getProperty("/selectedFormTypes");
        var aSelectedFormStatuses = oViewModel.getProperty(
          "/selectedFormStatuses"
        );
        var sSelectedFormTemplate = oViewModel.getProperty(
          "/selectedFormTemplate"
        );

        if (!sSelectedFormTemplate) {
          MessageBox.error(this.getText("chooseAppraisalTemplate"));
          this.byId("idAdminFormTemplateSelection").setValueState("Error");
          this.byId("idAdminFormTemplateSelection").setValueStateText(
            this.getText("chooseAppraisalTemplate")
          );
          return;
        }

        this.resetFormTemplateState();

        this.getUIHelper().setFormListUpdated(true);

        var _getPeriod = function () {
          var sPeriod = "";
          $.each(aSelectedDates, function (i, d) {
            sPeriod = sPeriod === "" ? d : sPeriod + "," + d;
          });
          return sPeriod;
        };
        var _getFormSelection = function () {
          var sFormType = "";
          $.each(aSelectedFormTypes, function (i, s) {
            sFormType = sFormType === "" ? s : sFormType + "," + s;
          });
          return sFormType;
        };

        var _getFormStatuses = function () {
          var sFormStatuses = "";
          $.each(aSelectedFormStatuses, function (i, s) {
            sFormStatuses = sFormStatuses === "" ? s : sFormStatuses + "," + s;
          });
          return sFormStatuses;
        };

        oViewModel.setProperty("/currentFormList", []);

        this._openBusyFragment("formListPrepared", []);

        oModel.callFunction("/GetAdminDocumentList", {
          urlParameters: {
            Period: _getPeriod(),
            FormSelection: _getFormSelection(),
            FormStatusSelection: _getFormStatuses(),
            TemplateSelection: sSelectedFormTemplate,
          },
          success: function (oData, oResponse) {
            that._closeBusyFragment();
            oViewModel.setProperty("/currentFormList", oData.results);
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
        });
      },
      onRoleSelect: function () {
        this.onRefreshTable();
      },
      onSelectionChanged: function (oEvent) {
        var oTable = oEvent.getSource();
        var oViewModel = this.getModel("adminListModel");
        var aItems = oTable.getSelectedItems() || [];

        oViewModel.setProperty("/showFooter", aItems.length > 0);
      },
      onRefreshTable: function () {
        var sKey = this._oIconTabBar.getSelectedKey();
        var oViewModel = this.getModel("adminListModel");
        var aCurrentForms = [];
        var aAllMBForms = [];
        var aInProcess2ndMBForms = [];

        oViewModel.setProperty("/currentFormList", []);

        aAllMBForms = _.filter(this._aFormList, {
          RoleId: "MB",
        });
        aInProcess2ndMBForms = _.filter(this._aFormList, function (o) {
          return o.RoleId == "MB" && o.ApStatus == 4 && o.ApStatusSub == 9;
        });

        if (sKey == "MB" && aAllMBForms.length == aInProcess2ndMBForms.length) {
          this.byId("idAdminListTable").setVisible(false);
          this.byId("idCalibrationLinkMB").setVisible(true);
          this.byId("idCalibrationLinkMC").setVisible(false);
        } else if (sKey == "MC") {
          this.byId("idAdminListTable").setVisible(false);
          this.byId("idCalibrationLinkMB").setVisible(false);
          this.byId("idCalibrationLinkMC").setVisible(true);
        } else {
          this.byId("idAdminListTable").setVisible(true);
          this.byId("idCalibrationLinkMB").setVisible(false);
          this.byId("idCalibrationLinkMC").setVisible(false);

          $.each(this._aFormList, function (i, oForm) {
            if (oForm.RoleId === sKey) {
              aCurrentForms.push(oForm);
            }
          });

          oViewModel.setProperty("/currentFormList", aCurrentForms);
        }
      },

      onFormPress: function (oEvent) {
        var oViewModel = this.getModel("adminListModel");
        var sPath = oEvent.getSource().getBindingContextPath();

        //Set selected form to the shared model
        this.getUIHelper().setCurrentForm(oViewModel.getProperty(sPath));

        this.getRouter().navTo("formdetail", {
          appraisalId: oViewModel.getProperty(sPath + "/AppraisalId"),
        });
      },

      onSearch: function (oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          // Search field's 'refresh' button has been pressed.
          // This is visible if you select any master list item.
          // In this case no new search is triggered, we only
          // refresh the list binding.
          this.onRefresh();
        } else {
          var oTableSearchState = [];
          var sQuery = oEvent.getParameter("query");

          if (sQuery && sQuery.length > 0) {
            oTableSearchState = [
              new Filter({
                filters: [
                  new Filter("AppraiseeName", FilterOperator.Contains, sQuery),
                  new Filter("AppraiserName", FilterOperator.Contains, sQuery),
                ],
                and: false,
              }),
            ];
          }
          this._applySearch(oTableSearchState);
        }
      },

      /**
       * Event handler for refresh event. Keeps filter, sort
       * and group settings and refreshes the list binding.
       * @public
       */
      onRefresh: function () {
        this._oTable.getBinding("items").refresh();
      },
      /**
       * Event handler for form delete.
       * @public
       */
      onFormDelete: function () {
        var oTable = this.byId("idAdminListTable");
        var that = this;
        if (!oTable) {
          return;
        }

        var oItems = oTable.getSelectedItems() || [];

        if (oItems.length === 0) {
          return;
        }

        var sConfirmHeader = this.getText("formDeleteConfirmation");
        var sConfirmText = this.getText("formDeleteWarning");

        var oBeginButtonProp = {
          text: this.getText("formDeleteButton"),
          type: "Reject",
          icon: "sap-icon://delete",
          onPressed: jQuery.proxy(that.performFormDelete, that),

          // that.performChangeStatus.bind(that),
        };

        this.confirmDialog = this._callConfirmDialog(
          sConfirmHeader,
          "Message",
          "Error",
          sConfirmText,
          oBeginButtonProp,
          null
        );

        this.confirmDialog.open();
      },
      performFormDelete: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("adminListModel");
        var that = this;
        var oTable = this.byId("idAdminListTable");
        var aItems = oTable.getSelectedItems() || [];

        if (aItems.length === 0) {
          return;
        }

        var oRequest = {
          Operation: "ADM_FRMDL",
          DocumentSet: [],
          OperationParameterSet: [],
          ReturnSet: [],
        };

        $.each(aItems, function (i, oItem) {
          var oItemData = oViewModel.getProperty(oItem.getBindingContextPath());
          oRequest.DocumentSet.push({
            AppraisalId: oItemData.AppraisalId,
            PartApId: "0000",
          });
        });

        this._openBusyFragment("formDeleteInProgress", []);
        oModel.create("/AdminOperationSet", oRequest, {
          success: function (oData, oResponse) {
            that._closeBusyFragment();

            // /* Return messages */
            var sHasErrors = oData.ReturnSet?.results.length > 0;
            if (sHasErrors) {
              var fnArrangeErrorMessage = function (aMessg) {
                var sMessage = `<p>${that.getText("errorMessages")}:</p><ul>`;
                $.each(aMessg, function (i, oMessg) {
                  sMessage = sMessage + `<li>${oMessg.Message}</li>`;
                });

                sMessage = sMessage + `</ul>`;
                return sMessage;
              };

              MessageBox.error(that.getText("errorsOccurredFormDelete"), {
                title: that.getText("errorsOccurred"),
                details: fnArrangeErrorMessage(oData.ReturnSet.results),
              });
            } else {
              MessageToast.show(that.getText("formDeleteSuccessful"));
            }

            that.onRefreshFormList();
          },
          error: function (oError) {
            that._closeBusyFragment();
            console.log(oError);
          },
        });
      },

      /**
       * Event handler for change status action.
       * @public
       */
      onChangeStatus: function () {
        var oTable = this.byId("idAdminListTable");
        var oViewModel = this.getModel("adminListModel");
        var that = this;

        if (!oTable) {
          return;
        }

        var oItems = oTable.getSelectedItems() || [];

        if (oItems.length === 0) {
          return;
        }

        var oRowData = oViewModel.getProperty(
          oItems[0].getBindingContextPath()
        );

        if (!oRowData) {
          return;
        }
        var sExcludeStatus = oRowData?.ApStatus + "-" + oRowData?.ApStatusSub;

        var sSelectedFormTemplate = oViewModel.getProperty(
          "/selectedFormTemplate"
        );

        var oView = this.getView();

        if (!this._oChangeStatusDialog) {
          this._oChangeStatusDialog = Fragment.load({
            id: oView.getId(),
            name: "hcm.ux.hapv3.fragment.AdminNewStatusSelection",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog, that);
            return oDialog;
          });
        }
        this._oChangeStatusDialog.then(
          function (oDialog) {
            var oBinding = oDialog.getBinding("items");

            oBinding.aFilters = [];
            oBinding.filter([
              new Filter("Id", FilterOperator.EQ, "AppraisalStatus"),
              new Filter("Query", FilterOperator.EQ, sSelectedFormTemplate),
              new Filter("Key", FilterOperator.NE, sExcludeStatus),
            ]);
            oDialog.open();
          }.bind(this)
        );
      },
      performChangeStatus: function (sNewStatusKey) {
        var oModel = this.getModel();
        var oViewModel = this.getModel("adminListModel");
        var that = this;
        var oTable = this.byId("idAdminListTable");
        var aItems = oTable.getSelectedItems() || [];

        if (aItems.length === 0) {
          return;
        }

        var oRowData = oViewModel.getProperty(
          aItems[0].getBindingContextPath()
        );

        var oRequest = {
          Operation: "ADM_CHNST",
          DocumentSet: [],
          OperationParameterSet: [],
          ReturnSet: [],
        };

        //--Operation parameter is set
        var oOld = {
          Param: "OLD_FORM_STATUS",
          Value: oRowData.ApStatus + "-" + oRowData.ApStatusSub,
        };
        oRequest.OperationParameterSet.push(oOld);

        var oNew = {
          Param: "NEW_FORM_STATUS",
          Value: sNewStatusKey,
        };
        oRequest.OperationParameterSet.push(oNew);

        var oTemplate = {
          Param: "TEMPLATE_ID",
          Value: oRowData.TemplateId,
        };
        oRequest.OperationParameterSet.push(oTemplate);

        $.each(aItems, function (i, oItem) {
          var oItemData = oViewModel.getProperty(oItem.getBindingContextPath());
          oRequest.DocumentSet.push({
            AppraisalId: oItemData.AppraisalId,
            PartApId: "0000",
          });
        });

        this._openBusyFragment("changeStatusInProgress", []);
        oModel.create("/AdminOperationSet", oRequest, {
          success: function (oData, oResponse) {
            that._closeBusyFragment();

            // /* Return messages */
            var sHasErrors = oData.ReturnSet?.results.length > 0;
            if (sHasErrors) {
              var fnArrangeErrorMessage = function (aMessg) {
                var sMessage = `<p>${that.getText("errorMessages")}:</p><ul>`;
                $.each(aMessg, function (i, oMessg) {
                  sMessage = sMessage + `<li>${oMessg.Message}</li>`;
                });

                sMessage = sMessage + `</ul>`;
                return sMessage;
              };

              MessageBox.error(
                that.getText("errorsOccurredDuringStatusChange"),
                {
                  title: that.getText("errorsOccurred"),
                  details: fnArrangeErrorMessage(oData.ReturnSet.results),
                }
              );
            } else {
              MessageToast.show(that.getText("statusChangeSuccessful"));
            }

            that.onRefreshFormList();
          },
          error: function (oError) {
            that._closeBusyFragment();
            console.log(oError);
          },
        });
      },

      confirmChangeStatus: function (oEvent) {
        var oModel = this.getModel();
        var that = this;
        var oSelectedContext = oModel.getProperty(
          oEvent.getParameter("selectedItem").getBindingContextPath()
        );

        if (oSelectedContext) {
          var sConfirmHeader = this.getText("formStatusChangeConfirmation");
          var sConfirmText = this.getText("formStatusChangeWarning", [
            oSelectedContext.Group + " - " + oSelectedContext.Value,
          ]);

          var oBeginButtonProp = {
            text: this.getText("changeFormStatusButton"),
            type: "Emphasized",
            icon: "sap-icon://enter-more",
            onPressed: jQuery.proxy(
              that.performChangeStatus,
              that,
              oSelectedContext.Key
            ),

            // that.performChangeStatus.bind(that),
          };

          this.confirmDialog = this._callConfirmDialog(
            sConfirmHeader,
            "Message",
            "Warning",
            sConfirmText,
            oBeginButtonProp,
            null
          );

          this.confirmDialog.open();
        }
      },
      handleCloseChangeStatusDialog: function (oEvent) {
        MessageToast.show(this.getText("operationCancelled"));
      },

      onFormAction: function (oEvent) {
        var oButton = oEvent.getSource();
        var oCurrentForm = oButton.data("appraisalForm");
        var oViewModel = this.getModel("adminListModel");

        if (!oCurrentForm) {
          return;
        }

        oViewModel.setProperty("/currentForm", _.cloneDeep(oCurrentForm));
        oViewModel.setProperty("/roleChange", {
          firstAppraiser: {
            Id: oCurrentForm.AppraiserId,
            Name: oCurrentForm.AppraiserName,
          },
          secondAppraiser: {
            Id: oCurrentForm.OtherId,
            Name: oCurrentForm.OtherName,
          },
        });

        // create action sheet only once
        if (!this._formActionSheet) {
          this._formActionSheet = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AdminFormActions",
            this
          );
          this.getView().addDependent(this._formActionSheet, this);
        }

        this._formActionSheet.openBy(oButton);
      },
      onChangeForm: function () {
        var oViewModel = this.getModel("adminListModel");
        var oCurrentForm = oViewModel.getProperty("/currentForm");

        if (!oCurrentForm) {
          return;
        }

        this.getRouter().navTo("formdetail", {
          appraisalId: oCurrentForm.AppraisalId,
        });
      },

      onChangeRoles: function () {
        if (!this._changeRoleFragment) {
          this._changeRoleFragment = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AdminRoleChange",
            this
          );
          this.getView().addDependent(this._changeRoleFragment, this);
        }

        this._changeRoleFragment.open();
      },
      onCloseRoleChangeDialog: function () {
        this._changeRoleFragment.close();
      },
      onAfterCloseRoleChangeDialog: function () {
        this._changeRoleFragment.destroy();
        this._changeRoleFragment = null;
      },
      onResetAppraiser: function () {
        var oViewModel = this.getModel("adminListModel");
        var oRoleChange = oViewModel.getProperty("/roleChange");

        oRoleChange.secondAppraiser = {
          Id: null,
          Name: null,
        };

        oViewModel.setProperty("/roleChange", oRoleChange);
      },
      onSaveRoleChange: function () {
        var oViewModel = this.getModel("adminListModel");
        var oModel = this.getModel();
        var that = this;
        var oCurrentForm = oViewModel.getProperty("/currentForm");
        var oRoleChange = oViewModel.getProperty("/roleChange");
        var bChange = false;

        var oRequest = {
          Operation: "ADM_CHAPR",
          DocumentSet: [],
          OperationParameterSet: [],
          ReturnSet: [],
        };

        if (oCurrentForm.AppraiserId !== oRoleChange.firstAppraiser.Id) {
          //--Operation parameter is set
          var oNew1st = {
            Param: "NEW_FIRST_APPRAISER",
            Value: oRoleChange.firstAppraiser.Id,
          };
          bChange = true;
          oRequest.OperationParameterSet.push(oNew1st);
        }

        if (oCurrentForm.OtherId !== oRoleChange.secondAppraiser.Id) {
          var oNew2nd = {
            Param: "NEW_SECOND_APPRAISER",
            Value: oRoleChange.secondAppraiser.Id,
          };
          bChange = true;
          oRequest.OperationParameterSet.push(oNew2nd);
        }

        if (!bChange) {
          MessageToast.show(this.getText("noRoleChangeIsFound"));
          this._changeRoleFragment.close();
          return;
        }

        oRequest.DocumentSet.push({
          AppraisalId: oCurrentForm.AppraisalId,
          PartApId: "0000",
        });
        this._changeRoleFragment.close();
        this._openBusyFragment("roleChangeInProgress", []);
        oModel.create("/AdminOperationSet", oRequest, {
          success: function (oData, oResponse) {
            that._closeBusyFragment();

            // /* Return messages */
            var sHasErrors = oData.ReturnSet?.results.length > 0;
            if (sHasErrors) {
              var fnArrangeErrorMessage = function (aMessg) {
                var sMessage = `<p>${that.getText("errorMessages")}:</p><ul>`;
                $.each(aMessg, function (i, oMessg) {
                  sMessage = sMessage + `<li>${oMessg.Message}</li>`;
                });

                sMessage = sMessage + `</ul>`;
                return sMessage;
              };

              MessageBox.error(that.getText("errorsOccurredDuringRoleChange"), {
                title: that.getText("errorsOccurred"),
                details: fnArrangeErrorMessage(oData.ReturnSet.results),
              });
            } else {
              MessageToast.show(that.getText("roleChangeSuccessful"));
            }

            that.onRefreshFormList();
          },
          error: function (oError) {
            that._closeBusyFragment();
            console.log(oError);
          },
        });
      },

      onSelectAppraiser: function (oEvent) {
        var oField = oEvent.getSource();
        var sTargetField = oField.data("targetField");
        if (!this._selectAppraiserFragment) {
          this._selectAppraiserFragment = sap.ui.xmlfragment(
            "hcm.ux.hapv3.fragment.AdminEmployeeSelection",
            this
          );
          this.getView().addDependent(this._selectAppraiserFragment, this);
        }
        this._selectAppraiserFragment.data("targetField", sTargetField);
        this._selectAppraiserFragment.open();
      },
      onConfirmEmployeeSelection: function (oEvent) {
        var oItem = oEvent.getParameter("selectedContexts")[0]?.getObject();
        var oViewModel = this.getModel("adminListModel");
        var sPath = this._selectAppraiserFragment.data("targetField");
        oViewModel.setProperty(sPath, {
          Id: oItem.Pernr,
          Name: oItem.Ename,
        });

        this._selectAppraiserFragment.destroy();
        this._selectAppraiserFragment = null;
      },
      onCancelEmployeeSelection: function () {
        this._selectAppraiserFragment.destroy();
        this._selectAppraiserFragment = null;
      },
      onPerformEmployeeSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new Filter("Query", FilterOperator.EQ, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([oFilter]);
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */
      _onListPatternMatched: function () {
        if (sap.ushell.Container) {
          var oRenderer = sap.ushell.Container.getRenderer("fiori2");
          oRenderer.setHeaderVisibility(false, false, ["app"]);
        }
        if (!this.getUIHelper().getFormListUpdated()) {
          this.onRefreshFormList();
        }
      },

      /**
       * Internal helper method to apply both filter and search state together on the list binding
       * @param {object} oTableSearchState an array of filters for the search
       * @private
       */
      _applySearch: function (oTableSearchState) {
        var oViewModel = this.getModel("adminListModel");
        this._oTable
          .getBinding("items")
          .filter(oTableSearchState, "Application");
        // changes the noDataText of the list in case there are no filter results
        if (oTableSearchState.length !== 0) {
          oViewModel.setProperty(
            "/tableNoDataText",
            this.getResourceBundle().getText("formListNoDataWithSearchText")
          );
        }
      },

      /**
       * Internal helper method to show hide selection bar
       * @private
       */
      _doShowHideSelection: function () {
        var oViewModel = this.getModel("adminListModel");
        var sEl = this.byId("idAdminFormSelection")
          .$()
          .children()
          .children()[1];

        var that = this;

        var doToggleIcon = function (oObj) {
          var sIcon = oViewModel.getProperty("/selectionToggle");
          if (sIcon === "sap-icon://hide") {
            $(oObj).parent().parent().addClass("zeroPadding");
            sIcon = "sap-icon://show";
          } else {
            $(oObj).parent().parent().removeClass("zeroPadding");
            sIcon = "sap-icon://hide";
          }

          oViewModel.setProperty("/selectionToggle", sIcon);
        };

        $(sEl).slideToggle({
          duration: 200,
          easing: "swing",
          done: function () {
            doToggleIcon(this);
          },
        });
      },

      _initiateYears: function () {
        //var oViewModel = this.getModel("adminListModel");
        var sToday = new Date().getFullYear() + 1;
        var aDates = [];
        while (sToday > 2013) {
          var oDate = {
            Year: sToday,
            Begda: new Date(sToday, 0, 1),
            Endda: new Date(sToday, 11, 31),
          };
          oDate.Begda.setHours(9);
          oDate.Endda.setHours(9);
          aDates.push(oDate);
          sToday--;
        }
        return aDates;
        //oViewModel.setProperty("/dateSelection", aDates);
      },
    });
  }
);
