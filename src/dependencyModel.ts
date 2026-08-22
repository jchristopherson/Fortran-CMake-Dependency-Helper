export interface FortranDependency {
  name: string;
  repo: string;
  tag?: string;
  version?: string;
  cmakePackage?: string;
}

export type CoarrayFallback = "single" | "fetch" | "error";

export interface ProjectFeatures {
  openmp?: boolean;
  coarrays?: boolean;
  coarrayFallback?: CoarrayFallback;
  parallelDoConcurrent?: boolean;
}

export interface DependencyFile {
  dependencies: FortranDependency[];
  features?: ProjectFeatures;
}

export const FEATURES_TARGET = "fortran_project_features";

export const DEP_FILE_NAME = ".vscode/fortran-deps.json";
