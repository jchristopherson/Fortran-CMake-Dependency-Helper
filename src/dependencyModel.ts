export interface FortranDependency {
  name: string;
  repo: string;
  tag?: string;
  version?: string;
  cmakePackage?: string;
}

export interface DependencyFile {
  dependencies: FortranDependency[];
}

export const DEP_FILE_NAME = ".vscode/fortran-deps.json";
