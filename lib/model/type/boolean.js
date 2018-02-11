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
 * Implements scalar type `boolean` for use with attributes of defined models.
 *
 * @name ModelTypeBoolean
 * @extends ModelType
 */
class ModelTypeBoolean extends ModelType {
	/** @inheritDoc */
	static get name() {
		return "boolean";
	}

	/** @inheritDoc */
	static coerce( value, requirements = {} ) {
		if ( value === null || value === undefined ) {
			return null;
		}

		return Boolean( value );
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
		} else {
			value = Boolean( value );
		}

		return value;
	}

	/** @inheritDoc */
	static get aliases() {
		return ["bool"];
	}
}

module.exports = ModelTypeBoolean;
