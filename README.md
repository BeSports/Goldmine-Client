# GoldmineJS - Client

[npm version](https://www.npmjs.org/package/goldmine-client)


## Introduction

GoldmineJS is a framework for building reactive web apps in Javascript.

## Starting from scratch

To grasp the concept of the framework we're going to build a simple demo. 

### Prerequisites

- Node.js installed
- npm package manager installed

- "[Create React App](https://github.com/facebookincubator/create-react-app)" installed
- A running OrientDB server
  - "Tolkien-Arda" database installed (freely available as a [public database](https://github.com/orientechnologies/public-databases))
- A running [GoldmineJS server](https://github.com/BeSports/Goldmine-Server)

### Create the application skeleton

Before we can implement the framework we first need an application skeleton. As skeleton we have chosen the "Create React App" from Facebook. You don't have to use this skeleton, feel free to build your own or use another freely available skeleton.

First create the skeleton.

    $ create-react-app goldmine-js-demo

Navigate to the folder.

    $ cd goldmine-js-demo

Install all packages.

    $ npm install

Start the application.

    $ npm start

A new browser tab should open with our application. When everything works as expected continue to the next step.

### Install GoldmineJS-client

Installing the framework is very easy.

    $ npm install --save goldmine-js-client

**TEMPORARY**

GoldmineJS isn't available yet on npm. Add it manually to your dependencies.

```json
{
  "dependencies": {
    "goldmine-js-client": "git+https://github.com/BeSports/Goldmine-Client#master"
  }
}
```

Install the package.

    $ npm install
### Building the application

#### Cleanup skeleton

Start by deleting all files in *src* folder except for *index.js*. After you've deleted all the files change *index.js* with the following code.

```react
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <div>
    <h1>GoldmineJS rocks!</h1>
  </div>,
  document.getElementById('root')
);
```

#### Create the main container

The main container is responsible for handling the subscriptions with the server. All you have to do is include the main container as high as possible in your hierarchy. In our example  we will put the main container above our h1 tag.

```react
import {MainContainer} from 'goldmine-js-client';
```

```react
<div>
  <MainContainer host="http://127.0.0.1:3020" driver="orientdb"/>
  
  <h1>GoldmineJS rocks!</h1>
</div>
```

As you can see there is a prop *host* in the main container and a *driver* property. The *host* prop refers to the GoldmineJS server, it is mandatory! The driver property defines which database the web socket is using.

#### Create a sub container

Sub containers are the building block of the framework. You can have several of them on a single page.

Create a folder in *src* called containers. This will be the placeholder for all our sub containers. Also create a folder components in *src*. Obivously this will hold our components.

First of all we'll create our component Creature. As you can see we check whether the data is loading or found. 

    import React from 'react';

```react
export default (props) => {
  if (props.loaders > 0) {
    return (
      <div>Loading ...</div>
    );
  }

  const creature = props.creature;

  if (creature === undefined) {
    return (
      <div>Creature not found.</div>
    );
  }

  return (
    <div>
      <h1>{creature.name}</h1>
      <p>
        Gender: {creature.gender}
        <br/>
        Born: {creature.born ? creature.born : 'Unknown'}
        <br/>
        Race: {creature.race}
        <br/>
        Wiki: <a href={creature.gatewaylink} target="_blank">{creature.gatewaylink}</a>
      </p>
    </div>
  );
};
```

Now we will create our first sub container. We will call it CreatureContainer. When creating a sub container you have to pass two parameters along with the function. The first parameter is a function that contains all subscriptions you want to listen to and the return object which will be injected in the target component. The target component is the second parameter of the function. It our case this is the Creature component.

```react
import {createContainer} from 'goldmine-js-client';
import _ from 'lodash';
import Creature from '../components/Creature';

export default createContainer((component, props) => {
  const name = 'Boromir';

  /* SET SUBSCRIPTIONS
    ---------------------------
    | Subscriptions are responsible for updating the store
    | with new data. A subscription can be reactive, but isn't
    | required to be.
    |
    | (subscription, params, isReactive)
    */
  component.subscribe('getCreatureWithName', {name}, true);

  /* GET DATA
  	---------------------------
  	| While the subscribe method is reponsible for handling the subscription.
  	| It will not return the data to our target component.
  	| We have to search for the data we want in the store. 
  	| In the example below this is done by using lodash to filter the necessary data
  	| in our data store.
  	|
  */
  return {
    creature: _.find(component.getCollection('creatures'), {name})
  }
}, Creature);
```

The last thing we need to do is add our sub container to *index.js*.

```react
import CreatureContainer from './containers/CreatureContainer'
```

```react
<div>
  <MainContainer host="http://127.0.0.1:3020" driver="orientdb"/>

  <h1>GoldmineJS rocks!</h1>
  <CreatureContainer/>
</div>
```

Now run the application again and see the result.

    $ npm start
## Contributors

- [Jasper Dansercoer](http://www.jdansercoer.be/)
- [Ruben Vermeulen](https://rubenvermeulen.be/)
