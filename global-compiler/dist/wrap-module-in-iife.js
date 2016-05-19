import { types } from 'recast';

const { builders: { blockStatement, callExpression, expressionStatement, functionExpression } } = types;

/**
 * Wrap the module in an IIFE. Useful if you don't want script references leaking to the global.
 */
export const wrapModuleInIIFEVisitor = {
	/**
  * @param {NodePath} programNodePath - Program NodePath.
  */
	visitProgram(programNodePath) {
		// Only wrap a module if it has code, else you could replace a commented out module with an IIFE.
		if (programNodePath.node.body.length > 0) {
			const moduleBlockStatement = blockStatement(programNodePath.node.body);
			const iife = functionExpression(null, [], moduleBlockStatement);
			const iifeExpressionStatement = expressionStatement(callExpression(iife, []));

			programNodePath.get('body').replace([iifeExpressionStatement]);
		}

		return false;
	}
};