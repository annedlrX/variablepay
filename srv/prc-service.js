const cds = require('@sap/cds');
const { formatTime, formatDate, splitCSV, retry, formatDateNotif } = require('./helper/formatter');
const { constantManager } = require('./helper/constantManager');
const { mapEmailBody,
    sendNotif,
    getEmailTemplate,
    getUserDetail,
    getCurrentUser,
    processWorkflow,
    sendEmailPayload,
    getWorkflowTemplate,
    saveOneTimePay,
    sendEmailNotif,
    sendReject,
    sendCompletion } = require('./common/functionsHANA');


module.exports = cds.service.impl(async (srv) => {

    const { ONETIMEPAYALL } = srv.entities;
    const { VP_EMAIL_TEMPLATES } = srv.entities;
    const { USERDETAILS } = srv.entities;
    const { VP_MAP_EMAIL_PARAMETERS } = srv.entities;
    

    const service = await cds.connect.to('PLTRoleBasedPermissions');

    srv.on('READ', 'DynamicGroup', async req => {
        console.log('>>>> Passing request to remote system...');
        //return service.run(req.query.);

        return service.tx(req).send({
            query: req.query
        });
    })

    /**
     *      START RBPEmployee
     */

    srv.on('RBPEmployee', async req => {
        const role = req.data.role;

        let groupName = '';
        // Determine the group name based on role
        switch (role) {
            case 'HRSITE':
            case 'HRADMIN':
                groupName = "CS - HR Country %Target%";
                break;
            default:
                return req.error(400, 'Invalid role');
        }

        try {
            const dynamicGroups = await fetchDynamicGroups([groupName], req);

            if (!dynamicGroups || dynamicGroups.length === 0) {
                return req.error(500, 'Failed to fetch RBPEmployee dynamic groups');
            }

            // Start a transaction here
            const tx = await cds.tx(req);

            try {
                await collectTargetUsers(dynamicGroups, req, tx);
                await tx.commit();  // Commit the transaction if everything goes fine
                return { message: 'RBP Employees processed successfully' };
            } catch (error) {
                await tx.rollback();  // Rollback the transaction if anything goes wrong
                return req.error(500, `Error processing RBP Employees: ${error.message}`);
            }
        } catch (error) {
            return req.error(500, `Error fetching dynamic users: ${error.message}`);
        }


    });

    // Process granted groups
    async function collectTargetUsers(groups, req, tx) {
        try {
            // Iterate over groups and process them concurrently
            const groupProcessingPromises = groups.map(async (group) => {
                if (group.totalMemberCount > 0) {
                    console.log(`Processing group ${group.groupID} with ${group.totalMemberCount} members`);

                    try {
                        // Fetch granted group users
                        const grantedUsersPayload = await fetchGrantedGroupUsers(group.groupID, req);

                        // Process granted users if any are returned
                        if (grantedUsersPayload.length > 0) {
                            console.log(
                                `Processing collectTargetUsers ${grantedUsersPayload.length} users for group: ${group.groupID}`
                            );

                            // Call `parseUserPayload` for processing; it handles its own transaction
                            await parseUserPayload(group.groupID, grantedUsersPayload, req, tx);
                        } else {
                            console.log(`No granted users found for group: ${group.groupID}`);
                        }
                    } catch (groupError) {
                        console.log(`Error collectTargetUsers processing group ${group.groupName}: ${groupError.message}`);
                    }
                }
            });

            // Wait for all groups to be processed
            await Promise.all(groupProcessingPromises);
            console.log('Finished processing all granted collectTargetUsers groups');
        } catch (error) {
            console.log(`Error in collectTargetUsers processGrantedGroup: ${error.message}`);
        }
    }

    async function parseUserPayload(groupId, payload, req, tx) {
        try {
            const ecArray = payload || []; // Parsing the EC payload (similar to JSONObject in Java)

            // Fetch data from HANA using a simulated function (replace with actual database call)
            const hanaArray = await getRBPEmployeeById(groupId, req);

            // Create Users
            const newUsers = await createUsers(hanaArray, ecArray, groupId);
            if (newUsers.length > 0) {
                await createRBPEmployees(newUsers, tx);
            }

            // Delete Users
            const delUsers = await deleteUsers(hanaArray, ecArray);
            if (delUsers.length > 0) {
                await deleteRBPEmployees(delUsers, tx);
            }

        } catch (error) {
            console.log('Error in parsing user payload:', error);
        }
    }

    // Fetch RBP Employees by group ID
    async function getRBPEmployeeById(groupId, req) {
        if (!groupId) throw new Error('Group ID cannot be empty');

        const tx = await cds.tx(req);

        try {
            // Retry logic applied to the DB query
            const result = await retry(async () => {
                return await tx.run(SELECT.from("COM_STRADA_VP_RBP_EMPLOYEES").where({ id_groupID: groupId }));
            });
            const hanaObject = { d: { results: result || [] } };  // Simulate the structure of the expected JSON object

            const hanaArray = hanaObject.d?.results || [];  // Ensure we return an empty array if no results

            return hanaArray;
        } catch (error) {
            console.log('Error fetching  getRBPEmployeeById:', error.message);
            return [];
            //throw new Error(`Error fetching Hana groups: ${error.message}`);
        }
    }

    // Create records for Hana RBPEmployees
    async function createRBPEmployees(newRecords, tx) {
        let payload;
        try {
            // Insert all records
            for (const row of newRecords) {
                payload = row;
                await tx.run(`
                    INSERT INTO "COM_STRADA_VP_RBP_EMPLOYEES"("ID_GROUPID","USERID")
                    VALUES (?, ?)`, [
                    row.id_groupID, row.userID
                ]);
            }

            // Once all operations are completed, commit the transaction
            console.log('RBP Employees saved successfully.');
        } catch (error) {
            // Rollback transaction in case of an error
            console.log('Error saving RBP Employees details:', error.message + ' Row: ' + JSON.stringify(payload));
            throw new Error(`Error saving RBP Employees details: ${error.message}` + ' Row: ' + JSON.stringify(payload));
        }
    }

    // Delete RBPEmployees
    // Delete records from Hana based on groupID and userID
    async function deleteRBPEmployees(delRecords, req) {
        const tx = await cds.tx(req);  // Start a transaction

        try {
            // Iterate over the records to delete from VP_RBP_GROUPS
            await Promise.all(delRecords.map(async (row) => {
                await tx.run(`
                    DELETE FROM "COM_STRADA_VP_RBP_EMPLOYEES"
                    WHERE "ID_GROUPID" = ? AND "USERID" = ?`, [
                    row.groupID_id,  // Bind groupID for deletion
                    row.userID,   // Bind userID for deletion
                ]);
            }));

            // Commit the transaction after all deletions
            await tx.commit();
            console.log('RBP Employees records deleted successfully.');
        } catch (error) {
            // If an error occurs, rollback the transaction
            await tx.rollback();
            console.log('Error deleting RBP Employees details:', error.message);
            throw new Error(`Error deleting RBP Employees details: ${error.message}`);
        }
    }

    // Create records for Hana database
    function createUsers(hanaArray, ecArray, groupId) {
        const targetUsers = [];
        if (ecArray.length !== 0) {
            for (let i = 0; i < ecArray.length; i++) {
                const ecUser = ecArray[i];
                const userId = ecUser.userId || '';

                // Check if the user already exists in Hana array
                const userExist = hanaArray.some(hanaUser => hanaUser.userID === userId);

                if (!userExist) {
                    const newUser = {
                        "id_groupID": groupId,
                        "userID": userId
                    };
                    targetUsers.push(newUser);
                }
            }
        }
        return targetUsers;
    }

    // Delete records for Hana database
    function deleteUsers(hanaArray, ecArray) {
        const targetUsers = [];
        if (hanaArray.length !== 0) {
            for (let i = 0; i < hanaArray.length; i++) {
                const hanaUser = hanaArray[i];
                const userId = hanaUser.userID || '';

                // Check if the user exists in EC array
                const userExist = ecArray.some(ecUser => ecUser.userId === userId);

                if (!userExist) {
                    targetUsers.push(hanaUser);
                }
            }
        }
        return targetUsers;
    }

    /**
 *      END RBPEmployee
 */

    /**
     *      START RBPGroup
     */

    // Main RBP Group Handler
    srv.on('RBPGroup', async req => {
        const role = req.data.role;

        let groupName = '';
        let groupRole = '';

        ({ groupName, groupRole } = getGroupDetails(role));

        if (!groupName || !groupRole) {
            return req.error(400, 'Invalid role');
        }

        try {
            const dynamicGroups = await fetchDynamicGroups([groupName], req);

            if (!dynamicGroups || dynamicGroups.length === 0) {
                return req.error(500, 'Failed to fetch dynamic groups');
            }

            // Start a transaction here
            const tx = await cds.tx(req);

            try {
                await processGrantedGroup(dynamicGroups, groupRole, req, tx);
                await cleanRBPGroup();
                await tx.commit();  // Commit the transaction if everything goes fine
                return { message: 'RBP Groups processed successfully' };
            } catch (error) {
                await tx.rollback();  // Rollback the transaction if anything goes wrong
                return req.error(500, `Error processing RBP Groups: ${error.message}`);
            }
        } catch (error) {
            return req.error(500, `Error fetching dynamic groups: ${error.message}`);
        }
    });

    // Helper function to get group name and role based on input role
    function getGroupDetails(role) {
        const groupMapping = {
            'HRSITE': { groupName: 'CS - HR Site %Granted%AUTOMATIC%', groupRole: 'HRSITE' },
            'HRADMIN': { groupName: 'CS - HR Payroll %Granted%AUTOMATIC%', groupRole: 'HRADMIN' },
        };
        return groupMapping[role] || {};
    }

    // Fetch dynamic groups
    async function fetchDynamicGroups([groupName], req) {
        const encodedGroupName = encodeURIComponent(groupName);
        console.log(`Fetching dynamic groups for: ${encodedGroupName}`);

        try {
            const response = await service.tx(req).send({
                method: 'GET',
                path: `DynamicGroup?$filter=groupName%20like%20'${encodedGroupName}'%20and%20groupType%20eq%20'permission'&$format=json`
            });

            return response || []; // Return dynamic groups data or empty array if not found
        } catch (error) {
            console.log('Error fetching dynamic groups:', error.message);
            throw new Error('Error fetching dynamic groups', error.message);
        }
    }

    // Process granted groups
    async function processGrantedGroup(groups, groupRole, req, tx) {
        try {
            // Iterate over groups and process them concurrently
            const groupProcessingPromises = groups.map(async (group) => {
                if (group.totalMemberCount > 0) {
                    console.log(`Processing group ${group.groupID} with ${group.totalMemberCount} members`);

                    try {
                        // Ensure `getTargetGroupId` resolves properly
                        const groupIds = await getTargetGroupId(group.groupName, groupRole, req);

                        if (!groupIds || !groupIds.groupID) {
                            console.log(`Target groupId not found for: ${group.groupName}`);
                            return; // Skip processing for this group
                        }

                        // Fetch granted group users
                        const grantedUsersPayload = await fetchGrantedGroupUsers(group.groupID, req);

                        // Process granted users if any are returned
                        if (grantedUsersPayload.length > 0) {
                            console.log(
                                `Processing ${grantedUsersPayload.length} users for group: ${groupIds.groupID}`
                            );

                            // Call `parsePayload` for processing; it handles its own transaction
                            await parsePayload(groupIds.groupID, group.groupName, grantedUsersPayload, groupRole, req, tx);
                        } else {
                            console.log(`No granted users found for group: ${groupIds.groupID}`);
                        }
                    } catch (groupError) {
                        console.log(`Error processing group ${group.groupName}: ${groupError.message}`);
                    }
                }
            });

            // Wait for all groups to be processed
            await Promise.all(groupProcessingPromises);
            console.log('Finished processing all granted groups');
        } catch (error) {
            console.log(`Error in processGrantedGroup: ${error.message}`);
        }
    }

    // Fetch granted group users
    async function fetchGrantedGroupUsers(grantedGroupID, req) {
        console.log(`Fetching users for granted group: ${grantedGroupID}`);
        try {
            const response = await service.tx(req).send({
                method: 'GET',
                path: `getUsersByDynamicGroup?groupId=${grantedGroupID}L&activeOnly=true&$format=json`
            });

            return response || []; // Return granted users data or empty array if not found
        } catch (error) {
            console.log('Error fetching granted group users:', error.message);
            throw new Error('Error fetching granted group users');
        }
    }

    // Parse and create records for Hana database
    async function parsePayload(groupId, groupName, payload, groupRole, req, tx) {
        const ecArray = payload || [];
        const hanaArray = await fetchHanaGroupsById(groupId, req);

        const newRecords = createRecords(hanaArray, ecArray, groupId, groupName, groupRole);
        if (newRecords.length > 0) {
            await createHanaGroups(newRecords, tx);
        }

        const delRecords = deleteRecords(hanaArray, ecArray, groupId, groupRole);
        if (delRecords.length > 0) {
            await deleteHanaGroups(delRecords, tx);
        }
    }

    // Fetch Hana groups by group ID
    async function fetchHanaGroupsById(groupId, req) {
        if (!groupId) throw new Error('Group ID cannot be empty');

        const tx = await cds.tx(req);

        try {
            // Retry logic applied to the DB query
            const result = await retry(async () => {
                return await tx.run(SELECT.from("COM_STRADA_VP_RBP_GROUPS").where({ groupID: groupId }));
            });
            const hanaObject = { d: { results: result || [] } };  // Simulate the structure of the expected JSON object

            const hanaArray = hanaObject.d?.results || [];  // Ensure we return an empty array if no results

            return hanaArray;
        } catch (error) {
            console.log('Error fetching Hana groups:', error.message);
            return [];
            //throw new Error(`Error fetching Hana groups: ${error.message}`);
        }
    }

    // Create records for Hana
    async function createHanaGroups(newRecords, tx) {
        let payload;
        try {
            // Insert all records
            for (const row of newRecords) {
                payload = row;
                await tx.run(`
                INSERT INTO "COM_STRADA_VP_RBP_GROUPS"("GROUPID", "GROUPNAME", "USERID", "TODAY", "NEXT", "ROLE")
                VALUES (?, ?, ?, ?, ?, ?)`, [
                    row.groupID, row.groupName, row.userID, row.today, row.next, row.role
                ]);
            }

            // Once all operations are completed, commit the transaction
            console.log('RBP Group details saved successfully.');
        } catch (error) {
            // Rollback transaction in case of an error
            console.log('Error saving RBP Group details:', error.message + ' Row: ' + JSON.stringify(payload));
            throw new Error(`Error saving RBP Group details: ${error.message}` + ' Row: ' + JSON.stringify(payload));
        }
    }

    // Delete Hana groups
    // Delete records from Hana based on groupID and userID
    async function deleteHanaGroups(delRecords, req) {
        const tx = await cds.tx(req);  // Start a transaction

        try {
            // Iterate over the records to delete from VP_RBP_GROUPS
            await Promise.all(delRecords.map(async (row) => {
                await tx.run(`
                DELETE FROM "COM_STRADA_VP_RBP_GROUPS"
                WHERE "GROUPID" = ? AND "USERID" = ?`, [
                    row.groupID,  // Bind groupID for deletion
                    row.userID,   // Bind userID for deletion
                ]);
            }));

            // Commit the transaction after all deletions
            await tx.commit();
            console.log('RBP Group records deleted successfully.');
        } catch (error) {
            // If an error occurs, rollback the transaction
            await tx.rollback();
            console.log('Error deleting RBP Group details:', error.message);
            throw new Error(`Error deleting RBP Group details: ${error.message}`);
        }
    }

    // Create records for Hana database
    function createRecords(hanaArray, ecArray, groupId, groupName, groupRole) {
        const createGroup = [];

        if (ecArray.length !== 0) {
            for (const ecUser of ecArray) {
                const user = ecUser.userId;
                let userExist = false;

                // Check if the user exists in hanaArray with the given role
                for (const hanaUser of hanaArray) {
                    if (hanaUser.USERID == user && hanaUser.ROLE == groupRole) {
                        userExist = true;
                        break;
                    }
                }

                // If the user doesn't exist, create the new group record
                if (!userExist) {
                    const group = {
                        groupID: groupId,
                        groupName: groupName,
                        userID: user,
                        today: 0,
                        next: 1,
                        role: groupRole,
                    };
                    createGroup.push(group);
                }
            }
        }

        return createGroup;
    }

    // Delete records for Hana database
    function deleteRecords(hanaArray, ecArray, groupId, groupRole) {
        const targetUsers = [];

        // Check if hanaArray is not empty
        if (hanaArray.length !== 0) {
            for (const hanaUser of hanaArray) {
                if (hanaUser.role == groupRole) {
                    const user = hanaUser.USERID || ''; // Handle missing userID

                    // Check if the user exists in ecArray
                    let userExist = false;
                    for (const ecUser of ecArray) {
                        const ecuser = ecUser.userId || ''; // Handle missing userId
                        if (ecuser == user) {
                            userExist = true;
                            break;
                        }
                    }

                    // If user doesn't exist in ecArray, add to targetUsers
                    if (!userExist) {
                        targetUsers.push(hanaUser);
                    }
                }
            }
        }

        return targetUsers;
    }

    // Clean obsolete RBP groups
    async function cleanRBPGroup() {
        console.log('Cleaning up obsolete groups...');
        // Perform cleanup logic (could be more complex in real scenarios)
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Finished cleaning up obsolete groups');
    }

    // Get target group ID
    async function getTargetGroupId(groupName, groupRole, req) {
        console.log(`Getting target group ID for: ${groupName}`);

        // Step 1: Replace "Granted" with "Target"
        let targetName = groupName.replace('Granted', 'Target');

        // Step 2: Trim anything after "(" and trailing whitespaces
        targetName = targetName.split(/\(/)[0].trim();

        // Step 3: Handle ECO/SCO specific replacements
        if (targetName.includes('ECO') || targetName.includes('SCO')) {
            targetName = targetName.replace('SOLVAY - ECO', 'ECO')
                .replace('SOLVAY - SCO', 'SCO');
        }

        // Step 4: Apply role-specific transformations
        if (groupRole === 'HRSITE') {
            targetName = targetName.replace('Site', 'Country');
        } else if (groupRole === 'HRADMIN') {
            targetName = targetName.replace('Payroll', 'Country');
        }

        // Step 5: Replace dashes with "%"
        targetName = targetName.replace(/–/g, '%');

        // Final logging
        console.log(`**FINAL TARGET NAME**: ${targetName}`);

        return await fetchTargetGroupId(targetName, req);
    }

    // Fetch target group ID based on name
    async function fetchTargetGroupId(targetName, req) {
        const encodedGroupName = encodeURIComponent(targetName);
        console.log(`fetchTargetGroupId encodedGroupName: '${encodedGroupName}'`);
        try {
            const response = await service.tx(req).send({
                method: 'GET',
                path: `DynamicGroup?$filter=groupName%20like%20'${encodedGroupName}'%20and%20groupType%20eq%20'permission'&$format=json`
            });

            return response[0] || null; // Return the first target group or null if not found
        } catch (error) {
            console.log('Error fetching target group:', error.message);
            throw new Error(`Error fetching target group: ${error.message}`);
        }
    }

    /**
     *      END RBPGroup 
     */

    /**
     *      Start SCPINotif 
     */
    // POST endpoint for receiving the SCPI notifications
    srv.on('SCPINotif', async (req) => {
        const payloadStr = req.data.body;
        console.log("LOG: SCPI payload: ", payloadStr);

        // Split the payload by '|' as in the Java code
        const payloadArr = payloadStr.split('|');

        // Start a transaction here
        const tx = await cds.tx(req);

        // Create an array of promises for parallel execution
        const promises = payloadArr.map(async (item) => {
            const objectArr = item.split(';');
            if (objectArr[2] === "POSTED") {
                await processCompletionNotif(objectArr[0], objectArr[1], tx);
            }
        });

        // Execute all promises asynchronously
        await Promise.all(promises);
        return { status: 'success' };
    });

    // Function to process each notification in a separate "thread" (simulated with async/await)
    async function processCompletionNotif(jsonExternalCode, reqType, tx) {
        try {
            // Simulate fetching data from the Hana DB or external system
            const record = await fetchRecordFromHana(jsonExternalCode, reqType, tx);

            // Parse the record
            if (record.length > 0) {
                const jsonPayload = record[0];
                const workflow_id = jsonPayload.WORKFLOW_ID;

                if (workflow_id) {
                    /*let payloadData = null;
                    if (reqType === 'IT15') {
                        payloadData = await buildIT15Payload(jsonPayload);
                    } else if (reqType === 'IT2004') {
                        payloadData = await buildIT2004Payload(jsonPayload);
                    } else {
                        payloadData = await buildIT14Payload(jsonPayload);
                    }*/

                    // Send email notification
                    await sendEmailNotif(jsonPayload, tx);
                }
            } else {
                console.log("LOG: CompletionNotifThread payload not found for:", jsonExternalCode);
            }

        } catch (error) {
            console.log("Error processing completion notification:", error);
        }
    }

    // Simulated function to fetch record from Hana (replace with actual logic)
    async function fetchRecordFromHana(externalCode, reqType, tx) {
        try {
            const response = await tx.run(
                SELECT.from(ONETIMEPAYALL).where({
                    CUST_EXTERNALCODE: externalCode,
                    REQUESTTYPE: reqType
                })
            );

            return response; // Assuming the structure has 'd' and 'results'
        } catch (error) {
            console.log('Error fetching data from Hana:', error);
            throw error;
        }
    }


    // Function to send email notifications (replaces JavaMail functionality)
    async function sendEmailNotif(obj, tx) {
        try {
            if (obj) {
                const workflow_id = obj.WORKFLOW_ID;
                const initiatorLanguage = obj.INITIATORLANGUAGE;
                const reqType = obj.REQUESTTYPE;

                let emailId = "";
                let templateArray;

                console.log(`LOG: workflow_id: ${workflow_id}, initiatorLanguage: ${initiatorLanguage}, reqType: ${reqType}`);

                switch (workflow_id) {
                    case 'WF1':
                    case 'WF3':
                        // completion notification - initiator
                        emailId = 'E3';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendCompletion(templateArray, obj, USERDETAILS, tx);
                        break;

                    case 'WF2':
                    case 'WF_AUTO':
                        // completion notification - initiator
                        emailId = 'E3';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendCompletion(templateArray, obj, USERDETAILS, tx);

                        // notify notification agent
                        emailId = 'E2';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendNotif(templateArray, obj, "", USERDETAILS, tx);
                        break;

                    case 'WF4':
                        // notify notification agent
                        emailId = 'E2';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendNotif(templateArray, obj, "", USERDETAILS, tx);
                        break;

                    case 'WF5':
                    case 'WF6':
                        // notify notification agent
                        emailId = 'E7';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendNotif(templateArray, obj, "", USERDETAILS, tx);
                        break;

                    case 'WF7':
                        // notify notification agent
                        emailId = 'E8';
                        templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, tx);
                        await sendNotif(templateArray, obj, "", USERDETAILS, tx);
                        break;

                    default:
                        console.log(`No matching workflow_id found: ${workflow_id}`);
                }
            }
        } catch (error) {
            console.log('Error in sendEmailNotif function:', error);
            throw error; // Handle or throw the error as needed
        }
    }

   

    

    /**
     *      END SCPINotif 
     */
})

