# Hitchy's Odem [![Build Status](https://travis-ci.org/hitchyjs/odem.svg?branch=master)](https://travis-ci.org/hitchyjs/odem)

_an object document management for hitchy_

## License

MIT

## Usage

```javascript
const ODM = require( "hitchy-odem" );

// TODO: configure adapter used to persistently store objects

const User = ODM.Model.define( "user", {
	name: { 
		type: "string",
		required: true,
	},
	secret: { 
		type: "string",
		required: true,
	},
	level: { 
		type: "integer",
		default: 1,
		max: 10,
	},
	lastLogin: { 
		type: "date",
	},
} );

const user = new User( {
	name: "myuser",
	secret: "mysecret",
	level: 2,
} );

user.save();
```
