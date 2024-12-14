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

    //Add_AuditLogs.xsjs
    // Local function to process log entries and call the procedure
    async function addLogs(tx, obj) {
        const logLength = obj.length;
        let errorMsg = '';
        let task = [];

        for (let j = 0; j < logLength; j++) {
            task.push({
                "id": obj[j].id,
                "externalCode": obj[j].externalCode,
                "action.id": obj[j].action,
                "createdOn": formatTime(obj[j].createdOn),
                "createdBy": obj[j].createdBy,
                "requestType": obj[j].requestType,
                "additionalInfo": obj[j].additionalInfo
            });
        }

        // Load the procedure and call it
        await tx(async (tx) => {
            // Call the stored procedure with the table data as input
            errorMsg = await tx.run('CALL ADD_TO_LOG(:it_audit_log)', { task });
            return errorMsg.ev_response;
        });

    }

    // Event handler for POSTing logs
    this.on('postLogs', async (req) => {
        const output = { error: [] };
        let error_message = '';
        const JSONObj = req.data; // Body of the request is automatically parsed by CAP

        try {
            const db = await cds.connect.to('db'); // Connect to the HANA database
            const tx = await cds.transaction(); // Create a new transaction

            const len = JSONObj.d.results.length;
            if (len > 0) {
                const payObject = JSONObj.d.results;
                error_message = await addLogs(tx, payObject);

                if (error_message && error_message.length !== 0) {
                    output.error.push(error_message);
                    req.error(400, JSON.stringify(output));
                } else {
                    // Commit transaction if no error
                    await tx.commit();
                    req.reply(output);
                }
            } else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }

        } catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });

    /**
     *      Approve_Payments
     */
    async function approvePayments(db, obj) {
        //obj.ID = 0;
        const result = '';
        if (obj.reqexternalCode === '') {
            return 'Invalid Payload';
        }
        if (obj.reqcreatedOn.length === 0) {
            obj.reqcreatedOn = new Date();
        } else {
            obj.reqcreatedOn = formatTime(obj.reqcreatedOn);
        }
        obj.reqlastModified = new Date();
        let task = [];
        task.push({
            "id": 0,
            "externalCode": obj.cust_externalCode,
            "requestType": obj.reqrequestType,
            "workflowSequence": parseInt(obj.reqworkflowSequence, 10) || 0,
            "forwardSequence": parseInt(obj.reqforwardSequence, 10) || 0,
            "createdOn": obj.reqcreatedOn,
            "status.id": obj.reqstatus,
            "agent": obj.reqagent,
            "nextAgent": obj.reqnextAgent,
            "changedBy": obj.reqchangedBy,
            "lastModified": obj.reqlastModified,
            "changedByUser": obj.reqchangedByUser,
            "notificationAgent": obj.reqnotificationAgent,
            "workflow.id": obj.reqworkflow_id
        });
        let additionalInfo = '';
        if (obj.additionalInfo) {
            additionalInfo = obj.additionalInfo;
        }

        if (obj.reqrequestType === 'IT15') {
            await db.tx(async (tx) => {
                // Call the stored procedure with the table data as input
                result = await tx.run('CALL APPROVE_ONETIME(:it_req_flow, :iv_additionalInfo)', { task, additionalInfo });
                return result.ev_response;
            });
        }
        else if (obj.reqrequestType === '2004') {
            await db.tx(async (tx) => {
                // Call the stored procedure with the table data as input
                result = await tx.run('CALL APPROVE_AVAILABILITY(:it_req_flow, :iv_additionalInfo)', { task, additionalInfo });
                return result.ev_response;
            });
        }
    }
    this.on('postApprovePayments', async (req) => {
        const output = { error: [] };
        let error_message = '';
        const JSONObj = req.data; // Body of the request is automatically parsed by CAP
        try {
            const db = await cds.connect.to('db'); // Connect to the HANA database           
            const len = JSONObj.d.results.length;
            if (len > 0) {
                const payObject = JSONObj.d.results;
                error_message = '';
                for (let i; i < len; i++) {
                    payObject = JSONObj.d.results[i];
                    error_message = await approvePayments(db, payObject);

                    if ((error_message.length !== 0) || (error_message !== '')) {
                        error_message = error_message || ', External Code:' || payObject.reqexternalCode;
                        output.error.push(error_message);
                        break;
                    }
                }

                if (output.error.length === 0) {
                    // Commit transaction if no error
                    await conn.commit();
                    req.reply(output);

                } else {
                    req.error(400, JSON.stringify(output));
                }

            } else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }

        } catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });
    /**     CreateRBPGroups
     * XSJS to create multiple RBP Employees in HANA
     */
    async function createRBPEmployees(db, obj) {
        const groupLength = obj.length;
        let errorMsg = '';
        let task = [];

        for (let j = 0; j < groupLength; j++) {
            task.push({
                "id.groupID": obj[j]["id.groupID"],
                "userID": obj[j].userID
            });
        }
        await db.tx(async (tx) => {
            errorMsg = await tx.run('CALL CREATERBPEMPLOYEES(:it_employees)', { task });
            return errorMsg.ev_response;
        });
    }
    this.on('postCreateRBPEmployees', async (req) => {

        const output = { error: [] };
        let errorMessage = '';
        const JSONObj = req.data;

        try {
            const conn = await cds.connect.to('db'); // Connect to the HANA database
            let i = 0, groups = [];
            const len = JSONObj.results.length;
            if (len > 0) {
                groups = JSONObj.results;
                errorMessage = createRBPEmployees(conn, groups);

                if (errorMessage && errorMessage.length !== 0) {
                    output.error.push(errorMessage);
                    req.error(400, JSON.stringify(output));
                } else {
                    await conn.commit();
                    req.reply(output);
                }
            }
            else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }
        }

        catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });
    /**
     *      CreateRBPGroups
     */
    async function createRBPGroups(db, obj) {
        const groupLength = obj.length;
        let errorMsg = '';
        let task = [];
        for (let j = 0; j < groupLength; j++) {
            task.push({
                "groupID": obj[j].groupID,
                "groupName": obj[j].groupName,
                "userID": obj[j].userID,
                "today": obj[j].today,
                "next": obj[j].next,
                "role": obj[j].role
            });
        }
        await db.tx(async (tx) => {
            errorMsg = await tx.run('CALL CREATERBPGROUPS(:it_groups)', { task });
            return errorMsg.ev_response;
        });
    }
    this.on('postCreateRBPGroups', async (req) => {

        const output = { error: [] };
        let errorMessage = '';
        const JSONObj = req.data;

        try {
            const db = await cds.connect.to('db'); // Connect to the HANA database

            let i = 0, flag = 0, groups = [];
            const len = JSONObj.results.length;
            if (len > 0) {
                groups = JSONObj.results;
                errorMessage = await createRBPGroups(db, groups);

                if ((errorMessage.length !== 0) || (errorMessage !== '')) {
                    output.error.push(errorMessage);
                    req.error(400, JSON.stringify(output));
                }
                else {
                    await db.commit();
                    req.reply(output);
                }
            }
            else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }
        }
        catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });
    /**     DeleteRBPEmployees   
     * XSJS to delete multiple Employees in HANA
     */

    async function deleteRBPEmployees(db, obj) {
        const groupLength = obj.length;
        let errorMsg = '';
        let task = [];

        for (let j = 0; j < groupLength; j++) {
            task.push({
                "id.groupID": obj[j]["id.groupID"],
                "userID": obj[j].userID
            });
        }
        await db.tx(async (tx) => {
            errorMsg = await tx.run('CALL DELETERBPEMPLOYEES(:it_employees)', { task });
            return errorMsg.ev_response;
        });
    }
    this.on('postDeleteRBPEmployees', async (req) => {
        let output = { error: [] };
        let error_message = '';
        const JSONObj = req.data;

        try {
            conn = await cds.connect.to('db'); // Connect to the HANA database
            let groups = [];
            const len = JSONObj.results.length;
            if (len > 0) {
                groups = JSONObj.results;
                error_message = await deleteRBPEmployees(conn, groups);

                if (error_message && error_message.length !== 0) {
                    output.error.push(error_message);
                    req.error(400, JSON.stringify(output));
                }
                else {
                    await conn.commit();
                    req.reply(output);
                }
            }
            else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }
        }
        catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });
    /**
     * deleteRBPGroups
     * @param {*} db 
     * @param {*} obj 
     */
    //XSJS to delete multiple RBP Groups in HANA
    async function deleteRBPGroups(db, obj) {
        const groupLength = obj.length;
        let errorMsg = '';
        let task = [];
        for (let j = 0; j < groupLength; j++) {
            task.push({
                "groupID": obj[j].groupID,
                "groupName": obj[j].groupName,
                "userID": obj[j].userID,
                "today": obj[j].today,
                "next": obj[j].next,
                "role": obj[j].role
            });
        }
        await db.tx(async (tx) => {
            errorMsg = await tx.run('CALL DELETERBPGROUPS(:it_groups)', { task });
            return errorMsg.ev_response;
        });
    }

    this.on('postDeleteRBPGroups', async (req) => {

        const output = { error: [] };
        let error_message = '';
        const JSONObj = req.data;

        try {
            const conn = await cds.connect.to('db');
            let groups = [];
            const len = JSONObj.results.length;
            if (len > 0) {
                groups = JSONObj.results;
                error_message = await deleteRBPGroups(conn, groups);

                if (error_message && error_message.length !== 0) {
                    output.error.push(error_message);
                    req.error(400, JSON.stringify(output));
                } else {
                    // Commit transaction if no error
                    await conn.commit();
                    req.reply(output);
                }
            } else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }
        }
        catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });

    /**         DeleteRBPGroupsbyID
     * XSJS to delete multiple RBP Groups in HANA
     */
    async function deleteRBPGroupsbyID(connection, obj) {
        const groupLength = obj.length;
        let errorMsg = '';
        let task = [];
        for (let j = 0; j < groupLength; j++) {
            task.push({
                "groupID": obj[j].groupID
            });
        }
        await db.tx(async (tx) => {
            // Call the stored procedure with the table data as input
            errorMsg = await tx.run('CALL DELETEGROUPSBYID(:it_groups)', { task });
            return errorMsg.ev_response;
        });
    }



    this.on('postDeleteRBPGroupsbyID', async (req) => {

        let output = { error: [] };
        let errorMessage = '';
        const JSONObj = req.data

        try {
            const conn = $.hdb.getConnection();
            const len = JSONObj.results.length;
            if (len > 0) {
                const groups = JSONObj.results;
                errorMessage = await deleteRBPGroupsbyID(conn, groups);

                if (errorMessage && errorMessage.length !== 0) {
                    output.error.push(errorMessage);
                    req.error(400, JSON.stringify(output));
                } else {
                    await conn.commit();
                    req.reply(output);
                }
            } else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }

        } catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });
    /**
     * 
     */
    //  function formatTime(ipDate) 
    async function forwardPayments(db, obj) {
        let result = '';

        if (obj.reqexternalCode === '') {
            return 'Invalid Payload';
        }
        if (obj.reqcreatedOn.length === 0) {
            obj.reqcreatedOn = new Date();
        } else {
            obj.reqcreatedOn = formatTime(obj.reqcreatedOn);
        }
        obj.reqlastModified = new Date();
        let task = [];
        task.push({
            "id": 0,
            "externalCode": obj.cust_externalCode,
            "requestType": obj.reqrequestType,
            "workflowSequence": parseInt(obj.reqworkflowSequence, 10) || 0,
            "forwardSequence": parseInt(obj.reqforwardSequence, 10) || 0,
            "createdOn": obj.reqcreatedOn,
            "status.id": obj.reqstatus,
            "agent": obj.reqagent,
            "nextAgent": obj.reqnextAgent,
            "changedBy": obj.reqchangedBy,
            "lastModified": obj.reqlastModified,
            "changedByUser": obj.reqchangedByUser,
            "notificationAgent": obj.reqnotificationAgent,
            "workflow_id": obj.reqworkflow_id
        });
        let additionalInfo = '';
        if (obj.additionalInfo) {
            additionalInfo = obj.additionalInfo;
        }
        if (obj.reqrequestType === 'IT15') {
            await db.tx(async (tx) => {
                errorMsg = await tx.run('CALL FORWARD_ONETIMEPAY(:it_req_flow, :iv_additionalInfo)', { task, additionalInfo });
                return errorMsg.ev_response;
            });
        }
    }

    /**
     *      Forward_Payments.xsjs
     */
    this.on('postForwardPayments', async (req) => {

        let output = { error: [] };
        let errorMessage = '';
        var JSONObj = req.data

        try {
            const conn = await cds.connect.to('db');
            let i = 0, flag = 0, payObject = '';
            var len = JSONObj.d.results.length;
            if (len > 0) {
                errorMessage = '';
                for (i; i < len; i++) {
                    payObject = JSONObj.d.results[i];
                    errorMessage = await forwardPayments(conn, payObject);

                    if (errorMessage && errorMessage.length !== 0) {
                        errorMessage = errorMessage || ', External Code:' || payObject.reqexternalCode;
                        output.error.push(errorMessage);
                        req.error(400, JSON.stringify(output));
                        break;
                    }
                }

                if (output.error.length === 0) {
                    await conn.commit();
                    req.reply(output);
                }
                else {
                    req.error(400, JSON.stringify(output));
                }
            }
            else {
                output.error.push('Invalid Payload');
                req.error(400, JSON.stringify(output));
            }

        }

        catch (e) {
            req.error(400, '${e.name} : ${e.message}');
        }
    });

    /**
     *      Get_InfoTypes_WT_HCI.xsjs
     */
    this.on('POST', 'processPayComponents', async (req) => {
        const output = { it14: [], it15: [], None: [], error: [] };
        const contents = req.data;  // CSV content
        const conn = await cds.connect.to('db');
        try {
            // Process CSV and call the stored procedure or custom logic
            const records = splitCSV(contents);

            const result = await fetchPayComponentData(conn, records);

            // Handling result and populating the output
            if (result.error) {
                output.error.push(result.error);
                return req.error(400, result.error);
            }

            // Process different types of results
            result.et_infoType_14.forEach(item => output.it14.push(item.payComponent));
            result.et_infoType_15.forEach(item => output.it15.push(item.payComponent));
            result.et_infoType_None.forEach(item => output.None.push(item.payComponent));

            // Return the results
            return { Result: output };
        } catch (err) {
            output.error.push(`Error: ${err.message}`);
            return req.error(400, err.message);
        }
    });

    // Function to simulate calling a stored procedure (or custom logic)
    async function fetchPayComponentData(db, records) {
        //call HANA procedure
        const results = await db.tx.run('CALL GET_WT_INFOTYPE(:it_infoType)', { records });

        let et_infoType_14 = [], et_infoType_15 = [], et_infoType_None = [];

        // Simulated response (replace with actual database call or procedure)
        for (const record of results) {
            if (record.payComponent.startsWith('14')) {
                et_infoType_14.push({ payComponent: record.payComponent });
            } else if (record.payComponent.startsWith('15')) {
                et_infoType_15.push({ payComponent: record.payComponent });
            } else {
                et_infoType_None.push({ payComponent: record.payComponent });
            }
        }

        return {
            et_infoType_14,
            et_infoType_15,
            et_infoType_None
        };
    }

    /**
     *      Update_Users.xsjs
     */
    this.on('getPendingApprovalCount', async (req) => {
        const output = { count: 0 };  // Default output

        try {
            const userName = req.data.userName;  // Getting the userName from the request

            if (userName && userName.length > 0) {
                // Establishing connection to the database (CAP handles this)
                const db = await cds.connect.to('db');  // Replace 'hana' with the correct data source name if needed

                // Call the stored procedure to get pending approval count (custom logic)
                const procedureResult = await db.transaction(async (tx) => {
                    const result = await tx.run('CALL GET_PENDINGAPPROVAL_COUNT(:iv_user)', { userName });
                    return result[0].EV_COUNT;  // Assuming the procedure returns a result with the field EV_COUNT
                });

                output.count = procedureResult;

                return { count: output.count };
            } else {
                // Invalid user name input
                return req.error(400, 'Invalid userName');
            }
        } catch (err) {
            // Error handling
            return req.error(400, `Error: ${err.message}`);
        }
    });


    /**
     *      Update_Users.xsjs
     */
    this.on('upsertTimekeepers', async (req) => {
        const usersArray = req.data.users; // Get the users array from the request body
        const tx = await cds.transaction(); // Create a new transaction

        try {
            // Step 1: Delete non-existing users
            const existingUsersQuery = SELECT.from(VP_TIMEKEEPER)
                .where({ timeKeeper: { '=': usersArray[0]?.timekeeper } });

            const existingUsers = await tx.run(existingUsersQuery);
            let usersToDelete = [];

            // Find users that are in the database but not in the usersArray
            existingUsers.forEach(existingUser => {
                const exist = usersArray.some(user =>
                    user.timekeeper === existingUser.timeKeeper &&
                    user.userid === existingUser.userID
                );
                if (!exist) {
                    // Prepare users to delete
                    usersToDelete.push(existingUser);
                }
            });

            // Delete users not in the usersArray
            for (const userToDelete of usersToDelete) {
                await tx.delete(VP_TIMEKEEPER).where({
                    userID: userToDelete.userID,
                    timeKeeper: userToDelete.timeKeeper
                });
            }

            // Step 2: Upsert new users
            for (const user of usersArray) {
                if (user.userid && user.timekeeper && user.timekeeper.length > 2 && user.userid.length > 2) {
                    await tx.upsert(VP_TIMEKEEPER, {
                        userID: user.userid,
                        timeKeeper: user.timekeeper
                    });
                }
            }

            // Explicitly commit the transaction
            await tx.commit();  // Commit the changes

            return 'ok'; // Return success message
        } catch (error) {
            // Handle errors and rollback if necessary
            await tx.rollback();  // Rollback in case of an error
            req.error(500, 'Error processing upsertTimekeepers', error.message);
        }
    });

    /**
     *      Update_OneTimePay_HCILogs.xsjs
     */
    this.on('updateOneTimePayHCI', async (req) => {
        let body = req.data.body;
        let messages = [];
        let errorRec = [];
        let insCount = 0;
        let updCount = 0;

        try {
            let rows = body.split(/\r\n|\n/);
            let rowCount = rows.length;

            // Remove empty rows if any
            if (rows[rowCount - 1] === "") rowCount--;

            for (let i = 0; i < rowCount; i++) {
                let line = splitCSV(rows[i]);
                let colCount = 4;

                if (line.length !== colCount) {
                    errorRec.push('Invalid columns for line : ${i + 1}:: ExternalCode (${line[0]})');
                    continue;
                }

                // Fill missing values
                if (line[2].length === 0) line[2] = "2";  // Default status - errorStatus
                if (line[1].length === 0) line[1] = 'IT15'; // Default requestType

                if (line[0].length === 0) {
                    errorRec.push("Missing ExternalCode");
                } else {
                    let record = {
                        externalCode: line[0],
                        requestType: line[1],
                        status: line[2],
                        action: 9,  // Default action value - Complete
                        comments: line[3]
                    };

                    // Call the stored procedure or your business logic here
                    try {
                        let res = await cds.tx(req).run('CALL UPDATE_ONETIMEPAY_HCI(:it_hci_logs)', { record });

                        if (res.ev_response.length !== 0) {
                            errorRec.push('${line[0]} ${res.ev_response}');
                        } else {
                            messages.push(line[0]);
                            insCount += res.ev_ins_count;
                            updCount += res.ev_upd_count;
                        }
                    } catch (e) {
                        errorRec.push('Error processing ${line[0]}: ${e.message}');
                    }
                }
            }

            return {
                success: { externalCode: messages, insertedCount: insCount, updatedCount: updCount },
                error: { externalCode: errorRec }
            };

        } catch (err) {
            throw new Error(`Error processing data: ${err.message}`);
        }
    });

    /**
     *      Update_Availability_HCILogs.xsjs
     */
    this.on('updateAvailabilityHCI', async (req) => {
        let body = req.data.body;
        let messages = [];
        let errorRec = [];
        let insCount = 0, updCount = 0;

        try {
            // Split incoming CSV data into rows
            let rows = body.split(/\r\n|\n/);
            let rowCount = rows.length;

            // Remove empty rows if any
            if (rows[rowCount - 1] === "") rowCount--;

            // Iterate over each row
            for (let i = 0; i < rowCount; i++) {
                let line = splitCSV(rows[i]);
                let colCount = 4;  // Expect 4 columns

                if (line.length !== colCount) {
                    errorRec.push(`Invalid columns for line ${i + 1}:: ExternalCode (${line[0]})`);
                    continue;
                }

                // Default values
                let [externalCode, requestType, status, comments] = line;
                let reqAction = status == "3" ? 15 : 9;  // Action ID based on status
                let entries = [];

                // Query the database to check for audit logs when action = 3
                if (status == "3") {
                    const result = await cds.run(SELECT.from(VP_AUDIT_LOG)
                        .where({ externalCode })
                        .orderBy('createdOn DESC')
                        .limit(1));

                    // Process the result from the database
                    if (result.length > 0 && result[0].actionId == 15) {
                        entries.push(result[0]);
                    }
                }

                // If there are no entries, proceed with the update logic
                if (entries.length === 0) {
                    let record = {
                        externalCode,
                        requestType: requestType || '2004',
                        status: status || 2,  // Default to error status if empty
                        action: reqAction,
                        comments
                    };

                    try {
                        // Call the stored procedure to update availability  
                        const procedure = await cds.tx(req).run('CALL UPDATE_AVAILABILITY_HCI(:it_hci_logs)', { record });

                        if (procedure.ev_response.length !== 0) {
                            errorRec.push(`${externalCode} ${procedure.ev_response}`);
                        } else {
                            messages.push(externalCode);
                            insCount += procedure.ev_ins_count;
                            updCount += procedure.ev_upd_count;
                        }
                    } catch (err) {
                        errorRec.push(`Error updating ${externalCode}: ${err.message}`);
                    }
                }
            }

            return {
                success: { externalCode: messages, insertedCount: insCount, updatedCount: updCount },
                error: { externalCode: errorRec }
            };

        } catch (err) {
            throw new Error(`Error processing data: ${err.message}`);
        }
    });

    /**
     *      Submit_OneTimePay.xsjs.xsjs
     */
    this.on("POST", 'saveOneTimePay', async (req) => {
        const data = req.data;
        const response = {
            error: []
        };

        // Function to save one-time payment data
        async function saveOneTimePay(obj) {
            obj.effectiveStartDate = formatDate(obj.effectiveStartDate);
            obj.lastModified = new Date();
            obj.createdOn = obj.createdOn.length === 0 ? new Date() : formatTime(obj.createdOn);

            // Preparing the records for stored procedure
            const record = [{
                "cust_externalCode": obj.cust_externalCode,
                "cust_userId": obj.cust_userId,
                "cust_payComponent.id": obj.cust_payComponent,
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
                "country.id": obj.country,
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
                "externalCode": obj.reqexternalCode,
                "requestType": obj.reqrequestType,
                "workflowSequence": parseInt(obj.reqworkflowSequence, 10) || 0,
                "forwardSequence": parseInt(obj.reqforwardSequence, 10) || 0,
                "createdOn": obj.reqcreatedOn.length === 0 ? new Date() : formatTime(obj.reqcreatedOn),
                "status.id": obj.reqstatus,
                "agent": obj.reqagent,
                "nextAgent": obj.reqnextAgent,
                "changedBy": obj.reqchangedBy,
                "lastModified": obj.reqlastModified,
                "changedByUser": obj.reqchangedByUser,
                "notificationAgent": obj.reqnotificationAgent,
                "workflow.id": obj.reqworkflow_id
            }];

            try {
                const procedure = await cds.tx(req).run('CALL "SAVE_APP_ONTIMEPAY"(?, ?)', [record, task]);

                const errorMsg = procedure.ev_response;
                return errorMsg;

            } catch (err) {
                throw new Error(`Error in procedure: ${err.message}`);
            }
        }

        // Processing the incoming data
        try {
            const payObjects = data.d.results;
            if (payObjects.length > 0) {
                let errorMessage = '';
                for (let i = 0; i < payObjects.length; i++) {
                    const payObject = payObjects[i];
                    errorMessage = await saveOneTimePay(payObject);

                    if (errorMessage.length > 0) {
                        errorMessage = errorMessage || `UserId: ${payObject.cust_userId}, PayComponent: ${payObject.cust_payComponent}`;
                        response.error.push(errorMessage);
                        break;
                    }
                }

                if (response.error.length === 0) {
                    return { success: true };
                } else {
                    return { error: response.error };
                }
            } else {
                response.error.push('Invalid Payload');
                return { error: response.error };
            }

        } catch (err) {
            response.error.push(`${err.name}: ${err.message}`);
            return { error: response.error };
        }
    });

    /*TEST*/
    this.on('saveTest', async (req) => {
        const testval = req.data.val1;
        console.log(testval);
        let val2 = testval + " YUP";
        return val2;
    });

    // Implement the saveAppAvailability action
    this.on('saveAvailability', async (req) => {

        // Get the incoming payload
        const { results } = req.data;

        // Split the data into two parts: VP_AVAILABILITY and VP_REQUEST_FLOW
        const it_recpay = results.map(record => ({
            cust_externalCode: record.cust_externalCode || '',
            cust_userId: record.cust_userId || '',
            cust_payComponent: record.cust_payComponent || '',
            effectiveStartDate: '2025-01-01',//new Date(record.effectiveStartDate).toISOString().slice(0, 10),  // Format to YYYY-MM-DDTHH:MM:SS
            cust_startTime: record.cust_startTime || '',
            cust_endDate: '2025-01-01',//new Date(record.cust_endDate).toISOString().slice(0, 10),  // Format to YYYY-MM-DDTHH:MM:SS
            cust_endTime: record.cust_endTime || '',
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
            // Call the 'processBooks' action defined in the CDS model

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

                // Perform the insertion logic (mimicking the procedure logic)
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

        /*
        try {
            // Call the stored procedure with the parsed inputs
            await tx.run(
                `CALL "SAVE_APP_AVAILABILITY"(?, ?, ?)`,
                [it_recpay, it_req_flow, ev_response]
            );
            await tx.run(
                `CALL "ADD_REQUESTFLOW"(?, ?, ?)`,
                ['54CCEDF02982AB351900391A685FEF82', ltt_req_flow, ev_response]
            );

            // Return success response
            return { message: "Availability saved successfully." };

        } catch (error) {
            // Handle errors and return appropriate message
            return { error: `Error saving availability: ${error.message}` };
        }*/
    });


    /*
    this.on('saveAvailability', async (req) => {
        let payload = req.data.results;
        let formattedRecPay = [];

        console.log("hello: " + JSON.stringify(payload));

        if (payload.length > 0) {

            let formattedReqFlow = [];
            for (let i = 0; i < payload.length; i++) {
                const obj = payload[i];

                formattedRecPay.push({
                    "cust_externalCode": obj.cust_externalCode,
                    "cust_userId": obj.cust_userId,
                    "cust_payComponent_id": obj.cust_payComponent,
                    "effectiveStartDate": obj.effectiveStartDate,
                    "cust_startTime": obj.cust_startTime,
                    "cust_endDate": obj.cust_endDate,
                    "cust_endTime": obj.cust_endTime,
                    "cust_customString": obj.cust_customString,
                    "cust_notes": obj.cust_notes,
                    "cust_existingCode": obj.cust_existingCode,
                    "status": obj.status,
                    "lastModified": obj.lastModified,
                    "createdByUser": obj.createdByUser,
                    "country_id": obj.country,
                    "initiatorLanguage": obj.initiatorLanguage,
                    "cust_payComponent_txt": obj.cust_payComponent_txt,
                    "delimitIndicator": obj.delimitIndicator.length !== 0 ? parseInt(obj.delimitIndicator, 10) : 0,
                    "autoApproved": obj.autoApproved,
                    "createdAt": obj.createdOn,
                    "createdBy": obj.createdBy,
                    "cust_dailyWorkSchedule": obj.cust_dailyWorkSchedule,
                    "cust_dailyWorkScheduleTxt": obj.cust_dailyWorkScheduleTxt,
                    "cust_dwsGrouping": obj.cust_dwsGrouping,
                    "cust_dwsGroupingTxt": obj.cust_dwsGroupingTxt,
                    "cust_wsVariant": obj.cust_wsVariant,
                    "cust_wsVariantTxt": obj.cust_wsVariantTxt,
                    "cust_customVar1": obj.cust_customVar1,
                    "cust_customVar2": obj.cust_customVar2,
                    "cust_customVar3": obj.cust_customVar3,
                    "cust_customVar4": obj.cust_customVar4,
                    "cust_customVar5": obj.cust_customVar5,
                    "cust_customVar6": obj.cust_customVar6
                });

            }

            console.log("formattedRecPay: " + JSON.stringify(formattedRecPay));
            console.log("formattedRecPay length: " + formattedRecPay.length);

            for (let i = 0; i < payload.length; i++) {
                const item = payload[i];
                formattedReqFlow.push({
                    "id": 0,
                    "externalCode": item.cust_externalCode,
                    "workflowSequence": parseInt(item.workflowSequence, 10) || 0,
                    "forwardSequence": parseInt(item.forwardSequence, 10) || 0,
                    "requestType": item.reqrequestType,
                    "workflowSequence": parseInt(item.reqworkflowSequence, 10) || 0,
                    "forwardSequence": parseInt(item.reqforwardSequence, 10) || 0,
                    "createdOn": item.createdOn ? formatTime(item.createdOn) : new Date().toISOString(),
                    "status_id": item.reqstatus,
                    "agent": item.reqagent,
                    "nextAgent": item.reqnextAgent,
                    "changedBy": item.reqchangedBy,
                    "lastModified": item.reqlastModified,
                    "changedByUser": item.reqchangedByUser,
                    "notificationAgent": item.reqnotificationAgent,
                    "workflow_id": item.reqworkflow_id
                });
            }


            console.log("formattedReqFlow: " + JSON.stringify(formattedReqFlow));
            console.log("formattedReqFlow length: " + formattedReqFlow.length);

            // Connect to HANA database
            const db = await cds.connect.to('db');

            // Call the stored procedure with the formatted tables
            try {

                //const lv_uuid = await cds.tx(req).run('CALL "GEN_UUID"()');
                const result = await cds.tx(req).run(
                    `CALL "GEN_UUID" (?)`,  // Procedure call with output parameter placeholder
                    []  // No input parameters are needed in this case, only output
                  );
                // Call the 'processBooks' action defined in the CDS model
                
                return result.EV_UUID;

            } catch (err) {
                console.error('Error calling HANA procedure:', err);
                return { success: false, error: err.message };  // Return failure response
            }


        }


    });

    */
    /**
     *      Submit_Availability.xsjs
    
    this.on('saveAvailability', async (req) => {
        
        //const { VP_AVAILABILITY, VP_REQUEST_FLOW } = req.data.results;// Get input data from the request

        let payload = req.data.results;

        console.log("hello: "+ JSON.stringify(VP_AVAILABILITY));
        console.log("hi: "+JSON.stringify(VP_REQUEST_FLOW));
       

        try {
            // Format the date fields for the input records
           
           
            if (payload.length > 0) {



                let formattedReqFlow = [];
                let formattedRecPay = [];
                for (let i = 0; i < payload.length; i++) {
                    const item = payload[i];
                    console.log("date? " + item.effectiveStartDate);

                    formattedRecPay.push({
                        ...item,
                        "effectiveStartDate": item.effectiveStartDat,//formatDate(item.effectiveStartDate),
                        "cust_endDate": item.cust_endDate, //formatDate(item.cust_endDate),
                        "lastModified": new Date(),
                        "createdOn": item.createdOn ? formatTime(item.createdOn) : new Date().toISOString(),
                    });
                
                }

                for (let i = 0; i < payload.length; i++) {
                    const item = payload[i];
                    formattedReqFlow.push({
                        ...item,
                        "id": 0,
                        "externalCode": item.cust_externalCode,
                        "workflowSequence": parseInt(item.workflowSequence, 10) || 0,
                        "forwardSequence": parseInt(item.forwardSequence, 10) || 0
                    });
                }     
                
                console.log("formattedReqFlow: " + JSON.stringify(formattedReqFlow));
                console.log("formattedReqFlow length: " + formattedReqFlow.length);
    
                // Connect to HANA database
                const db = await cds.connect.to('db');
    
                // Call the stored procedure with the formatted tables
                const result = await db.run(
                    `CALL SAVE_APP_AVAILABILITY(:it_recpay, :it_req_flow, :ev_response)`,
                    {
                        it_recpay: formattedRecPay,
                        it_req_flow: formattedReqFlow,
                        ev_response: null
                    }
                );
    
                // Return the response (ev_response from the procedure)
                return result[0].EV_RESPONSE;

            } 


        } catch (err) {
            // Handle any errors and return an appropriate response
            return `Error: ${err.message}`;
        }
    }); */


    /**
     *      Reject_Payments.xsjs
     */
    async function rejectPayments(req, obj) {
        if (obj.reqexternalCode === '') {
            return 'Invalid Payload';
        }
        if (obj.reqcreatedOn.length === 0) {
            obj.reqcreatedOn = new Date();
        } else {
            obj.reqcreatedOn = formatTime(obj.reqcreatedOn);
        }
        obj.reqlastModified = new Date();

        const task = {
            id: 0,
            externalCode: obj.cust_externalCode,
            requestType: obj.reqrequestType,
            workflowSequence: parseInt(obj.reqworkflowSequence, 10) || 0,
            forwardSequence: parseInt(obj.reqforwardSequence, 10) || 0,
            createdOn: obj.reqcreatedOn,
            status: obj.reqstatus,
            agent: obj.reqagent,
            nextAgent: obj.reqnextAgent,
            changedBy: obj.reqchangedBy,
            lastModified: obj.reqlastModified,
            changedByUser: obj.reqchangedByUser,
            notificationAgent: obj.reqnotificationAgent,
            workflow_id: obj.reqworkflow_id
        };

        const additionalInfo = obj.additionalInfo || '';

        let procedureResult;
        if (obj.reqrequestType === 'IT15') {
            procedureResult = await cds.tx(req).run('CALL "REJECT_ONETIMEPAY"(?, ?)', [obj, task]);
        } else if (obj.reqrequestType === '2004') {
            procedureResult = await cds.tx(req).run('CALL "REJECT_AVAILABILITY"(?, ?)', [obj, task]);
        }

        return procedureResult.ev_response;
    }

    this.on('rejectPayments', async (req) => {
        const { data } = req; // incoming data from the request body
        let errorMessage = '';
        let errors = [];

        if (data.length > 0) {
            for (const payObject of data) {
                // Process the payment rejection
                errorMessage = await rejectPayments(req.context, payObject);

                if (errorMessage) {
                    errorMessage = errorMessage || `, External Code: ${payObject.reqexternalCode}`;
                    errors.push(errorMessage);
                    break;
                }
            }
        } else {
            errors.push('Invalid Payload');
        }

        if (errors.length > 0) {
            return req.reject(400, errors.join(', '));
        } else {
            return { status: 'success' };
        }
    });


    /**
     *      Is_HRADMIN.xsjs
     */
    this.on('checkAdmin', async (req) => {
        const { userID } = req.data;
        let result = {};

        try {
            if (!userID || userID.length === 0) {
                // If the userID is empty or invalid, return false and status 400
                result.isHRAdmin = false;
                return req.error(400, 'Invalid userID provided');
            }

            // Load the connection from CDS context
            const db = await cds.connect.to('db'); // Make sure db is configured in your CDS service configuration
            const oProcedure = await cds.tx(req).run('CALL "IS_HRADM"(?, ?)', [userID]);

            // Check the result from the procedure
            if (oProcedure.ev_result === 0) {
                result.isHRAdmin = false;
            } else {
                result.isHRAdmin = true;
            }

            return result;

        } catch (error) {
            // In case of any error, log it and return the error message
            result.isHRAdmin = `${error.name} : ${error.message}`;
            return req.error(400, result.isHRAdmin);
        }
    });

    // Helper function to split CSV data
    String.prototype.splitCSV2 = function (sep) {
        let foo = this.split(sep || ",");
        for (let x = foo.length - 1, tl; x >= 0; x--) {
            if (foo[x].replace(/"\s+$/, '"').charAt(foo[x].length - 1) === '"') {
                if ((tl = foo[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) === '"') {
                    foo[x] = foo[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
                } else if (x) {
                    foo.splice(x - 1, 2, [foo[x - 1], foo[x]].join(sep));
                } else {
                    foo = foo.shift().split(sep).concat(foo);
                }
            } else {
                foo[x].replace(/""/g, '"');
            }
        }
        return foo;
    };


    /**
     *      Ins_User_Dtls.xsjs
     */
    this.on('uploadUsers', async (req) => {
        const fileContent = req.data.fileContent;
        const messages = [];
        const records = [];
        const colCount = 14;
        let rowCount = 0;

        try {
            // Split the input file content into lines
            const arrLines = fileContent.split(/\r\n|\n/);
            rowCount = arrLines.length;

            // Remove any empty trailing line
            if (arrLines[rowCount - 1] === "") {
                rowCount -= 1;
            }

            // Process each line
            for (let i = 0; i < rowCount; i++) {
                const line = arrLines[i].splitCSV2(',');
                if (line.length !== colCount) {
                    messages.push(`Invalid columns for line: ${i + 1}`);
                    return req.error(400, messages.join(", "));
                }

                // Extract columns and map to the record format
                const col = line.splice(0, colCount);
                records.push({
                    userID: col[0],
                    userName: col[1],
                    employeeID: col[2],
                    firstName: col[3],
                    lastName: col[4],
                    middleName: col[5],
                    email: col[6],
                    custom15: col[7],
                    defaultLocale: col[8],
                    status: col[9],
                    customManager: col[10],
                    hr: col[11],
                    manager: col[12],
                    lastModified: col[13]
                });
            }

            // Call stored procedure to insert records
            const db = await cds.connect.to('db'); // Ensure database connection
            const result = await cds.tx(req).run('CALL "CREATEUSER"(?)', [records]);

            // Check for errors from the procedure response
            if (result.et_error && result.et_error.length > 0) {
                messages.push(result.et_error);
                return req.error(400, messages.join(", "));
            } else {
                messages.push(`Upload successful, ${rowCount} Lines inserted`);
                return { result: messages };
            }
        } catch (err) {
            // Handle any errors during the process
            messages.push(`Error in line - ${rowCount}: ${err.message}`);
            return req.error(400, messages.join(", "));
        }
    });

    /**
     *     Ins_EmpJob_Dtls.xsjs
     */
    this.on('uploadEmployees', async (req) => {
        const fileContent = req.data.fileContent;
        const messages = [];
        const records = [];
        const colCount = 4;
        let rowCount = 0;

        try {
            // Split the input file content into lines
            const arrLines = fileContent.split(/\r\n|\n/);
            rowCount = arrLines.length;

            // Remove any empty trailing line
            if (arrLines[rowCount - 1] === "") {
                rowCount -= 1;
            }

            // Process each line
            for (let i = 0; i < rowCount; i++) {
                const line = arrLines[i].splitCSV2(',');
                if (line.length !== colCount) {
                    messages.push(`Invalid columns for line: ${i + 1}`);
                    return req.error(400, messages.join(", "));
                }

                // Extract columns and map to the record format
                const col = line.splice(0, colCount);
                records.push({
                    userID: col[0],
                    countryOfCompany: col[1],
                    company: col[2],
                    lastModified: col[3]
                });
            }

            // Call stored procedure to insert records
            const db = await cds.connect.to('db'); // Ensure database connection CREATEEMPJOB
            const result = await cds.tx(req).run('CALL "CREATEEMPJOB"(?)', [records]);

            // Check for errors from the procedure response
            if (result.et_error && result.et_error.length > 0) {
                messages.push(result.et_error);
                return req.error(400, messages.join(", "));
            } else {
                messages.push(`Upload successful, ${rowCount} Lines inserted`);
                return { result: messages };
            }
        } catch (err) {
            // Handle any errors during the process
            messages.push(`Error in line - ${rowCount}: ${err.message}`);
            return req.error(400, messages.join(", "));
        }
    });

    /**
     *     GetWagetypes.xsjs
     */
    this.on('getPayComponents', async (req) => {
        const { company, infotype, country, initiator, language } = req.data;

        const responseArray = [];
        const payComponentsAvailableInLocalLanguage = {};

        const db = await cds.connect.to('db'); // Ensure you're connected to the database

        // Function to execute the query and process the result
        const executeQuery = async (query, params) => {
            const result = await db.run(query, params);
            return result;
        };

        // Helper function to build query for 'en_US' data
        const get_En_Data = async () => {
            const query = `
                SELECT 
                    "currency",
                    "description",
                    "infoType",
                    "isIndEval",
                    "is_AmountType",
                    "is_QuotaCompensation",
                    "is_SpecialRecognitionType",
                    "payComponent",
                    "uom",
                    "wagetype",
                    "workflow_id",
                    "language",
                    "SUB_INFOTYPE",
                    "delimitIndicator",
                    "cust_frequency",
                    "cust_frequency_txt"
                FROM "CV_ACTIVE_WAGETYPES_TEXT_BasedOnLocale"
                WHERE "language" = 'en_US' 
                  AND "is_QuotaCompensation" = 0
                  AND "SUB_INFOTYPE" = ''
                  AND "company" = ? 
                  AND "infotype" = ?
                  AND "country" = ?
                  AND "initiator" = ?`;

            const result = await executeQuery(query, [company, infotype, country, initiator]);

            result.forEach(row => {
                const temp = {
                    currency: row.currency,
                    description: row.description,
                    infoType: row.infoType,
                    isIndEval: row.isIndEval,
                    is_AmountType: row.is_AmountType ? parseInt(row.is_AmountType) : null,
                    is_QuotaCompensation: row.is_QuotaCompensation,
                    is_SpecialRecognitionType: row.is_SpecialRecognitionType,
                    payComponent: row.payComponent,
                    uom: row.uom,
                    wagetype: row.wagetype,
                    workflow_id: row.workflow_id,
                    delimitIndicator: row.delimitIndicator,
                    cust_frequency: row.cust_frequency,
                    cust_frequency_txt: row.cust_frequency_txt
                };

                // Only add unique payComponents to the response
                if (!payComponentsAvailableInLocalLanguage[temp.payComponent]) {
                    payComponentsAvailableInLocalLanguage[temp.payComponent] = temp.payComponent;
                    responseArray.push(temp);
                }
            });
        };

        // Helper function to build query for localized data
        const get_Local_Data = async (locale) => {
            const query = `
                SELECT 
                    "currency",
                    "description",
                    "infoType",
                    "isIndEval",
                    "is_AmountType",
                    "is_QuotaCompensation",
                    "is_SpecialRecognitionType",
                    "payComponent",
                    "uom",
                    "wagetype",
                    "workflow_id",
                    "language",
                    "SUB_INFOTYPE",
                    "delimitIndicator",
                    "cust_frequency",
                    "cust_frequency_txt"
                FROM CV_ACTIVE_WAGETYPES_TEXT_BasedOnLocale
                WHERE "language" = ? 
                  AND "is_QuotaCompensation" = 0
                  AND "SUB_INFOTYPE" = ''
                  AND "company" = ? 
                  AND "infotype" = ?
                  AND "country" = ?
                  AND "initiator" = ?`;

            const result = await executeQuery(query, [locale, company, infotype, country, initiator]);

            result.forEach(row => {
                const temp = {
                    currency: row.currency,
                    description: row.description,
                    infoType: row.infoType,
                    isIndEval: row.isIndEval,
                    is_AmountType: row.is_AmountType ? parseInt(row.is_AmountType) : null,
                    is_QuotaCompensation: row.is_QuotaCompensation,
                    is_SpecialRecognitionType: row.is_SpecialRecognitionType,
                    payComponent: row.payComponent,
                    uom: row.uom,
                    wagetype: row.wagetype,
                    workflow_id: row.workflow_id,
                    delimitIndicator: row.delimitIndicator,
                    cust_frequency: row.cust_frequency,
                    cust_frequency_txt: row.cust_frequency_txt
                };

                // Only add unique payComponents to the response
                if (!payComponentsAvailableInLocalLanguage[temp.payComponent]) {
                    payComponentsAvailableInLocalLanguage[temp.payComponent] = temp.payComponent;
                    responseArray.push(temp);
                }
            });
        };

        // Main execution logic
        try {
            if (language === 'en_US') {
                await get_En_Data();
                // Get available languages for the country and fetch local data
                const langQuery = `
                    SELECT DISTINCT "language"
                    FROM CV_ACTIVE_WAGETYPES_TEXT_BasedOnLocale
                    WHERE "language" != 'en_US'
                      AND "company" = ?
                      AND "infotype" = ?
                      AND "country" = ?
                      AND "initiator" = ?`;

                const availableLanguages = await executeQuery(langQuery, [company, infotype, country, initiator]);

                if (availableLanguages.length > 0) {
                    await get_Local_Data(availableLanguages[0].language);
                }
            } else {
                // If the language is not 'en_US', fetch local and English data
                await get_Local_Data(language);
                await get_En_Data();
            }

            return { results: responseArray };
        } catch (e) {
            req.error(500, `Error executing query: ${e.message}`);
        }
    });

    /**
     *     Get_WageTypesV1_1.xsjs
     */
    const executeQuery = async (company, infotype, country, initiator, subInfoType, language) => {
        const db = await cds.connect.to('db');  // Connecting to the database (HANA)
        const query = `
            SELECT "currency", "description", "infoType", "isIndEval", "is_AmountType",
                   "is_QuotaCompensation", "is_SpecialRecognitionType", "payComponent", "uom", 
                   "wagetype", "workflow_id", "language"
            FROM "CV_ACTIVE_WAGETYPES_TEXT_V1_1"
            (placeholder."$$IP_COMPANY_CODE$$" => ?, placeholder."$$IP_INFOTYPE$$" => ?, 
             placeholder."$$IP_COUNTRY$$" => ?, placeholder."$$IP_INITIATOR$$" => ?, 
             placeholder."$$IP_SUB_INFOTYPE$$" => ?)
            WHERE "language" = ?`;

        try {
            const result = await db.run(query, [company, infotype, country, initiator, subInfoType, language]);
            return result;
        } catch (err) {
            console.error("Error executing query:", err);
            throw new Error("Failed to execute query");
        }
    };

    // Define the service operation for the PayComponentService
    this.on('getPayComponentData', async (req) => {
        const { company, infotype, country, initiator, subInfoType, language } = req.data;
        let responseArray = [];

        try {
            // Fetch the data based on the input parameters
            const results = await executeQuery(company, infotype, country, initiator, subInfoType, language);
            // Process results to prepare response
            results.forEach(row => {
                let temp = {
                    currency: row.currency,
                    description: row.description,
                    infoType: row.infoType,
                    isIndEval: row.isIndEval,
                    isAmountType: row.is_AmountType ? parseInt(row.is_AmountType) : null,
                    isQuotaCompensation: row.is_QuotaCompensation,
                    isSpecialRecognition: row.is_SpecialRecognitionType,
                    payComponent: row.payComponent,
                    uom: row.uom,
                    wagetype: row.wagetype,
                    workflow_id: row.workflow_id,
                    language: row.language
                };

                // Avoid duplicate pay components
                if (!payComponentsAvailableInLocalLanguage[temp.payComponent]) {
                    payComponentsAvailableInLocalLanguage[temp.payComponent] = temp.payComponent;
                    responseArray.push(temp);
                }
            });

            // Return the results in the expected format
            return { results: responseArray };
        } catch (err) {
            req.error(500, `Error fetching data: ${err.message}`);
        }
    });


});

