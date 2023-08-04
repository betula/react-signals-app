# react-signals-app

React application framework on [Preact signals](https://github.com/preactjs/signals)

```typescript

reaction
fireImmediately
when

const a = action()
a.subscribe(listener) // with unsubscriber

signal
untracked
batch
effect // with unsubscriber integration
computed

signal as decorator
computed as decorator

un

const userService = service(class {
  constructor() {
    un(() => {
      // destroy
    })
  }
})

userService.instantiate() // should create and call 'instantiate' method if exists

isolate

// If you run `userService.user` it's get user property for on demand created service

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