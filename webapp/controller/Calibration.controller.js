/*global location history */
/*global _ */
sap.ui.define(
  [
    "hcm/ux/hapv3/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "hcm/ux/hapv3/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox
  ) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv3.controller.Calibration", {
      formatter: formatter,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the calibration controller is instantiated.
       * @public
       */
      onInit: function () {
        var oViewModel = new JSONModel();
        this.setModel(oViewModel, "calibrationModel");
        this._initiateModels();
        this.getRouter()
          .getRoute("calibration")
          .attachPatternMatched(this._calibrationMatched, this);
      },

      onAfterRendering: function () {
        this._oChartElement = this.byId("idCalibrationChart");
      },
      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onCalibrationItemSelected: function (oEvent) {
        var oItem = oEvent.getParameter("itemData");
        var oViewModel = this.getModel("calibrationModel");

        oViewModel.setProperty("/busy", true);
        //Set selected form to the shared model
        this.getUIHelper().setCurrentForm({
          RoleId: "OT",
          AppraisalId: oItem.appraisalId,
        });

        this.getRouter().navTo("formdetail", {
          appraisalId: oItem.appraisalId,
        });
      },
      onBlockItemDragDrop: function (oEvent) {
        var oDI = oEvent.getParameter("draggedItem");
        var oTE = oEvent.getParameter("targetBlock");
        var oViewModel = this.getModel("calibrationModel");
        var oCalibrationData = oViewModel.getProperty("/calibrationData");
        var oOriginalCalibrationData = oViewModel.getProperty(
          "/allDeepData/CalibrationData"
        );
        var oFilteredData = oViewModel.getProperty("/filteredData");
        var oThis = this;

        var oSourceBlock = _.find(oCalibrationData.blockList, [
          "blockNumber",
          parseInt(oDI.getParent().getBlockNumber(), 0),
        ]);
        var oTargetBlock = _.find(oCalibrationData.blockList, [
          "blockNumber",
          parseInt(oTE.getBlockNumber(), 0),
        ]);
        var oDraggedData = _.cloneDeep(oDI.getItemData());

        if (!oSourceBlock || !oTargetBlock) {
          MessageToast.show(
            "Sürükle bırak için hedef veya kaynak belirlenemedi"
          );
          return;
        }

        if (oSourceBlock.blockKey === oTargetBlock.blockKey) {
          MessageToast.show("Aynı bölüme taşıma yapılamaz!");
          return;
        }

        if (oSourceBlock.blockKey === "" || oTargetBlock.blockKey === "") {
          MessageToast.show("Geçersiz hedef veya kaynak seçildi");
          return;
        }

        //var _doDragDrop = function () {
        var oChangedItem = _.find(oOriginalCalibrationData.results, [
          "Appid",
          oDraggedData.appraisalId,
        ]);
        var oFilteredItem = _.find(oFilteredData, [
          "Appid",
          oDraggedData.appraisalId,
        ]);

        //Remove from old block
        //_.remove(oSourceBlock.itemList, ["appraisalId", oDraggedData.appraisalId]);
        //oTargetBlock.itemList.push(oDraggedData);
        if (oChangedItem) {
          //Set the new calibration point then refresh block and graph
          oChangedItem.Calpn = _.clone(oTargetBlock.blockKey);
          oFilteredItem.Calpn = _.clone(oTargetBlock.blockKey);
          oViewModel.setProperty(
            "/allDeepData/CalibrationData",
            oOriginalCalibrationData
          );
          oViewModel.setProperty("/filteredData", oFilteredData);
          oThis._setCalibrationGrid(false);
          oThis._setGraphData();
          //MessageToast.show("İşlem başarılı");
        }
        //};

        // var oBeginButtonProp = {
        // 	text: this.getResourceBundle().getText("doDragDrop"),
        // 	type: "Accept",
        // 	icon: "sap-icon://move",
        // 	onPressed: _doDragDrop.bind(oThis)
        // };

        // var sConfirmationMessage = this.getResourceBundle().getText("confirmDragDropMessage", [oDraggedData.title, oSourceBlock.headerText,
        // 	oTargetBlock.headerText
        // ]);
        // var sConfirmationTitle = this.getResourceBundle().getText("confirmDragDropTitle");

        // this._callConfirmDialog(sConfirmationTitle, "Message", "Warning", sConfirmationMessage, oBeginButtonProp, null).open();
      },
      /* =========================================================== */
      /* private methods                                             */
      /* =========================================================== */
      /**
       * Initiate methods
       * @private
       */
      _calibrationMatched: function (oEvent) {
        var oRenderer = sap.ushell.Container.getRenderer("fiori2");
        oRenderer.setHeaderVisibility(false, false, ["app"]);

        var sRoleId = oEvent.getParameter("arguments").roleId;
        var oViewModel = this.getModel("calibrationModel");
        oViewModel.setProperty("/roleId", sRoleId);

        this._getCalibrationData();
      },
      _getCalibrationData: function () {
        var oViewModel = this.getModel("calibrationModel");
        var oModel = this.getModel();
        var sRoleId = oViewModel.getProperty("/roleId");
        var sQuery =
          "/CalibrationOperationsSet(TemplateId='50000550',Year='2018',Role='" +
          sRoleId +
          "')";
        var oThis = this;
        var sExpand =
          "CalibrationData,CalibrationFilters,CalibrationBlock," +
          "CalibrationFilters/CalibrationFilterValues,CalibrationReturn";

        this._initiateModels();
        oViewModel.setProperty("/roleId", sRoleId);
        oViewModel.setProperty("/busy", true);
        if (this._oChartElement) {
          this._oChartElement.__chart = undefined;
        }
        oModel.read(sQuery, {
          urlParameters: {
            $expand: sExpand,
          },
          success: function (oData, oResponse) {
            oViewModel.setProperty("/busy", false);
            //	console.log(oData);
            oViewModel.setProperty("/allDeepData", oData);
            oViewModel.setProperty(
              "/filteredData",
              _.cloneDeep(oData.CalibrationData.results)
            );
            oThis._setCalibrationGrid(true);
            oThis._setGraphData();
          },
          error: function (oError) {
            oViewModel.setProperty("/busy", false);
          },
        });
      },
      _setCalibrationGrid: function (sFilterBlockRefresh) {
        var oViewModel = this.getModel("calibrationModel");
        var oData = oViewModel.getProperty("/allDeepData");
        var oCalibrationData = oViewModel.getProperty("/calibrationData");
        var oFilteredData = oViewModel.getProperty("/filteredData");
        var sRoleId = oViewModel.getProperty("/roleId");
        var sCalibrationValueColumn = "FincvOt";
        var sCheckApStatusSub;
        var aItems2 = [];

        switch (sRoleId) {
          case "MA":
            sCheckApStatusSub = 3;
            break;
          case "MB":
            sCheckApStatusSub = 4;
            break;
          case "MC":
            sCheckApStatusSub = 5;
            break;
          default:
        }

        try {
          oCalibrationData.blockList = [];
          oCalibrationData.aPercentIdeal = [];
          $.each(
            oData.CalibrationBlock.results,
            function (sBlockIndex, oBlock) {
              var oNewBlock = {
                headerText: oBlock.CharValue + " - " + oBlock.TextValue,
                blockNumber: sBlockIndex,
                blockKey: oBlock.CharValue,
                itemList: [],
              };

              var aItems = [];
              if (oBlock.CharValue !== "") {
                oCalibrationData.aPercentIdeal.push(oBlock.PercValue);

                aItems = _.filter(oFilteredData, function (oItem) {
                  if (oItem.Calpn) {
                    return (
                      oItem.Calpn === oBlock.CharValue &&
                      oItem.ApStatus === "4" &&
                      oItem.ApStatusSub >= 3
                    );
                  } else {
                    return (
                      oItem.FincvOt === oBlock.CharValue &&
                      oItem.ApStatus === "4" &&
                      oItem.ApStatusSub >= sCheckApStatusSub
                    );
                  }
                });
              } else {
                aItems = _.filter(oFilteredData, function (oItem) {
                  return (
                    oItem.ApStatus < 4 || oItem.ApStatusSub < sCheckApStatusSub
                  );
                });
              }
              aItems = _.orderBy(aItems, ["FinpnOt"], ["desc"]);
              $.each(aItems, function (sItemIndex, oItem) {
                var oNewItem = _.cloneDeep(oItem);
                var sStatus;
                var isDraggable = false;

                if (oItem.ApStatus < 4) {
                  sStatus = "red";
                } else if (oItem.ApStatus > 4) {
                  sStatus = "green";
                } else {
                  if (oItem.ApStatusSub < sCheckApStatusSub) {
                    sStatus = "red";
                  } else if (oItem.ApStatusSub == sCheckApStatusSub) {
                    sStatus = "orange";
                    if (sRoleId === "MC") {
                      isDraggable = true;
                    }
                  } else if (oItem.ApStatusSub > sCheckApStatusSub) {
                    sStatus = "green";
                  }
                }
                oNewBlock.itemList.push({
                  imagePath:
                    "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
                    oNewItem.Pernr +
                    "')/$value",
                  title:
                    oNewItem.Ename +
                    " (" +
                    parseFloat(oNewItem.FinpnOt).toFixed(2) +
                    ")",
                  subtitle: oNewItem.Plstx,
                  appraisalId: oNewItem.Appid,
                  status: sStatus,
                  isDraggable: isDraggable,
                });
              });

              aItems2 = _.filter(oFilteredData, function (oItem) {
                return (
                  oItem.ApStatus === "4" &&
                  oItem.ApStatusSub == sCheckApStatusSub
                );
              });
              oCalibrationData.blockList.push(oNewBlock);
            }
          );

          if (aItems2.length > 0) {
            oViewModel.setProperty("/showFooter", true);
            if (sRoleId === "MC") {
              oViewModel.setProperty("/showApproveButton", false);
              oViewModel.setProperty("/showRejectButton", false);
              oViewModel.setProperty("/showSaveButton", true);
            } else {
              oViewModel.setProperty("/showApproveButton", true);
              oViewModel.setProperty("/showRejectButton", true);
              oViewModel.setProperty("/showSaveButton", false);
            }
          } else {
            oViewModel.setProperty("/showFooter", false);
            oViewModel.setProperty("/showApproveButton", false);
            oViewModel.setProperty("/showRejectButton", false);
            oViewModel.setProperty("/showSaveButton", false);
          }

          if (sFilterBlockRefresh) {
            oCalibrationData.filterBlocks = [];
            $.each(
              oData.CalibrationFilters.results,
              function (sFilterIndex, oFilter) {
                var oNewFilter = {
                  filterLabel: oFilter.FilterLabel,
                  filterField: oFilter.FilterField,
                  filterFieldTxt: oFilter.FilterFieldTxt,
                  seqno: oFilter.Seqno,
                  filterValues: [],
                };

                $.each(
                  oFilter.CalibrationFilterValues.results,
                  function (sValueIndex, oFilterValue) {
                    var oNewFilterValue = _.extend(
                      {
                        Selected: true,
                      },
                      oFilterValue
                    );
                    oNewFilter.filterValues.push(oNewFilterValue);
                  }
                );

                oCalibrationData.filterBlocks.push(oNewFilter);
              }
            );
          }
        } catch (oEx) {
          jQuery.sap.log.error(oEx);
        }

        oViewModel.setProperty("/calibrationData", oCalibrationData);
      },
      _setGraphData: function () {
        var oViewModel = this.getModel("calibrationModel");
        var oData = oViewModel.getProperty("/allDeepData");
        var oCalibrationData = oViewModel.getProperty("/calibrationData");
        var oFilteredData = oViewModel.getProperty("/filteredData");
        var sCalibrationValueColumn = "FincvOt";
        var oChartData = {
          labels: [],
          dataSets: [],
          scales: {
            xAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: "Performans Notu",
                },
              },
            ],
            yAxes: [
              {
                display: true,
                scaleLabel: {
                  display: true,
                  labelString: "Dağılım (%)",
                },
                ticks: {
                  suggestedMax: 50,
                },
              },
            ],
          },
        };

        //Set fixed data set config
        oChartData.datasets = [
          {
            label: "İdeal Dağılım",
            backgroundColor: "rgba(0, 126, 51,0.1)",
            borderColor: "rgba(0, 126, 51,1)",
            data: oCalibrationData.aPercentIdeal,
            fill: true,
            pointRadius: 5,
            hitRadius: 6,
          },
          {
            label: "Gerçekleşen Dağılım",
            fill: false,
            backgroundColor: "rgba(255, 53, 71,0.4)",
            borderColor: "rgba(255, 53, 71,1)",
            data: [],
            pointRadius: 5,
            hitRadius: 6,
          },
        ];
        var _calcPercentage = function (sBlockKey) {
          //var aCorrBlock = _.filter(oData.CalibrationData.results, [sCalibrationValueColumn, sBlockKey]);
          var aCorrBlock = _.filter(oFilteredData, function (oItem) {
            if (oItem.Calpn) {
              return oItem.Calpn === sBlockKey;
            } else {
              return oItem[sCalibrationValueColumn] === sBlockKey;
            }
          });

          try {
            return Math.round(
              (aCorrBlock.length * 100) / oData.CalibrationData.results.length
            );
          } catch (oErr) {
            return 0;
          }
        };
        var sBlockNo = 0;
        $.each(oData.CalibrationBlock.results, function (sBlockIndex, oBlock) {
          if (oBlock.CharValue !== "") {
            oChartData.labels.push(oBlock.CharValue + "-" + oBlock.TextValue);
            oChartData.datasets[1].data[sBlockNo] = _calcPercentage(
              oBlock.CharValue
            );
            sBlockNo++;
          }
        });
        oViewModel.setProperty("/chartData", oChartData);
        try {
          this.byId("idCalibrationChart").__chart.update();
        } catch (oEx) {
          jQuery.sap.log.error(oEx);
        }
      },
      onFilterItemChanged: function (oEvent) {
        var oViewModel = this.getModel("calibrationModel");
        var oCalibrationData = oViewModel.getProperty("/calibrationData");
        var oAllDeepData = oViewModel.getProperty("/allDeepData");
        var aFilteredData = _.cloneDeep(oAllDeepData.CalibrationData.results);
        oViewModel.setProperty("/busy", true);
        $.each(
          oCalibrationData.filterBlocks,
          function (sFilterIndex, oFilterBlock) {
            var aFalseConditions = _.filter(oFilterBlock.filterValues, [
              "Selected",
              false,
            ]);

            if (aFalseConditions.length > 0) {
              $.each(
                aFalseConditions,
                function (sFalsyIndex, oFalseConditions) {
                  var sFilterField =
                    oFalseConditions.FilterField.charAt(0).toUpperCase() +
                    oFalseConditions.FilterField.substr(1).toLowerCase();
                  _.remove(aFilteredData, [
                    sFilterField,
                    oFalseConditions.Value,
                  ]);
                }
              );
            }
          }
        );

        oViewModel.setProperty("/filteredData", aFilteredData);
        this._setCalibrationGrid(false);
        this._setGraphData();
        oViewModel.setProperty("/busy", false);
      },

      handleButtonAction: function (oEvent) {
        var oThis = this;
        var oButton = oEvent.getSource();
        var sAction = oButton.data("action");

        var sButtonText = oButton.getText();

        var oViewModel = this.getModel("calibrationModel");

        oViewModel.setProperty("/statusChangeNote", "");

        var _doChangeStatus = function () {
          oThis.confirmDialog.close();
          oThis._doChangeFormStatus(sAction);
        };

        if (sAction === "SAVE") {
          oThis._doChangeFormStatus(sAction);
        } else if (sAction === "APPROVE") {
          this._generateConfirmDialog(
            "formStatusChangeConfirm",
            "formsStatusChangeQuestion",
            [],
            "doFormStatusChange",
            "Accept",
            "sap-icon://accept",
            _doChangeStatus,
            "Warning"
          );
        } else if (sAction === "REJECT") {
          var oStatusChangeNoteDialog = new sap.m.Dialog({
            title: "{i18n>STATUS_CHANGE_NOTE_TITLE}",
            contentWidth: "500px",
            type: "Message",
            state: "Warning",
            content: [
              new sap.m.FlexBox({
                width: "100%",
                justifyContent: "Center",
                items: [
                  new sap.m.TextArea({
                    value: "{calibrationModel>/statusChangeNote}",
                    placeholder: "{i18n>STATUS_CHANGE_NOTE_PLACEHOLDER}",
                    width: "100%",
                    rows: 5,
                    layoutData: new sap.m.FlexItemData({
                      growFactor: 1,
                      alignSelf: sap.m.FlexAlignSelf.Center,
                    }),
                  }),
                ],
              }),
            ],
            beginButton: new sap.m.Button({
              text: sButtonText,
              type: "Accept",
              press: function () {
                var sNote = "";
                try {
                  sNote = oViewModel.getProperty("/statusChangeNote").trim();
                } catch (oEx) {
                  sNote = "";
                }
                if (sNote === "") {
                  MessageToast.show(
                    oThis
                      .getResourceBundle()
                      .getText("STATUS_CHANGE_NOTE_MANDATORY")
                  );
                  return;
                }
                oStatusChangeNoteDialog.close();
                oThis._doChangeFormStatus(sAction);
              },
            }),
            endButton: new sap.m.Button({
              text: "{i18n>labelCancel}",
              press: function () {
                oStatusChangeNoteDialog.close();
              },
            }),
            afterClose: function () {
              oStatusChangeNoteDialog.destroy();
            },
          });

          this.getView().addDependent(oStatusChangeNoteDialog);

          oStatusChangeNoteDialog.open();
        }
      },
      _doChangeFormStatus: function (sAction) {
        var oThis = this;
        var oViewModel = this.getModel("calibrationModel");
        var oFilteredData = oViewModel.getProperty("/filteredData");
        var oModel = this.getModel();
        var sHasErrors = false;
        var sRoleId = oViewModel.getProperty("/roleId");
        var oOperation = {
          TemplateId: "50000550",
          Year: "2018",
          Role: sRoleId,
          Actio: sAction,
          StatusNote: oViewModel.getProperty("/statusChangeNote"),
          CalibrationData: oFilteredData,
        };

        this._openBusyFragment();
        oModel.create("/CalibrationOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            sHasErrors = oThis._processReturnMessagesNew(
              oData.CalibrationReturn.results,
              false
            );

            /* Close busy indicator*/
            oThis._closeBusyFragment();
          },
          error: function (oError) {
            oThis._closeBusyFragment();
            var M = JSON.parse(oError.responseText).error.message.value;
            MessageBox.error(M);
          },
          async: true,
        });
        this._getCalibrationData();
      },
      _generateConfirmDialog: function (
        sConfirmHeaderi18n,
        sConfirmTexti18n,
        sConfirmTextParams,
        sButtonText,
        sButtonType,
        sButtonIcon,
        oCallBack,
        sDialogType,
        sEndButtonText,
        sEndButtonType,
        sEndButtonIcon,
        oEndCallBack
      ) {
        var sConfirmHeader =
          this.getResourceBundle().getText(sConfirmHeaderi18n);
        var sConfirmText = this.getResourceBundle().getText(
          sConfirmTexti18n,
          sConfirmTextParams
        );
        var oThis = this;
        var oEndButtonProp = null;

        var oBeginButtonProp = {
          text: oThis.getResourceBundle().getText(sButtonText),
          type: sButtonType,
          icon: sButtonIcon,
          onPressed: oCallBack.bind(oThis),
        };

        if (sEndButtonText) {
          oEndButtonProp = {
            text: oThis.getResourceBundle().getText(sEndButtonText),
            type: sEndButtonType,
            icon: sEndButtonIcon,
            onPressed: oEndCallBack.bind(oThis),
          };
        }

        oThis.confirmDialog = this._callConfirmDialog(
          sConfirmHeader,
          "Message",
          sDialogType,
          sConfirmText,
          oBeginButtonProp,
          oEndButtonProp
        );

        oThis.confirmDialog.open();
      },
      _processReturnMessagesNew: function (aReturn, sShowMessages) {
        var sHasErrors = false;

        $.each(aReturn, function (sIndex, oReturn) {
          switch (oReturn.Type) {
            case "S":
              MessageBox.show(oReturn.Message, {
                icon: MessageBox.Icon.SUCCESS,
                title: "Bilgi",
                actions: [MessageBox.Action.CLOSE],
              });
              break;
            case "W":
              MessageBox.warning(oReturn.Message);
              break;
            case "I":
              MessageBox.information(oReturn.Message);
              break;
            case "E":
            case "A":
              sHasErrors = true;
              sShowMessages = true;
              MessageBox.error(oReturn.Message);
              break;
          }
          return false; //only one popup message
        });

        return sHasErrors;
      },
      _initiateModels: function () {
        var oViewModel = this.getModel("calibrationModel");
        if (this._oChartElement) {
          this._oChartElement.exit();
        }
        oViewModel.setData({
          busy: false,
          allDeepData: {},
          calibrationData: {},
          filteredData: [],
          chartData: {},
          roleId: "",
          showFooter: false,
          showRejectButton: false,
          showSaveButton: false,
        });
      },
    });
  }
);
