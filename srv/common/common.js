const axios = require('axios'); // Use Axios if you're dealing with HTTP requests

// Function to format a date string into an ISO string
function loggedInUser(req) {
    //const loggedInUser = req.user.id;
    //const loggedInUser = '50096087';
    //const loggedInUser = '59000050'; //expat
    const loggedInUser = '50016115'; //approver
    return loggedInUser;
}

async function getApprovalService(){
    const approvalURL = 'https://varpay-approval.com';
    return approvalURL;
}

/**
* Maps a role to its corresponding role value.
* @param {string} role - The role to map.
* @returns {string} The corresponding role value.
*/
function setRoleValue(role) {
    let roleValue = '';
    switch (role) {
        case "HRADMIN"://ConstantManager.HRAdmin:
            roleValue = '1';
            break;
        case "HRSITE": //ConstantManager.HRSite:
            roleValue = '2';
            break;
        case "HRSITEDEPUTY"://ConstantManager.SiteDeputy:
            roleValue = '3';
            break;
        case "HRGBU"://ConstantManager.HRGBU:
            roleValue = '4';
            break;
        case "HRGBUDEPUTY": //ConstantManager.SiteGBU:
            roleValue = '5';
            break;
        case "MANAGER"://ConstantManager.MGR:
            roleValue = '6';
            break;
        case "TIMKP"://ConstantManager.TIMKP:
            roleValue = '7';
            break;
        case "EMPLOYEE"://ConstantManager.EMP:
            roleValue = '8';
            break;
    }
    return roleValue;
 }
 /**
 * Maps a role value to its corresponding role name.
 * @param {string} roleId - The role value to map.
 * @returns {string} The corresponding role name.
 */
 function getRoleName(roleId) {
    let roleName = '';
    switch (roleId) {
        case '1':
            roleName = "HRADMIN";//ConstantManager.HRAdmin;
            break;
        case '2':
            roleName = "HRSITE";//ConstantManager.HRSite;
            break;
        case '3':
            roleName = "HRSITEDEPUTY";//ConstantManager.SiteDeputy;
            break;
        case '4':
            roleName = "HRGBU";//ConstantManager.HRGBU;
            break;
        case '5':
            roleName = "HRGBUDEPUTY";//ConstantManager.SiteGBU;
            break;
        case '6':
            roleName = "MANAGER";//ConstantManager.MGR;
            break;
        case '7':
            roleName = "TIMKP";//ConstantManager.TIMKP;
            break;
        case '8':
            roleName = "EMPLOYEE";//ConstantManager.EMP;
            break;
    }
    return roleName;
 }

module.exports = {
    loggedInUser,
    getApprovalService,
    setRoleValue,
    getRoleName
};