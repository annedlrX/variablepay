using com.strada as vp from '../db/schema';
using CV_WORKFLOW_ID from '../db/schema';
using CV_USER_DETAILS from '../db/schema';

service ProxyService {

    //================================================
    //      XSODATA Services
    //================================================

    entity VP_EMAIL_TEMPLATES      as projection on vp.VP_EMAIL_TEMPLATES;
    entity VP_MAP_EMAIL_PARAMETERS as projection on vp.VP_MAP_EMAIL_PARAMETERS;
    entity VP_USER                 as projection on vp.VP_USER;
    entity WorkflowTemplate        as projection on CV_WORKFLOW_ID;
    entity USERDETAILS             as projection on CV_USER_DETAILS;

    @open
    type object {};

    //================================================
    //      Functions JAVA
    //================================================

    function User()                                      returns String;
    function OneTimePayHANA(results : array of object)   returns String;
    function AvailabilityHANA(results : array of object) returns String;
    function LoggedInUser()                              returns String;
    function UOM()                                       returns String;
    function Currency()                                  returns String;
    function AltCostCenter()                             returns String;
    function FOCompany()                                 returns String;
    function PayGroup()                                  returns String;
    function RolePicklist()                              returns String;
    function MassWTList(reqType : String)                returns String;
    function EGP()                                       returns String;
    function EmpSelection()                              returns String;
    function ApprovalCount()                             returns String;
    function isHRAdmin()                                 returns Boolean;
    function isExpat()                                   returns Boolean;
    function EmpSelection2004()                          returns Boolean;
    function ApprovalService()                           returns String;
    function AdminService()                              returns String;


}
