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

/**
 * Implements basic API of all model types.
 */
class ModelType {
	// eslint-disable-next-line valid-jsdoc
	/**
	 * Fetches this type's name.
	 *
	 * @returns {string}
	 * @abstract
	 */
	static get name() {
		throw new Error( "must not use abstract model type" );
	}

	/**
	 * Coerces provided value to match current type.
	 *
	 * @note Only `return`-statement must be last in code to support
	 *       optimizations of model compiler.
	 *
	 * @param {*} value value to be coerced
	 * @param {object} requirements object used to customize type
	 * @returns {*} optionally coerced value
	 * @abstract
	 */
	static coerce( value, requirements = {} ) {
		return value;
	}

	/**
	 * Serializes the value e.g. for storing in a persistent storage.
	 *
	 * @note Only `return`-statement must be last in code to support
	 *       optimizations of model compiler.
	 *
	 * @param {*} value value to be serialized
	 * @returns {string} serialized value
	 */
	static serialize( value ) {
		if ( value === undefined ) {
			value = null;
		}

		return value;
	}

	/**
	 * De-serializes value e.g. as read from a persistent storage.
	 *
	 * @note Only `return`-statement must be last in code to support
	 *       optimizations of model compiler.
	 *
	 * @param {string} value value to be de-serialized
	 * @returns {*} de-serialized value
	 */
	static deserialize( value ) {
		return value;
	}

	/**
	 * Detects if provided value is valid according to this type obeying
	 * provided requirements.
	 *
	 * @note Don't return prematurely to enable optimizations of model compiler.
	 *
	 * @param {string} name of attribute (for use in error messages)
	 * @param {*} value value to be validated
	 * @param {object} requirements object used to customize type
	 * @param {Error[]} errors collects errors
	 * @abstract
	 */
	static isValid( name, value, requirements, errors ) {
		throw new Error( "must not use abstract model type" );
	}

	/**
	 * Detects if provided definition is suitable for current type of model
	 * attribute.
	 *
	 * @note Provided definition might be adjusted by method to fix recoverable
	 *       errors.
	 *
	 * @param {object} definition set of definition parameters for customizing some attribute's type
	 * @returns {Error[]} lists encountered errors, empty on success
	 */
	static checkDefinition( definition ) {
		if ( !definition || typeof definition !== "object" || Array.isArray( definition ) ) {
			return [new TypeError( "invalid definition" )];
		}

		return [];
	}

	/**
	 * Lists valid aliases of current type handler.
	 *
	 * @note This list is used on commonly exposing all available types of
	 *       attributes by name. Aliases are ignored if there is an existing
	 *       type of same name.
	 *
	 * @returns {Array}
	 */
	static get aliases() {
		return [];
	}
}

module.exports = ModelType;
