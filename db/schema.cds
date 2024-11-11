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
    infoType      : String(5) not null;
    country       : Association[1] to VP_COUNTRIES {
                      id
                    } not null;
    payComponent  : Association[1] to VP_WAGETYPE {
                      id
                    };
    initiatorRole : String(32);
    workflow      : Association[1] to VP_WORKFLOW {
                      id
                    };
    companyCode   : String(16);
    operator      : String(3);
    /*
      delimitIndicator : hana.TINYINT;  
      cust_frequency :	String(255);
      cust_frequency_txt:String(64);
    */
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

}

@cds.persistence.exists
@cds.persistence.calcview
entity CV_WAGETYPES {
  key ID                        : String(255) @title: 'ID: ID';
      IS_ACTIVE                 : UInt8       @title: 'IS_ACTIVE: IS_ACTIVE';
      STARTDATE                 : Date        @title: 'STARTDATE: STARTDATE';
      ENDDATE                   : Date        @title: 'ENDDATE: ENDDATE';
      IS_AMOUNTTYPE             : String(5)   @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE';
      UOM                       : String(5)   @title: 'UOM: UOM';
      IS_SPECIALRECOGNITIONTYPE : UInt8       @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE';
      WAGETYPE                  : String(255) @title: 'WAGETYPE: WAGETYPE';
      ISINDEVAL                 : UInt8       @title: 'ISINDEVAL: ISINDEVAL';
      CURRENCY                  : String(16)  @title: 'CURRENCY: CURRENCY';
      IS_QUOTACOMPENSATION      : UInt8       @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION';
      SUB_INFOTYPE              : String(10)  @title: 'SUB_INFOTYPE: SUB_INFOTYPE';
      LANGUAGE                  : String(5)   @title: 'LANGUAGE: LANGUAGE';
      DESCRIPTION               : String(255) @title: 'DESCRIPTION: DESCRIPTION';
}