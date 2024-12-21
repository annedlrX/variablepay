const cds = require('@sap/cds');

const { formatTime, formatDate, splitCSV } = require('./helper/formatter');

module.exports = cds.service.impl(async function () {
    const { User } = this.entities;
    const { EmpJob } = this.entities;
    const { VP_TIMEKEEPER } = this.entities;
    const { VP_AUDIT_LOG } = this.entities;
    const { VP_AVAILABILITY, VP_REQUEST_FLOW } = this.entities;


    // Handle CREATE operation for User
    this.on('CREATE', User, async (req) => {
        const db = await cds.connect.to('db'); // Connect to the HANA database

        // Capture the input data from the request (could be an array of records)
        const inputData = req.data; // req.data contains an array of records

        // Format the input data as a table parameter (same as table type in HANA)
        const tableData = inputData.map(item => ({
            userID: item.userID,
            userName: item.userName,
            employeeID: item.employeeID,
            firstName: item.firstName,
            middleName: item.middleName,
            email: item.email,
            custom15: item.custom15,
            defaultLocale: item.defaultLocale,
            status: item.status,
            customManager: item.customManager,
            hr: item.hr,
            manager: item.manager,
            modifiedat: item.modifiedat
        }));

        // Call the stored procedure using a transaction
        await db.tx(async (tx) => {
            // Call the stored procedure with the table data as input
            await tx.run('CALL CREATEUSER(:tableData)', { tableData });
        });

        // Return the data that was created (CAP will automatically assign IDs, etc.)
        return inputData;
    });

    // Handle CREATE operation for EmpJob
    this.on('CREATE', User, async (req) => {
        const db = await cds.connect.to('db'); // Connect to the HANA database

        // Capture the input data from the request (could be an array of records)
        const inputData = req.data; // req.data contains an array of records

        // Format the input data as a table parameter (same as table type in HANA)
        const tableData = inputData.map(item => ({
            userID: item.userID,
            userName: item.countryOfCompany,
            countryOfCompany: item.company,
            modifiedat: item.lastModified
        }));

        // Call the stored procedure using a transaction
        await db.tx(async (tx) => {
            // Call the stored procedure with the table data as input
            await tx.run('CALL CREATEUSER(:tableData)', { tableData });
        });

        // Return the data that was created (CAP will automatically assign IDs, etc.)
        return inputData;
    });

    //===========================================
    //              XSJS
    //===========================================

    // Implement the saveAppAvailability action
    this.on('saveAvailability', async (req) => {

        // Get the incoming payload
        const { results } = req.data;

        // Split the data into two parts: VP_AVAILABILITY and VP_REQUEST_FLOW
        const it_recpay = results.map(record => ({
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
        const tx = await cds.tx(req);
        let ev_response = '';

        try {
            //Generate UUID
            const result = await tx.run(
                `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
                []  // No input parameters are needed in this case, only output
            );

            const lv_extid = result.EV_UUID;

            for (const row of it_recpay) {
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

            await tx.commit();
            return { message: "Availability saved successfully." };

        } catch (error) {
            await tx.rollback();
            console.error('Error:', error);
            return { error: `Error saving availability: ${error.message}` };
        }

    });

    /**
     *      Submit_OneTimePay.xsjs
     */
    this.on('saveOneTimePay', async (req) => {
        // Get the incoming payload
        const { results } = req.data;
        const response = {
            message: []
        };

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


                // Check for duplicates
                //Generate UUID
                const uuid = await tx.run(
                    `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
                    []  // No input parameters are needed in this case, only output
                );

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
                    return { message: 'Duplicate record exists for the same start date, pay component, and amount.' };
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

                tx.commit();


                return { message: 'Record successfully inserted into the database: ' };


            } catch (err) {
                tx.rollback();
                throw new Error(`Error in procedure: ${err.message}`);
            }
        }

        // Call the stored procedure or perform the database operations
        const tx = await cds.tx(req);
        let ev_response = '';

        // Processing the incoming data
        try {
            if (results.length > 0) {
                let msg = '';
                for (let i = 0; i < results.length; i++) {
                    const payObject = results[i];
                    console.log("payObject: " + JSON.stringify(payObject));

                    // Assuming saveOneTimePay returns a message object
                    msg = await saveOneTimePay(payObject, tx);

                    // Check if msg contains the success message
                    if (msg && msg.message) {
                        // Add additional info
                        let successMsg = `${msg.message} UserId: ${payObject.cust_userId}, PayComponent: ${payObject.cust_payComponent}`;
                        response.message.push(successMsg);
                    }
                }

                if (response.message.length !== 0) {
                    return { success: response.message };
                } else {
                    response.message.push('Payload not posted');
                    return { error: response.message };
                }
            } else {
                response.message.push('Invalid Payload');
                return { error: response.message };
            }

        } catch (err) {
            response.message.push(`${err.name}: ${err.message}`);
            return { error: response.message };
        }
    });

    //===========================================
    //              SCPI SERVICES
    //===========================================

    /**
     *     Ins_EmpJob_Dtls.xsjs
     */
    this.on('uploadEmpJobCPI', async (req) => {
        const body = req.data.body;
        const messages = [];
        const empJobs = [];
        const colCount = 4;

        // Split the input file content into lines and remove empty lines
        const arrLines = body.split(/\r\n|\n/).filter(line => line.trim() !== "");

        if (arrLines.length === 0) {
            return req.error(400, "No valid data in the file.");
        }



        // Process each line and validate columns
        arrLines.forEach((line, index) => {
            const cols = line.split(','); // Assuming splitCSV is just splitting by commas

            if (cols.length !== colCount) {
                messages.push(`Invalid columns for line: ${index + 1}`);
                return;
            }

            empJobs.push({
                userID: cols[0],
                countryOfCompany: cols[1],
                company: cols[2],
                lastModified: cols[3]
            });
        });

        // If there were column validation errors, return the errors
        if (messages.length > 0) {
            return req.error(400, messages.join(", "));
        }

        // Start the transaction
        const tx = await cds.tx(req);

        try {
            // Loop through each empJob and check if the record exists before insert/update
            for (const empJob of empJobs) {
                // Check if record already exists by querying for USERID
                const existingRecord = await tx.run(
                    SELECT.from('COM_STRADA_VP_EMPJOB').where({ USERID: empJob.userID })
                );

                if (existingRecord.length === 0) {
                    // Insert if the record does not exist
                    const insertQuery = `
                    INSERT INTO "COM_STRADA_VP_EMPJOB"(
                        "USERID", "COUNTRYOFCOMPANY", "COMPANY", "MODIFIEDAT"
                    )
                    VALUES(?, ?, ?, ?)
                `;
                    await tx.run(insertQuery, [
                        empJob.userID,
                        empJob.countryOfCompany,
                        empJob.company,
                        empJob.lastModified
                    ]);
                } else {
                    // Update if the record exists
                    const updateQuery = `
                    UPDATE "COM_STRADA_VP_EMPJOB"
                    SET "COUNTRYOFCOMPANY" = ?, "COMPANY" = ?, "MODIFIEDAT" = ?
                    WHERE "USERID" = ?
                `;
                    await tx.run(updateQuery, [
                        empJob.countryOfCompany,
                        empJob.company,
                        empJob.lastModified,
                        empJob.userID
                    ]);
                }
            }

            messages.push(`${empJobs.length} lines processed successfully.`);
            await tx.commit();  // Commit after all records are processed
        } catch (error) {
            // In case of error, roll back and return error message
            await tx.rollback();
            messages.push(`Error processing records: ${error.message}`);
            return req.error(400, messages.join('; '));
        }

        return { result: messages };
    });

    /**
     *     Ins_UserDtls.xsjs
     */
    this.on('uploadUserCPI', async (req) => {
        const body = req.data.body;
        const messages = [];
        const users = [];
        const colCount = 14;  // Expected column count

        // Split the input file content into lines and filter out empty lines
        const arrLines = body.split(/\r\n|\n/).filter(line => line.trim() !== "");

        if (arrLines.length === 0) {
            return req.error(400, "No valid data in the file.");
        }


        // Process each line and validate columns
        arrLines.forEach((line, index) => {
            // Remove any leading/trailing whitespaces from each line
            const trimmedLine = line.trim();

            // Split the line by commas (CSV format)
            const cols = trimmedLine.split(',');

            // Check if the number of columns matches the expected count
            if (cols.length !== colCount) {
                messages.push(`Invalid columns for line: ${index + 1}`);
                return;  // Skip processing if column count is incorrect
            }

            // Push the record to the users array
            users.push({
                userID: cols[0],
                userName: cols[1],
                employeeID: cols[2],
                firstName: cols[3],
                lastName: cols[4],
                middleName: cols[5],
                email: cols[6],
                custom15: cols[7],
                defaultLocale: cols[8],
                status: cols[9],
                customManager: cols[10],
                hr: cols[11],
                manager: cols[12],
                lastModified: cols[13]
            });
        });

        // If there were column validation errors, return the errors
        if (messages.length > 0) {
            return req.error(400, messages.join(", "));
        }

        // Start the transaction
        const tx = await cds.tx(req);

        try {
            // Loop through each user and check if the record exists before insert/update
            for (const user of users) {
                // Check if record already exists by querying for USERID
                const existingRecord = await tx.run(
                    SELECT.from('COM_STRADA_VP_USER').where({ userID: user.userID })
                );

                if (existingRecord.length === 0) {
                    // Insert if the record does not exist
                    const insertQuery = `
                        INSERT INTO "COM_STRADA_VP_USER"(
                            "USERID", "USERNAME", "EMPLOYEEID", "FIRSTNAME", "LASTNAME", 
                            "MIDDLENAME", "EMAIL", "CUSTOM15", "DEFAULTLOCALE", "STATUS", 
                            "CUSTOMMANAGER", "HR", "MANAGER", "MODIFIEDAT"
                        )
                        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    await tx.run(insertQuery, [
                        user.userID,
                        user.userName,
                        user.employeeID,
                        user.firstName,
                        user.lastName,
                        user.middleName,
                        user.email,
                        user.custom15,
                        user.defaultLocale,
                        user.status,
                        user.customManager,
                        user.hr,
                        user.manager,
                        user.lastModified
                    ]);
                } else {
                    // Update if the record exists
                    const updateQuery = `
                        UPDATE "COM_STRADA_VP_USER"
                        SET "USERNAME" = ?, "EMPLOYEEID" = ?, "FIRSTNAME" = ?, "LASTNAME" = ?, 
                            "MIDDLENAME" = ?, "EMAIL" = ?, "CUSTOM15" = ?, "DEFAULTLOCALE" = ?, 
                            "STATUS" = ?, "CUSTOMMANAGER" = ?, "HR" = ?, "MANAGER" = ?, "MODIFIEDAT" = ?
                        WHERE "USERID" = ?
                    `;
                    await tx.run(updateQuery, [
                        user.userName,
                        user.employeeID,
                        user.firstName,
                        user.lastName,
                        user.middleName,
                        user.email,
                        user.custom15,
                        user.defaultLocale,
                        user.status,
                        user.customManager,
                        user.hr,
                        user.manager,
                        user.lastModified,
                        user.userID
                    ]);
                }
            }

            messages.push(`${users.length} user records processed successfully.`);
            await tx.commit();  // Commit after all records are processed
        } catch (error) {
            // In case of error, roll back and return error message
            await tx.rollback();
            messages.push(`Error processing user records: ${error.message}`);
            return req.error(400, messages.join('; '));
        }

        return { result: messages };
    });

    /**
 *      Update_Availability_HCILogs.xsjs
 */
    this.on('updateAvailabilityCPI', async (req) => {
        const body = req.data.body;
        const messages = [];
        const recs = [];
        const colCount = 4;  // Expected column count

        // Split the input file content into lines and filter out empty lines
        const arrLines = body.split(/\r\n|\n/).filter(line => line.trim() !== "");

        if (arrLines.length === 0) {
            return req.error(400, "No valid data in the file.");
        }

        // Call the transaction object
        const tx = await cds.tx(req);

        // Process each line and validate columns
        for (let index = 0; index < arrLines.length; index++) {
            const line = arrLines[index].trim();

            // Split the line by commas (CSV format)
            const cols = line.split(',');

            // Check if the number of columns matches the expected count
            if (cols.length !== colCount) {
                messages.push(`Invalid columns for line: ${index + 1}`);
                continue;  // Skip processing if column count is incorrect
            }

            // Default values and validation
            let entries = [];
            let reqAction;

            // Set default values
            if (cols[1].length === 0) cols[1] = '2004'; // Default request type
            if (cols[2].length === 0) cols[2] = 2;  // Default status if empty

            if (cols[0].length === 0) {
                messages.push(`Missing external code in line: ${index + 1}`);
                continue;
            }

            // Query the database if action is 3
            if (cols[2] == "3") {
                reqAction = "15"; // Assuming "15" is the required action ID

                // Query the audit log to check for the most recent action
                const result = await tx.run(
                    `SELECT * 
                    FROM "COM_STRADA_VP_AUDIT_LOG"
                    WHERE "EXTERNALCODE" = ?
                    ORDER BY "CREATEDAT" DESC
                    LIMIT 1`,
                    [cols[0]]
                );

                // Check if action is 15 (to decide if further processing is needed)
                if (result.length > 0 && result[0].action_id == 15) {
                    entries.push(result[0]);
                }
            } else {
                reqAction = "9";  // Completed action
            }

            // Add the record to be processed (update or insert later)
            if (entries.length === 0) {
                recs.push({
                    externalCode: cols[0],
                    requestType: cols[1] || '2004',
                    status: cols[2],
                    action_id: reqAction,
                    comments: cols[3] || ''
                });
            }
        }

        // If there were column validation errors, return the errors
        if (messages.length > 0) {
            return req.error(400, messages.join(", "));
        }

        // Perform the database operations (Insert/Update)
        try {
            for (const rec of recs) {
                // Update existing records in the availability table
                const updateQuery = `
                    UPDATE "COM_STRADA_VP_AVAILABILITY"
                    SET "STATUS" = ?, "MODIFIEDAT" = CURRENT_TIMESTAMP
                    WHERE "CUST_EXTERNALCODE" = ?
                `;
                let updateResult = await tx.run(updateQuery, [
                    rec.status,
                    rec.externalCode
                ]);

                if (updateResult) {
                    // Insert an entry into the audit log if updated
                    const insertAuditLogQuery = `
                        INSERT INTO "COM_STRADA_VP_AUDIT_LOG"(
                            "ID", "EXTERNALCODE", "ACTION_ID", "CREATEDAT", "CREATEDBY", "REQUESTTYPE",
                            "ADDITIONALINFO", "CREATEDBYUSER"
                        )
                        VALUES
                        ( "LOGGER".NEXTVAL, ?, ?, CURRENT_TIMESTAMP, 'HCI', ?, ?, 'HCI')
                    `;

                    const values = [
                        rec.externalCode,  // External code
                        rec.action_id,
                        rec.requestType,
                        rec.comments || ''
                    ];

                    await tx.run(insertAuditLogQuery, values);
                }
            }

            messages.push(`${recs.length} lines processed successfully.`);
            await tx.commit();  // Commit after all records are processed
        } catch (error) {
            // In case of error, rollback and return error message
            await tx.rollback();
            messages.push(`Error processing records: ${error.message}`);
            return req.error(400, messages.join('; '));
        }

        return { result: messages };
    });

    this.on('updateOneTimePayCPI', async (req) => {
        const body = req.data.body;
        const messages = [];
        const recs = [];
        const colCount = 4;  // Expected column count

        // Split the input file content into lines and filter out empty lines
        const arrLines = body.split(/\r\n|\n/).filter(line => line.trim() !== "");

        if (arrLines.length === 0) {
            return req.error(400, "No valid data in the file.");
        }

        // Call the transaction object
        const tx = await cds.tx(req);

        // Process each line and validate columns
        for (let index = 0; index < arrLines.length; index++) {
            const line = arrLines[index].trim();

            // Split the line by commas (CSV format)
            const cols = line.split(',');

            // Check if the number of columns matches the expected count
            if (cols.length !== colCount) {
                messages.push(`Invalid columns for line: ${index + 1}`);
                continue;  // Skip processing if column count is incorrect
            }

            // Default values and validation
            let entries = [];
            let reqAction = 9; // Default action to "Completed"

            // Set default values
            if (cols[1].length === 0) cols[1] = 'IT15'; // Default request type is IT15
            if (cols[2].length === 0) cols[2] = 2;  // Default status if empty

            if (cols[0].length === 0) {
                messages.push(`Missing external code in line: ${index + 1}`);
                continue;
            }

            // Add the record to be processed (update or insert later)
            recs.push({
                externalCode: cols[0],
                requestType: cols[1] || 'IT15',  // IT15 as default request type
                status: cols[2],
                action_id: reqAction,
                comments: cols[3] || ''
            });

        }

        // If there were column validation errors, return the errors
        if (messages.length > 0) {
            return req.error(400, messages.join(", "));
        }

        // Perform the database operations (Insert/Update)
        try {
            for (const rec of recs) {
                // Update existing records in the "COM_STRADA_VP_ONETIMEPAY" table
                const updateQuery = `
                    UPDATE "COM_STRADA_VP_ONETIME_PAY"
                    SET "STATUS" = ?, "MODIFIEDAT" = CURRENT_TIMESTAMP
                    WHERE "CUST_EXTERNALCODE" = ?
                `;
                let updateResult = await tx.run(updateQuery, [
                    rec.status,
                    rec.externalCode
                ]);

                if (updateResult) {
                    // Insert an entry into the audit log if updated
                    const insertAuditLogQuery = `
                        INSERT INTO "COM_STRADA_VP_AUDIT_LOG"(
                            "ID", "EXTERNALCODE", "ACTION_ID", "CREATEDAT", "CREATEDBY", "REQUESTTYPE",
                            "ADDITIONALINFO", "CREATEDBYUSER"
                        )
                        VALUES
                        ( "LOGGER".NEXTVAL, ?, ?, CURRENT_UTCTIMESTAMP, 'HCI', ?, ?, 'HCI')
                    `;

                    const values = [
                        rec.externalCode,  // External code
                        rec.action_id,
                        rec.requestType,
                        rec.comments || ''
                    ];

                    await tx.run(insertAuditLogQuery, values);
                }
            }

            messages.push(`${recs.length} lines processed successfully.`);
            await tx.commit();  // Commit after all records are processed
        } catch (error) {
            // In case of error, rollback and return error message
            await tx.rollback();
            messages.push(`Error processing records: ${error.message}`);
            return req.error(400, messages.join('; '));
        }

        return { result: messages };
    });


});

