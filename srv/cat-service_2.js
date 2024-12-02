const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { User } = this.entities;
    const { EmpJob } = this.entities;

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

    /**
     *      Add:auditLogs
     */

    // Local function to format the timestamp
    function formatTime(ipDate) {
        const ldate = ipDate;
        const dateString = ldate.substring(6);
        const parsedDate = parseInt(dateString, 10);
        const d = new Date(parsedDate);
        return d.toISOString();
    }
    // Local function to process log entries and call the procedure
    async function addLogs(db, obj) {
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
        await db.tx(async (tx) => {
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

            const len = JSONObj.d.results.length;
            if (len > 0) {
                const payObject = JSONObj.d.results;
                error_message = await addLogs(db, payObject);

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






});