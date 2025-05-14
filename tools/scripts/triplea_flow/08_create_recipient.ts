import axios from 'axios';
import 'dotenv/config';
import * as readline from 'readline';
import authenticate from './01_authenticate';

const BASE_URL = process.env.TRIPLEA_BASE_URL || 'https://api.triple-a.io';

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

function isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function isValidDate(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

async function promptValidated(query: string, validate: (val: string) => boolean, errorMsg: string): Promise<string> {
    while (true) {
        const ans = await askQuestion(query);
        if (validate(ans)) return ans;
        console.log(errorMsg);
    }
}

async function createRecipient() {
    const accessToken = await authenticate();
    const first_name = await promptValidated('Recipient first name: ', v => v.length > 0, 'First name is required.');
    const last_name = await promptValidated('Recipient last name: ', v => v.length > 0, 'Last name is required.');
    const email = await promptValidated('Recipient email: ', isValidEmail, 'Invalid email format.');
    const country = await promptValidated('Recipient country (ISO code, e.g. US): ', v => v.length === 2, 'Country code must be 2 letters.');
    const dob = await promptValidated('Recipient date of birth (YYYY-MM-DD): ', isValidDate, 'Date must be in YYYY-MM-DD format.');

    try {
        const response = await axios.post(
            `${BASE_URL}/api/v2/individuals`,
            {
                first_name,
                last_name,
                email,
                country,
                date_of_birth: dob,
            },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        console.log('Recipient created:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Create recipient failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    createRecipient();
}
