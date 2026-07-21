import { PrismaClient, Service } from '@prisma/client';
import { hashPassword } from '@rumsan/user/lib/utils/password.utils';

const VENDOR_ROLE_NAME = 'Vendor';

const prisma = new PrismaClient();

async function main() {
  const [identifier, newPassword] = process.argv.slice(2);
  console.log({ identifier, newPassword });

  if (!identifier || !newPassword) {
    console.error(
      'Usage: pnpm reset:vendor-password <identifier> <newPassword>'
    );
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { uuid: identifier }],
    },
  });

  if (!user) {
    console.error(`No user found matching identifier: ${identifier}`);
    process.exit(1);
  }

  const vendorRole = await prisma.userRole.findFirst({
    where: { userId: user.id, Role: { name: VENDOR_ROLE_NAME } },
  });

  if (!vendorRole) {
    console.error(`User ${user.uuid} is not a vendor. Aborting.`);
    process.exit(1);
  }

  const auth = await prisma.auth.findFirst({
    where: { userId: user.id, service: Service.USERNAME },
  });

  if (!auth) {
    console.error(
      `Vendor ${user.uuid} has no password-based (USERNAME) login to reset.`
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.auth.update({
    where: { id: auth.id },
    data: {
      passwordHash,
      falseAttempts: 0,
      isLocked: false,
      lockedOnAt: null,
    },
  });

  const { count: revokedSessions } = await prisma.authSession.deleteMany({
    where: { Auth: { userId: user.id } },
  });

  console.log(
    `Password reset for vendor ${user.uuid} (username: ${user.username}). Revoked ${revokedSessions} active session(s). They can now log in with the new password and change it from the app.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
