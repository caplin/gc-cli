import {equal} from 'assert';

import {describe, it} from 'mocha';

import {getFileNamespace} from '../../src/utils/utilities';

describe('utilities', () => {
	it('should calculate correct file namespace.', () => {
		// Given.
		const expectedFileNamespace = 'name.space.long.MyClass';
		const stubVinylFile = {
			cwd: '/home/user/trader/lib/mylib',
			path: '/home/user/trader/lib/mylib/src/name/space/long/MyClass.js'
		};

		// When.
		const namespace = getFileNamespace(stubVinylFile);

		// Then.
		equal(namespace, expectedFileNamespace);
	});
});
