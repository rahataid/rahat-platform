import { BadRequestException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WalletServiceType } from '@rahataid/sdk/enums';
import { PrismaService } from '@rumsan/prisma';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class XcapitService {
  private axiosInstance: AxiosInstance | null = null;
  private token: string | null = null;
  private baseURL!: string;
  private email!: string;
  private password!: string;

  constructor(private readonly prisma: PrismaService) {}

  //Load XCAPIT credentials
  private async loadCredentials(): Promise<void> {
    if (this.baseURL && this.email && this.password) return;

    const xcapit = await this.prisma.setting.findUnique({
      where: { name: WalletServiceType.XCAPIT },
    });

    if (!xcapit) throw new RpcException('XCAPIT setting not found');

    const { BASEURL, EMAIL, PASSWORD } = xcapit.value as {
      BASEURL: string;
      EMAIL: string;
      PASSWORD: string;
    };

    if (!BASEURL || !EMAIL || !PASSWORD) {
      throw new RpcException(
        'Missing XCAPIT_BASEURL, XCAPIT_EMAIL or XCAPIT_PASSWORD'
      );
    }

    this.baseURL = BASEURL;
    this.email = EMAIL;
    this.password = PASSWORD;
  }

  //Perform login and fetch token
  private async login(): Promise<string> {
    await this.loadCredentials();

    const res = await axios.post(`${this.baseURL}/api/users/login`, {
      email: this.email,
      password: this.password,
    });

    this.token = res.data.token;
    return this.token;
  }

  //Create and configure Axios client with interceptors
  private async getAxiosClient(): Promise<AxiosInstance> {
    if (this.axiosInstance) return this.axiosInstance;

    await this.loadCredentials();

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request Interceptor
    this.axiosInstance.interceptors.request.use(async (req) => {
      if (!this.token) {
        this.token = await this.login();
      }
      req.headers.Authorization = `Bearer ${this.token}`;
      return req;
    });

    // Response Interceptor (handle token expiration)
    this.axiosInstance.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('Token expired, re-logging in...');
          this.token = await this.login();

          const config: AxiosRequestConfig = error.config;
          config.headers.Authorization = `Bearer ${this.token}`;
          return this.axiosInstance!.request(config);
        }
        return Promise.reject(error);
      }
    );

    return this.axiosInstance;
  }

  //Bulk wallet generation
  async bulkGenerateXcapitWallet(
    payload: { phoneNumber: string }[]
  ): Promise<{ phoneNumber: string; walletAddress: string; status: string }[]> {
    try {
      const client = await this.getAxiosClient();
      const response = await client.post('/api/beneficiaries/bulk', payload);
      return response.data;
    } catch (e: any) {
      throw new BadRequestException(e.response?.data || e.message);
    }
  }

  //Single wallet generation
  async generateXCapitWallet(
    phoneNumber: string
  ): Promise<{ phoneNumber: string; address: string; active: boolean }> {
    try {
      const client = await this.getAxiosClient();
      const response = await client.post('/api/beneficiaries', { phoneNumber });
      return response.data;
    } catch (e: any) {
      throw new BadRequestException(e.response?.data || e.message);
    }
  }
}
