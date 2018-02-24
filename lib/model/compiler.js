/**
 * (c) 2018 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2018 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const PromiseUtil = require( "promise-essentials" );

const Model = require( "./base" );
const Types = require( "./type" );
const { deepFreeze } = require( "../utility/object" );
const { extractBody } = require( "../utility/function" );



const ptnKeyword = /^[a-z][a-z0-9_]*$/i;

const ptnReturn = /\breturn\b([\s\S]+?);?\s*$/;



/**
 * Compiles class inherited from abstract model managing described schema.
 *
 * @param {string} modelName
 * @param {object} schema
 * @param {object} baseClass
 * @returns {class}
 */
function compileModel( modelName, schema = {}, baseClass = undefined ) {
	if ( typeof modelName !== "string" || !ptnKeyword.test( modelName ) ) {
		throw new TypeError( "invalid model name" );
	}

	// manage base class for deriving class to be defined from
	if ( baseClass !== undefined ) {
		if ( baseClass !== Model && !( baseClass.prototype instanceof Model ) ) {
			throw new TypeError( "provided base class must be inheriting from AbstractModel" );
		}
	} else {
		baseClass = Model;
	}


	const splitSchema = splitSchemaElements( modelName, schema );
	const { attributes, computeds } = splitSchema;

	validateAttributes( modelName, attributes );


	// eslint-disable-next-line no-eval
	const DefinedModel = eval( `class ${modelName} extends baseClass { 
		constructor() { 
			super( ...arguments ); 
		} 
	}` );


	// implement getter/setter for every defined attribute
	Object.defineProperties( DefinedModel.prototype, compileGettersAndSetters( attributes, computeds ) );


	// customize prototype of defined model
	Object.defineProperties( DefinedModel.prototype, {
		validate: {
			value: function() {
				const myClass = this.constructor;
				const { schema, _validateProperties, _coerceProperties } = myClass;

				const { hooks, attributes } = schema;
				const { onBeforeValidate, onAfterValidate } = hooks;


				// coerce values of all defined attributes
				try {
					_coerceProperties.call( this, attributes );
				} catch ( e ) {
					return Promise.reject( e );
				}


				if ( !onBeforeValidate.length && !onAfterValidate.length ) {
					return new Promise( resolve => resolve( _validateProperties.call( this ) ) );
				}


				let promise;

				if ( onBeforeValidate.length ) {
					promise = PromiseUtil.each( onBeforeValidate, hook => hook.call( this ) )
						.then( () => _validateProperties.call( this ) );
				} else {
					promise = new Promise( resolve => resolve( _validateProperties.call( this ) ) );
				}

				if ( onAfterValidate.length ) {
					promise = promise
						.then( errors => PromiseUtil.each( onAfterValidate, hook => hook.call( this, errors ) ) );
				}


				return promise;
			},
		}
	} );


	// customize static methods and properties
	Object.defineProperties( DefinedModel, {
		name: { value: modelName },
		schema: { value: deepFreeze( splitSchema ) },
		_coerceProperties: { value: compileCoercion( attributes ) },
		_validateProperties: { value: compileValidator( attributes ) },
		_serializeProperties: { value: compileSerializer( attributes ) },
		_deserializeProperties: { value: compileDeserializer( attributes ) },
	} );


	return DefinedModel;
}

/**
 * Splits whole schema definition into fragments grouping elements of schema
 * definition by type.
 *
 * @param {string} modelName name of model schema is related to
 * @param {object} schema whole schema definition
 * @param {Error[]} errors collected errors encountered while splitting, omit if you don't care
 * @returns {{attributes: object<string,object>, computeds: object<string,function>, hooks: object<string,function[]>}}
 */
function splitSchemaElements( modelName, schema = {}, errors = [] ) {
	if ( !modelName || typeof modelName !== "string" ) {
		throw new TypeError( "invalid name of model" );
	}

	if ( !schema || typeof schema !== "object" || Array.isArray( schema ) ) {
		throw new TypeError( "invalid model schema definition" );
	}


	const keys = Object.keys( schema );

	const attributes = {};
	const computeds = {};
	const hooks = {};

	for ( let i = 0, length = keys.length; i < length; i++ ) {
		const key = keys[i];

		switch ( typeof schema[key] ) {
			case "function" :
				// got code computing derived attribute
				computeds[key] = schema[key];
				break;

			case "object" :
				const value = schema[key];
				if ( value ) {
					if ( Array.isArray( value ) ) {
						// check for list of event handlers
						let allFunctions = true;

						for ( let i = 0, length = value.length; i < length; i++ ) {
							if ( typeof value[i] !== "function" ) {
								allFunctions = false;
								break;
							}
						}

						if ( allFunctions ) {
							hooks[key] = value.slice();
							break;
						}
					} else {
						// got regular attribute definition
						attributes[key] = schema[key];
						break;
					}
				}

			// falls through
			default :
				errors.push( new TypeError( `WARNING: invalid element ${key} in schema of model ${modelName}` ) );
		}
	}

	return { attributes, computeds, hooks };
}

/**
 * Basically validates provided definitions of attributes.
 *
 * @note Qualification of attributes' definitions are applied to provided object
 *       and thus alter the provided set of definitions, too.
 *
 * @param {string} modelName name of model definition of attributes is used for
 * @param {object<string,object>} attributes definition of attributes, might be adjusted on return
 * @param {Error[]} errors collector of processing errors
 * @returns {object<string,ModelType>} provided set of attribute definitions incl. optional qualifications
 * @throws TypeError on encountering severe issues with provided definition
 */
function validateAttributes( modelName, attributes = {}, errors = [] ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const names = Object.keys( attributes );
	const handlers = {};

	for ( let i = 0, length = names.length; i < length; i++ ) {
		const name = names[i];
		const attribute = attributes[name];

		if ( !attribute.type ) {
			attribute.type = "string";
		}

		const type = Types.selectByName( attribute.type );
		if ( !type ) {
			throw new TypeError( `invalid attribute type "${attribute.type}" in attribute "${name}" of model "${modelName}"` );
		}

		if ( type.checkDefinition( attribute, errors ) ) {
			handlers[name] = type;
		}
	}

	return handlers;
}

/**
 * Creates function coercing all attributes.
 *
 * @param {object<string,object>} attributes
 * @returns {function()}
 */
function compileCoercion( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const coercion = [];

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		const handler = Types.selectByName( attribute.type );

		const { args, body } = extractBody( handler.coerce );
		if ( args.length < 2 ) {
			throw new TypeError( `coerce() of ModelType for handling ${attribute.type} values must accept two arguments` );
		}

		coercion.push( `
{
	let ${args[0]} = this.properties["${attributeName}"];
	const ${args[1]} = attributes["${attributeName}"];

	{
		${body.replace( ptnReturn, ( all, term ) => `this.properties["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
	}

	// eslint-disable-next-line no-new-func
	return new Function( "attributes", coercion.join( "" ) );
}

/**
 * Creates validator function assessing all defined attributes of a model.
 *
 * @param {object<string,object>} attributes
 * @returns {function():Error[]}
 */
function compileValidator( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const validation = [];

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		const handler = Types.selectByName( attribute.type );

		const { args, body } = extractBody( handler.isValid );
		if ( args.length < 4 ) {
			throw new TypeError( `isValid() of ModelType for handling ${attribute.type} values must accept four arguments` );
		}

		validation.push( `
{
	const ${args[0]} = "${attributeName}";
	let ${args[1]} = this.properties["${attributeName}"];
	const ${args[2]} = attributes["${attributeName}"];
	const ${args[3]} = _errors;

	{
		${body}
	}
}
		` );
	}

	// eslint-disable-next-line no-new-func
	return new Function( "attributes", `
const _errors = [];

${validation.join( "" )}

return _errors;
` );
}

/**
 * Creates function serializing all attributes.
 *
 * @param {object<string,object>} attributes
 * @returns {function():Error[]}
 */
function compileSerializer( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const serialization = [];

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		const handler = Types.selectByName( attribute.type );

		const { args, body } = extractBody( handler.serialize );
		if ( args.length < 1 ) {
			throw new TypeError( `serialize() of ModelType for handling ${attribute.type} values must accept one argument` );
		}

		serialization.push( `
{
	let ${args[0]} = this.properties["${attributeName}"];

	{
		${body.replace( ptnReturn, ( all, term ) => `$$s["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
	}

	// eslint-disable-next-line no-new-func
	return new Function( `
const $$s = {};

${serialization.join( "" )}

return $$s;
` );
}

/**
 * Creates function deserializing and coercing all attributes.
 *
 * This method is creating function resulting from concatenating methods
 * `deserialize()` and `coerce()` of every attribute's type handler.
 *
 * @param {object<string,object>} attributes
 * @returns {function():Error[]}
 */
function compileDeserializer( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const deserialization = [];

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		const handler = Types.selectByName( attribute.type );

		// append deserialize() method of current attribute's type handler
		{
			const { args, body } = extractBody( handler.deserialize );
			if ( args.length < 1 ) {
				throw new TypeError( `deserialize() of ModelType for handling ${attribute.type} values must accept one argument` );
			}

			deserialization.push( `
{
	let ${args[0]} = this.properties["${attributeName}"];

	{
		${body.replace( ptnReturn, ( all, term ) => `$$d["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
		}

		// append coerce() method of current attribute's type handler
		{
			const { args, body } = extractBody( handler.coerce );
			if ( args.length < 2 ) {
				throw new TypeError( `coerce() of ModelType for handling ${attribute.type} values must accept two arguments` );
			}

			deserialization.push( `
{
	let ${args[0]} = this.properties["${attributeName}"];
	const ${args[1]} = attributes["${attributeName}"];

	{
		${body.replace( ptnReturn, ( all, term ) => `$$d["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
		}
	}

	// eslint-disable-next-line no-new-func
	return new Function( `
const $$d = {};

${deserialization.join( "" )}

return $$d;
` );
}

/**
 * Compiles definition of getters and setters for accessing all defined
 * attributes of model incl. computed ones.
 *
 * @param {object<string,object>} attributes definition of basic attributes
 * @param {object<string,function>} computeds definition of computed attributes
 * @returns {object<string,{get:function():*,set:function(*)}>} map suitable for use with `Object.defineProperties()`
 */
function compileGettersAndSetters( attributes, computeds ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	if ( !computeds || typeof computeds !== "object" || Array.isArray( computeds ) ) {
		throw new TypeError( "definition of computeds must be object" );
	}


	const definition = {};

	const attributeNames = Object.keys( attributes );
	for ( let i = 0, length = attributeNames.length; i < length; i++ ) {
		( function( name ) {
			switch ( name ) {
				case "prototype" :
				case "constructor" :
				case "super" :
					break;

				default :
					if ( !Model.prototype.hasOwnProperty( name ) ) {
						definition[name] = {
							get: function() {
								return this.properties[name];
							},
							set: function( value ) {
								this.properties[name] = value;
							},
						};
					}
			}
		} )( attributeNames[i] );
	}

	const computedNames = Object.keys( computeds );
	for ( let i = 0, length = computedNames.length; i < length; i++ ) {
		const name = computedNames[i];

		( function( name ) {
			switch ( name ) {
				case "prototype" :
				case "constructor" :
				case "super" :
					break;

				default :
					if ( !Model.prototype.hasOwnProperty( name ) && !definition.hasOwnProperty( name ) ) {
						definition[name] = {
							get: function() {
								return computeds[name].call( this );
							},
							set: function( value ) {
								computeds[name].call( this, value );
							},
						};
					}
			}
		} )( name, computeds[name] );
	}

	return definition;
}



module.exports = compileModel;

// expose internal functions to enable individual unit testing
compileModel._utility = {
	splitSchemaElements,
	validateAttributes,
	compileCoercion,
	compileValidator,
	compileSerializer,
	compileDeserializer,
	compileGettersAndSetters,
};
