sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv3.control.TriggerEvent", {
    metadata: {
      properties: {
        duration: { type: "int", bindable: true },
        timeLeft: { type: "int", bindable: true },
      },
      events: {
        trigger: {},
      },
    },
    init: function () {
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv3"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/control/TriggerEvent.css");
      this.clearInterval();
    },
    onDestroy: function () {
      this.clearInterval();
    },
    onExit: function () {
      this.clearInterval();
    },
    setInterval: function () {
      var that = this;
      this.clearInterval();
      this._interval = setInterval(
        this.triggerFunction.bind(this),
        this.getProperty("duration")
      );

      this.setProperty("timeLeft", this.getProperty("duration"), true);
      this._counterInterval = setInterval(function () {
        that.setProperty("timeLeft", that.getProperty("timeLeft") - 1000);
      }, 1000);
      // console.log("Reset");
    },
    clearInterval: function () {
      if (this._interval) {
        clearInterval(this._interval);
      }
      if (this._counterInterval) {
        clearInterval(this._counterInterval);
      }
    },
    triggerFunction() {
      this.setProperty("timeLeft", 0);
      this.clearInterval();
      this.fireTrigger();
    },
    renderer: function (oRM, oControl) {
      oRM.openStart("div");
      oRM.writeControlData(oControl);
      oRM.class("smod-trigger-event-container");
      oRM.openEnd();
      oRM.openStart("div");
      oRM.class("smod-trigger-event");
      oRM.openEnd();
      oRM.text(oControl.convertMsToTime(oControl.getProperty("timeLeft")));
      oRM.close("div");
      oRM.close("div");
    },
    padTo2Digits: function (num) {
      return num.toString().padStart(2, "0");
    },

    convertMsToTime: function (milliseconds) {
      let seconds = Math.floor(milliseconds / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);

      seconds = seconds % 60;
      minutes = minutes % 60;

      // 👇️ If you don't want to roll hours over, e.g. 24 to 00
      // 👇️ comment (or remove) the line below
      // commenting next line gets you `24:00:00` instead of `00:00:00`
      // or `36:15:31` instead of `12:15:31`, etc.
      hours = hours % 24;

      return `${this.padTo2Digits(hours)}:${this.padTo2Digits(
        minutes
      )}:${this.padTo2Digits(seconds)}`;
    },
  });
});
