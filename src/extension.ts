import * as vscode from "vscode";
import * as path from "path";
import * as cp from "child_process";
import {
  readDependencies,
  writeDependencies,
  generateDependenciesCMake,
  generateFeaturesCMake,
  ensureBaseCMakeFiles
} from "./cmakeGenerator";
import { FortranDependency } from "./dependencyModel";
import { DependencyTreeProvider, DependencyItem } from "./treeView";
import { parseCMakeOutputForStatus } from "./statusParser";
import { showDependencyWebview } from "./webview";
import { generateProjectLinkCMake } from "./cmakeGenerator";

function getWorkspaceFolder(): string | undefined {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showWarningMessage("Open a folder before using Fortran CMake Dependency Helper.");
  }
  return workspaceFolder;
}

export function activate(context: vscode.ExtensionContext) {
  const treeProvider = new DependencyTreeProvider(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "");
  vscode.window.registerTreeDataProvider("fortranDeps.treeView", treeProvider);

  // Initialize project
  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.initProject", async () => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      const projectName = await vscode.window.showInputBox({
        prompt: "Project name",
        value: "fortran_app"
      });
      if (!projectName) {
        return;
      }

      ensureBaseCMakeFiles(workspaceFolder, projectName);
      vscode.window.showInformationMessage(`Initialized Fortran+CMake project: ${projectName}`);
    })
  );

  // Add dependency
  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.addDependency", async () => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: "Dependency logical name (e.g. jsonfortran)",
        validateInput: v => (v.trim() ? undefined : "Name is required")
      });
      if (!name) {
        return;
      }

      const repo = await vscode.window.showInputBox({
        prompt: "GitHub repository URL (e.g. https://github.com/jacobwilliams/json-fortran)",
        validateInput: v => (v.trim() ? undefined : "Repository URL is required")
      });
      if (!repo) {
        return;
      }

      const tag = await vscode.window.showInputBox({
        prompt: "Git tag/branch (default: main)",
        value: "main"
      });

      const cmakePackage = await vscode.window.showInputBox({
        prompt: "CMake package name for find_package (default: same as logical name)",
        value: name
      });

      const deps = readDependencies(workspaceFolder);
      const newDep: FortranDependency = {
        name,
        repo,
        tag: tag || "main",
        cmakePackage: cmakePackage || name
      };
      deps.dependencies.push(newDep);
      writeDependencies(workspaceFolder, deps);
      generateDependenciesCMake(workspaceFolder, deps);
      generateFeaturesCMake(workspaceFolder, deps);
      generateProjectLinkCMake(workspaceFolder, deps);
      treeProvider.refresh();

      await vscode.commands.executeCommand("fortranDeps.validateDependencies");
      vscode.window.showInformationMessage(`Added dependency: ${name}`);
    })
  );

  // Edit dependency
  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.editDependency", async (item?: DependencyItem) => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      const deps = readDependencies(workspaceFolder);
      const targetName = item?.label || await vscode.window.showQuickPick(
        deps.dependencies.map(d => d.name),
        { placeHolder: "Select dependency to edit" }
      );

      if (!targetName) {
        return;
      }

      const dep = deps.dependencies.find(d => d.name === targetName);
      if (!dep) {
        return;
      }

      const newRepo = await vscode.window.showInputBox({
        prompt: "GitHub repository URL",
        value: dep.repo
      });

      const newTag = await vscode.window.showInputBox({
        prompt: "Git tag/branch",
        value: dep.tag || "main"
      });

      dep.repo = newRepo || dep.repo;
      dep.tag = newTag || dep.tag;

      writeDependencies(workspaceFolder, deps);
      generateDependenciesCMake(workspaceFolder, deps);
      generateFeaturesCMake(workspaceFolder, deps);
      generateProjectLinkCMake(workspaceFolder, deps);
      treeProvider.refresh();

      await vscode.commands.executeCommand("fortranDeps.validateDependencies");
      vscode.window.showInformationMessage(`Updated dependency: ${dep.name}`);
    })
  );

  // Remove dependency
  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.removeDependency", async (item?: DependencyItem) => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      const deps = readDependencies(workspaceFolder);
      const targetName = item?.label || await vscode.window.showQuickPick(
        deps.dependencies.map(d => d.name),
        { placeHolder: "Select dependency to remove" }
      );

      if (!targetName) {
        return;
      }

      const originalLength = deps.dependencies.length;
      deps.dependencies = deps.dependencies.filter(d => d.name !== targetName);

      if (deps.dependencies.length === originalLength) {
        return;
      }

      writeDependencies(workspaceFolder, deps);
      generateDependenciesCMake(workspaceFolder, deps);
      generateFeaturesCMake(workspaceFolder, deps);
      generateProjectLinkCMake(workspaceFolder, deps);
      treeProvider.refresh();

      await vscode.commands.executeCommand("fortranDeps.validateDependencies");
      vscode.window.showInformationMessage(`Removed dependency: ${targetName}`);
    })
  );

  // Validate dependencies (run CMake)
  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.validateDependencies", async () => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      const config = vscode.workspace.getConfiguration("fortranDeps");
      const cmakeExe = config.get<string>("cmakeGenerator", "cmake");
      const buildDirRel = config.get<string>("buildDirectory", "build");
      const buildDir = path.join(workspaceFolder, buildDirRel);

      let configureOutput = "";
      let buildOutput = "";

      try {
        configureOutput = await runCMakeConfigure(cmakeExe, workspaceFolder, buildDir);
        buildOutput = await runCMakeBuild(cmakeExe, buildDir);
      } catch {
        // errors already surfaced to user
      }

      const combinedOutput = configureOutput + "\n" + buildOutput;
      const statusMap = parseCMakeOutputForStatus(combinedOutput);
      treeProvider.setStatusMap(statusMap);
      treeProvider.refresh();

      const summary = buildSummary(statusMap);
      vscode.window.showInformationMessage(summary);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("fortranDeps.openWebview", () => {
      const workspaceFolder = getWorkspaceFolder();
      if (!workspaceFolder) {
        return;
      }

      showDependencyWebview(workspaceFolder);
    })
  );

  // Auto-regenerate dependencies.cmake when JSON is saved
  vscode.workspace.onDidSaveTextDocument(doc => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
      return;
    }
    if (doc.fileName.endsWith("fortran-deps.json")) {
      const deps = readDependencies(workspaceFolder);
      generateDependenciesCMake(workspaceFolder, deps);
      generateFeaturesCMake(workspaceFolder, deps);
      generateProjectLinkCMake(workspaceFolder, deps);
      treeProvider.refresh();
    }
  });
}

function buildSummary(statusMap: Record<string, import("./statusParser").DependencyStatus>): string {
  const entries = Object.entries(statusMap);
  if (!entries.length) {
    return "Dependencies validated: no status information detected.";
  }

  const parts = entries.map(([name, status]) => {
    if (status === "found") return `✔ ${name} (found)`;
    if (status === "fallback") return `↺ ${name} (fallback)`;
    if (status === "failed") return `✖ ${name} (failed)`;
    return `? ${name} (unknown)`;
  });

  return "Dependencies validated:\n" + parts.join("\n");
}

async function runCMakeConfigure(cmakeExe: string, srcDir: string, buildDir: string): Promise<string> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Running CMake configure...",
      cancellable: false
    },
    () =>
      new Promise<string>((resolve, reject) => {
        const args = ["-S", srcDir, "-B", buildDir];
        const proc = cp.spawn(cmakeExe, args, { cwd: srcDir });

        let output = "";
        proc.stdout.on("data", d => (output += d.toString()));
        proc.stderr.on("data", d => (output += d.toString()));

        proc.on("close", code => {
          if (code === 0) {
            vscode.window.showInformationMessage("CMake configure completed successfully.");
            resolve(output);
          } else {
            vscode.window.showErrorMessage("CMake configure failed. See output for details.");
            vscode.window.showInformationMessage(output);
            reject(new Error("CMake configure failed"));
          }
        });
      })
  );
}

async function runCMakeBuild(cmakeExe: string, buildDir: string): Promise<string> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Validating dependencies (CMake build)...",
      cancellable: false
    },
    () =>
      new Promise<string>((resolve, reject) => {
        const args = ["--build", buildDir, "--target", "all"];
        const proc = cp.spawn(cmakeExe, args, { cwd: buildDir });

        let output = "";
        proc.stdout.on("data", d => (output += d.toString()));
        proc.stderr.on("data", d => (output += d.toString()));

        proc.on("close", code => {
          if (code === 0) {
            vscode.window.showInformationMessage("Dependencies validated successfully via CMake.");
            resolve(output);
          } else {
            vscode.window.showErrorMessage("CMake build failed during dependency validation.");
            vscode.window.showInformationMessage(output);
            reject(new Error("CMake build failed"));
          }
        });
      })
  );
}

export function deactivate() {}
