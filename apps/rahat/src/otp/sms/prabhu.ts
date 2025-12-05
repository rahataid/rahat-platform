import axios from 'axios';


export default async (phone: string, message: string, extras: any) => {
    if (!phone) throw new Error('No recipient was specified');
    if (!message) throw new Error('No message was specified');

    const data = {
        transport: extras.transportId,
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

    const response = await axios.post(`${extras.url}/broadcasts`, data, {
        headers: {
            "app-id": extras.appId,
            'Content-Type': 'application/json',
        },
    });
    return response.data;

};
