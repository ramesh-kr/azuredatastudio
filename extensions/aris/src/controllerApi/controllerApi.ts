import { EndpointRouterApi } from './controllerApiGenerated';
import { IEndPointsResponse, IControllerError, IEndPointsRequest, IHttpResponse, IEndPoint } from './wrapper';

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the Source EULA. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export class ArisControllerApi {

	public static async getEndPoints(
		url: string, username: string, password: string, ignoreSslVerification?: boolean
	): Promise<IEndPointsResponse> {

		if (!url || !username || !password) {
			return undefined;
		}

		let ep = new EndpointRouterApi(username, password, url);
		ep.ignoreSslVerification = !!ignoreSslVerification;

		let controllerResponse: IEndPointsResponse = undefined;
		let controllerError: IControllerError = undefined;
		let request = <IEndPointsRequest>{
			url: url,
			username: username,
			password: password,
			method: 'endPointsGet'
		};

		await ep.endpointsGet().then(result => {
			controllerResponse = <IEndPointsResponse>{
				response: result.response as IHttpResponse,
				endPoints: result.body as IEndPoint[],
				request
			};
		}, error => {
			if (error) {
				if ('response' in error) {
					let err: IEndPointsResponse = error as IEndPointsResponse;
					let errCode = `${err.response.statusCode || ''}`;
					let errMessage = err.response.statusMessage;
					let errUrl = err.response.url;
					controllerError = <IControllerError>{
						address: errUrl,
						code: errCode,
						errno: errCode,
						message: errMessage,
						name: undefined
					};
				} else {
					controllerError = error as IControllerError;
				}
				controllerError = Object.assign(controllerError, { request }) as IControllerError;
			}
		});

		if (!controllerResponse && !controllerError) {
			return undefined;
		}

		return new Promise<IEndPointsResponse>((resolve, reject) => {
			if (controllerResponse) {
				resolve(controllerResponse);
			} else {
				reject(controllerError);
			}
		});
	}
}