import axios from 'axios';

const url = process.env.PRABHU_URL || '';
const token = process.env.PRABHU_TOKEN || '';

export default async (phone: string, message: string) => {
    if (!phone) throw new Error('No recipient was specified');
    if (!message) throw new Error('No message was specified');

    const data = {
        transport: process.env.PRABHU_APP_ID,
        message: {
            content: message,
            meta: {
                info: "test"
            }
        },
        addresses: [phone],
        maxAttempts: 5,
        trigger: "IMMEDIATE",
        webhook: "",
        options: {
            attemptIntervalMinutes: "5"
        }
    };

    const response = await axios.post(url, data, {
        headers: {
            "app-id": token,
            'Content-Type': 'application/json',
        },
    });
    return response.data;

};
