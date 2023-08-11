# React Signals

_React application framework based on [Preact signals](https://github.com/preactjs/signals) inspired by MobX._

Signals is a performant state management library with two primary goals:

- Make it as easy as possible to write business logic for small up to complex apps. No matter how complex your logic is, your app updates should stay fast without you needing to think about it. Signals automatically optimize state updates behind the scenes to trigger the fewest updates necessary. They are lazy by default and automatically skip signals that no one listens to.
- Integrate into frameworks as if they were native built-in primitives. You don't need any selectors, wrapper functions, or anything else. Signals can be accessed directly and your component will automatically re-render when the signal's value changes.

## Installation

```bash
yarn add react-signals-app
```

- [React Signals](#react-signals)
  - [Installation](#installation)
  - [Guide / API](#guide--api)
    - [`signal(initialValue)`](#signalinitialvalue)
    - [`computed(fn)`](#computedfn)
    - [Class Decorators](#class-decorators)
      - [`@signal`, `@computed`](#signal-computed)
    - [`effect(fn)`](#effectfn)
    - [`reaction(fn,fn)`](#reactionfnfn)
    - [`fireImmediately(fn,fn)`](#fireimmediatelyfnfn)
    - [`when(fn)`](#whenfn)
    - [`signal.peek()`](#signalpeek)
    - [`untracked(fn)`](#untrackedfn)
    - [`batch(fn)`](#batchfn)
  - [Undocumented API](#undocumented-api)
    - [Simple and fast actions abstraction](#simple-and-fast-actions-abstraction)
    - [Automatic unsubscription control](#automatic-unsubscription-control)
    - [On demand services](#on-demand-services)
    - [Isolated services scope for SSR support](#isolated-services-scope-for-ssr-support)
    - [Describe component logic in OOP-style](#describe-component-logic-in-oop-style)
  - [React Integration](#react-integration)
    - [Hooks](#hooks)
    - [Rendering optimizations](#rendering-optimizations)
  - [License](#license)

## Guide / API

### `signal(initialValue)`

The `signal` function creates a new signal. A signal is a container for a value that can change over time. You can read a signal's value or subscribe to value updates by accessing its `.value` property.

```js
import { signal } from "react-signals-app";

const counter = signal(0);

// Read value from signal, logs: 0
console.log(counter.value);

// Write to a signal
counter.value = 1;
```

Writing to a signal is done by setting its `.value` property. Changing a signal's value synchronously updates every [computed](#computedfn) and [effect](#effectfn) that depends on that signal, ensuring your app state is always consistent.

### `computed(fn)`

Data is often derived from other pieces of existing data. The `computed` function lets you combine the values of multiple signals into a new signal that can be reacted to, or even used by additional computeds. When the signals accessed from within a computed callback change, the computed callback is re-executed and its new return value becomes the computed signal's value.

```js
import { signal, computed } from "react-signals-app";

const name = signal("Jane");
const surname = signal("Doe");

const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
console.log(fullName.value);

// Updates flow through computed, but only if someone
// subscribes to it. More on that later.
name.value = "John";
// Logs: "John Doe"
console.log(fullName.value);
```

Any signal that is accessed inside the `computed`'s callback function will be automatically subscribed to and tracked as a dependency of the computed signal.

### Class Decorators

#### `@signal`, `@computed`

For convenient OOP-style coding, the clearest and most minimalistic way to describe reactive signals, are decorators. Currently, many mainstream frameworks use decorators for annotations, and we will take advantage of this feature as well.

```typescript
import { signal, computed } from "react-signals-app"

class Todo {
  id = Math.random()
  @signal title = ""
  @signal finished = false

  toggle() {
    this.finished = !this.finished
  }
}

class TodoList {
  @signal todos = []

  @computed
  get unfinishedTodoCount() {
    return this.todos.filter(todo => !todo.finished).length
  }
}
```


### `effect(fn)`

The `effect` function is the last piece that makes everything reactive. When you access a signal inside its callback function, that signal and every dependency of said signal will be activated and subscribed to. In that regard it is very similar to [`computed(fn)`](#computedfn). By default all updates are lazy, so nothing will update until you access a signal inside `effect`.

```js
import { signal, computed, effect } from "react-signals-app";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
effect(() => console.log(fullName.value));

// Updating one of its dependencies will automatically trigger
// the effect above, and will print "John Doe" to the console.
name.value = "John";
```

You can destroy an effect and unsubscribe from all signals it was subscribed to, by calling the returned function.

```js
import { signal, computed, effect } from "@preact/signals-core";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
const dispose = effect(() => console.log(fullName.value));

// Destroy effect and subscriptions
dispose();

// Update does nothing, because no one is subscribed anymore.
// Even the computed `fullName` signal won't change, because it knows
// that no one listens to it.
surname.value = "Doe 2";
```

### `reaction(fn,fn)`

`reaction` is like [`effect`](#effectfn), but gives more fine grained control on which signals will be tracked. It takes two functions: the first, data function, is tracked and returns the data that is used as input for the second, effect function. It is important to note that the side effect only reacts to data that was accessed in the data function, which might be less than the data that is actually used in the effect function.

The typical pattern is that you produce the things you need in your side effect in the data function, and in that way control more precisely when the effect triggers. By default, the result of the data function has to change in order for the effect function to be triggered.

```typescript
import { signal, reaction } from "react-signals-app"

class Animal {
  @signal name
  @signal energyLevel

  constructor(name) {
    this.name = name
    this.energyLevel = 100
  }

  reduceEnergy() {
    this.energyLevel -= 10
  }

  get isHungry() {
    return this.energyLevel < 50
  }
}

const giraffe = new Animal("Gary")

reaction(
  () => giraffe.isHungry,
  isHungry => {
    if (isHungry) {
        console.log("Now I'm hungry!")
    } else {
        console.log("I'm not hungry!")
    }
    console.log("Energy level:", giraffe.energyLevel)
  }
)

console.log("Now let's change state!")
for (let i = 0; i < 10; i++) {
  giraffe.reduceEnergy()
}
```

### `fireImmediately(fn,fn)`

`fireImmediately` is like [`reaction`](#reactionfnfn), but the effect function should immediately be triggered after the first run of the data function.

```typescript
class List {

  constructor(authService) {
    fireImmediately(
      () => authService.isLoggedIn, // data function
      (loggedIn) => {               // effect function
        if (loggedIn) {
          this.initUserData()
        } else {
          this.clearUserData()
        }
      }
    )
  }

  initUserData() {}
  clearUserData() {}
}
```

### `when(fn)`

`when` observes and runs the given predicate function until it returns `true`. Once that happens, the return promise resolved.

The `when` function returns a `Promise` with `cancel` method allowing you to cancel it manually.

This combines nicely with `async / await` to let you wait for changes in reactive state.

```typescript
async function() {
  await when(() => that.isVisible)
  // etc...
}
```

To cancel when prematurely, it is possible to call `.cancel()` on the promise returned by itself.

### `signal.peek()`

In the rare instance that you have an effect that should write to another signal based on the previous value, but you _don't_ want the effect to be subscribed to that signal, you can read a signals's previous value via `signal.peek()`.

```js
const counter = signal(0);
const effectCount = signal(0);

effect(() => {
	console.log(counter.value);

	// Whenever this effect is triggered, increase `effectCount`.
	// But we don't want this signal to react to `effectCount`
	effectCount.value = effectCount.peek() + 1;
});
```

Note that you should only use `signal.peek()` if you really need it. Reading a signal's value via `signal.value` is the preferred way in most scenarios.

### `untracked(fn)`

In case when you're receiving a callback that can read some signals, but you don't want to subscribe to them, you can use `untracked` to prevent any subscriptions from happening.

```js
const counter = signal(0);
const effectCount = signal(0);
const fn = () => effectCount.value + 1;

effect(() => {
	console.log(counter.value);

	// Whenever this effect is triggered, run `fn` that gives new value
	effectCount.value = untracked(fn);
});
```

Note that you should only use `signal.peek()` if you really need it. Reading a signal's value via `signal.value` is the preferred way in most scenarios.

### `batch(fn)`

The `batch` function allows you to combine multiple signal writes into one single update that is triggered at the end when the callback completes.

```js
import { signal, computed, effect, batch } from "react-signals-app";

const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => name.value + " " + surname.value);

// Logs: "Jane Doe"
effect(() => console.log(fullName.value));

// Combines both signal writes into one update. Once the callback
// returns the `effect` will trigger and we'll log "Foo Bar"
batch(() => {
	name.value = "Foo";
	surname.value = "Bar";
});
```

When you access a signal that you wrote to earlier inside the callback, or access a computed signal that was invalidated by another signal, we'll only update the necessary dependencies to get the current value for the signal you read from. All other invalidated signals will update at the end of the callback function.

```js
import { signal, computed, effect, batch } from "react-signals-app";

const counter = signal(0);
const double = computed(() => counter.value * 2);
const triple = computed(() => counter.value * 3);

effect(() => console.log(double.value, triple.value));

batch(() => {
	counter.value = 1;
	// Logs: 2, despite being inside batch, but `triple`
	// will only update once the callback is complete
	console.log(double.value);
});
// Now we reached the end of the batch and call the effect
```

Batches can be nested and updates will be flushed when the outermost batch call completes.

```js
import { signal, computed, effect, batch } from "react-signals-app";

const counter = signal(0);
effect(() => console.log(counter.value));

batch(() => {
	batch(() => {
		// Signal is invalidated, but update is not flushed because
		// we're still inside another batch
		counter.value = 1;
	});

	// Still not updated...
});
// Now the callback completed and we'll trigger the effect.
```


## Undocumented API

### Simple and fast actions abstraction

```typescript
const userLoggedIn = action()

// subscribe to the action
userLoggedIn.subscribe(listener)

// call the action
userLoggedIn()
```

### Automatic unsubscription control

```typescript
un(() => {
  // unsubscribe your event listeners here
})
```

### On demand services

```typescript
// On demand service abstraction
const userService = service(class {
  constructor() {
    un(() => {
      // destroy
    })
  }
})

// If you run `userService.user` it's get user property for on demand created service
const user = userService.user

// should create and call 'instantiate' method if exists
userService.instantiate()
```

### Isolated services scope for SSR support

Isolation of async scopes (only in node environment)

Run your app in isolated Service Provider scope. All instances cached for this will be isolated from all cached instances in other scopes. Useful for implementing SSR.

```typescript
import { isolate } from "react-signals-app"

const html = await isolate(async () => {
  // Isolated instance of appService created on demand here, 
  // by calling run method contains state initialization requests
  await appService.run();
  // ...
  return ReactDOMServer.renderToString(<App />);
});
```

### Describe component logic in OOP-style

```typescript
useRecipeForm = hook(class {
  constructor(
    //(params proposal)
    //private signalOfParam1,
    //private signalOfParam2
  ) {
    un(() => {
      // destroy
    })
  }
})

const form = useRecipeForm(/*(params proposal) param1, param2*/)
```


## React Integration

React adapter allows you to access signals directly inside your components and will automatically subscribe to them.

```typescript
import { signal } from "react-signals-app";

const count = signal(0);

function CounterValue() {
	// Whenever the `count` signal is updated, we'll
	// re-render this component automatically for you
	return <p>Value: {count.value}</p>;
}
```

### Hooks

If you need to instantiate new signals inside your components, you can use the `useSignal` or `useComputed` hook.

```typescript
import { useSignal, useComputed } from "react-signals-app";

function Counter() {
	const count = useSignal(0);
	const double = useComputed(() => count.value * 2);

	return (
		<button onClick={() => count.value++}>
			Value: {count.value}, value x 2 = {double.value}
		</button>
	);
}
```

### Rendering optimizations

The React adapter ships with several optimizations it can apply out of the box to skip virtual-dom rendering entirely. If you pass a signal directly into JSX, it will bind directly to the DOM `Text` node that is created and update that whenever the signal changes.

```typescript
import { signal } from "react-signals-app";

const count = signal(0);

// Unoptimized: Will trigger the surrounding
// component to re-render
function Counter() {
	return <p>Value: {count.value}</p>;
}

// Optimized: Will update the text node directly
function Counter() {
	return (
		<p>
			<>Value: {count}</>
		</p>
	);
}
```

To opt into this optimization, simply pass the signal directly instead of accessing the `.value` property.

> **Note** The content is wrapped in a React Fragment due to React 18's newer, more strict children types.


## License
ISC
