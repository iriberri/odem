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

const Model = require( "./base" );
const Types = require( "./type" );
const { deepFreeze } = require( "../utility/object" );
const { extractBody } = require( "../utility/function" );



/**
 * Compiles class inherited from abstract model managing described schema.
 *
 * @param {string} modelName
 * @param {object} schema
 * @param {object} baseClass
 * @returns {class}
 */
function compileModel( modelName, schema = {}, baseClass = null ) {
	// manage base class for deriving class to be defined from
	if ( baseClass ) {
		if ( !( baseClass.prototype instanceof Model ) ) {
			throw new TypeError( "provided base class must be inheriting from AbstractModel" );
		}
	} else {
		baseClass = Model;
	}


	const { attributes, computeds, hooks } = splitSchemaElements( modelName, schema );

	validateAttributes( modelName, attributes );


	const processedSchema = {};

	let constructorCode = "";


	// eslint-disable-next-line no-new-func
	const DefinedModel = new Function( constructorCode );


	// step #3: establish inheritance
	Object.defineProperties( DefinedModel, {
		prototype: { value: Object.create( baseClass.prototype ) },
		super: { value: baseClass },
	} );

	Object.defineProperties( DefinedModel.prototype, {
		constructor: { value: DefinedModel },
		super: { value: baseClass.prototype },
		hooks: { value: hooks },
	} );


	// step #4: implement prototype of defined model
	Object.defineProperties( DefinedModel.prototype, {
		_validateProperties: { value: compileValidator( attributes ) },
	} );


	// step #5: set static methods and properties
	Object.defineProperties( DefinedModel, {
		name: { value: modelName },
		schema: { value: processedSchema },
	} );


	return deepFreeze( DefinedModel );
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
		throw new TypeError( "attributes' definitions must be object" );
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
 * Creates validator function assessing all defined attributes of a model.
 *
 * @param {object<string,object>} attributes
 * @returns {function():Error[]}
 */
function compileValidator( attributes ) {
	if ( !attributes || typeof attributes !== "object" || Array.isArray( attributes ) ) {
		throw new TypeError( "attributes' definition must be object" );
	}

	const validation = [];

	const attributeNames = Object.keys( attributes );
	for ( let ai = 0, aLength = attributeNames.length; ai < aLength; ai++ ) {
		const attributeName = attributeNames[ai];
		const attribute = attributes[attributeName];

		const handler = Types.selectByName( attribute.type );

		const { args: validatorArgs, body: validatorCode } = extractBody( handler.isValid );

		validation.push( `
{
	const ${validatorArgs[0]} = "${attributeName}";
	const ${validatorArgs[1]} = this.properties["${attributeName}"];
	const ${validatorArgs[2]} = attributes["${attributeName}"];
	const ${validatorArgs[3]} = _errors;

	{
		${validatorCode}
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



module.exports = compileModel;

// expose internal functions to enable individual unit testing
compileModel._utility = {
	splitSchemaElements,
	validateAttributes,
	compileValidator,
};
