using com.strada as vp from '../db/schema';
using CV_WAGETYPES from  '../db/schema';

service CatalogService {
    @readonly 
    entity Books as projection on vp.Books;

    @readonly 
    entity VP_WAGETYPE as projection on vp.VP_WAGETYPE;

    @readonly
    entity CV_Wagetypes as projection on CV_WAGETYPES;
}
