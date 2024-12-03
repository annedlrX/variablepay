const cds = require('@sap/cds');
const { formatTime, formatDate, splitCSV } = require('./helper/formatter');

module.exports = cds.service.impl(async function () {
    const { User } = this.entities;
    const { EmpJob } = this.entities;
    const { VP_TIMEKEEPER } = this.entities;
    const { VP_AUDIT_LOG } = this.entities;


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
            "workflow.id": obj.reqworkflow_id
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
    this.on('saveOneTimePay', async (req) => {
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

    /**
     *      Submit_Availability.xsjs
     */
    this.on('saveAvailability', async (req) => {
        const data = req.data; // Get input data from the request

        const response = {
            success: true,
            message: '',
            error: ''
        };
        let resp = [];

        if (data.length > 0) {
            for (let payObject of data) {
                // Format dates and times
                payObject.effectiveStartDate = formatDate(payObject.effectiveStartDate);
                payObject.cust_endDate = formatDate(payObject.cust_endDate);
                payObject.lastModified = new Date();
                payObject.createdOn = payObject.createdOn.length === 0 ? new Date() : formatTime(payObject.createdOn);

                if (payObject.reqcreatedOn.length === 0) {
                    payObject.reqcreatedOn = new Date();
                } else {
                    payObject.reqcreatedOn = formatTime(payObject.reqcreatedOn);
                }

                payObject.reqlastModified = new Date();

                const task = {
                    id: 0,
                    externalCode: payObject.reqexternalCode,
                    requestType: payObject.reqrequestType,
                    workflowSequence: parseInt(payObject.reqworkflowSequence, 10) || 0,
                    forwardSequence: parseInt(payObject.reqforwardSequence, 10) || 0,
                    createdOn: payObject.reqcreatedOn,
                    status: payObject.reqstatus,
                    agent: payObject.reqagent,
                    nextAgent: payObject.reqnextAgent,
                    changedBy: payObject.reqchangedBy,
                    lastModified: payObject.reqlastModified,
                    changedByUser: payObject.reqchangedByUser,
                    notificationAgent: payObject.reqnotificationAgent,
                    workflow_id: payObject.reqworkflow_id
                };

                try {
                    // Call the procedure (assuming you have a custom procedure)
                    const result = await cds.tx(req).run('CALL "SAVE_APP_AVAILABILITY"(?, ?)', [record, task]);
                    response.message = result.message;
                } catch (error) {
                    response.success = false;
                    response.error = error.message || 'Unknown error occurred';
                }
                resp.push(response);

            }
        }

        return resp; // CAP will return this object as a JSON response
    });

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

