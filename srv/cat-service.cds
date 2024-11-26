using com.strada as vp from '../db/schema';
using CV_WAGETYPES from  '../db/schema';

service CatalogService {
    @readonly 
    entity Books as projection on vp.Books;

    @readonly 
    entity VP_WAGETYPE as projection on vp.VP_WAGETYPE;

    @readonly
    entity CV_Wagetypes as projection on CV_WAGETYPES;

//XSODATA Services    

    entity VP_COUNTRIES as projection on vp.VP_COUNTRIES;

    entity RBPGroup as projection on vp.VP_RBP_GROUPS;

    entity RBPEmployees as projection on vp.VP_RBP_EMPLOYEES;

    entity User as projection on vp.VP_USER; //with JS service

    entity EmpJob as projection on vp.VP_EMPJOB; //with JS service

// CV Views       

//TODO
    entity UOM_TEXT as projection on vp.VP_UOM_TEXT; //with JS service
    entity UOM as projection on vp.VP_UOM; //missing navigation to UOM_TXT
 /*    association "VP_UOM_TEXT" 
    principal "UOM"("uom_EC") multiplicity "1"
    dependent "UOM_TEXT"("uom_EC") multiplicity "*"; */

    entity EmailTemplate as projection on vp.VP_EMAIL_TEMPLATES;
    entity EmailParams as projection on vp.VP_MAP_EMAIL_PARAMETERS;
/* 	association "EmailAssociation" 
    principal "EmailTemplate"("mappingID.id") multiplicity "1"
    dependent "EmailParams"("id") multiplicity "*"; 
    "com.solvay.varpay.db::Table.VP_EMAIL_TEMPLATES" as "EmailTemplate"
         navigates ("EmailAssociation" as "EmailMapping"); */


   

}



