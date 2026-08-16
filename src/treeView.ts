import * as vscode from "vscode";
import { readDependencies } from "./cmakeGenerator";
import { DependencyStatus } from "./statusParser";

export class DependencyTreeProvider implements vscode.TreeDataProvider<DependencyItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<DependencyItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private statusMap: Record<string, DependencyStatus> = {};

  constructor(private workspaceFolder: string) {}

  setStatusMap(map: Record<string, DependencyStatus>) {
    this.statusMap = map;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DependencyItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DependencyItem): Thenable<DependencyItem[]> {
    if (!this.workspaceFolder) {
      return Promise.resolve([]);
    }
    if (element) {
      return Promise.resolve([]);
    }
    const deps = readDependencies(this.workspaceFolder).dependencies;
    return Promise.resolve(
      deps.map(d => {
        const status = this.statusMap[d.cmakePackage || d.name] || "unknown";
        return new DependencyItem(d.name, d.repo, status);
      })
    );
  }
}

export class DependencyItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly repo: string,
    public readonly status: DependencyStatus
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.description = repo;
    this.contextValue = "fortranDependency";

    if (status === "found") {
      this.iconPath = new vscode.ThemeIcon("check", new vscode.ThemeColor("testing.iconPassed"));
    } else if (status === "fallback") {
      this.iconPath = new vscode.ThemeIcon("sync", new vscode.ThemeColor("charts.yellow"));
    } else if (status === "failed") {
      this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));
    } else {
      this.iconPath = new vscode.ThemeIcon("question");
    }
  }
}
