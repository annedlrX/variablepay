module.exports = {
    // General application constants
    basePackage: "com.nga.xtendhr",
    genAPI: "/api",
    genError: "/error",
    paramLog: "Params : ",
    urlLog: "URL : ",
    resultLog: "Resp Body : ",
    employeeList: "/EmployeeList",
    empPayCompRecurring: "/EmpPayCompRecurring",
    empCompensation: "/EmpCompensation",
    empPayRecognition: "/EmpPayRecognition",
    empPayCompNonRecurring: "/EmpPayCompNonRecurring",
    empPayQuotaCompensation: "/EmpPayQuotaCompensation",
    empPayRenumeration: "/EmpPayRenumeration",
    empAvailability: "/EmpPayAvailability",
    nullString: null,
    lineSeparator: require('os').EOL,  // Use Node's `os` module for line separator

    // Excel specific constants
    genExcel: "/genExcel",
    genDetail: "/genDetail",

    // EC Roles
    ecSiteHire: "/SiteHRRole",
    ecHRAdmin: "/HRAdminRole",
    ecSiteDeputy: "/SiteDeputyRole",
    ecSiteGBU: "/SiteGBURole",

    // EC Employee Selection
    ecUserInfo: "/UserInfo",
    ecSiteHireEES: "/SiteHRRoleEE",
    ecSiteDeputyEES: "/SiteDeputyEE",
    ecSiteGBUEES: "/SiteGBUEE",
    ecHRAdminEES: "/HRAdminEE",

    ecRBProle: "/ECRBPRole",
    ecRoleCheck: "/ECRoleCheck",

    // EC Picklist
    ecCurrency: "/Currency",
    ecPicklistV2: "/Picklist",
    ecCostCenter: "/AltCostCenter",
    ecPayGroup: "/PayGroup",

    // RBP 
    RBPGroup: "/RBPGroup",
    RBPEmployee: "/RBPEmployee",
    eeSelection: "/GetEmployees",
    empSelection: "/EmpSelection",
    empSelection2004: "/EmpSelection2004",

    // Regex Expressions
    siteDeputyPattern: ".*HR.*.*Site_D.*.*Granted.*",
    siteGBUPattern: ".*HR.*.*GBU/F_D.*.*Granted.*",
    hrAdminPattern: ".*HR.*.*Payroll.*.*Granted.*",

    // Roles
    SiteDeputy: "HRSITEDEPUTY",
    SiteGBU: "HRGBUDEPUTY",
    HRAdmin: "HRADMIN",
    HRSite: "HRSITE",
    HRGBU: "HRGBU",
    MGR: "MANAGER",
    EMP: "EMPLOYEE",
    TIMKP: "TIMKP",

    // Request Types
    IT15: "IT15",
    IT14: "IT14",
    IT2004: "2004",

    // Workflow Template
    WF1: "WF1",
    WF2: "WF2",
    WF3: "WF3",
    WF4: "WF4",
    WFAUTO: "WF_AUTO",
    WFFW1: "WF_FORWARD_1",
    WFFW2: "WF_FORWARD_2",
    WF5: "WF5",
    WF6: "WF6",
    WF7: "WF7",

    // Approval
    approved: "APPROVED",
    rejected: "REJECTED",
    autoApproved: "1",
    notAutoApproved: "0",

    // Hana DB Status
    statForApproval: "1",
    statError: "2",
    statForPosting: "3",
    statCompleted: "4",
    statRejected: "5",

    // EC Event Reason
    ecEventReason: "SOL_VarPay",

    // EC Frequency
    ecFrequency: "ANN",

    // SCP filter
    empSel: "Employee Selection",
    empSelf: "self",

    // Email Template
    emailPending: "E1",
    emailApproved: "E2",
    emailCompleted: "E3",
    emailRejected: "E4",
    emailNotify: "E2",
    email2004Approval: "E5",
    email2004Approved: "E6",
    email2004NotifyEE: "E7",
    email2004NotifyMGR: "E8",
    email2004Rejected: "E9",

    // Email Key
    emailFieldName: "email"
};