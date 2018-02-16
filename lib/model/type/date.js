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
 * Implements scalar type `date` for use with attributes of defined models.
 *
 * @name ModelTypeDate
 * @extends ModelType
 */
class ModelTypeDate extends ModelType {
	/** @inheritDoc */
	static get typeName() {
		return "date";
	}

	/** @inheritDoc */
	static coerce( value, requirements = {} ) {
		if ( value === null || value === undefined ) {
			value = null;
		} else if ( typeof value === "string" ) {
			value = Date.parse( value );
			if ( !isNaN( value ) ) {
				value = new Date( value );

				if ( "time" in requirements && !requirements.time ) {
					value.setUTCHours( 0 );
					value.setUTCMinutes( 0 );
					value.setUTCSeconds( 0 );
				}
			}
		}

		return value;
	}

	/** @inheritDoc */
	static isValid( name, value, requirements, errors ) {
		if ( requirements.required && ( value === null || isNaN( value ) ) ) {
			errors.push( new Error( `${name} is required` ) );
		}

		if ( value !== null ) {
			let { min, max } = requirements;

			if ( !isNaN( min ) ) {
				min = new Date( min );
			}

			if ( min instanceof Date && ( isNaN( value ) || value.getTime() < min.getTime() ) ) {
				errors.push( new Error( `${name} is below required minimum` ) );
			}

			if ( !isNaN( max ) ) {
				max = new Date( max );
			}

			if ( max instanceof Date && ( isNaN( value ) || value > max ) ) {
				errors.push( new Error( `${name} is above required maximum` ) );
			}
		}
	}

	/** @inheritDoc */
	static serialize( value ) {
		if ( value instanceof Date ) {
			const year = value.getUTCFullYear();
			const month = ( "0" + String( value.getUTCMonth() + 1 ) ).slice( -2 );
			const day = ( "0" + String( value.getUTCDate() ) ).slice( -2 );
			const hours = ( "0" + String( value.getUTCHours() ) ).slice( -2 );
			const minutes = ( "0" + String( value.getUTCMinutes() ) ).slice( -2 );
			const seconds = ( "0" + String( value.getUTCSeconds() ) ).slice( -2 );

			value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
		} else {
			value = null;
		}

		return value;
	}

	/** @inheritDoc */
	static deserialize( value ) {
		if ( value === null || value === undefined || value === "null" || value === "" ) {
			value = null;
		} else {
			value = Date.parse( value );
			if ( isNaN( value ) ) {
				value = null;
			} else {
				value = new Date( value );
			}
		}

		return value;
	}

	/** @inheritDoc */
	static get aliases() {
		return [ "float", "real", "double", "decimal" ];
	}
}

module.exports = ModelTypeDate;
