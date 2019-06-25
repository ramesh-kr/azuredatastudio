/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { AppContext } from '../appContext';
import { TreeNode } from './tree/treeNode';

import { AddControllerDialog } from '../addControllerDialog';
import { ControllerTreeDataProvider } from './tree/controllerTreeDataProvider';
import { ControllerDataModel } from './data/controllerDataModel';
import { AddControllerTreeNode } from './tree/addControllerTreeNode';


export function registerCommands(
	appContext: AppContext,
	treeDataProvider: ControllerTreeDataProvider,
	controllerDataModel: ControllerDataModel
): void {
	registerRegisterArisControllerCommand(appContext, treeDataProvider, controllerDataModel);
}

function registerRegisterArisControllerCommand(
	appContext: AppContext,
	treeDataProvider: ControllerTreeDataProvider,
	controllerDataModel: ControllerDataModel
): void {
	appContext.apiWrapper.registerCommand('aris.resource.registerArisController', (node: TreeNode) => {
		if (node && !(node instanceof AddControllerTreeNode)) {
			return;
		}

		// await vscode.workspace.getConfiguration('bigDataClusterControllers').update('controllers', undefined, true);
		// let config = vscode.workspace.getConfiguration('bigDataClusterControllers');

		let d = new AddControllerDialog();
		d.showDialog(async (res, rememberPassword) => {
			await treeDataProvider.addController(res.request.url, res.request.username, res.request.password, rememberPassword, res.endPoints);
			vscode.window.showInformationMessage(res.endPoints[0].endpoint);
		}, error => {
			vscode.window.showInformationMessage(`${error.message}, What?!!`);
		});
	});
}