import { ClientProxy, RpcException } from '@nestjs/microservices';
import { BeneficiaryEvents, BeneficiaryJobs, generateRandomWallet } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { v4 as uuidv4 } from 'uuid';

// Define type for the BeneficiaryDto
interface BeneficiaryDto {
  uuid?: string;
  walletAddress?: string;
  piiData: {
    phone: string;
    email?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

async function addBulkBeneficiaryToProjectUtil(
  beneficiaryData: BeneficiaryDto[],  // Updated type for the beneficiaryData
  projectUuid: string,
  referrerBeneficiary: string,
  referrerVendor: string,
  type: string,
  client: ClientProxy,  // Correct type for the client
  prisma: PrismaService  // Correct type for the Prisma service
) {
  try {
    console.log(`Beneficiary processing for the db`);

    // Validate phone numbers and wallet addresses
    await validateBeneficiaries(beneficiaryData, prisma);

    // Pre-generate UUIDs and wallet addresses if necessary
    beneficiaryData.forEach((dto) => {
      dto.uuid = dto.uuid || uuidv4();
      dto.walletAddress = dto.walletAddress || generateRandomWallet().address;
    });

    // Separate PII data and beneficiary data for insertion
    const beneficiariesData = beneficiaryData.map(({ piiData, ...data }) => ({
      ...data,
      walletAddress: data.walletAddress || generateRandomWallet().address,  // Ensure walletAddress is populated
    }));

    const piiDataList = beneficiaryData.map(({ uuid, piiData }) => ({
      ...piiData,
      uuid,
    }));

    // Insert beneficiaries in bulk
    await prisma.beneficiary.createMany({ data: beneficiariesData });

    // Retrieve inserted beneficiaries for linking PII data
    const insertedBeneficiaries = await prisma.beneficiary.findMany({
      where: { uuid: { in: beneficiaryData.map((dto) => dto.uuid) } },
      include: { pii: true },  // Include PII data here
    });

    // Map PII data with correct beneficiary IDs
    const piiBulkInsertData = piiDataList.map((piiData) => {
      const beneficiary = insertedBeneficiaries.find(
        (b) => b.uuid === piiData.uuid
      );
      return {
        beneficiaryId: beneficiary.id,
        ...piiData,
        uuid: undefined, // Remove the temporary UUID field
      };
    });

    // Insert PII data in bulk
    if (piiBulkInsertData.length > 0) {
      const sanitizedPiiData = piiBulkInsertData.map((pii) => ({
        ...pii,
        phone: pii.phone ? pii.phone.toString() : null,
      }));
      await prisma.beneficiaryPii.createMany({ data: sanitizedPiiData });
    }

    // Associate beneficiaries with the project
    const benProjectData = insertedBeneficiaries.map((ben) => ({
      projectId: projectUuid,
      beneficiaryId: ben.uuid,  // Use uuid instead of id
    }));

    await prisma.beneficiaryProject.createMany({
      data: benProjectData,
    });

    // Prepare projectPayloads for syncing beneficiaries to the project
    const projectPayloads = insertedBeneficiaries.map((ben) => ({
      uuid: ben.uuid,
      walletAddress: ben.walletAddress,
      extras: ben.extras || null,
      type: type,
      referrerBeneficiary,
      referrerVendor,
      piiData: ben.pii,
    }));

    // Sync beneficiary to the project
    await client.send(
      {
        cmd: BeneficiaryJobs.BULK_REFER_TO_PROJECT,
        uuid: projectUuid,
      },
      projectPayloads
    );

    // Emit an event after beneficiaries are added to the project
    client.emit(BeneficiaryEvents.BENEFICIARY_CREATED, {
      projectUuid,
    });

    // Return success response
    return {
      success: true,
      count: beneficiaryData.length,
      beneficiaries: insertedBeneficiaries,
    };
  } catch (error) {
    console.error(error);
    throw new RpcException(error.message || 'An error occurred while adding beneficiaries to the project');
  }
}

// Helper function for validating beneficiaries
async function validateBeneficiaries(beneficiaryData: BeneficiaryDto[], prisma: PrismaService) {
  const duplicatePhones = await checkPhoneNumber(beneficiaryData, prisma);
  if (duplicatePhones.length > 0) {
    throw new RpcException(`Duplicate phone numbers: ${duplicatePhones.join(', ')}`);
  }

  const duplicateWallets = await checkWalletAddress(beneficiaryData, prisma);
  if (duplicateWallets.length > 0) {
    throw new RpcException(`Duplicate wallet addresses: ${duplicateWallets.join(', ')}`);
  }
}

// Utility function to check for duplicate phone numbers
async function checkPhoneNumber(beneficiaryData: BeneficiaryDto[], prisma: PrismaService): Promise<string[]> {
  const phoneNumbers = beneficiaryData.map((dto) => dto.piiData.phone.toString());
  const duplicates = await prisma.beneficiaryPii.findMany({
    where: { phone: { in: phoneNumbers } },
    select: { phone: true },
  });
  return duplicates.map((dup) => dup.phone);
}

// Utility function to check for duplicate wallet addresses
async function checkWalletAddress(beneficiaryData: BeneficiaryDto[], prisma: PrismaService): Promise<string[]> {
  const walletAddresses = beneficiaryData.map((dto) => dto.walletAddress).filter((wallet) => wallet !== undefined);
  const duplicates = await prisma.beneficiary.findMany({
    where: { walletAddress: { in: walletAddresses } },
    select: { walletAddress: true },
  });
  return duplicates.map((dup) => dup.walletAddress);
}

export { addBulkBeneficiaryToProjectUtil };
