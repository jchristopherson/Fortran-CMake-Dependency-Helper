import * as vscode from "vscode";
import {
  readDependencies,
  writeDependencies,
  generateDependenciesCMake,
  generateFeaturesCMake,
  generateProjectLinkCMake
} from "./cmakeGenerator";
import { FortranDependency, ProjectFeatures, CoarrayFallback } from "./dependencyModel";

let currentPanel: vscode.WebviewPanel | undefined;

export function showDependencyWebview(workspaceFolder: string) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "fortranDepsWebview",
    "Fortran Dependencies",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  currentPanel = panel;
  panel.onDidDispose(() => {
    currentPanel = undefined;
  });

  const depFile = readDependencies(workspaceFolder);
  panel.webview.html = getHtml(depFile.dependencies, depFile.features ?? {});

  panel.webview.onDidReceiveMessage(message => {
    if (message.type === "save") {
      const newDeps: FortranDependency[] = message.dependencies;
      const features: ProjectFeatures = {
        openmp: message.features?.openmp === true,
        coarrays: message.features?.coarrays === true,
        coarrayFallback: normalizeFallback(message.features?.coarrayFallback),
        parallelDoConcurrent: message.features?.parallelDoConcurrent === true
      };
      const updated = { dependencies: newDeps, features };
      writeDependencies(workspaceFolder, updated);
      generateDependenciesCMake(workspaceFolder, updated);
      generateFeaturesCMake(workspaceFolder, updated);
      generateProjectLinkCMake(workspaceFolder, updated);
      vscode.commands.executeCommand("fortranDeps.validateDependencies");
      vscode.window.showInformationMessage("Dependencies updated from webview.");
    }
  });
}

function normalizeFallback(value: unknown): CoarrayFallback {
  return value === "fetch" || value === "error" ? value : "single";
}

function getHtml(deps: FortranDependency[], features: ProjectFeatures): string {
  const fallback = normalizeFallback(features.coarrayFallback);
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
    fieldset { margin-top: 16px; border: 1px solid #ccc; }
    fieldset label { display: block; margin: 4px 0; }
    fieldset input { width: auto; margin-right: 6px; }
    fieldset select { width: auto; margin-left: 6px; }
    fieldset label.sub-option { margin-left: 24px; }
    fieldset label.sub-option.disabled { opacity: 0.5; }
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

  <fieldset>
    <legend>Build Features</legend>
    <label>
      <input type="checkbox" id="feature-openmp"${features.openmp ? " checked" : ""}>
      Enable OpenMP (find_package(OpenMP) and link OpenMP::OpenMP_Fortran)
    </label>
    <label>
      <input type="checkbox" id="feature-coarrays"${features.coarrays ? " checked" : ""}>
      Enable coarrays (compiler-specific flags detected in CMake)
    </label>
    <label class="sub-option" id="coarray-fallback-label">
      If OpenCoarrays is missing (GNU Fortran):
      <select id="coarray-fallback">
        <option value="single"${fallback === "single" ? " selected" : ""}>Warn and build single-image</option>
        <option value="fetch"${fallback === "fetch" ? " selected" : ""}>Build OpenCoarrays via FetchContent (needs MPI)</option>
        <option value="error"${fallback === "error" ? " selected" : ""}>Fail configuration with install hints</option>
      </select>
    </label>
    <label>
      <input type="checkbox" id="feature-doconcurrent"${features.parallelDoConcurrent ? " checked" : ""}>
      Parallelize DO CONCURRENT (compiler-specific flags detected in CMake; OpenMP is pulled in automatically for compilers that need it)
    </label>
  </fieldset>

  <button id="save">Save</button>

  <script>
    const vscode = acquireVsCodeApi();
    const openmpBox = document.getElementById("feature-openmp");
    const coarraysBox = document.getElementById("feature-coarrays");
    const doConcurrentBox = document.getElementById("feature-doconcurrent");
    const fallbackSelect = document.getElementById("coarray-fallback");

    const savedState = vscode.getState();
    if (savedState && savedState.features) {
      openmpBox.checked = savedState.features.openmp === true;
      coarraysBox.checked = savedState.features.coarrays === true;
      doConcurrentBox.checked = savedState.features.parallelDoConcurrent === true;
      if (savedState.features.coarrayFallback) {
        fallbackSelect.value = savedState.features.coarrayFallback;
      }
    }

    function currentFeatures() {
      return {
        openmp: openmpBox.checked,
        coarrays: coarraysBox.checked,
        coarrayFallback: fallbackSelect.value,
        parallelDoConcurrent: doConcurrentBox.checked
      };
    }

    function persistFeatures() {
      vscode.setState({ features: currentFeatures() });
    }

    function syncFallbackAvailability() {
      const fallbackLabel = document.getElementById("coarray-fallback-label");
      fallbackSelect.disabled = !coarraysBox.checked;
      fallbackLabel.classList.toggle("disabled", !coarraysBox.checked);
    }

    openmpBox.addEventListener("change", persistFeatures);
    coarraysBox.addEventListener("change", () => {
      syncFallbackAvailability();
      persistFeatures();
    });
    doConcurrentBox.addEventListener("change", persistFeatures);
    fallbackSelect.addEventListener("change", persistFeatures);
    syncFallbackAvailability();
    persistFeatures();

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

      vscode.postMessage({
        type: "save",
        dependencies: deps,
        features: currentFeatures()
      });
    });
  </script>
</body>
</html>`;
}
