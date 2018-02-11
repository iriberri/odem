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

const ModelType = require( "./base" );

/**
 * Implements scalar type `string` for use with attributes of defined models.
 *
 * @name ModelTypeString
 * @extends ModelType
 */
class ModelTypeString extends ModelType {
	/** @inheritDoc */
	static get name() {
		return "string";
	}

	/** @inheritDoc */
	static coerce( value, requirements = {} ) {
		if ( value === null || value === undefined ) {
			return null;
		}

		if ( typeof value !== "string" ) {
			value = String( value );
		}

		if ( requirements.trim ) {
			value = value.trim();
		}

		if ( requirements.reduceSpace ) {
			value = value.replace( /\s+/g, " " );
		}

		return value;
	}

	/** @inheritDoc */
	static isValid( name, value, requirements, errors ) {
		if ( value === null ) {
			if ( requirements.required ) {
				errors.push( new Error( `${name} is required, but missing` ) );
			}
		} else {
			let { minLength, maxLength, pattern } = requirements;

			if ( maxLength > -1 ) {
				if ( value.length > maxLength ) {
					errors.push( new Error( `${name} exceeds maximum length of ${maxLength} characters` ) );
				}
			}

			if ( minLength > -1 ) {
				if ( value.length < minLength ) {
					errors.push( new Error( `${name} must contain at least ${minLength} characters` ) );
				}
			}

			if ( pattern ) {
				const re = ( typeof pattern === "string" ) ? new RegExp( pattern ) : pattern;

				if ( !re.test( value ) ) {
					errors.push( new Error( `${name} does not match required pattern` ) );
				}
			}
		}
	}

	/** @inheritDoc */
	static checkDefinition( definition ) {
		const errors = super.checkDefinition( definition );
		if ( !errors.length ) {
			if ( definition.maxLength < 0 ) {
				errors.push( new TypeError( "invalid requirement on maximum length" ) );
			}

			if ( definition.minLength < 0 ) {
				errors.push( new TypeError( "invalid requirement on minimum length" ) );
			}

			if ( definition.minLength > definition.maxLength ) {
				const minLength = definition.minLength;
				definition.minLength = definition.maxLength;
				definition.maxLength = minLength;
			}
		}

		return errors;
	}

	/** @inheritDoc */
	static deserialize( value ) {
		if ( value === undefined || value === null ) {
			return null;
		}

		return String( value );
	}

	/** @inheritDoc */
	static get aliases() {
		return ["text"];
	}
}

module.exports = ModelTypeString;
