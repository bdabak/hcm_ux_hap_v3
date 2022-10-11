jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require(
  [
    "sap/ui/test/Opa5",
    "hcm/ux/hapv2.1/test/integration/pages/Common",
    "sap/ui/test/opaQunit",
    "hcm/ux/hapv2.1/test/integration/pages/Worklist",
    "hcm/ux/hapv2.1/test/integration/pages/Object",
    "hcm/ux/hapv2.1/test/integration/pages/NotFound",
    "hcm/ux/hapv2.1/test/integration/pages/Browser",
    "hcm/ux/hapv2.1/test/integration/pages/App",
  ],
  function (Opa5, Common) {
    "use strict";
    Opa5.extendConfig({
      arrangements: new Common(),
      viewNamespace: "hcm.ux.hapv2.1.view.",
    });

    sap.ui.require(
      [
        "hcm/ux/hapv2.1/test/integration/WorklistJourney",
        "hcm/ux/hapv2.1/test/integration/ObjectJourney",
        "hcm/ux/hapv2.1/test/integration/NavigationJourney",
        "hcm/ux/hapv2.1/test/integration/NotFoundJourney",
        "hcm/ux/hapv2.1/test/integration/FLPIntegrationJourney",
      ],
      function () {
        QUnit.start();
      }
    );
  }
);
