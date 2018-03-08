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

const { join } = require( "path" );

const PromiseUtils = require( "promise-essentials" );

const Types = require( "./type" );

const { defaultAdapter } = require( "../defaults" );

/**
 * @typedef object StaticModelContext
 * @property {string} name
 * @property {ModelSchema} schema
 * @property {Adapter} adapter
 * @property {function(string):string} keyToUuid
 */

/**
 * Implements "trait" injected into compiled models for managing collections of
 * instances per model.
 *
 * @note All methods of collection are designed to run in equivalent context of
 *       class derived from Model as returned by ModelCompiler(). Thus they are
 *       accessing several properties exposed by compiled model or instances of
 *       it.
 */
class Collection {
	/**
	 * Searches collection of current model for items matching selected test
	 * on values of a given attribute of model.
	 *
	 * @this {StaticModelContext}
	 * @param {string} name name of model's attribute to inspect for finding matches
	 * @param {*} value value to compare each model's attribute with for finding matches
	 * @param {string} operation name of operation to perform to detect match
	 * @param {int} offset number of leading matches to skip
	 * @param {int} limit maximum number of matches to retrieve
	 * @returns {Promise<Model[]>} resulting matches
	 */
	static findByAttribute( name, value = null, operation = "eq", offset = 0, limit = +Infinity ) {
		const that = this;

		const definition = this.schema.attributes[name];
		if ( !definition ) {
			throw new TypeError( `no such attribute: ${name}` );
		}

		const type = Types.selectByName( definition.type );
		if ( !type ) {
			throw new TypeError( `invalid type ${definition.type} of attribute ${name}` );
		}

		value = type.coerce( value, definition );


		const adapter = this.adapter || defaultAdapter;
		const path = join( "models", "items" );
		let found = 0;

		const stream = adapter.keyStream( path );

		return PromiseUtils.process( stream, function( dataKey ) {
			const uuid = that.keyToUuid( dataKey );
			const item = new that( uuid, { adapter } ); // eslint-disable-line new-cap

			return item.load()
				.then( () => {
					const itemValue = type.coerce( type.deserialize( item.properties[name] ), definition );

					if ( type.compare( itemValue, value, operation ) ) {
						if ( offset > 0 ) {
							offset--;
						} else {
							if ( !Array.isArray( this.matches ) ) {
								this.matches = new Array( Math.min( limit, 1000 ) );
							}

							this.matches[found++] = item;

							if ( found >= limit ) {
								// FIXME stream.close() is a bad approach for cancelling stream
								stream.close();
							}
						}
					}
				} );
		} )
			.then( ( { matches } ) => {
				if ( matches ) {
					matches.splice( found );

					return matches;
				}

				return [];
			} );
	}

	/**
	 * Injects static methods of `Collection` into provided function or object.
	 *
	 * @param {object|function} fn
	 * @returns {object|function} provided function or object w/ methods injected
	 */
	static injectInto( fn ) {
		switch ( typeof fn ) {
			case "object" :
				if ( !fn ) {
					break;
				}

			// falls through
			case "function" : {
				const injector = {};
				const names = [
					"findByAttribute",
				];

				for ( let i = 0, length = names.length; i < length; i++ ) {
					const name = names[i];

					injector[name] = { value: this[name] };
				}

				Object.defineProperties( fn, injector );

				return fn;
			}
		}

		throw new TypeError( "invalid target for injecting Collection trait into" );
	}
}

module.exports = Collection;
