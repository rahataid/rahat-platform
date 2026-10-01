// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
// import * as jwt from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  GetVendorOtp,
  VendorAddToProjectDto,
  VendorPasswordRegisterDto,
  VendorRegisterDto
} from '@rahataid/extensions';
import { ProjectContants, ProjectEvents, UserRoles, VendorJobs } from '@rahataid/sdk';
import {
  ChangePasswordDto,
  PasswordLoginDto
} from '@rumsan/extensions/dtos';
import { SettingsService } from '@rumsan/extensions/settings';
import { PaginatorTypes, PrismaService, paginator } from '@rumsan/prisma';
import { CONSTANTS } from '@rumsan/sdk/constants/index';
import { Service } from '@rumsan/sdk/enums';
import { Request } from '@rumsan/sdk/types';

import { AuthsService, CurrentUserInterface, SignupsService } from '@rumsan/user';
import { decryptChallenge } from '@rumsan/user/lib/utils/challenge.utils';
import { getSecret } from '@rumsan/user/lib/utils/config.utils';
import { getServiceTypeByAddress } from '@rumsan/user/lib/utils/service.utils';
import { UUID } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { Address } from 'viem';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';
import { isAddress } from '../utils/web3';
import { WalletService } from '../wallet/wallet.service';
import { GetVendorsDTO } from './dto/get-vendors.dto';
import { handleMicroserviceCall } from './handleMicroServiceCall.util';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

// Closed set of app/module types a vendor can be registered under.
// Kept local to this module rather than the shared @rahataid/sdk enums
// package, since it's only used to validate `extras.registeredApps` here.
export enum VendorRegisteredApp {
  CASH = 'CASH',
  INKIND = 'INKIND',
}

@Injectable()
export class VendorsService {

  private readonly logger = new Logger(VendorsService.name);
  private vendorRoleCache: { id: number; name: string } | null = null;

  private shouldFundVendorWallet: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthsService,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly settings: SettingsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly signUpService: SignupsService,
    private readonly walletService: WalletService,

    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy
  ) { }

  async onModuleInit() {
    const vendorFundSettings = await this.settings.getByName('FUND_VENDOR_WALLET');
    this.shouldFundVendorWallet = vendorFundSettings?.value as string;
  }

  //TODO: Fix allow duplicate users?
  async registerVendor(dto: VendorRegisterDto) {
    const vendor = await this.prisma.$transaction(async (prisma) => {
      const role = await prisma.role.findFirst({
        where: { name: UserRoles.VENDOR },
      });
      if (!role)
        throw new BadRequestException({
          message: 'Role not found',
          code: 'VENDOR_ROLE_NOT_FOUND',
        });
      // Add to User table
      const { service, wallet, authWallet, ...rest } = dto;
      if (dto?.email || dto?.phone) {
        const userData = await prisma.user.findFirst({
          where: {
            OR: [{ email: dto.email }, { phone: dto.phone }],
          },
        });

        if (userData) {
          if (userData?.email === dto.email)
            throw new BadRequestException({
              message: 'Email must be unique',
              code: 'VENDOR_EMAIL_MUST_BE_UNIQUE',
            });
          if (userData?.phone === dto.phone)
            throw new BadRequestException({
              message: 'Phone Number must be unique',
              code: 'VENDOR_PHONE_NUMBER_MUST_BE_UNIQUE',
            });
        }
      }

      const user = await prisma.user.create({ data: { ...rest, wallet } });

      // Add to UserRole table
      const userRolePayload = { userId: user.id, roleId: role.id };
      await prisma.userRole.create({ data: userRolePayload });
      // Add to Auth table
      await prisma.auth.create({
        data: {
          userId: +user.id,
          service: dto.service as any,
          serviceId: dto.authWallet ? authWallet : wallet,
          details: dto.extras,
        },
      });
      if (dto.service === Service.WALLET) return user;

      await prisma.auth.create({
        data: {
          userId: +user.id,
          service: Service.WALLET,
          serviceId: dto.wallet,
          details: dto.extras,
        },
      });
      return user;
    });

    // Emit vendor created event to fund vendor wallet
    if (this.shouldFundVendorWallet?.toLowerCase() == 'true') {
      this.eventEmitter.emit(ProjectEvents.VENDORS_CREATED, { wallet: vendor.wallet });
    }

    this.notificationService.createNotification({
      title: `Vendor Waiting for Approval`,
      description: `Vendor ${vendor.name} is waiting for admin approval`,
      group: 'Vendor Management',
      notify: true,
    })
    return vendor;
  }


  async registerVendorWithPassword(
    dto: VendorPasswordRegisterDto,
    rdetails: Request
  ) {
    // Validate input
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException(
        'Vendor name is required and cannot be empty'
      );
    }

    // Validate and get VENDOR role (with caching)
    const vendorRole = await this.getVendorRole();
    if (!vendorRole) {
      throw new NotFoundException(
        'VENDOR role not found in system. Please contact administrator.'
      );
    }

    let walletCreated = false;
    let randomWallet: any = null;

    try {

      console.log(dto)
      // Step 1: Check for duplicate email/phone/username BEFORE creating wallet
      await this.checkForDuplicates(dto);

      // Step 4: Create wallet using WalletService
      try {
        randomWallet = await this.walletService.createWallet();
        walletCreated = true;

        this.logger.log('Vendor wallet created:', {
          address: randomWallet.address,
          blockchain: randomWallet.blockchain || 'evm',
        });
      } catch (walletError) {
        this.logger.error('Failed to create wallet:', walletError);
        throw new BadRequestException(
          'Failed to create vendor wallet. Please try again.'
        );
      }

      // Step 5: Use transaction to ensure atomicity
      const result = await this.prisma.$transaction(async (tx) => {
        // Create signup request using SignupsService with USERNAME service
        const signupData = {
          name: dto.name,
          username: dto.username,
          email: dto.email,
          phone: dto.phone,
          password: dto.password,
          confirmPassword: dto.password,
          service: Service.USERNAME,
          bypassPasswordValidation: dto.bypassPasswordValidation,
          wallet: randomWallet.address,
          extras: {
            ...dto.extras,
            isVendor: true,
            walletBlockchain: randomWallet.blockchain || 'evm',
          },
        };

        // Create signup (auto-approved)
        const signup = await this.signUpService.signup(signupData);
        // Find the created user's auth record
        const auth = await tx.auth.findUnique({
          where: {
            authIdentifier: {
              service: Service.USERNAME,
              serviceId: dto.username,
            },
          },
          include: {
            User: true,
          },
        });

        if (!auth) {
          throw new NotFoundException(
            'Auth record not found after signup. Please contact administrator.'
          );
        }

        // Assign VENDOR role (no need to check if exists - it's a new user)
        await tx.userRole.create({
          data: {
            userId: auth.userId,
            roleId: vendorRole.id,
          },
        });

        return { signup, auth, username: dto.username };
      });

      // Send notification about new vendor
      try {
        await this.notificationService.createNotification({
          title: 'New Vendor Registered',
          description: `Vendor ${dto.name} (${dto.username}) has been registered with password authentication.`,
          group: 'Vendor Management',
        });
      } catch (notificationError) {
        // Log but don't fail the request
        this.logger.error('Failed to send notification:', notificationError);
      }

      // Create auth session and generate access token
      const authSession = await this.authService.createAuthSessionAndToken(
        result.auth.User,
        rdetails
      );

      // Return response with credentials (private key should be handled securely)
      return {
        success: true,
        data: {
          // signup: result.signup,
          accessToken: authSession.accessToken,
          user: {
            id: result.auth.User.id,
            uuid: result.auth.User.uuid,
            name: result.auth.User.name,
            wallet: result.auth.User.wallet,
            username: result.auth.User.username,
            email: result.auth.User.email,
            phone: result.auth.User.phone,
            extras: result.auth.User.extras,
          },

          wallet: {
            address: randomWallet.address,
            blockchain: randomWallet.blockchain || 'evm',
            // SECURITY: Consider encrypting private key or delivering via secure channel
            privateKey: randomWallet.privateKey,
            mnemonic: randomWallet.mnemonic,
          },
          message:
            'Vendor registered successfully with VENDOR role and auto-generated wallet. ',
        },
      };
    } catch (error) {
      // Cleanup: If wallet was created but signup failed, log for manual cleanup
      if (walletCreated && randomWallet) {
        this.logger.error(
          'Vendor registration failed after wallet creation. Orphaned wallet:',
          {
            address: randomWallet.address,
            error: error.message,
          }
        );
        // TODO: Implement wallet cleanup/recovery mechanism
      }

      // Re-throw the error
      throw error;
    }
  }

  // Helper: Get and cache VENDOR role
  private async getVendorRole() {
    if (this.vendorRoleCache) {
      return this.vendorRoleCache;
    }

    const role = await this.prisma.role.findFirst({
      where: { name: UserRoles.VENDOR },
    });

    if (role) {
      this.vendorRoleCache = role;
    }

    return role;
  }

  // Helper: Check for duplicate email/phone/username
  private async checkForDuplicates(dto: VendorRegisterDto) {
    const duplicateChecks: Promise<any>[] = [];

    if (dto.email) {
      duplicateChecks.push(
        this.prisma.auth.findFirst({
          where: {
            service: Service.EMAIL,
            serviceId: dto.email,
          },
        })
      );
    }

    if (dto.phone) {
      duplicateChecks.push(
        this.prisma.auth.findFirst({
          where: {
            service: Service.PHONE,
            serviceId: dto.phone,
          },
        })
      );
    }

    const results = await Promise.all(duplicateChecks);
    const duplicate = results.find((result) => result !== null);

    if (duplicate) {
      throw new BadRequestException('Email or phone already registered');
    }
  }

  // Helper: Generate unique username with collision prevention
  private async generateUniqueUsername(name: string): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const username = this.generateUsername(name);

      // Check if username exists
      const existing = await this.prisma.auth.findFirst({
        where: {
          service: Service.USERNAME,
          serviceId: username,
        },
      });

      if (!existing) {
        return username;
      }

      // If exists, try again with different random suffix
    }

    // Fallback to UUID-based username if all attempts fail
    const fallbackUsername = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${Math.floor(
        Math.random() * 1000
      )}`;
    this.logger.warn(
      'Failed to generate unique username after 10 attempts, using fallback:',
      fallbackUsername
    );
    return fallbackUsername;
  }

  // Helper: Validate generated password meets requirements
  private validateGeneratedPassword(password: string) {
    const {
      validatePasswordStrength,
    } = require('@rumsan/user/lib/utils/password.utils');

    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(
        `Generated password does not meet requirements: ${validation.errors.join(
          ', '
        )}`
      );
    }
  }

  // Helper to generate username from name (base version - doesn't check uniqueness)
  private generateUsername(name: string): string {
    // Convert to lowercase, replace spaces with underscore, remove special chars
    const base = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    // Ensure base is not empty
    if (!base || base.length === 0) {
      return `vendor_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }

    // Use crypto for better randomness
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(3).toString('hex'); // 6 char hex

    return `${base}_${randomBytes}`;
  }

  // Helper to generate secure password with stronger randomness
  private generateSecurePassword(length: number = 14): string {
    const crypto = require('crypto');

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least 2 of each type for stronger passwords
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];
    password += special[crypto.randomInt(0, special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password using Fisher-Yates algorithm for better randomness
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    return passwordArray.join('');
  }

  async loginByPassword(dto: PasswordLoginDto, rdetails: Request) {
    // Step 1: Validate user credentials (password check)
    const user = await this.authService.validateUser(
      dto.identifier,
      dto.password,
      dto.service
    );

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Step 2: Check if user has VENDOR role
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        Role: {
          select: { name: true },
        },
      },
    });

    const isVendor = userRoles.some(
      (userRole) => userRole.Role.name === UserRoles.VENDOR
    );

    if (!isVendor) {
      throw new ForbiddenException('User is not a vendor');
    }

    // Step 3: Create auth session and token
    const authSession = await this.authService.createAuthSessionAndToken(
      user,
      rdetails
    );

    // Step 4: Get vendor's wallet details
    let wallet = null;
    try {
      wallet = await this.walletService.getSecretByWallet(user.wallet);
    } catch (error) {
      this.logger.error('Failed to retrieve wallet:', error);
      // Don't fail login if wallet retrieval fails
    }

    return {
      accessToken: authSession.accessToken,
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        wallet: user.wallet,
      },
      wallet,
    };
  }
  async changeVendorPassword(user: CurrentUserInterface, dto: ChangePasswordDto) {
    const isVendor = user.roles?.includes(UserRoles.VENDOR);
    if (!isVendor) {
      throw new ForbiddenException('User is not a vendor');
    }

    const result = await this.authService.updatePassword(user.id, dto);

    await this.prisma.authSession.deleteMany({
      where: { Auth: { userId: user.id } },
    });

    return result;
  }

  async assignToProject(dto: VendorAddToProjectDto) {
    const { vendorId, projectId } = dto;
    const vendorUser = await this.prisma.user.findUnique({
      where: { uuid: vendorId },
    });
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: vendorUser.id },
      include: {
        Role: {
          select: { name: true },
        },
      },
    });
    const isVendor = userRoles.some(
      (userRole) => userRole.Role.name === UserRoles.VENDOR
    );
    if (!isVendor)
      throw new BadRequestException({
        message: 'Not a vendor',
        code: 'USER_IS_NOT_A_VENDOR',
      });
    const projectPayload = {
      uuid: vendorId,
      walletAddress: vendorUser.wallet,
    };

    const assigned = await this.getVendorAssignedToProject(vendorId, projectId);

    if (assigned)
      throw new RpcException({
        message: 'Vendor already assigned to the project!',
        code: 'VENDOR_ALREADY_ASSIGNED_TO_PROJECT',
      });
    // //2. Save vendor to project
    // await this.prisma.projectVendors.create({
    //   data: {
    //     projectId,
    //     vendorId: vendorId,
    //   },
    // });

    await handleMicroserviceCall({
      client: this.client.send(
        {
          cmd: VendorJobs.ADD_TO_PROJECT,
          uuid: projectId,
        },
        {
          ...projectPayload,
          vendor: vendorUser || null,
        }
      ),
      onSuccess: async (projectResponse) => {
        const createRes = await this.prisma.projectVendors.create({
          data: {
            projectId,
            vendorId,
            extras: {
              projectVendorIdentifier: projectResponse.id,
            },
          },
        });
        console.log('Vendor successfully assigned to the project:', createRes);
      },
      onError: (error) => {
        console.error('Error syncing vendor to project:', error);
      },
    });

    await handleMicroserviceCall({
      client: this.client.send(
        { cmd: 'rahat.jobs.projects.calculate_stats' },
        {
          projectUUID: projectId,
        }
      ),
      onSuccess(response) {
        console.log('Microservice response', response);
        return response;
      },
      onError(error) {
        throw new RpcException({
          message: 'Microservice call failed: ' + error.message,
          code: 'MICROSERVICE_CALL_FAILED',
          params: { message: error.message },
        });
      },
    });

    return this.prisma.userRole.findFirst({
      where: {
        Role: { name: UserRoles.VENDOR },
        User: { uuid: vendorId, deletedAt: null },
      },
      include: {
        User: {
          include: {
            VendorProject: {
              include: {
                Project: true,
              },
            },
          },
        },
      },
    });
  }

  async getVendorAssignedToProject(vendorId: string, projectId: string) {
    return this.prisma.projectVendors.findUnique({
      where: { projectVendorIdentifier: { vendorId, projectId } },
      include: {
        User: true,
      },
    });
  }

  async getVendorCount() {
    return this.prisma.userRole.count({
      where: {
        Role: {
          name: UserRoles.VENDOR,
        },
      },
    });
  }

  async getVendor(id: UUID | Address) {
    const data = isAddress(id)
      ? await this.prisma.user.findFirst({ where: { wallet: id } })
      : await this.prisma.user.findUnique({ where: { uuid: id } });

    if (!data) {
      throw new NotFoundException({
        message: `Vendor not found with id: ${id}`,
        code: 'VENDOR_NOT_FOUND_WITH_ID',
        params: { id: String(id) },
      });
    }

    const projectData = await this.prisma.projectVendors.findMany({
      where: { vendorId: data.uuid },
      include: {
        Project: true,
        User: true,
      },
    });
    // const vendorIdentifier = projectData[0]?.extras;
    // const projects = projectData.map((project) => project.Project);
    // const userdata = { ...data, projects, vendorIdentifier };
    if (projectData.length === 0) {
      return data;
    }

    return projectData;
  }

  async listVendor(dto: GetVendorsDTO) {
    const { vendorName, projectName, status, page, perPage } = dto;
    this.logger.log(`Listing vendors with filters - Vendor Name: ${vendorName}, Project Name: ${projectName}, Status: ${status}, Page: ${page}, Per Page: ${perPage}`);

    const where: any = {
      Role: {
        name: UserRoles.VENDOR,
      },
      User: {
        deletedAt: null,
      },
    };

    if (vendorName) {
      where.User.name = {
        contains: vendorName,
        mode: 'insensitive',
      };
    }

    if (status === 'Pending') {
      // Pending means no VendorProject rows at all, so projectName filter is irrelevant
      where.User = {
        ...where.User,
        VendorProject: {
          none: {},
        },
      };
    } else if (projectName) {
      const projectFilter = { Project: { name: projectName } };
      where.User = {
        ...where.User,
        VendorProject: {
          some: projectFilter,
        },
      };
    } else if (status === 'Assigned') {
      where.User = {
        ...where.User,
        VendorProject: {
          some: {},
        },
      };
    }
    return paginate(
      this.prisma.userRole,
      {
        where,
        include: {
          User: {
            include: {
              VendorProject: {
                include: {
                  Project: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      {
        page,
        perPage,
      }
    );
  }

  async listProjectVendor(dto) {
    const { projectId } = dto;
    const q = {
      projectId,
      deletedAt: null,
    };
    if (dto.name) {
      q['User'] = {
        name: {
          contains: dto.name,
          mode: 'insensitive',
        },
      };
    }

    const venData = await this.prisma.projectVendors.findMany({
      where: q,
      include: {
        Project: true,
        User: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // return venData
    return this.client.send(
      {
        cmd: VendorJobs.LIST,
        uuid: projectId,
      },

      venData
    );
  }

  async listRedemptionVendor(data) {
    const uuids = data.data.map((item) => item.vendorId);
    const vendorData = await this.prisma.user.findMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
    });
    const combinedData = data.data.map((item) => {
      const matchedData = vendorData.find(
        (vendor) => vendor.uuid === item.vendorId
      );
      return {
        ...item,
        Vendor: {
          ...item.Vendor,
          ...matchedData,
        },
      };
    });
    return { data: combinedData, meta: data.meta };
  }

  async getOtp(dto: GetVendorOtp, rdetails) {
    return this.authService.getOtp(dto, rdetails);
  }

  async verifyOtp(dto, rdetails) {
    const res = await this.authService.loginByOtp(dto, rdetails);
    console.log(res);
    if (res.accessToken) {
      return this.getUserDetails(dto);
    }
  }



  async getUserDetails(dto) {
    const challengeData = decryptChallenge(
      getSecret(),
      dto.challenge,
      CONSTANTS.CLIENT_TOKEN_LIFETIME
    );
    if (!challengeData.address)
      throw new ForbiddenException({
        message: 'Invalid credentials in challenge!',
        code: 'INVALID_CREDENTIALS_IN_CHALLENGE',
      });
    if (!dto.service) {
      dto.service = getServiceTypeByAddress(challengeData.address) as Service;
    }
    const auth = await this.authService.getByServiceId(
      challengeData.address,
      dto.service as Service
    );

    const user = await this.authService.getUserById(auth.userId);
    return user;
  }

  async updateVendor(dto, uuid: UUID) {
    // STEP 1: Load current vendor state and validate it exists
    this.logger.log(`Starting vendor update for UUID: ${uuid} with data: ${JSON.stringify(dto)}`);
    const originalVendor = await this.prisma.user.findUnique({ where: { uuid } });
    if (!originalVendor)
      throw new NotFoundException({
        message: 'Vendor not found',
        code: 'VENDOR_DATA_NOT_FOUND',
      });

    // STEP 1.1: Validate email uniqueness if email is being updated
    if (dto?.email) {
      const duplicate = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { uuid } },
      });
      if (duplicate)
        throw new BadRequestException({
          message: 'Email must be unique',
          code: 'VENDOR_EMAIL_MUST_BE_UNIQUE',
        });
    }

    // STEP 1.2: Merge extras with existing data to preserve unmodified fields
    if (dto.extras) {
      // registeredApps must stay a closed set so the frontend can safely
      // translate each value against a known enum instead of rendering
      // arbitrary caller-supplied strings verbatim.
      const registeredApps = (dto.extras as { registeredApps?: unknown })?.registeredApps;
      if (registeredApps !== undefined) {
        if (!Array.isArray(registeredApps)) {
          throw new BadRequestException({
            message: 'registeredApps must be an array',
            code: 'INVALID_REGISTERED_APPS',
          });
        }
        const allowed = Object.values(VendorRegisteredApp) as string[];
        const invalid = registeredApps.filter((app) => !allowed.includes(app));
        if (invalid.length > 0) {
          throw new BadRequestException({
            message: `Invalid registered app(s): ${invalid.join(', ')}. Allowed values: ${allowed.join(', ')}`,
            code: 'INVALID_REGISTERED_APPS',
            params: { invalid: invalid.join(', '), allowed: allowed.join(', ') },
          });
        }
      }
      dto.extras = { ...Object(originalVendor.extras || {}), ...dto.extras };
    }

    // STEP 1.3: Capture a snapshot of original vendor (excluding system fields) for saga rollback
    const originalSnapshot = (({ id, uuid: _u, createdAt, updatedAt, ...rest }) => rest)(originalVendor);

    // STEP 2: Persist vendor update to the local database
    const result = await this.usersService.update(uuid, dto);

    // STEP 3: Fetch all projects this vendor is assigned to
    const assignedProjects = await this.prisma.projectVendors.findMany({
      where: { vendorId: uuid },
    });
    if (assignedProjects.length === 0) return result;

    // STEP 3.1: Touch updatedAt on all project-vendor links to signal a sync is in progress
    await this.prisma.projectVendors.updateMany({
      where: { vendorId: uuid },
      data: { updatedAt: new Date() },
    });

    // STEP 4: Propagate the update to each assigned project microservice (saga forward phase)
    const updatedProjects: string[] = [];

    for (const project of assignedProjects) {
      try {
        // STEP 4.1: Send vendor update to the project microservice
        this.logger.log(`Propagating vendor update to project ${project.projectId} for vendor UUID: ${uuid}`);
        await lastValueFrom(
          this.client.send({ cmd: VendorJobs.UPDATE, uuid: project.projectId }, { uuid, ...dto })
        );
        updatedProjects.push(project.projectId);
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Saga failed at project ${project.projectId}: ${err.message}`);

        // STEP 4.2: Saga compensation — revert local vendor record to the original snapshot
        await this.revertVendorUpdate(originalSnapshot, uuid);

        // STEP 4.3: Saga compensation — re-send original snapshot to all previously updated projects
        await Promise.allSettled(
          updatedProjects.map((projectId) =>
            lastValueFrom(
              this.client.send({ cmd: VendorJobs.UPDATE, uuid: projectId }, { uuid, ...originalSnapshot })
            ).catch((e: Error) => this.logger.error(`Failed to revert project ${projectId}: ${e.message}`))
          )
        );

        throw new BadRequestException({
          message: `Vendor update saga failed at project ${project.projectId}: ${err.message}`,
          code: 'VENDOR_UPDATE_SAGA_FAILED',
          params: { projectId: project.projectId, message: err.message },
        });
      }
    }

    return result;
  }

  private async revertVendorUpdate(snapshot: Record<string, unknown>, uuid: string) {
    await this.prisma.user.update({ where: { uuid }, data: snapshot });
  }

  async removeVendor(uuid: UUID, projectId?: UUID) {
    const isVendor = await this.prisma.user.findFirst({
      where: {
        uuid,
      },
    });
    if (!isVendor)
      throw new NotFoundException({
        message: 'Data not Found',
        code: 'VENDOR_DATA_NOT_FOUND',
      });

    if (!projectId) {
      const result = await this.usersService.delete(uuid);
      return result;
    }

    const isProjectVendor = await this.prisma.projectVendors.findFirst({
      where: {
        projectId: projectId,
        vendorId: uuid,
      },
    });

    if (!isProjectVendor)
      throw new NotFoundException({
        message: 'Project vendor not found',
        code: 'PROJECT_VENDOR_NOT_FOUND',
      });

    await this.prisma.projectVendors.deleteMany({
      where: {
        projectId: projectId,
        vendorId: uuid,
      },
    });

    return this.client.send({ cmd: VendorJobs.REMOVE }, uuid);
  }

  async getVendorClaimStats(dto) {
    const { projectId } = dto;
    const projectVendors = await this.prisma.projectVendors.findMany({
      where: {
        projectId,
      },
      select: {
        User: true,
      },
    });
    return this.client.send(
      { cmd: VendorJobs.GET_VENDOR_STATS, uuid: projectId },
      projectVendors
    );
  }

  async getVendorByUuid(dto: { projectId: string; vendorId: string }) {
    return this.prisma.projectVendors.findUnique({
      where: {
        projectVendorIdentifier: dto,
      },
      include: {
        User: true,
      },
    });
  }
}
