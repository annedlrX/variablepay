sap.ui.define(["sap/ui/core/UIComponent","nga/xtendhr/it1415/model/models"],(e,t)=>{"use strict";return e.extend("nga.xtendhr.it1415.Component",{metadata:{manifest:"json",interfaces:["sap.ui.core.IAsyncContentCreation"]},init(){e.prototype.init.apply(this,arguments);this.setModel(t.createDeviceModel(),"device");this.getRouter().initialize()}})});
//# sourceMappingURL=Component.js.map