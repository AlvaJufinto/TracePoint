/** Guard against effect dependencies that refetch data on selection or panel updates. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../pages/Trace.tsx', import.meta.url), 'utf8');
const tree = ts.createSourceFile('Trace.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let loaders = 0;
function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect' &&
      /getCompany| getFreeFloat| getShareholderComposition| getCorporateActions/.test(node.arguments[0]?.getText(tree) || '')) {
    loaders++;
    const dependencies = node.arguments[1];
    assert.ok(dependencies && ts.isArrayLiteralExpression(dependencies), 'API effects need explicit dependencies');
    for (const dependency of dependencies.elements) {
      assert.match(dependency.getText(tree), /^(ticker|revisions\.[a-zA-Z]+)$/, 'Selection and fetched objects must not trigger API loads');
    }
    assert.match(node.arguments[0].getText(tree), /active = false/, 'Stale requests need cleanup');
  }
  ts.forEachChild(node, visit);
}
visit(tree);
assert.equal(loaders, 6, 'All independently loaded company sections are covered');
console.log('✓ Company loads exclude selection/panel state and guard stale responses');
