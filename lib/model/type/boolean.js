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
const NumberUtilities = require( "../../utility/number" ); // eslint-disable-line no-unused-vars
const BooleanUtilities = require( "../../utility/boolean" ); // eslint-disable-line no-unused-vars

/**
 * Implements scalar type `boolean` for use with attributes of defined models.
 *
 * @name ModelTypeBoolean
 * @extends ModelType
 */
class ModelTypeBoolean extends ModelType {
	/** @inheritDoc */
	static get typeName() {
		return "boolean";
	}

	/** @inheritDoc */
	static get aliases() {
		return ["bool"];
	}

	/** @inheritDoc */
	static coerce( value, requirements = {} ) { // eslint-disable-line no-unused-vars
		if ( value === null || value === undefined ) {
			value = null;
		} else {
			value = Boolean( value );
		}

		return value;
	}

	/** @inheritDoc */
	static isValid( name, value, requirements, errors ) {
		if ( value === null ) {
			if ( requirements.required ) {
				errors.push( new Error( `${name} must be boolean value` ) );
			}
		} else {
			const { isSet } = requirements;

			if ( isSet && !value ) {
				errors.push( new Error( `${name} must be set` ) );
			}
		}
	}

	/** @inheritDoc */
	static serialize( value ) {
		if ( value === "null" || value === null || value === undefined ) {
			value = null;
		} else {
			value = value ? 1 : 0;
		}

		return value;
	}

	/** @inheritDoc */
	static deserialize( value ) {
		if ( value === "null" || value === null || value === undefined ) {
			value = null;
		} else if ( typeof value === "string" ) {
			value = value.trim();

			if ( global.hitchyPtnTrue.test( value ) ) {
				value = true;
			} else if ( global.hitchyPtnFalse.test( value ) ) {
				value = false;
			} else if ( global.hitchyPtnFloat.test( value ) ) {
				value = Boolean( parseFloat( value ) );
			} else {
				value = Boolean( value );
			}
		} else {
			value = Boolean( value );
		}

		return value;
	}

	/** @inheritDoc */
	static compare( value, reference, operation ) {
		let result;

		switch ( operation ) {
			case "eq" :
				result = ( value === reference );
				break;

			case "noteq" :
				result = ( value !== reference );
				break;

			case "null" :
				result = ( value === null );
				break;

			case "notnull" :
				result = ( value !== null );
				break;

			case "not" :
				result = !value;
				break;

			default :
				result = false;
				break;
		}

		return result;
	}
}

module.exports = ModelTypeBoolean;
