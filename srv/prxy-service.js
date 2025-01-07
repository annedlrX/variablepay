const cds = require('@sap/cds');

const { loggedInUser, getApprovalService, setRoleValue, getRoleName } = require('./common/common');
const { saveAvailability,
    getCurrentUser,
    processWorkflow,
    sendEmailPayload,
    getWorkflowTemplate,
    saveOneTimePay} = require('./common/functionsHANA');

module.exports = cds.service.impl(async (srv) => {

    const service = await cds.connect.to('FoundationPlatformPLT');
    const { VP_USER, WorkflowTemplate } = srv.entities;
    const { USERDETAILS } = srv.entities;
    const { VP_EMAIL_TEMPLATES, VP_MAP_EMAIL_PARAMETERS } = srv.entities;

    srv.on('User', async req => {
        console.log(loggedInUser);
        return loggedInUser(req);
    })

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



