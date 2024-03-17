import * as vscode from 'vscode';
import { BvhViewProvider } from './bvhProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(BvhViewProvider.register(context));
}

// This method is called when your extension is deactivated
export function deactivate() {}
