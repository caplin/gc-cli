# Circular dependencies

Given we have two modules that require each other. How would they behave with different module structures, entry points and dependency use cases.

Four approaches are discussed here.

* move `module.exports` to the top of the module.
* move `requires` to the bottom of the module.
* combine both approaches.
* inline `require`s.

The rough structure of the two modules are the same for all cases

```javascript
function A() {}

A.prototype.initialized = function() {}
```

Here `A` will be exported and it will `require` `B`.

```javascript
function B() {}

B.prototype.initialized = function() {}
```

Here `B` will be exported and it will `require` `A`.

`singleton` is a module that create an instance of its class and exports that. This is done at the `module.exports` location.
`singleton, creates` means the singleton creates an instance of its dependency on construction.

## Results

The results are presented in table form each cell is divided with a `/` character. The first side of the division is the result when `A` is loaded first, the second part is for when `B` is loaded first.

* P => Pass
* F => Fail, no import linked
* C => Crazy, this code is impossible to support
* PNI (X) => Import linked but prototype not initialized (value in brackets specifies which class)

### move `module.exports` to the top of the module.

Caveat is that only a `FunctionDeclaration` is hoisted so `FunctionExpression`s and objects will not work with this.

Below are the skeletons for the modules in the above case.

```javascript
module.exports = A;

var B = require('B');

function A() {}

A.prototype.initialized = function() {}
```

And the module `B`.

```javascript
module.exports = B;

var A = require('A');

function B() {}

B.prototype.initialized = function() {}
```

|                        | B extends A | B singleton, creates A | B uses at runtime A |
|:-----------------------|:-----------:|:----------------------:|:-------------------:|
| A extends B            | C / C       |     F     /   F        |    P /   PNI (B)    |
| A singleton, creates B | F / F       |     F / F              |    F / F            |
| A uses at runtime B    | PNI (A) / P |        F / F           |     P / P           |


### move `requires` to the bottom of the module.

Caveat is that any dependencies required at link time will not be bound as their `require` is at the bottom of the module.
For the purposes of the table it is assumed these `require`s are moved to the top of the module.

Below are the skeletons for the modules in the above case.

```javascript
function A() {}

A.prototype.initialized = function() {}

module.exports = A;

var B = require('B');
```

And the module `B`.

```javascript
function B() {}

B.prototype.initialized = function() {}

module.exports = B;

var A = require('A');
```

|                        | B extends A | B singleton, creates A | B uses at runtime A |
|:-----------------------|:-----------:|:----------------------:|:-------------------:|
| A extends B            | F / F       |     F     /   F        |    F /   P          |
| A singleton, creates B | F / F       |      F / F             |    F / F            |
| A uses at runtime B    | P   /  F    |        F / F           |     P / P           |


### combine both approaches.

Caveats are the combination of the two above.
For the purposes of the table it is assumed link time dependencies `require`'s are moved to the top of the module.
`module.exports` is placed at the top of the module, above all `require`'s.

Below are the skeletons for the modules in the above case.

```javascript
module.exports = A;

function A() {}

A.prototype.initialized = function() {}

var B = require('B');
```

And the module `B`.

```javascript
module.exports = B;

function B() {}

B.prototype.initialized = function() {}

var A = require('A');
```

|                        | B extends A | B singleton, creates A | B uses at runtime A |
|:-----------------------|:-----------:|:----------------------:|:-------------------:|
| A extends B            | F / F       |     F     /   F        |    P /   P          |
| A singleton, creates B | F / F       |      F / F             |    F / F            |
| A uses at runtime B    | P   /  P    |        F / F           |     P / P           |


### inline `require`s.

Caveats are that we only inline circular dependencies and both sides must be inlined.
Also the inlining will have to happen for every single reference.

Below are the skeletons for the modules in the above case.

```javascript
var B = require('B'); //Inlined where it's used.

function A() {}

A.prototype.initialized = function() {}

module.exports = A;
```

And the module `B`.

```javascript
var A = require('A'); //Inlined where it's used.

function B() {}

B.prototype.initialized = function() {}

module.exports = B;
```

|                        | B extends A | B singleton, creates A | B uses at runtime A |
|:-----------------------|:-----------:|:----------------------:|:-------------------:|
| A extends B            | F / F       |     F     /   F        |    P /   P          |
| A singleton, creates B | F / F       |      F / F             |    P / P            |
| A uses at runtime B    | P   /  P    |        P / P           |     P / P           |

## Summary

The best approach is inlining requires when dealing with circular dependencies.
It's only the best approach due to the fact that it can handle singletons using a circular dependency at run time (not at construction that case will still fail).

Inlining all requires would result in unpleasant code so we would want to limit inlining to circular dependencies.
