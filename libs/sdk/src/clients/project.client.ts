import { formatResponse } from "@rumsan/sdk/utils";
import { AxiosInstance, AxiosRequestConfig } from "axios";
import { UUID } from "crypto";
import { ProjectActions } from "../project/project.types";
import { ProjectClient } from "../types";

export const getProjectClient = (
    client: AxiosInstance
):ProjectClient =>{
    return{
        projectActions: async({uuid,data}:{uuid:UUID;data:ProjectActions},config?: AxiosRequestConfig) =>{
            const response = await client.post(`/projects/${uuid}/actions`,data,config);
            return formatResponse<any>(response);
        },
        addSettings: async({uuid,data}:{uuid:UUID;data},config?:AxiosRequestConfig) =>{
            const response = await client.post(`/projects/${uuid}/settings`, data, config );
            return formatResponse<any>(response)
        }
    }
}