namespace com.strada;

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
