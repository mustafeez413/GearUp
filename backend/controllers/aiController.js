const dialogflow = require('@google-cloud/dialogflow');
const { v4: uuidv4 } = require('uuid');

// Send message to Dialogflow
// POST /api/ai/chat
// Public
exports.chatWithAI = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Please provide a message' });
        }

        const projectId = process.env.DIALOGFLOW_PROJECT_ID;
        const sessionId = uuidv4();

        // Robust Private Key Parsing
        const privateKey = process.env.DIALOGFLOW_PRIVATE_KEY
            ? process.env.DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        // Check if configuration exists
        if (!projectId || !process.env.DIALOGFLOW_CLIENT_EMAIL || !privateKey) {
            // Mock response if Dialogflow is not configured
            return res.status(200).json({
                success: true,
                data: {
                    reply: `[MOCK] You said: "${message}". Please configure DIALOGFLOW_PROJECT_ID, DIALOGFLOW_CLIENT_EMAIL, and DIALOGFLOW_PRIVATE_KEY in .env.`,
                    intent: 'Mock Intent'
                }
            });
        }

        console.log("=== Dialogflow Live Init Diagnostics ===");
        console.log("Project ID detected:", !!process.env.DIALOGFLOW_PROJECT_ID);
        console.log("Client Email detected:", !!process.env.DIALOGFLOW_CLIENT_EMAIL);
        console.log("Private Key length:", process.env.DIALOGFLOW_PRIVATE_KEY?.length || 0);

        const sessionClient = new dialogflow.SessionsClient({
            credentials: {
                client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
                private_key: privateKey,
            },
            projectId: projectId,
        });

        const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: 'en-US',
                },
            },
        };

        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        res.status(200).json({
            success: true,
            data: {
                reply: result.fulfillmentText,
                intent: result.intent.displayName,
                confidence: result.intentDetectionConfidence
            }
        });
    } catch (error) {
        console.error("Dialogflow Production Error Details:", error);
        res.status(500).json({ success: false, error: 'Failed to process AI request', details: error.message });
    }
};
