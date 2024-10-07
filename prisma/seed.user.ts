import { PrismaClient, Service } from '@prisma/client';

export const roles: Array<{ id?: number; name: string; isSystem?: boolean }> = [
  {
    id: 1,
    name: 'Admin',
    isSystem: true,
  },
  {
    id: 2,
    name: 'Manager',
  },
  {
    id: 3,
    name: 'User',
  },
  {
    id: 4,
    name: 'Vendor',
  },
];

export const permissions: Array<{
  id?: number;
  roleId: number;
  action: string;
  subject: string;
}> = [
    {
      id: 1,
      roleId: 1,
      action: 'manage',
      subject: 'all',
    },
    {
      id: 2,
      roleId: 2,
      action: 'manage',
      subject: 'user',
    },
    {
      id: 3,
      roleId: 4,
      action: 'manage',
      subject: 'user',
    },
    {
      id: 4,
      roleId: 3,
      action: 'read',
      subject: 'user',
    },
  ];

export const users: Array<{
  id?: number;
  name?: string;
  email?: string;
  wallet?: string;
}> = [
    {
      id: 1,
      name: 'Rumsan Admin',
      email: 'rumsan@mailinator.com',
      wallet: '0x75f598874DC39E364846d577CEde48d50378aC40',
    },
    {
      id: 2,
      name: 'Manjik Admin',
      email: 'manjik@mailinator.com',
      wallet: '0xcDEe632FB1Ba1B3156b36cc0bDabBfd821305e06',
    },
    {
      id: 3,
      name: 'Ms Manager',
      wallet: '0xNC6bFaf10e89202c293dD795eCe180BBf1430d7B',
    },
    {
      id: 4,
      name: 'Mr User',
      email: 'user@mailinator.com',
    },
    {
      id: 5,
      name: 'Raghav',
      email: 'raghav.kattel@rumsan.net',
      wallet: '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
    },
  ];

export const userRoles: Array<{
  id?: number;
  userId: number;
  roleId: number;
}> = [
    {
      id: 1,
      userId: 1,
      roleId: 1,
    },
    {
      id: 2,
      userId: 2,
      roleId: 2,
    },
    {
      id: 3,
      userId: 3,
      roleId: 3,
    },
    {
      id: 4,
      userId: 4,
      roleId: 3,
    },
    {
      id: 5,
      userId: 5,
      roleId: 1,
    },
  ];

export const auths: Array<{
  id?: number;
  userId: number;
  service: Service;
  serviceId: string;
}> = [
    {
      id: 1,
      userId: 1,
      service: Service.EMAIL,
      serviceId: 'rumsan@mailinator.com',
    },
    {
      id: 2,
      userId: 2,
      service: Service.EMAIL,
      serviceId: 'manjik@mailinator.com',
    },
    {
      id: 3,
      userId: 2,
      service: Service.WALLET,
      serviceId: '0xcDEe632FB1Ba1B3156b36cc0bDabBfd821305e06',
    },
    {
      id: 4,
      userId: 3,
      service: Service.WALLET,
      serviceId: '0xNC6bFaf10e89202c293dD795eCe180BBf1430d7B',
    },
    {
      id: 5,
      userId: 4,
      service: Service.EMAIL,
      serviceId: 'user@mailinator.com',
    },
    {
      id: 6,
      userId: 5,
      service: Service.EMAIL,
      serviceId: 'raghav.kattel@rumsan.net',
    },
  ];

const prisma = new PrismaClient();

async function main() {
  // await prisma.$transaction([
  // 	prisma.permission.deleteMany(),
  // 	prisma.user.deleteMany(),
  // 	prisma.role.deleteMany(),
  // ]);

  await prisma.$transaction(async (prm) => {
    // ===========Create Roles=============
    const rolesCreated = await prm.role.createManyAndReturn({
      data: roles,
    });

    console.log('Created Roles:', rolesCreated)
    console.log('Roles Created.');

    const permissionsCreated = await prm.permission.createManyAndReturn({
      data: permissions,
    });
    console.log('Created Permissions:', permissionsCreated)



    console.log('Permissions Created.');


    // ==============Create Users===============
    const usersCreated = await prm.user.createManyAndReturn({
      data: users,
    });

    console.log('Created Users:', usersCreated)


    console.log('Users Created.');

    // ==============Create Auths===============
    const authsCreated = await prm.auth.createManyAndReturn({
      data: auths,
    });
    console.log('Auths Created.');
    console.log('Created Auths:', authsCreated)

    // ==============Create User Roles===============
    const userRolesCreated = await prm.userRole.createManyAndReturn({
      data: userRoles,
    });
    console.log('User Roles Created.');
    console.log('Created User Roles:', userRolesCreated)
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.log(error);
    await prisma.$disconnect();
  });
