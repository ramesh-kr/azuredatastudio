/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { AppContext } from './appContext';
import { registerTreeDataProvider, ControllerTreeDataProvider } from './arisResource/tree/controllerTreeDataProvider';
import { registerCommands } from './arisResource/commands';
import { ControllerDataModel } from './arisResource/data/controllerDataModel';
import { IconPath } from './arisResource/constants';

export function activate(extensionContext: vscode.ExtensionContext) {
	IconPath.setExtensionContext(extensionContext);

	let appContext = new AppContext(extensionContext);
	let controllerDataModel = new ControllerDataModel();
	let treeDataProvider = new ControllerTreeDataProvider(appContext, controllerDataModel);

	registerTreeDataProvider(appContext, treeDataProvider);
	registerCommands(appContext, treeDataProvider, controllerDataModel);

	vscode.window.showInformationMessage('sample extension started!');
}

export function deactivate() {
}
