//namespace com.strada;
using {
  managed,
  cuid,
  sap.common.CodeList
} from '@sap/cds/common';

context com.strada {
  entity Books {
    key ID    : Integer;
        title : String;
        stock : Integer;
  }

  entity VP_WAGETYPE {
    key id                        : String(255);
        is_Active                 : hana.TINYINT;
        startDate                 : Date;
        endDate                   : Date;
        is_AmountType             : String(5);
        uom                       : String(5);
        is_SpecialRecognitionType : hana.TINYINT;
        wagetype                  : String(255);
        isIndEval                 : hana.TINYINT;
        currency                  : String(16);
        is_QuotaCompensation      : hana.TINYINT;
        SUB_INFOTYPE              : String(10) default '';
  }


  entity VP_WAGETYPE_TEXT {
    key payComponent : Association[1] to VP_WAGETYPE {
                         id
                       };
    key language     : String(5);
        description  : String(255);
  };

  entity VP_COUNTRIES {
    key id   : String(3);
        name : String(64);
  };

  entity VP_WORKFLOW {
    key id          : String(16);
        description : String(64);
  };

  entity VP_WAGETYPE_MAPPING {
    infoType           : String(5) not null;
    country            : Association[1] to VP_COUNTRIES {
                           id
                         } not null;
    payComponent       : Association[1] to VP_WAGETYPE {
                           id
                         };
    initiatorRole      : String(32);
    workflow           : Association[1] to VP_WORKFLOW {
                           id
                         };
    companyCode        : String(16);
    operator           : String(3);
    delimitIndicator   : hana.TINYINT;
    cust_frequency     : String(255);
    cust_frequency_txt : String(64);

  };

  entity VP_CURRENCY {
    key id              : String(4);
        description     : String(64);
        defaultDecimals : Integer;
        symbol          : String(16);
        is_Active       : Integer;
  };

  entity VP_MAP_CURRENCY_COUNTRY {
    key country  : Association[1] to VP_COUNTRIES {
                     id
                   };
    key currency : Association[1] to VP_CURRENCY {
                     id
                   };
  };

  entity VP_UOM {
    key uom_EC    : String(10);
        uom_HRX   : String(32);
        uom_EH    : String(10);
        is_Active : hana.TINYINT;
        
  };

  entity VP_UOM_TEXT {
    key uom_EC  : String(10);
    key locale  : String(5);
        uom_HRX : String(32);
        uom_EH  : String(10);
        
  };

  entity VP_AVAILABILITY : cuid, managed {
    key cust_externalCode         : String(100);
        cust_userId               : String(128) not null;
        cust_payComponent         : Association[1] to VP_WAGETYPE {
                                      id
                                    } not null;
        effectiveStartDate        : Date not null;
        cust_startTime            : Time;
        cust_endDate              : Date;
        cust_endTime              : Time;
        cust_customString         : String(255);
        cust_notes                : String(255);
        cust_existingCode         : String(255);
        status                    : Integer;
        autoApproved              : hana.TINYINT;
        createdByUser             : String(128);
        country                   : Association[1] to VP_COUNTRIES {
                                      id
                                    };
        initiatorLanguage         : String(5);
        cust_payComponent_txt     : String(128);
        delimitIndicator          : hana.TINYINT;
        cust_dailyWorkSchedule    : String(255);
        cust_dailyWorkScheduleTxt : String(255);
        cust_dwsGrouping          : String(255);
        cust_dwsGroupingTxt       : String(255);
        cust_wsVariant            : String(255);
        cust_wsVariantTxt         : String(255);
        cust_customVar1           : String(255);
        cust_customVar2           : String(255);
        cust_customVar3           : String(255);
        cust_customVar4           : String(255);
        cust_customVar5           : String(255);
        cust_customVar6           : String(255);

  };


  entity VP_ONETIME_PAY : cuid, managed {
    key cust_externalCode              : String(100);
    key cust_userId                    : String(128) not null;
        cust_payComponent              : Association[1] to VP_WAGETYPE {
                                           id
                                         } not null;
        effectiveStartDate             : Date not null;
        cust_paycompvalue              : DecimalFloat;
        cust_currencyCode              : String(64) not null;
        cust_customString              : String(255);
        cust_sequenceNumber            : Integer;
        cust_number                    : DecimalFloat;
        cust_unit                      : String(255);
        cust_notes                     : String(255);
        cust_existingCode              : String(255);
        cust_alternativeCostCenter     : String(255);
        status                         : Integer;
        autoApproved                   : hana.TINYINT;
        cust_calculatedAmount          : DecimalFloat;
        createdByUser                  : String(128);
        cust_user                      : String(128);
        country                        : Association[1] to VP_COUNTRIES {
                                           id
                                         };
        initiatorLanguage              : String(5);
        cust_alternativeCostCenter_txt : String(64);
        cust_unit_txt                  : String(32);
        cust_payComponent_txt          : String(128);
        specialRecognition             : hana.TINYINT;
        delimitIndicator               : hana.TINYINT;
        displayAmount                  : String(20);
  };

  entity VP_EMAIL_TEMPLATES_CONFIG {
    key id          : String(10);
        description : String(64);
  };

  entity VP_EMAIL_PARAMETERS_CONFIG {
    key id          : String(16);
        description : String(64);
  };

  entity VP_MAP_EMAIL_PARAMETERS {
    key id          : String(16);
    key parameterID : String(5);
        fieldName   : String(64) not null;     
  };

  entity VP_LOG_ACTION {
    key id          : Integer;
        description : String(128);
  };

  entity VP_LOG_ACTION_TEXT {
    key id          : Integer;
    key language    : String(5);
        description : String(128);
  };

  entity VP_AUDIT_LOG : cuid, managed {
    key externalCode   : String(100) not null;
        action         : Association[1] to VP_LOG_ACTION {
                           id
                         } not null;
        requestType    : String(5);
        additionalInfo : String(5000);
        createdByUser  : String(128);
  };

  entity VP_REQUEST_FLOW : cuid, managed {

    key externalCode      : String(100) not null;
        requestType       : String(5) not null;
        workflow          : Association[1] to VP_WORKFLOW {
                              id
                            };
        workflowSequence  : Integer;
        forwardSequence   : Integer;
        status            : Association[1] to VP_REQUEST_STATUS {
                              id
                            };
        agent             : String(500);
        nextAgent         : String(500);
        notificationAgent : String(64);
        createdByUser     : String(128);
  };

  entity VP_REQUEST_STATUS {
    key id          : Integer;
        description : String(64);
  };

  entity VP_REQUEST_STATUS_TEXT {
    key id          : Integer;
    key language    : String(5);
        description : String(64);
  };

  /* add */
  entity VP_WORKFLOW_CONFIG {
    key id                       : String(16);
        triggerWorkflow          : hana.TINYINT;
    key sequence                 : Integer;
        agentRole                : String(64);
        maxForwards              : Integer;
        triggerEmailNotification : hana.TINYINT;
        notificationAgent_Role   : String(64);
        emailTemplate            : Association[1] to VP_EMAIL_TEMPLATES_CONFIG {
                                     id
                                   };
  };

  entity VP_EMAIL_TEMPLATES {
    key id        : String(10);
    key language  : String(5);
    key infoType  : String(5);
        title     : String(128);
        body      : String(1024);
        mappingID : Association[1] to VP_EMAIL_PARAMETERS_CONFIG {
                      id
                    };
  };

  entity VP_RBP_GROUPS {
    key groupID   : String(32);
        groupName : String(64);
    key userID    : String(128);
        today     : Integer;
        next      : Integer;
        role      : String(32);
  };

  entity VP_RBP_EMPLOYEES {
    key id     : Association[1] to VP_RBP_GROUPS {
                   groupID
                 };
    key userID : String(128);
  };

  entity VP_EMPJOB : managed {
    key userID           : String(128);
        countryOfCompany : String(3);
        company          : String(5);

  };

  entity VP_RECURRING_PAY : managed {
    key cust_externalCode     : String(100);
        cust_userId           : String(128) not null;
        cust_payComponent     : Association[1] to VP_WAGETYPE {
                                  id
                                } not null;
        cust_eventReason      : String(255) not null;
        effectiveStartDate    : Date not null;
        cust_endDate          : Date;
        cust_paycompvalue     : DecimalFloat;
        cust_currencyCode     : String(64) not null;
        cust_frequency        : String(255) not null;
        cust_calculatedAmount : DecimalFloat;
        cust_customString     : String(255);
        cust_number           : DecimalFloat;
        cust_unit             : String(255);
        cust_notes            : String(255);
        cust_existingCode     : String(255);
        cust_payGroup         : String(255) not null;
        status                : Integer;
        // lastModified :	UTCTimestamp;
        createdBy             : String(128);
        //createdOn :	UTCTimestamp;
        autoApproved          : hana.TINYINT;
        createdByUser         : String(128);
        cust_user             : String(128);
        country               : Association[1] to VP_COUNTRIES {
                                  id
                                };
        initiatorLanguage     : String(5);
        cust_payGroup_txt     : String(64);
        cust_frequency_txt    : String(64);
        cust_unit_txt         : String(32);
        cust_payComponent_txt : String(128);
        delimitIndicator      : hana.TINYINT;
        displayAmount         : String(20);
  };

  entity VP_USER : managed {
    key userID        : String(128);
        userName      : String(128) not null;
        employeeID    : String(128);
        firstName     : String(128);
        lastName      : String(128);
        middleName    : String(128);
        email         : String(100);
        custom15      : String(100);
        defaultLocale : String(5);
        status        : String(1);
        customManager : String(128);
        hr            : String(128);
        manager       : String(128);
        //  lastModified: UTCTimestamp;
        timeKeeper    : String(128);
  };

  entity VP_TIMEKEEPER {
    key id         : Association[1] to VP_USER {
                       userID
                     };
    key timeKeeper : String(128);
  };


}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_WAGETYPES {
  key DESCRIPTION  : String(255) @title: 'DESCRIPTION: DESCRIPTION';
      PAYCOMPONENT : String(255) @title: 'PAYCOMPONENT: PAYCOMPONENT_ID';
      INFOTYPE     : String(5)   @title: 'INFOTYPE: INFOTYPE';
      WORKFLOW_ID  : String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PENDPOSTING_ONETIME_PAY {
  key ID                         : String(36)  @title: 'ID: ID';
  key CUST_USERID                : String(128) @title: 'CUST_USERID: CUST_USERID';
  key CUST_PAYCOMPONENT_ID       : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
  key EFFECTIVESTARTDATE         : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE          : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE          : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING          : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER        : Integer     @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT                  : String(255) @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_NOTES                 : String(255) @title: 'CUST_NOTES: CUST_NOTES';
  key CUST_EXISTINGCODE          : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
  key CUST_ALTERNATIVECOSTCENTER : String(255) @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      CUST_CALCULATEDAMOUNT      : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      SPECIALRECOGNITION         : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR           : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      CREATEDAT                  : Timestamp   @title: 'CREATEDAT: CREATEDAT';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PENDPOSTING_AVAILABILITY_PAY {
  key AUTOAPPROVED              : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      CREATEDBY                 : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDAT                 : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      CUST_CUSTOMSTRING         : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255) @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255) @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255) @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255) @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255) @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255) @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255) @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255) @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255) @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255) @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time        @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time        @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255) @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255) @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)   @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      MODIFIEDAT                : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
      STATUS                    : Integer     @title: 'STATUS: STATUS';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_HCI_ONETIME_PAY(IP_STATUS : Integer) {
  key ID                         : String(36)  @title: 'ID: ID';
      CUST_USERID                : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID       : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      EFFECTIVESTARTDATE         : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE          : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE          : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING          : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER        : Integer     @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT                  : String(255) @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES                 : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE          : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_ALTERNATIVECOSTCENTER : String(255) @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      CUST_CALCULATEDAMOUNT      : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      SPECIALRECOGNITION         : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR           : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_HCI_AVAILABILITY(IP_STATUS : Integer) {
  key AUTOAPPROVED              : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      CREATEDBY                 : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDAT                 : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      CUST_CUSTOMSTRING         : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255) @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255) @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255) @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255) @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255) @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255) @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255) @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255) @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255) @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255) @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time        @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time        @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255) @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255) @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)   @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp   @title: 'LASTMODIFIED: MODIFIEDAT';
      STATUS                    : Integer     @title: 'STATUS: STATUS';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_WF_CONFIG {
  key WOKFLOW_ID               : String(16) @title: 'WOKFLOW_ID: WOKFLOW_ID';
      TRIGGERWORKFLOW          : UInt8      @title: 'TRIGGERWORKFLOW: TRIGGERWORKFLOW';
      SEQUENCE                 : Integer    @title: 'SEQUENCE: SEQUENCE';
      AGENTROLE                : String(64) @title: 'AGENTROLE: AGENTROLE';
      MAXFORWARDS              : Integer    @title: 'MAXFORWARDS: MAXFORWARDS';
      TRIGGEREMAILNOTIFICATION : UInt8      @title: 'TRIGGEREMAILNOTIFICATION: TRIGGEREMAILNOTIFICATION';
      NOTIFICATIONAGENT_ROLE   : String(64) @title: 'NOTIFICATIONAGENT_ROLE: NOTIFICATIONAGENT_ROLE';
      EMAILTEMPLATE_ID         : String(10) @title: 'EMAILTEMPLATE_ID: EMAILTEMPLATE_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ONETIME_PAY(IP_USER : String(128), IP_LANGUAGE : String(5)) {
  key ID                             : String(36)  @title: 'ID: ID';
      CUST_USERID                    : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID           : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      EFFECTIVESTARTDATE             : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE              : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE              : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING              : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER            : Integer     @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                    : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT                      : String(255) @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES                     : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE              : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_ALTERNATIVECOSTCENTER     : String(255) @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      STATUS                         : Integer     @title: 'STATUS: STATUS';
      MODIFIEDAT                     : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
      CREATEDBY                      : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT                      : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      AUTOAPPROVED                   : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_ALTERNATIVECOSTCENTER_TXT : String(64)  @title: 'CUST_ALTERNATIVECOSTCENTER_TXT: CUST_ALTERNATIVECOSTCENTER_TXT';
      CUST_UNIT_TXT                  : String(32)  @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT          : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_CALCULATEDAMOUNT          : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CUST_USER                      : String(128) @title: 'CUST_USER: CUST_USER';
      STATUSDESC                     : String(64)  @title: 'STATUSDESC: STATUSDESC';
      SPECIALRECOGNITION             : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR               : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}


@cds.persistence.exists
@cds.persistence.calcview
entity CV_AVAILABILITY {
  key STATUSDESC                : String(64)  @title: 'STATUSDESC: STATUSDESC';
      AUTOAPPROVED              : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      CREATEDBY                 : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDON                 : Timestamp   @title: 'CREATEDON: CREATEDAT';
      CUST_CUSTOMSTRING         : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255) @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255) @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255) @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255) @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255) @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255) @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255) @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255) @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255) @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255) @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time        @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time        @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255) @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255) @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)   @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp   @title: 'LASTMODIFIED: LASTMODIFIED';
      STATUS                    : Integer     @title: 'STATUS: STATUS';
}


@cds.persistence.exists
@cds.persistence.calcview
entity CV_ACTIVE_WAGETYPES {
  key INFOTYPE                  : String(5)   @title: 'INFOTYPE: INFOTYPE';
      PAYCOMPONENT              : String(255) @title: 'PAYCOMPONENT: PAYCOMPONENT';
      WORKFLOW_ID               : String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID';
      DESCRIPTION               : String(255) @title: 'DESCRIPTION: DESCRIPTION';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
}


@cds.persistence.exists
@cds.persistence.calcview
entity CV_ACTIVE_WAGETYPES_TEXT {
  key INFOTYPE                  : String(5)   @title: 'INFOTYPE: INFOTYPE';
      PAYCOMPONENT_ID           : String(255) @title: 'PAYCOMPONENT_ID: PAYCOMPONENT_ID';
      WORKFLOW_ID               : String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID';
      DESCRIPTION               : String(255) @title: 'DESCRIPTION: DESCRIPTION';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
      LANGUAGE                  : String(5)   @title: 'LANGUAGE: LANGUAGE';
      CUST_FREQUENCY            : String(255) @title: 'CUST_FREQUENCY: CUST_FREQUENCY';
      CUST_FREQUENCY_TXT        : String(64)  @title: 'CUST_FREQUENCY_TXT: CUST_FREQUENCY_TXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_MASS_WAGETYPES {
  key INFOTYPE                  : String(5)   @title: 'INFOTYPE: INFOTYPE';
      PAYCOMPONENT_ID           : String(255) @title: 'PAYCOMPONENT_ID: PAYCOMPONENT_ID';
      WORKFLOW_ID               : String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID';
      DESCRIPTION               : String(255) @title: 'DESCRIPTION: DESCRIPTION';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      INITIATORROLE             : String(32)  @title: 'INITIATORROLE: INITIATORROLE';
      COMPANYCODE               : String(16)  @title: 'COMPANYCODE: COMPANYCODE';
      OPERATOR                  : String(3)   @title: 'OPERATOR: OPERATOR';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PENDING_APPROVAL(IP_LANGUAGE : String(5), IP_AGENT : String(100), IP_SPECIAL : UInt8) {
  key CUST_EXTERNALCODE     : String(100) @title: 'CUST_EXTERNALCODE: ID_1';
  key CUST_USERID           : String(128) @title: 'CUST_USERID: CUST_USERID';
  key EFFECTIVESTARTDATE    : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
  key CUST_ENDDATE          : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
  key CUST_PAYCOMPONENT_ID  : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPVALUE     : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE     : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING     : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT             : String(255) @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_NOTES            : String(255) @title: 'CUST_NOTES: CUST_NOTES';
  key ID                    : String(36)  @title: 'ID: ID';
      WORKFLOWSEQUENCE      : Integer     @title: 'WORKFLOWSEQUENCE: WORKFLOWSEQUENCE';
  key REQUESTTYPE           : String(5)   @title: 'REQUESTTYPE: REQUESTTYPE';
      FORWARDSEQUENCE       : Integer     @title: 'FORWARDSEQUENCE: FORWARDSEQUENCE';
      STATUS                : Integer     @title: 'STATUS: STATUS_ID';
  key AGENT                 : String(500) @title: 'AGENT: AGENT';
  key NEXTAGENT             : String(500) @title: 'NEXTAGENT: NEXTAGENT';
  key MODIFIEDBY            : String(255) @title: 'MODIFIEDBY: MODIFIEDBY';
      MODIFIEDAT            : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
  key CUST_PAYCOMPONENT_TXT : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
  key CUST_USER             : String(128) @title: 'CUST_USER: CUST_USER';
      CUST_CALCULATEDAMOUNT : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      SPECIALRECOGNITION    : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
  key CREATEDBY             : String(255) @title: 'CREATEDBY: CREATEDBY';
  key CREATEDBYUSER_1       : String(128) @title: 'CREATEDBYUSER_1: CREATEDBYUSER_1';
      CREATEDAT             : Timestamp   @title: 'CREATEDAT: CREATEDAT';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PEND_APPROVAL_SPL_RECOG(IP_AGENT : String(100)) {
  key ID                    : String(36)  @title: 'ID: ID';
      WORKFLOWSEQUENCE      : Integer     @title: 'WORKFLOWSEQUENCE: WORKFLOWSEQUENCE';
  key REQUESTTYPE           : String(5)   @title: 'REQUESTTYPE: REQUESTTYPE';
      FORWARDSEQUENCE       : Integer     @title: 'FORWARDSEQUENCE: FORWARDSEQUENCE';
      STATUS                : Integer     @title: 'STATUS: STATUS_ID';
  key AGENT                 : String(500) @title: 'AGENT: AGENT';
  key NEXTAGENT             : String(500) @title: 'NEXTAGENT: NEXTAGENT';
  key MODIFIEDBY            : String(255) @title: 'MODIFIEDBY: MODIFIEDBY';
      MODIFIEDAT            : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
  key CUST_EXTERNALCODE     : String(36)  @title: 'CUST_EXTERNALCODE: ID_1';
  key CUST_USERID           : String(128) @title: 'CUST_USERID: CUST_USERID';
  key CUST_PAYCOMPONENT_ID  : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
  key EFFECTIVESTARTDATE    : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE     : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING     : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT             : String(255) @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_NOTES            : String(255) @title: 'CUST_NOTES: CUST_NOTES';
  key CUST_USER             : String(128) @title: 'CUST_USER: CUST_USER';
  key CUST_PAYCOMPONENT_TXT : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_CALCULATEDAMOUNT : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      SPECIALRECOGNITION    : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
  key CREATEDBY             : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT             : Timestamp   @title: 'CREATEDAT: CREATEDAT';
  key CREATEDBYUSER         : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PEND_APPROVAL_AVAIL(IP_AGENT : String(100)) {
  key ID                        : String(36)  @title: 'ID: ID';
      WORKFLOWSEQUENCE          : Integer     @title: 'WORKFLOWSEQUENCE: WORKFLOWSEQUENCE';
      REQUESTTYPE               : String(5)   @title: 'REQUESTTYPE: REQUESTTYPE';
      FORWARDSEQUENCE           : Integer     @title: 'FORWARDSEQUENCE: FORWARDSEQUENCE';
      STATUS_ID                 : Integer     @title: 'STATUS_ID: STATUS_ID';
      AGENT                     : String(500) @title: 'AGENT: AGENT';
      NEXTAGENT                 : String(500) @title: 'NEXTAGENT: NEXTAGENT';
      MODIFIEDBY                : String(255) @title: 'MODIFIEDBY: MODIFIEDBY';
      MODIFIEDAT_1              : Timestamp   @title: 'MODIFIEDAT_1: MODIFIEDAT_1';
      CUST_EXTERNALCODE         : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      AUTOAPPROVED              : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      CREATEDBY                 : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDAT                 : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      CUST_CUSTOMSTRING         : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255) @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255) @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255) @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255) @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255) @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255) @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255) @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255) @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255) @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255) @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time        @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_NOTES                : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time        @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255) @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255) @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)   @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      MODIFIEDAT                : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
      STATUS                    : Integer     @title: 'STATUS: STATUS';
}


@cds.persistence.exists 
@cds.persistence.calcview 
Entity CV_WORKFLOW_ID {
key     PAYCOMPONENT_ID: String(255)  @title: 'PAYCOMPONENT_ID: PAYCOMPONENT_ID' ; 
        WORKFLOW_ID: String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID' ; 
        TRIGGERWORKFLOW: UInt8  @title: 'TRIGGERWORKFLOW: TRIGGERWORKFLOW' ; 
        SEQUENCE: Integer  @title: 'SEQUENCE: SEQUENCE' ; 
        AGENTROLE: String(64)  @title: 'AGENTROLE: AGENTROLE' ; 
        MAXFORWARDS: Integer  @title: 'MAXFORWARDS: MAXFORWARDS' ; 
        TRIGGEREMAILNOTIFICATION: UInt8  @title: 'TRIGGEREMAILNOTIFICATION: TRIGGEREMAILNOTIFICATION' ; 
        NOTIFICATIONAGENT_ROLE: String(64)  @title: 'NOTIFICATIONAGENT_ROLE: NOTIFICATIONAGENT_ROLE' ; 
        EMAILTEMPLATE_ID: String(10)  @title: 'EMAILTEMPLATE_ID: EMAILTEMPLATE_ID' ; 
        INFOTYPE: String(5)  @title: 'INFOTYPE: INFOTYPE' ; 
        INITIATORROLE: String(32)  @title: 'INITIATORROLE: INITIATORROLE' ; 
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_RECPAY_SUBMISSIONS(IP_CREATEDBY : String(128)) {
  key CUST_EXTERNALCODE     : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_USERID           : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID  : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_EVENTREASON      : String(255) @title: 'CUST_EVENTREASON: CUST_EVENTREASON';
      EFFECTIVESTARTDATE    : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_ENDDATE          : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_PAYCOMPVALUE     : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE     : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_FREQUENCY        : String(255) @title: 'CUST_FREQUENCY: CUST_FREQUENCY';
      CUST_CALCULATEDAMOUNT : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CUST_CUSTOMSTRING     : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT             : String(255) @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES            : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE     : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_PAYGROUP         : String(255) @title: 'CUST_PAYGROUP: CUST_PAYGROUP';
      STATUS                : Integer     @title: 'STATUS: STATUS';
      MODIFIEDAT            : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
      CREATEDBY             : String(128) @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT             : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      AUTOAPPROVED          : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CREATEDBYUSER         : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CUST_USER             : String(128) @title: 'CUST_USER: CUST_USER';
      CUST_PAYGROUP_TXT     : String(64)  @title: 'CUST_PAYGROUP_TXT: CUST_PAYGROUP_TXT';
      CUST_FREQUENCY_TXT    : String(64)  @title: 'CUST_FREQUENCY_TXT: CUST_FREQUENCY_TXT';
      CUST_UNIT_TXT         : String(32)  @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      STATUSDESC            : String(64)  @title: 'STATUSDESC: DESCRIPTION';
      DELIMITINDICATOR      : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ONETIMEPAY_SUBMISSIONS(IP_CREATEDBY : String(128)) {
  key ID                             : String(36)  @title: 'ID: ID';
      CUST_USERID                    : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID           : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      EFFECTIVESTARTDATE             : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE              : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE              : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING              : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER            : Integer     @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                    : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT                      : String(255) @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES                     : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE              : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_ALTERNATIVECOSTCENTER     : String(255) @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      STATUS                         : Integer     @title: 'STATUS: STATUS';
      MODIFIEDAT                     : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
      CREATEDBY                      : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT                      : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      AUTOAPPROVED                   : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_CALCULATEDAMOUNT          : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CREATEDBYUSER                  : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CUST_USER                      : String(128) @title: 'CUST_USER: CUST_USER';
      CUST_ALTERNATIVECOSTCENTER_TXT : String(64)  @title: 'CUST_ALTERNATIVECOSTCENTER_TXT: CUST_ALTERNATIVECOSTCENTER_TXT';
      CUST_UNIT_TXT                  : String(32)  @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT          : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      STATUSDESC                     : String(64)  @title: 'STATUSDESC: STATUSDESC';
      SPECIALRECOGNITION             : UInt8       @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR               : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AVAILABILITY_SUBMISSIONS(IP_CREATEDBY : String(128)) {
  key AUTOAPPROVED              : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY_ID                : String(3)   @title: 'COUNTRY_ID: COUNTRY_ID';
      CREATEDBY                 : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDON                 : Timestamp   @title: 'CREATEDON: CREATEDON';
      CUST_CUSTOMSTRING         : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255) @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255) @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255) @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255) @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255) @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255) @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255) @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255) @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255) @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255) @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date        @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time        @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255) @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100) @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255) @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time        @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128) @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255) @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255) @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)   @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp   @title: 'LASTMODIFIED: LASTMODIFIED';
      STATUS                    : Integer     @title: 'STATUS: STATUS';
      LANGUAGE                  : String(5)   @title: 'LANGUAGE: LANGUAGE';
      STATUSDESC                : String(64)  @title: 'STATUSDESC: STATUSDESC';
      ID                        : Integer     @title: 'ID: ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_EMPLOYEE_SELECTION(IP_USERID : String(32)) {
  key GROUPID   : String(32)  @title: 'GROUPID: GROUPID';
      GROUPNAME : String(64)  @title: 'GROUPNAME: GROUPNAME';
      USERID    : String(128) @title: 'USERID: USERID';
      ROLE      : String(32)  @title: 'ROLE: ROLE';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_MASS_EMP_SELECTION {
  key USERID        : String(128) @title: 'USERID: USERID';
      FIRSTNAME     : String(128) @title: 'FIRSTNAME: FIRSTNAME';
      MIDDLENAME    : String(128) @title: 'MIDDLENAME: MIDDLENAME';
      LASTNAME      : String(128) @title: 'LASTNAME: LASTNAME';
      COUNTRY       : String(3)   @title: 'COUNTRY: COUNTRY';
      ROLE          : String(128) @title: 'ROLE: ROLE';
      STATUS        : String(1)   @title: 'STATUS: STATUS';
      COMPANY       : String(5)   @title: 'COMPANY: COMPANY';
      CURRENCY      : String(4)   @title: 'CURRENCY: CURRENCY';
      DEFAULTLOCALE : String(5)   @title: 'DEFAULTLOCALE: DEFAULTLOCALE';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_COMPANY_CODE {
  key COMPANYCODE : String(16) @title: 'COMPANYCODE: COMPANYCODE';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_MASS_SEL_COUNTRIES {
  key ID   : String(3)  @title: 'ID: ID';
      NAME : String(64) @title: 'NAME: NAME';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_MASS_SEL_ROLES {
  key ROLE : String(32) @title: 'ROLE: ROLE';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_USER_SELECTION {
  key USERID        : String(128) @title: 'USERID: USERID';
      FIRSTNAME     : String(128) @title: 'FIRSTNAME: FIRSTNAME';
      MIDDLENAME    : String(128) @title: 'MIDDLENAME: MIDDLENAME';
      LASTNAME      : String(128) @title: 'LASTNAME: LASTNAME';
      COUNTRY       : String(3)   @title: 'COUNTRY: COUNTRY';
      ROLE          : String(128) @title: 'ROLE: ROLE';
      STATUS        : String(1)   @title: 'STATUS: STATUS';
      COMPANY       : String(5)   @title: 'COMPANY: COMPANY';
      CURRENCY      : String(4)   @title: 'CURRENCY: CURRENCY';
      DEFAULTLOCALE : String(5)   @title: 'DEFAULTLOCALE: DEFAULTLOCALE';
}


@cds.persistence.exists
@cds.persistence.calcview
entity CV_FWDUSER_POPULATION(IP_USERID : String(128)) {
  key USERID        : String(128) @title: 'USERID: USERID';
      USERNAME      : String(128) @title: 'USERNAME: USERNAME';
      EMPLOYEEID    : String(128) @title: 'EMPLOYEEID: EMPLOYEEID';
      FIRSTNAME     : String(128) @title: 'FIRSTNAME: FIRSTNAME';
      LASTNAME      : String(128) @title: 'LASTNAME: LASTNAME';
      MIDDLENAME    : String(128) @title: 'MIDDLENAME: MIDDLENAME';
      EMAIL         : String(100) @title: 'EMAIL: EMAIL';
      CUSTOM15      : String(100) @title: 'CUSTOM15: CUSTOM15';
      DEFAULTLOCALE : String(5)   @title: 'DEFAULTLOCALE: DEFAULTLOCALE';
      STATUS        : String(1)   @title: 'STATUS: STATUS';
      CUSTOMMANAGER : String(128) @title: 'CUSTOMMANAGER: CUSTOMMANAGER';
      HR            : String(128) @title: 'HR: HR';
      MANAGER       : String(128) @title: 'MANAGER: MANAGER';
      COUNTRY       : String(3)   @title: 'COUNTRY: COUNTRYOFCOMPANY';
      COMPANY       : String(5)   @title: 'COMPANY: COMPANY';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_USER_DETAILS{
  key USERID        : String(128) @title: 'USERID: USERID';
      USERNAME      : String(128) @title: 'USERNAME: USERNAME';
      EMPLOYEEID    : String(128) @title: 'EMPLOYEEID: EMPLOYEEID';
      FIRSTNAME     : String(128) @title: 'FIRSTNAME: FIRSTNAME';
      LASTNAME      : String(128) @title: 'LASTNAME: LASTNAME';
      MIDDLENAME    : String(128) @title: 'MIDDLENAME: MIDDLENAME';
      EMAIL         : String(100) @title: 'EMAIL: EMAIL';
      CUSTOM15      : String(100) @title: 'CUSTOM15: CUSTOM15';
      DEFAULTLOCALE : String(5)   @title: 'DEFAULTLOCALE: DEFAULTLOCALE';
      STATUS        : String(1)   @title: 'STATUS: STATUS';
      CUSTOMMANAGER : String(128) @title: 'CUSTOMMANAGER: CUSTOMMANAGER';
      HR            : String(128) @title: 'HR: HR';
      MANAGER       : String(128) @title: 'MANAGER: MANAGER';
      COUNTRY       : String(3)   @title: 'COUNTRY: COUNTRYOFCOMPANY';
      COMPANY       : String(5)   @title: 'COMPANY: COMPANY';
      CURRENCY      : String(4)   @title: 'CURRENCY: CURRENCY_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ALL_ACTIVE_EMPLOYEES {
  key USERID        : String(128) @title: 'USERID: USERID';
      USERNAME      : String(128) @title: 'USERNAME: USERNAME';
      FIRSTNAME     : String(128) @title: 'FIRSTNAME: FIRSTNAME';
      LASTNAME      : String(128) @title: 'LASTNAME: LASTNAME';
      MIDDLENAME    : String(128) @title: 'MIDDLENAME: MIDDLENAME';
      EMAIL         : String(100) @title: 'EMAIL: EMAIL';
      CUSTOM15      : String(100) @title: 'CUSTOM15: CUSTOM15';
      DEFAULTLOCALE : String(5)   @title: 'DEFAULTLOCALE: DEFAULTLOCALE';
      STATUS        : String(1)   @title: 'STATUS: STATUS';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ACTIVE_PAYCOMPONENT_TEXT {
  key CUST_PAYCOMPONENT         : String(255) @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      CUST_PAYCOMPONENT_TXT     : String(255) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ONETIMEPAY_ALL_COMMENTS {
  key CUST_CUSTOMSTRING              : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER            : Integer      @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_EXTERNALCODE              : String(36)   @title: 'CUST_EXTERNALCODE: ID';
      CUST_USERID                    : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID           : String(255)  @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      EFFECTIVESTARTDATE             : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE              : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE              : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_NUMBER                    : Decimal(34)  @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT                      : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES                     : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE              : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_ALTERNATIVECOSTCENTER     : String(255)  @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      STATUS                         : Integer      @title: 'STATUS: STATUS';
      DESCRIPTION                    : String(64)   @title: 'DESCRIPTION: DESCRIPTION';
      LASTMODIFIED                   : Timestamp    @title: 'LASTMODIFIED: MODIFIEDAT';
      CREATEDBY                      : String(255)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT                      : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      AUTOAPPROVED                   : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_CALCULATEDAMOUNT          : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CREATEDBYUSER                  : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      INITIATORLANGUAGE              : String(5)    @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      CUST_USER                      : String(128)  @title: 'CUST_USER: CUST_USER';
      CUST_ALTERNATIVECOSTCENTER_TXT : String(64)   @title: 'CUST_ALTERNATIVECOSTCENTER_TXT: CUST_ALTERNATIVECOSTCENTER_TXT';
      CUST_UNIT_TXT                  : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT          : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      COUNTRY_ID                     : String(3)    @title: 'COUNTRY_ID: COUNTRY_ID';
      SPECIALRECOGNITION             : UInt8        @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      REQUESTTYPE                    : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      WORKFLOWSEQUENCE               : Integer      @title: 'WORKFLOWSEQUENCE: WORKFLOWSEQUENCE';
      FORWARDSEQUENCE                : Integer      @title: 'FORWARDSEQUENCE: FORWARDSEQUENCE';
      AGENT                          : String(500)  @title: 'AGENT: AGENT';
      NEXTAGENT                      : String(500)  @title: 'NEXTAGENT: NEXTAGENT';
      MODIFIEDBY                     : String(255)  @title: 'MODIFIEDBY: MODIFIEDBY';
      CHANGEDBYUSER                  : String(128)  @title: 'CHANGEDBYUSER: CREATEDBYUSER';
      WORKFLOW_ID                    : String(16)   @title: 'WORKFLOW_ID: WORKFLOW_ID';
      NOTIFICATIONAGENT              : String(64)   @title: 'NOTIFICATIONAGENT: NOTIFICATIONAGENT';
      ADDITIONALINFO                 : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      DELIMITINDICATOR               : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AVAILABILITY_ALL_COMMENTS {
  key REJECTIONCOMMENTS         : String(5000) @title: 'REJECTIONCOMMENTS: REJECTIONCOMMENTS';
      EXTERNALCODE              : String(100)  @title: 'EXTERNALCODE: EXTERNALCODE';
      ACTION_ID                 : Integer      @title: 'ACTION_ID: ACTION_ID';
      REQUESTTYPE               : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO            : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      REQREQUESTTYPE            : String(5)    @title: 'REQREQUESTTYPE: REQREQUESTTYPE';
      REQWORKFLOWSEQUENCE       : Integer      @title: 'REQWORKFLOWSEQUENCE: REQWORKFLOWSEQUENCE';
      REQFORWARDSEQUENCE        : Integer      @title: 'REQFORWARDSEQUENCE: REQFORWARDSEQUENCE';
      REQAGENT                  : String(500)  @title: 'REQAGENT: REQAGENT';
      REQNEXTAGENT              : String(500)  @title: 'REQNEXTAGENT: REQNEXTAGENT';
      REQCHANGEDBY              : String(255)  @title: 'REQCHANGEDBY: REQCHANGEDBY';
      REQCHANGEDBYUSER          : String(128)  @title: 'REQCHANGEDBYUSER: REQCHANGEDBYUSER';
      REQWORKFLOW_ID            : String(16)   @title: 'REQWORKFLOW_ID: REQWORKFLOW_ID';
      REQNOTIFICATIONAGENT      : String(64)   @title: 'REQNOTIFICATIONAGENT: REQNOTIFICATIONAGENT';
      AUTOAPPROVED              : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY                   : String(3)    @title: 'COUNTRY: COUNTRY';
      CREATEDBY                 : String(255)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDON                 : Timestamp    @title: 'CREATEDON: CREATEDON';
      CUST_CUSTOMSTRING         : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255)  @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255)  @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255)  @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255)  @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255)  @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255)  @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255)  @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255)  @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255)  @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255)  @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time         @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT_ID      : String(255)  @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      CUST_PAYCOMPONENT_TXT     : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time         @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255)  @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255)  @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)    @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      STATUS                    : Integer      @title: 'STATUS: STATUS';
      ID                        : Integer      @title: 'ID: ID';
      LANGUAGE                  : String(5)    @title: 'LANGUAGE: LANGUAGE';
      STATUSDESC                : String(64)   @title: 'STATUSDESC: STATUSDESC';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PAYMENTS_COMBINED {
  key ID                    : String(100) @title: 'ID: ID';
  key CUST_USERID           : String(128) @title: 'CUST_USERID: CUST_USERID';
  key CUST_PAYCOMPONENT_ID  : String(255) @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
  key EFFECTIVESTARTDATE    : Date        @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34) @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE     : String(64)  @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING     : String(255) @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34) @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT             : String(255) @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_NOTES            : String(255) @title: 'CUST_NOTES: CUST_NOTES';
  key CUST_USER             : String(128) @title: 'CUST_USER: CUST_USER';
  key CUST_PAYCOMPONENT_TXT : String(128) @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_CALCULATEDAMOUNT : Decimal(34) @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
  key CUST_UNIT_TXT         : String(32)  @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      MODIFIEDAT            : Timestamp   @title: 'MODIFIEDAT: MODIFIEDAT';
  key CREATEDBYUSER         : String(128) @title: 'CREATEDBYUSER: CREATEDBYUSER';
  key CREATEDBY             : String(255) @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT             : Timestamp   @title: 'CREATEDAT: CREATEDAT';
      STATUS                : Integer     @title: 'STATUS: STATUS';
  key STATUSDESC            : String(64)  @title: 'STATUSDESC: STATUSDESC';
      AUTOAPPROVED          : UInt8       @title: 'AUTOAPPROVED: AUTOAPPROVED';
  key COUNTRY               : String(3)   @title: 'COUNTRY: COUNTRY_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AUDIT_LOG {
  key ID             : String(36)   @title: 'ID: ID';
      EXTERNALCODE   : String(100)  @title: 'EXTERNALCODE: EXTERNALCODE';
      ACTION_ID      : Integer      @title: 'ACTION_ID: ACTION_ID';
      CREATEDON      : Timestamp    @title: 'CREATEDON: CREATEDON';
      CREATEDBY      : String(255)  @title: 'CREATEDBY: CREATEDBY';
      REQUESTTYPE    : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      CREATEDBYUSER  : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      ACTIONDESC     : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PAYMENTS_COMBINED_FILTERED(IP_LANGUAGE : String(5)) {
  key ID                    : String(100)  @title: 'ID: ID';
  key CUST_USERID           : String(128)  @title: 'CUST_USERID: CUST_USERID';
  key CUST_PAYCOMPONENT_ID  : String(255)  @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
  key EFFECTIVESTARTDATE    : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE     : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING     : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34)  @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT             : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_NOTES            : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
  key CUST_USER             : String(128)  @title: 'CUST_USER: CUST_USER';
  key CUST_PAYCOMPONENT_TXT : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_CALCULATEDAMOUNT : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
  key CUST_UNIT_TXT         : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      MODIFIEDAT            : Timestamp    @title: 'MODIFIEDAT: MODIFIEDAT';
  key CREATEDBYUSER         : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
  key CREATEDBY             : String(255)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT             : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      STATUS                : Integer      @title: 'STATUS: STATUS';
  key STATUSDESC            : String(64)   @title: 'STATUSDESC: DESCRIPTION';
      AUTOAPPROVED          : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
  key LOGID                 : String(36)   @title: 'LOGID: ID_1';
      ACTION_ID             : Integer      @title: 'ACTION_ID: ACTION_ID';
  key ACTIONDESC            : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
      LOGCREATEDAT          : Timestamp    @title: 'LOGCREATEDAT: CREATEDAT_1';
  key LOGCREATEDBY          : String(255)  @title: 'LOGCREATEDBY: CREATEDBY_1';
  key LOGCREATEDBYUSER      : String(128)  @title: 'LOGCREATEDBYUSER: CREATEDBYUSER_1';
  key REQUESTTYPE           : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
  key ADDITIONALINFO        : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
  key COUNTRY               : String(3)    @title: 'COUNTRY: COUNTRY_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_PAYMENT_LOGS(IP_LANGUAGE : String(5), IP_START_DATE : Timestamp, IP_END_DATE : Timestamp) {
  key ID                    : String(100)  @title: 'ID: ID';
      CUST_USERID           : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT_ID  : String(255)  @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
      EFFECTIVESTARTDATE    : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE     : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING     : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Decimal(34)  @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT             : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES            : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_USER             : String(128)  @title: 'CUST_USER: CUST_USER';
      CUST_PAYCOMPONENT_TXT : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_CALCULATEDAMOUNT : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CUST_ENDDATE          : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_UNIT_TXT         : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      MODIFIEDAT            : Timestamp    @title: 'MODIFIEDAT: MODIFIEDAT';
      CREATEDBYUSER         : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDBY             : String(255)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT             : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      STATUS                : Integer      @title: 'STATUS: STATUS';
      STATUSDESC            : String(64)   @title: 'STATUSDESC: DESCRIPTION';
      AUTOAPPROVED          : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      LOGID                 : String(36)   @title: 'LOGID: ID_1';
      ACTION_ID             : Integer      @title: 'ACTION_ID: ACTION_ID';
      ACTIONDESC            : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
      LOGCREATEDAT          : Timestamp    @title: 'LOGCREATEDAT: CREATEDAT_1';
      LOGCREATEDBY          : String(255)  @title: 'LOGCREATEDBY: CREATEDBY_1';
      LOGCREATEDBYUSER      : String(128)  @title: 'LOGCREATEDBYUSER: CREATEDBYUSER_1';
      REQUESTTYPE           : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO        : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      COUNTRY               : String(3)    @title: 'COUNTRY: COUNTRY_ID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AUDIT_LOGS_HR {
  key CUST_EXTERNALCODE     : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_USERID           : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT     : String(255)  @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      EFFECTIVESTARTDATE    : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE     : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING     : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Integer      @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT             : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES            : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      STATUS                : Integer      @title: 'STATUS: STATUS';
      STATUSDESC            : String(64)   @title: 'STATUSDESC: STATUSDESC';
      LASTMODIFIED          : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      CREATEDBY             : String(128)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDON             : Timestamp    @title: 'CREATEDON: CREATEDON';
      AUTOAPPROVED          : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_CALCULATEDAMOUNT : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CREATEDBYUSER         : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CUST_USER             : String(128)  @title: 'CUST_USER: CUST_USER';
      COUNTRY               : String(3)    @title: 'COUNTRY: COUNTRY';
      CUST_UNIT_TXT         : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_ENDDATE          : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      LOGID                 : String(36)   @title: 'LOGID: LOGID';
      ACTION_ID             : Integer      @title: 'ACTION_ID: ACTION_ID';
      LOGCREATEDON          : Timestamp    @title: 'LOGCREATEDON: LOGCREATEDON';
      LOGCREATEDBY          : String(255)  @title: 'LOGCREATEDBY: LOGCREATEDBY';
      REQUESTTYPE           : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO        : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      LOGCREATEDBYUSER      : String(128)  @title: 'LOGCREATEDBYUSER: LOGCREATEDBYUSER';
      ACTIONDESC            : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
      SPECIALRECOGNITION    : UInt8        @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR      : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ONETIMEPAY_LOGS_HR(IP_LANGUAGE : String(5)) {
  key CUST_EXTERNALCODE              : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_USERID                    : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT              : String(255)  @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      EFFECTIVESTARTDATE             : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE              : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE              : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING              : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER            : Integer      @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                    : Integer      @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT                      : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES                     : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_EXISTINGCODE              : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      STATUS                         : Integer      @title: 'STATUS: STATUS';
      STATUSDESC                     : String(64)   @title: 'STATUSDESC: STATUSDESC';
      LASTMODIFIED                   : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      CREATEDBY_1                    : String(128)  @title: 'CREATEDBY_1: CREATEDBY_1';
      CREATEDON                      : Timestamp    @title: 'CREATEDON: CREATEDON';
      AUTOAPPROVED                   : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_CALCULATEDAMOUNT          : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CREATEDBYUSER_1                : String(128)  @title: 'CREATEDBYUSER_1: CREATEDBYUSER_1';
      CUST_USER                      : String(128)  @title: 'CUST_USER: CUST_USER';
      COUNTRY                        : String(3)    @title: 'COUNTRY: COUNTRY';
      CUST_ALTERNATIVECOSTCENTER     : String(255)  @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
      CUST_ALTERNATIVECOSTCENTER_TXT : String(64)   @title: 'CUST_ALTERNATIVECOSTCENTER_TXT: CUST_ALTERNATIVECOSTCENTER_TXT';
      CUST_UNIT_TXT                  : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT          : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      LOGID                          : String(36)   @title: 'LOGID: ID';
      ACTION_ID                      : Integer      @title: 'ACTION_ID: ACTION_ID';
      LOGCREATEDAT                   : Timestamp    @title: 'LOGCREATEDAT: CREATEDAT';
      LOGCREATEDBY                   : String(255)  @title: 'LOGCREATEDBY: CREATEDBY';
      REQUESTTYPE                    : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO                 : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      LOGCREATEDBYUSER               : String(128)  @title: 'LOGCREATEDBYUSER: CREATEDBYUSER';
      ACTIONDESC                     : String(128)  @title: 'ACTIONDESC: DESCRIPTION';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AVAILABILITY_LOGS_HR(IP_LANGUAGE : String(6)) {
  key LOGID                     : String(36)   @title: 'LOGID: ID';
      ACTION_ID                 : Integer      @title: 'ACTION_ID: ACTION_ID';
      LOGCREATEDON              : Timestamp    @title: 'LOGCREATEDON: CREATEDAT';
      LOGCREATEDBY              : String(255)  @title: 'LOGCREATEDBY: CREATEDBY';
      REQUESTTYPE               : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO            : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      LOGCREATEDBYUSER          : String(128)  @title: 'LOGCREATEDBYUSER: CREATEDBYUSER';
      ACTIONDESC                : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
      STATUSDESC                : String(64)   @title: 'STATUSDESC: STATUSDESC';
      AUTOAPPROVED              : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY                   : String(3)    @title: 'COUNTRY: COUNTRY';
      CREATEDBY                 : String(128)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDON                 : Timestamp    @title: 'CREATEDON: CREATEDON';
      CUST_CUSTOMSTRING         : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255)  @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255)  @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255)  @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255)  @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255)  @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255)  @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255)  @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255)  @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255)  @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255)  @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time         @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT         : String(255)  @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      CUST_PAYCOMPONENT_TXT     : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time         @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255)  @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255)  @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)    @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      STATUS                    : Integer      @title: 'STATUS: STATUS';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_ONETIMEPAY_LOGS(IP_LANGUAGE : String(5), IP_START_DATE : Timestamp, IP_END_DATE : Timestamp) {
  key ID                             : String(36)   @title: 'ID: ID';
  key CUST_USERID                    : String(128)  @title: 'CUST_USERID: CUST_USERID';
  key CUST_PAYCOMPONENT_ID           : String(255)  @title: 'CUST_PAYCOMPONENT_ID: CUST_PAYCOMPONENT_ID';
  key CUST_PAYCOMPONENT_TXT          : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
  key EFFECTIVESTARTDATE             : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE              : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
  key CUST_CURRENCYCODE              : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
  key CUST_CUSTOMSTRING              : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_SEQUENCENUMBER            : Integer      @title: 'CUST_SEQUENCENUMBER: CUST_SEQUENCENUMBER';
      CUST_NUMBER                    : Decimal(34)  @title: 'CUST_NUMBER: CUST_NUMBER';
  key CUST_UNIT                      : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
  key CUST_UNIT_TXT                  : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
  key CUST_NOTES                     : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
  key CUST_USER                      : String(128)  @title: 'CUST_USER: CUST_USER';
      CUST_CALCULATEDAMOUNT          : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      MODIFIEDAT                     : Timestamp    @title: 'MODIFIEDAT: MODIFIEDAT';
  key CREATEDBYUSER                  : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
  key CREATEDBY                      : String(255)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDAT                      : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      STATUS                         : Integer      @title: 'STATUS: STATUS';
  key STATUSDESC                     : String(64)   @title: 'STATUSDESC: STATUSDESC';
      AUTOAPPROVED                   : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
  key CUST_ALTERNATIVECOSTCENTER     : String(255)  @title: 'CUST_ALTERNATIVECOSTCENTER: CUST_ALTERNATIVECOSTCENTER';
  key CUST_ALTERNATIVECOSTCENTER_TXT : String(64)   @title: 'CUST_ALTERNATIVECOSTCENTER_TXT: CUST_ALTERNATIVECOSTCENTER_TXT';
  key CUST_EXISTINGCODE              : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
  key LOGID                          : String(36)   @title: 'LOGID: ID_1';
      ACTION_ID                      : Integer      @title: 'ACTION_ID: ACTION_ID';
      LOGCREATEDAT                   : Timestamp    @title: 'LOGCREATEDAT: CREATEDAT_1';
  key LOGCREATEDBY                   : String(255)  @title: 'LOGCREATEDBY: CREATEDBY_1';
  key REQUESTTYPE                    : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
  key ADDITIONALINFO                 : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
  key LOGCREATEDBYUSER               : String(128)  @title: 'LOGCREATEDBYUSER: CREATEDBYUSER_1';
  key ACTIONDESC                     : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
  key COUNTRY_ID                     : String(3)    @title: 'COUNTRY_ID: COUNTRY_ID';
      SPECIALRECOGNITION             : UInt8        @title: 'SPECIALRECOGNITION: SPECIALRECOGNITION';
      DELIMITINDICATOR               : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AVAILABILITY_LOGS {
  key STATUSDESC                : String(64)   @title: 'STATUSDESC: STATUSDESC';
      AUTOAPPROVED              : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      COUNTRY                   : String(3)    @title: 'COUNTRY: COUNTRY';
      CREATEDBY                 : String(128)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDBYUSER             : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CREATEDON                 : Timestamp    @title: 'CREATEDON: CREATEDON';
      CUST_CUSTOMSTRING         : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_CUSTOMVAR1           : String(255)  @title: 'CUST_CUSTOMVAR1: CUST_CUSTOMVAR1';
      CUST_CUSTOMVAR2           : String(255)  @title: 'CUST_CUSTOMVAR2: CUST_CUSTOMVAR2';
      CUST_CUSTOMVAR3           : String(255)  @title: 'CUST_CUSTOMVAR3: CUST_CUSTOMVAR3';
      CUST_CUSTOMVAR4           : String(255)  @title: 'CUST_CUSTOMVAR4: CUST_CUSTOMVAR4';
      CUST_CUSTOMVAR5           : String(255)  @title: 'CUST_CUSTOMVAR5: CUST_CUSTOMVAR5';
      CUST_CUSTOMVAR6           : String(255)  @title: 'CUST_CUSTOMVAR6: CUST_CUSTOMVAR6';
      CUST_DAILYWORKSCHEDULE    : String(255)  @title: 'CUST_DAILYWORKSCHEDULE: CUST_DAILYWORKSCHEDULE';
      CUST_DAILYWORKSCHEDULETXT : String(255)  @title: 'CUST_DAILYWORKSCHEDULETXT: CUST_DAILYWORKSCHEDULETXT';
      CUST_DWSGROUPING          : String(255)  @title: 'CUST_DWSGROUPING: CUST_DWSGROUPING';
      CUST_DWSGROUPINGTXT       : String(255)  @title: 'CUST_DWSGROUPINGTXT: CUST_DWSGROUPINGTXT';
      CUST_ENDDATE              : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      CUST_ENDTIME              : Time         @title: 'CUST_ENDTIME: CUST_ENDTIME';
      CUST_EXISTINGCODE         : String(255)  @title: 'CUST_EXISTINGCODE: CUST_EXISTINGCODE';
      CUST_EXTERNALCODE         : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      CUST_NOTES                : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      CUST_PAYCOMPONENT         : String(255)  @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      CUST_PAYCOMPONENT_TXT     : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_STARTTIME            : Time         @title: 'CUST_STARTTIME: CUST_STARTTIME';
      CUST_USERID               : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_WSVARIANT            : String(255)  @title: 'CUST_WSVARIANT: CUST_WSVARIANT';
      CUST_WSVARIANTTXT         : String(255)  @title: 'CUST_WSVARIANTTXT: CUST_WSVARIANTTXT';
      DELIMITINDICATOR          : UInt8        @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
      EFFECTIVESTARTDATE        : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      INITIATORLANGUAGE         : String(5)    @title: 'INITIATORLANGUAGE: INITIATORLANGUAGE';
      LASTMODIFIED              : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      STATUS                    : Integer      @title: 'STATUS: STATUS';
      ID                        : String(36)   @title: 'ID: ID';
      EXTERNALCODE              : String(100)  @title: 'EXTERNALCODE: EXTERNALCODE';
      ACTION_ID                 : Integer      @title: 'ACTION_ID: ACTION_ID';
      CREATEDON_1               : Timestamp    @title: 'CREATEDON_1: CREATEDON_1';
      CREATEDBY_1               : String(255)  @title: 'CREATEDBY_1: CREATEDBY_1';
      REQUESTTYPE               : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO            : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      CREATEDBYUSER_1           : String(128)  @title: 'CREATEDBYUSER_1: CREATEDBYUSER_1';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AUDIT_LOG_FILTERED {
  key ID             : String(36)   @title: 'ID: ID';
      EXTERNALCODE   : String(100)  @title: 'EXTERNALCODE: EXTERNALCODE';
      ACTION_ID      : Integer      @title: 'ACTION_ID: ACTION_ID';
      CREATEDAT      : Timestamp    @title: 'CREATEDAT: CREATEDAT';
      CREATEDBY      : String(255)  @title: 'CREATEDBY: CREATEDBY';
      REQUESTTYPE    : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      CREATEDBYUSER  : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      DESCRIPTION    : String(128)  @title: 'DESCRIPTION: DESCRIPTION';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_EMAIL_TEXT {
  key BODY         : String(1024) @title: 'BODY: BODY';
      ID           : String(10)   @title: 'ID: ID';
      LANGUAGE     : String(5)    @title: 'LANGUAGE: LANGUAGE';
      TITLE        : String(128)  @title: 'TITLE: TITLE';
      MAPPINGID_ID : String(16)   @title: 'MAPPINGID_ID: MAPPINGID_ID';
      INFOTYPE     : String(5)    @title: 'INFOTYPE: INFOTYPE';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_HRADMIN_USERS {
  key USERID : String(128) @title: 'USERID: USERID';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_COUNTRIES {
  key ID   : String(3)  @title: 'ID: ID';
      NAME : String(64) @title: 'NAME: NAME';
}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_AUDIT_LOGS_V2(IP_LANGUAGE : String(5)) {
  key CUST_EXTERNALCODE     : String(100)  @title: 'CUST_EXTERNALCODE: CUST_EXTERNALCODE';
      LOGID                 : String(36)   @title: 'LOGID: ID';
      ACTION_ID             : Integer      @title: 'ACTION_ID: ACTION_ID';
      LOGCREATEDBY          : String(255)  @title: 'LOGCREATEDBY: LOGCREATEDBY';
      REQUESTTYPE           : String(5)    @title: 'REQUESTTYPE: REQUESTTYPE';
      ADDITIONALINFO        : String(5000) @title: 'ADDITIONALINFO: ADDITIONALINFO';
      LOGCREATEDBYUSER      : String(128)  @title: 'LOGCREATEDBYUSER: LOGCREATEDBYUSER';
      ACTIONDESC            : String(128)  @title: 'ACTIONDESC: ACTIONDESC';
      STATUSDESC            : String(64)   @title: 'STATUSDESC: STATUSDESC';
      CUST_USERID           : String(128)  @title: 'CUST_USERID: CUST_USERID';
      CUST_PAYCOMPONENT     : String(255)  @title: 'CUST_PAYCOMPONENT: CUST_PAYCOMPONENT';
      EFFECTIVESTARTDATE    : Date         @title: 'EFFECTIVESTARTDATE: EFFECTIVESTARTDATE';
      CUST_PAYCOMPVALUE     : Decimal(34)  @title: 'CUST_PAYCOMPVALUE: CUST_PAYCOMPVALUE';
      CUST_CURRENCYCODE     : String(64)   @title: 'CUST_CURRENCYCODE: CUST_CURRENCYCODE';
      CUST_CUSTOMSTRING     : String(255)  @title: 'CUST_CUSTOMSTRING: CUST_CUSTOMSTRING';
      CUST_NUMBER           : Integer      @title: 'CUST_NUMBER: CUST_NUMBER';
      CUST_UNIT             : String(255)  @title: 'CUST_UNIT: CUST_UNIT';
      CUST_NOTES            : String(255)  @title: 'CUST_NOTES: CUST_NOTES';
      STATUS                : Integer      @title: 'STATUS: STATUS';
      LASTMODIFIED          : Timestamp    @title: 'LASTMODIFIED: LASTMODIFIED';
      CREATEDBY             : String(128)  @title: 'CREATEDBY: CREATEDBY';
      CREATEDON             : Timestamp    @title: 'CREATEDON: CREATEDON';
      AUTOAPPROVED          : UInt8        @title: 'AUTOAPPROVED: AUTOAPPROVED';
      CUST_CALCULATEDAMOUNT : Decimal(34)  @title: 'CUST_CALCULATEDAMOUNT: CUST_CALCULATEDAMOUNT';
      CREATEDBYUSER         : String(128)  @title: 'CREATEDBYUSER: CREATEDBYUSER';
      CUST_USER             : String(128)  @title: 'CUST_USER: CUST_USER';
      COUNTRY               : String(3)    @title: 'COUNTRY: COUNTRY';
      CUST_UNIT_TXT         : String(32)   @title: 'CUST_UNIT_TXT: CUST_UNIT_TXT';
      CUST_PAYCOMPONENT_TXT : String(128)  @title: 'CUST_PAYCOMPONENT_TXT: CUST_PAYCOMPONENT_TXT';
      CUST_ENDDATE          : Date         @title: 'CUST_ENDDATE: CUST_ENDDATE';
      LOGID_1               : String(36)   @title: 'LOGID_1: LOGID_1';
}


@cds.persistence.exists
@cds.persistence.calcview
entity CV_ACTIVE_WAGETYPES_TEXT_BASEDONLOCALE {
  key INFOTYPE                  : String(5)   @title: 'INFOTYPE: INFOTYPE';
      PAYCOMPONENT_ID           : String(255) @title: 'PAYCOMPONENT_ID: PAYCOMPONENT_ID';
      WORKFLOW_ID               : String(16)  @title: 'WORKFLOW_ID: WORKFLOW_ID';
      DESCRIPTION               : String(255) @title: 'DESCRIPTION: DESCRIPTION';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
      LANGUAGE                  : String(5)   @title: 'LANGUAGE: LANGUAGE';
      SUB_INFOTYPE              : String(10)  @title: 'SUB_INFOTYPE: SUB_INFOTYPE';
      CUST_FREQUENCY            : String(255) @title: 'CUST_FREQUENCY: CUST_FREQUENCY';
      CUST_FREQUENCY_TXT        : String(64)  @title: 'CUST_FREQUENCY_TXT: CUST_FREQUENCY_TXT';
      DELIMITINDICATOR          : UInt8       @title: 'DELIMITINDICATOR: DELIMITINDICATOR';
}
