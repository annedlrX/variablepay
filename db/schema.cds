//namespace com.strada;

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
};
}

@cds.persistence.exists 
@cds.persistence.calcview 
Entity CV_WAGETYPES {
key     ID: String(255)  @title: 'ID: ID' ; 
        IS_ACTIVE: UInt8  @title: 'IS_ACTIVE: IS_ACTIVE' ; 
        STARTDATE: Date  @title: 'STARTDATE: STARTDATE' ; 
        ENDDATE: Date  @title: 'ENDDATE: ENDDATE' ; 
        IS_AMOUNTTYPE: String(5)  @title: 'IS_AMOUNTTYPE: IS_AMOUNTTYPE' ; 
        UOM: String(5)  @title: 'UOM: UOM' ; 
        IS_SPECIALRECOGNITIONTYPE: UInt8  @title: 'IS_SPECIALRECOGNITIONTYPE: IS_SPECIALRECOGNITIONTYPE' ; 
        WAGETYPE: String(255)  @title: 'WAGETYPE: WAGETYPE' ; 
        ISINDEVAL: UInt8  @title: 'ISINDEVAL: ISINDEVAL' ; 
        CURRENCY: String(16)  @title: 'CURRENCY: CURRENCY' ; 
        IS_QUOTACOMPENSATION: UInt8  @title: 'IS_QUOTACOMPENSATION: IS_QUOTACOMPENSATION' ; 
        SUB_INFOTYPE: String(10)  @title: 'SUB_INFOTYPE: SUB_INFOTYPE' ; 
        LANGUAGE: String(5)  @title: 'LANGUAGE: LANGUAGE' ; 
        DESCRIPTION: String(255)  @title: 'DESCRIPTION: DESCRIPTION' ; 
}