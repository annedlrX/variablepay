using com.strada as vp from '../db/schema';
using CV_ONETIMEPAY_ALL_COMMENTS from '../db/schema';
using CV_USER_DETAILS from '../db/schema';

service ProcessService {

    //================================================
    //      XSODATA Services
    //================================================

    entity VP_EMAIL_TEMPLATES         as projection on vp.VP_EMAIL_TEMPLATES;
    entity VP_MAP_EMAIL_PARAMETERS    as projection on vp.VP_MAP_EMAIL_PARAMETERS;
    entity ONETIMEPAYALL              as projection on CV_ONETIMEPAY_ALL_COMMENTS;
    entity USERDETAILS                as projection on CV_USER_DETAILS;

    @open
    type object {};

    //================================================
    //      Funcitons JAVA
    //================================================
    function uploadEmpJobCPI(body : String)              returns String;
    function UsersByGrantedGroup(groupID : String)       returns String;
    function RBPEmployee(role : String)                  returns String;
    function RBPGroup(role : String)                     returns String;
    function saveAvailability(results : array of object) returns String;
    function HANAGroup()                                 returns String;
    function SCPINotif(body: String)                     returns String;



}
