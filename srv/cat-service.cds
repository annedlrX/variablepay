using com.strada as vp from '../db/schema';
using CV_WAGETYPES from '../db/schema';
using CV_PENDPOSTING_ONETIME_PAY from '../db/schema';
using CV_PENDPOSTING_AVAILABILITY_PAY from '../db/schema';
using CV_HCI_ONETIME_PAY from '../db/schema';
using CV_HCI_AVAILABILITY from '../db/schema';
using CV_WF_CONFIG from '../db/schema';
using CV_ONETIME_PAY from '../db/schema';
using CV_AVAILABILITY from '../db/schema';
using CV_ACTIVE_WAGETYPES from '../db/schema';
using CV_ACTIVE_WAGETYPES_TEXT from '../db/schema';
using CV_MASS_WAGETYPES from '../db/schema';
using CV_PENDING_APPROVAL from '../db/schema';
using CV_PEND_APPROVAL_SPL_RECOG from '../db/schema';
using CV_PEND_APPROVAL_AVAIL from '../db/schema';
using CV_WORKFLOW_ID from '../db/schema';
using CV_ONETIMEPAY_SUBMISSIONS from '../db/schema';
using CV_AVAILABILITY_SUBMISSIONS from '../db/schema';
using CV_EMPLOYEE_SELECTION from '../db/schema';
using CV_MASS_EMP_SELECTION from '../db/schema';
using CV_COMPANY_CODE from '../db/schema';
using CV_MASS_SEL_COUNTRIES from '../db/schema';
using CV_MASS_SEL_ROLES from '../db/schema';
using CV_USER_SELECTION from '../db/schema';
using CV_FWDUSER_POPULATION from '../db/schema';
using CV_USER_DETAILS from '../db/schema';
using CV_ALL_ACTIVE_EMPLOYEES from '../db/schema';
using CV_ACTIVE_PAYCOMPONENT_TEXT from '../db/schema';
using CV_ONETIMEPAY_ALL_COMMENTS from '../db/schema';
using CV_AVAILABILITY_ALL_COMMENTS from '../db/schema';
using CV_PAYMENTS_COMBINED from '../db/schema';
using CV_AUDIT_LOG from '../db/schema';
using CV_PAYMENTS_COMBINED_FILTERED from '../db/schema';
using CV_PAYMENT_LOGS from '../db/schema';
using CV_AUDIT_LOGS_HR from '../db/schema';
using CV_ONETIMEPAY_LOGS_HR from '../db/schema';
using CV_AVAILABILITY_LOGS_HR from '../db/schema';
using CV_ONETIMEPAY_LOGS from '../db/schema';
using CV_AVAILABILITY_LOGS from '../db/schema';
using CV_AUDIT_LOG_FILTERED from '../db/schema';
using CV_EMAIL_TEXT from '../db/schema';
using CV_HRADMIN_USERS from '../db/schema';
using CV_COUNTRIES from '../db/schema';
using CV_AUDIT_LOGS_V2 from '../db/schema';

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
        action   ADD_REQUESTFLOW(iv_externalCode : String, it_req_flow : array of VP_REQUEST_FLOW)          returns String;
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
    entity Pending_Availability       as projection on CV_PENDPOSTING_AVAILABILITY_PAY;
    entity OneTimePay_HCI             as projection on CV_HCI_ONETIME_PAY;
    entity Availability_HCI           as projection on CV_HCI_AVAILABILITY;
    entity WorkflowConfig             as projection on CV_WF_CONFIG;
    entity OneTimePay                 as projection on CV_ONETIME_PAY;
    entity Availability               as projection on CV_AVAILABILITY;
    entity WageTypesText              as projection on CV_ACTIVE_WAGETYPES;
    entity WageTypes                  as projection on CV_ACTIVE_WAGETYPES_TEXT;
    entity MassWageTypes              as projection on CV_MASS_WAGETYPES;
    entity AllWageTypes               as projection on CV_WAGETYPES;
    entity PendingApproval            as projection on CV_PENDING_APPROVAL;
    entity PendApprovalSplRecog       as projection on CV_PEND_APPROVAL_SPL_RECOG;
    entity PendApprovalAvailability   as projection on CV_PEND_APPROVAL_AVAIL;
    entity WorkflowTemplate           as projection on CV_WORKFLOW_ID;
    entity OneTimePaySubmissions      as projection on CV_ONETIMEPAY_SUBMISSIONS;
    entity OneAvailabilitySubmissions as projection on CV_AVAILABILITY_SUBMISSIONS;
    entity EmployeeSelection          as projection on CV_EMPLOYEE_SELECTION;
    entity MassEmpSelection           as projection on CV_MASS_EMP_SELECTION;
    entity CompanyCode                as projection on CV_COMPANY_CODE;
    entity CountryPicklist            as projection on CV_MASS_SEL_COUNTRIES;
    entity RolePicklist               as projection on CV_MASS_SEL_ROLES;
    entity UserSelection              as projection on CV_USER_SELECTION;
    entity SplAwardUserSelection      as projection on CV_USER_SELECTION;
    entity ForwardUserSelection       as projection on CV_FWDUSER_POPULATION;
    entity UserDetails                as projection on CV_USER_DETAILS;
    entity ActiveEmployees            as projection on CV_ALL_ACTIVE_EMPLOYEES;
    entity PayComponentText           as projection on CV_ACTIVE_PAYCOMPONENT_TEXT;
    entity OneTimePayAll              as projection on CV_ONETIMEPAY_ALL_COMMENTS;
    entity AvailabilityAll            as projection on CV_AVAILABILITY_ALL_COMMENTS;
    entity PaymentLogsAssociation     as projection on CV_PAYMENTS_COMBINED;
    entity AuditLogsFiltered          as projection on CV_AUDIT_LOG;
    entity PaymentLogs                as projection on CV_PAYMENTS_COMBINED_FILTERED;
    entity AllPaymentLogs             as projection on CV_PAYMENT_LOGS;
    entity AllAuditLogs               as projection on CV_AUDIT_LOGS_HR;
    entity OneTimePayAuditLogs        as projection on CV_ONETIMEPAY_LOGS_HR;
    entity OneAvailabilityAuditLogs   as projection on CV_AVAILABILITY_LOGS_HR;
    entity OneTimePayLogs             as projection on CV_ONETIMEPAY_LOGS;
    entity AvailabilityLogs           as projection on CV_AVAILABILITY_LOGS;
    entity LogsF                      as projection on CV_AUDIT_LOG_FILTERED;
    entity EmailText                  as projection on CV_EMAIL_TEXT;
    entity HRAdminUsers               as projection on CV_HRADMIN_USERS;
    entity Countries                  as projection on CV_COUNTRIES;
    entity AllAuditLogs_V2            as projection on CV_AUDIT_LOGS_V2;
    entity UOM_TEXT                   as projection on vp.VP_UOM_TEXT; //with JS service
    entity UOM                        as projection on vp.VP_UOM; //missing navigation to UOM_TXT
/*    association "VP_UOM_TEXT"
   principal "UOM"("uom_EC") multiplicity "1"
   dependent "UOM_TEXT"("uom_EC") multiplicity "*";

   entity EmailTemplate as projection on vp.VP_EMAIL_TEMPLATES{
       mappingID: EmailParamConfig;
   }

   entity EmailParamConfig as projection on vp.VP_EMAIL_PARAMETERS_CONFIG;

   entity EmailParams as projection on vp.VP_MAP_EMAIL_PARAMETERS;
   */
/* 	association "EmailAssociation"
    principal "EmailTemplate"("mappingID.id") multiplicity "1"
    dependent "EmailParams"("id") multiplicity "*";
    "com.solvay.varpay.db::Table.VP_EMAIL_TEMPLATES" as "EmailTemplate"
         navigates ("EmailAssociation" as "EmailMapping"); */
}
