/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { ApiWrapper } from './apiWrapper';

/**
 * Global context for the application
 */
export class AppContext {
	public readonly apiWrapper: ApiWrapper;
	constructor(
		public readonly extensionContext: vscode.ExtensionContext
	) {
		this.apiWrapper = new ApiWrapper(extensionContext);
	}
}
