import axios from 'axios';
import { Pagination } from '@rumsan/sdk/types';
import { getProjectClient } from '../../clients/project.client';
import { ProjectClient } from '../../types';

jest.mock('axios');

const mockAxiosInstance = axios as jest.Mocked<typeof axios>;

describe('ProjectClient', () => {
    const client:ProjectClient = getProjectClient(mockAxiosInstance);

    describe('projectActions', () => {
        it('should create project actions', async () => {
            const mockUUID = 'uuid';
            const mockRequest ={
                action: "beneficiary.create",
                payload: {
                    name: "John Doe"
                }
            }; 
        });
    });
});