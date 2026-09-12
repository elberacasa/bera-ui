#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Compile the strings shown in Install, rather than separately authored fixtures.
// Generated recipes live at the same relative paths a consumer would import.
export async function checkTransitionExamples(repository) {
  repository = await fs.realpath(repository);
  const require = createRequire(path.join(repository, "package.json"));
  const ts = require("typescript");
  const project = await fs.mkdtemp(
    path.join(os.tmpdir(), "bera-transition-examples-"),
  );
  const diagnosticHost = {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => project,
    getNewLine: () => "\n",
  };
  const assertCompiles = (program, label) => {
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length) {
      throw new Error(
        `${label}\n${ts.formatDiagnostics(diagnostics, diagnosticHost)}`,
      );
    }
  };

  try {
    await fs.symlink(
      path.join(repository, "node_modules"),
      path.join(project, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    // The repository uses ESM; this isolated loader allows its TypeScript helper's
    // extensionless local imports to run without another loader or dependency.
    await fs.writeFile(
      path.join(project, "package.json"),
      JSON.stringify({ type: "commonjs" }),
    );
    const helperDirectory = path.join(project, "helpers");
    const helperProgram = ts.createProgram({
      rootNames: [path.join(repository, "lib/transition-examples.ts")],
      options: {
        rootDir: path.join(repository, "lib"),
        outDir: helperDirectory,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        strict: true,
        skipLibCheck: true,
        noEmitOnError: true,
        types: [],
      },
    });
    assertCompiles(
      helperProgram,
      "The Install example generator must compile.",
    );
    const emitted = helperProgram.emit();
    assert.ok(
      !emitted.emitSkipped,
      "The Install example generator did not emit.",
    );
    const { transitionUsage } = require(
      path.join(helperDirectory, "transition-examples.js"),
    );

    const catalog = JSON.parse(
      await fs.readFile(
        path.join(repository, "lib/transition-catalog.json"),
        "utf8",
      ),
    );
    assert.ok(
      Array.isArray(catalog) && catalog.length,
      "The catalog is empty.",
    );
    const components = path.join(project, "components/bera");
    await fs.mkdir(components, { recursive: true });
    const declarations = path.join(project, "styles.d.ts");
    await fs.writeFile(declarations, 'declare module "*.css";\n');
    const roots = [declarations];
    const ids = new Set();

    for (const item of catalog) {
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!ids.has(item.id), `Duplicate catalog item: ${item.id}`);
      ids.add(item.id);
      for (const extension of ["tsx", "css"]) {
        await fs.copyFile(
          path.join(repository, `public/transitions/${item.id}.${extension}`),
          path.join(components, `${item.id}.${extension}`),
        );
      }
      const source = transitionUsage(item, { tempo: 1.3, radius: 8 });
      assert.ok(source.trim(), `Missing Install example: ${item.id}`);
      const example = path.join(project, `${item.id}.tsx`);
      await fs.writeFile(example, source);
      roots.push(example);
    }

    const program = ts.createProgram({
      rootNames: roots,
      options: {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noUncheckedSideEffectImports: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
        types: ["react", "react-dom"],
        typeRoots: [path.join(repository, "node_modules/@types")],
      },
    });
    assertCompiles(program, "Install examples must compile as consumer code.");
    for (const id of ids) {
      assert.ok(
        program.getSourceFile(path.join(components, `${id}.tsx`)),
        `The Install example for ${id} must import its generated recipe.`,
      );
    }
    return ids.size;
  } finally {
    await fs.rm(project, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const repository =
    process.argv[2] ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const count = await checkTransitionExamples(repository);
  console.log(
    `Strictly compiled ${count} Install examples against generated source.`,
  );
}
