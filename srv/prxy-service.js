const cds = require('@sap/cds');

const { loggedInUser, getApprovalService, setRoleValue, getRoleName } = require('./common/common');
const { saveAvailability,
    getCurrentUser,
    processWorkflow,
    sendEmailPayload,
    getWorkflowTemplate,
    saveOneTimePay,
    getCurrentUserDetails} = require('./common/functionsHANA');

module.exports = cds.service.impl(async (srv) => {

    const service = await cds.connect.to('FoundationPlatformPLT');
    const foService = await cds.connect.to('ECFoundationOrganization');
    const empService = await cds.connect.to('ECEmploymentInformation'); 
    const { VP_USER, WorkflowTemplate } = srv.entities;
    const { USERDETAILS, MassWageTypes, UserSelection, VP_REQUEST_FLOW, VP_RBP_GROUPS } = srv.entities;
    const { VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, VP_UOM_TEXT } = srv.entities;

    srv.on('User', async req => {
        console.log(loggedInUser);
        return loggedInUser(req);
    })

//EC SERVICES

    srv.on('Currency', async (req) => {
        try {
            const response = await service.tx(req).send({
                method: 'GET',
                path: `Currency?$format=json&$filter=status%20eq%20'A'`
            });
            
            if (!response || response.length === 0) {
                console.log('Error: Empty response received from the service.');
                return { error: 'No data available' };
            }
            
            return response;
        } catch (error) {
            console.log('Error fetching currency data:', error.message);
            return { error: 'Unable to fetch currency data' };
        }
    });

    srv.on('AltCostCenter', async (req) => {
        try {
            const response = await foService.tx(req).send({
                method: 'GET',
                path: `FOCostCenter?$format=json&$filter=status%20eq%20'A'`
            });
            
            if (!response || response.length === 0) {
                console.log('Error: Empty response received from the service.');
                return { error: 'No data available' };
            }
            
            return response;
        } catch (error) {
            console.log('Error fetching FOCostCenter data:', error.message);
            return { error: 'Unable to fetch FOCostCenter data' };
        }
    });

    srv.on('FOCompany', async (req) => {
        try {
            const response = await foService.tx(req).send({
                method: 'GET',
                path: `FOCompany?$format=json&$filter=status%20eq%20'A'&$select=externalCode,name`
            });
            
            if (!response || response.length === 0) {
                console.log('Error: Empty response received from the service.');
                return { error: 'No data available' };
            }
            
            return response;
        } catch (error) {
            console.log('Error fetching FOCompany data:', error.message);
            return { error: 'Unable to fetch FOCompany data' };
        }
    });

    srv.on('PayGroup', async (req) => {
        try {
            const response = await foService.tx(req).send({
                method: 'GET',
                path: `FOPayGroup?$format=json&$filter=status%20eq%20'A'`
            });
            
            if (!response || response.length === 0) {
                console.log('Error: Empty response received from the service.');
                return { error: 'No data available' };
            }
            
            return response;
        } catch (error) {
            console.log('Error fetching FOPayGroup data:', error.message);
            return { error: 'Unable to fetch FOPayGroup data' };
        }
    });

    srv.on('isExpat', async (req) => {
        try {
            const userId = loggedInUser(req);// Assuming authentication provides user ID
            if (!userId) {
                console.log('Error: Missing userId.');
                return { status: 400, error: 'userId parameter is required' };
            }

            const response = await empService.tx(req).send({
                method: 'GET',
                path: `EmpJob?$select=userId,employeeClass,employeeClassNav/picklistLabels&$filter=userId%20eq%20'${userId}'&$format=json&$expand=employeeClassNav/picklistLabels`
            });

            if (!response || response?.length === 0) {
                console.log('Error: Empty response received from the service.');
                return { status: 404, isExpat: false, error: 'No data available' };
            }

            let isExpat = false;
            for (const empData of response) {
                if (empData.employeeClassNav?.picklistLabels) {
                    for (const label of empData.employeeClassNav.picklistLabels) {
                        if (label.label.toLowerCase().includes('impat')) {
                            isExpat = true;
                            break;
                        }
                    }
                }
                if (isExpat) break;
            }

            return { status: 200, isExpat };
        } catch (error) {
            console.log('Error checking global assignment status:', error.message);
            return { status: 500, error: 'Unable to determine global assignment status' };
        }
    });
    
//HANA SERVICES
    srv.on('UOM', async (req) => { // HANA
        const locale = req.data.locale;
    
        // If locale is missing, log the error and return a response
        if (!locale) {
            console.error('Locale parameter is missing');
            return { status: 400, message: 'Locale parameter is missing' };
        }
    
        try {
            // Query the VP_UOM_TEXT entity filtered by locale
            const result = await srv.run(
                SELECT.from(VP_UOM_TEXT).where({ locale: locale })
            );
    
            // If no records found, log and return a message
            if (result.length === 0) {
                console.error(`No records found for locale: ${locale}`);
                return {status: 404, message: `No records found for locale: ${locale}` };
            }
    
            // Return success with the fetched data
            return { status: 200, data: result };
        } catch (error) {
            // Log the error and return a generic error message
            console.error('Error fetching UOM data:', error);
            return { status: 500, message: 'An error occurred while fetching UOM data' };
        }
    });

    srv.on('LoggedInUser', async (req) => { // HANA
        
        const userId = loggedInUser(req);// Assuming authentication provides user ID
            if (!userId) {
                console.log('Error: Missing userId.');
                return { status: 400, error: 'userId parameter is required' };
            }
    
        try {
            const tx = await cds.tx(req);

            // Fetch initiator roles
            const user = await getCurrentUserDetails(userId, USERDETAILS, tx);

            return { status: 200, user };
        } catch (error) {
            // Log the error and return a generic error message
            console.error('Error fetching LoggedInUser data:', error);
            return { status: 500, message: 'An error occurred while fetching LoggedInUser data' };
        }
    });

    srv.on('MassWTList', async (req) => { // HANA
        const reqType = req.data.reqType;
    
        // If reqType is missing, log the error and return a response
        if (!reqType) {
            console.error('reqType parameter is missing');
            return { status: 400, message: 'reqType parameter is missing' };
        }
    
        try {
            // Query the MassWageTypes entity with the required filters
            const result = await srv.run(
                SELECT.from(MassWageTypes).where({
                    INFOTYPE: reqType,
                    IS_SPECIALRECOGNITIONTYPE: 0,
                    IS_QUOTACOMPENSATION: 0
                })
            );
    
            // If no records found, log and return a message
            if (result.length === 0) {
                console.error(`No records found with the specified filters.`);
                return { status: 404, message: `No records found.` };
            }
    
            // Return success with the fetched data
            return { status: 200, data: result };
        } catch (error) {
            // Log the error and return a generic error message
            console.error('Error fetching MassWageTypes data:', error);
            return { status: 500, message: 'An error occurred while fetching MassWageTypes data' };
        }
    });

    srv.on('EmpSelection', async (req) => { // HANA
        
        const userId = loggedInUser(req);// Assuming authentication provides user ID
            if (!userId) {
                console.log('Error: Missing userId.');
                return { status: 400, error: 'userId parameter is required' };
            }
    
        try {
            const tx = await cds.tx(req);

            // Fetch current user details
            const user = await getCurrentUserDetails(userId, USERDETAILS, tx);

            return { status: 200, user };
        } catch (error) {
            // Log the error and return a generic error message
            console.error('Error fetching LoggedInUser data:', error);
            return { status: 500, message: 'An error occurred while fetching LoggedInUser data' };
        }
    });

    srv.on('ApprovalCount', async (req) => {

        const userId = loggedInUser(req);// Assuming authentication provides user ID
            if (!userId) {
                console.log('Error: Missing userId.');
                return { status: 400, error: 'userId parameter is required' };
            }

        try {
            // Query to count rows matching the criteria
            const result = await cds.run(
                SELECT.from(VP_REQUEST_FLOW)
                    .columns(['count(*) as count'])
                    .where({ agent: { like: userId }, status_id: 1 })
            );

            // Extract the count
            const count = result[0]?.count || 0;

            return { status: 200, count: count };
        } catch (error) {
            console.error('Error fetching request count:', error);
            return { status: 500, message: 'An error occurred while fetching request count' };
        }
    });

    srv.on('isHRAdmin', async (req) => {
        const userId = loggedInUser(req);// Assuming authentication provides user ID
            if (!userId) {
                console.log('Error: Missing userId.');
                return { status: 400, error: 'userId parameter is required' };
            }

        try {
            const HRADMIN_ROLE = 'HRADMIN'; // Equivalent to lc_hradmin

            // Query to count rows where USERID matches and ROLE = 'HRADMIN'
            const result = await cds.run(
                SELECT.from(VP_RBP_GROUPS)
                    .columns(['count(*) as count'])
                    .where({ userID: userId, role: HRADMIN_ROLE })
            );

            const count = result[0]?.count || 0;

            return { status: 200, isHRAdmin: count > 0 };
        } catch (error) {
            console.error('Error checking HR Admin role:', error);
            return { status: 500, message: 'An error occurred while checking HR Admin role' };
        }
    });

    srv.on('OneTimePayHANA', async (req) => {
        const records = req.data.results;
        try {
            const userId = loggedInUser(req);
            const tx = await cds.tx(req);

            // Fetch initiator roles
            const currentUserDetails = await getCurrentUser(userId, VP_USER, tx);

            // Call Hana function to get approval URL
            const approvalURL = await getApprovalService();

            // Process payload items asynchronously
            const promises = records.map(async (payload) => {
                const payloadStr = JSON.stringify(payload);
                console.log('OneTimePayHANA payload : ' + payloadStr);
                return processOneTimePay(payload, userId, currentUserDetails, "", approvalURL, USERDETAILS, tx);
            });

            // Wait for all async operations to finish
            await Promise.all(promises);

            // Return response if all actions are completed
            return { response: 'Success' };

        } catch (error) {
            console.error('Error in postOneTimePayHANA:', error);
            throw new Error('Error processing one time pay request');
        }
    });

    async function processOneTimePay(payload, userId, currentUserDetails, extra, approvalURL, entity, tx) {
        try {

            const payloadRole = getRoleName(payload.role);
            const sWagetype = payload.cust_payComponent;

            const isRoleValid = true; // Assume role validation is done in ECFunctions.validateRole (to be implemented)

            if (isRoleValid) {
                // Make get workflow details

                const wfTemplate = await getWorkflowTemplate('IT15', payloadRole, sWagetype, WorkflowTemplate, tx)

                if (wfTemplate.length > 0) {

                    const updatedPayload = await processWorkflow(payload, wfTemplate, "", "IT15", currentUserDetails, entity, tx);

                    // Create IT15 record and send email notification
                    const result = await createOneTimePay(updatedPayload, tx);
                    if (result.success) {
                        await sendEmailPayload(updatedPayload, "", approvalURL, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, USERDETAILS, tx);
                        tx.commit();
                        return result;
                    } else {
                        console.error('IT15 Record creation failed for payload:', updatedPayload);
                        tx.rollback();
                        return result;
                    }
                } else {
                    tx.rollback();
                    console.error('Workflow configuration not found for payload:', payload);
                }
            } else {
                tx.rollback();
                console.error('Invalid role for initiator:', payloadRole);
            }
        } catch (error) {
            tx.rollback();
            console.error('Error in processing one-time pay:', error);
            throw new Error('Error in processing one-time pay request'); xdcfghj 
        }
    }

    async function createOneTimePay(payload, tx) {

        const response = {
            message: []
        };

        // Processing the incoming data
        try {
            if (payload) {
                let msg = '';

                console.log("createOneTimePay record: " + JSON.stringify(payload));

                // Assuming saveOneTimePay returns a message object
                msg = await saveOneTimePay(payload, tx);

                // Check if msg contains the success message
                if (msg && msg.message) {
                    // Add additional info
                    let successMsg = `${msg.message} UserId: ${payload.cust_userId}, PayComponent: ${payload.cust_payComponent}`;
                    response.message.push(successMsg);
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
    }

    srv.on('AvailabilityHANA', async (req) => {
        const records = req.data.results;
        try {
            const userId = loggedInUser(req);
            const tx = await cds.tx(req);

            // Fetch initiator roles
            const currentUserDetails = await getCurrentUser(userId, VP_USER, tx);

            // Call Hana function to get approval URL
            const approvalURL = await getApprovalService();

            // Process payload items asynchronously
            const promises = records.map(async (payload) => {
                const payloadStr = JSON.stringify(payload);
                console.log('AvailabilityHANA payload : ' + payloadStr);
                return processAvailability(payload, userId, currentUserDetails, "", approvalURL, USERDETAILS, tx);
            });

            // Wait for all async operations to finish
            await Promise.all(promises);

            // Return response if all actions are completed
            return { response: 'Success' };

        } catch (error) {
            console.error('Error in postAvailabilityHANA:', error);
            throw new Error('Error processing availability request');
        }
    });

    async function processAvailability(payload, userId, currentUserDetails, extra, approvalURL, entity, tx) {
        try {

            const payloadRole = getRoleName(payload.role);
            const sWagetype = payload.cust_payComponent;

            const isRoleValid = true; // Assume role validation is done in ECFunctions.validateRole (to be implemented)

            if (isRoleValid) {
                // Make get workflow details

                const wfTemplate = await getWorkflowTemplate('2004', payloadRole, sWagetype, WorkflowTemplate, tx)

                if (wfTemplate.length > 0) {

                    const updatedPayload = await processWorkflow(payload, wfTemplate, "", "2004", currentUserDetails, entity, tx);

                    // Create IT15 record and send email notification
                    const result = await createAvailability(updatedPayload, tx);
                    if (result.success) {
                        await sendEmailPayload(updatedPayload, "", approvalURL, VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS, USERDETAILS, tx);
                        tx.commit();
                        return result;
                    } else {
                        console.error('IT2004 Record creation failed for payload:', updatedPayload);
                        tx.rollback();
                        return result;
                    }
                } else {
                    tx.rollback();
                    console.error('Workflow configuration not found for 2004 payload:', payload);
                }
            } else {
                tx.rollback();
                console.error('Invalid role for initiator:', payloadRole);
            }
        } catch (error) {
            tx.rollback();
            console.error('Error in processing one-time pay:', error);
            throw new Error('Error in processing one-time pay request'); xdcfghj 
        }
    }

    async function createAvailability(payload, tx) {

        const response = {
            message: []
        };

        // Processing the incoming data
        try {
            if (payload) {
                let msg = '';

                console.log("createAvailability record: " + JSON.stringify(payload));

                // Assuming createAvailability returns a message object
                msg = await saveAvailability(payload, tx);

                // Check if msg contains the success message
                if (msg && msg.message) {
                    // Add additional info
                    let successMsg = `${msg.message} UserId: ${payload.cust_userId}, PayComponent: ${payload.cust_payComponent}`;
                    response.message.push(successMsg);
                }


                if (response.message.length !== 0) {
                    return { success: response.message };
                } else {
                    response.message.push('IT2004 Payload not posted');
                    return { error: response.message };
                }
            } else {
                response.message.push('Invalid IT2004 Payload');
                return { error: response.message };
            }

        } catch (err) {
            response.message.push(`${err.name}: ${err.message}`);
            return { error: response.message };
        }
    }

})



