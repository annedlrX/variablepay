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


});