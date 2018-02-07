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
 * Implements scalar type string for use with attributes of defined models.
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
		if ( !requirements.required && ( value === null || value === undefined ) ) {
			return null;
		}

		if ( requirements.trim ) {
			value = String( value ).trim();
		}

		if ( requirements.reduceSpace ) {
			value = String( value ).replace( /\s+/g, " " );
		}

		return value;
	}

	/** @inheritDoc */
	static isValid( name, value, requirements, errors ) {
		if ( typeof value !== "string" ) {
			if ( requirements.required || value !== null ) {
				errors.push( new Error( `${name} is not a string` ) );
			}
		}

		const { length, pattern } = requirements;

		if ( length > -1 ) {
			if ( value.length > length ) {
				errors.push( new Error( `${name} exceeds required length` ) );
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

module.exports = ModelTypeString;
