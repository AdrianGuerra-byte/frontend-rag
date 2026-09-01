import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDirectory = mkdtempSync(path.join(os.tmpdir(), "frontend-rag-contract-"));
const typeScriptCompiler = path.join(projectRoot, "node_modules/typescript/bin/tsc");

try {
  execFileSync(
    process.execPath,
    [
      typeScriptCompiler,
      "--target",
      "ES2022",
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--lib",
      "ES2022,DOM",
      "--types",
      "node",
      "--strict",
      "--skipLibCheck",
      "--esModuleInterop",
      "--rootDir",
      projectRoot,
      "--outDir",
      buildDirectory,
      "src/lib/analysis-contract.ts",
      "src/lib/api.ts",
      "src/lib/form-validation.ts",
      "src/lib/image-validation.ts",
      "src/lib/submission-gate.ts",
      "src/types/analysis.ts",
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  execFileSync(
    process.execPath,
    ["--test", path.join(projectRoot, "tests/frontend-contract.test.mjs")],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        FRONTEND_CONTRACT_BUILD: buildDirectory,
      },
      stdio: "inherit",
    },
  );
} finally {
  rmSync(buildDirectory, { force: true, recursive: true });
}
