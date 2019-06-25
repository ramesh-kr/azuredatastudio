/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// import * as vscode from 'vscode';
import { TreeDataProvider, EventEmitter, Event, TreeItem, workspace } from 'vscode';
import { AppContext } from '../../appContext';
import { TreeNode } from './treeNode';
import { IControllerTreeChangeHandler } from './controllerTreeChangeHandler';

import * as nls from 'vscode-nls';
import { ControllerDataModel } from '../data/controllerDataModel';
import { AddControllerTreeNode } from './addControllerTreeNode';
import { ControllerRootNode, ControllerNode } from './controllerTreeNode';
import { IEndPoint } from '../../controllerApi/wrapper';

const localize = nls.loadMessageBundle();

export function registerTreeDataProvider(appContext: AppContext, treeDataProvider:ControllerTreeDataProvider): void {
	appContext.apiWrapper.registerTreeDataProvider('arisResourceExplorer', treeDataProvider);
}

export class ControllerTreeDataProvider implements TreeDataProvider<TreeNode>, IControllerTreeChangeHandler {

	private static readonly loadingLabel = localize('aris.resource.tree.treeProvider.loadingLabel', 'Loading ...');

	private _onDidChangeTreeData: EventEmitter<TreeNode> = new EventEmitter<TreeNode>();
	public readonly onDidChangeTreeData: Event<TreeNode> = this._onDidChangeTreeData.event;
	private root: ControllerRootNode;

	constructor(
		public appContext: AppContext,
		public readonly controllerDataModel: ControllerDataModel) {

		this.root = new ControllerRootNode(this);
		this.loadSavedControllers();
	}

	public async getChildren(element?: TreeNode): Promise<TreeNode[]> {
		if (element) {
			return element.getChildren();
		}

		if (this.root.hasChildren) {
			return this.root.getChildren();
		} else {
			return [new AddControllerTreeNode()];
		}
	}

	public getTreeItem(element: TreeNode): TreeItem | Thenable<TreeItem> {
		return element.getTreeItem();
	}

	public async addController(url: string, username: string, password: string, rememberPassword: boolean, endPoints?: IEndPoint[]): Promise<void> {
		await this.root.addControllerNode(url, username, password, rememberPassword, endPoints);
		this.notifyNodeChanged();
	}

	public notifyNodeChanged(node?: TreeNode): void {
		this._onDidChangeTreeData.fire(node);
	}

	public async refresh(node?: TreeNode): Promise<void> {
		this._onDidChangeTreeData.fire(node);
	}

	public loadSavedControllers(): void {
		let config = workspace.getConfiguration('bigDataClusterControllers');
		if (config && config.controllers) {
			let controllers = config.controllers;
			this.root.clearChildren();
			for (let c of controllers) {
				this.root.addChild(new ControllerNode(c.url, c.username, c.password, c.password !== undefined, this.root, this));
			}
			this.notifyNodeChanged();
		}
	}

	public async saveControllers(): Promise<void> {
		let controllers = this.root.children.map(e => {
			let c = e as ControllerNode;
			return {
				url: c.url,
				username: c.username,
				password: c.rememberPassword ? c.password : undefined
			};
		});
		await workspace.getConfiguration('bigDataClusterControllers').update('controllers', controllers, true);
	}
}
