sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Rounds the number unit value to 2 digits
     * @public
     * @param {string} sValue the number string to be rounded
     * @returns {string} sValue with 2 digits rounded
     */
    numberUnit: function (sValue) {
      if (!sValue) {
        return "";
      }
      return parseFloat(sValue).toFixed(2);
    },
    getImagePath: function (sPath) {
      var sImagePath = jQuery.sap.getModulePath(
        "hcm.ux.hapv3",
        "/images/barchart_loading.gif"
      );

      return sImagePath;
    },
    convertToStartCase: function (sSentence) {
      var aWords = sSentence.split(" ");
      var sConverted = "";

      $.each(aWords, function (sIndex, sWord) {
        var sNewWord =
          sWord.substr(0, 1).toUpperCase() + sWord.substr(1).toLowerCase();
        if (sConverted === "") {
          sConverted = sNewWord;
        } else {
          sConverted = sConverted + " " + sNewWord;
        }
      });
      return sConverted;
    },
    convertToIntegerDecimal: function (sValue) {
      try {
        if (sValue % 1 == 0) {
          return parseInt(sValue);
        } else {
          return parseFloat(sValue).toFixed(2);
        }
      } catch (oErr) {
        return sValue;
      }
    },
    convertFloatToString: function (fVal) {
      return fVal.toLocaleString().replaceAll(",", "").replaceAll(".", ",");
    },
  };
});
