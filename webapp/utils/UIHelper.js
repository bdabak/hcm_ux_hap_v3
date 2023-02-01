sap.ui.define([], function () {
  var oCurrentForm = null;
  var oActiveBusyDialog = null;
  var oListViewModel = null;
  var sFormListUpdated = false;
  var sShowHint = true;
  var sMode = "";
  return {
    setCurrentForm: function (a) {
      oCurrentForm = a;
    },
    getCurrentForm: function () {
      return oCurrentForm;
    },
    setActiveBusyDialog: function (d) {
      oActiveBusyDialog = d;
    },
    getActiveBusyDialog: function () {
      return oActiveBusyDialog;
    },
    setListViewModel: function (m) {
      oListViewModel = m;
    },
    getListViewModel: function () {
      return oListViewModel;
    },
    setListViewBusy: function (sVal) {
      try {
        oListViewModel.setProperty("/viewBusy", sVal);
      } catch (e) {}
    },
    setFormListUpdated: function (sUpdated) {
      sFormListUpdated = sUpdated;
    },
    getFormListUpdated: function () {
      return sFormListUpdated;
    },
    setShowHint: function (sShow) {
      sShowHint = sShow;
    },
    getShowHint: function () {
      return sShowHint;
    },
    setMode: function (mode) {
      sMode = mode;
    },
    getMode: function (mode) {
      return sMode;
    },
  };
});
