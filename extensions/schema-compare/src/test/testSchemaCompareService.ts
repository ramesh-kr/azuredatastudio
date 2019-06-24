/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';

export class SchemaCompareTestService implements azdata.SchemaCompareServicesProvider {

	testOperationId: string = 'Test Operation Id';

	schemaComparePublishChanges(operationId: string, targetServerName: string, targetDatabaseName: string, taskExecutionMode: azdata.TaskExecutionMode): Thenable<azdata.ResultStatus> {
		throw new Error('Method not implemented.');
	}

	schemaCompareGetDefaultOptions(): Thenable<azdata.SchemaCompareOptionsResult> {
		let result: azdata.SchemaCompareOptionsResult = {
			defaultDeploymentOptions: undefined,
			success: true,
			errorMessage: ''
		};

		return Promise.resolve(result);
	}

	schemaCompareIncludeExcludeNode(operationId: string, diffEntry: azdata.DiffEntry, IncludeRequest: boolean, taskExecutionMode: azdata.TaskExecutionMode): Thenable<azdata.ResultStatus> {
		throw new Error('Method not implemented.');
	}

	schemaCompareOpenScmp(filePath: string): Thenable<azdata.SchemaCompareOpenScmpResult> {
		throw new Error('Method not implemented.');
	}

	schemaCompare(operationId: string, sourceEndpointInfo: azdata.SchemaCompareEndpointInfo, targetEndpointInfo: azdata.SchemaCompareEndpointInfo, taskExecutionMode: azdata.TaskExecutionMode): Thenable<azdata.SchemaCompareResult> {
		let result: azdata.SchemaCompareResult = {
			operationId: this.testOperationId,
			areEqual: true,
			differences: [],
			success: true,
			errorMessage: ''
		};

		return Promise.resolve(result);
	}

	schemaCompareGenerateScript(operationId: string, targetServerName: string, targetDatabaseName: string, taskExecutionMode: azdata.TaskExecutionMode): Thenable<azdata.ResultStatus> {
		return undefined;
	}

	schemaCompareCancel(operationId: string): Thenable<azdata.ResultStatus> {
		return undefined;
	}

	handle?: number;
	readonly providerId: string = 'MSSQL';

	registerOnUpdated(handler: () => any): void {
	}
}
