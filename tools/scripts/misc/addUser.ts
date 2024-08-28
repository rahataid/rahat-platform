import axios from 'axios';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';

const google_cred = require(`./config/google.json`);

type ApiAuth = {
    url: string;
    accessToken: string;
};

type Gender = 'MALE' | 'FEMALE' | 'UNKNOWN';
type Role = 'ADMIN' | 'USER' | 'MANAGER';

type User = {
    name: string;
    email: string;
    gender: Gender;
    phone: string;
    wallet: string;
    roles: Role[];
};

const serviceAccountAuth = new JWT({
    email: google_cred.client_email,
    key: google_cred.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

console.log(google_cred.client_email)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getGoogleSheetsData = async (
    sheetId: string,
    sheetName: string
): Promise<GoogleSpreadsheetRow<Record<string, any>>[]> => {
    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetName];
    const rows = await sheet.getRows();
    return rows;
};


const addUser = async (config: ApiAuth, user: User): Promise<void> => {
    const response = await axios.post(config.url, user, {
        headers: {
            Authorization: `Bearer ${config.accessToken}`,
        },
    });
    console.log(response.data);
}

// //Rahat Demo Training
const sheetId = '1uVvlb-VQ8DKrSirWwgEr6akE9p5SnC8ZR7_KDFnwEew';
const sheetName = 'dev_users';
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcklkIjoyLCJ1dWlkIjoiYzcwZWFlNzQtMTgxYy00YTQ4LTk3MWEtZDJlYWMyNTkzYzVjIiwibmFtZSI6Ik1zIE1hbmFnZXIiLCJlbWFpbCI6bnVsbCwicGhvbmUiOm51bGwsIndhbGxldCI6IjB4QUM2YkZhZjEwZTg5MjAyYzI5M2RENzk1ZUNlMTgwQkJmMTQzMGQ3QiIsInJvbGVzIjpbIk1hbmFnZXIiXSwicGVybWlzc2lvbnMiOlt7ImFjdGlvbiI6Im1hbmFnZSIsInN1YmplY3QiOiJ1c2VyIiwiaW52ZXJ0ZWQiOmZhbHNlLCJjb25kaXRpb25zIjpudWxsfV0sImlhdCI6MTcyNDgyODg0MywiZXhwIjoxNzI0OTE1MjQzfQ.VAchv_irsh-5zPONvPJ8lXvzdmNg0ahsWbOQLqgI9eY'
const baseUrl = 'http://localhost:5500';
const userAddUrl = `${baseUrl}/v1/users`;

(async () => {
    const apiConfig = {
        url: userAddUrl,
        accessToken
    }
    const users = await getGoogleSheetsData(sheetId, sheetName);
    for (const u of users) {
        const newUser: User = {
            name: u.get('name'),
            email: u.get('email'),
            gender: u.get('gender'),
            phone: u.get('phone'),
            wallet: u.get('wallet'),
            roles: [u.get('role') as Role]
        }
        if (!newUser.name || !newUser.email || !newUser.wallet) continue;
        if (u.get('isAdded') === 'TRUE') continue;
        await addUser(apiConfig, newUser);
        u.set('isAdded', 'TRUE');
        u.save();
        sleep(1000);
    }

})();