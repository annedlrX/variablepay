//@ui5-bundle nga/xtendhr/it1415/Component-preload.js
sap.ui.require.preload({
	"nga/xtendhr/it1415/Component.js":function(){
sap.ui.define(["sap/ui/core/UIComponent","nga/xtendhr/it1415/model/models"],(e,t)=>{"use strict";return e.extend("nga.xtendhr.it1415.Component",{metadata:{manifest:"json",interfaces:["sap.ui.core.IAsyncContentCreation"]},init(){e.prototype.init.apply(this,arguments);this.setModel(t.createDeviceModel(),"device");this.getRouter().initialize()}})});
},
	"nga/xtendhr/it1415/controller/App.controller.js":function(){
sap.ui.define(["sap/ui/core/mvc/Controller"],e=>{"use strict";return e.extend("nga.xtendhr.it1415.controller.App",{onInit(){}})});
},
	"nga/xtendhr/it1415/controller/Main.controller.js":function(){
sap.ui.define(["sap/ui/core/mvc/Controller"],e=>{"use strict";return e.extend("nga.xtendhr.it1415.controller.Main",{onInit(){}})});
},
	"nga/xtendhr/it1415/i18n/i18n.properties":'# This is the resource bundle for nga.xtendhr.it1415\n\n#Texts for manifest.json\n\n#XTIT: Application name\nappTitle=Variable Pay\n\n#YDES: Application description\nappDescription=An SAP Fiori application.\n#XTIT: Main view title\ntitle=Variable Pay',
	"nga/xtendhr/it1415/manifest.json":'{"_version":"1.65.0","sap.app":{"id":"nga.xtendhr.it1415","type":"application","i18n":"i18n/i18n.properties","applicationVersion":{"version":"0.0.1"},"title":"{{appTitle}}","description":"{{appDescription}}","resources":"resources.json","sourceTemplate":{"id":"@sap/generator-fiori:basic","version":"1.16.0","toolsId":"8995bceb-4354-4d61-88d6-6be57aea7c19"},"dataSources":{"mainService":{"uri":"srv/odata/v4/catalog","type":"OData","settings":{"annotations":[],"odataVersion":"4.0"}}}},"sap.ui":{"technology":"UI5","icons":{"icon":"","favIcon":"","phone":"","phone@2":"","tablet":"","tablet@2":""},"deviceTypes":{"desktop":true,"tablet":true,"phone":true}},"sap.ui5":{"flexEnabled":true,"dependencies":{"minUI5Version":"1.131.1","libs":{"sap.m":{},"sap.ui.core":{}}},"contentDensities":{"compact":true,"cozy":true},"models":{"i18n":{"type":"sap.ui.model.resource.ResourceModel","settings":{"bundleName":"nga.xtendhr.it1415.i18n.i18n"}},"":{"dataSource":"mainService","preload":true,"settings":{"operationMode":"Server","autoExpandSelect":true,"earlyRequests":true}}},"resources":{"css":[{"uri":"css/style.css"}]},"routing":{"config":{"routerClass":"sap.m.routing.Router","controlAggregation":"pages","controlId":"app","transition":"slide","type":"View","viewType":"XML","path":"nga.xtendhr.it1415.view"},"routes":[{"name":"RouteMain","pattern":":?query:","target":["TargetMain"]}],"targets":{"TargetMain":{"id":"Main","name":"Main"}}},"rootView":{"viewName":"nga.xtendhr.it1415.view.App","type":"XML","id":"App"}}}',
	"nga/xtendhr/it1415/model/models.js":function(){
sap.ui.define(["sap/ui/model/json/JSONModel","sap/ui/Device"],function(e,n){"use strict";return{createDeviceModel:function(){var i=new e(n);i.setDefaultBindingMode("OneWay");return i}}});
},
	"nga/xtendhr/it1415/view/App.view.xml":'<mvc:View controllerName="nga.xtendhr.it1415.controller.App"\n    displayBlock="true"\n    xmlns:mvc="sap.ui.core.mvc"\n    xmlns="sap.m"><App id="app"></App></mvc:View>',
	"nga/xtendhr/it1415/view/Main.view.xml":'<mvc:View controllerName="nga.xtendhr.it1415.controller.Main"\n    xmlns:mvc="sap.ui.core.mvc"\n    xmlns="sap.m"><Page id="page" title="{i18n>title}"></Page></mvc:View>'
});
//# sourceMappingURL=Component-preload.js.map
