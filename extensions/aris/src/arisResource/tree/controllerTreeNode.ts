/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as nls from 'vscode-nls';
import { IControllerTreeChangeHandler } from './controllerTreeChangeHandler';
import { TreeNode } from './treeNode';
import { IEndPoint, IControllerError } from '../../controllerApi/wrapper';
import { ArisControllerApi } from '../../controllerApi/controllerApi';
import { AddControllerDialog } from '../../addControllerDialog';
import { IconPath } from '../constants';

const localize = nls.loadMessageBundle();

export abstract class ControllerTreeNode extends TreeNode {
	private _description: string;
	private _nodeType: string;
	private _iconPath: { dark: string, light: string };
	private _treeChangeHandler: IControllerTreeChangeHandler;

	public constructor(
		id: string,
		label: string,
		parent: ControllerTreeNode,
		description: string,
		nodeType: string,
		iconPath: { dark: string, light: string },
		treeChangeHandler: IControllerTreeChangeHandler
	) {
		super(id, label, parent);
		this.description = description;
		this.nodeType = nodeType;
		this.iconPath = iconPath;
		this.treeChangeHandler = treeChangeHandler;
	}

	public get description(): string {
		return this._description;
	}

	public set description(description: string) {
		this._description = description;
	}

	public get nodeType(): string {
		return this._nodeType;
	}

	public set nodeType(nodeType: string) {
		this._nodeType = nodeType;
	}

	public set iconPath(iconPath: { dark: string, light: string }) {
		this._iconPath = iconPath;
	}

	public get iconPath(): { dark: string, light: string } {
		return this._iconPath;
	}

	public set treeChangeHandler(treeChangeHandler: IControllerTreeChangeHandler) {
		this._treeChangeHandler = treeChangeHandler;
	}

	public get treeChangeHandler(): IControllerTreeChangeHandler {
		return this._treeChangeHandler;
	}

	public abstract expand(): Promise<TreeNode[]>;

	public getTreeItem(): vscode.TreeItem {
		let item: vscode.TreeItem = {};
		item.id = this.id;
		item.label = this.label;
		item.collapsibleState = this.isLeaf ?
			vscode.TreeItemCollapsibleState.None :
			vscode.TreeItemCollapsibleState.Collapsed;
		item.iconPath =this._iconPath;
		item.contextValue = this._nodeType;
		item.tooltip = this._description;
		item.iconPath = this._iconPath;
		return item;
	}

	public getNodeInfo(): azdata.NodeInfo {
		return {
			label: this.label,
			isLeaf: this.isLeaf,
			errorMessage: undefined,
			metadata: undefined,
			nodePath: this.nodePath,
			nodeStatus: undefined,
			nodeType: this._nodeType,
			iconType: this._nodeType,
			nodeSubType: undefined
		};
	}

	public notifyNodeChanged(node?: ControllerTreeNode): void {
		this._treeChangeHandler.notifyNodeChanged(node);
	}

	public async refresh(node?: ControllerTreeNode): Promise<void> {
		this._treeChangeHandler.refresh(node);
	}
}

export class ControllerRootNode extends ControllerTreeNode {
	constructor(
		treeChangeHandler: IControllerTreeChangeHandler
	) {
		super('root', 'root', undefined, 'root', 'ControllerRoot', undefined, treeChangeHandler);
	}

	public async expand(): Promise<ControllerNode[]> {
		return this.children as ControllerNode[];
	}

	public async addControllerNode(url: string, username: string, password: string, rememberPassword: boolean, endPoints?: IEndPoint[]): Promise<void> {
		let controllerNode = this.getExistingControllerNode(url, username);
		if (controllerNode) {
			controllerNode.password = password;
			controllerNode.rememberPassword = rememberPassword;
			controllerNode.clearChildren();
		} else {
			this.addChild(new ControllerNode(url, username, password, rememberPassword, this, this.treeChangeHandler));
		}

		if (endPoints && endPoints.length > 0) {
			for (let ep of endPoints) {
				controllerNode.addEndPointNode(ep.name, ep.endpoint, ep.description);
			}
		}

		this.notifyNodeChanged();
		await this.treeChangeHandler.saveControllers();
	}

	private getExistingControllerNode(url: string, username: string): ControllerNode {
		return !this.hasChildren ? undefined :
			(this.children as ControllerNode[]).find(e => e.url === url && e.username === username);
	}
}

export class ControllerNode extends ControllerTreeNode {
	private _url: string;
	private _username: string;
	private _password: string;
	private _rememberPassword: boolean;

	constructor(
		url: string,
		username: string,
		password: string,
		rememberPassword: boolean,
		parent: ControllerRootNode,
		treeChangeHandler: IControllerTreeChangeHandler
	) {
		super(undefined, undefined, parent, undefined, 'ControllerNode', IconPath.ControllerNode, treeChangeHandler);
		this.url = url;
		this.username = username;
		this.password = password;
		this.rememberPassword = rememberPassword;
		let label = `${this.url} (${this.username})`;
		this.id = label;
		this.label = label;
		this.description = label;
	}

	public get url() {
		return this._url;
	}

	public set url(url: string) {
		this._url = url;
	}

	public get username() {
		return this._username;
	}

	public set username(username: string) {
		this._username = username;
	}

	public get password() {
		return this._password;
	}

	public set password(pw: string) {
		this._password = pw;
	}

	public get rememberPassword() {
		return this._rememberPassword;
	}

	public set rememberPassword(rememberPassword: boolean) {
		this._rememberPassword = rememberPassword;
	}

	public async expand(): Promise<EndPointNode[]> {
		if (this.children && this.children.length > 0) {
			this.clearChildren();
			this.notifyNodeChanged();
		}

		if (!this._password) {
			let d = new AddControllerDialog();
			d.setDefaultValues(this.url, this.username);
			d.showDialog(async(res, rememberPassword) => {
				this.password = res.request.password;
				let save: boolean = !!this.rememberPassword !== !!rememberPassword;
				this.rememberPassword = !!rememberPassword;
				for (let ep of res.endPoints) {
					this.addEndPointNode(ep.name, ep.endpoint, ep.description);
				}
				this.notifyNodeChanged();
				if (save) {
					await this.treeChangeHandler.saveControllers();
				}
				vscode.window.showInformationMessage(res.endPoints[0].endpoint);
			}, error => {
				vscode.window.showErrorMessage(`${error.message}, What?!!`);
			});
			return this.children as EndPointNode[];
		}

		return await ArisControllerApi.getEndPoints(this._url, this._username, this._password, true).then(response => {
			for (let ep of response.endPoints) {
				this.addEndPointNode(ep.name, ep.endpoint, ep.description);
			}
			this.notifyNodeChanged();
			return this.children as EndPointNode[];
		}, error => {
			let e = error as IControllerError;
			vscode.window.showErrorMessage(`${e.message}, What?!!`);
			return this.children as EndPointNode[];
		});
	}

	public addEndPointNode(role: string, endPointAddress: string, description: string): void {
		this.addChild(new EndPointNode(role, endPointAddress, description, this, this.treeChangeHandler));
		this.notifyNodeChanged();
	}

	public getTreeItem(): vscode.TreeItem {
		let item: vscode.TreeItem = super.getTreeItem();
		item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		return item;
	}
}

export class EndPointNode extends ControllerTreeNode {
	private _role: string;
	private _endPointAddress: string;

	constructor(
		role: string,
		endPointAddress: string,
		description: string,
		parent: ControllerNode,
		treeChangeHandler: IControllerTreeChangeHandler,
	) {
		super(undefined, undefined, parent, description, 'EndPointNode', IconPath.EndPointNode, treeChangeHandler);
		this.role = role;
		this.endPointAddress = endPointAddress;
		let label = `${this._role}: ${this._endPointAddress}`;
		this.id = label;
		this.label = label;
		this.isLeaf = true;
	}

	public get role() {
		return this._role;
	}

	public set role(role: string) {
		this._role = role;
	}

	public get endPointAddress() {
		return this._endPointAddress;
	}

	public set endPointAddress(endPointAddress: string) {
		this._endPointAddress = endPointAddress;
	}

	public async expand(): Promise<TreeNode[]> {
		return this.children;
	}
}
