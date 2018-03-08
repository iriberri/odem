# Hitchy's Odem [![Build Status](https://travis-ci.org/hitchyjs/odem.svg?branch=master)](https://travis-ci.org/hitchyjs/odem)

_an object document management for hitchy_

## License

MIT

## Usage

```javascript
const { Model } = require( "hitchy-odem" );

// TODO: configure adapter used to persistently store objects

const User = Model.define( "user", {
	// regular attributes
	name: { 
		type: "string",
		required: true,
		trim: true,
		minLength: 4,
		maxLength: 16,
	},
	secret: { 
		type: "string",
		required: true,
		process: value => createHash( value ),
	},
	level: { 
		type: "integer",
		default: 1,
		min: 1,
		max: 10,
	},
	lastLogin: { 
		type: "date",
	},
	
	// computed properties
	hasLoggedInBefore: item => item.lastLogin !== null,

	// life cycle hooks
	onSaved: [
		item => {
			item.secret = createHash( item.secret );
		} 
	]
} );

// static methods
User.create = function( name, secret ) {
	const user = new User( { name, secret, level: 0 } );

	user.save();

	return user;
};


const user = User.create();
user.level = 3;
user.save();

User.find( "level", 3 );
```
