import { FormattedResponse } from '@rumsan/sdk/utils';
import { AxiosRequestConfig } from 'axios';
import { UUID } from 'crypto';
import { Project, ProjectActions } from '../project/project.types';

export type ProjectClient = {
  projectActions: (
    { uuid, data }: { uuid: UUID; data: ProjectActions },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;

  generalActions: (
    { data }: { data: ProjectActions },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>;

  addSettings: (
    { uuid, data }: { uuid: UUID, data },
    config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<any>>

  list: (config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Project>>

  get: (uuid: UUID, config?: AxiosRequestConfig
  ) => Promise<FormattedResponse<Project>>
};
