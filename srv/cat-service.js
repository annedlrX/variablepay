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

    //XSJS

    //Add:auditLogs

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

});