import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	if (vscode.workspace.workspaceFolders) {
		const root = vscode.workspace.workspaceFolders[0].uri.fsPath
		const notesTopicProvider = new NotesProvider(root);
		vscode.window.registerTreeDataProvider('note-topics', notesTopicProvider);
	}

}

export function deactivate() { }

export class NotesProvider implements vscode.TreeDataProvider<NoteTopic> {

	private _onDidChangeTreeData: vscode.EventEmitter<NoteTopic | undefined | void> = new vscode.EventEmitter<NoteTopic | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<NoteTopic | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	private topicsFilesMap: Map<String, Array<string>> = new Map()

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: NoteTopic): vscode.TreeItem {
		return element;
	}

	getChildren(element?: NoteTopic): Thenable<NoteTopic[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('Note taking not available without a workspace');
			return Promise.resolve([]);
		}

		// if (element) {
		// 	return Promise.resolve([new NoteTopic("foo", vscode.TreeItemCollapsibleState.None)]);
		// } else {
		// 	return Promise.resolve([]);
		// }

		console.log(`dbg: workspaceRoot:: ${this.workspaceRoot}`)

		if (element) {
			const files = this.topicsFilesMap.get(element.label)
			if (files) {
				return Promise.resolve([new NoteTopic(files[0], vscode.TreeItemCollapsibleState.None)]) //fixme use all files
			} else {
				return Promise.resolve([]);
			}
		} else {
			let mytopics: Array<NoteTopic> = []

			const files = fs.readdirSync(this.workspaceRoot);
			files.forEach(f => {
				const content = fs.readFileSync(path.join(this.workspaceRoot, f))
				const topicsLine = content.toString().split("\n").filter(x => x.startsWith(":topics: "))[0]
				const topics = topicsLine.substring(":topics: ".length).split(", ")
				const dedupTopics = Array.from(new Set(topics))
				dedupTopics.map(t => this.topicsFilesMap.set(t, [f])) //fixme append to list,not override
				dedupTopics.map(t => mytopics.push(new NoteTopic(t, vscode.TreeItemCollapsibleState.Expanded)))

			})

			//todo: working dedup
			return Promise.resolve(Array.from(new Set(mytopics)));
		}



	}
}

export class NoteTopic extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}`;
		this.description = this.label;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'topic';

	command = new MyCommand()
}

class MyCommand implements vscode.Command {
	title: string = "open"
	command: string = "vscode.open"
	tooltip?: string | undefined;
	arguments?: any[] | undefined;

}