import axios from 'axios';


export default async (phone: string, message: string, extras: any) => {
    if (!phone) throw new Error('No recipient was specified');
    if (!message) throw new Error('No message was specified');

    const data = {
        transport: await extras.appId,
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

    console.log(await extras.url)
    const response = await axios.post(await extras.url, data, {
        headers: {
            "app-id": await extras.token,
            'Content-Type': 'application/json',
        },
    });
    return response.data;

};
