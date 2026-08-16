import * as vscode from "vscode";
import { readDependencies, writeDependencies, generateDependenciesCMake } from "./cmakeGenerator";
import { FortranDependency } from "./dependencyModel";

export function showDependencyWebview(workspaceFolder: string) {
  const panel = vscode.window.createWebviewPanel(
    "fortranDepsWebview",
    "Fortran Dependencies",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const deps = readDependencies(workspaceFolder).dependencies;
  panel.webview.html = getHtml(deps);

  panel.webview.onDidReceiveMessage(message => {
    if (message.type === "save") {
      const newDeps: FortranDependency[] = message.dependencies;
      writeDependencies(workspaceFolder, { dependencies: newDeps });
      generateDependenciesCMake(workspaceFolder, { dependencies: newDeps });
      vscode.window.showInformationMessage("Dependencies updated from webview.");
    }
  });
}

function getHtml(deps: FortranDependency[]): string {
  const rows = deps
    .map(
      d => `
      <tr>
        <td><input value="${d.name}" data-field="name"></td>
        <td><input value="${d.repo}" data-field="repo"></td>
        <td><input value="${d.tag || ""}" data-field="tag"></td>
        <td><input value="${d.cmakePackage || ""}" data-field="cmakePackage"></td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #ccc; padding: 4px; }
    input { width: 100%; box-sizing: border-box; }
    button { margin-top: 10px; }
  </style>
</head>
<body>
  <h2>Fortran Dependencies</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Repo</th>
        <th>Tag</th>
        <th>CMake Package</th>
      </tr>
    </thead>
    <tbody id="dep-body">
      ${rows}
    </tbody>
  </table>
  <button id="save">Save</button>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById("save").addEventListener("click", () => {
      const rows = Array.from(document.querySelectorAll("#dep-body tr"));
      const deps = rows.map(row => {
        const inputs = row.querySelectorAll("input");
        const obj = {};
        inputs.forEach(input => {
          obj[input.dataset.field] = input.value;
        });
        return obj;
      });

      vscode.postMessage({ type: "save", dependencies: deps });
    });
  </script>
</body>
</html>`;
}
