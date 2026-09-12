import ts from "typescript";

/**
 * Extract one named component and its statically reachable top-level declarations.
 * The source must be a declaration-based TSX module; application-level side
 * effects and cross-file local dependencies must be handled by the caller.
 * This build-time module requires TypeScript, but generated components do not.
 */
export function extractTransition(sourceText, exportName, cssName) {
  if (typeof sourceText !== "string")
    throw new TypeError("Expected TSX source text.");
  if (!exportName || !ts.isIdentifierText(exportName, ts.ScriptTarget.Latest)) {
    throw new Error(`Invalid component export: ${exportName}`);
  }
  if (typeof cssName !== "string" || !/^[a-zA-Z0-9_-]+$/.test(cssName)) {
    throw new Error(
      "CSS basename must contain only letters, numbers, underscores, or hyphens.",
    );
  }

  const filename = "/__transition__.tsx";
  const source = ts.createSourceFile(
    filename,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const options = {
    noLib: true,
    noResolve: true,
    types: [],
    jsx: ts.JsxEmit.Preserve,
  };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === filename ? source : undefined);
  host.fileExists = (name) => name === filename;
  host.readFile = (name) => (name === filename ? sourceText : undefined);
  const program = ts.createProgram([filename], options, host);
  const syntaxErrors = program.getSyntacticDiagnostics(source);
  if (syntaxErrors.length) {
    throw new Error(
      ts.formatDiagnostics(syntaxErrors, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => "/",
        getNewLine: () => "\n",
      }),
    );
  }
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exported =
    moduleSymbol &&
    checker
      .getExportsOfModule(moduleSymbol)
      .find((symbol) => symbol.name === exportName);
  if (!exported)
    throw new Error(`Component export "${exportName}" does not exist.`);
  const target =
    exported.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(exported)
      : exported;

  const units = [];
  const unitsBySymbol = new Map();
  const importedSymbols = new Map();
  const neededImports = new Set();
  const included = new Set();
  const register = (name, unit) => {
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements)
        if (ts.isBindingElement(element)) register(element.name, unit);
      return;
    }
    const symbol = checker.getSymbolAtLocation(name);
    if (!symbol) return;
    const declarations = unitsBySymbol.get(symbol) ?? [];
    declarations.push(unit);
    unitsBySymbol.set(symbol, declarations);
  };

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const names = clause
        ? [
            clause.name,
            ...(clause.namedBindings
              ? ts.isNamedImports(clause.namedBindings)
                ? clause.namedBindings.elements.map((item) => item.name)
                : [clause.namedBindings.name]
              : []),
          ].filter(Boolean)
        : [];
      for (const name of names)
        importedSymbols.set(checker.getSymbolAtLocation(name), name);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const unit = { statement, declaration };
        units.push(unit);
        register(declaration.name, unit);
      }
    } else if (statement.name && ts.isIdentifier(statement.name)) {
      const unit = { statement, declaration: statement };
      units.push(unit);
      register(statement.name, unit);
    }
  }
  if (!unitsBySymbol.has(target)) {
    throw new Error(
      `Export "${exportName}" must name a declaration in this source file.`,
    );
  }

  const includeSymbol = (symbol) => {
    if (!symbol) return;
    if (importedSymbols.has(symbol))
      neededImports.add(importedSymbols.get(symbol));
    for (const unit of unitsBySymbol.get(symbol) ?? []) {
      if (included.has(unit)) continue;
      included.add(unit);
      visit(unit.declaration);
    }
  };
  const visit = (node) => {
    if (ts.isIdentifier(node)) includeSymbol(checker.getSymbolAtLocation(node));
    // The symbol of a shorthand property is the property, not its captured value.
    if (ts.isShorthandPropertyAssignment(node))
      includeSymbol(checker.getShorthandAssignmentValueSymbol(node));
    ts.forEachChild(node, visit);
  };
  includeSymbol(target);

  const factory = ts.factory;
  const output = [];
  let inPrologue = true;
  let emittedCss = false;
  for (const statement of source.statements) {
    if (
      inPrologue &&
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression)
    ) {
      output.push(statement);
      continue;
    }
    inPrologue = false;
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause) {
        if (
          ts.isStringLiteral(statement.moduleSpecifier) &&
          statement.moduleSpecifier.text.endsWith(".css")
        ) {
          if (!emittedCss)
            output.push(
              factory.updateImportDeclaration(
                statement,
                statement.modifiers,
                undefined,
                factory.createStringLiteral(`./${cssName}.css`),
                statement.attributes,
              ),
            );
          emittedCss = true;
        } else output.push(statement);
        continue;
      }
      const name =
        clause.name && neededImports.has(clause.name) ? clause.name : undefined;
      const bindings = clause.namedBindings;
      const namedBindings =
        bindings &&
        (ts.isNamedImports(bindings)
          ? factory.updateNamedImports(
              bindings,
              bindings.elements.filter((item) => neededImports.has(item.name)),
            )
          : neededImports.has(bindings.name)
            ? bindings
            : undefined);
      const keptBindings =
        namedBindings &&
        (!ts.isNamedImports(namedBindings) || namedBindings.elements.length)
          ? namedBindings
          : undefined;
      if (name || keptBindings)
        output.push(
          factory.updateImportDeclaration(
            statement,
            statement.modifiers,
            factory.updateImportClause(
              clause,
              clause.isTypeOnly,
              name,
              keptBindings,
            ),
            statement.moduleSpecifier,
            statement.attributes,
          ),
        );
      continue;
    }
    const modifiers = statement.modifiers?.filter(
      (modifier) =>
        modifier.kind !== ts.SyntaxKind.ExportKeyword &&
        modifier.kind !== ts.SyntaxKind.DefaultKeyword,
    );
    if (ts.isVariableStatement(statement)) {
      const kept = statement.declarationList.declarations.filter(
        (declaration) =>
          units.some(
            (unit) => unit.declaration === declaration && included.has(unit),
          ),
      );
      if (kept.length)
        output.push(
          factory.updateVariableStatement(
            statement,
            modifiers,
            factory.updateVariableDeclarationList(
              statement.declarationList,
              kept,
            ),
          ),
        );
    } else if (
      units.some((unit) => unit.statement === statement && included.has(unit))
    ) {
      output.push(factory.replaceModifiers(statement, modifiers));
    }
  }
  output.push(
    factory.createExportDeclaration(
      undefined,
      false,
      factory.createNamedExports([
        factory.createExportSpecifier(
          false,
          target.name === exportName
            ? undefined
            : factory.createIdentifier(target.name),
          factory.createIdentifier(exportName),
        ),
      ]),
    ),
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(factory.updateSourceFile(source, output));
}
