// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { lastValueFrom, Observable } from 'rxjs';

interface MicroserviceOptions<TRequest, TResponse> {
    client: Observable<TResponse>;
    onSuccess?: (response: TResponse) => Promise<void> | void;
    onError?: (error: any) => Promise<void> | void;
}

export async function handleMicroserviceCall<TRequest, TResponse>(
    options: MicroserviceOptions<TRequest, TResponse>
): Promise<TResponse> {
    const { client, onSuccess, onError } = options;

    try {
        const response = await lastValueFrom(client);

        if (onSuccess) {
            await onSuccess(response);
        }

        return response;
    } catch (error) {
        if (onError) {
            await onError(error);
        }
        // Always rethrow — onError is a side-effect hook (logging, cleanup),
        // not an error-swallowing mechanism.
        throw error;
    }
}