import { faker } from "@faker-js/faker";
const fields = ['id', 'uuid', 'name', 'createdAt', 'updatedAt', 'deletedAt'];
const fields2 = ['asc', 'dsc']

export const createProjectDto = {
    name: faker.word.sample(),
    description: faker.lorem.paragraph(),
    type: faker.word.sample(),
    extras: {
        test: faker.word.sample()
    },
    contractAddress: faker.string.hexadecimal()
};

export const resProject = {
    id: 2,
    uuid: '04cb0d02-e003-45ab-82a7-5b3b04889339',
    name: 'stickybeak',
    description: 'Aqua vitae ustulo adhuc carpo. Auxilium aperiam acsi tamquam velociter deinde tabesco adnuo adfero. Ademptio beatus credo beatae alius apparatus tero amor denuncio sophismata.',
    status: 'NOT_READY',
    type: 'but',
    contractAddress: '0xD',
    extras: { test: 'afore' },
    createdAt: '2024-08-07T11:25:05.950Z',
    updatedAt: '2024-08-07T11:25:05.950Z',
    deletedAt: null
};

export const queryParams = {
    sort: fields[Math.floor(Math.random() * fields.length)],
    orderBy: fields2[Math.floor(Math.random() * fields2.length)],
    page: faker.number.int({min: 1, max: 4}),
    perPage: 10,
    projectId: resProject.uuid,
};