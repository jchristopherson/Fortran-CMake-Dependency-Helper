import * as vscode from "vscode";
import {
  readDependencies,
  writeDependencies,
  generateDependenciesCMake,
  generateProjectLinkCMake
} from "./cmakeGenerator";
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
      generateProjectLinkCMake(workspaceFolder, { dependencies: newDeps });
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
        <td><input value="${d.version || ""}" data-field="version"></td>
        <td><input value="${d.cmakePackage || ""}" data-field="cmakePackage"></td>
        <td><button class="delete-row" type="button">Delete</button></td>
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
    .delete-row { margin-top: 0; }
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
        <th>Version</th>
        <th>CMake Package</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody id="dep-body">
      ${rows}
    </tbody>
  </table>
  <button id="add-row" type="button">Add Row</button>
  <button id="save">Save</button>

  <script>
    const vscode = acquireVsCodeApi();

    function readRow(row) {
      const inputs = row.querySelectorAll("input");
      const obj = {};
      inputs.forEach(input => {
        obj[input.dataset.field] = input.value;
      });
      return obj;
    }

    function addRow() {
      const tbody = document.getElementById("dep-body");
      const row = document.createElement("tr");
      row.innerHTML = '<td><input value="" data-field="name"></td>' +
        '<td><input value="" data-field="repo"></td>' +
        '<td><input value="" data-field="tag"></td>' +
        '<td><input value="" data-field="version"></td>' +
        '<td><input value="" data-field="cmakePackage"></td>' +
        '<td><button class="delete-row" type="button">Delete</button></td>';
      row.querySelector(".delete-row").addEventListener("click", () => row.remove());
      tbody.appendChild(row);
    }

    document.getElementById("add-row").addEventListener("click", addRow);

    document.querySelectorAll(".delete-row").forEach(button => {
      button.addEventListener("click", () => {
        button.closest("tr").remove();
      });
    });

    document.getElementById("save").addEventListener("click", () => {
      const rows = Array.from(document.querySelectorAll("#dep-body tr"));
      const deps = rows
        .map(row => readRow(row))
        .filter(dep => dep.name || dep.repo || dep.tag || dep.version || dep.cmakePackage);

      vscode.postMessage({ type: "save", dependencies: deps });
    });
  </script>
</body>
</html>`;
}
