/*global location*/
/*global window*/
/*global setTimeout*/
/*global setInterval*/
/*global clearTimeout*/
/*global clearInterval*/
/*global console*/
/*global introJs*/
/*global document*/
/*global _*/
sap.ui.define(
  [
    "hcm/ux/hapv2_1/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "hcm/ux/hapv2_1/model/formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/MessagePopover",
    //"sap/m/MessageItem",
    "sap/m/MessagePopoverItem",
    "smod/ui5/controls/src/controls/HapIndicatorPanel",
    "smod/ui5/controls/src/controls/HapMessageStrip",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/data/DimensionDefinition",
    "sap/viz/ui5/data/MeasureDefinition",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "hcm/ux/hapv2_1/utils/CustomChartFormatter",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "../control/SmodRatingIndicator",
    "../control/SmodRatingItem",
  ],
  function (
    BaseController,
    JSONModel,
    History,
    formatter,
    MessageToast,
    MessageBox,
    MessagePopover,
    MessageItem,
    HapIndicatorPanel,
    HapMessageStrip,
    Filter,
    FilterOperator,
    VizFrame,
    FlattenedDataset,
    DimensionDefinition,
    MeasureDefinition,
    FeedItem,
    ChartFormatter,
    Format,
    CustomChartFormatter,
    DateFormat,
    Fragment,
    SmodRatingIndicator,
    SmodRatingItem
  ) {
    "use strict";

    return BaseController.extend("hcm.ux.hapv2_1.controller.FormDetails", {
      formatter: formatter,
      hasChanges: false,

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * Called when the worklist controller is instantiated.
       * @public
       */
      onInit: function () {
        // Model used to manipulate control states. The chosen values make sure,
        // detail page is busy indication immediately so there is no break in
        // between the busy indication for loading the view's meta data
        var oViewModel = new JSONModel({
          busy: true,
          delay: 0,
          appraisalId: null,
          currentRowIid: null,
          navigationData: [],
          sidebarData: {
            visible: false,
            appeeInfo: {},
            apper1stInfo: {},
            apper2ndInfo: {},
            apper3rdInfo: {},
            statusInfo: [],
            footerData: [],
          },
          formProp: [],
          formData: {},
          bodyElements: {},
          bodyElementsCopy: {},
          bodyCells: {},
          bodyCellsCopy: {},
          bodyColumns: {},
          bodyCellValues: {},
          currentForm: {},
          formMessages: [],
          formUIElements: [],
          newElement: {
            Value: null,
            RowIid: null,
            PlaceHolder: null,
            ParentName: null,
          },
          attachmentCollection: {},
          elementSurveys: {},
          surveyCloseButtonVisible: false,
          headerVisible: false,
          currentCellValueDescription: [],
          introSteps: [],
          footerButtons: [],
          formSections: [],
          allSectionsClicked: false,
          navigationFormId: "",
          saveAndKeepButtonVisibility: true,
        });

        //Set page layout
        this._oPageLayout = this.byId("idDetailObjectPageLayout");
        this._oNavContainer = this.byId("idPageNavigationContainer");

        // Store original busy indicator delay, so it can be restored later on
        this.setModel(oViewModel, "formDetailsModel");

        this.getRouter()
          .getRoute("formdetail")
          .attachPatternMatched(this._onPatternMatched, this);

        /*this._oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			this._oMessageManager = sap.ui.getCore().getMessageManager();

			this._oMessageManager.registerMessageProcessor(this._oMessageProcessor);*/

        /*Register customer format*/
        CustomChartFormatter.registerCustomFormat();

        var that = this;

        $(function () {
          window.onhashchange = function (oEvent) {
            var oHash = oEvent.currentTarget.hasher.getHash();
            if (oHash.indexOf("GetDetail") === -1) {
              that._initializeViewModel();
              that._setChangeListeners(false);
            }
          };
        });
      },

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onNavBack: function (oEvent) {
        var that = this;

        if (this.hasChanges) {
          this._generateConfirmDialog(
            "formHasChanges",
            "formQuitWithoutSave",
            [],
            "exitWithoutSave",
            "Emphasized",
            "sap-icon://nav-back",
            that._doNavToMain,
            "Warning"
          );
        } else {
          this._setChangeListeners(false);
          this._doNavToMain();
        }
      },

      onExit: function (oEvent) {
        this._initializeViewModel();
      },

      onMessagesButtonPress: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        if (!this._oMessagePopover) {
          this._oMessagePopover = new MessagePopover({
            items: {
              path: "/formMessages",
              template: new MessageItem({
                type: "{type}",
                title: "{message}",
              }),
            },
            headerButton: new sap.m.Button({
              icon: "sap-icon://delete",
              text: "{i18n>clearMessages}",
              press: function () {
                that._removeAllMessages();
                that._oMessagePopover.close();
              },
            }),
          });
          this._oMessagePopover.setModel(oViewModel);
          // this._oMessagePopover.attachAfterClose(null, function () {
          // 	that._removeAllMessages();
          // }, this);
        }
        if (oEvent) {
          this._oMessagePopover.openBy(oEvent.getSource());
        } else {
          var oNavContainer = this.byId("idPageNavigationContainer");
          var oCurrentPage = oNavContainer.getCurrentPage();
          this._oMessagePopover.openBy(
            oCurrentPage.getFooter().getAggregation("content")[0]
          );
        }
      },
      _handleCallUserGuide: function () {
        var that = this;
        Fragment.load({
          name: "hcm.ux.hapv2_1.fragment.UserGuideViewer",
          controller: that,
        }).then(function (oDialog) {
          that._oGuideViewer = oDialog;
          that.getView().addDependent(that._oGuideViewer);
          that._oGuideViewer.open();
        });
      },
      onCloseUserGuide: function () {
        this._oGuideViewer.close();
      },
      onAfterUserGuideClose: function () {
        this._oGuideViewer.destroyContent();
        this._oGuideViewer = null;
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
        var sConfirmHeader = this.getText(sConfirmHeaderi18n);
        var sConfirmText = this.getText(sConfirmTexti18n, sConfirmTextParams);
        var that = this;
        var oEndButtonProp = null;

        var oBeginButtonProp = {
          text: that.getText(sButtonText),
          type: sButtonType,
          icon: sButtonIcon,
          onPressed: oCallBack.bind(that),
        };

        if (sEndButtonText) {
          oEndButtonProp = {
            text: that.getText(sEndButtonText),
            type: sEndButtonType,
            icon: sEndButtonIcon,
            onPressed: oEndCallBack.bind(that),
          };
        }

        that.confirmDialog = this._callConfirmDialog(
          sConfirmHeader,
          "Message",
          sDialogType,
          sConfirmText,
          oBeginButtonProp,
          oEndButtonProp
        );

        that.confirmDialog.open();
      },
      _doNavToMain: function () {
        this._initializeViewModel();
        //
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          this.getRouter().navTo("formlist", null, true);
        }
      },
      _formatDate: function (sDate) {
        try {
          var oDateFormat = DateFormat.getDateTimeInstance({
            pattern: "dd/MM/yyyy",
          });

          return oDateFormat.format(sDate);
        } catch (ex) {
          return "";
        }
      },

      _refreshSidebarFooterData: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var aResultsTable = oViewModel.getProperty("/formData/ResultTable");

        var oFooterData = {
          TableData: [],
          FooterData: [],
        };

        /*Footer Data*/
        var aResults = _.filter(aResultsTable, function (oResultLine) {
          if (oResultLine.Sort === "099") {
            return false;
          }
          if (oResultLine.Sort.includes) {
            return !oResultLine.Sort.includes(".");
          } else {
            if (oResultLine.Sort.indexOf(".") !== -1) {
              return false;
            } else {
              return true;
            }
          }
        });

        var aCaption = _.uniqBy(aResults, "RowName");
        var aColumns = _.uniqBy(aResults, "ColIid");
        var aFinalRow = _.filter(aResultsTable, ["Sort", "099"]);
        var sRowIndex = 0;
        var sColIndex = 0;

        //SUMMARY_WEIGHT_SHOW

        var oHeaderLeft;

        if (oViewData.formParameters["NO_DISPLAY_HEADER"] === "X") {
          oHeaderLeft = {};
        } else {
          oHeaderLeft = {
            Value: oViewData.formParameters["SUMMARY_HEADER_TITLE"], //SUMMARY_HEADER_TITLE
            Type: "HeaderEmpty",
            ColumnIndex: sColIndex,
            RowIndex: sRowIndex,
          };
        }
        //Form captions
        if (aCaption.length > 0) {
          oFooterData.TableData[sColIndex] = {
            Type: "Caption",
            ColumnIndex: sColIndex,
            Data: [oHeaderLeft],
          };
        }

        $.each(aCaption, function (sIndex, oCaption) {
          sRowIndex++;
          var sColValue = "";
          if (oViewData.formParameters["SUMMARY_WEIGHT_SHOW"] === "X") {
            try {
              var oCell =
                oViewData.bodyCells[oCaption.RowIid][that._sWeightColumn]; //Weight column
              sColValue =
                oCaption.RowName +
                " (" +
                oCell.ValueTxt +
                "" +
                oCell.ValueText +
                ")";
            } catch (oEx) {
              sColValue = oCaption.RowName;
            }
          } else {
            sColValue = oCaption.RowName;
          }
          oFooterData.TableData[0].Data.push({
            Value: sColValue,
            Type: "RowLabel",
            ColumnIndex: sColIndex,
            RowIndex: sRowIndex,
          });
        });

        if (oViewData.formParameters["NO_DISPLAY_HEADER"] === "X") {
          $.each(aColumns, function (sIndex, oColumn) {
            sColIndex++;
            sRowIndex = 0;
            oFooterData.TableData[sColIndex] = {
              Type: "Column",
              ColumnIndex: sColIndex,
              Data: [{}],
            };
            var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
            $.each(aCellVal, function (sIndex, oCell) {
              sRowIndex++;
              oFooterData.TableData[sColIndex].Data.push({
                Value: oCell.Value,
                Type: "RowValue",
                ColumnIndex: sColIndex,
                RowIndex: sRowIndex,
              });
            });
          });
        } else {
          $.each(aColumns, function (sIndex, oColumn) {
            sColIndex++;
            sRowIndex = 0;
            oFooterData.TableData[sColIndex] = {
              Type: "Column",
              ColumnIndex: sColIndex,
              Data: [
                {
                  Value: oColumn.ColName,
                  Type: "Header",
                  ColumnIndex: sColIndex,
                  RowIndex: sRowIndex,
                },
              ],
            };
            var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
            $.each(aCellVal, function (sIndex, oCell) {
              sRowIndex++;
              oFooterData.TableData[sColIndex].Data.push({
                Value: oCell.Value,
                Type: "RowValue",
                ColumnIndex: sColIndex,
                RowIndex: sRowIndex,
              });
            });
          });
        }
        /*Footer of Footer Begin*/
        if (aFinalRow[0]) {
          var sFooterRowColSpan = aFinalRow.length === 1 ? 2 : 1;
          oFooterData.FooterData[0] = {
            Type: "Footer",
            Data: [
              {
                Value: aFinalRow[0].RowName,
                Type: "FooterLabel",
                ColSpan: sFooterRowColSpan,
              },
            ],
          };

          if (aColumns.length === 0) {
            oFooterData.FooterData[0].Data.push({
              Value: aFinalRow[0].Value,
              Type: "FooterValue",
              ColSpan: sFooterRowColSpan,
            });
          }

          $.each(aColumns, function (sIndex, oColumn) {
            var aCellVal = _.filter(aFinalRow, ["ColIid", oColumn.ColIid]);
            $.each(aCellVal, function (sIndex, oCell) {
              oFooterData.FooterData[0].Data.push({
                Value: oCell.Value,
                Type: "FooterValue",
                ColSpan: sFooterRowColSpan,
              });
            });
          });

          if (oViewData.formParameters["FINAL_NOTE_AFTER_CALIB"]) {
            oFooterData.FooterData.push({
              Type: "FooterFinal",
              Data: [
                {
                  Value: "KALİBRASYON SONUCU",
                  Type: "FooterLabel",
                  ColSpan: aFinalRow.length === 1 ? 2 : 1,
                },
                {
                  Value: oViewData.formParameters["FINAL_NOTE_AFTER_CALIB"],
                  Type: "FooterValue",
                  ColSpan: aFinalRow.length === 1 ? 2 : 3,
                },
              ],
            });
          }

          if (oViewData.formParameters["FINAL_TEXT_AFTER_CALIB"]) {
            oFooterData.FooterData.push({
              Type: "FooterNote",
              Data: [
                {
                  Value: oViewData.formParameters["FINAL_TEXT_AFTER_CALIB"],
                  Type: "FooterValue",
                  ColSpan: 3,
                },
              ],
            });
          }

          //FINAL_NOTE_AFTER_CALIB
          //FINAL_TEXT_AFTER_CALIB
        }

        /*Footer of Footer End*/
        /*Footer Data*/

        return oFooterData;
      },

      _prepareSideBarData: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oAppraisee = oViewModel.getProperty("/formData/HeaderAppraisee/0");
        var oAppraiser1st = oViewModel.getProperty(
          "/formData/HeaderAppraiser/0"
        );
        var oAppraiser2nd = oViewModel.getProperty("/formData/HeaderOthers/0");
        var oAppraiser3rd = oViewModel.getProperty("/formData/HeaderOthers/1");
        var oStatus = oViewModel.getProperty("/formData/HeaderStatus");
        var oDates = oViewModel.getProperty("/formData/HeaderDates");
        var aResultsTable = oViewModel.getProperty("/formData/ResultTable");
        var oSideBarData = oViewModel.getProperty("/sidebarData");
        var that = this;

        oSideBarData.visible = true;

        /*Appraisee Data*/
        oSideBarData.appeeInfo.ImageSource =
          "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
          oAppraisee.Id +
          "')/$value";
        oSideBarData.appeeInfo.Title = oAppraisee.Name;
        oSideBarData.appeeInfo.Line1 = oAppraisee.Plstx;
        oSideBarData.appeeInfo.Line2 = oAppraisee.Orgtx;
        /*Appraisee Data*/

        if (oAppraiser1st) {
          /*Appraiser 1st Data*/
          oSideBarData.apper1stInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser1st.Id +
            "')/$value";
          oSideBarData.apper1stInfo.Id = oAppraiser1st.Id;
          oSideBarData.apper1stInfo.Title = oAppraiser1st.Name;
          oSideBarData.apper1stInfo.Line1 = oAppraiser1st.Plstx;
          oSideBarData.apper1stInfo.Line2 = oAppraiser1st.Orgtx;
          /*Appraiser 1st Data*/
        }

        if (oAppraiser2nd) {
          /*Appraiser 2nd Data*/
          oSideBarData.apper2ndInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser2nd.Id +
            "')/$value";
          oSideBarData.apper2ndInfo.Id = oAppraiser2nd.Id;
          oSideBarData.apper2ndInfo.Title = oAppraiser2nd.Name;
          oSideBarData.apper2ndInfo.Line1 = oAppraiser2nd.Plstx;
          oSideBarData.apper2ndInfo.Line2 = oAppraiser2nd.Orgtx;
          /*Appraiser 2nd Data*/
        }

        if (oAppraiser3rd) {
          /*Appraiser 3rd Data*/
          oSideBarData.apper3rdInfo.ImageSource =
            "/sap/opu/odata/sap/ZHCM_UX_HAP_SRV/EmployeeInfoSet('" +
            oAppraiser3rd.Id +
            "')/$value";
          oSideBarData.apper3rdInfo.Id = oAppraiser3rd.Id;
          oSideBarData.apper3rdInfo.Title = oAppraiser3rd.Name;
          oSideBarData.apper3rdInfo.Line1 = oAppraiser3rd.Plstx;
          oSideBarData.apper3rdInfo.Line2 = oAppraiser3rd.Orgtx;
          /*Appraiser 3rd Data*/
        }

        /*Status Data*/
        oSideBarData.statusInfo = [];
        oSideBarData.statusInfo.push(
          {
            Label: "Form Durumu",
            Value: oStatus.ApStatusName,
          },
          {
            Label: "Alt Durum",
            Value: oStatus.ApStatusSubName,
          },
          {
            Label: "Dönem Başlangıcı",
            Value: this._formatDate(oDates.ApStartDate),
          },
          {
            Label: "Dönem Sonu",
            Value: this._formatDate(oDates.ApEndDate),
          }
        );
        /*Status Data*/

        /* Footer data */
        oSideBarData.footerData = this._refreshSidebarFooterData();
        /* Footer data */

        // /*Footer Data*/
        // var aResults = _.filter(aResultsTable, function (oResultLine) {
        //   if (oResultLine.Sort === "099") {
        //     return false;
        //   }
        //   if (oResultLine.Sort.includes) {
        //     return !oResultLine.Sort.includes(".");
        //   } else {
        //     if (oResultLine.Sort.indexOf(".") !== -1) {
        //       return false;
        //     } else {
        //       return true;
        //     }
        //   }
        // });
        // var aCaption = _.uniqBy(aResults, "RowName");
        // var aColumns = _.uniqBy(aResults, "ColIid");
        // var aFinalRow = _.filter(aResultsTable, ["Sort", "099"]);
        // var sRowIndex = 0;
        // var sColIndex = 0;

        // oSideBarData.footerData = {
        //   TableData: [],
        //   FooterData: [],
        // };
        // //SUMMARY_WEIGHT_SHOW

        // var oHeaderLeft;

        // if (oViewData.formParameters["NO_DISPLAY_HEADER"] === "X") {
        //   oHeaderLeft = {};
        // } else {
        //   oHeaderLeft = {
        //     Value: oViewData.formParameters["SUMMARY_HEADER_TITLE"], //SUMMARY_HEADER_TITLE
        //     Type: "HeaderEmpty",
        //     ColumnIndex: sColIndex,
        //     RowIndex: sRowIndex,
        //   };
        // }
        // //Form captions
        // if (aCaption.length > 0) {
        //   oSideBarData.footerData.TableData[sColIndex] = {
        //     Type: "Caption",
        //     ColumnIndex: sColIndex,
        //     Data: [oHeaderLeft],
        //   };
        // }

        // $.each(aCaption, function (sIndex, oCaption) {
        //   sRowIndex++;
        //   var sColValue = "";
        //   if (oViewData.formParameters["SUMMARY_WEIGHT_SHOW"] === "X") {
        //     try {
        //       var oCell =
        //         oViewData.bodyCells[oCaption.RowIid][that._sWeightColumn]; //Weight column
        //       sColValue =
        //         oCaption.RowName +
        //         " (" +
        //         oCell.ValueTxt +
        //         "" +
        //         oCell.ValueText +
        //         ")";
        //     } catch (oEx) {
        //       sColValue = oCaption.RowName;
        //     }
        //   } else {
        //     sColValue = oCaption.RowName;
        //   }
        //   oSideBarData.footerData.TableData[0].Data.push({
        //     Value: sColValue,
        //     Type: "RowLabel",
        //     ColumnIndex: sColIndex,
        //     RowIndex: sRowIndex,
        //   });
        // });

        // if (oViewData.formParameters["NO_DISPLAY_HEADER"] === "X") {
        //   $.each(aColumns, function (sIndex, oColumn) {
        //     sColIndex++;
        //     sRowIndex = 0;
        //     oSideBarData.footerData.TableData[sColIndex] = {
        //       Type: "Column",
        //       ColumnIndex: sColIndex,
        //       Data: [{}],
        //     };
        //     var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
        //     $.each(aCellVal, function (sIndex, oCell) {
        //       sRowIndex++;
        //       oSideBarData.footerData.TableData[sColIndex].Data.push({
        //         Value: oCell.Value,
        //         Type: "RowValue",
        //         ColumnIndex: sColIndex,
        //         RowIndex: sRowIndex,
        //       });
        //     });
        //   });
        // } else {
        //   $.each(aColumns, function (sIndex, oColumn) {
        //     sColIndex++;
        //     sRowIndex = 0;
        //     oSideBarData.footerData.TableData[sColIndex] = {
        //       Type: "Column",
        //       ColumnIndex: sColIndex,
        //       Data: [
        //         {
        //           Value: oColumn.ColName,
        //           Type: "Header",
        //           ColumnIndex: sColIndex,
        //           RowIndex: sRowIndex,
        //         },
        //       ],
        //     };
        //     var aCellVal = _.filter(aResults, ["ColIid", oColumn.ColIid]);
        //     $.each(aCellVal, function (sIndex, oCell) {
        //       sRowIndex++;
        //       oSideBarData.footerData.TableData[sColIndex].Data.push({
        //         Value: oCell.Value,
        //         Type: "RowValue",
        //         ColumnIndex: sColIndex,
        //         RowIndex: sRowIndex,
        //       });
        //     });
        //   });
        // }
        // /*Footer of Footer Begin*/
        // if (aFinalRow[0]) {
        //   var sFooterRowColSpan = aFinalRow.length === 1 ? 2 : 1;
        //   oSideBarData.footerData.FooterData[0] = {
        //     Type: "Footer",
        //     Data: [
        //       {
        //         Value: aFinalRow[0].RowName,
        //         Type: "FooterLabel",
        //         ColSpan: sFooterRowColSpan,
        //       },
        //     ],
        //   };

        //   if (aColumns.length === 0) {
        //     oSideBarData.footerData.FooterData[0].Data.push({
        //       Value: aFinalRow[0].Value,
        //       Type: "FooterValue",
        //       ColSpan: sFooterRowColSpan,
        //     });
        //   }

        //   $.each(aColumns, function (sIndex, oColumn) {
        //     var aCellVal = _.filter(aFinalRow, ["ColIid", oColumn.ColIid]);
        //     $.each(aCellVal, function (sIndex, oCell) {
        //       oSideBarData.footerData.FooterData[0].Data.push({
        //         Value: oCell.Value,
        //         Type: "FooterValue",
        //         ColSpan: sFooterRowColSpan,
        //       });
        //     });
        //   });

        //   if (oViewData.formParameters["FINAL_NOTE_AFTER_CALIB"]) {
        //     oSideBarData.footerData.FooterData.push({
        //       Type: "FooterFinal",
        //       Data: [
        //         {
        //           Value: "KALİBRASYON SONUCU",
        //           Type: "FooterLabel",
        //           ColSpan: aFinalRow.length === 1 ? 2 : 1,
        //         },
        //         {
        //           Value: oViewData.formParameters["FINAL_NOTE_AFTER_CALIB"],
        //           Type: "FooterValue",
        //           ColSpan: aFinalRow.length === 1 ? 2 : 3,
        //         },
        //       ],
        //     });
        //   }

        //   if (oViewData.formParameters["FINAL_TEXT_AFTER_CALIB"]) {
        //     oSideBarData.footerData.FooterData.push({
        //       Type: "FooterNote",
        //       Data: [
        //         {
        //           Value: oViewData.formParameters["FINAL_TEXT_AFTER_CALIB"],
        //           Type: "FooterValue",
        //           ColSpan: 3,
        //         },
        //       ],
        //     });
        //   }

        //   //FINAL_NOTE_AFTER_CALIB
        //   //FINAL_TEXT_AFTER_CALIB
        // }

        // /*Footer of Footer End*/
        // /*Footer Data*/

        oViewModel.setProperty("/sidebarData", oSideBarData);
        //console.log(oSideBarData);
      },
      _initializeViewModel: function () {
        var oViewModel = this.getModel("formDetailsModel");

        this._resetSections();

        //this._oNavContainer.destroyPages();
        //this._oNavContainer.removeAllPages();
        this._oNavContainer.setInitialPage(null);

        //Initiate
        oViewModel.setProperty("/navigationData", []);
        oViewModel.setProperty("/sidebarData", {
          visible: false,
          appeeInfo: {},
          apper1stInfo: {},
          apper2ndInfo: {},
          apper3rdInfo: {},
          statusInfo: [],
          footerData: [],
        });
        oViewModel.setProperty("/formData", {});
        oViewModel.setProperty("/formProp", []);
        oViewModel.setProperty("/bodyElementsCopy", {});
        oViewModel.setProperty("/bodyColumns", {});
        oViewModel.setProperty("/bodyCells", {});
        oViewModel.setProperty("/bodyCellsCopy", {});
        oViewModel.setProperty("/bodyCellValues", {});
        oViewModel.setProperty("/currentForm", {});
        oViewModel.setProperty("/formMessages", []);
        oViewModel.setProperty("/appraisalId", null);
        oViewModel.setProperty("/currentRowIid", null);
        oViewModel.setProperty("/formUIElements", []);
        oViewModel.setProperty("/attachmentCollection", {});
        oViewModel.setProperty("/elementSurveys", {});
        oViewModel.setProperty("/surveyCloseButtonVisible", false);
        oViewModel.setProperty("/surveyUIElements", []);
        oViewModel.setProperty("/headerVisible", false);
        oViewModel.setProperty("/currentCellValueDescription", []);
        oViewModel.setProperty("/introSteps", []);
        oViewModel.setProperty("/footerButtons", []);
        oViewModel.setProperty("/formSections", []);
        oViewModel.setProperty("/allSectionsClicked", false);
        oViewModel.setProperty("/newElement", {
          Value: null,
          RowIid: null,
          PlaceHolder: null,
          ParentName: null,
        });
        oViewModel.setProperty("/beforeAddFreeFormData", {});

        oViewModel;

        this.hasChanges = false;

        this._removeAllMessages();

        this._oIntro = null;
        this._sIntro = false;
      },
      _onPatternMatched: function (oEvent) {
        if (sap.ushell.Container) {
          var oRenderer = sap.ushell.Container.getRenderer("fiori2");
          oRenderer.setHeaderVisibility(false, false, ["app"]);
        }
        /*Initiate view data*/
        this._initializeViewModel();

        /*Close busy dialog*/
        this.getUIHelper().setListViewBusy(false);

        var sAppraisalId = oEvent.getParameter("arguments").appraisalId;
        var oViewModel = this.getModel("formDetailsModel");
        var oFormData = this.getUIHelper().getCurrentForm();
        //console.log(oFormData);
        //Set form data and appraisal id
        oViewModel.setProperty("/currentForm", oFormData);
        oViewModel.setProperty("/appraisalId", sAppraisalId);

        //Get other details form
        this._getDocumentDetail();
      },
      _setHeaderOthersVisibility: function (sVal) {
        $("#idOthersHeaderSection").css("display", sVal);
      },
      _setHeaderAppraiserVisibility: function (sVal) {
        $("#idAppraiserHeaderSection").css("display", sVal);
      },
      _setHeaderStatusVisibility: function (sVal) {
        $("#idStatusHeaderSection").css("display", sVal);
      },
      _getDocumentDetail: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        var oFormData = {};
        var aFormProp = [];
        var aFilters = [];
        var sHasErrors = false;

        //Set header others invisible
        this._setHeaderOthersVisibility("none");
        this._setHeaderAppraiserVisibility("none");
        this._setHeaderStatusVisibility("none");

        var sQuery =
          "/DocumentOperationsSet(AppraisalId=guid'" +
          oViewModel.getProperty("/appraisalId") +
          "',PartApId='0000')";
        var sExpand =
          "BodyElements,BodyColumns,BodyCells,BodyCellValues," +
          "BodyCellRanges,BodyElementButtons,HeaderAppraisee," +
          "HeaderAppraiser,HeaderOthers,HeaderDates,HeaderDisplay," +
          "HeaderText,HeaderStatus,DocProcessing,Buttons,DocTab,Return," +
          "FeAlreadyChosen,FeFlatAvailable,FeSelectableOtype,FeStrucAvailable," +
          "FeBodyElementsAdd,ReturnOp,FormQuestions,FormAnswers,Competencies,Objectives,FormParameters,ResultTable,StatusNotes";

        aFilters.push(
          new sap.ui.model.Filter("Mode", sap.ui.model.FilterOperator.EQ, "X")
        );

        this._openBusyFragment("formDetailPrepared", []);
        //this._addFormActions();
        oModel.read(sQuery, {
          urlParameters: {
            $expand: sExpand,
          },
          filters: aFilters,
          success: function (oData, oResponse) {
            var aFormProp = sExpand.split(",");
            for (var i = 0; i < aFormProp.length; i++) {
              if (oData[aFormProp[i]].hasOwnProperty("results")) {
                oFormData[aFormProp[i]] = oData[aFormProp[i]].results;
              } else {
                oFormData[aFormProp[i]] = oData[aFormProp[i]];
              }
            }

            oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/headerVisible", true);
            oViewModel.setProperty("/formData", oFormData);
            //console.log(oFormData);
            oViewModel.setProperty("/formProp", aFormProp);
            that._formBodyElementsObject();
            that._formBodyColumnsObject();
            that._formBodyCellsObject();
            that._cloneComparisonObjects();
            that._formElementSurveysObject();
            that._formParametersObject();
            that._prepareSideBarData();
            that._buildUINew();

            that._closeBusyFragment();

            that._refreshAttachmentList();

            /*if (that.getUIHelper().getShowHint()) {
						var oCurrentFormData = that.getUIHelper().getCurrentForm();
						if (oCurrentFormData.ShowIntro) {
							that.onShowIntro();
						}
					}*/
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  true
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            oViewModel.setProperty("/formData", oFormData);
            oViewModel.setProperty("/formProp", aFormProp);
          },
        });
      },

      _setChangeListeners: function (sSet) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oCellsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyCells")
        );
        var oElementsModel = new sap.ui.model.Binding(
          oViewModel,
          "/",
          oViewModel.getContext("/bodyElements")
        );
        if (sSet) {
          oCellsModel.attachChange(function (oEvent) {
            if (!that._compareClonedObjects()) {
              that.hasChanges = true;
            }
          });

          oElementsModel.attachChange(function (oEvent) {
            if (!that._compareClonedObjects()) {
              that.hasChanges = true;
            }
          });

          that.hasChanges = false;
        } else {
          oCellsModel.detachChange(function () {
            that.hasChanges = false;
          });
          oElementsModel.detachChange(function () {
            that.hasChanges = false;
          });
        }
      },

      _refreshAttachmentList: function () {
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;

        /*Initiate attachment list*/
        oViewModel.setProperty("/attachmentCollection", {});

        var oUrlParams = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
        };

        var oAttCollection = {};

        oModel.callFunction("/GetAttachmentList", {
          method: "GET",
          urlParameters: oUrlParams,
          success: function (oData, oResponse) {
            $.each(oData.results, function (sIndex, oLine) {
              if (!oAttCollection.hasOwnProperty(oLine.RowIid)) {
                oAttCollection[oLine.RowIid] = {
                  attachmentList: [],
                };
              }
              oLine.Type = oLine.Type.toLowerCase();
              oAttCollection[oLine.RowIid].attachmentList.push(oLine);
            });
            oViewModel.setProperty("/attachmentCollection", oAttCollection);

            that._setChangeListeners(true);
            that.hasChange = false;
          },
          error: function (oError) {
            that.hasChange = false;
          },
        });
      },
      onNavItemSelected: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var aNavigationData = oViewModel.getProperty("/navigationData");

        var oElement = _.find(aNavigationData, [
          "RowIid",
          oEvent.getParameter("rowIid"),
        ]);
        try {
          if (
            oElement &&
            !_.isEqual(this._oNavContainer.getCurrentPage(), oElement.Page)
          ) {
            this._oNavContainer.to(oElement.Page.getId());
            oViewModel.setProperty("/navigationFormId", oElement.ElementId);
            if (oViewData.formParameters["LAST_ROW"] === oElement.ElementId) {
              oViewModel.setProperty("/saveAndKeepButtonVisibility", false);
            } else {
              oViewModel.setProperty("/saveAndKeepButtonVisibility", true);
            }
          }
        } catch (oEx) {
          jQuery.sap.log.error("Navigation failed:" + oElement);
        }
      },
      /**
       * Build UI of performance form
       * @function
       * @private
       */
      _getToolbarTemplateNew: function () {
        var that = this;

        this._adjustButtonsNew();

        var oActionButton = new sap.m.Button({
          text: "{formDetailsModel>Text}",
          visible: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
            ],
            formatter: function (sAvailability, sStatusRelevant) {
              if (sAvailability === "" || sAvailability === "B") {
                return true;
              } else {
                return false;
              }
            },
          },
          enabled: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>/saveAndKeepButtonVisibility",
              },
            ],
            formatter: function (
              sAvailability,
              sStatusRelevant,
              sId,
              sEnabled
            ) {
              if (sId === "SAVE&KEEP" || sId === "NEXT&KEEP") {
                return sEnabled;
              }

              if (sAvailability === "" || sAvailability === "B") {
                if (sStatusRelevant) {
                  return true;
                } else {
                  return true;
                }
              } else {
                return false;
              }
            },
          },
          type: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              if (sStatusRelevant === true) {
                return "Emphasized";
                next;
              }

              if (
                sId === "SAVE" ||
                sId === "SAVE&KEEP" ||
                sId === "NEXT&KEEP"
              ) {
                return "Emphasized";
              }

              if (sId === "CANCEL") {
                return "Reject";
              }

              if (sId === "USER_GUIDE") {
                return "Accept";
              }

              return "Default";
            },
          },
          tooltip: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>Text",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sText, sIcon) {
              switch (sId) {
                case "USER_GUIDE":
                  return that.getText("userGuideTooltip");
                default:
                  return sText;
              }
            },
          },
          icon: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              switch (sId) {
                case "SAVE":
                  return "sap-icon://save";
                case "SAVE&KEEP":
                  return "sap-icon://open-command-field";
                case "NEXT&KEEP":
                  return "sap-icon://feeder-arrow";
                case "CANCEL":
                  return "sap-icon://sys-cancel-2";
                case "PRINT":
                  return "sap-icon://print";
                case "STAT_LOG":
                  return "sap-icon://notes";
                case "USER_GUIDE":
                  return sIcon;
              }
            },
          },
          press: that._handleActionButtonPressed.bind(this),
        }).addStyleClass("sapUiTinyMarginEnd");

        /*Add custom data 2 for binding*/
        var oButtonId = new sap.ui.core.CustomData({
          key: "ButtonId",
          value: "{formDetailsModel>Id}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oButtonId);
        var oStatusRelevant = new sap.ui.core.CustomData({
          key: "StatusRelevant",
          value: "{formDetailsModel>StatusRelevant}",
        });
        oActionButton.addCustomData(oStatusRelevant);
        var oStatusNoteAvailability = new sap.ui.core.CustomData({
          key: "StatusNoteAvailability",
          value: "{formDetailsModel>StatusNoteAvailability}",
        });
        oActionButton.addCustomData(oStatusNoteAvailability);
        var oEmphasize = new sap.ui.core.CustomData({
          key: "IsEmphasized",
          value:
            "{= ${formDetailsModel>StatusRelevant} ? 'Emphasized' : 'None'}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oEmphasize);
        var oTargetSection = new sap.ui.core.CustomData({
          key: "TargetSection",
          value: "{formDetailsModel>TargetSection}",
        });
        oActionButton.addCustomData(oTargetSection);

        /*var oToolbar = new sap.m.Toolbar();
			oToolbar.bindAggregation("content", {
				path: "formDetailsModel>/footerButtons",
				template: oActionButton
			});*/

        return oActionButton;
      },
      _buildUINew: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var aTabs = _.filter(oViewData.formData.DocTab, ["Tab", "X"]);
        var aNavigationData = [];
        var that = this;

        $.each(aTabs, function (sIndex, oTab) {
          if (
            oTab.ElementType !== "VA" &&
            oViewData.bodyElements[oTab.RowIid].Availability !== "H"
          ) {
            var oElement = _.find(oViewData.formData.BodyElements, [
              "RowIid",
              oTab.RowIid,
            ]);

            var oButtonRow = new sap.m.FlexBox({
              direction: "Row",
            }).bindAggregation("items", {
              path: "formDetailsModel>/footerButtons",
              template: that._getToolbarTemplateNew(),
            });

            var oToolbar = new sap.m.OverflowToolbar({
              content: [new sap.m.ToolbarSpacer(), oButtonRow],
            }).addStyleClass("hapPageFooter");
            // var oButton = new sap.m.Button({
            //   icon: "sap-icon://open-command-field",
            //   text: "Kaydet ve Devam Et",
            //   type: "Emphasized",
            //   enabled: "{formDetailsModel>/saveAndKeepButtonVisibility}",
            //   press: that._handleActionButtonPressed.bind(that),
            // });

            // var oButtonId = new sap.ui.core.CustomData({
            //   key: "ButtonId",
            //   value: "SAVE&KEEP",
            //   writeToDom: true,
            // });
            // oButton.addCustomData(oButtonId);

            // var oToolbar = new sap.m.OverflowToolbar({
            //   content: [new sap.m.ToolbarSpacer(), oButtonRow, oButton],
            // }).addStyleClass("hapPageFooter");

            var oPage = new sap.m.Page({
              title:
                "{formDetailsModel>/bodyElements/" + oTab.RowIid + "/Name}",
              showNavButton: true,
              showFooter: true,
              floatingFooter: false,
              navButtonPress: function () {
                that._doNavToMain();
              },
              footer: oToolbar,
            }).addStyleClass("hapPage");

            var oCell = _.filter(oViewData.formData.BodyCells, {
              RowIid: oTab.RowIid,
              ColumnIid: that._sWeightColumn,
            });
            var sName;
            if (oCell[0].ValueString !== "") {
              sName =
                oElement.Name +
                " (" +
                oCell[0].ValueString +
                oCell[0].ValueText +
                ")";
            } else {
              sName = oElement.Name;
            }
            aNavigationData.push({
              RowIid: oTab.RowIid,
              ElementType: oTab.ElementType,
              ElementId: oTab.ElementId,
              Name: sName,
              Children: [],
              Icon: oTab.TabIcon,
              Page: oPage,
            });

            var oPageLayout = new sap.uxap.ObjectPageLayout({
              enableLazyLoading: true,
            });

            that._buildObjectPageLayoutContent(
              oPageLayout,
              oTab.RowIid,
              oViewData
            );

            oPage.addContent(oPageLayout);

            that._oNavContainer.addPage(oPage);

            if (!that._oNavContainer.getInitialPage()) {
              that._oNavContainer.setInitialPage(oPage);
              that._oNavContainer.to(oPage.getId());
            }
          }
        });

        oViewModel.setProperty("/navigationData", aNavigationData);
      },
      _buildObjectPageLayoutContent: function (
        oPageLayout,
        sRowIid,
        oViewData
      ) {
        //var aChildren = _.filter(oViewData.formData.BodyElements, ["Parent": sRowIid]);
        var aChildren = _.filter(
          oViewData.formData.BodyElements,
          function (oElem) {
            return oElem.Parent === sRowIid && oElem.Availability !== "H";
          }
        );
        var that = this;

        $.each(aChildren, function (sIndex, oChild) {
          var oSection = new sap.uxap.ObjectPageSection({
            title:
              "{formDetailsModel>/bodyElements/" + oChild.RowIid + "/Name}",
            //sadece 1 page section varsa title olmasın zira boşluk yapıyor
            showTitle: false,
            titleUppercase: false,
          }).addStyleClass("sapUiNoContentPadding");

          that._addSubSections(oSection, oViewData, oChild.RowIid);

          oPageLayout.addSection(oSection);
        });
      },
      /**
       * Add root section in case of there ise no doc tab config
       * @function
       * @private
       */
      _addUIElement: function (sRowIid, sUIType, sColumnIid, oElem) {
        var oViewModel = this.getModel("formDetailsModel");
        var aFormUIElements = oViewModel.getProperty("/formUIElements");
        var oElemRow = {
          RowIid: sRowIid,
          UIType: sUIType,
          ColumnIid: sColumnIid,
          UIElement: oElem,
        };

        aFormUIElements.push(oElemRow);

        oViewModel.setProperty("/formUIElements", aFormUIElements);
      },
      _addRootSection: function (oViewData) {
        var sRowIid = this._getValueUsingAttribute(
          oViewData,
          "BodyElements",
          "ElementType",
          "VA",
          "RowIid"
        );
        var sElemName = this._getValueUsingAttribute(
          oViewData,
          "BodyElements",
          "ElementType",
          "VA",
          "Name"
        );

        var oSection = new sap.uxap.ObjectPageSection({
          title: sElemName,
          titleUppercase: false,
        });

        this._addUIElement(sRowIid, "Section", null, oSection);

        this._addSubSections(oSection, oViewData, sRowIid);

        this._oPageLayout.addSection(oSection);
      },
      /**
       * Add sections according to the doc tab
       * @function
       * @private
       */
      _addSections: function (oViewData) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aSections = [];
        var sRowFeedBack;
        var sRowDevStatu;
        var sRowPerResult;

        sRowFeedBack = oViewData.formParameters["FORM_VB_ROW_FEEDBACK"];
        sRowDevStatu = oViewData.formParameters["FORM_VB_DP_DEVSTATU"];
        sRowPerResult = oViewData.formParameters["FORM_VB_ROW_PER_RESULT"];

        $.each(oViewData.formData.DocTab, function (sIndex, oDocTab) {
          if (oViewData.bodyElements.hasOwnProperty(oDocTab.RowIid)) {
            if (
              oDocTab.Tab === "X" &&
              oDocTab.ElementType !== "VA" &&
              oViewData.bodyElements[oDocTab.RowIid].Availability !== "H" &&
              oDocTab.ElementId !== sRowFeedBack
            ) {
              /*Hide feedback tab*/
              var sElemName = oViewData.bodyElements[oDocTab.RowIid].Name;
              var sElemId = oViewData.bodyElements[oDocTab.RowIid].ElementId;

              var oSection = new sap.uxap.ObjectPageSection({
                title: sElemName,
                titleUppercase: false,
              })
                .addStyleClass("sapUiNoContentPadding")
                .addStyleClass("hapSection");
              aSections.push({
                element: oSection,
                clicked: false,
              });
              that._addUIElement(oDocTab.RowIid, "Section", null, oSection);
              if (sElemId === sRowDevStatu) {
                that._addResultSubSection(oSection, oViewData, oDocTab.RowIid);
              } else if (sElemId === sRowPerResult) {
                that._addPerformanceReportSection(
                  oSection,
                  oViewData,
                  oDocTab.RowIid
                );
              } else {
                that._addSubSections(oSection, oViewData, oDocTab.RowIid);
              }

              that._oPageLayout.addSection(oSection);
            }
          } else {
            jQuery.sap.log.error(
              "Bulunamayan satır: " + oDocTab.RowIid + "-" + oDocTab.Name
            );
          }
        });

        try {
          this._oPageLayout.setSelectedSection(
            this._oPageLayout.getSections()[0].getId()
          );

          aSections[0].clicked = true;
          oViewModel.setProperty("/formSections", aSections);

          this._adjustButtons();
        } catch (err) {
          MessageBox.warning("Formda görüntülenecek öğe bulunamadı!");
        }
      },
      onSectionNavigate: function (oEvent) {
        this._markSectionAsClicked(oEvent.getParameter("section").getId());
        this._adjustButtons();
      },

      _navigateToSection: function (sSection) {
        this._oPageLayout.setSelectedSection(sSection);
        this._markSectionAsClicked(sSection);
        this._adjustButtons();
      },
      _markSectionAsClicked: function (sSection) {
        var oViewModel = this.getModel("formDetailsModel");
        var aSections = oViewModel.getProperty("/formSections");
        var sAllClicked = true;

        $.each(aSections, function (sKey, oSection) {
          if (oSection.element.getId() === sSection) {
            oSection.clicked = true;
          }
          if (!oSection.clicked) {
            sAllClicked = false;
          }
        });

        oViewModel.setProperty("/allSectionsClicked", sAllClicked);

        oViewModel.setProperty("/formSections", aSections);
      },

      _checkAllSectionsRendered: function () {
        var q = $.Deferred();
        var aSections = this._oPageLayout.getSections();
        var that = this;
        try {
          document.body.addEventListener(
            "DOMNodeInserted",
            function (event) {
              try {
                if (event.hasOwnProperty("path")) {
                  if (
                    event.path.indexOf(
                      $("section[id*='idDetailObjectPageLayout-anchorBar'")[0]
                    ) !== -1
                  ) {
                    setTimeout(function () {
                      q.resolve();
                    }, 1000);
                    document.body.removeEventListener("DOMNodeInserted", that);
                  }
                } else if (event.hasOwnProperty("currentTarget")) {
                  if (
                    event.currentTarget.id ==
                    $("section[id*='idDetailObjectPageLayout-anchorBar'")[0]
                  ) {
                    setTimeout(function () {
                      q.resolve();
                    }, 1000);
                    document.body.removeEventListener("DOMNodeInserted", that);
                  }
                } else {
                  setTimeout(function () {
                    q.resolve();
                  }, 3000);
                  document.body.removeEventListener("DOMNodeInserted", that);
                }
              } catch (oErr) {
                setTimeout(function () {
                  q.resolve();
                }, 3000);
                document.body.removeEventListener("DOMNodeInserted", that);
              }
            },
            false
          );
        } catch (oErr) {
          setTimeout(function () {
            q.resolve();
          }, 3000);
          document.body.removeEventListener("DOMNodeInserted", that);
        }

        return q.promise();
      },
      onShowIntro: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var aUIElements = oViewModel.getProperty("/formUIElements");
        var aSteps = oViewModel.getProperty("/introSteps");
        var that = this;

        var _doShowIntro = function () {
          that._oPageLayout.setSelectedSection(
            that._oPageLayout.getSections()[0].getId()
          );
          that._adjustButtons();
          that._sIntro = true;
          if (aSteps.length === 0) {
            that._oIntro = introJs();
            for (var i = 0; i < aUIElements.length; i++) {
              if (aUIElements[i].UIType === "Section") {
                that._addIntro(aUIElements[i].UIElement, aUIElements[i].RowIid);
              }
            }

            //that._addGenericIntro();

            aSteps = oViewModel.getProperty("/introSteps");
            that._oIntro.setOptions({
              steps: aSteps,
              showProgress: true,
              tooltipPosition: "bottom",
              positionPrecedence: ["bottom", "top", "right", "left"],
            });

            that._oIntro.oncomplete(function () {
              that.getUIHelper().setShowHint(false);
              that._oPageLayout.setSelectedSection(
                that._oPageLayout.getSections()[0].getId()
              );
            });
            that._oIntro.onbeforechange(function () {
              return [that._oPageLayout, true];
            });
            that._oIntro.onexit(function () {
              that._oPageLayout.setSelectedSection(
                that._oPageLayout.getSections()[0].getId()
              );
            });
          }

          if (aSteps.length > 0) {
            that._oIntro.start();
          } else {
            MessageToast.show("Dokümantasyon bulunamadı");
          }
        };
        if (oEvent) {
          if (that._oPageLayout.getSections().length > 0) {
            _doShowIntro();
          }
        } else {
          var y = $.when(this._checkAllSectionsRendered());
          y.done(function (a) {
            if (that._oPageLayout.getSections().length > 0) {
              _doShowIntro();
            }
          });
        }
      },
      _addGenericIntro: function (oSection, sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aSteps = oViewModel.getProperty("/introSteps");
        var aHapButtons = oViewModel.getProperty("/formData/Buttons");
        var sAppVisible = false;

        /*Check whether APPROVE button visible*/
        for (var i = 0; i < aHapButtons.length; i++) {
          if (aHapButtons[i].Id === "APPROVE") {
            if (
              aHapButtons[i].Availability === "" ||
              aHapButtons[i].Availability === "B"
            ) {
              sAppVisible = true;
            }
            break;
          }
        }

        if (sAppVisible) {
          aSteps.push({
            //element: "#" + $("button[data-buttonid='APPROVE']").attr("id"),
            intro:
              "Gelişim planı içeriğinde yer alan tüm bölümler gözden geçirildiğinde, 'Onayla' seçeneği aktif hale gelir.",
          });

          oViewModel.setProperty("/introSteps", aSteps);
        }
      },
      _addIntro: function (oSection, sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aSteps = oViewModel.getProperty("/introSteps");
        var sDetail = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/Description"
        );
        var sHeader =
          "<p style='font-size:1rem'><b>" +
          oViewModel.getProperty("/bodyElements/" + sRowIid + "/Name") +
          "</b></p>";
        sDetail = sHeader + sDetail;

        if (sap.ui.Device.system.phone) {
          aSteps.push({
            intro: sDetail,
          });
        } else {
          aSteps.push({
            element: "#" + $("span[id*='" + oSection.getId() + "']")[1].id,
            intro: sDetail,
          });
        }
      },
      /**
       * Add performance report subsection as dashboard
       * @function
       * @private
       */
      _handlePerformanceReportNav: function (oEvent) {
        var oNavCon = this.byId("idPerformanceReportNavCon");
        var oSource = oEvent.getSource();
        var sTarget = oSource.data("target");
        var that = this;

        if (sTarget) {
          var sRowIid = oSource.data("elementRowIid");
          var sName = oSource.data("elementName");
          var sStyle = oSource.data("elementStyle");
          var oViewModel = this.getModel("formDetailsModel");
          var sHeader = oSource.getHeader();

          var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
          var oBodyCells = oViewModel.getProperty("/bodyCells");
          var oBodyElements = oViewModel.getProperty("/bodyElements");
          var oFormParameters = oViewModel.getProperty("/formParameters");
          var aData = [];
          var aPopData = [];
          var sPopIndex = 0;
          var sRowPerResult = oFormParameters["FORM_VB_ROW_PER_RESULT"];

          $.each(aBodyElements, function (sIndex, oElement) {
            if (oElement.Parent === sRowIid) {
              aData.push({
                Name: oElement.Name,
                Value:
                  oBodyCells[oElement.RowIid][that._sFinAppColumn].ValueNum,
              });

              /*GENEL DEĞERLENDİRME İSE PUAN ÇIKARMAYA GEREK YOK*/
              if (oBodyElements[sRowIid].ElementId !== sRowPerResult) {
                if (
                  oBodyCells[oElement.RowIid].hasOwnProperty(
                    that._sObjMeaColumn
                  )
                ) {
                  var sChildValueExp = formatter.convertToIntegerDecimal(
                    oBodyCells[oElement.RowIid][that._sExpValColumn].ValueNum
                  );
                  var sChildValueRea = formatter.convertToIntegerDecimal(
                    oBodyCells[oElement.RowIid][that._sReaValColumn].ValueNum
                  );
                  aPopData.push({
                    Index: sPopIndex,
                    ElementName: oElement.Name,
                    ExpectedValue:
                      (oBodyCells[oElement.RowIid][that._sObjMeaColumn]
                        .ValueText === "Eşit"
                        ? ""
                        : oBodyCells[oElement.RowIid][that._sObjMeaColumn]
                            .ValueText + " ") +
                      sChildValueExp +
                      " " +
                      oBodyCells[oElement.RowIid][that._sObjUniColumn]
                        .ValueText,
                    RealizedValue: sChildValueRea,
                  });
                  sPopIndex++;
                } else {
                  var oChildPopData = {};
                  oChildPopData.Index = sPopIndex;
                  oChildPopData.Values = [];
                  $.each(aBodyElements, function (sChild, oChildElement) {
                    if (oChildElement.Parent === oElement.RowIid) {
                      oChildPopData.Values.push({
                        ElementName: oChildElement.Name,
                        FinalAppraisal:
                          oBodyCells[oChildElement.RowIid][that._sFinAppColumn]
                            .ValueTxt,
                      });
                    }
                  });
                  if (oChildPopData.Values.length > 0) {
                    aPopData.push(oChildPopData);
                  }
                  sPopIndex++;
                }
              }
            }
          });

          /*First calculate graph data*/
          var oGraphModel = new JSONModel({
            PerfData: aData,
          });

          this._oPerfReportPage2Title.setText(sHeader);

          var oVizProp = this._oPerfGraph.getVizProperties();

          oVizProp.plotArea.colorPalette = [$(sStyle).css("backgroundColor")];

          this._oPerfGraph.setVizProperties(oVizProp);
          this._oPerfGraph.data("PopData", aPopData);
          //console.log(aPopData);

          this._oPerfGraph.setModel(oGraphModel);
          /*First calculate graph data*/
          if (this._oPopOver) {
            this._oPopOver.destroy();
          }
          this._oPerfReportNavCon.to(this._oPerfReportPage2.getId());

          if (aPopData.length > 0) {
            var _showGraphNotice = function () {
              MessageToast.show("Detaylar için grafiğe tıklayınız...", {
                duration: 5000, // default
                width: "300px", // default
                my: "center center", // default
                at: "center center", // default
              });
            };
            jQuery.sap.delayedCall(500, this, _showGraphNotice, []);
          }
        } else {
          this._oPerfReportNavCon.back();
        }
      },
      _addPerformanceReportSection: function (oSection, oViewData, sRowIid) {
        var that = this;
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");
        this._addUIElement(sRowIid, "SubSection", null, oSubSection);

        var oNavCon = new sap.m.NavContainer({
          defaultTransitionName: "flip",
          width: "98%",
          height: "450px",
        });

        this._oPerfReportNavCon = oNavCon;

        var oPage1 = new sap.m.Page({
          showFooter: false,
          showHeader: false,
        });

        this._oPerfReportPage1 = oPage1;

        var oMainBox = new sap.m.FlexBox({
          direction: "Column",
          alignItems: "Center",
          justifyContent: "Center",
        });

        var oBoxLine1 = new sap.m.FlexBox({
          alignItems: "Center",
          justifyContent: "Center",
        });

        var oBoxLine2 = new sap.m.FlexBox({
          alignItems: "Center",
          justifyContent: "Center",
        }).addStyleClass("sapUiMediumMarginTop");

        oMainBox.addItem(oBoxLine1);
        oMainBox.addItem(oBoxLine2);

        oMainBox.addStyleClass("sapUiMediumMarginTop");

        //var oMainGrid = new sap.ui.layout.Grid();

        var _addTile = function (oEl, oBox, sSecond) {
          var sRowPerResult =
            oViewData.formParameters["FORM_VB_ROW_PER_RESULT"];
          var oTile = new sap.m.GenericTile({
            header:
              "{= ${formDetailsModel>/bodyElements/" +
              oEl.RowIid +
              "/ElementId} === '" +
              sRowPerResult +
              "' ? 'GENEL DEĞERLENDİRME PUANI' : '" +
              oEl.Name +
              "' }",
            press: [that._handlePerformanceReportNav, that],
            tooltip: "{i18n>clickForDetails}",
          }).addStyleClass("hapPerfResultTile");

          oTile.addStyleClass("sapUiLargeMarginEnd");
          oTile.addStyleClass("hapPerfResultTileLevel" + oEl.ApLevel);

          oTile.data("target", "PerformanceReportPage2");
          oTile.data("elementRowIid", oEl.RowIid);
          oTile.data("elementName", oEl.Name);
          oTile.data("elementStyle", ".hapPerfResultTileLevel" + oEl.ApLevel);

          var oTileContent = new sap.m.TileContent();

          var oNumericContent = new sap.m.NumericContent({
            value:
              "{formDetailsModel>/bodyCells/" +
              oEl.RowIid +
              "/" +
              that._sFinAppColumn +
              "/ValueNum}",
            valueColor:
              "{= ${formDetailsModel>/bodyCells/" +
              oEl.RowIid +
              "/" +
              that._sFinAppColumn +
              "/ValueNum} < 3 ? 'Error' : 'Good' }",
          });

          oTileContent.setContent(oNumericContent);

          oTile.addTileContent(oTileContent);

          oBox.addItem(oTile);
        };

        $.each(oViewData.bodyElements, function (sIndex, oElement) {
          if (oElement.RowIid === sRowIid) {
            _addTile(oElement, oBoxLine1, false);
          }

          if (oElement.Parent === sRowIid) {
            _addTile(oElement, oBoxLine2, true);
          }
        });

        oPage1.addContent(oMainBox);

        var oPage2 = new sap.m.Page({
          showHeader: true,
          showFooter: false,
        }).addStyleClass("hapPerfResultPageGraph");

        var oPage2Title = new sap.m.Title();
        var oBar = new sap.m.Bar({
          contentLeft: [
            new sap.m.Button({
              icon: "sap-icon://close-command-field",
              text: "{i18n>returnTo}",
              press: [that._handlePerformanceReportNav, that],
            }).addStyleClass("hapButtonWhite"),
          ],
          contentMiddle: [oPage2Title],
        });

        oPage2.setCustomHeader(oBar);

        this._oPerfReportPage2 = oPage2;
        this._oPerfReportPage2Title = oPage2Title;

        /*Set graph properties*/
        var oPerfGraph = new VizFrame({
          height: "80%",
          width: "100%",
          vizType: "column",
          uiConfig: {
            applicationSet: "fiori",
            showErrorMessage: true,
          },
          selectData: that._onSelectGraphData.bind(that),
        }).addStyleClass("sapUiMediumMarginTop");

        var oGraphModel = new JSONModel({
          PerfData: [],
        });

        oPerfGraph.setModel(oGraphModel);

        oPerfGraph.setVizProperties({
          plotArea: {
            dataLabel: {
              visible: true,
              formatString: CustomChartFormatter.HAP_NUM_FORMATTER,
            },
            primaryScale: {
              minValue: 0,
              maxValue: 5,
              fixedRange: true,
            },
          },
          valueAxis: {
            // label: {
            // 	formatString: formatPattern.SHORTFLOAT
            // },
            title: {
              visible: true,
              text: "Puan",
            },
          },
          categoryAxis: {
            title: {
              visible: false,
            },
          },
          legend: {
            visible: false,
          },
          title: {
            visible: false,
          },
        });

        var oDataSet = new FlattenedDataset({
          data: "{/PerfData}",
        });

        oDataSet.addDimension(
          new DimensionDefinition({
            name: "Name",
            value: "{Name}",
          })
        );

        oDataSet.addMeasure(
          new MeasureDefinition({
            name: "Value",
            value: "{Value}",
          })
        );

        oPerfGraph.addFeed(
          new FeedItem({
            uid: "valueAxis",
            type: "Measure",
            values: ["Value"],
          })
        );

        oPerfGraph.addFeed(
          new FeedItem({
            uid: "categoryAxis",
            type: "Dimension",
            values: ["Name"],
          })
        );

        oPerfGraph.setDataset(oDataSet);

        this._oPerfGraph = oPerfGraph;

        // var oClickNotice = new sap.m.MessageStrip({
        // 	type: "Warning",
        // 	text: "Detaylar için grafiğe tıklayınız...",
        // 	showIcon: true
        // }).addStyleClass("sapUiSmallMarginTop");
        // oPage2.addContent(oClickNotice);
        oPage2.addContent(oPerfGraph);

        oNavCon.addPage(oPage1);
        oNavCon.addPage(oPage2);

        oSubSection.addBlock(oNavCon);

        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },
      _onSelectGraphData: function (oEvent) {
        var aPopData = this._oPerfGraph.data("PopData");
        var data = oEvent.getParameter("data");

        if (this._oGraphPopover) {
          this._oGraphPopover.close();
          this._oGraphPopover.destroyContent();
        } else {
          this._oGraphPopover = new sap.m.Popover({
            placement: "Top",
          });
        }

        try {
          if (data[0].data.Value) {
            this._oGraphPopover.destroyFooter();
            var divStr = "";
            var sIndex = data[0].data._context_row_number;
            this._oGraphPopover.setTitle(data[0].data.Name);
            if (aPopData[0].hasOwnProperty("ExpectedValue")) {
              divStr =
                "<div class='hapPopoverContainer'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple'>Beklenen Değer</th>" +
                "<th class='hapPopoverBgBlue'>Gerçekleşen Değer</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>" +
                "<tr>" +
                "<td>" +
                aPopData[sIndex].ExpectedValue +
                "</td>" +
                "<td>" +
                aPopData[sIndex].RealizedValue +
                "</td>" +
                "</tr>" +
                "</tbody>" +
                "</table></div>";
              this._oGraphPopover.setFooter(
                new sap.m.Button({
                  type: "Accept",
                  text: "Hesaplama Detayı",
                  press: function () {
                    window.open(
                      "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/2017_BGDS_De%C4%9Ferlendirme%20Kriterleri.pdf",
                      "_blank"
                    );
                  },
                  width: "95%",
                }).addStyleClass("sapUiTinyMargin")
              );
            } else if (aPopData[0].hasOwnProperty("Values")) {
              divStr =
                "<div class='hapPopoverContainerLarge'>" +
                "<table class='hapPopoverTable'>" +
                "<thead>" +
                "<tr>" +
                "<th class='hapPopoverBgPurple hapPopoverColumnLarge'>Yetkinlik Adı</th>" +
                "<th class='hapPopoverBgBlue'>Puan</th>" +
                "</tr>" +
                "</thead>" +
                "<tbody>";
              for (var i = 0; i < aPopData[sIndex].Values.length; i++) {
                divStr =
                  divStr +
                  "<tr>" +
                  "<td class='hapPopoverAlignLeft'>" +
                  aPopData[sIndex].Values[i].ElementName +
                  "</td>" +
                  "<td>" +
                  aPopData[sIndex].Values[i].FinalAppraisal +
                  "</td>" +
                  "</tr>";
              }

              divStr = divStr + "</tbody>" + "</table></div>";
            }
            this._oGraphPopover.addContent(
              new sap.ui.core.HTML({
                content: divStr,
              })
            );

            this._oGraphPopover.openBy(data[0].target);
          }
        } catch (oErr) {
          jQuery.sap.log.error(oErr);
        }
      },
      _getPopoverProps: function () {
        var aPopData = this._oPerfGraph.data("PopData");
        var that = this;
        return {
          customDataControl: function (data) {
            try {
              if (data.data.val) {
                var sIndex = data.data.val[1].value;

                var _changeHeader = function () {
                  $(
                    $('[data-sap-ui*="vizHeaderBar-popoverHeaderTitle"]')[0]
                  ).html(aPopData[sIndex].ElementName);
                };
                setTimeout(_changeHeader(), 2500);

                var divStr =
                  "<div>" +
                  "<table class='hapPopoverTable'>" +
                  "<thead>" +
                  "<tr>" +
                  "<th class='hapPopoverBgPurple'>Beklenen Değer</th>" +
                  "<th class='hapPopoverBgBlue'>Gerçekleşen Değer</th>" +
                  "</tr>" +
                  "</thead>" +
                  "<tbody>" +
                  "<tr>" +
                  "<td>" +
                  aPopData[sIndex].ExpectedValue +
                  "</td>" +
                  "<td>" +
                  aPopData[sIndex].RealizedValue +
                  "</td>" +
                  "</tr>" +
                  "</tbody>" +
                  "</table></div>";
                return new sap.ui.core.HTML({
                  content: divStr,
                });
              }
            } catch (oErr) {}
          },
        };
      },

      /**
       * Add result subsections according to the body elements (Special development)
       * @function
       * @private
       */
      _addResultSubSection: function (oSection, oViewData, sRowIid) {
        var that = this;
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(sRowIid, "SubSection", null, oSubSection);
        // var oVL = new sap.ui.layout.VerticalLayout({
        // 	width: "100%"
        // }).addStyleClass("sapUiNoContentPadding");

        // this._addUIElement(sRowIid, "VerticalLayout", null, oVL);
        //this._addRow(oVL, oViewData, sRowIid, false, true);

        // Add main grid
        var oGrid = new sap.ui.layout.Grid({
          defaultSpan: "XL4 L4 M6 S12",
        });
        this._addUIElement(sRowIid, "ResultSectionGrid", null, oGrid);

        oSubSection.addBlock(oGrid);

        var _addQualificationResults = function (
          oParent,
          sParent,
          sList,
          sHeaderDesign
        ) {
          if (sList) {
            var oList = new sap.m.List();
            oParent.addAggregation("list", oList);
          }
          $.each(oViewData.bodyElements, function (sIndex, oElement) {
            if (oElement.Parent === sParent) {
              if (!sList) {
                var oHIP = new HapIndicatorPanel({
                  headerText: oElement.Name,
                });

                oHIP.setHeaderDesign(sHeaderDesign);
                _addQualificationResults(oHIP, oElement.RowIid, true);
                oParent.addHapPanel(oHIP);
              } else {
                var oListItem = new sap.m.StandardListItem({
                  title: oElement.Name,
                });
                oList.addItem(oListItem);
              }
            }
          });
        };

        var sRowStrengths = oViewData.formParameters[
          "FORM_VB_DP_STRENGTHS"
        ].substr(0, 8);
        var sRowWeakness = oViewData.formParameters[
          "FORM_VB_DP_WEAKNESS"
        ].substr(0, 8);
        var sRowOppurts = oViewData.formParameters["FORM_VB_DP_OPPURTS"].substr(
          0,
          8
        );

        $.each(oViewData.bodyElements, function (sIndex, oElement) {
          if (oElement.Parent === sRowIid) {
            var sHeaderDesign = "None";
            var oHIP = new HapIndicatorPanel({
              headerText: oElement.Name,
              headerAlign: "Center",
              headerDescription: oElement.Description,
            });

            if (oElement.ElementId === sRowStrengths) {
              sHeaderDesign = "Positive";
            } else if (oElement.ElementId === sRowOppurts) {
              sHeaderDesign = "Emphasized";
            } else if (oElement.ElementId === sRowWeakness) {
              sHeaderDesign = "Negative";
            }
            oHIP.setHeaderDesign(sHeaderDesign);
            _addQualificationResults(
              oHIP,
              oElement.RowIid,
              false,
              sHeaderDesign
            );
            oGrid.addContent(oHIP);
          }
        });

        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },

      /**
       * Add subsections according to the body elements
       * @function
       * @private
       */
      _addSubSections: function (oSection, oViewData, sRowIid) {
        var oSubSection = new sap.uxap.ObjectPageSubSection({
          title: oSection.getTitle(),
          titleUppercase: false,
          //showTitle: false,
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(sRowIid, "SubSection", null, oSubSection);

        //Add vertical layout

        var oVL = new sap.ui.layout.VerticalLayout({
          width: "100%",
        }).addStyleClass("sapUiNoContentPadding");

        this._addUIElement(sRowIid, "VerticalLayout", null, oVL);

        oSubSection.addBlock(oVL);

        this._addRowNew(oVL, oViewData, sRowIid, false, true);
        //Add subsection to section
        oSection.addSubSection(oSubSection);
      },
      /**
       * Add rows
       * @function
       * @private
       */
      _addRow: function (oParent, oViewData, sRowIid, sChild, sFirst) {
        var oViewModel = this.getModel("formDetailsModel");
        var aRowUIElements = oViewModel.getProperty("/formUIElements");
        var sExist = false;
        var that = this;

        for (var i = 0; i < aRowUIElements.length; i++) {
          if (
            aRowUIElements[i].RowIid === sRowIid &&
            aRowUIElements[i].ColumnIid === null &&
            aRowUIElements[i].UIType === "RowPanel"
          ) {
            sExist = true;
            break;
          }
        }

        var oElem = oViewData.bodyElements[sRowIid];

        if (!sExist) {
          //Add element it self
          if (oElem === undefined) {
            return;
          }

          /*4-P,4-R,6*/
          /*that._sEduColumn*/
          var oRowPanel = new sap.m.Panel({
            width: "100%",
            expandable: true,
            expanded: {
              parts: [
                {
                  path: "formDetailsModel>/formData/HeaderStatus",
                },
                {
                  path:
                    "formDetailsModel>/bodyCells/" +
                    sRowIid +
                    "/" +
                    that._sEduColumn +
                    "/ValueNum",
                },
                {
                  path: "formDetailsModel>/bodyElements/" + sRowIid,
                },
              ],
              formatter: function (oHeaderStatus, sCellValue, oBodyElement) {
                try {
                  if (
                    oBodyElement.Child === "0000" ||
                    oBodyElement.Child === ""
                  ) {
                    return false;
                  } else {
                    return true;
                  }
                  if (sCellValue === null || sCellValue === undefined) {
                    return true;
                  } else {
                    if (
                      sCellValue === "1" ||
                      sCellValue == 1 ||
                      sCellValue === "0001"
                    ) {
                      return true;
                    } else {
                      if (
                        oHeaderStatus.ApStatus === "4" &&
                        oHeaderStatus.ApStatusSub === "D"
                      ) {
                        return true;
                      } else {
                        return false;
                      }
                    }
                  }
                } catch (oErr) {
                  return true;
                }
              },
            },

            backgroundDesign: "Transparent",
          }).addStyleClass("hapRowPanel");

          oRowPanel.addStyleClass("hapRowPanelLevel" + oElem.ApLevel);

          if (sFirst) {
            oRowPanel.addStyleClass("hapRowPanelFirst");
          }

          this._addUIElement(sRowIid, "RowPanel", null, oRowPanel);

          this._addRowHeader(oRowPanel, oElem);

          var oGrid = new sap.ui.layout.Grid({
            defaultSpan: "L12 M12 S12",
          }).addStyleClass("hapRowGrid");

          this._addUIElement(sRowIid, "RowPanelGrid", null, oGrid);

          if (
            oElem.Description &&
            oElem.Description !== oElem.Name &&
            oElem.ApLevel !== "01" &&
            oElem.ApLevel !== "02"
          ) {
            var oDesc = new HapMessageStrip({
              messageType: "None",
              htmlContent:
                "{formDetailsModel>/bodyElements/" + sRowIid + "/Description}",
              visible:
                "{formDetailsModel>/bodyElements/" +
                sRowIid +
                "/DescriptionVisible}",
            });

            oDesc.addStyleClass("hapElementDescriptionLevel" + oElem.ApLevel);
            oDesc.setLayoutData(
              new sap.ui.layout.GridData({
                span: "L12 M12 S12",
              })
            );
            this._addUIElement(sRowIid, "RowDescription", null, oDesc);
            oGrid.addContent(oDesc);
          }

          var oBL = new sap.ui.layout.BlockLayout({
            background: "Default",
          }).addStyleClass("sapUiNoContentPadding");
          oGrid.addContent(oBL);
          oRowPanel.addContent(oGrid);
          oParent.addContent(oRowPanel);
          if (oElem.Availability !== "H") {
            this._addCells(oBL, sRowIid, oViewData);
          }
        }
        // Add children and brothers
        if (oElem.Child !== "0000" && oElem.Child !== sRowIid) {
          if (oViewData.bodyElements[oElem.Child].Parent === sRowIid) {
            this._addRow(oRowPanel, oViewData, oElem.Child, true, false);
          }
        }

        if (
          sChild &&
          oElem.Brother !== "0000" &&
          oElem.Brother !== sRowIid &&
          oElem.Brother !== sChild
        ) {
          this._addRow(oParent, oViewData, oElem.Brother, true, false);
        }
      },

      /**
       * Add rows - new design
       * @function
       * @private
       */
      _addRowNew: function (oParent, oViewData, sRowIid, sChild, sFirst) {
        var oViewModel = this.getModel("formDetailsModel");
        var aRowUIElements = oViewModel.getProperty("/formUIElements");
        var sExist = false;
        var that = this;
        var oRowPanel = null;

        oRowPanel = _.find(aRowUIElements, {
          RowIid: sRowIid,
          ColumnIid: null,
          UIType: "RowPanel",
        });

        if (oRowPanel) {
          sExist = true;
        }

        var oElem = oViewData.bodyElements[sRowIid];

        if (
          oElem.ElementId !==
          oViewData.formParameters["UX_NO_PANEL_HTML_CONTENT"]
        ) {
          if (!sExist) {
            //Add element it self
            if (oElem === undefined || oElem.Availability === "H") {
              return;
            }

            /*4-P,4-R,6*/
            /*that._sEduColumn*/
            oRowPanel = new sap.m.Panel({
              width: "100%",
              expandable: true,
              expanded: true,
              // {
              // 	parts: [{
              // 		path: "formDetailsModel>/formData/HeaderStatus"
              // 	}, {
              // 		path: "formDetailsModel>/bodyCells/" + sRowIid + "/" + that._sEduColumn + "/ValueNum"
              // 	}, {
              // 		path: "formDetailsModel>/bodyElements/" + sRowIid
              // 	}],
              // 	formatter: function (oHeaderStatus, sCellValue, oBodyElement) {
              // 		try {
              // 			if (oBodyElement.UsedColumns === "00" && oBodyElement.Child === "0000" && oBodyElement.ForeignType !== "Q") {
              // 				return false;
              // 			} else {
              // 				if (sCellValue === null || sCellValue === undefined) {
              // 					return true;
              // 				} else {
              // 					if (sCellValue === "1" || sCellValue == 1 || sCellValue === "0001") {
              // 						return true;
              // 					} else {
              // 						if (oHeaderStatus.ApStatus === "4" && oHeaderStatus.ApStatusSub === "D") {
              // 							return true;
              // 						} else {
              // 							return false;
              // 						}
              // 					}
              // 				}
              // 			}

              // 		} catch (oErr) {
              // 			return true;
              // 		}
              // 	}
              // },

              backgroundDesign: "Transparent",
            }).addStyleClass("hapRowPanel");

            oRowPanel.addStyleClass("hapRowPanelLevel" + oElem.ApLevel);

            if (sFirst) {
              oRowPanel.addStyleClass("hapRowPanelFirst");
            }

            this._addUIElement(sRowIid, "RowPanel", null, oRowPanel);

            //Generate Header
            this._addRowHeader(oRowPanel, oElem);

            //Create a form
            var oForm = new sap.ui.layout.form.Form({
              editable: true,
              layout: new sap.ui.layout.form.ResponsiveGridLayout({
                labelSpanXL: 12,
                labelSpanL: 12,
                labelSpanM: 12,
                labelSpanS: 12,
                adjustLabelSpan: false,
                emptySpanXL: 0,
                emptySpanL: 0,
                emptySpanM: 0,
                emptySpanS: 0,
                columnsXL: 6,
                columnsL: 6,
                columnsM: 4,
                singleContainerFullSize: true,
              }),
            });

            var oGrid = new sap.ui.layout.Grid({
              defaultSpan: "L12 M12 S12",
            }).addStyleClass("hapRowGrid");

            this._addUIElement(sRowIid, "RowPanelGrid", null, oGrid);
            this._addUIElement(sRowIid, "RowPanelForm", null, oForm);

            if (
              oElem.Description &&
              oElem.Description !== oElem.Name &&
              oElem.ApLevel !== "01" &&
              oElem.ApLevel !== "02"
            ) {
              var oDesc = new HapMessageStrip({
                messageType: "Warning",
                htmlContent:
                  "{formDetailsModel>/bodyElements/" +
                  sRowIid +
                  "/Description}",
                visible:
                  "{formDetailsModel>/bodyElements/" +
                  sRowIid +
                  "/DescriptionVisible}",
              });

              oDesc.addStyleClass("hapElementDescriptionLevel" + oElem.ApLevel);
              oDesc.setLayoutData(
                new sap.ui.layout.GridData({
                  span: "L12 M12 S12",
                })
              );
              this._addUIElement(sRowIid, "RowDescription", null, oDesc);
              oGrid.addContent(oDesc);
            }

            if (oElem.Availability !== "H") {
              this._addCellsNew(oForm, sRowIid, oViewData);
            }

            //Add form to the grid
            oGrid.addContent(oForm);

            //Add grid to Row Panel
            oRowPanel.addContent(oGrid);
            oRowPanel.addContent(oForm);

            //Add grid to the parent
            oParent.addContent(oRowPanel);
          }
        }
        // Add children and brothers
        if (oElem.Child !== "0000" && oElem.Child !== sRowIid) {
          if (oViewData.bodyElements[oElem.Child].Parent === sRowIid) {
            this._addRowNew(oRowPanel, oViewData, oElem.Child, true, false);
          }
        }

        if (
          sChild &&
          oElem.Brother !== "0000" &&
          oElem.Brother !== sRowIid &&
          oElem.Brother !== sChild
        ) {
          this._addRowNew(oParent, oViewData, oElem.Brother, true, false);
        }
      },

      /**
       * Add row toolbar
       * @function
       * @private
       */
      _addRowHeader: function (oParent, oElem) {
        var that = this;
        var sParamVal;
        var sNameElement = "";
        var oViewModel = that.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oPanelToolbar = new sap.m.OverflowToolbar();
        var sElementEditable =
          "{= ${formDetailsModel>/bodyElements/" +
          oElem.RowIid +
          "/Availability} === 'X' ? true : false }";
        var sAttachVisible =
          "{formDetailsModel>/bodyElements/" +
          oElem.RowIid +
          "/AttachmentVisible}";
        var oPanelHeader = null;
        this._addUIElement(
          oElem.RowIid,
          "RowPanelToolbar",
          null,
          oPanelToolbar
        );

        if (!oElem.FreeInput) {
          sNameElement = "NameString";
          oPanelHeader = new sap.m.Text({
            text: {
              path:
                "formDetailsModel>/bodyElements/" +
                oElem.RowIid +
                "/NameString",
            },
          });
        } else {
          sNameElement = "Name";
          oPanelHeader = new sap.m.Input({
            value: {
              path: "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name",
            },
            width: "40%",
            maxLength: 80,
            editable: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
        }
        oPanelHeader.addStyleClass("hapElementNameLevel" + oElem.ApLevel);

        this._addUIElement(oElem.RowIid, "RowPanelHeader", null, oPanelHeader);

        var oSpacer = new sap.m.ToolbarSpacer();

        var oRowIid = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: oElem.RowIid,
        });
        var oElementName = new sap.ui.core.CustomData({
          key: "elementName",
        });
        oElementName.bindProperty(
          "value",
          "formDetailsModel>/bodyElements/" + oElem.RowIid + "/" + sNameElement
        );

        oPanelToolbar.addContent(oPanelHeader);
        oPanelToolbar.addContent(oSpacer);

        // //Müdür formlarında sadece "Yeni Hedef" olacak
        // //Bölüm hedefleri zaten otomatik olarak bireysel hedeflere gelecek
        // oNewButton = new sap.m.Button({
        // 	text: "Yeni Hedef",
        // 	icon: "sap-icon://goal",
        // 	press: jQuery.proxy(that._handleAddFreeFormElement, that, {
        // 		oElem: oElem,
        // 		sObj: false
        // 	})
        // });
        // aNewButtons.push(oNewButton);
        // if (!oViewData.formParameters["UX_APPRAISAL_FORM_MANAGER"]) {
        // 	oNewButton = null;
        // 	oNewButton = new sap.m.Button({
        // 		text: "Bölüm Hedeflerinden",
        // 		icon: "sap-icon://target-group",
        // 		press: jQuery.proxy(that._handleAddFreeFormElement, that, {
        // 			oElem: oElem,
        // 			sObj: true
        // 		})
        // 	});
        // 	aNewButtons.push(oNewButton);
        // }

        sParamVal = oViewData.formParameters["FORM_VB_ROW_INDIVIDUAL_GOALS"];

        if (oElem.EnhancementVisible) {
          if (oElem.ElementId !== sParamVal) {
            var oAddButton = new sap.m.Button({
              icon: "sap-icon://add",
              text: "{i18n>labelAddElement}",
              type: "Accept",
              press: that._handleAddFormElement.bind(that),
              enabled: sElementEditable,
            });
            oAddButton.addCustomData(oRowIid);
            oAddButton.addCustomData(oElementName);

            oPanelToolbar.addContent(oAddButton);
            this._addUIElement(oElem.RowIid, "RowAddButton", null, oAddButton);
          } else {
            var oObjectButton = new sap.m.Button({
              text: "Yeni Hedef Ekle",
              icon: "sap-icon://add",
              enabled: sElementEditable,
              type: "Accept",
              press: jQuery.proxy(that._handleAddFreeFormElement, that, {
                oElem: oElem,
                sObj: false,
              }),
              layoutData: new sap.m.OverflowToolbarLayoutData({
                moveToOverflow: false,
              }),
              /*press: function (oEvent) {
								var oActionSheet = new sap.m.ActionSheet({
									showCancelButton: false,
									placement: "Bottom",
									buttons: [
										new sap.m.Button({
											text: "Yeni Hedef",
											icon: "sap-icon://goal",
											press: jQuery.proxy(that._handleAddFreeFormElement, that, {
												oElem: oElem,
												sObj: false
											}),
											layoutData: new sap.m.OverflowToolbarLayoutData({
												moveToOverflow: false
											})
										}),
										new sap.m.Button({
											text: "Bölüm Hedeflerinden",
											icon: "sap-icon://target-group",
											press: jQuery.proxy(that._handleAddFreeFormElement, that, {
												oElem: oElem,
												sObj: true
											}),
											layoutData: new sap.m.OverflowToolbarLayoutData({
												moveToOverflow: false
											})
										})
									]
								});

								oActionSheet.openBy(oObjectButton);
							}*/
            });

            oPanelToolbar.addContent(oObjectButton);
            this._addUIElement(
              oElem.RowIid,
              "RowMenuButton",
              null,
              oObjectButton
            );

            /*var oMenu = new sap.m.Menu({
						title: "{i18n>labelAddElement}",
						items: [
							new sap.m.MenuItem({
								text: "Serbest Metin",
								icon: "sap-icon://goal",
								press: jQuery.proxy(that._handleAddFreeFormElement, that, {
									oElem: oElem,
									sObj: false
								})
							}),
							new sap.m.MenuItem({
								text: "Bölüm Hedeflerinden",
								icon: "sap-icon://target-group",
								press: jQuery.proxy(that._handleAddFreeFormElement, that, {
									oElem: oElem,
									sObj: true
								})
							})
						]
					});

					var oMenuButton = new sap.m.MenuButton({
						text: "{i18n>labelAddElement}",
						icon: "sap-icon://add",
						type: "Accept",
						menu: oMenu,
						enabled: sElementEditable
					});
					oMenuButton.addCustomData(oRowIid);
					oMenuButton.addCustomData(oElementName);
					oPanelToolbar.addContent(oMenuButton);
					this._addUIElement(oElem.RowIid, "RowMenuButton", null, oMenuButton);*/
          }
        }

        sParamVal = oViewData.formParameters["FORM_VB_DP_TRAINING"];

        if (oElem.ElementId === sParamVal) {
          var oTrainingButton = new sap.m.Button({
            icon: "sap-icon://e-learning",
            type: "Reject",
            text: "Eğitim tarihçesi",
            press: that._showDevTrainings.bind(that),
          }).addStyleClass("hapButtonGreen");
          oPanelToolbar.addContent(oTrainingButton);
        }
        /*Survey button*/
        if (oElem.FormExist) {
          var sFormEnabled =
            "{= ${formDetailsModel>/bodyElements/" +
            oElem.RowIid +
            "/FormExist} && ${formDetailsModel>/bodyCells/" +
            oElem.RowIid +
            "/" +
            oElem.FormColumnIid +
            "/ValueTxt} === '1' }";

          var oRowIid4 = new sap.ui.core.CustomData({
            key: "elementRowIid",
            value: oElem.RowIid,
          });
          var oFormId4 = new sap.ui.core.CustomData({
            key: "elementFormId",
            value: oElem.FormId,
          });
          var oElementName4 = new sap.ui.core.CustomData({
            key: "elementName",
          });
          oElementName4.bindProperty(
            "value",
            "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name"
          );
          var oSurveyButton = new sap.m.Button({
            icon: "sap-icon://survey",
            type: "Accept",
            press: that._handleOpenSurvey.bind(that),
            enabled: sFormEnabled,
          });
          oSurveyButton.addCustomData(oRowIid4);
          oSurveyButton.addCustomData(oFormId4);
          oSurveyButton.addCustomData(oElementName4);

          oPanelToolbar.addContent(oSurveyButton);
          this._addUIElement(
            oElem.RowIid,
            "RowSurveyButton",
            null,
            oSurveyButton
          );
        }

        /*Attachment button*/
        if (oElem.AttachmentVisible) {
          var oRowIid2 = new sap.ui.core.CustomData({
            key: "elementRowIid",
            value: oElem.RowIid,
          });
          var oElementName2 = new sap.ui.core.CustomData({
            key: "elementName",
          });
          oElementName2.bindProperty(
            "value",
            "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name"
          );
          var oAttButton = new sap.m.Button({
            icon: "sap-icon://add-document",
            text: "{i18n>addAttachmentFile}",
            press: jQuery.proxy(that._handleAddAttachment, that, {
              rowIid: oRowIid,
              elementName: oElementName,
            }),
            enabled: sElementEditable,
            visible: sAttachVisible,
          });
          oAttButton.addCustomData(oRowIid2);
          oAttButton.addCustomData(oElementName2);
          this._addUIElement(oElem.RowIid, "RowAttButton", null, oAttButton);
          oPanelToolbar.addContent(oAttButton);
        }

        var oRowIid3 = new sap.ui.core.CustomData({
          key: "elementRowIid",
          value: oElem.RowIid,
        });
        var oElementName3 = new sap.ui.core.CustomData({
          key: "elementName",
        });
        oElementName3.bindProperty(
          "value",
          "formDetailsModel>/bodyElements/" + oElem.RowIid + "/Name"
        );
        var oAttListButton = new sap.m.Button({
          icon: "sap-icon://attachment",
          type: "Reject",
          text: {
            parts: [
              {
                path: "i18n>attachmentList",
              },
              {
                path:
                  "formDetailsModel>/attachmentCollection/" +
                  oElem.RowIid +
                  "/attachmentList",
              },
            ],
            formatter: function (sText, aAttList) {
              try {
                if (aAttList) {
                  if (aAttList.length > 0) {
                    return sText + " (" + aAttList.length + ")";
                  } else {
                    return sText;
                  }
                } else {
                  return sText;
                }
              } catch (oErr) {
                return sText;
              }
            },
          },
          press: that._handleListAttachment.bind(that),
          visible: {
            path:
              "formDetailsModel>/attachmentCollection/" +
              oElem.RowIid +
              "/attachmentList",
            formatter: function (aAttList) {
              try {
                if (aAttList) {
                  if (aAttList.length > 0) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              } catch (oErr) {
                return false;
              }
            },
          },
        });
        oAttListButton.addCustomData(oRowIid3);
        oAttListButton.addCustomData(oElementName3);

        this._addUIElement(
          oElem.RowIid,
          "RowAttListButton",
          null,
          oAttListButton
        );
        oPanelToolbar.addContent(oAttListButton);

        /*Attachment button*/

        if (oElem.DeletionVisible) {
          var oRemoveButton = new sap.m.Button({
            icon: "sap-icon://delete",
            type: "Reject",
            press: that._handleDeleteFormElement.bind(that),
            enabled: sElementEditable,
            layoutData: new sap.m.OverflowToolbarLayoutData({
              moveToOverflow: false,
            }),
          });
          oRemoveButton.addCustomData(oRowIid);
          oRemoveButton.addCustomData(oElementName);
          this._addUIElement(
            oElem.RowIid,
            "RowDeleteButton",
            null,
            oRemoveButton
          );
          oPanelToolbar.addContent(oRemoveButton);
        }

        oParent.setHeaderToolbar(oPanelToolbar);
      },

      /**
       * Add cells according to the doc tab
       * @function
       * @private
       */
      _addCells: function (oParent, sRowIid, oViewData) {
        var that = this;
        var oBLR = new sap.ui.layout.BlockLayoutRow();
        oParent.addContent(oBLR);
        $.each(oViewData.formData["BodyColumns"], function (sIndex, oColumn) {
          if (oViewData.bodyCells[sRowIid].hasOwnProperty(oColumn.ColumnIid)) {
            var oCell = oViewData.bodyCells[sRowIid][oColumn.ColumnIid];
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              var oFB = new sap.m.FlexBox({
                direction: "Column",
                alignItems: "Start",
                justifyContent: "Center",
              })
                .addStyleClass("sapUiNoContentPadding")
                .addStyleClass("hapCellContainer");
              var oBLC = new sap.ui.layout.BlockLayoutCell()
                .addStyleClass("sapUiNoContentPadding")
                .addStyleClass("sapUiTinyMarginEnd");
              that._addUIElement(
                sRowIid,
                "CellContainer",
                oColumn.ColumnIid,
                oFB
              );

              if (oCell.LayoutType === "R") {
                oFB.setLayoutData(
                  new sap.ui.layout.GridData({
                    span: "L12 M12 S12",
                  })
                );
                oBLC.setWidth(100);
              }
              oBLR.addContent(oBLC);

              //Add cell content
              that._addCell(oBLC, oCell, oViewData);
            }
          }
        });
      },

      /**
       * Add cells according to the doc tab
       * @function
       * @private
       */
      _addCellsNew: function (oParent, sRowIid, oViewData) {
        var that = this;

        //bu satırda bölüm hedefi var mı?
        var oObjTeam = _.find(oViewData.formData["BodyCells"], {
          RowIid: sRowIid,
          ColumnIid: that._sObjTeamColumn,
        });

        //Kaç değerlendirme sütunu var?
        var aAppColumns = _.filter(
          oViewData.formData["BodyCells"],
          function (o) {
            return (
              o.RowIid == sRowIid &&
              (o.ColumnIid == that._sSelfAppColumn ||
                o.ColumnIid == that._sFinAppColumn ||
                o.ColumnIid == that._s2ndAppColumn) &&
              (o.CellValueAvailability !== "H" ||
                o.CellNoteAvailability !== "H")
            );
          }
        );

        $.each(oViewData.formData["BodyColumns"], function (sIndex, oColumn) {
          if (oViewData.bodyCells[sRowIid].hasOwnProperty(oColumn.ColumnIid)) {
            var oCell = oViewData.bodyCells[sRowIid][oColumn.ColumnIid];
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              var oFC = new sap.ui.layout.form.FormContainer();
              var oFE = null;
              if (
                oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K"
              ) {
                oFE = new sap.ui.layout.form.FormElement({
                  label:
                    "{path:'formDetailsModel>/bodyCells/" +
                    oCell.RowIid +
                    "/" +
                    oCell.ColumnIid +
                    "/Caption'}",
                });
              } else if (oCell.CellNoteAvailability !== "H") {
                oFE = new sap.ui.layout.form.FormElement({
                  label:
                    "{path:'formDetailsModel>/bodyCells/" +
                    oCell.RowIid +
                    "/" +
                    oCell.ColumnIid +
                    "/CaptionNote'}",
                });
              }
              oFC.addFormElement(oFE);
              oParent.addFormContainer(oFC);

              /*var oFB = new sap.m.FlexBox({
							direction: "Column",
							alignItems: "Start",
							justifyContent: "Center"
						}).addStyleClass("sapUiNoContentPadding").addStyleClass("hapCellContainer");
						var oBLC = new sap.ui.layout.BlockLayoutCell().addStyleClass("sapUiNoContentPadding").addStyleClass("sapUiTinyMarginEnd");
						that._addUIElement(sRowIid, "CellContainer", oColumn.ColumnIid, oFB);

						if (oCell.LayoutType === "R") {
							oFB.setLayoutData(new sap.ui.layout.GridData({
								span: "L12 M12 S12"
							}));
							oBLC.setWidth(100);
						}
						oBLR.addContent(oBLC);*/

              //Add cell content
              that._addCellNew(oFE, oCell, oViewData);
              if (
                oCell.ColumnIid === that._sObjColumn ||
                oCell.ColumnIid === that._sObjTeamColumn
              ) {
                if (!_.isEmpty(oObjTeam)) {
                  //eğer bölüm hedefi varsa bu 2 sütunu tek satırda göster
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL6 L6 M6 S12",
                    })
                  );
                } else {
                  //Müdür formunda bölüm hedefi sütunu olmayacak
                  //sadece _sObjColumn u tüm satıha yay :)
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL12 L12 M12 S12",
                    })
                  );
                }
              } else if (
                oCell.ColumnIid === that._sSelfAppColumn ||
                oCell.ColumnIid === that._sFinAppColumn ||
                oCell.ColumnIid === that._s2ndAppColumn
              ) {
                if (aAppColumns.length == 3) {
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL4 L4 M8 S12",
                    })
                  );
                } else {
                  oFC.setLayoutData(
                    new sap.ui.layout.GridData({
                      span: "XL6 L6 M6 S12",
                    })
                  );
                }
              } else {
                oFC.setLayoutData(
                  new sap.ui.layout.GridData({
                    span: "XL2 L2 M8 S12",
                  })
                );
              }
            }
          }
        });
      },

      _addCell: function (oParent, oCell, oViewData) {
        var that = this;
        var oFBC = new sap.m.FlexBox({
          direction: "Column",
          alignItems: "Start",
        });
        oParent.addContent(oFBC);

        if (oCell.RowIid !== "0000" && oCell.ColumnIid !== "0000") {
          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            //Column label
            var sCaptionVisible =
              "{= ${formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/Caption} === '' ? false : true }";

            var oCL = new sap.m.Label({
              text: oCell.Caption + ":",
              visible: sCaptionVisible,
              tooltip: oCell.RowIid + "-" + oCell.ColumnIid,
            });

            oCL.addStyleClass("hapElementCaption");
            that._addUIElement(
              oCell.RowIid,
              "CellValueCaption",
              oCell.ColumnIid,
              oCL
            );
            oFBC.addItem(oCL);
            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    var oEl = this._addInputField(oCell, "ValueNum");
                }
                break;

              case "D":
                var oEl = this._addDateField(oCell);
                break;

              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    var oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    var oEl = this._addRadioButton(oCell);
                    break;
                  case "L":
                    //var oEl = this._addRadioButton(oCell);
                    var oEl = this._addListBox(oCell);
                    /*sap.m.Select*
									break;
								case "C":
									var oEl = this._addCheckBox(oCell);
									break;
								case "T":
									var oEl = this._addCheckBox(oCell);
									break;
								case "M":
									/*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            that._addUIElement(oCell.RowIid, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            oFBC.addItem(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            //Note label
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            var sCaptionNoteVisible =
              "{= ${formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CaptionNote} === '' ? false : true }";

            var oCNL = new sap.m.Label({
              text: oCell.CaptionNote + ":",
              visible: sCaptionNoteVisible,
            });
            oCNL.addStyleClass("hapElementCaption");
            that._addUIElement(
              oCell.RowIid,
              "CellNoteCaption",
              oCell.ColumnIid,
              oCNL
            );
            oFBC.addItem(oCNL);

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              cols: 50,
              rows: 5, //"{= parseInt(${formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/NoteLines})}",
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            }).addStyleClass("hapTextArea");
            that._addUIElement(oCell.RowIid, "CellNote", oCell.ColumnIid, oTA);
            oTA.addStyleClass("hapCellElement");
            oFBC.addItem(oTA);
          }
        }
      }, //_addCell

      _addCellNew: function (oParent, oCell, oViewData) {
        var that = this;
        var oEl = null;
        var oTg = null;
        var oFB = new sap.m.FlexBox({
          direction: "Column",
          width: "100%",
        });

        var aBodyElements = oViewData.bodyElements;
        var sLastRow = oViewData.formParameters["RESULT_LINE"];

        var oCellRow = _.find(aBodyElements, {
          RowIid: oCell.RowIid,
        });

        var bIsLastRow = oCellRow.ElementId === sLastRow ? true : false;

        if (oCell.RowIid !== "0000" && oCell.ColumnIid !== "0000") {
          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    oEl = this._addInputField(oCell, "ValueNum");
                }
                break;

              case "D":
                oEl = this._addDateField(oCell);
                break;

              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    oEl = this._addRadioButton(oCell);
                    break;
                  case "L":
                    //var oEl = this._addRadioButton(oCell);

                    if (bIsLastRow) {
                      oEl = this._addListBox(oCell); /*sap.m.Select*/
                    } else {
                      oEl = this._addRatingIndicatorV2(oCell);
                      oTg = this._addToggleButton(oCell);
                    }
                    break;
                  case "C":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    oEl = this._addCheckBox(oCell);
                    break;
                  case "M":
                    /*Multi input*/
                    oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            that._addUIElement(oCell.RowIid, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            if (oCell.LayoutType === "R") {
              oEl.setLayoutData(
                new sap.ui.layout.GridData({
                  span: "XL12 L12 M12 S12",
                })
              );
            }
            oFB.addItem(oEl);

            if (oTg) {
              oFB.addItem(oTg);
            }
            //oParent.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            //Note label
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            var sCaptionNoteVisible =
              "{= ${formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CaptionNote} === '' ? false : true }";

            var oCNL = new sap.m.Label({
              text: oCell.CaptionNote + ":",
              visible: sCaptionNoteVisible,
            });
            oCNL.addStyleClass("hapElementCaption");
            //that._addUIElement(oCell.RowIid, "CellNoteCaption", oCell.ColumnIid, oCNL);
            //oFBC.addItem(oCNL);

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              rows: 3, //"{= parseInt(${formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/NoteLines})}",
              width: "100%",
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            }); //addStyleClass("hapTextArea");
            that._addUIElement(oCell.RowIid, "CellNote", oCell.ColumnIid, oTA);
            //oTA.addStyleClass("hapCellElement");
            //oParent.addField(oTA);
            oFB.addItem(oTA);
          }
          oParent.addField(oFB);
        }
      }, //_addCell

      _addNewElementFreeFormCells: function (
        oParent,
        sNewRowIid,
        oEnhanceData
      ) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var aBodyElements = oEnhanceData.BodyElements.results;
        var aBodyCells = oEnhanceData.BodyCells.results;
        var aBodyColumns = oEnhanceData.BodyColumns.results;
        var oElem = _.find(aBodyElements, ["RowIid", sNewRowIid]);
        var oFiCell = _.find(aBodyCells, {
          RowIid: sNewRowIid,
          ColumnIid: that._sObjColumn,
        });
        var aNewCells = _.filter(aBodyCells, ["RowIid", sNewRowIid]);

        //first free input with its label
        var oFC = new sap.ui.layout.form.FormContainer();
        var oFE = null;

        if (oElem.FreeInput) {
          oFE = new sap.ui.layout.form.FormElement({
            label: oFiCell.Caption,
          });

          var oFI = new sap.m.Input({
            value: "{formDetailsModel>/bodyElements/" + sNewRowIid + "/Name}",
            maxLength: 80,
          });
          oFI.setLayoutData(
            new sap.ui.layout.GridData({
              span: "XL4 L4 M8 S12",
            })
          );
          oFE.addField(oFI);
          oFC.addFormElement(oFE);
          oParent.addFormContainer(oFC);
        }

        //now add cell
        $.each(aNewCells, function (sIndex, oCell) {
          var oColumn = _.find(aBodyColumns, ["ColumnIid", oCell.ColumnIid]);
          if (oColumn) {
            if (
              (oCell.CellValueAvailability !== "H" &&
                oCell.CellValueAvailability !== "K") ||
              oCell.CellNoteAvailability !== "H"
            ) {
              that._addNewElementFreeFormCell(oParent, oCell);
            }
          }
        });
      }, //_addNewElementFreeFormCells

      _addNewElementFreeFormCell: function (oParent, oCell) {
        var that = this;

        if (
          oCell.RowIid !== "0000" &&
          oCell.ColumnIid !== "0000" &&
          oCell.ColumnIid !== that._sObjTeamColumn
        ) {
          //Column label
          var oFC = new sap.ui.layout.form.FormContainer();
          var oFE = null;

          if (
            oCell.CellValueAvailability !== "H" &&
            oCell.CellValueAvailability !== "K"
          ) {
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.Caption,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            switch (oCell.ValueType) {
              case "N":
                switch (oCell.LayoutType) {
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                  default:
                    var oEl = this._addInputField(oCell, "ValueNum");
                }
                break;
              case "D":
                var oEl = this._addDateField(oCell);
                break;
              case "S":
                /*String*/
                switch (oCell.LayoutType) {
                  case "S":
                    /*String*/
                    var oEl = this._addInputField(oCell, "ValueString");
                    break;
                  case "R":
                    /*Radiobutton*/
                    var oEl = this._addRadioButton(oCell);
                    break;
                  case "L":
                    //var oEl = this._addRadioButton(oCell);
                    var oEl = this._addListBox(oCell); /*sap.m.Select*/
                    break;
                  case "C":
                    var oEl = this._addCheckBox(oCell);
                    break;
                  case "T":
                    var oEl = this._addInputField(oCell, "ValueNum");
                    break;
                  case "M":
                    /*Multi input*/
                    var oEl = this._addMultiInput(oCell);
                    break;
                  case "J":
                    /*Text area json*/
                    var oEl = this._addTextAreaObjective(oCell);
                    break;
                }
                break;
            }
            that._addUIElement(oCell.RowIid, "CellValue", oCell.ColumnIid, oEl);
            //oEl.addStyleClass("hapCellElement");
            oEl.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            //oParent.addContent(oEl);
            oFE.addField(oEl);
          }

          if (
            oCell.CellNoteAvailability !== "H" &&
            oCell.LayoutType !== "M" &&
            oCell.LayoutType !== "J"
          ) {
            var sCellNoteEditablePath =
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/CellNoteAvailability";

            //Note label
            oFE = null;
            oFE = new sap.ui.layout.form.FormElement({
              label: oCell.CaptionNote,
            });
            oFC.addFormElement(oFE);
            oParent.addFormContainer(oFC);

            var oTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>/bodyCells/" +
                oCell.RowIid +
                "/" +
                oCell.ColumnIid +
                "/NoteString}",
              cols: 50,
              rows: 5,
              editable: {
                path: sCellNoteEditablePath,
                formatter: function (sCellNoteAvailability) {
                  if (
                    sCellNoteAvailability === "X" ||
                    sCellNoteAvailability === "A"
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            });
            oTA.setLayoutData(
              new sap.ui.layout.GridData({
                span: "XL4 L4 M8 S12",
              })
            );
            that._addUIElement(oCell.RowIid, "CellNote", oCell.ColumnIid, oTA);
            //oParent.addContent(oTA);
            oFE.addField(oTA);
          }
        }
      }, //_addNewElementFreeFormCellNew

      _addInputField: function (oCell, sBindingField) {
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sColumnIid = sCell + "/ColumnIid";
        var that = this;
        var oIF = new sap.m.Input({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/" +
              sBindingField,
          },
          textAlign: "Left",
          submit: this._onInputFieldValueChange,
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          width: {
            path: sColumnIid,
            formatter: function (sColIid) {
              if (sColIid === that._sWeightColumn) {
                return "50px";
              } else {
                return "100%";
              }
            },
          },
        }); //.addStyleClass("hapInputField");

        return oIF;
      },
      _addDateField: function (oCell) {
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellPath = sCell + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var that = this;

        var oDF = new sap.m.DatePicker({
          value: {
            path:
              "formDetailsModel>/bodyCells/" +
              oCell.RowIid +
              "/" +
              oCell.ColumnIid +
              "/ValueDate",
            type: "sap.ui.model.type.Date",
            formatOptions: {
              UTC: true,
              pattern: "dd.MM.yyyy",
            },
          },
          valueFormat: "yyyy-MM-dd",
          displayFormat: "dd.MM.yyyy",
          editable: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          placeholder: "Tarih seçiniz",
        }); //.addStyleClass("hapDateField");
        return oDF;
      },

      _getCellEditable: function (sCellValueAvailability, oCell) {
        try {
          var oViewModel = this.getModel("formDetailsModel");
          var oBodyCells = oViewModel.getProperty("/bodyCells/" + oCell.RowIid);
          var sEduSel = true;
          if (
            oCell.ColumnIid !== this._sEduColumn &&
            oBodyCells.hasOwnProperty(this._sEduColumn)
          ) {
            sEduSel = false;
            var oEduCell = oBodyCells[this._sEduColumn];
            if (
              oEduCell.ValueNum === "1" ||
              oEduCell.ValueNum == 1 ||
              oEduCell.ValueNum === "0001"
            ) {
              sEduSel = true;
            }
          }

          if (
            (sCellValueAvailability === "X" ||
              sCellValueAvailability === "R") &&
            sEduSel
          ) {
            return true;
          } else {
            return false;
          }
        } catch (oEx) {
          return false;
        }
      },

      _addCheckBox: function (oCell) {
        var that = this;
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sChkBox = sCell + "/ChkboxValueText";
        var sCellValue =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellPath = sCell + "/";
        var sStateBinding =
          "{= ${formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString} === '0001' ? true : false }";

        var oCB = new sap.m.Switch({
          state: sStateBinding,
          enabled: {
            parts: [
              {
                path: sEditablePath,
              },
              {
                path: sCellPath,
              },
            ],
            formatter: that._getCellEditable.bind(that),
          },
          // formatter: function(sCellValueAvailability) {
          // 	if (sCellValueAvailability === "X" || sCellValueAvailability === "R") {
          // 		return true;
          // 	} else {
          // 		return false;
          // 	}
          // }
          //},
          type: "AcceptReject",
          change: that._onSwitchValueChanged.bind(that),
        }).addStyleClass("hapCheckBox");

        if (oCell.ColumnIid === that._sManAppColumn) {
          oCB.attachBrowserEvent("mouseover", function () {
            jQuery.sap.delayedCall(500, that, that._openValDescInfo, [this]);
          });

          oCB.attachBrowserEvent("mouseout", function () {
            that._closeValDescInfo(this);
          });
        }

        //Binding reference for value set
        oCB.data("bindingReference", sCellValue);
        oCB.data("elementRowIid", oCell.RowIid);
        oCB.data("elementColumnIid", oCell.ColumnIid);

        return oCB;
      },
      _openValDescInfo: function (oSource) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aCellValues = oViewModel.getProperty("/formData/BodyCellValues");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var aValueDesc = [];

        if (
          sRowIid === this._currentRowIid &&
          sColumnIid === this._currentColumnIid
        ) {
          return;
        }

        this._currentRowIid = sRowIid;
        this._currentColumnIid = sColumnIid;

        $.each(aCellValues, function (sKey, oCellValue) {
          if (
            oCellValue.RowIid === sRowIid &&
            oCellValue.ColumnIid === sColumnIid
          ) {
            aValueDesc.push(oCellValue);
          }
        });

        oViewModel.setProperty("/currentCellValueDescription", aValueDesc);

        if (aValueDesc.length > 0) {
          if (!that._oValDescPopover) {
            that._oValDescPopover = sap.ui.xmlfragment(
              "hcm.ux.hapv2_1.fragment.ValueDescription",
              this
            );
            // connect dialog to view (models, lifecycle)
            that.getView().addDependent(that._oValDescPopover);
          } else {
            that._oValDescPopover.close();
          }
          that._oValDescPopover.openBy(oSource);
        }
      },
      _closeValDescInfo: function (oSource) {
        if (this._oValDescPopover) {
          this._currentRowIid = "0000";
          this._currentColumnIid = "0000";
          this._oValDescPopover.close();
        }
      },
      _addRadioButton: function (oCell) {
        var that = this;
        var sCell =
          "formDetailsModel>/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid;
        var sCellValue =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/ValueString";
        var sEditablePath = sCell + "/CellValueAvailability";
        var sCellValueString = sCell + "/ValueString";
        /*First create the radio button group*/
        var oRBG = new sap.m.RadioButtonGroup({
          selectedKey: "-1",
          editable: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          valueState: {
            path: sCellValueString,
            formatter: function (sCellValue) {
              if (
                sCellValue !== "0000" &&
                sCellValue !== null &&
                sCellValue !== undefined &&
                sCellValue !== ""
              ) {
                return sap.ui.core.ValueState.Success;
              } else {
                return sap.ui.core.ValueState.Error;
              }
            },
          },
        }).addStyleClass("hapRadioButtonGroup");

        var sCellValuePath = "formDetailsModel>" + sCellValue;

        var sTooltip = "{" + sCellValuePath + "}";
        var sSelectedClause =
          "{= ${formDetailsModel>ValueIid} === ${" +
          sCellValuePath +
          "}? true : false" +
          "}";

        /*Template radio button*/
        var oRB = new sap.m.RadioButton({
          selected: sSelectedClause,
          text: "{formDetailsModel>Description}",
          select: that._onRadioButtonValueSelected,
        }).addStyleClass("hapRadioButtonText");

        /*Add custom data 1 for binding*/
        oRB.data("bindingReference", sCellValue);

        /*Add custom data 2 for binding*/
        var oBindingValue = new sap.ui.core.CustomData({
          key: "bindingValue",
          value: "{formDetailsModel>ValueIid}",
        });
        oRB.addCustomData(oBindingValue);

        /*Attach template to RBG*/
        oRBG.bindAggregation("buttons", {
          path:
            "formDetailsModel>/bodyCellValues/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/CellValues",
          templateShareable: false,
          template: oRB,
        });
        return oRBG;
      },
      _onMultiInputSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValuePath = oSource.data("bindingReference");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var aValue = [];
        var sCellValue = "";

        var oSelectedItems = oSource.getSelectedItems();

        $.each(oSelectedItems, function (i, oItem) {
          aValue.push({
            Objid: oItem.getKey(),
            Stext: oItem.getText(),
          });
        });
        if (aValue.length > 0) {
          sCellValue = JSON.stringify(aValue);
        }

        oViewModel.setProperty(sCellValuePath, sCellValue);
      },
      _addMultiInput: function (oCell) {
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sCellValuePath =
          "/bodyCells/" + oCell.RowIid + "/" + oCell.ColumnIid + "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");
        var sCellValue = oViewModel.getProperty(sCellValuePath);
        var aSel = [];
        var that = this;

        if (
          sCellValue !== "" &&
          sCellValue !== null &&
          sCellValue !== undefined
        ) {
          try {
            var oToken = JSON.parse(sCellValue);
            $.each(oToken, function (i, oComp) {
              aSel.push(oComp.Objid);
            });
          } catch (oErr) {}
        }

        var oMC = new sap.m.MultiComboBox({
          selectionChange: that._onMultiInputSelected.bind(that),
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
        }).addStyleClass("hapMultiComboBox");

        var oItem = new sap.ui.core.Item({
          key: "{formDetailsModel>Objid}",
          text: "{formDetailsModel>Stext}",
        });

        /*Attach template to RBG*/
        oMC.bindAggregation("items", {
          path: "formDetailsModel>/formData/Competencies",
          template: oItem,
        });

        oMC.data("bindingReference", sCellValuePath);
        oMC.data("elementRowIid", oCell.RowIid);
        oMC.data("elementColumnIid", oCell.ColumnIid);

        if (aSel.length > 0) {
          oMC.setSelectedKeys(aSel);
        }
        return oMC;
      },

      _addTextAreaObjective: function (oCell) {
        var sCellValuePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/NoteString";
        var oViewModel = this.getModel("formDetailsModel");

        var oTAObj = new sap.m.TextArea({
          value: {
            path: sCellValuePath,
            formatter: function (sValue) {
              var sObjectiveText;
              var oObjectives = oViewModel.getProperty("/formData/Objectives");
              $.each(oObjectives, function (i, oObjective) {
                if (oObjective.Objid === sValue) {
                  sObjectiveText = oObjective.Description;
                  return false;
                }
              });
              return sObjectiveText;
            },
          },
          width: "100%",
          rows: 3,
          editable: false,
        }); //.addStyleClass("hapTextArea");

        return oTAObj;
      },

      _addListBox: function (oCell) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sColumnIid =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ColumnIid";

        var oLB = new sap.m.Select({
          selectedKey:
            "{formDetailsModel>/bodyCells/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/ValueString}",
          //"autoAdjustWidth": false,
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          change: function (oEvent) {
            var sRowIid = oEvent.getSource().data("RowIid");
            var sColumnIid = oEvent.getSource().data("ColumnIid");
            var aBodyCells = oViewData.formData["BodyCells"];
            var oLine = _.find(aBodyCells, {
              RowIid: sRowIid,
              ColumnIid: sColumnIid,
            });
            oLine.ValueNum = "0";
            oLine.ValueText = "";
            oLine.ValueTxt = "";
            oViewModel.setProperty("/formData/BodyCells", aBodyCells);

            var oModel = this.getModel();

            var oOperation = {
              Operation: "CALCSUM",
              RowId: "",
              ColumnId: "",
              Result: "",
              BodyCells: _.clone(oViewModel.getProperty("/formData/BodyCells")),
              BodyElements: oViewModel.getProperty("/formData/BodyElements"),
            };

            oModel.create("/CalculateSummarySet", oOperation, {
              success: function (oData, oResponse) {
                var sRowId = oData.RowId;
                var sColumnId = oData.ColumnId;

                var aBodyCellsForSummary = oViewData.formData["BodyCells"];

                oLine = _.find(aBodyCellsForSummary, {
                  RowIid: sRowId,
                  ColumnIid: sColumnId,
                });

                oLine.NoteString = oData.Result;
                oViewModel.setProperty(
                  "/formData/BodyCells",
                  aBodyCellsForSummary
                );
              },
              error: function () {},
            });
          },
          //"100%"
          width: {
            path: sColumnIid,
            formatter: function (sColIid) {
              //if (sColIid === that._sSelfAppColumn || sColIid === that._sFinAppColumn || sColIid === that._s2ndAppColumn) {
              //	return "185px";
              //} else {
              return "100%";
              //}
            },
          },
        }); //.addStyleClass("hapListBox");

        //Listbox change event ile formData->BodyCells içinde value_num, value_text gibi alanları temizlemek için
        // row ve column id leri custom data da tut
        var oRowIid = new sap.ui.core.CustomData({
          key: "RowIid",
          value: oCell.RowIid,
          writeToDom: true,
        });
        oLB.addCustomData(oRowIid);

        var oColumnIid = new sap.ui.core.CustomData({
          key: "ColumnIid",
          value: oCell.ColumnIid,
          writeToDom: true,
        });
        oLB.addCustomData(oColumnIid);

        var oItem = new sap.ui.core.Item({
          key: "{formDetailsModel>ValueIid}",
          text: "{formDetailsModel>ValueText}",
        });

        /*Attach template to RBG*/
        oLB.bindAggregation("items", {
          path:
            "formDetailsModel>/bodyCellValues/" +
            oCell.RowIid +
            "/" +
            oCell.ColumnIid +
            "/CellValues",
          template: oItem,
        });
        return oLB;
      },
      _addRatingIndicatorV2: function (oCell) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sCellValueIid =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString";
        var sCellValueText =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueText";

        var sCellValues =
          "formDetailsModel>/bodyCellValues/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValues";

        var oRI = new SmodRatingIndicator({
          editable: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          selectedValue: {
            path: sCellValueIid,
          },
          selectedValueText: {
            path: sCellValueText,
          },

          excludedValues: ["0000", "0005"],

          change: function (oEvent) {
            var sRowIid = oCell.RowIid;
            var sColumnIid = oCell.ColumnIid;
            var aBodyCells = oViewData.formData["BodyCells"];
            var sValue = oEvent.getSource().getSelectedValue();
            var oBodyCellValues = oViewModel.getData().bodyCellValues;

            var oLine = _.find(aBodyCells, {
              RowIid: sRowIid,
              ColumnIid: sColumnIid,
            });
            oLine.ValueNum = parseInt(sValue, 10) + ".000";
            oLine.ValueString = sValue;
            oLine.ValueText = _.find(
              oBodyCellValues[sRowIid][sColumnIid].CellValues,
              ["ValueIid", sValue]
            )?.ValueText;
            oLine.ValueTxt = parseInt(sValue, 10) + ",000";

            var sIndex = _.findIndex(aBodyCells, {
              RowIid: sRowIid,
              ColumnIid: sColumnIid,
            });

            if (sIndex) {
              aBodyCells[sIndex] = oLine;

              oViewModel.setProperty("/formData/BodyCells", aBodyCells);

              var oModel = this.getModel();

              var oOperation = {
                Operation: "CALCSUM",
                RowId: "",
                ColumnId: "",
                Result: "",
                BodyCells: _.clone(
                  oViewModel.getProperty("/formData/BodyCells")
                ),
                BodyElements: oViewModel.getProperty("/formData/BodyElements"),
              };

              oModel.create("/CalculateSummarySet", oOperation, {
                success: function (oData, oResponse) {
                  var sRowId = oData.RowId;
                  var sColumnId = oData.ColumnId;

                  var aBodyCellsForSummary = oViewData.formData["BodyCells"];

                  oLine = _.find(aBodyCellsForSummary, {
                    RowIid: sRowId,
                    ColumnIid: sColumnId,
                  });

                  oLine.NoteString = oData.Result;
                  oViewModel.setProperty(
                    "/formData/BodyCells",
                    aBodyCellsForSummary
                  );
                },
                error: function () {},
              });
            }
          },
        });

        var oItem = new SmodRatingItem({
          value: "{formDetailsModel>ValueIid}",
          valueText: "{formDetailsModel>ValueText}",
        });

        oRI.bindAggregation("ratingItems", {
          path: sCellValues,
          template: oItem,
        });

        oRI.addStyleClass("sapUiSmallMarginBottom");
        oRI.addStyleClass("customRatingIndicator");

        return oRI;
      },
      _addRatingIndicator: function (oCell) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sValueStrPath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueText";
        var sColumnIid =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ColumnIid";
        var sCellValue =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueNum";

        var oRI = new sap.m.RatingIndicator({
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          value: {
            path: sCellValue,
            formatter: function (sCellValue) {
              var iCellValue = parseInt(sCellValue);
              return iCellValue > 4 ? 0 : iCellValue;
            },
          },
          maxValue:
            oViewData.bodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues
              .length - 2, //Kapsamdışı ve Değer seçin
          iconSize: "32px",
          tooltip: {
            path: sValueStrPath,
          },

          liveChange: function (oEvent) {
            var sRowIid = oCell.RowIid;
            var sColumnIid = oCell.ColumnIid;
            var aBodyCells = oViewData.formData["BodyCells"];
            var sValue = oEvent.getParameter("value");
            var oBodyCellValues = oViewModel.getData().bodyCellValues;

            var oLine = _.find(aBodyCells, {
              RowIid: sRowIid,
              ColumnIid: sColumnIid,
            });
            oLine.ValueNum = sValue + ".000";
            oLine.ValueString = "000" + sValue;
            oLine.ValueText =
              oBodyCellValues[sRowIid][sColumnIid].CellValues[sValue].ValueText;
            oLine.ValueTxt = oEvent.getParameter("value") + ",000";
            oViewModel.setProperty("/formData/BodyCells", aBodyCells);

            var oModel = this.getModel();

            var oOperation = {
              Operation: "CALCSUM",
              RowId: "",
              ColumnId: "",
              Result: "",
              BodyCells: _.clone(oViewModel.getProperty("/formData/BodyCells")),
              BodyElements: oViewModel.getProperty("/formData/BodyElements"),
            };

            oModel.create("/CalculateSummarySet", oOperation, {
              success: function (oData, oResponse) {
                var sRowId = oData.RowId;
                var sColumnId = oData.ColumnId;

                var aBodyCellsForSummary = oViewData.formData["BodyCells"];

                oLine = _.find(aBodyCellsForSummary, {
                  RowIid: sRowId,
                  ColumnIid: sColumnId,
                });

                oLine.NoteString = oData.Result;
                oViewModel.setProperty(
                  "/formData/BodyCells",
                  aBodyCellsForSummary
                );
              },
              error: function () {},
            });
          },
        });

        oRI.addStyleClass("sapUiSmallMarginBottom");
        oRI.addStyleClass("customRatingIndicator");

        return oRI;
      },

      _addToggleButton: function (oCell) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var sEditablePath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/CellValueAvailability";
        var sPressedPath =
          "formDetailsModel>/bodyCells/" +
          oCell.RowIid +
          "/" +
          oCell.ColumnIid +
          "/ValueString";

        var oTB = new sap.m.ToggleButton({
          text: "Kapsam Dışı",
          icon: "sap-icon://sys-cancel-2",
          enabled: {
            path: sEditablePath,
            formatter: function (sCellValueAvailability) {
              if (
                sCellValueAvailability === "X" ||
                sCellValueAvailability === "R"
              ) {
                return true;
              } else {
                return false;
              }
            },
          },
          pressed: {
            path: sPressedPath,
            formatter: function (sCellValueAvailability) {
              if (sCellValueAvailability === "0005") {
                return true;
              } else {
                return false;
              }
            },
          },
          press: function (oEvent) {
            var sRowIid = oCell.RowIid;
            var sColumnIid = oCell.ColumnIid;
            var aBodyCells = oViewData.formData["BodyCells"];
            var oBodyCellValues = oViewModel.getData().bodyCellValues;

            var oLine = _.find(aBodyCells, {
              RowIid: sRowIid,
              ColumnIid: sColumnIid,
            });

            if (oEvent.getParameter("pressed")) {
              oLine.ValueNum = "5.000";
              oLine.ValueString = "0005";
              oLine.ValueText = "Kapsam Dışı";
              oLine.ValueTxt = "5,000";
              oViewModel.setProperty("/formData/BodyCells", aBodyCells);
            } else {
              oLine.ValueNum = "0.000";
              oLine.ValueString = "0000";
              oLine.ValueText = "Değer Seçin";
              oLine.ValueTxt = "0,000";
              oViewModel.setProperty("/formData/BodyCells", aBodyCells);
            }

            var oModel = this.getModel();

            var oOperation = {
              Operation: "CALCSUM",
              RowId: "",
              ColumnId: "",
              Result: "",
              BodyCells: _.clone(oViewModel.getProperty("/formData/BodyCells")),
              BodyElements: oViewModel.getProperty("/formData/BodyElements"),
            };

            oModel.create("/CalculateSummarySet", oOperation, {
              success: function (oData, oResponse) {
                var sRowId = oData.RowId;
                var sColumnId = oData.ColumnId;

                var aBodyCellsForSummary = oViewData.formData["BodyCells"];

                oLine = _.find(aBodyCellsForSummary, {
                  RowIid: sRowId,
                  ColumnIid: sColumnId,
                });

                oLine.NoteString = oData.Result;
                oViewModel.setProperty(
                  "/formData/BodyCells",
                  aBodyCellsForSummary
                );
              },
              error: function () {},
            });
          },
        });

        return oTB;
      },

      _addFormActions: function () {
        var oPage = this.byId("idFormDetailPage");
        var that = this;

        var oActionButton = new sap.m.Button({
          text: "{formDetailsModel>Text}",
          visible: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>/allSectionsClicked",
              },
            ],
            formatter: function (sAvailability, sStatusRelevant, sAllClicked) {
              if (sAvailability === "" || sAvailability === "B") {
                return true;
              } else {
                return false;
              }
            },
          },
          enabled: {
            parts: [
              {
                path: "formDetailsModel>Availability",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>/allSectionsClicked",
              },
            ],
            formatter: function (sAvailability, sStatusRelevant, sAllClicked) {
              if (sAvailability === "" || sAvailability === "B") {
                if (sStatusRelevant) {
                  if (sAllClicked) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return true;
                }
              } else {
                return false;
              }
            },
          },
          type: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              if (sStatusRelevant === true) {
                return sap.m.ButtonType.Emphasized;
              }

              if (sId === "SAVE") {
                return sap.m.ButtonType.Accept;
              }

              if (sId === "CANCEL") {
                return sap.m.ButtonType.Reject;
              }

              return sap.m.ButtonType.Default;
            },
          },
          icon: {
            parts: [
              {
                path: "formDetailsModel>Id",
              },
              {
                path: "formDetailsModel>StatusRelevant",
              },
              {
                path: "formDetailsModel>Icon",
              },
            ],
            formatter: function (sId, sStatusRelevant, sIcon) {
              switch (sId) {
                case "SAVE":
                  return "sap-icon://save";
                case "CANCEL":
                  return "sap-icon://sys-cancel-2";
                case "PRINT":
                  return "sap-icon://print";
              }
            },
          },
          press: that._handleActionButtonPressed.bind(this),
        });

        // oActionButton.attachBrowserEvent("mouseenter", function(oEvent) {
        // 	if ($(oEvent.currentTarget).data("buttonid") === "APPROVE") {
        // 		MessageToast.show("Deneme");
        // 	}
        // });

        /*Add custom data 2 for binding*/
        var oButtonId = new sap.ui.core.CustomData({
          key: "ButtonId",
          value: "{formDetailsModel>Id}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oButtonId);
        var oStatusRelevant = new sap.ui.core.CustomData({
          key: "StatusRelevant",
          value: "{formDetailsModel>StatusRelevant}",
        });
        oActionButton.addCustomData(oStatusRelevant);
        var oEmphasize = new sap.ui.core.CustomData({
          key: "IsEmphasized",
          value:
            "{= ${formDetailsModel>StatusRelevant} ? 'Emphasized' : 'None'}",
          writeToDom: true,
        });
        oActionButton.addCustomData(oEmphasize);
        var oTargetSection = new sap.ui.core.CustomData({
          key: "TargetSection",
          value: "{formDetailsModel>TargetSection}",
        });
        oActionButton.addCustomData(oTargetSection);

        // var oToolbar = new sap.m.OverflowToolbar();
        // oToolbar.bindAggregation("content", {
        // 	path: "formDetailsModel>/footerButtons",
        // 	templateShareable: false,
        // 	template: oActionButton
        // });
        //oPage.addCustomFooterContent(oToolbar);

        oPage.bindAggregation("customFooterContent", {
          path: "formDetailsModel>/footerButtons",
          templateShareable: false,
          template: oActionButton,
        });
      },
      _adjustButtons: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aHapButtons = oViewModel.getProperty("/formData/Buttons");
        var aSections = oViewModel.getProperty("/formSections");
        var oPrevSection = null;
        var oNextSection = null;
        var aFooterButtons = [];
        var sFound = false;
        var that = this;

        var sCurrentSection = this._oPageLayout.getSelectedSection();

        $.each(aSections, function (sIndex, oSection) {
          if (oSection.element.getId() === sCurrentSection) {
            sFound = true;
          } else {
            if (sFound === true) {
              oNextSection = oSection.element;
              return false;
            } else {
              oPrevSection = oSection.element;
            }
          }
        });

        if (oPrevSection) {
          aFooterButtons.push({
            Id: "PREV",
            Text: this.formatter.convertToStartCase(oPrevSection.getTitle()),
            StatusRelevant: false,
            Icon: null,
            TargetSection: oPrevSection.getId(),
            Availability: "",
          });
        }

        if (oNextSection) {
          aFooterButtons.push({
            Id: "NEXT",
            Text: this.formatter.convertToStartCase(oNextSection.getTitle()),
            StatusRelevant: false,
            Icon: null,
            TargetSection: oNextSection.getId(),
            Availability: "",
          });
        }

        $.each(aHapButtons, function (sIndex, oHapButton) {
          var oHapButtonLocal = that._cloneObject(oHapButton);
          oHapButtonLocal.TargetSection = null;
          aFooterButtons.push(oHapButtonLocal);
        });

        oViewModel.setProperty("/footerButtons", aFooterButtons);
        oViewModel.refresh();
      },

      _adjustButtonsNew: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oFormParameters = oViewModel.getProperty("/formParameters");
        var aHapButtons = oViewModel.getProperty("/formData/Buttons");
        var aFooterButtons = [];
        var that = this;

        if (oFormParameters.hasOwnProperty("UX_USER_GUIDE_PATH")) {
          aFooterButtons.push({
            Id: "USER_GUIDE",
            Text: that.getText("userGuideButton"),
            StatusRelevant: false,
            Icon: "sap-icon://learning-assistant",
            TargetSection: null,
            Availability: "",
          });
        }

        $.each(aHapButtons, function (sIndex, oHapButton) {
          var oHapButtonLocal = that._cloneObject(oHapButton);
          oHapButtonLocal.TargetSection = null;
          aFooterButtons.push(oHapButtonLocal);
        });

        oViewModel.setProperty("/footerButtons", aFooterButtons);
      },
      _onInputFieldValueChange: function (oEvent) {},
      _onSwitchValueChanged: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        var sRowIid = oSource.data("elementRowIid");
        var sColumnIid = oSource.data("elementColumnIid");
        var sSurveyExists = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormExist"
        );
        var sState = oEvent.getParameter("state");
        var sSurveyColumn = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormColumnIid"
        );
        var that = this;
        var sFormId = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormId"
        );

        var sBindingReference = oSource.data("bindingReference");

        if (!sState && sSurveyExists && sSurveyColumn === sColumnIid) {
          this._handleResetSurvey(sRowIid, sFormId, sBindingReference);
        }

        /* Bireysel gelişim seçilmiş daha önce seçilmemiş olmalı*/
        if (sState && sColumnIid === this._sEduColumn) {
          var sCont = this._checkTrainingSelection(sRowIid, sBindingReference);

          if (!sCont) {
            return;
          }
        }

        /* Seçim geri alındı */
        if (!sState && sColumnIid === this._sEduColumn) {
          var aFormUIElements = oViewModel.getProperty("/formUIElements");
          $.each(aFormUIElements, function (sIndex, oFormUIElement) {
            if (
              oFormUIElement.ColumnIid !== null &&
              oFormUIElement.RowIid === sRowIid &&
              oFormUIElement.ColumnIid !== that._sEduColumn &&
              oFormUIElement.UIType === "CellValue"
            ) {
              try {
                var sValuePath =
                  oFormUIElement.UIElement.data("bindingReference");

                oViewModel.setProperty(sValuePath + "ValueString", "0000");
                oViewModel.setProperty(sValuePath + "ValueNum", "0");
                oViewModel.setProperty(sValuePath + "ValueTxt", "0");
                oViewModel.setProperty(sValuePath + "ValueNnv", "");
              } catch (oErr) {}
            }
          });
        }

        oViewModel.setProperty(
          sBindingReference + "ValueString",
          sState ? "0001" : "0000"
        );
        oViewModel.setProperty(
          sBindingReference + "ValueNum",
          sState ? "1" : "0"
        );
        oViewModel.setProperty(
          sBindingReference + "ValueTxt",
          sState ? "1" : "0"
        );

        /*Update bindings to reflect changes*/
        oViewModel.refresh(true);

        if (sState && sSurveyExists && sSurveyColumn === sColumnIid) {
          this._handleCallSurvey(sRowIid, sFormId, false);
        }
      },

      _checkTrainingSelection: function (sRowIid, sBindingReference) {
        var oViewModel = this.getModel("formDetailsModel");
        var aUIElements = oViewModel.getProperty("/formUIElements");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var that = this;
        var sCount = 0;

        var _getUIElement = function () {
          for (var i = 0; i < aUIElements.length; i++) {
            if (
              aUIElements[i].RowIid === sRowIid &&
              aUIElements[i].ColumnIid === that._sEduColumn &&
              aUIElements[i].UIType === "CellValue"
            ) {
              return aUIElements[i].UIElement;
              break;
            }
          }
        };

        $.each(aBodyCells, function (sIndex, oCell) {
          if (
            oCell.RowIid !== sRowIid &&
            oCell.ColumnIid === that._sEduColumn
          ) {
            if (
              oCell.ValueNum === "1" ||
              oCell.ValueNum == 1 ||
              oCell.ValueNum === "0001"
            ) {
              sCount++;
            }
          }
        });

        if (sCount >= 1) {
          MessageBox.warning(this.getText("maxSelectionsReached", [1]));
          oViewModel.setProperty(sBindingReference + "ValueString", "0000");
          oViewModel.setProperty(sBindingReference + "ValueNum", "0");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "0");
          var oUIElement = _getUIElement();
          if (typeof oUIElement.setState === "function") {
            oUIElement.setState(false);
          }
          return false;
        } else {
          return true;
        }
      },
      _handleResetSurvey: function (sRowIid, sFormId, sBindingReference) {
        var oViewModel = this.getModel("formDetailsModel");
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oElementSurvey = oViewModel.getProperty(sSurveyPath);
        var sSurveyName = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormName"
        );

        var oVL = new sap.ui.layout.VerticalLayout();
        oVL.addStyleClass("hapSurveyLayout");
        var that = this;

        var _doResetSurvey = function (oEvent) {
          $.each(oElementSurvey, function (i, oSurvey) {
            oSurvey.Question.Anstx = "";
            oSurvey.Question.Ansid = "0000";
          });

          oViewModel.setProperty(sSurveyPath, oElementSurvey);
          that.confirmDialog.close();
          MessageToast.show(that.getText("surveyIsReset"));
        };

        var _cancelResetSurvey = function (oEvent) {
          oViewModel.setProperty(sBindingReference + "ValueString", "0001");
          oViewModel.setProperty(sBindingReference + "ValueNum", "1");
          oViewModel.setProperty(sBindingReference + "ValueTxt", "1");
          MessageToast.show(that.getText("surveyResetCancelled"));
          that.confirmDialog.close();
        };

        this._generateConfirmDialog(
          "surveyResetConfirm",
          "surveyResetQuestion",
          [sSurveyName],
          "surveyDoReset",
          "Accept",
          "sap-icon://open-command-field",
          _doResetSurvey,
          "Warning",
          "surveyCancelReset",
          "Reject",
          "sap-icon://reset",
          _cancelResetSurvey
        );
      },
      _handleCallSurvey: function (sRowIid, sFormId, sCloseButtonVisible) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          "/surveyCloseButtonVisible",
          sCloseButtonVisible
        );
        // create dialog lazily
        if (!this._oSurveyDialog) {
          // create dialog via fragment factory
          this._oSurveyDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.ElementSurvey",
            this
          );
          this._oSurveyDialog.setEscapeHandler(this.onEscapeDialog);
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oSurveyDialog);
        }

        this._generateSurvey(sRowIid, sFormId);
        this._oSurveyDialog.data("elementRowIid", sRowIid);
        this._oSurveyDialog.data("elementFormId", sFormId);

        this._oSurveyDialog.open();
      },
      onEscapeDialog: function (oPromise) {
        oPromise.reject();
      },
      _generateSurvey: function (sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oElem = oViewModel.getProperty("/bodyElements/" + sRowIid);
        var oElementSurvey = oViewModel.getProperty(
          "/elementSurveys/" + sRowIid + "/" + sFormId
        );
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var oVL = new sap.ui.layout.VerticalLayout().addStyleClass(
          "hapSurveyLayout"
        );
        var aUIElements = [];
        var sValueAvailability =
          "${formDetailsModel>/bodyCells/" +
          oElem.RowIid +
          "/" +
          oElem.FormColumnIid +
          "/CellValueAvailability}";
        var sElementsEnabled =
          "{formDetailsModel>/bodyElements/" + oElem.RowIid + "/FormEditable}";

        oViewModel.setProperty("/surveyUIElements", []);

        var _radioButtonSelected = function (oEvent) {
          var oSource = oEvent.getSource();
          var sQpath = oSource.data("Qpath");
          var sAnsid = oSource.data("Ansid");
          var sAnstx = oSource.data("Anstx");
          oViewModel.setProperty(sQpath + "/Ansid", sAnsid);
          oViewModel.setProperty(sQpath + "/Anstx", sAnstx);
          var oQuestion = oViewModel.getProperty(
            sSurveyPath + "/" + oSource.data("Queid")
          );

          for (var i = 0; i < oQuestion.Answers.length; i++) {
            if (
              oQuestion.Answers[i].Ansid !== sAnsid &&
              oQuestion.Answers[i].Qusid !== "000"
            ) {
              var sAnstxPath =
                sSurveyPath +
                "/" +
                oQuestion.Answers[i].Qusid +
                "/Question/Anstx";
              oViewModel.setProperty(sAnstxPath, "");
            }
          }
        };

        /*Objects are not sorted*/
        var aQuepr = [];
        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          //If primary question
          if (oSurveyLine.Question.Quepr) {
            aQuepr.push(oSurveyLine.Question.Queid);
          }
        });

        /*Questions are sorted*/
        aQuepr.sort();

        /*Generate survey using primary questions*/
        var sQuein = 0;
        $.each(aQuepr, function (sIndex, sQueid) {
          var oSurveyLine = oElementSurvey[sQueid];
          sQuein++;

          var sQuePath =
            sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
          var oQueMainVL = new sap.ui.layout.VerticalLayout({
            width: "100%",
          }).addStyleClass("hapSurveyQuestionMainLayout");

          oVL.addContent(oQueMainVL);

          var oQueVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyQuestionLayout"
          );
          oQueMainVL.addContent(oQueVL);

          var oQueText = new sap.m.Text({
            text: sQuein + " - " + oSurveyLine.Question.Quetx,
          }).addStyleClass("hapSurveyQuestionText");
          oQueVL.addContent(oQueText);

          var oAnsVL = new sap.ui.layout.VerticalLayout().addStyleClass(
            "hapSurveyAnswerLayout"
          );
          if (oSurveyLine.Answers.length > 0) {
            $.each(oSurveyLine.Answers, function (sIndex, oAnswer) {
              var oAnsRBVL = new sap.ui.layout.VerticalLayout();
              var oAnsRB = new sap.m.RadioButton({
                groupName:
                  "group_" + sRowIid + "_" + oSurveyLine.Question.Queid,
                text: oAnswer.Anstx,
                select: _radioButtonSelected,
                selected:
                  "{= ${formDetailsModel>" +
                  sQuePath +
                  "/Ansid} === '" +
                  oAnswer.Ansid +
                  "' ? true : false}",
                enabled: sElementsEnabled,
              });

              aUIElements.push({
                Queid: sQueid,
                ElementType: "RadioButtonAnsid",
                UIElement: oAnsRB,
              });

              /*Set custom data*/
              oAnsRB.data("Rowid", sRowIid);
              oAnsRB.data("Queid", oSurveyLine.Question.Queid);
              oAnsRB.data("Ansid", oAnswer.Ansid);
              oAnsRB.data("Anstx", oAnswer.Anstx);
              oAnsRB.data("Qusid", null);
              oAnsRB.data("Qpath", sQuePath);
              oAnsRB.data("Qusvl", null);

              oAnsRBVL.addContent(oAnsRB);
              oAnsVL.addContent(oAnsRBVL);
              if (oElementSurvey.hasOwnProperty(oAnswer.Qusid)) {
                oAnsRB.data("Qusid", oAnswer.Qusid);
                var o2ndQue = oElementSurvey[oAnswer.Qusid];
                var sVLId = "id2ndQueMainVL_" + sRowIid + "_" + oAnswer.Queid;
                var o2ndQueMainVL = new sap.ui.layout.VerticalLayout(sVLId, {
                  visible:
                    "{= ${formDetailsModel>" +
                    sQuePath +
                    "/Ansid} === '" +
                    oAnswer.Ansid +
                    "' ? true : false}",
                }).addStyleClass("hapSurvey2ndQuestionMainLayout");
                if (oSurveyLine.Question.Ansid !== oAnswer.Ansid) {
                  o2ndQueMainVL.setVisible(false);
                }
                var o2ndQueVL = new sap.ui.layout.VerticalLayout();
                var o2ndQueText = new sap.m.Text({
                  text: o2ndQue.Question.Quetx,
                }).addStyleClass("hapSurveyQuestionText");
                o2ndQueVL.addContent(o2ndQueText);
                o2ndQueMainVL.addContent(o2ndQueVL);

                var o2ndAnsVL = new sap.ui.layout.VerticalLayout({
                  width: "100%",
                });

                var oAnsTA = new sap.m.TextArea({
                  value:
                    "{formDetailsModel>" +
                    sSurveyPath +
                    "/" +
                    oAnswer.Qusid +
                    "/Question/Anstx}",
                  width: "95%",
                  editable: sElementsEnabled,
                });

                aUIElements.push({
                  Queid: oAnswer.Qusid,
                  ElementType: "TextAreaAnstx",
                  UIElement: oAnsTA,
                });

                o2ndAnsVL.addContent(oAnsTA);
                o2ndQueMainVL.addContent(o2ndAnsVL);
                oAnsVL.addContent(o2ndQueMainVL);
              }
            });
          } else {
            var oAnsTA = new sap.m.TextArea({
              value:
                "{formDetailsModel>" +
                sSurveyPath +
                "/" +
                oSurveyLine.Question.Queid +
                "/Question/Anstx}",
              width: "100%",
              editable: sElementsEnabled,
            });
            aUIElements.push({
              Queid: oSurveyLine.Question.Queid,
              ElementType: "TextAreaAnstx",
              UIElement: oAnsTA,
            });
            oAnsVL.addContent(oAnsTA);
          }
          oQueMainVL.addContent(oAnsVL);
        });

        oViewModel.setProperty("/surveyUIElements", aUIElements);

        this._oSurveyDialog.setTitle(
          oViewModel.getProperty("/bodyElements/" + sRowIid + "/Name") +
            " - " +
            oViewModel.getProperty("/bodyElements/" + sRowIid + "/FormName")
        );

        this._oSurveyDialog.addContent(oVL);
      },
      onSurveyClose: function () {
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      onSurveyFinished: function () {
        var sRowIid = this._oSurveyDialog.data("elementRowIid");
        var sFormId = this._oSurveyDialog.data("elementFormId");

        var sSurveyIncompleted = this._checkSurveyHasFinished(sRowIid, sFormId);
        if (sSurveyIncompleted) {
          MessageBox.warning(this.getText("allQuestionsMustBeFilled"));
          return false;
        }
        this._oSurveyDialog.close();
        this._oSurveyDialog.destroyContent();
      },
      _checkSurveyHasFinished: function (sRowIid, sFormId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oElementSurvey = oViewModel.getProperty(
          "/elementSurveys/" + sRowIid + "/" + sFormId
        );
        var sSurveyPath = "/elementSurveys/" + sRowIid + "/" + sFormId;
        var sSurveyIncompleted = false;
        var aSurveyUIElements = oViewModel.getProperty("/surveyUIElements");
        var sEditable = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/FormEditable"
        );
        var that = this;

        if (!sEditable) {
          /*If survey is not editable DO NOT CHECK completeness*/
          return false;
        }

        var _setMessageState = function (sQueid, sElementType, sError) {
          var sMessageType = sError ? "Error" : "Success";
          var sMessageText = sError ? that.getText("fillSurveyFields") : "";
          for (var i = 0; i < aSurveyUIElements.length; i++) {
            var oLine = aSurveyUIElements[i];
            if (oLine.Queid === sQueid && oLine.ElementType === sElementType) {
              oLine.UIElement.setValueState(sMessageType);
              if (typeof oLine.UIElement.setValueStateText === "function") {
                oLine.UIElement.setValueStateText(sMessageText);
              }
            }
          }
        };

        $.each(oElementSurvey, function (sIndex, oSurveyLine) {
          if (oSurveyLine.Question.Quepr) {
            var sQuePath =
              sSurveyPath + "/" + oSurveyLine.Question.Queid + "/Question";
            if (oSurveyLine.Answers.length > 0) {
              if (
                oSurveyLine.Question.Ansid === "" ||
                oSurveyLine.Question.Ansid === "0000"
              ) {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "RadioButtonAnsid",
                  false
                );
                $.each(oSurveyLine.Answers, function (i, oAnswer) {
                  if (
                    oSurveyLine.Question.Ansid === oAnswer.Ansid &&
                    oAnswer.Qusid !== "000"
                  ) {
                    if (oElementSurvey[oAnswer.Qusid].Question.Anstx === "") {
                      sSurveyIncompleted = true;
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", true);
                    } else {
                      _setMessageState(oAnswer.Qusid, "TextAreaAnstx", false);
                    }
                    return false;
                  }
                });
              }
            } else {
              if (oSurveyLine.Question.Anstx === "") {
                sSurveyIncompleted = true;
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  true
                );
              } else {
                _setMessageState(
                  oSurveyLine.Question.Queid,
                  "TextAreaAnstx",
                  false
                );
              }
            }
          }
        });

        return sSurveyIncompleted;
      },
      _onRadioButtonValueSelected: function (oEvent) {
        var oSource = oEvent.getSource();
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty(
          oSource.data("bindingReference"),
          oSource.data("bindingValue")
        );
      },
      _getValueUsingAttribute: function (
        oViewData,
        sArray,
        sQueAttNam,
        sQueAttVal,
        sAttNam
      ) {
        var sAttVal;
        $.each(oViewData.formData[sArray], function (sIndex, oElement) {
          if (oElement[sQueAttNam] === sQueAttVal) {
            sAttVal = oElement[sAttNam];
            return false;
          }
        });
        return sAttVal;
      },
      _formBodyElementsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var oBodyElements = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          var oBodyElement = {};

          oBodyElement[oElement.RowIid] = oElement;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyElements, oBodyElement);
          } else {
            $.extend(oBodyElements, oBodyElement);
          }
        });

        oViewModel.setProperty("/bodyElements", oBodyElements);
      },

      _formBodyColumnsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyColumns = oViewModel.getProperty("/formData/BodyColumns");
        var oBodyColumns = {};
        var that = this;

        $.each(aBodyColumns, function (sIndex, oColumn) {
          if (oColumn.ColumnId === "OBJ0") {
            that._sObjColumn = oColumn.ColumnIid;
            /*Hedef Belirleme*/
          }

          if (oColumn.ColumnId === "FWGT") {
            that._sWeightColumn = oColumn.ColumnIid;
            /*Ağırlık*/
          }

          if (oColumn.ColumnId === "FAPP") {
            that._sFinAppColumn = oColumn.ColumnIid;
            /*Son Değerlendirme*/
          }

          if (oColumn.ColumnId === "ZAPP") {
            that._s2ndAppColumn = oColumn.ColumnIid;
            /*Son Değerlendirme*/
          }

          if (oColumn.ColumnId === "ZSEC") {
            that._sEduColumn = oColumn.ColumnIid;
          }
          if (oColumn.ColumnId === "ZTT7") {
            that._sManAppColumn = oColumn.ColumnIid;
          }

          if (oColumn.ColumnId === "ZTK6") {
            that._sObjMeaColumn = oColumn.ColumnIid;
            /*Hedef Ölçüsü*/
          }

          if (oColumn.ColumnId === "ZTK7") {
            that._sObjUniColumn = oColumn.ColumnIid;
            /*Hedef Birimi*/
          }

          if (oColumn.ColumnId === "ZTTD") {
            that._sExpValColumn = oColumn.ColumnIid;
            /*Beklenen Değer*/
          }

          if (oColumn.ColumnId === "ZTTE") {
            that._sReaValColumn = oColumn.ColumnIid;
            /*Gerçekleşen Değer*/
          }

          if (oColumn.ColumnId === "ZT09") {
            that._sSelfAppColumn = oColumn.ColumnIid;
            /*Son Değerlendirme*/
          }

          // THY-> ZTTJ   BMC-> ZT00
          if (oColumn.ColumnId === "ZTTJ" || oColumn.ColumnId === "ZT00") {
            that._sObjTeamColumn = oColumn.ColumnIid;
            /*Bölüm Hedefi*/
          }

          var oBodyColumn = {};

          oBodyColumn[oColumn.ColumnIid] = oColumn;
          if (typeof Object.assign === "function") {
            Object.assign(oBodyColumns, oBodyColumn);
          } else {
            $.extend(oBodyColumns, oBodyColumn);
          }
        });

        oViewModel.setProperty("/bodyColumns", oBodyColumns);
      },

      _formBodyCellsObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var aBodyCellValues = oViewModel.getProperty(
          "/formData/BodyCellValues"
        );
        var oBodyCells = {};
        var oBodyCellValues = {};

        $.each(aBodyElements, function (sIndex, oElement) {
          oBodyCells[oElement.RowIid] = {};
          oBodyCellValues[oElement.RowIid] = {};
        });

        $.each(aBodyCells, function (sIndex, oCell) {
          oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
          oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
          $.each(aBodyCellValues, function (sValin, oCellValue) {
            if (
              oCellValue.RowIid === oCell.RowIid &&
              oCellValue.ColumnIid === oCell.ColumnIid
            ) {
              oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                oCellValue
              );
            }
          });
        });

        oViewModel.setProperty("/bodyCells", oBodyCells);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValues);
      },

      _cloneComparisonObjects: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellsCopy = {};
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyElementsCopy = {};

        oBodyCellsCopy = this._cloneObject(oBodyCells);
        oBodyElementsCopy = this._cloneObject(oBodyElements);

        oViewModel.setProperty("/bodyCellsCopy", oBodyCellsCopy);
        oViewModel.setProperty("/bodyElementsCopy", oBodyElementsCopy);
      },
      _compareClonedObjects: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellsCopy = oViewModel.getProperty("/bodyCellsCopy");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyElementsCopy = oViewModel.getProperty("/bodyElementsCopy");

        return (
          this._compareObjects(oBodyCells, oBodyCellsCopy) &&
          this._compareObjects(oBodyElements, oBodyElementsCopy)
        );
      },
      _cloneObject: function (oSource) {
        var oTarget = $.extend(true, {}, oSource);
        return oTarget;
      },
      _compareObjects: function (o1, o2) {
        for (var p in o1) {
          if (o1.hasOwnProperty(p) && o2.hasOwnProperty(p)) {
            if (JSON.stringify(o1[p]) !== JSON.stringify(o2[p])) {
              return false;
            }
          } else {
            return false;
          }
        }

        return true;
      },
      _formElementSurveysObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var aFormQuestions = oViewModel.getProperty("/formData/FormQuestions");
        var aFormAnswers = oViewModel.getProperty("/formData/FormAnswers");
        var oElementSurveys = {};

        $.each(aFormQuestions, function (sIndex, oFormQuestion) {
          if (!oElementSurveys.hasOwnProperty(oFormQuestion.RowIid)) {
            oElementSurveys[oFormQuestion.RowIid] = {};
          }

          if (
            !oElementSurveys[oFormQuestion.RowIid].hasOwnProperty(
              oFormQuestion.Frmid
            )
          ) {
            oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid] = {};
          }

          oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
            oFormQuestion.Queid
          ] = {
            Question: oFormQuestion,
            Answers: [],
          };
          var sAnswersCollected = false;
          for (var i = 0; i < aFormAnswers.length; i++) {
            var oAnswer = aFormAnswers[i];

            if (
              !(
                oAnswer.RowIid === oFormQuestion.RowIid &&
                oAnswer.Queid === oFormQuestion.Queid &&
                oAnswer.Frmid === oFormQuestion.Frmid
              ) &&
              sAnswersCollected
            ) {
              break;
            }

            if (
              oAnswer.RowIid === oFormQuestion.RowIid &&
              oAnswer.Queid === oFormQuestion.Queid &&
              oAnswer.Frmid === oFormQuestion.Frmid
            ) {
              oElementSurveys[oFormQuestion.RowIid][oFormQuestion.Frmid][
                oFormQuestion.Queid
              ].Answers.push(oAnswer);
              sAnswersCollected = true;
            }
          }
        });

        oViewModel.setProperty("/elementSurveys", oElementSurveys);
      },

      _formParametersObject: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aParams = oViewModel.getProperty("/formData/FormParameters");
        var oParams = {};

        $.each(aParams, function (sIndex, oParam) {
          oParams[oParam.Param] = oParam.Value;
        });
        oViewModel.setProperty("/formParameters", oParams);

        oViewModel.setProperty("/navigationFormId", oParams["FIRST_ROW"]);
      },

      _convertUIData: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCellsTarget = oViewModel.getProperty("/formData/BodyCells");
        var oBodyElementsTarget = oViewModel.getProperty(
          "/formData/BodyElements"
        );
        var oBodyCellsSource = oViewModel.getProperty("/bodyCells");
        var oBodyElementsSource = oViewModel.getProperty("/bodyElements");

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsTarget.length; i++) {
          if (oBodyCellsSource.hasOwnProperty(oBodyCellsTarget[i].RowIid)) {
            if (
              oBodyCellsSource[oBodyCellsTarget[i].RowIid].hasOwnProperty(
                oBodyCellsTarget[i].ColumnIid
              )
            ) {
              oBodyCellsTarget[i] =
                oBodyCellsSource[oBodyCellsTarget[i].RowIid][
                  oBodyCellsTarget[i].ColumnIid
                ];
            } else {
              jQuery.sap.log.error("Hata 2" + oBodyCellsTarget[i]);
            }
          } else {
            jQuery.sap.log.error("Hata 1" + oBodyCellsTarget[i]);
          }
        }

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsTarget.length; j++) {
          if (
            oBodyElementsSource.hasOwnProperty(oBodyElementsTarget[j].RowIid)
          ) {
            if (oBodyElementsSource[oBodyElementsTarget[j].RowIid].FreeInput) {
              oBodyElementsSource[oBodyElementsTarget[j].RowIid].NameString =
                oBodyElementsSource[oBodyElementsTarget[j].RowIid].Name;
            }
            oBodyElementsTarget[j] =
              oBodyElementsSource[oBodyElementsTarget[j].RowIid];
          }
        }

        oViewModel.setProperty("/formData/BodyCells", oBodyCellsTarget);
        oViewModel.setProperty("/formData/BodyElements", oBodyElementsTarget);
      },
      _synchronizeUIAfterUpdate: function (oData, sUpdateButton) {
        var oViewModel = this.getModel("formDetailsModel");
        var oBodyCellsSource = oData.BodyCells.results;
        var oBodyCellValuesSource = oData.BodyCellValues.results;
        var oBodyElementsSource = oData.BodyElements.results;
        var oHeaderStatus = oData.HeaderStatus;
        var oSidebarData = oViewModel.getProperty("/sidebarData");

        oViewModel.setProperty("/formData/BodyCells", oBodyCellsSource);
        oViewModel.setProperty(
          "/formData/BodyCellValues",
          oBodyCellValuesSource
        );
        oViewModel.setProperty("/formData/BodyElements", oBodyElementsSource);
        oViewModel.setProperty("/formData/HeaderStatus", oHeaderStatus);
        if (!_.isEmpty(oData.ResultTable)) {
          oViewModel.setProperty(
            "/formData/ResultTable",
            oData.ResultTable.results
          );

          oSidebarData.footerData = this._refreshSidebarFooterData();

          oViewModel.setProperty("/sidebarData", oSidebarData);
        }

        if (sUpdateButton) {
          var oBodyButtons = oData.Buttons.results;
          oViewModel.setProperty("/formData/Buttons", oBodyButtons);
        }

        /*Adjust buttons again*/
        this._adjustButtonsNew();

        var oBodyCellsTarget = oViewModel.getProperty("/bodyCells");
        var oBodyCellValuesTarget = oViewModel.getProperty("/bodyCellValues");

        /*Update cell content*/
        for (var i = 0; i < oBodyCellsSource.length; i++) {
          oBodyCellsTarget[oBodyCellsSource[i].RowIid][
            oBodyCellsSource[i].ColumnIid
          ] = oBodyCellsSource[i];
        }

        oViewModel.setProperty("/bodyCells", oBodyCellsTarget);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValuesTarget);

        var oBodyElementsTarget = oViewModel.getProperty("/bodyElements");

        /*Update elements content*/
        for (var j = 0; j < oBodyElementsSource.length; j++) {
          oBodyElementsTarget[oBodyElementsSource[j].RowIid] =
            oBodyElementsSource[j];
        }

        oViewModel.setProperty("/bodyElements", oBodyElementsTarget);

        // this._prepareSideBarData();

        this.hasChanges = false;
      },
      _resetSections: function () {
        if (this._oPageLayout) {
          $.each(this._oPageLayout.getSections(), function (i, oCurSection) {
            oCurSection.destroySubSections();
          });

          this._oPageLayout.destroySections();
        }
      },
      /**
       * Handle form actions
       * @event handler
       * @private
       */

      _handleActionButtonPressed: function (oEvent) {
        var oButton = oEvent.getSource();
        switch (oButton.data("ButtonId")) {
          case "SAVE":
            this._handleSaveDocument();
            break;
          case "CANCEL":
            this._handleCancelDocument();
            break;
          case "PRINT":
            this._handlePrintDocument();
            break;
          case "STAT_LOG":
            this._handleShowStatNotes();
            break;
          case "NEXT":
            this._navigateToSection(oButton.data("TargetSection"));
            break;
          case "PREV":
            this._navigateToSection(oButton.data("TargetSection"));
            break;
          case "USER_GUIDE":
            this._handleCallUserGuide();
            break;
          case "SAVE&KEEP":
            this._handleSaveAndContinue();
            break;
          case "NEXT&KEEP":
            this._navigateToNextTab();
            break;
          default:
            this._handleButtonAction(oButton);
        }
        //MessageToast.show("Button pressed! Button:" + oEvent.getSource().data("ButtonId") + oEvent.getSource().data("StatusRelevant"));
      },
      _handleCancelDocument: function () {
        this.onNavBack();
      },

      _navigateToNextTab: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var aNavigationData = oViewModel.getProperty("/navigationData");

        var iIndex = aNavigationData
          .map(function (e) {
            return e.ElementId;
          })
          .indexOf(oViewModel.getProperty("/navigationFormId"));
        iIndex++;
        if (aNavigationData.length - 1 === iIndex) {
          oViewModel.setProperty("/saveAndKeepButtonVisibility", false);
        }
        var sPageId = aNavigationData[iIndex].Page.getId();

        this._oNavContainer.to(sPageId);
        this._oNavContainer.setAutoFocus(true);
        this.getModel("formDetailsModel").setProperty(
          "/navigationFormId",
          aNavigationData[iIndex].ElementId
        );

        var $items = $(".bd-side-nav-item-link");

        $items.each(function () {
          if (
            $(this).attr("data-element-row-id") ===
            aNavigationData[iIndex].RowIid
          ) {
            $(this).addClass("bd-side-nav-item-link-active");
          } else {
            $(this).removeClass("bd-side-nav-item-link-active");
          }
        });
      },

      _handleSaveAndContinue: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var sHasErrors = false;

        // var aNavigationData = oViewModel.getProperty("/navigationData");

        // var iIndex = aNavigationData
        //   .map(function (e) {
        //     return e.ElementId;
        //   })
        //   .indexOf(oViewModel.getProperty("/navigationFormId"));
        // iIndex++;

        // if (aNavigationData.length - 1 === iIndex) {
        //   oViewModel.setProperty("/saveAndKeepButtonVisibility", false);
        // }
        // var sPageId = aNavigationData[iIndex].Page.getId();

        this._convertUIData();

        this._cloneComparisonObjects();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "SAVE&KEEP",
          RowIid: null,
          ButtonId: null,
          RowElemId: oViewModel.getProperty("/navigationFormId"),
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();
        this._openBusyFragment("formSaved", []);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            sHasErrors = that._processReturnMessagesNew(
              oData.Return.results,
              true,
              "SAVE"
            );
            /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false);

            that._closeBusyFragment();

            /* Close busy indicator*/

            if (sHasErrors === false) {
              that._setChangeListeners(false);
              that._navigateToNextTab();
              // that._oNavContainer.to(sPageId);
              // that._oNavContainer.setAutoFocus(true);
              // that
              //   .getModel("formDetailsModel")
              //   .setProperty(
              //     "/navigationFormId",
              //     aNavigationData[iIndex].ElementId
              //   );

              // var $items = $(".bd-side-nav-item-link");

              // $items.each(function () {
              //   if (
              //     $(this).attr("data-element-row-id") ===
              //     aNavigationData[iIndex].RowIid
              //   ) {
              //     $(this).addClass("bd-side-nav-item-link-active");
              //   } else {
              //     $(this).removeClass("bd-side-nav-item-link-active");
              //   }
              // });
            }
          },
          error: function (oError) {
            var M = JSON.parse(oError.responseText).error.message.value;
            MessageBox.error(M);
          },
          async: true,
        });
      },

      _handleSaveDocument: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var sHasErrors = false;

        this._convertUIData();

        this._cloneComparisonObjects();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "SAVE",
          RowIid: null,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();

        this._openBusyFragment("formSaved", []);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            sHasErrors = that._processReturnMessagesNew(
              oData.Return.results,
              true,
              "SAVE"
            );

            /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false);

            /* Close busy indicator*/
            that._closeBusyFragment();

            if (sHasErrors === false) {
              that._setChangeListeners(false);
              that._doNavToMain();
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            //MessageBox.error(that.getText("formSaveError"));
            var M = JSON.parse(oError.responseText).error.message.value;
            MessageBox.error(M);
          },
          async: true,
        });
      },
      _handleShowStatNotes: function () {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");

        var aStatNotes = oViewModel.getProperty("/formData/StatusNotes", "");
        var sNotes = "";

        $.each(aStatNotes, function (i, oNote) {
          sNotes = sNotes + oNote.Tdline + "\n";
        });

        var oStatusNoteDialog = new sap.m.Dialog({
          title: "{i18n>STATUS_CHANGE_NOTES_TITLE}",
          contentWidth: "500px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              direction: "Row",
              width: "100%",
              justifyContent: "Center",
              items: [
                new sap.m.TextArea({
                  value: sNotes,
                  width: "100%",
                  rows: 5,
                  editable: false,
                  layoutData: new sap.m.FlexItemData({
                    growFactor: 1,
                    alignSelf: sap.m.FlexAlignSelf.Center,
                  }),
                }),
              ],
            }),
          ],
          endButton: new sap.m.Button({
            text: "{i18n>labelClose}",
            press: function () {
              oStatusNoteDialog.close();
            },
          }),
          afterClose: function () {
            oStatusNoteDialog.destroy();
          },
        });

        this.getView().addDependent(oStatusNoteDialog);

        oStatusNoteDialog.open();
      },
      _handleDeleteFormElement: function (oEvent) {
        var that = this;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");

        var _callRowDelete = function () {
          that.confirmDialog.close();
          that._doDeleteFormElement(sRowIid, false);
        };
        this._generateConfirmDialog(
          "elementDeletionConfirm",
          "elementDeletionQuestion",
          [sElementName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callRowDelete,
          "Warning"
        );
      },
      _deleteRowUI: function (sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aRowUIElements = oViewModel.getProperty("/formUIElements");
        var aBodyElements = oViewModel.getProperty("/formData/BodyElements");
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var aBodyCells = oViewModel.getProperty("/formData/BodyCells");
        var oBodyCells = oViewModel.getProperty("/bodyCells");

        if (oBodyElements.hasOwnProperty(sRowIid)) {
          delete oBodyElements[sRowIid];
        }
        if (oBodyCells.hasOwnProperty(sRowIid)) {
          delete oBodyCells[sRowIid];
        }

        for (var i = aRowUIElements.length - 1; i >= 0; i--) {
          if (aRowUIElements[i].RowIid === sRowIid) {
            try {
              if (
                typeof aRowUIElements[i].UIElement.destroyContent === "function"
              ) {
                aRowUIElements[i].UIElement.destroyContent();
              }
            } catch (err) {
              jQuery.sap.log.error(
                sRowIid + " satırının içeriği silinirken hata"
              );
            }
            try {
              if (typeof aRowUIElements[i].UIElement.destroy === "function") {
                aRowUIElements[i].UIElement.destroy();
              }
            } catch (err) {
              jQuery.sap.log.error(sRowIid + " satırı silinirken hata");
            }
            aRowUIElements.splice(i, 1);
          }
        }

        for (var j = aBodyElements.length - 1; j >= 0; j--) {
          if (aBodyElements[j].RowIid === sRowIid) {
            aBodyElements.splice(j, 1);
          }
        }

        for (var k = aBodyCells.length - 1; k >= 0; k--) {
          if (aBodyCells[k].RowIid === sRowIid) {
            aBodyCells.splice(k, 1);
          }
        }

        oViewModel.setProperty("/formUIElements", aRowUIElements);
        oViewModel.setProperty("/formData/BodyElements", aBodyElements);
        oViewModel.setProperty("/bodyElements", oBodyElements);
        oViewModel.setProperty("/formData/BodyCells", aBodyCells);
        oViewModel.setProperty("/bodyCells", oBodyCells);
      },
      _removeAllMessages: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/formMessages", []);
      },
      _processReturnMessagesNew: function (aReturn, sShowMessages, sButtonId) {
        var sHasErrors = false;

        this._removeAllMessages();

        $.each(aReturn, function (sIndex, oReturn) {
          switch (oReturn.Type) {
            case "S":
              if (sButtonId !== "SAVE") {
                MessageBox.show(oReturn.Message, {
                  icon: MessageBox.Icon.SUCCESS,
                  title: "Bilgi",
                  actions: [MessageBox.Action.CLOSE],
                });
              }
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
      _processReturnMessages: function (aReturn, sShowMessages) {
        var that = this;
        var sHasErrors = false;

        $.each(aReturn, function (sIndex, oReturn) {
          var sMessageType = sap.ui.core.MessageType.None;

          switch (oReturn.Type) {
            case "S":
              sMessageType = sap.ui.core.MessageType.Success;
              break;
            case "W":
              sMessageType = sap.ui.core.MessageType.Warning;
              break;
            case "I":
              sMessageType = sap.ui.core.MessageType.Information;
              break;
            case "E":
            case "A":
              sMessageType = sap.ui.core.MessageType.Error;
              sHasErrors = true;
              sShowMessages = true;
              break;
          }
          if (sShowMessages || oReturn.Type === "E") {
            that._oMessageManager.addMessages(
              new sap.ui.core.message.Message({
                message: oReturn.Message,
                type: sMessageType,
                processor: that._oMessageProcessor,
              })
            );
          }
        });
        if (aReturn.length > 0 && sShowMessages) {
          that.onMessagesButtonPress(null);
        }

        return sHasErrors;
      },
      _doDeleteFormElement: function (sRowIid, sNoMsg) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var sHasErrors = false;

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "DELETE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
        };

        this._removeAllMessages();

        this._openBusyFragment();
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Return messages */
            sHasErrors = that._processReturnMessagesNew(
              oData.Return.results,
              false
            );

            if (!sHasErrors && !sNoMsg) {
              MessageToast.show(that.getText("elementDeleteSuccessful"));
            }

            that._deleteRowUI(sRowIid);

            // /* Synchronize UI */
            that._synchronizeUIAfterUpdate(oData, false);

            /* Close busy indicator*/
            that._closeBusyFragment();
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _handleListAttachment: function (oEvent) {
        var oButton = oEvent.getSource();
        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");
        var that = this;
        var sDelVisible =
          "{=  ( ${formDetailsModel>LastUser} === ${formDetailsModel>Uname}) && ( ${formDetailsModel>/bodyElements/" +
          oButton.data("elementRowIid") +
          "/AttachmentVisible} === true ) ? true : false }";

        var oColumnListItem = new sap.m.ColumnListItem();
        var oUrlPath =
          oModel.sServiceUrl +
          "/AttachmentSet(AppraisalId=guid'" +
          oViewModel.getProperty("/appraisalId") +
          "',RowIid='" +
          oButton.data("elementRowIid") +
          "',Id='" +
          "{formDetailsModel>Id}" +
          "')/$value";
        var oLink = new sap.m.Link({
          target: "_blank",
          text: "{formDetailsModel>Name}" + "." + "{formDetailsModel>Type}",
          href: oUrlPath,
          tooltip: oUrlPath,
        });
        var oDelButton = new sap.m.Button({
          icon: "sap-icon://delete",
          type: "Reject",
          press: that._handleDeleteAttachment.bind(that),
          visible: sDelVisible,
        });

        var oRowId = new sap.ui.core.CustomData({
          key: "elementRowIid",
        });
        oRowId.bindProperty("value", "formDetailsModel>RowIid");
        var oAttachmentId = new sap.ui.core.CustomData({
          key: "attachmentId",
        });
        oAttachmentId.bindProperty("value", "formDetailsModel>Id");

        var oAttachmentName = new sap.ui.core.CustomData({
          key: "attachmentName",
        });
        oAttachmentName.bindProperty("value", "formDetailsModel>Name");

        var oAttachmentType = new sap.ui.core.CustomData({
          key: "attachmentType",
        });
        oAttachmentType.bindProperty("value", "formDetailsModel>Type");

        oDelButton.addCustomData(oRowId);
        oDelButton.addCustomData(oAttachmentId);
        oDelButton.addCustomData(oAttachmentName);
        oDelButton.addCustomData(oAttachmentType);

        oColumnListItem.addCell(oLink);
        oColumnListItem.addCell(oDelButton);

        // create dialog lazily
        if (!this._oListAttachmentDialog) {
          // create dialog via fragment factory
          this._oListAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.AttachmentList",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oListAttachmentDialog);
        }

        sap.ui
          .getCore()
          .byId("idAttachmentList")
          .bindItems({
            path:
              "formDetailsModel>/attachmentCollection/" +
              oButton.data("elementRowIid") +
              "/attachmentList",
            template: oColumnListItem,
          });
        this._oListAttachmentDialog.openBy(oButton);
      },
      onCloseAttachmentPopover: function () {
        this._oListAttachmentDialog.close();
      },
      _handleAddAttachment: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/currentRowIid", oEvent.rowIid.getValue());

        this._openUploadAttachmentDialog();
      },
      _handleDeleteAttachment: function (oEvent) {
        var that = this;
        var oButton = oEvent.getSource();
        var sRowIid = oButton.data("elementRowIid");
        var sAttachmentId = oButton.data("attachmentId");
        var sAttachmentName =
          oButton.data("attachmentName") + "." + oButton.data("attachmentType");
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var sPath =
          "/AttachmentSet(" +
          "AppraisalId=guid'" +
          oViewModel.getProperty("/appraisalId") +
          "'," +
          "RowIid='" +
          sRowIid +
          "'," +
          "Id='" +
          sAttachmentId +
          "')";

        that._oListAttachmentDialog.close();

        var _callAttachmentDelete = function () {
          that.confirmDialog.close();
          that._openBusyFragment("attachmentBeingDeleted");
          oModel.remove(sPath, {
            success: function (oData, oResponse) {
              that._refreshAttachmentList();
              that._closeBusyFragment();
              MessageToast.show(that.getText("attachmentDeleteSuccess"));
            },
            error: function (oError) {
              that._closeBusyFragment();
              MessageToast.show(that.getText("attachmentDeleteError"));
            },
          });
        };
        this._generateConfirmDialog(
          "attachmentDeletionConfirm",
          "attachmentDeletionQuestion",
          [sAttachmentName],
          "elementDelete",
          "Reject",
          "sap-icon://delete",
          _callAttachmentDelete,
          "Warning"
        );
      },
      _handleOpenSurvey: function (oEvent) {
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sFormId = oEvent.getSource().data("elementFormId");
        var oCurrentForm =
          this.getModel("formDetailsModel").getProperty("/currentForm");
        if (oCurrentForm.RoleId === "MA") {
          this._handleCallSurvey(sRowIid, sFormId, true);
        } else {
          this._handleCallSurvey(sRowIid, sFormId, false);
        }
      },

      _checkMaxChildren: function (sRowIid) {
        var oCheck = this._getChildrenCount(sRowIid);
        if (oCheck.Max > 0) {
          return oCheck.Cur < oCheck.Max ? 0 : oCheck.Max;
        } else {
          return 0;
        }
      },

      _getChildrenCount: function (sRowIid) {
        var oViewModel = this.getModel("formDetailsModel");
        var aBodyElements = oViewModel.getProperty("/bodyElements");
        var sMaxChildren = oViewModel.getProperty(
          "/bodyElements/" + sRowIid + "/MaxChildCount"
        );
        var sChildrenCount = 0;

        $.each(aBodyElements, function (sIndex, oBodyElement) {
          if (oBodyElement.Parent === sRowIid) {
            sChildrenCount++;
          }
        });

        return {
          Max: sMaxChildren,
          Cur: sChildrenCount,
        };
      },

      _handleAddFormElement: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var sHasErrors = false;
        var sRowIid = oEvent.getSource().data("elementRowIid");
        var sElementName = oEvent.getSource().data("elementName");
        var sMaxChildren = this._checkMaxChildren(sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                that._buildCatalogForSelection(oData, sRowIid);
              } else {
                /*Free enhancement*/
                that._enhanceDocument(
                  oData,
                  sRowIid,
                  false,
                  sElementName,
                  false
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },

      _handleAddFreeFormElement: function (oParam) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var oElem = oParam.oElem;
        var sObj = oParam.sObj;

        var sRowIid = oElem.RowIid;
        var sElementName = oElem.Name;

        var sHasErrors = false;
        var sMaxChildren = this._checkMaxChildren(sRowIid);

        if (sMaxChildren > 0) {
          MessageBox.warning(
            this.getText("newElementMaxChildrenReached", [
              sMaxChildren,
              sElementName,
            ]),
            {
              title: this.getText("newElementAdditionError"),
            }
          );
          return;
        }

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCE",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyColumns: oViewModel.getProperty("/formData/BodyColumns"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: oViewModel.getProperty(
            "/formData/FeBodyElementsAdd"
          ),
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementInformation", [sElementName]);
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              if (oData.ReturnOp.UiDeferred === "X") {
                /*Add from tree or list*/
                that._buildCatalogForSelection(oData, sRowIid);
              } else {
                /*Free enhancement*/
                that._enhanceDocument(
                  oData,
                  sRowIid,
                  false,
                  sElementName,
                  sObj
                );
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _enhanceDocumentFromCatalog: function (aSelectedObjects) {
        var oViewModel = this.getModel("formDetailsModel");
        var oEnhanceModel = this.getModel("enhanceModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var sHasErrors = false;
        var sRowIid = oEnhanceModel.getProperty("/RowIid");
        var oCheck = this._getChildrenCount(sRowIid);
        var aElementsAdd = [];
        var sSpace = null;

        if (oCheck.Max > 0) {
          sSpace = oCheck.Max - oCheck.Cur;
        }

        if (aSelectedObjects.length > 0 && sSpace !== null) {
          if (aSelectedObjects.length > sSpace) {
            MessageBox.warning(
              this.getText("maxChildSelectionReached", [
                sSpace,
                aSelectedObjects.length,
              ])
            );
            return;
          }
        }

        this._oAddNewElementCatalogDialog.close();

        $.each(aSelectedObjects, function (sIndex, oSelectedObject) {
          aElementsAdd.push({
            AppraisalId: oViewModel.getProperty("/appraisalId"),
            NewElementType: oSelectedObject.Otype,
            NewElementId: oSelectedObject.Objid,
          });
        });

        this._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "ENHANCEADD",
          RowIid: sRowIid,
          ButtonId: null,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          FeBodyElementsAdd: aElementsAdd,
          FeAlreadyChosen: oViewModel.getProperty("/formData/FeAlreadyChosen"),
          FeFlatAvailable: oViewModel.getProperty("/formData/FeFlatAvailable"),
          FeSelectableOtype: oViewModel.getProperty(
            "/formData/FeSelectableOtype"
          ),
          FeStrucAvailable: oViewModel.getProperty(
            "/formData/FeStrucAvailable"
          ),
          FormAnswers: oViewModel.getProperty("/formData/FormAnswers"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("newElementIsAdded");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  false
                );
              }
            }

            if (!sHasErrors) {
              that._enhanceDocument(oData, sRowIid, true, null, false);
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            jQuery.sap.log.error(oError);
          },
          async: true,
        });
      },
      _buildCatalogForSelection: function (oData, sRowIid) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var aStruc = [];
        var aChosen = [];
        if (!oEnhanceModel) {
          oEnhanceModel = new JSONModel();
          this.setModel(oEnhanceModel, "enhanceModel");
        }
        try {
          aChosen = oData.FeAlreadyChosen.results;
        } catch (oErr) {
          aChosen = [];
        }
        var _returnChildren = function (sOtype, sObjid) {
          var aChildren = [];

          for (var i = 0; i < aStruc.length; i++) {
            if (
              aStruc[i].PupOtype === sOtype &&
              aStruc[i].PupObjid === sObjid
            ) {
              var oChild = {};
              oChild.Stext = aStruc[i].Stext;
              oChild.Description1 = aStruc[i].P10020001;
              oChild.Description2 = aStruc[i].P10020003;
              oChild.Otype = aStruc[i].Otype;
              oChild.Objid = aStruc[i].Objid;
              oChild.PupOtype = sOtype;
              oChild.PupObjid = sObjid;
              oChild.Selectable = false;
              oChild.Selected = false;
              oChild.AlreadySelected = false;
              if (aStruc[i].Vcount === 0) {
                oChild.Selectable = true;
              }
              var sChildFound = false;
              sChildFound = aChosen.some(function (oChosen) {
                return (
                  oChosen.Otype === oChild.Otype &&
                  oChosen.Sobid === oChild.Objid
                );
              });
              if (sChildFound) {
                oChild.AlreadySelected = true;
              }
              oChild.Children = _returnChildren(oChild.Otype, oChild.Objid);
              aChildren.push(oChild);
            } // if (aStruc[i].PupOtype ...
          } //	for (var i = 0; ...
          return aChildren;
        };

        var _returnRoots = function () {
          var oHierarchy = {
            Hierarchy: {
              Children: [],
            },
          };
          for (var i = 0; i < aStruc.length; i++) {
            if (aStruc[i].Level === 1 && aStruc[i].PupObjid === "00000000") {
              var oRoot = {};
              oRoot.Stext = aStruc[i].Stext;
              oRoot.Description1 = null;
              oRoot.Description2 = null;
              oRoot.Otype = aStruc[i].Otype;
              oRoot.Objid = aStruc[i].Objid;
              oRoot.Selectable = false;
              oRoot.AlreadySelected = false;
              oRoot.Children = _returnChildren(oRoot.Otype, oRoot.Objid);
              oHierarchy.Hierarchy.Children.push(oRoot);
            }
          }
          return oHierarchy;
        };

        /*Initiate tree data*/
        oEnhanceModel.setData({});
        if (oData.FeStrucAvailable !== null) {
          try {
            aStruc = oData.FeStrucAvailable.results;
            oEnhanceModel.setData(_returnRoots());
            oEnhanceModel.setProperty("/RowIid", sRowIid);
            this._openAddNewElementCatalogDialog();
          } catch (oErr) {
            jQuery.sap.log.error(oErr);
          }
        }
      },
      _enhanceDocument: function (
        oData,
        sRowIid,
        sFromCatalog,
        sParentName,
        sObj
      ) {
        var oViewModel = this.getModel("formDetailsModel");
        var aRowUIElements = oViewModel.getProperty("/formUIElements");
        var aBodyElements = oData.BodyElements.hasOwnProperty("results")
          ? oData.BodyElements.results
          : [];
        var aBodyCells = oData.BodyCells.hasOwnProperty("results")
          ? oData.BodyCells.results
          : [];
        var aBodyCellValues = oData.BodyCellValues.hasOwnProperty("results")
          ? oData.BodyCellValues.results
          : [];
        var aFormQuestions = [];
        var aFormAnswers = [];
        var oBodyElements = oViewModel.getProperty("/bodyElements");
        var oBodyCells = oViewModel.getProperty("/bodyCells");
        var oBodyCellValues = oViewModel.getProperty("/bodyCellValues");
        var oElementSurveys = oViewModel.getProperty("/elementSurveys");
        var oFormQuestions = oViewModel.getProperty("/formData/FormQuestions");
        var oFormAnswers = oViewModel.getProperty("/formData/FormAnswers");
        var oCurrentRowPanel = null;
        var sChildRowIid = null;
        var sNewRowIid = null;
        var that = this;

        //->Serkan
        //eklemeden vazgeçilirse eklenmemiş yapıyı geri almak için oluşturuldu
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty("/formData/BodyCells")
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/formData/BodyCellValues")
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty("/formData/BodyElements")
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyCells",
          aBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyCellValues",
          aBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/aBodyElements",
          aBodyElementsClone
        );

        var oBodyCellsClone = _.clone(oBodyCells);
        var oBodyCellValuesClone = _.clone(oBodyCellValues);
        var oBodyElementsClone = _.clone(oBodyElements);
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyCells",
          oBodyCellsClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyCellValues",
          oBodyCellValuesClone
        );
        oViewModel.setProperty(
          "/beforeAddFreeFormData/oBodyElements",
          oBodyElementsClone
        );
        //<- Serkan

        if (oData.FormQuestions !== null) {
          aFormQuestions = oData.FormQuestions.hasOwnProperty("results")
            ? oData.FormQuestions.results
            : [];
          aFormAnswers = oData.FormAnswers.hasOwnProperty("results")
            ? oData.FormAnswers.results
            : [];
        }

        $.each(aBodyElements, function (sIndex, oElement) {
          if (oElement.RowIid === sRowIid) {
            sChildRowIid = oElement.Child;
          }
          if (!oBodyElements.hasOwnProperty(oElement.RowIid)) {
            /*Set New Elements Row Id */
            sNewRowIid = oElement.RowIid;
            oViewModel.setProperty("/newElement/RowIid", oElement.RowIid);
            oViewModel.setProperty("/newElement/PlaceHolder", oElement.Name);
            oViewModel.setProperty("/newElement/ParentName", sParentName);

            var oNewElement = {};
            oNewElement[oElement.RowIid] = oElement;
            if (typeof Object.assign === "function") {
              Object.assign(oBodyElements, oNewElement);
            } else {
              $.extend(oBodyElements, oNewElement);
            }

            oBodyCells[oElement.RowIid] = {};
            oBodyCellValues[oElement.RowIid] = {};
          } else {
            oBodyElements[oElement.RowIid] = oElement;
          }
        });

        $.each(aBodyCells, function (sIndex, oCell) {
          if (!oBodyCells[oCell.RowIid].hasOwnProperty([oCell.ColumnIid])) {
            oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
            oBodyCellValues[oCell.RowIid][oCell.ColumnIid] = {};
            oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues = [];
            $.each(oData.BodyCellValues.results, function (sValin, oCellValue) {
              if (
                oCellValue.RowIid === oCell.RowIid &&
                oCellValue.ColumnIid === oCell.ColumnIid
              ) {
                oBodyCellValues[oCell.RowIid][oCell.ColumnIid].CellValues.push(
                  oCellValue
                );
              }
            });
          } else {
            oBodyCells[oCell.RowIid][oCell.ColumnIid] = oCell;
          }
        });

        $.each(aFormQuestions, function (sIndex, oQuestion) {
          if (!oElementSurveys.hasOwnProperty(oQuestion.RowIid)) {
            oFormQuestions.push(oQuestion);
          }
        });

        $.each(aFormAnswers, function (sIndex, oAnswer) {
          if (!oElementSurveys.hasOwnProperty(oAnswer.RowIid)) {
            oFormAnswers.push(oAnswer);
          }
        });

        oViewModel.setProperty("/formData/BodyElements", aBodyElements);
        oViewModel.setProperty("/formData/BodyCells", aBodyCells);
        oViewModel.setProperty("/formData/BodyCellValues", aBodyCellValues);
        oViewModel.setProperty("/formData/FormQuestions", oFormQuestions);
        oViewModel.setProperty("/formData/FormAnswers", oFormAnswers);
        oViewModel.setProperty("/bodyElements", oBodyElements);
        oViewModel.setProperty("/bodyCells", oBodyCells);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValues);

        /*Re-produce surveys*/
        that._formElementSurveysObject();

        var _doEnhance = function () {
          var oCurrentRow = _.find(aRowUIElements, {
            RowIid: sRowIid,
            ColumnIid: null,
            UIType: "RowPanel",
          });

          oCurrentRowPanel = oCurrentRow ? oCurrentRow.UIElement : null;

          if (
            oCurrentRowPanel !== null &&
            sNewRowIid !== null &&
            sNewRowIid !== "0000"
          ) {
            var oViewData = oViewModel.getData();
            that._addRowNew(
              oCurrentRowPanel,
              oViewData,
              sNewRowIid,
              true,
              false
            );

            var aFormUIElements = oViewModel.getProperty("/formUIElements");
            var oNewInput = _.find(aFormUIElements, {
              RowIid: sNewRowIid,
              ColumnIid: null,
              UIType: "RowPanelHeader",
            });
            if (oNewInput.UIElement) {
              oNewInput.UIElement.addEventDelegate({
                onAfterRendering: function () {
                  oNewInput.UIElement.focus();
                },
              });
            }
          }
        };

        this._addElementCallBack = null;

        if (!sObj) {
          if (!sFromCatalog) {
            this._addElementCallBack = _doEnhance;
            this._openAddNewElementFreeFormDialog(sNewRowIid, oData);
          }
        } else {
          this._addElementCallBack = _doEnhance;
          this._openAddNewElementObjectiveDialog();
        }
      }, //_enhanceDocument

      _checkMandatoryStatusNote: function (sButtonId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var that = this;
        var sHasErrors = false;
        that._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "CHECK_MNOTE",
          RowIid: null,
          ButtonId: sButtonId,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          Buttons: oViewModel.getProperty("/formData/Buttons"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  true
                );
              }
            }

            if (!sHasErrors) {
              return oData.ReturnOp.StatusNote;
            } else {
              return "";
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            MessageBox.error(that.getText("formStatusChangeError"));
          },
          async: true,
        });
      },
      _doChangeFormStatus: function (sButtonId) {
        var oViewModel = this.getModel("formDetailsModel");
        var oModel = this.getModel();
        var aFormProp = oViewModel.getProperty("/aFormProp");
        var that = this;
        var sHasErrors = false;

        that._convertUIData();

        var oOperation = {
          AppraisalId: oViewModel.getProperty("/appraisalId"),
          PartApId: "0000",
          Operation: "STAT_CHNG",
          RowIid: null,
          StatusNote: oViewModel.getProperty("/statusChangeNote"),
          ButtonId: sButtonId,
          BodyElements: oViewModel.getProperty("/formData/BodyElements"),
          ResultTable: oViewModel.getProperty("/formData/ResultTable"),
          BodyCells: oViewModel.getProperty("/formData/BodyCells"),
          BodyCellValues: oViewModel.getProperty("/formData/BodyCellValues"),
          HeaderStatus: oViewModel.getProperty("/formData/HeaderStatus"),
          Return: oViewModel.getProperty("/formData/Return"),
          ReturnOp: oViewModel.getProperty("/formData/ReturnOp"),
          Buttons: oViewModel.getProperty("/formData/Buttons"),
          FormQuestions: oViewModel.getProperty("/formData/FormQuestions"),
        };

        this._removeAllMessages();

        this._openBusyFragment("formStatusChange");
        oModel.create("/DocumentOperationsSet", oOperation, {
          success: function (oData, oResponse) {
            /* Close busy indicator*/
            that._closeBusyFragment();

            /* Return messages */
            if (oData.Return !== null) {
              if (oData.Return.hasOwnProperty("results")) {
                sHasErrors = that._processReturnMessagesNew(
                  oData.Return.results,
                  true
                );
              }
            }

            if (!sHasErrors) {
              /* Synchronize UI */
              that._synchronizeUIAfterUpdate(oData, true);
              that.getUIHelper().setFormListUpdated(false);
              MessageToast.show(that.getText("formStatusChangeSuccessful"));
              if (oData.ReturnOp.DocumentLeave === "X") {
                that.onNavBack();
              } else if (oData.ReturnOp.DocumentLeave === "1") {
                /*Do nothing*/
              }
            }
          },
          error: function (oError) {
            that._closeBusyFragment();
            MessageBox.error(that.getText("formStatusChangeError"));
          },
          async: true,
        });
      },
      _handleButtonAction: function (oButton) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        var aButton = oViewModel.getProperty("/formData/Buttons");
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var oButtonData = null;

        $.each(aButton, function (sIndex, oData) {
          if (oData.Id === sButtonId) {
            oButtonData = oData;
            return false;
          }
        });
        var sFormId = oButtonData.FormId;
        var sRowIid = oButtonData.FormRowIid;

        var _doCallSurvey = function () {
          that._handleCallSurvey(sRowIid, sFormId, true);
        };

        var _doChangeStatus = function () {
          that._handleChangeStatus(sButtonId);
        };

        /* Check if survey has to be filled */
        if (sFormId !== "" && sFormId !== null) {
          var sSurveyIncompleted = this._checkSurveyHasFinished(
            sRowIid,
            sFormId
          );
          if (sSurveyIncompleted) {
            this._generateConfirmDialog(
              "surveyNotice",
              "surveyShouldBeFilled",
              [],
              "fillSurvey",
              "Accept",
              "sap-icon://survey",
              _doCallSurvey,
              "Warning",
              "continueWithoutFilling",
              "Reject",
              "sap-icon://process",
              _doChangeStatus
            );

            // MessageBox.warning(that.getText("surveyShouldBeFilled"), {
            // 	actions: ["Doldurmak için tıklayınız"],
            // 	onClose: function(sAction) {
            // 		that._handleCallSurvey(sRowIid, sFormId);
            // 	}
            // });
            return false;
          } else {
            this._handleChangeStatus(sButtonId);
          }
        } else if (
          oButtonData.FbColumnIid !== "0000" &&
          oButtonData.FbRowIid !== "0000"
        ) {
          that._getFeedBack(
            oButtonData.FbColumnIid,
            oButtonData.FbRowIid,
            oButtonData.FbQuestionText,
            sButtonId
          );
          return false;
        } else {
          /* Check if feedback should be taken*/
          if (sStatusNoteAvailability === "") {
            this._handleChangeStatus(sButtonId);
          } else {
            this._handleChangeStatusWithNote(oButton);
          }
        }
      },
      _handleChangeStatusWithNote: function (oButton) {
        var that = this;
        var sButtonId = oButton.data("ButtonId");
        var sStatusNoteAvailability = oButton.data("StatusNoteAvailability");
        var sButtonText = oButton.getText();

        var oViewModel = this.getModel("formDetailsModel");

        oViewModel.setProperty("/statusChangeNote", "");

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
                  value: "{formDetailsModel>/statusChangeNote}",
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
              if (sStatusNoteAvailability === "M" && sNote === "") {
                MessageToast.show(that.getText("STATUS_CHANGE_NOTE_MANDATORY"));
                return;
              }
              oStatusChangeNoteDialog.close();
              that._doChangeFormStatus(sButtonId);
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
      },
      _handleChangeStatus: function (sButtonId) {
        var that = this;

        var _doChangeStatus = function () {
          that.confirmDialog.close();
          that._doChangeFormStatus(sButtonId);
        };

        this._generateConfirmDialog(
          "formStatusChangeConfirm",
          "formStatusChangeQuestion",
          [],
          "doFormStatusChange",
          "Accept",
          "sap-icon://accept",
          _doChangeStatus,
          "Warning"
        );
      },
      _getFeedBack: function (sColumnIid, sRowIid, sQuestionText, sButtonId) {
        var sSelectedClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? -1 : ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0001' ? 0 : ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueString} === '0000' ? 1 : -1 }";
        var sNoClause =
          "{= ${formDetailsModel>/bodyCells/" +
          sRowIid +
          "/" +
          sColumnIid +
          "/ValueNum} !== '1' ? true : false }";

        var sCellValueNum =
          "/bodyCells/" + sRowIid + "/" + sColumnIid + "/ValueNum";
        var sCellValueString =
          "/bodyCells/" + sRowIid + "/" + sColumnIid + "/ValueString";

        var that = this;

        var oFeedBackDialog = new sap.m.Dialog({
          title: sQuestionText,
          contentWidth: "550px",
          type: "Message",
          state: "Warning",
          content: [
            new sap.m.FlexBox({
              alignItems: "Stretch",
              justifyContent: "Center",
              items: [
                new sap.m.RadioButtonGroup({
                  selectedIndex: -1,
                  columns: 2,
                  buttons: [
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Evet",
                      select: that._onRadioButtonValueSelected.bind(that),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0001"),
                    new sap.m.RadioButton({
                      width: "150px",
                      text: "Hayır",
                      select: that._onRadioButtonValueSelected.bind(that),
                    })
                      .data("bindingReference", sCellValueString)
                      .data("bindingValue", "0002"),
                  ],
                }),
              ],
            }),
          ],
          beginButton: new sap.m.Button({
            text: "Onayla",
            type: "Accept",
            press: function () {
              oFeedBackDialog.close();
              that._handleChangeStatus(sButtonId);
            },
          }),
          endButton: new sap.m.Button({
            text: "İptal",
            press: function () {
              oFeedBackDialog.close();
            },
          }),
          afterClose: function () {
            oFeedBackDialog.destroy();
          },
        });

        oFeedBackDialog.open();
      },

      _handlePrintDocument: function () {
        /*To be coded later on*/
      },
      _openAddNewElementFreeDialog: function () {
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.AddNewElementFree",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeDialog);
        }

        this._oAddNewElementFreeDialog.open();
      },
      _openAddNewElementFreeFormDialog: function (sNewRowIid, oEnhanceData) {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementFreeFormDialog) {
          // create dialog via fragment factory
          this._oAddNewElementFreeFormDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.AddNewElementFreeForm",
            this
          );
          //escape handler
          this._oAddNewElementFreeFormDialog.setEscapeHandler(function (o) {
            o.reject();
            that.onCloseAddElementFree();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementFreeFormDialog);
        }

        var oForm = sap.ui.getCore().byId("idNewElementFreeForm");
        try {
          oForm.destroyFormContainers();
          this._addNewElementFreeFormCells(oForm, sNewRowIid, oEnhanceData);
          this._oAddNewElementFreeFormDialog.open();
        } catch (oErr) {
          console.log(oErr);
        }
      },
      _openAddNewElementObjectiveDialog: function () {
        var that = this;
        var oViewModel = this.getModel("formDetailsModel");
        oViewModel.setProperty("/newElement/Value", "");

        // create dialog lazily
        if (!this._oAddNewElementObjectiveDialog) {
          // create dialog via fragment factory
          this._oAddNewElementObjectiveDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.AddNewElementObjective",
            this
          );
          //escape handler
          this._oAddNewElementObjectiveDialog.setEscapeHandler(function (o) {
            o.reject();
            that.onCloseAddElementObjective();
          });
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementObjectiveDialog);
        }
        this._oAddNewElementObjectiveDialog.open();
      },
      _openAddNewElementCatalogDialog: function () {
        // create dialog lazily
        if (!this._oAddNewElementCatalogDialog) {
          // create dialog via fragment factory
          this._oAddNewElementCatalogDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.AddNewElementCatalog",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oAddNewElementCatalogDialog);
        }

        this._oAddNewElementCatalogDialog.open();
      },

      onCloseAddElementCatalog: function () {
        this._oAddNewElementCatalogDialog.close();
        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onApplyAddElementCatalog: function (oEvent) {
        var oEnhanceModel = this.getModel("enhanceModel");
        var oCatalog = oEnhanceModel.getProperty("/Hierarchy");
        var aSelectedObjects = [];

        var _returnSelected = function (oElement) {
          if (oElement.hasOwnProperty("Children")) {
            if (oElement.Children.length > 0) {
              $.each(oElement.Children, function (sIndex, oChild) {
                if (
                  oChild.hasOwnProperty("AlreadySelected") &&
                  oChild.hasOwnProperty("Selected")
                ) {
                  if (!oChild.AlreadySelected && oChild.Selected) {
                    var oSelectedObject = {
                      Otype: oChild.Otype,
                      Objid: oChild.Objid,
                    };
                    aSelectedObjects.push(oSelectedObject);
                  }
                }
                _returnSelected(oChild);
              });
            }
          }
        };

        _returnSelected(oCatalog);

        //MessageToast.show("Seçilen öğe:" + oSource.data("referenceObjectId") + "," + oSource.data("referenceObjectType"));
        if (aSelectedObjects.length > 0) {
          this._enhanceDocumentFromCatalog(aSelectedObjects);
        } else {
          this._oAddNewElementCatalogDialog.close();
          MessageToast.show(this.getText("noElementSelected"));
        }
      },
      onCloseAddElementFree: function () {
        this.onRestoreAddElement();
        this._oAddNewElementFreeFormDialog.close();

        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onRestoreAddElement: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oNewElement = oViewModel.getProperty("/newElement");
        var oViewData = oViewModel.getData();

        // Aşağıda satır silme işlemi child,brother,sort yapısını bozuyor
        // var aBodyElements = _.filter(oViewData.formData.BodyElements, function (o) {
        // 	return o.RowIid !== oNewElement.RowIid;
        // });
        // var aBodyCells = _.filter(oViewData.formData.BodyCells, function (o) {
        // 	return o.RowIid !== oNewElement.RowIid;
        // });
        // var oBodyElements = oViewData.bodyElements;
        // var oBodyCells = oViewData.bodyCells;
        // var oBodyCellValues = oViewData.bodyCellValues;

        // delete oBodyElements[oNewElement.RowIid];
        // delete oBodyCells[oNewElement.RowIid];
        // delete oBodyCellValues[oNewElement.RowIid];

        //-> Serkan
        var aBodyCellsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyCells")
        );
        var aBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyCellValues")
        );
        var aBodyElementsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/aBodyElements")
        );

        var oBodyCellsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyCells")
        );
        var oBodyCellValuesClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyCellValues")
        );
        var oBodyElementsClone = _.clone(
          oViewModel.getProperty("/beforeAddFreeFormData/oBodyElements")
        );

        oViewModel.setProperty("/formData/BodyElements", aBodyElementsClone);
        oViewModel.setProperty("/formData/BodyCells", aBodyCellsClone);
        oViewModel.setProperty(
          "/formData/BodyCellValues",
          aBodyCellValuesClone
        );

        oViewModel.setProperty("/bodyElements", oBodyElementsClone);
        oViewModel.setProperty("/bodyCells", oBodyCellsClone);
        oViewModel.setProperty("/bodyCellValues", oBodyCellValuesClone);
        //<- Serkan
      },
      onApplyAddElementFree: function () {
        var oViewModel = this.getModel("formDetailsModel");
        var oNewElement = oViewModel.getProperty("/newElement");
        var sTargetPath = "/bodyElements/" + oNewElement.RowIid + "/Name";

        if (typeof this._addElementCallBack === "function") {
          this._addElementCallBack.call();
        }

        oNewElement.Value = oViewModel.getProperty(sTargetPath);
        this._oAddNewElementFreeFormDialog.close();
        MessageToast.show(this.getText("newElementAdded", [oNewElement.Value]));
      },
      onCloseAddElementObjective: function () {
        this.onRestoreAddElement();
        this._oAddNewElementObjectiveDialog.close();
        MessageToast.show(this.getText("addOperationCancelled"));
      },
      onSelectObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oNewElement = oViewModel.getProperty("/newElement");

        try {
          var oObjective = oViewModel.getProperty(
            oEvent.getSource().getParent().getBindingContextPath()
          );

          var oObjTeam = _.find(oViewData.formData["BodyCells"], {
            ColumnIid: this._sObjTeamColumn,
            NoteString: oObjective.Objid,
          });
          if (!_.isEmpty(oObjTeam)) {
            MessageToast.show(this.getText("teamObjectiveExist"));
          }
          if (typeof this._addElementCallBack === "function") {
            this._addElementCallBack.call();
          }

          //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
          oViewModel.setProperty(
            "/bodyCells/" +
              oNewElement.RowIid +
              "/" +
              this._sObjTeamColumn +
              "/NoteString",
            oObjective.Objid
          );

          if (!oViewData.formParameters["OBJECTIVE_DONOT_INHERITE"]) {
            oViewModel.setProperty(
              "/bodyElements/" + oNewElement.RowIid + "/Name",
              oObjective.Stext
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjColumn +
                "/NoteString",
              oObjective.Description
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjMeaColumn +
                "/ValueString",
              oObjective.Zzmeaning
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjUniColumn +
                "/ValueString",
              oObjective.Zzunit
            );
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sExpValColumn +
                "/ValueString",
              oObjective.ZzexpResult.replace(".", ",")
            );
          }
        } catch (oEx) {}

        this._oAddNewElementObjectiveDialog
          .getAggregation("content")[0]
          .getBinding("items")
          .filter([]);
        this._oAddNewElementObjectiveDialog.close();
      },
      onApplyAddElementObjective: function (oEvent) {
        var oViewModel = this.getModel("formDetailsModel");
        var oViewData = oViewModel.getData();
        var oNewElement = oViewModel.getProperty("/newElement");
        var aContexts = oEvent.getParameter("selectedContexts");

        if (aContexts) {
          if (aContexts.length > 1) {
            MessageBox.error(this.getText("maxObjectiveSelection"));
          } else {
            var oObjective = aContexts[0].getObject();

            if (typeof this._addElementCallBack === "function") {
              this._addElementCallBack.call();
            }

            //team goal is set with OBJID that will be displayed as STEXT with the help of formatter
            oViewModel.setProperty(
              "/bodyCells/" +
                oNewElement.RowIid +
                "/" +
                this._sObjTeamColumn +
                "/NoteString",
              oObjective.Objid
            );

            if (!oViewData.formParameters["OBJECTIVE_DONOT_INHERITE"]) {
              oViewModel.setProperty(
                "/bodyElements/" + oNewElement.RowIid + "/Name",
                oObjective.Stext
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjColumn +
                  "/NoteString",
                oObjective.Description
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjMeaColumn +
                  "/ValueString",
                oObjective.Zzmeaning
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sObjUniColumn +
                  "/ValueString",
                oObjective.Zzunit
              );
              oViewModel.setProperty(
                "/bodyCells/" +
                  oNewElement.RowIid +
                  "/" +
                  this._sExpValColumn +
                  "/ValueNum",
                oObjective.ZzexpResult
              );
            }
          }
        }

        oEvent.getSource().getBinding("items").filter([]);
      },
      onSearchAddElementObjective: function (oEvent) {
        var sValue = oEvent.getParameter("query");
        var oFilter = new Filter(
          "Description",
          sap.ui.model.FilterOperator.Contains,
          sValue
        );
        var oBinding = oEvent
          .getSource()
          .getParent()
          .getParent()
          .getBinding("items");
        if (sValue !== null && sValue !== null && sValue !== undefined) {
          oBinding.filter([oFilter]);
        } else {
          oBinding.filter([]);
        }
      },
      _openUploadAttachmentDialog: function () {
        // create dialog lazily
        if (!this._oUploadAttachmentDialog) {
          // create dialog via fragment factory
          this._oUploadAttachmentDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.UploadAttachments",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oUploadAttachmentDialog);
        }

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        try {
          if (oFileUploader) {
            oFileUploader.clear();
          }
        } catch (oErr) {
          jQuery.sap.log.error("File uploader not loaded yet...");
        }

        this._oUploadAttachmentDialog.open();
      },

      onFileTypeMissmatch: function (oEvent) {
        var aFileTypes = oEvent.getSource().getFileType();
        jQuery.each(aFileTypes, function (key, value) {
          aFileTypes[key] = "*." + value;
        });
        var sSupportedFileTypes = aFileTypes.join(", ");
        MessageBox.warning(
          this.getText("fileTypeMismatch", [
            oEvent.getParameter("fileType"),
            sSupportedFileTypes,
          ])
        );
      },
      onAttachmentUploadPress: function (oEvent) {
        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");

        if (!oFileUploader.getValue()) {
          MessageToast.show(this.getText("fileSelectionRequired"));
          return;
        }

        var oModel = this.getModel();
        var oViewModel = this.getModel("formDetailsModel");

        /*Destroy header parameters*/
        oFileUploader.destroyHeaderParameters();

        /*Set security token*/
        oModel.refreshSecurityToken();
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "x-csrf-token",
            value: oModel.getSecurityToken(),
          })
        );

        /*Set filename*/
        var sFileName = oFileUploader.getValue();
        sFileName = encodeURIComponent(sFileName);
        oFileUploader.addHeaderParameter(
          new sap.ui.unified.FileUploaderParameter({
            name: "content-disposition",
            value: "inline; filename='" + sFileName + "'",
          })
        );

        /*Set upload path*/
        var sPath =
          oModel.sServiceUrl +
          "/AttachOperationsSet(" +
          "AppraisalId=guid'" +
          oViewModel.getProperty("/appraisalId") +
          "'," +
          "RowIid='" +
          oViewModel.getProperty("/currentRowIid") +
          "')/Attachment";

        oFileUploader.setUploadUrl(sPath);

        this._openBusyFragment("fileBeingUploaded");

        /*Upload file*/
        oFileUploader.upload();
      },

      onAttachmentUploadComplete: function (oEvent) {
        this._closeBusyFragment();

        var oFileUploader = sap.ui.getCore().byId("idAttachmentFileUploader");
        oFileUploader.destroyHeaderParameters();
        oFileUploader.clear();

        var sStatus = oEvent.getParameter("status");
        var sResponse = oEvent.getParameter("response");

        if (sStatus == "201" || sStatus == "200") {
          MessageBox.success(this.getText("fileUploadSuccess"));
          this._oUploadAttachmentDialog.close();
        } else {
          MessageBox.error(this.getText("fileUploadError", [sResponse]));
        }

        this._refreshAttachmentList();
      },

      onAttachmentFileChange: function (oEvent) {
        MessageToast.show(
          this.getText("fileUploadWarning", [oEvent.getParameter("newValue")])
        );
      },

      onFileSizeExceed: function (oEvent) {
        MessageBox.error(
          this.getText("fileSizeExceeded", [
            oEvent.getSource().getMaximumFileSize(),
          ])
        );
      },

      onCloseUploadFormDialog: function () {
        MessageToast.show(this.getText("fileUploadCancelled"));
        this._oUploadAttachmentDialog.close();
      },

      onGetTrainingGroupHeader: function (oGroup) {
        return new sap.m.GroupHeaderListItem({
          title: oGroup.key,
          upperCase: false,
        });
      },

      _showDevTrainings: function (oEvent) {
        if (!this._oDevTrainingsDialog) {
          // create dialog via fragment factory
          this._oDevTrainingsDialog = sap.ui.xmlfragment(
            "hcm.ux.hapv2_1.fragment.DevelopmentTrainings",
            this
          );
          // connect dialog to view (models, lifecycle)
          this.getView().addDependent(this._oDevTrainingsDialog);
        }

        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oViewModel = this.getModel("formDetailsModel");
        var aFilter = [];

        aFilter.push(
          new Filter(
            "Pernr",
            FilterOperator.EQ,
            oViewModel.getProperty("/formData/HeaderAppraisee/0/Id")
          )
        );

        // filter binding
        var oBinding = oList.getBinding("items");
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.open();
      },

      onTrainingDialogClose: function () {
        var oList = sap.ui.getCore().byId("idDevTrainingsList");
        var oBinding = oList.getBinding("items");
        var aFilter = [];
        oBinding.filter(aFilter);

        this._oDevTrainingsDialog.close();
      },

      _openTrainingCatalogLink: function () {
        window.open(
          "https://webapps01.thy.com/intranets/kurumsal-operasyonel-cozumler/web10/TTASDocuments/Egitim_Katalogu.pdf",
          "_blank"
        );
      },
    });
  }
);
