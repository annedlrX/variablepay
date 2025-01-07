using com.strada as vp from '../db/schema';
using CV_PENDPOSTING_ONETIME_PAY from '../db/schema';

service CatalogService {

    //================================================
    //      XSODATA Services
    //================================================
    @readonly
    entity Books                      as projection on vp.Books;

    @readonly
    entity VP_WAGETYPE                as projection on vp.VP_WAGETYPE;
    
    entity VP_REQUEST_STATUS          as projection on vp.VP_REQUEST_STATUS;
    entity VP_WORKFLOW                as projection on vp.VP_WORKFLOW;
    entity VP_AUDIT_LOG               as projection on vp.VP_AUDIT_LOG;
    entity VP_TIMEKEEPER              as projection on vp.VP_TIMEKEEPER;
    entity VP_AVAILABILITY            as projection on vp.VP_AVAILABILITY;
    entity VP_REQUEST_FLOW            as projection on vp.VP_REQUEST_FLOW;
    entity VP_CURRENCY                as projection on vp.VP_CURRENCY;
    entity VP_EMAIL_PARAMETERS_CONFIG as projection on vp.VP_EMAIL_PARAMETERS_CONFIG;
    entity VP_EMAIL_TEMPLATES         as projection on vp.VP_EMAIL_TEMPLATES;
    entity VP_EMAIL_TEMPLATES_CONFIG  as projection on vp.VP_EMAIL_TEMPLATES_CONFIG;
    entity VP_EMPJOB                  as projection on vp.VP_EMPJOB;
    entity VP_LOG_ACTION              as projection on vp.VP_LOG_ACTION;
    entity VP_LOG_ACTION_TEXT         as projection on vp.VP_LOG_ACTION_TEXT;
    entity VP_MAP_CURRENCY_COUNTRY    as projection on vp.VP_MAP_CURRENCY_COUNTRY;
    entity VP_MAP_EMAIL_PARAMETERS    as projection on vp.VP_MAP_EMAIL_PARAMETERS;
    entity VP_ONETIME_PAY             as projection on vp.VP_ONETIME_PAY;
    entity VP_RBP_GROUPS              as projection on vp.VP_RBP_GROUPS;
    entity VP_RBP_EMPLOYEES           as projection on vp.VP_RBP_EMPLOYEES;

    @open
    type object {};

    //================================================
    //      Actions Procedure
    //================================================
    action   SAVE_APP_AVAILABILITY(it_recpay : VP_AVAILABILITY, it_req_flow : VP_REQUEST_FLOW) returns String;
    action   GEN_UUID()                                                                        returns String;
    action   ADD_REQUESTFLOW(iv_externalCode : String, it_req_flow : array of VP_REQUEST_FLOW) returns String;
    //================================================
    //      Funcitons xsjs
    //================================================
    function saveAvailability(results : array of object)                                       returns String;
    function saveOneTimePay(results : array of object)                                         returns object;
    function uploadEmpJobCPI(body : String)                                                    returns String;
    function uploadUserCPI(body : String)                                                      returns String;
    function updateAvailabilityCPI(body : String)                                              returns String;
    function updateOneTimePayCPI(body : String)                                                returns String;
    //================================================
    //      CV Views
    //================================================
    entity Pending_OneTimePayments    as projection on CV_PENDPOSTING_ONETIME_PAY;

}
