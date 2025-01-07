const axios = require('axios'); // Use Axios if you're dealing with HTTP requests
const { formatTime, formatDate, splitCSV, retry, formatDateNotif } = require('../helper/formatter');

async function getHanaAgentsByRole(userId, role, country, entity, tx) {
    let agents = null;

    try {

        const user = await getUser(userId, entity, tx);

        // Process the response based on the role
        if (role === 'HRSITE') {
            agents = user.CUSTOMMANAGER;

        } else if (role === 'HRGBU') {
            agents = user.HR;

        } else if (role === 'HRADMIN') {
            const country = user.COUNTRY;

            // Fetch HR Admin by country
            agents = await getHRAdmins(country, tx);
        } else if (role === 'MANAGER') {
            agents = user.MANAGER;
        } else if (role === 'EMPLOYEE') {
            agents = userId;  // For employees, return the userId as the agent
        }
    } catch (error) {
        console.log('Error retrieving agents:', error);
        throw new error('Error retrieving agent based on role', error);
    }

    return agents;
}



// Helper function to simulate fetching user details
async function getUser(userId, entity, tx) {
    try {
        const response = await tx.run(
            SELECT.from(entity).where({
                USERID: userId
            })
        );


        if (response.length > 0) {
            const obj = response[0];
            return obj;
        }

        return null;
    } catch (error) {
        console.log('Error fetching data from getUser:', error);
        throw error;
    }
}

// Helper function to simulate fetching getHRAdmins details
async function getHRAdmins(country, tx) {
    try {

        const query = `
            SELECT "USERID" FROM 
            (
                SELECT IFNULL(B."ID", '') AS "ID", A."USERID" 
                FROM 
                (
                    SELECT 
                        SUBSTR_REGEXPR('(?<=\- HR Payroll )(.*?)(?=\ [–-] Granted)' IN "GROUPNAME") AS "NAME1",
                        SUBSTR_REGEXPR('(?<=\- HR Payroll - )(.*?)(?=\ [–-] Granted)' IN "GROUPNAME") AS "NAME2",
                        "USERID" 
                    FROM "COM_STRADA_VP_RBP_GROUPS" 
                    WHERE "ROLE" = 'HRADMIN'
                ) A
                LEFT OUTER JOIN "COM_STRADA_VP_COUNTRIES" AS B
                ON A."NAME1" = B."NAME" OR A."NAME2" = B."NAME"
            )
            WHERE "ID" = $1
        `;

        // Run the query with the provided country parameter
        const result = await tx.run(query, [country]);

        // Return the result
        return result.map(row => row.USERID).join(';');

    } catch (error) {
        console.log('Error fetching data from getHRAdmins:', error);
        throw error;
    }
}

// Helper function to simulate fetching user details
async function getCurrentUser(userId, entity, tx) {
    try {
        const response = await tx.run(
            SELECT.from(entity).where({
                userID: userId
            })
        );


        if (response.length > 0) {
            const obj = response[0];
            return obj;
        }

        return null;
    } catch (error) {
        console.log('Error fetching data from getCurrentUser:', error);
        throw error;
    }
}

async function processWorkflow(payload, workflowResponse, decision, requestType, userDetails, entity, tx) {

    let currentUser = userDetails.userID;
    try {
        let wfSequence = workflowResponse;
        let currentSequence = null;
        let currentIdx = 0;
        if (!payload.cust_externalCode) {
            currentSequence = wfSequence[currentIdx];
            payload.cust_eventReason = "SOL_VarPay";//ConstantManager.ecEventReason;
            payload.createdBy = currentUser;
            payload.createdByUser = `${userDetails.firstName} ${userDetails.lastName}`;
            payload.initiatorLanguage = userDetails.defaultLocale;
            payload.reqrequestType = requestType;
            if (requestType === 'IT14') {
                payload.cust_frequency = "ANN";//ConstantManager.ecFrequency;
            }
            payload.reqworkflow_id = currentSequence.WORKFLOW_ID;
        } else {
            currentIdx = parseInt(payload.reqworkflowSequence, 10);
            for (let sequence of wfSequence) {
                if (sequence.SEQUENCE === currentIdx) {
                    currentSequence = sequence;
                    break;
                }
            }
        }
        payload.reqchangedBy = currentUser;
        payload.reqcreatedOn = '';
        payload.reqchangedByUser = `${userDetails.firstName} ${userDetails.lastName}`;
        if (currentSequence.TRIGGERWORKFLOW === 1 && currentSequence.MAXFORWARDS === 0) {
            payload.autoApproved = "0"; //ConstantManager.notAutoApproved;
            if (currentSequence.TRIGGEREMAILNOTIFICATION === 1) {
                payload.reqnotificationAgent = currentSequence.NOTIFICATIONAGENT_ROLE;
            }
            switch (currentSequence.WORKFLOW_ID) {
                case 'WF1':
                    if (decision === "APPROVED") {
                        let oldVal = payload.reqworkflowSequence;
                        if (wfSequence.length > currentIdx) {
                            currentSequence = wfSequence[currentIdx];
                            payload = await setApprovers(currentSequence, wfSequence, payload, "APPROVED", entity, tx);
                            if (currentSequence.SEQUENCE > 1 && oldVal === payload.reqworkflowSequence) {
                                payload.reqstatus = "3"; //ConstantManager.statForPosting;
                                payload.status = "3"; //ConstantManager.statForPosting;
                            }
                        } else {
                            payload.reqstatus = "3"; //ConstantManager.statForPosting;
                            payload.status = "3"; //ConstantManager.statForPosting;
                        }
                    }
                    break;
                case 'WF2':
                case 'WF3':
                case 'WF6':
                    if (decision === "APPROVED") {
                        payload.reqstatus = "3"; //ConstantManager.statForPosting;
                        payload.status = "3"; //ConstantManager.statForPosting;
                    }
                    break;
                case 'WF4':
                    payload.autoApproved = "1";//ConstantManager.autoApproved;
                    payload.reqstatus = "3"; //ConstantManager.statForPosting;
                    payload.status = "3"; //ConstantManager.statForPosting;
                    break;
            }
            if (decision === "REJECTED") {
                payload.reqstatus = "5";//ConstantManager.statRejected;
                payload.status = "5";//ConstantManager.statRejected;
            } else if (decision !== "APPROVED") {
                if (!payload.cust_currencyCode) {
                    console.error('cust_currencyCode is NULL');
                    payload.cust_currencyCode = '';
                }
                payload = await setApprovers(currentSequence, wfSequence, payload, '', entity, tx);
                payload.reqrequestType = requestType;
                payload.reqworkflowSequence = '1';
                if (currentSequence.WORKFLOW_ID !== "WF4") {
                    payload.autoApproved = "0";//ConstantManager.notAutoApproved;
                    payload.reqstatus = "1";//ConstantManager.statForApproval;
                    payload.status = "1";//ConstantManager.statForApproval;
                }
            }
        } else {
            payload.autoApproved = "1";//ConstantManager.autoApproved;
            if (currentSequence.MAXFORWARDS === 0) {
                payload.reqstatus = "3";//ConstantManager.statForPosting;
                payload.status = "3";//ConstantManager.statForPosting;
                payload.reqworkflowSequence = '1';
            }
            if (currentSequence.TRIGGEREMAILNOTIFICATION === 1) {
                payload.reqnotificationAgent = currentSequence.NOTIFICATIONAGENT_ROLE;
            }
        }
    } catch (error) {
        console.error(error);
    }
    return payload;
}


async function getWorkflowTemplate(infotype, initiator, wagetype, entity, tx) {
    try {
        const response = await tx.run(
            SELECT.from(entity).where({
                PAYCOMPONENT_ID: wagetype,
                INITIATORROLE: initiator,
                INFOTYPE: infotype
            })
        );


        if (response.length > 0) {
            return response;
        }

        return null;
    } catch (error) {
        console.log('Error fetching data from getWorkflowTemplate:', error);
        throw error;
    }
}

async function setApprovers(currentSequence, wfSequence, payload, decision, entity, tx) {
    try {
        let currentIdx = currentSequence.SEQUENCE;
        let countryOfCompany = payload.country;
        if (currentIdx === 1) {
            let agents = await getHanaAgentsByRole(payload.cust_userId, currentSequence.AGENTROLE, countryOfCompany, entity, tx);
            payload.reqagent = agents;
        } else {
            if (decision === "APPROVED") {
                payload.reqworkflowSequence = currentIdx;
            }
            payload.reqagent = payload.reqnextAgent;
            payload.reqstatus = "1";//ConstantManager.statForApproval;
            payload.status = "1";//ConstantManager.statForApproval;
        }
        let nextSequence = wfSequence.find(seq => seq.SEQUENCE === currentIdx + 1);
        if (nextSequence) {
            if (decision === "APPROVED") {
                payload.reqworkflowSequence = currentIdx + 1;
            }
            let nextAgents = await getHanaAgentsByRole(payload.cust_userId, nextSequence.AGENTROLE, countryOfCompany, entity, tx);
            payload.reqnextAgent = nextAgents;
        } else {
            payload.reqnextAgent = '';
        }
    } catch (error) {
        console.error(error);
    }
    return payload;
}

async function saveAvailability(record, tx) {
    try {
        // Generate UUID
        const result = await tx.run(
            `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
            []  // No input parameters are needed in this case, only output
        );

        const lv_extid = result.EV_UUID;

        // Insert into VP_AVAILABILITY table
        await tx.run(`
            INSERT INTO "COM_STRADA_VP_AVAILABILITY"(
                "ID", "CUST_EXTERNALCODE", "CUST_USERID", "CUST_PAYCOMPONENT_ID", "EFFECTIVESTARTDATE",
                "CUST_STARTTIME", "CUST_ENDDATE", "CUST_ENDTIME", "CUST_CUSTOMSTRING", "CUST_NOTES", 
                "CUST_EXISTINGCODE", "STATUS", "MODIFIEDAT", "CREATEDBY", "CREATEDAT", "AUTOAPPROVED",
                "CREATEDBYUSER", "COUNTRY_ID", "INITIATORLANGUAGE", "CUST_PAYCOMPONENT_TXT", 
                "DELIMITINDICATOR", "CUST_DAILYWORKSCHEDULE", "CUST_DAILYWORKSCHEDULETXT", 
                "CUST_DWSGROUPING", "CUST_DWSGROUPINGTXT", "CUST_WSVARIANT", "CUST_WSVARIANTTXT", 
                "CUST_CUSTOMVAR1", "CUST_CUSTOMVAR2", "CUST_CUSTOMVAR3", "CUST_CUSTOMVAR4", "CUST_CUSTOMVAR5",
                "CUST_CUSTOMVAR6"
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_UTCTIMESTAMP, ?, CURRENT_UTCTIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `, [
            lv_extid, lv_extid || '', record.cust_userId || '', record.cust_payComponent || '', formatDate(record.effectiveStartDate),
            formatTime(record.cust_startTime) || '', formatDate(record.cust_endDate), formatTime(record.cust_endTime) || '', record.cust_customString || '', record.cust_notes || '',
            record.cust_existingCode || '', parseInt(record.status, 10), record.createdBy || '', parseInt(record.autoApproved, 10), record.createdByUser || '',
            record.country || '', record.initiatorLanguage || '', record.cust_payComponent_txt || '', parseInt(record.delimitIndicator, 10), record.cust_dailyWorkSchedule || '',
            record.cust_dailyWorkScheduleTxt || '', record.cust_dwsGrouping || '', record.cust_dwsGroupingTxt || '', record.cust_wsVariant || '', record.cust_wsVariantTxt || '',
            record.cust_customVar1 || '', record.cust_customVar2 || '', record.cust_customVar3 || '', record.cust_customVar4 || '', record.cust_customVar5 || '', record.cust_customVar6 || ''
        ]);

        // Insert into VP_REQUEST_FLOW table
        await tx.run(`
            INSERT INTO "COM_STRADA_VP_REQUEST_FLOW"(
                "ID", "EXTERNALCODE", "REQUESTTYPE", "WORKFLOWSEQUENCE",
                "FORWARDSEQUENCE", "CREATEDAT", "STATUS_ID", "AGENT",
                "NEXTAGENT", "MODIFIEDBY", "MODIFIEDAT", "CREATEDBYUSER",
                "NOTIFICATIONAGENT", "WORKFLOW_ID"
            )
            VALUES (
                "REQFLOW".NEXTVAL, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, '', CURRENT_TIMESTAMP, ?, ?, ?
            )
        `, [
            lv_extid, record.reqrequestType || '', parseInt(record.reqworkflowSequence, 10) || null,
            parseInt(record.reqforwardSequence, 10) || null, record.reqstatus || '', record.reqagent || '',
            record.reqnextAgent || '', record.createdByUser || '', record.reqnotificationAgent || '', record.reqworkflow_id || ''
        ]);

        return { message: "Availability saved successfully." };
    } catch (error) {
        await tx.rollback();
        console.error('Error:', error);
        return { error: `Error saving availability: ${error.message}` };
    }
}


async function saveAvailabilityX(results, tx){
    
    try {
    // Split the data into two parts: VP_AVAILABILITY and VP_REQUEST_FLOW
    const it_pay = results.map(record => ({
        cust_externalCode: record.cust_externalCode || '',
        cust_userId: record.cust_userId || '',
        cust_payComponent: record.cust_payComponent || '',
        effectiveStartDate: formatDate(record.effectiveStartDate), // '2025-01-01',//new Date(record.effectiveStartDate).toISOString().slice(0, 10),  // Format to YYYY-MM-DDTHH:MM:SS
        cust_startTime: formatTime(record.cust_startTime) || '',
        cust_endDate: formatDate(record.cust_endDate),//'2025-01-01',//new Date(record.cust_endDate).toISOString().slice(0, 10),  // Format to YYYY-MM-DDTHH:MM:SS
        cust_endTime: formatTime(record.cust_endTime) || '',
        cust_customString: record.cust_customString || '',
        cust_notes: record.cust_notes || '',
        cust_existingCode: record.cust_existingCode || '',
        status: parseInt(record.status, 10),
        autoApproved: parseInt(record.autoApproved, 10),
        createdByUser: record.createdByUser || '',
        createdBy: record.createdBy || '',
        country_id: record.country || '',
        initiatorLanguage: record.initiatorLanguage || '',
        cust_payComponent_txt: record.cust_payComponent_txt || '',
        delimitIndicator: parseInt(record.delimitIndicator, 10),
        cust_dailyWorkSchedule: record.cust_dailyWorkSchedule || '',
        cust_dailyWorkScheduleTxt: record.cust_dailyWorkScheduleTxt || '',
        cust_dwsGrouping: record.cust_dwsGrouping || '',
        cust_dwsGroupingTxt: record.cust_dwsGroupingTxt || '',
        cust_wsVariant: record.cust_wsVariant || '',
        cust_wsVariantTxt: record.cust_wsVariantTxt || '',
        cust_customVar1: record.cust_customVar1 || '',
        cust_customVar2: record.cust_customVar2 || '',
        cust_customVar3: record.cust_customVar3 || '',
        cust_customVar4: record.cust_customVar4 || '',
        cust_customVar5: record.cust_customVar5 || '',
        cust_customVar6: record.cust_customVar6 || ''
    }));

    const it_req_flow = results.map(record => ({
        id: record.reqexternalCode || '',
        externalCode: record.reqexternalCode || '',
        requestType: record.reqrequestType || '',
        workflow_id: record.reqworkflow_id || '',
        workflowSequence: parseInt(record.reqworkflowSequence, 10) || null,
        forwardSequence: parseInt(record.reqforwardSequence, 10) || null,
        status_id: record.reqstatus || '',
        agent: record.reqagent || '',
        nextAgent: record.reqnextAgent || '',
        notificationAgent: record.reqnotificationAgent || '',
        createdByUser: record.createdByUser || ''

    }));

    // Call the stored procedure or perform the database operations
    let ev_response = '';

    
        //Generate UUID
        const result = await tx.run(
            `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
            []  // No input parameters are needed in this case, only output
        );

        const lv_extid = result.EV_UUID;

        for (const row of it_pay) {
            await tx.run(`
                INSERT INTO "COM_STRADA_VP_AVAILABILITY"(
                    "ID", "CUST_EXTERNALCODE", "CUST_USERID", "CUST_PAYCOMPONENT_ID", "EFFECTIVESTARTDATE",
                    "CUST_STARTTIME", "CUST_ENDDATE", "CUST_ENDTIME", "CUST_CUSTOMSTRING", "CUST_NOTES", 
                    "CUST_EXISTINGCODE", "STATUS", "MODIFIEDAT", "CREATEDBY", "CREATEDAT", "AUTOAPPROVED",
                    "CREATEDBYUSER", "COUNTRY_ID", "INITIATORLANGUAGE", "CUST_PAYCOMPONENT_TXT", 
                    "DELIMITINDICATOR", "CUST_DAILYWORKSCHEDULE", "CUST_DAILYWORKSCHEDULETXT", 
                    "CUST_DWSGROUPING", "CUST_DWSGROUPINGTXT", "CUST_WSVARIANT", "CUST_WSVARIANTTXT", 
                    "CUST_CUSTOMVAR1", "CUST_CUSTOMVAR2", "CUST_CUSTOMVAR3", "CUST_CUSTOMVAR4", "CUST_CUSTOMVAR5",
                    "CUST_CUSTOMVAR6"
                )
                VALUES (
                    ?,  -- Using sequence for ID
                    ?,  -- Bind variable for lv_extid
                    ?,  -- Bind variable for CUST_USERID
                    ?,  -- Bind variable for CUST_PAYCOMPONENT_ID
                    ?,  -- Bind variable for EFFECTIVESTARTDATE
                    ?,  -- Bind variable for CUST_STARTTIME
                    ?,  -- Bind variable for CUST_ENDDATE
                    ?,  -- Bind variable for CUST_ENDTIME
                    ?,  -- Bind variable for CUST_CUSTOMSTRING
                    ?,  -- Bind variable for CUST_NOTES
                    ?,  -- Bind variable for CUST_EXISTINGCODE
                    ?,  -- Bind variable for STATUS
                    CURRENT_UTCTIMESTAMP,  -- Using CURRENT_UTCTIMESTAMP for MODIFIEDAT
                    ?,  -- Bind variable for CREATEDBY
                    CURRENT_UTCTIMESTAMP,  -- Bind variable for CREATEDAT
                    ?,  -- Bind variable for AUTOAPPROVED
                    ?,  -- Bind variable for CREATEDBYUSER
                    ?,  -- Bind variable for COUNTRY_ID
                    ?,  -- Bind variable for INITIATORLANGUAGE
                    ?,  -- Bind variable for CUST_PAYCOMPONENT_TXT
                    ?,  -- Bind variable for DELIMITINDICATOR
                    ?,  -- Bind variable for CUST_DAILYWORKSCHEDULE
                    ?,  -- Bind variable for CUST_DAILYWORKSCHEDULETXT
                    ?,  -- Bind variable for CUST_DWSGROUPING
                    ?,  -- Bind variable for CUST_DWSGROUPINGTXT
                    ?,  -- Bind variable for CUST_WSVARIANT
                    ?,  -- Bind variable for CUST_WSVARIANTTXT
                    ?,  -- Bind variable for CUST_CUSTOMVAR1
                    ?,  -- Bind variable for CUST_CUSTOMVAR2
                    ?,  -- Bind variable for CUST_CUSTOMVAR3
                    ?,  -- Bind variable for CUST_CUSTOMVAR4
                    ?,  -- Bind variable for CUST_CUSTOMVAR5
                    ?   -- Bind variable for CUST_CUSTOMVAR6
                )
            `, [
                lv_extid,  // Pass the ID value
                lv_extid,  // Pass the external ID value
                row.cust_userId,  // Pass the record's CUST_USERID
                row.cust_payComponent,  // Pass the record's CUST_PAYCOMPONENT_ID
                row.effectiveStartDate,  // Pass the record's EFFECTIVESTARTDATE
                row.cust_startTime,  // Pass the record's CUST_STARTTIME
                row.cust_endDate,  // Pass the record's CUST_ENDDATE
                row.cust_endTime,  // Pass the record's CUST_ENDTIME
                row.cust_customString,  // Pass the record's CUST_CUSTOMSTRING
                row.cust_notes,  // Pass the record's CUST_NOTES
                row.cust_existingCode,  // Pass the record's CUST_EXISTINGCODE
                row.status,  // Pass the record's STATUS
                row.createdBy,  // Pass the record's CREATEDBY
                row.autoApproved,  // Pass the record's AUTOAPPROVED
                row.createdByUser,  // Pass the record's CREATEDBYUSER
                row.country_id,  // Pass the record's COUNTRY_ID
                row.initiatorLanguage,  // Pass the record's INITIATORLANGUAGE
                row.cust_payComponent_txt,  // Pass the record's CUST_PAYCOMPONENT_TXT
                row.delimitIndicator,  // Pass the record's DELIMITINDICATOR
                row.cust_dailyWorkSchedule,  // Pass the record's CUST_DAILYWORKSCHEDULE
                row.cust_dailyWorkScheduleTxt,  // Pass the record's CUST_DAILYWORKSCHEDULETXT
                row.cust_dwsGrouping,  // Pass the record's CUST_DWSGROUPING
                row.cust_dwsGroupingTxt,  // Pass the record's CUST_DWSGROUPINGTXT
                row.cust_wsVariant,  // Pass the record's CUST_WSVARIANT
                row.cust_wsVariantTxt,  // Pass the record's CUST_WSVARIANTTXT
                row.cust_customVar1,  // Pass the record's CUST_CUSTOMVAR1
                row.cust_customVar2,  // Pass the record's CUST_CUSTOMVAR2
                row.cust_customVar3,  // Pass the record's CUST_CUSTOMVAR3
                row.cust_customVar4,  // Pass the record's CUST_CUSTOMVAR4
                row.cust_customVar5,  // Pass the record's CUST_CUSTOMVAR5
                row.cust_customVar6   // Pass the record's CUST_CUSTOMVAR6
            ]);
        }

        // Iterate over request flow data and insert directly into the database
        for (const row of it_req_flow) {

            // Perform the insertion logic
            await tx.run(`
                    INSERT INTO "COM_STRADA_VP_REQUEST_FLOW"(
                        "ID", "EXTERNALCODE", "REQUESTTYPE", "WORKFLOWSEQUENCE",
                        "FORWARDSEQUENCE", "CREATEDAT", "STATUS_ID", "AGENT",
                        "NEXTAGENT", "MODIFIEDBY", "MODIFIEDAT", "CREATEDBYUSER",
                        "NOTIFICATIONAGENT", "WORKFLOW_ID"
                    )
                    VALUES ("REQFLOW".NEXTVAL, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
                `, [
                lv_extid,
                row.requestType,
                row.workflowSequence,
                row.forwardSequence,
                row.status_id,
                row.agent,
                row.nextAgent,
                '',
                row.createdByUser,
                row.notificationAgent,
                row.workflow_id
            ]);

        }

        return { message: "Availability saved successfully." };

    } catch (error) {
        await tx.rollback();
        console.error('Error:', error);
        return { error: `Error saving availability: ${error.message}` };
    }
}

// Function to save one-time payment data
async function saveOneTimePay(obj, tx) {

    obj.effectiveStartDate = formatDate(obj.effectiveStartDate);
    obj.lastModified = new Date();
    obj.createdOn = obj.createdOn.length === 0 ? new Date() : formatTime(obj.createdOn);

    //Generate UUID
    const uuid = await tx.run(
        `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
        []  // No input parameters are needed in this case, only output
    );

    const lv_extid = uuid.EV_UUID;

    // Preparing the records for stored procedure
    const record = [{
        "cust_externalCode": lv_extid,
        "cust_userId": obj.cust_userId,
        "cust_payComponent": obj.cust_payComponent,
        "effectiveStartDate": obj.effectiveStartDate,
        "cust_paycompvalue": obj.cust_paycompvalue.length !== 0 ? parseFloat(obj.cust_paycompvalue) : null,
        "cust_currencyCode": obj.cust_currencyCode,
        "cust_calculatedAmount": obj.cust_calculatedAmount.length !== 0 ? parseFloat(obj.cust_calculatedAmount) : null,
        "cust_customString": obj.cust_customString,
        "cust_sequenceNumber": parseInt(obj.cust_sequenceNumber, 10) || 0,
        "cust_number": obj.cust_number.length !== 0 ? parseFloat(obj.cust_number) : null,
        "cust_unit": obj.cust_unit,
        "cust_notes": obj.cust_notes,
        "cust_existingCode": obj.cust_existingCode,
        "cust_alternativeCostCenter": obj.cust_alternativeCostCenter,
        "status": obj.status,
        "lastModified": obj.lastModified,
        "createdBy": obj.createdBy,
        "createdOn": obj.createdOn,
        "autoApproved": obj.autoApproved,
        "createdByUser": obj.createdByUser,
        "cust_user": obj.cust_user,
        "country_id": obj.country,
        "initiatorLanguage": obj.initiatorLanguage,
        "cust_alternativeCostCenter_txt": obj.cust_alternativeCostCenter_txt,
        "cust_unit_txt": obj.cust_unit_txt,
        "cust_payComponent_txt": obj.cust_payComponent_txt,
        "specialRecognition": obj.specialRecognition.length !== 0 ? parseInt(obj.specialRecognition, 10) : 0,
        "delimitIndicator": obj.delimitIndicator.length !== 0 ? parseInt(obj.delimitIndicator, 10) : 0,
        "displayAmount": obj.displayAmount.length !== 0 ? obj.displayAmount : null
    }];

    const task = [{
        "id": 0,
        "externalCode": lv_extid,
        "requestType": obj.reqrequestType,
        "workflowSequence": parseInt(obj.reqworkflowSequence, 10) || 0,
        "forwardSequence": parseInt(obj.reqforwardSequence, 10) || 0,
        "createdOn": obj.reqcreatedOn.length === 0 ? new Date() : formatTime(obj.reqcreatedOn),
        "status_id": obj.reqstatus,
        "agent": obj.reqagent,
        "nextAgent": obj.reqnextAgent,
        "changedBy": obj.reqchangedBy,
        "lastModified": obj.reqlastModified,
        "changedByUser": obj.reqchangedByUser,
        "notificationAgent": obj.reqnotificationAgent,
        "workflow_id": obj.reqworkflow_id
    }];


    try {

        const lv_count = await tx.run(`
            SELECT COUNT(*) AS count
            FROM "COM_STRADA_VP_ONETIME_PAY"
            WHERE "CUST_PAYCOMPONENT_ID" = ?
            AND "CUST_USERID" = ?
            AND "EFFECTIVESTARTDATE" = ?
            AND "CUST_PAYCOMPVALUE" = ?
            AND ("STATUS" = 4 OR "STATUS" = 3)
        `,
            [
                record[0].cust_payComponent,     // cust_payComponent_id
                record[0].cust_userId,           // cust_userId
                record[0].effectiveStartDate,    // effectiveStartDate
                record[0].cust_paycompvalue     // cust_paycompvalue
            ]);

        console.log('Count:', lv_count);

        if (lv_count[0].COUNT !== 0) {
            console.log('Duplicate record exists for the same start date, pay component, and amount:' + JSON.stringify(record[0]));
            throw new Error('Duplicate record exists for the same start date, pay component, and amount:' + JSON.stringify(record[0]));
            //return { message: 'Duplicate record exists for the same start date, pay component, and amount.' };
            
        }

        // Insert into VP_ONETIME_PAY
        const insertOneTimePayQuery = `
INSERT INTO "COM_STRADA_VP_ONETIME_PAY"(
"ID","CUST_EXTERNALCODE", "CUST_USERID", "CUST_PAYCOMPONENT_ID", "EFFECTIVESTARTDATE", "CUST_PAYCOMPVALUE",
"CUST_CURRENCYCODE", "CUST_CUSTOMSTRING", "CUST_SEQUENCENUMBER", "CUST_NUMBER", "CUST_UNIT",
"CUST_NOTES", "CUST_EXISTINGCODE", "STATUS", "MODIFIEDAT", "CREATEDBY", "CREATEDAT",
"AUTOAPPROVED", "CUST_CALCULATEDAMOUNT", "CREATEDBYUSER", "CUST_USER", "COUNTRY_ID", 
"INITIATORLANGUAGE", "CUST_ALTERNATIVECOSTCENTER_TXT", "CUST_UNIT_TXT", "CUST_PAYCOMPONENT_TXT",
"CUST_ALTERNATIVECOSTCENTER", "SPECIALRECOGNITION", "DELIMITINDICATOR", "DISPLAYAMOUNT"
)
VALUES (
"LOGGER".NEXTVAL,
'${record[0].cust_externalCode}', 
'${record[0].cust_userId}', 
'${record[0].cust_payComponent}', 
'${record[0].effectiveStartDate}', 
${record[0].cust_paycompvalue},
'${record[0].cust_currencyCode}', 
'${record[0].cust_customString}', 
${record[0].cust_sequenceNumber}, 
${record[0].cust_number}, 
'${record[0].cust_unit}',
'${record[0].cust_notes}', 
'${record[0].cust_existingCode}', 
'${record[0].status}', 
CURRENT_TIMESTAMP, 
'${record[0].createdBy}', 
CURRENT_TIMESTAMP, 
${record[0].autoApproved}, 
${record[0].cust_calculatedAmount}, 
'${record[0].createdByUser}', 
'${record[0].cust_user}', 
'${record[0].country_id}', 
'${record[0].initiatorLanguage}', 
'${record[0].cust_alternativeCostCenter_txt}', 
'${record[0].cust_unit_txt}', 
'${record[0].cust_payComponent_txt}',
'${record[0].cust_alternativeCostCenter}', 
${record[0].specialRecognition}, 
${record[0].delimitIndicator}, 
${record[0].displayAmount}
);`;

        await tx.run(insertOneTimePayQuery);

        const insertAuditLogQuery = `
INSERT INTO "COM_STRADA_VP_AUDIT_LOG"(
  "ID", "EXTERNALCODE", "ACTION_ID", "CREATEDAT", "CREATEDBY", "REQUESTTYPE",
  "ADDITIONALINFO", "CREATEDBYUSER"
)
VALUES
( "LOGGER".NEXTVAL, ?, 
      CASE WHEN ? = 1 THEN 2 ELSE 4 END, 
      CURRENT_TIMESTAMP, ?, 'IT15', '', ?)
`;

        // Prepare the values from the `task` array
        const values = [
            task[0].externalCode, // External code
            task[0].autoApproved, // autoApproved field (used for the `action_id` case statement)
            task[0].createdBy, // Created By
            task[0].createdByUser // Created By User
        ];

        // Execute the query with the parameters inside the transaction
        await tx.run(insertAuditLogQuery, values);

        // Perform the insertion logic
        await tx.run(`
INSERT INTO "COM_STRADA_VP_REQUEST_FLOW"(
    "ID", "EXTERNALCODE", "REQUESTTYPE", "WORKFLOWSEQUENCE",
    "FORWARDSEQUENCE", "CREATEDAT", "STATUS_ID", "AGENT",
    "NEXTAGENT", "MODIFIEDBY", "MODIFIEDAT", "CREATEDBYUSER",
    "NOTIFICATIONAGENT", "WORKFLOW_ID"
)
VALUES ("REQFLOW".NEXTVAL, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
`, [
            task[0].externalCode,
            task[0].requestType,
            task[0].workflowSequence,
            task[0].forwardSequence,
            task[0].status_id,
            task[0].agent,
            task[0].nextAgent,
            '',
            task[0].createdByUser,
            task[0].notificationAgent,
            task[0].workflow_id
        ]);

        


        return { message: 'Record successfully inserted into the database: ' };


    } catch (err) {
        tx.rollback();
        throw new Error(`Error in procedure: ${err.message}`);
    }
}

async function sendEmailPayload(obj, decision, approvalURL, entity, entityEmailParam, userEntity, tx) {

    if (obj) {
        const workflow_id = obj.reqworkflow_id;
        const workflow_seq = obj.reqworkflowSequence;
        const initiatorLanguage = obj.initiatorLanguage;
        const reqType = obj.reqrequestType;
        const payComp = obj.cust_payComponent;
        let emailId = '';
        console.log(`LOG: workflow_id: ${workflow_id}`);
        switch (workflow_id) {
            case "WF1":
                if (parseInt(workflow_seq) < 2 && decision === '') {
                    emailId = "E1";//ConstantManager.emailPending;
                } else if (parseInt(workflow_seq) < 2 && decision === "APPROVED") {
                    emailId = "E1";//ConstantManager.emailPending;
                } else if (decision === "REJECTED") {
                    emailId = "E4";
                }
                break;
            case "WF2":
            case "WF3":
                if (workflow_seq === '1' && decision === '') {
                    emailId = "E1";//ConstantManager.emailPending;
                } else if (decision === "REJECTED") {
                    emailId = "E4";//ConstantManager.emailRejected;
                }
                break;
            case "WF_FORWARD_1":
            case "WF_FORWARD_2":
                if (parseInt(workflow_seq) < 4 && decision === '') {
                    emailId = "E1";//ConstantManager.emailPending;
                } else if (decision === "REJECTED") {
                    emailId = "E4";//ConstantManager.emailRejected;
                }
                break;
            case "WF6":
                if (workflow_seq === '1' && decision === '') {
                    emailId = "E5";//ConstantManager.email2004Approval;
                } else if (decision === "REJECTED") {
                    emailId = "E9";//ConstantManager.email2004Rejected;
                } else {
                    emailId = "E6";//ConstantManager.email2004Approved;
                }
                break;
        }
        if (emailId !== '') {
            const templateArray = await getEmailTemplate(emailId, initiatorLanguage, reqType, entity, entityEmailParam, tx);
            console.log(`sendEmailPayload emailId: ${emailId} initiatorLanguage: ${initiatorLanguage} reqType: ${reqType}`);
            try {
                switch (emailId) {
                    case "E1"://ConstantManager.emailPending:
                    case "E5"://ConstantManager.email2004Approval:
                        sendApproval(templateArray, obj, approvalURL, userEntity, tx);
                        break;
                    case "E4"://ConstantManager.emailRejected:
                    case "E9"://ConstantManager.email2004Rejected:
                        sendReject(templateArray, obj, userEntity, tx);
                        break;
                    case "E6"://ConstantManager.email2004Approved:
                        sendCompletion(templateArray, obj, userEntity, tx);
                        break;
                }
            } catch (error) {
                console.log(`Error sendEmailPayload sending email: ${error}`);
            }
        }
    }
}

// Helper function to map email body and title 
async function mapEmailBody(emailBody, mappingArray, obj, urlToCall) {
    for (let i = 0; i < mappingArray.length; i++) {
        const jsonMapping = mappingArray[i];
        const mappingField = jsonMapping.fieldName.trim();

        // Check if it's not agent or approvalLink

        if (mappingField !== "agent" && mappingField !== "APPROVALLINK") {
            let fieldValue = obj[mappingField] ? obj[mappingField].toString() : '';
            let mappingParam = jsonMapping.parameterID.trim().replace("&", "&amp;");

            if (mappingField === "EFFECTIVESTARTDATE" || mappingField === "CUST_ENDDATE") {
                // Convert date fields
                if (fieldValue) {
                    emailBody = emailBody.replace(new RegExp(mappingParam, 'g'), formatDateNotif(fieldValue));
                }
            } else if (mappingField === "CUST_STARTTIME" || mappingField === "CUST_ENDTIME") {
                // Convert time fields
                if (fieldValue) {
                    emailBody = emailBody.replace(new RegExp(mappingParam, 'g'), formatTime(fieldValue));
                }
            } else if (mappingField === "MODIFIEDAT") {
                // Handle lastModified date
                if (fieldValue && fieldValue.trim() !== "") {
                    emailBody = emailBody.replace(new RegExp(mappingParam, 'g'), formatDateNotif(fieldValue));
                }
            } else {
                // For other fields, just replace with their values
                if (fieldValue) {
                    emailBody = emailBody.replace(new RegExp(mappingParam, 'g'), fieldValue);
                }
            }
        } else if (mappingField === "APPROVALLINK") {
            // Special case for approvalLink
            let mappingParam = jsonMapping.parameterID.trim().replace("&", "&amp;");
            emailBody = emailBody.replace(new RegExp(mappingParam, 'g'), urlToCall);
        }
    }

    return emailBody;
}

async function getEmailTemplate(emailId, language, reqType, entity, entityEmailParam,  tx) {
    try {
        // Query the VP_EMAIL_TEMPLATES entity for the template by emailId
        const emailTemplate = await tx.run(
            SELECT.from(entity)
                .where({ id: emailId, language: language, infoType: reqType })
                .columns('id', 'language', 'infoType', 'mappingID_id', 'body', 'title')
        );

        // Check if template was found, otherwise handle the case
        if (emailTemplate.length === 0) {
            throw new Error(`Email template not found for Email ID: ${emailId}, Language: ${language}, Request Type: ${reqType}`);
        }

        //Add email parameters
        const emailTemplateParams = await tx.run(
            SELECT.from(entityEmailParam)
                .where({ id: emailTemplate[0].mappingID_id })
                .columns('fieldName', 'id', 'parameterID')
        );

        // Check if template was found, otherwise handle the case
        if (emailTemplateParams.length === 0) {
            throw new Error(`Email template parameters not found for payload:  ${emailTemplate[0].mappingID_id}`);
        }

        // Attach the email parameters to the email template
        emailTemplate[0].EmailMapping = emailTemplateParams;


        // Return the template (adjust this if your template needs further formatting)
        return emailTemplate; // Assuming the query returns an array, take the first result
    } catch (error) {
        // Handle error (log or rethrow depending on your needs)
        console.log('Error fetching email template:', error);
        throw new Error('Failed to fetch email template');
    }
}

async function sendCompletion(templateArray, obj, entityUser, tx) {
    let emailBody, emailTitle;
    let mappingArray = null;

    const selectedTemplate = templateArray[0]; // Assuming templateArray is an array, like the Java JSONArray
    if (selectedTemplate) {
        mappingArray = selectedTemplate.EmailMapping;

        emailTitle = selectedTemplate.title;
        emailTitle = await mapEmailBody(emailTitle, mappingArray, obj, "");

        emailBody = selectedTemplate.body;
        emailBody = await mapEmailBody(emailBody, mappingArray, obj, "");

        let toAddress = "";

        const agent = obj.CREATEDBY;
        if (agent) {
            toAddress = await getUserDetail(agent, 'EMAIL', entityUser, tx);
            console.log(`LOG: email notification agent: ${agent}, receiver email address: ${toAddress}`);

            if (toAddress) {
                try {
                    await sendEmail(toAddress, emailTitle, emailBody);
                } catch (error) {
                    console.log("Error sending email:", error);
                }
            }
        }
    }
}

async function sendNotif(templateArray, obj, urlToCall, entityUser, tx) {
    try {
        let emailBody, emailTitle;
        let mappingArray = null;

        // Select the first template from the provided array
        const selectedTemplate = templateArray[0];
        if (selectedTemplate) {
            mappingArray = selectedTemplate.EmailMapping;
            emailTitle = selectedTemplate.title;
            emailBody = selectedTemplate.body;

            // Map email title and body using mappingArray and input data
            emailTitle = await mapEmailBody(emailTitle, mappingArray, obj, '');
            emailBody = await mapEmailBody(emailBody, mappingArray, obj, urlToCall);

            let toAddress = '';

            // Get the agent information
            const agent = obj.NOTIFICATIONAGENT;
            let notifAgent = await getHanaAgentsByRole(obj.CUST_USERID, agent, obj.COUNTRY_ID, entityUser, tx);

            // If agent is found, get the email address
            if (notifAgent) {
                toAddress = await getUserDetail(notifAgent, 'EMAIL', userEntity, tx);
                console.log(`Email notification agent: ${notifAgent} receiver email address: ${toAddress}`);

                // If an email address is found, send the email
                if (toAddress) {
                    await sendEmail(toAddress, emailTitle, emailBody);
                } else {
                    console.log(`No email address found for agent: ${agent}`);
                }
            }
        }
    } catch (error) {
        console.log('Error in sending notification: ', error);
        throw new error('Error in sending notification', error);
    }
}



// Helper function to send email using nodemailer
async function sendEmail(toAddress, subject, body) {
    try {
        let fromAddress = "no-reply@hr.solvay.com";
        if (toAddress.includes("syensqo")) {
            fromAddress = "no-reply@hr.syensqo.com";
        }

        // Build the payload for the email
        const to = [{ Email: toAddress }];
        const from = { Email: fromAddress };

        const message = {
            From: from,
            To: to,
            Subject: emailTitle,
            HTMLPart: emailBody,
        };

        const payload = {
            Messages: [message]
        };

        // Log the payload for debugging
        console.log(`payload: ${JSON.stringify(payload)}`);

        // If payload exists, make the HTTP request to send the email
        if (payload) {
            const genURL = new URLManager("SendEmail", configEmail, "POST");
            const urlToCall = genURL.formURLToCall();

            // Log the URL for debugging
            console.log(`sendEmail urlToCall: ${urlToCall}`);

            // Send the request to the email service
            const response = await axios.post(urlToCall, payload);

            // Log the response code for debugging
            console.log(`sendEmail responseCode: ${response.status}`);
        }

    } catch (error) {
        // Handle errors (e.g., HTTP errors)
        console.log(`Error sending email: ${error.message}`);
        throw error; // Rethrow the error if necessary
    }
}


async function sendReject(templateArray, obj, entityUser, tx) {
    const selectedTemplate = templateArray[0];
    if (selectedTemplate) {
        const mappingArray = selectedTemplate.EmailMapping;
        let emailTitle = selectedTemplate.title;
        emailTitle = mapEmailBody(emailTitle, mappingArray, obj, '');
        let emailBody = selectedTemplate.body;
        emailBody = mapEmailBody(emailBody, mappingArray, obj, '');
        const agent = obj.createdBy;
        if (agent) {
            const toAddress = await getUserDetail(agent, 'EMAIL', entityUser, tx);
            logger.debug(`LOG: email notification agent: ${agent} receiver email address: ${toAddress}`);
            if (toAddress) {
                try {
                    const emailFunc = require('./EmailFunction'); // Assuming a utility function
                    emailFunc.sendEmail(toAddress, emailTitle, emailBody);
                } catch (error) {
                    console.log(`Error sending email: ${error}`);
                }
            } else {
                console.log(`LOG: No email address for: ${agent}`);
            }
        }
    }
}

 
    

    // Helper function to simulate fetching user details
    async function getUserDetail(userId, field, entityUser, tx) {
        try {
            const response = await tx.run(
                SELECT.from(entityUser).where({
                    USERID: userId
                })
            );


            if (response.length > 0) {
                const obj = response[0];
                // Return the value of the specified property, if it exists
                if (obj.hasOwnProperty(field)) {
                    return obj[field].toString();
                }
            }
    
            return null;
        } catch (error) {
            console.log('Error fetching data from getUserDetail:', error);
            throw error;
        }
    }

    


async function sendApproval(templateArray, obj, urlToCall, userEntity, tx) {
    const selectedTemplate = templateArray[0];
    if (selectedTemplate) {
        const mappingArray = selectedTemplate.EmailMapping;
        let emailTitle = selectedTemplate.title;
        
        console.log(`emailTitle: ${emailTitle}`);
        console.log(`mappingArray: ${JSON.stringify(mappingArray)}`);
        console.log(`obj: ${JSON.stringify(obj)}`);
        
        emailTitle = await mapEmailBody(emailTitle, mappingArray, obj, '');
        let emailBody = selectedTemplate.body;
        emailBody = await mapEmailBody(emailBody, mappingArray, obj, urlToCall);
        
        const agents = obj.reqagent;
        if (agents) {
            const users = agents.split(';');
            for (const usr of users) {
                let toAddress = await getUserDetail(usr, 'EMAIL', userEntity, tx);
                console.log(`LOG: email notification agent: ${usr} receiver email address: ${toAddress}`);
                if (toAddress) {
                    try {
                        await sendEmail(toAddress, emailTitle, emailBody);
                    } catch (error) {
                        console.log(`Error sending email to ${usr}: ${error}`);
                    }
                } else {
                    console.log(`No email address for: ${usr}`);
                }
            }
        }
    }
}

module.exports = {
    mapEmailBody,
    sendNotif,
    getEmailTemplate,
    getUserDetail,
    getCurrentUser,
    processWorkflow,
    sendEmailPayload,
    getWorkflowTemplate,
    saveOneTimePay,
    sendReject,
    sendCompletion,
    saveAvailability
};