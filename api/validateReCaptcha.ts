import { VercelRequest, VercelResponse } from '@vercel/node';
import { RecaptchaEnterpriseServiceClient, protos } from '@google-cloud/recaptcha-enterprise';
import { config } from 'dotenv';
config();

const validateRecaptchaToken = async (token: string) => {
    const projectID = String(process.env.GOOGLE_PROJECT_ID);
    const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;
    const recaptchaAction = "submit";

    console.log(`Project ID: ${projectID}`);
    console.log(`reCAPTCHA Site Key: ${recaptchaKey}`);
    console.log(`reCAPTCHA Action: ${recaptchaAction}`);
    console.log(`Token received for validation: ${token}`);

    const client = new RecaptchaEnterpriseServiceClient({
        credentials: {
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL
        },
        projectId: projectID
    });

    const projectPath = client.projectPath(projectID);
    console.log(`Project Path: ${projectPath}`);

    const request: protos.google.cloud.recaptchaenterprise.v1.ICreateAssessmentRequest = {
        assessment: {
            event: {
                token: token,
                siteKey: recaptchaKey,
            },
        },
        parent: projectPath,
    };

    const [response] = await client.createAssessment(request);
    console.log('reCAPTCHA response:', response);

    if (!response.tokenProperties?.valid) {
        console.log(`Invalid token: ${response.tokenProperties?.invalidReason}`);
        return false;
    }

    const isValidAction = response.tokenProperties?.action === recaptchaAction;
    console.log(`Token valid: ${response.tokenProperties?.valid}`);
    console.log(`Token action matches: ${isValidAction}`);
    return isValidAction;
};

const recaptchaHandler = async (req: VercelRequest, res: VercelResponse) => {
    const { recaptchaToken } = req.body;
    console.log(`Received request with reCAPTCHA token: ${recaptchaToken}`);

    try {
        const isValid = await validateRecaptchaToken(recaptchaToken);
        if (!isValid) {
            console.log('Invalid reCAPTCHA token');
            return res.status(400).send('Invalid reCAPTCHA token');
        }
        console.log('reCAPTCHA validation successful');
        res.status(200).send('reCAPTCHA validation successful');
    } catch (error: unknown) {
        const typedError = error as any;
        console.error('Error during reCAPTCHA validation:', typedError.message);
        res.status(500).send({ error: 'Server Error', details: typedError.message });
    }
};

export default recaptchaHandler;
