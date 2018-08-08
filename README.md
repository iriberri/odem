# Hitchy's Odem [![Build Status](https://travis-ci.org/hitchyjs/odem.svg?branch=master)](https://travis-ci.org/hitchyjs/odem)

_an object document management for hitchy_

## License

MIT

## Usage

```javascript
const { Model, FileAdapter } = require( "hitchy-odem" );

const fileBackend = new FileAdapter( "../my-data-store" );

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
	hasLoggedInBefore: item => item.lastLogin != null,

	// life cycle hooks
	onSaved: [
		item => {
			item.secret = createHash( item.secret );
		} 
	]
}, { adapter: fileBackend } );

// static methods
User.create = function( name, secret ) {
	const user = new User();
	
	user.name = name;
	user.secret = secret;
	user.level = 0;

	return user.save();
};


User.create( "John Doe", "very-secret" )
	.then( user => {
		user.level = 3;
		return user.save();
	} )
	.then( () => User.findByAttribute( "level", 3 ) )
	.then( list => {
		// list[0].uuid === user.uuid
	} );
```
