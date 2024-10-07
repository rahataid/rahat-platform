import { PrismaClient, Service } from '@prisma/client';

function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (Array.isArray(obj)) {
    const arrCopy: any[] = [];
    obj.forEach((val, i) => {
      arrCopy[i] = cloneDeep(val);
    });
    return arrCopy as T;
  }

  if (obj instanceof Object) {
    const objCopy: { [key: string]: any } = {};
    Object.keys(obj).forEach((key) => {
      objCopy[key] = cloneDeep((obj as { [key: string]: any })[key]);
    });
    return objCopy as T;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}

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
      wallet: '0x75f598874DC39E364846d577CEde48d50378aC40'
    },
    {
      id: 2,
      name: 'Manjik Admin',
      email: 'manjik@mailinator.com',
      wallet: '0xcDEe632FB1Ba1B3156b36cc0bDabBfd821305e06'
    },
    {
      id: 3,
      name: 'Ms Manager',
      wallet: '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
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
      wallet: '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B'
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
    }
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
      serviceId: '0xAC6bFaf10e89202c293dD795eCe180BBf1430d7B',
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
      serviceId: 'raghav.kattel@rumsan.net'
    }
  ];

const projectTypes: Array<{
  id?: number;
  name: string;
  description?: string;
}> = [
    {
      id: 1,
      name: 'aa',
    },
    {
      id: 2,
      name: 'cva',
    },
    {
      id: 3,
      name: 'el',
    },
    {
      id: 3,
      name: 'c2c',
    },
  ];

const prisma = new PrismaClient();

async function main() {
  // await prisma.$transaction([
  // 	prisma.permission.deleteMany(),
  // 	prisma.user.deleteMany(),
  // 	prisma.role.deleteMany(),
  // ]);
  // ===========Create Roles=============

  prisma.$transaction(async prm => {
    for await (const role of roles) {
      const roleAttrs = cloneDeep(role);
      delete roleAttrs.id;
      await prm.role.upsert({
        where: {
          id: role.id,
        },
        create: roleAttrs,
        update: roleAttrs,
      });
    }

    // ===========Create Permissions==========
    for await (const permission of permissions) {
      const permissionAttrs = cloneDeep(permission);
      delete permissionAttrs.id;
      await prm.permission.upsert({
        where: {
          id: permission.id,
        },
        create: permissionAttrs,
        update: permissionAttrs,
      });
    }

    // ==============Create Users===============
    for await (const user of users) {
      const userAttrs = cloneDeep(user);
      delete userAttrs.id;
      await prm.user.upsert({
        where: {
          id: user.id,
        },
        create: userAttrs,
        update: userAttrs,
      });
    }

    // ==============Create Auths===============
    for await (const auth of auths) {
      const authAttrs = cloneDeep(auth);
      delete authAttrs.id;
      await prm.auth.upsert({
        where: {
          id: auth.id,
        },
        create: authAttrs,
        update: authAttrs,
      });
    }

    // ==============Create User Roles===============
    for await (const userRole of userRoles) {
      const userRoleAttrs = cloneDeep(userRole);
      delete userRoleAttrs.id;
      await prm.userRole.upsert({
        where: {
          id: userRole.id,
        },
        create: userRoleAttrs,
        update: userRoleAttrs,
      });
    }
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
