/*global _*/
sap.ui.define(["sap/ui/core/Control"], function (Control) {
  "use strict";

  return Control.extend("hcm.ux.hapv3.control.HierarchyView", {
    metadata: {
      properties: {
        hierarchy: { type: "object", bindable: true },
        title: { type: "string", bindable: true },
      },
      aggregations: {},
      events: {
        pressed: {},
      },
    },
    init: function () {
      //initialisation code, in this case, ensure css is imported
      var sLibraryPath = jQuery.sap.getModulePath("hcm.ux.hapv3"); //get the server location of the ui library
      jQuery.sap.includeStyleSheet(sLibraryPath + "/control/HierarchyView.css");
    },
    renderer: function (oRM, oControl) {
      var h = oControl.getHierarchy();

      var renderNode = function (n) {
        oRM.openStart("p");
        oRM.class("smod-hierarchy-view-card");
        if (n.isCurrent) {
          oRM.class("smod-hierarchy-view-card-current");
        }
        oRM.openEnd();
        oRM.text(n.name);
        oRM.close("p");
      };

      var buildHierarchy = function (o) {
        if (o.hasOwnProperty("children") && o.children.length > 0) {
          oRM.openStart("div"); //Item
          oRM.class("smod-hierarchy-view-item");
          oRM.openEnd();
          oRM.openStart("div"); //Item Parent
          oRM.class("smod-hierarchy-view-item-parent");
          oRM.openEnd();

          renderNode(o);

          oRM.close("div"); //Item Parent

          oRM.openStart("div"); //Item Children
          oRM.class("smod-hierarchy-view-item-children");
          oRM.openEnd();
          $.each(o.children, function (i, c) {
            oRM.openStart("div"); //Item Child
            oRM.class("smod-hierarchy-view-item-child");
            oRM.openEnd();
            buildHierarchy(c);
            oRM.close("div"); //Item Children
          });
          oRM.close("div"); //Item Children
          oRM.close("div"); //Item
        } else {
          renderNode(o);
        }
      };

      oRM.openStart("section");
      oRM.writeControlData(oControl);
      oRM.class("smod-hierarchy-view-section");
      oRM.class("smod-hierarchy-view-basic");
      oRM.openEnd();

      oRM.openStart("h3");
      oRM.openEnd();
      oRM.text(oControl.getTitle());
      oRM.close("h3");

      oRM.openStart("div"); //Container
      oRM.class("smod-hierarchy-view-container");
      oRM.openEnd();

      oRM.openStart("div"); //Wrapper
      oRM.class("smod-hierarchy-view-wrapper");
      oRM.openEnd();
      buildHierarchy(h);
      oRM.close("div"); //Wrapper
      oRM.close("div"); //Container

      oRM.close("section");
    },
  });
});
