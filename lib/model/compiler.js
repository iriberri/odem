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

const { Adapter } = require( "../adapter" );
const Model = require( "./base" );
const Collection = require( "./collection" );
const Types = require( "./type" );
const { deepSeal } = require( "../utility/object" );
const { ptnKeyword } = require( "../utility/string" );
const { extractBody, ptnTrailingReturn } = require( "../utility/function" );


/**
 * @typedef {Model} CompiledModel
 * @property {string} name defined name of model
 * @property {ModelSchema} schema model's definition
 * @property {Adapter} adapter adapter to use with instances of model by default
 */

/**
 * Compiles class inherited from abstract model managing described schema.
 *
 * @param {string} modelName name of model
 * @param {object} modelSchema definition of model's attributes, computed properties and lifecycle hooks
 * @param {object} baseClass custom base class to derive model class from
 * @param {Adapter} adapter selects adapter to use on instances of resulting model by default
 * @returns {class} compiled model class
 * @alias ModelCompiler
 */
function compileModel( modelName, modelSchema = {}, baseClass = null, adapter = null ) {
	if ( typeof modelName !== "string" || !ptnKeyword.test( modelName ) ) {
		throw new TypeError( "invalid model name" );
	}

	// manage base class for deriving class to be defined from
	if ( baseClass == null ) {
		baseClass = Model;
	} else if ( baseClass !== Model && !( baseClass.prototype instanceof Model ) ) {
		throw new TypeError( "provided base class must be inheriting from AbstractModel" );
	}

	if ( adapter != null && !( adapter instanceof Adapter ) ) {
		throw new TypeError( "invalid adapter" );
	}


	const splitSchema = splitSchemaElements( modelName, modelSchema );
	const { attributes, computeds } = splitSchema;

	validateAttributes( modelName, attributes );


	let DefinedModel;

	// eslint-disable-next-line no-eval
	eval( `DefinedModel = class ${modelName} extends baseClass { 
		constructor( ...args ) { 
			super( ...args ); 
		}
	}` );


	// implement getter/setter for every defined attribute
	Object.defineProperties( DefinedModel.prototype, compileGettersAndSetters( attributes, computeds ) );


	// customize prototype of defined model
	Object.defineProperties( DefinedModel.prototype, {
		validate: {
			value: function() {
				const myClass = this.constructor;
				const { schema, _validateProperties } = myClass;

				const { hooks } = schema;
				const { onBeforeValidate = [], onAfterValidate = [] } = hooks;


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
		adapter: { value: adapter },
		name: { value: modelName },
		schema: { value: deepSeal( splitSchema ) },
		_coerceProperties: { value: compileCoercion( attributes ) },
		_coercionHandlers: { value: compileCoercionMap( attributes ) },
		_validateProperties: { value: compileValidator( attributes ) },
		_serializeProperties: { value: compileSerializer( attributes ) },
		_deserializeProperties: { value: compileDeserializer( attributes ) },
	} );


	// inject all static methods of Collection into compiled model
	Collection.injectInto( DefinedModel );


	return DefinedModel;
}

/**
 * @typedef {object} SchemaElementsPerGroup
 * @property {object<string,object>} attributes essential attributes
 * @property {object<string,function>} computeds computed attributes
 * @property {object<string,function[]>} hooks life cycle hooks
 */

/**
 * Splits whole schema definition into fragments grouping elements of schema
 * definition by type.
 *
 * @param {string} modelName name of model schema is related to
 * @param {object} schema whole schema definition
 * @param {Error[]} errors collected errors encountered while splitting, omit if you don't care
 * @returns {SchemaElementsPerGroup} elements of schema split into groups of either kind
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

	for ( let ki = 0, kLength = keys.length; ki < kLength; ki++ ) {
		const key = keys[ki];

		switch ( typeof schema[key] ) {
			case "function" :
				// got code computing derived attribute
				computeds[key] = schema[key];
				break;

			case "object" : {
				const value = schema[key];
				if ( value ) {
					if ( Array.isArray( value ) ) {
						// check for list of event handlers
						let allFunctions = true;

						for ( let vi = 0, vLength = value.length; vi < vLength; vi++ ) {
							if ( typeof value[vi] !== "function" ) {
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
 * Compiles coercion handlers per attribute of model.
 *
 * @param {object<string,object>} attributes definition of essential attributes
 * @returns {object<string,function(*,object):*>} map of attributes' names into either attribute's coercion handler
 */
function compileCoercionMap( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "definition of attributes must be object" );
	}

	const coercions = {};

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		( function( name, handler, definition ) {
			coercions[name] = value => handler.coerce( value, definition );
		} )( attributeName, Types.selectByName( attribute.type ), attribute );
	}

	return coercions;
}

/**
 * Creates function coercing all attributes.
 *
 * @param {object<string,object>} attributes definition of essential attributes
 * @returns {function()} concatenated implementation of all defined attributes' coercion handlers
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
	let ${args[0]} = __props["${attributeName}"];
	const ${args[1]} = __attrs["${attributeName}"];

	{
		${body.replace( ptnTrailingReturn, ( all, term ) => `__props["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
	}

	// eslint-disable-next-line no-new-func
	return new Function( `
const __attrs = this.constructor.schema.attributes;
const __props = this.properties;

${coercion.join( "" )}
` );
}

/**
 * Creates validator function assessing all defined attributes of a model.
 *
 * @param {object<string,object>} attributes definition of essential attributes
 * @returns {function():Error[]} concatenated implementation of all defined attributes' validation handlers
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
	let ${args[1]} = __props["${attributeName}"];
	const ${args[2]} = __attrs["${attributeName}"];
	const ${args[3]} = __errors;

	{
		${body}
	}
}
		` );
	}

	// eslint-disable-next-line no-new-func
	return new Function( `
const __attrs = this.constructor.schema.attributes;
const __props = this.properties;
const __errors = [];

${validation.join( "" )}

return __errors;
` );
}

/**
 * Creates function serializing all attributes.
 *
 * @param {object<string,object>} attributes definition of essential attributes
 * @returns {function():Error[]} concatenated implementation of all defined attributes' serialization handlers
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
		${body.replace( ptnTrailingReturn, ( all, term ) => `$$s["${attributeName}"] = ${term.trim()};` )}
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
 * @param {object<string,object>} attributes definition of essential attributes
 * @returns {function():Error[]} concatenated implementation of all defined attributes' deserialization handlers
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
		let sourceName;

		// append deserialize() method of current attribute's type handler
		{
			const { args, body } = extractBody( handler.deserialize );
			if ( args.length < 1 ) {
				throw new TypeError( `deserialize() of ModelType for handling ${attribute.type} values must accept one argument` );
			}

			if ( body.replace( ptnTrailingReturn, "" ).trim().length ) {
				sourceName = "$$d";
				deserialization.push( `
{
	let ${args[0]} = __props["${attributeName}"];

	{
		${body.replace( ptnTrailingReturn, ( all, term ) => `$$d["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
			} else {
				sourceName = "__props";
			}
		}

		// append coerce() method of current attribute's type handler
		{
			const { args, body } = extractBody( handler.coerce );
			if ( args.length < 2 ) {
				throw new TypeError( `coerce() of ModelType for handling ${attribute.type} values must accept two arguments` );
			}

			deserialization.push( `
{
	let ${args[0]} = ${sourceName}["${attributeName}"];
	const ${args[1]} = __attrs["${attributeName}"];

	{
		${body.replace( ptnTrailingReturn, ( all, term ) => `$$d["${attributeName}"] = ${term.trim()};` )}
	}
}
		` );
		}
	}

	// eslint-disable-next-line no-new-func
	return new Function( `
const $$d = {};
const __attrs = this.constructor.schema.attributes;
const __props = this.properties;

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

		( function( computedName, computedFn ) {
			switch ( computedName ) {
				case "prototype" :
				case "constructor" :
				case "super" :
					break;

				default :
					if ( !Model.prototype.hasOwnProperty( computedName ) && !definition.hasOwnProperty( computedName ) ) {
						definition[computedName] = {
							get: function() {
								return computedFn.call( this );
							},
							set: function( value ) {
								computedFn.call( this, value );
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
