/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
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

/* eslint no-unused-vars: ["error", { "args": "none" }] */

const { join } = require( "path" );

const { defaultAdapter } = require( "../defaults" );
const { UuidV4, Monitor } = require( "../utility" );


/**
 * @name Model
 * @alias Base
 * @property {string} uuid universally unique ID of item
 * @property {Adapter} adapter K/V-style backend driver used for storing data
 * @property {string} dataKey key addressing data of model item
 * @property {object} properties set of item's properties
 * @property {boolean} loaded marks if current set of data has been loaded before or not
 */
class Model {
	/**
	 * @param {string} uuid UUID of model item to be managed by instance
	 * @param {boolean} noWarnUnsaved set true to omit model logging to stderr on replacing changed property w/o saving first
	 * @param {Adapter} adapter selects driver for backend to use for storing data
	 */
	constructor( uuid, { adapter = null, noWarnUnsaved = false } = {} ) {
		if ( !UuidV4.isUUID( uuid ) ) {
			throw new TypeError( `invalid UUID: ${uuid}` );
		}

		let data = Monitor( {}, {
			recursive: true,
			warn: true,
		} );

		let wasSet = false;


		Object.defineProperties( this, {
			uuid: { value: uuid },
			adapter: { value: adapter || defaultAdapter },
			dataKey: { value: join( "models", this.constructor.name, uuid ) },
			properties: {
				get: () => data,
				set: value => {
					if ( !value || typeof value !== "object" ) {
						throw new TypeError( "invalid set of properties" );
					}

					if ( !noWarnUnsaved && data.$context && data.$context.changed.size > 0 ) {
						console.error( "WARNING: replacing an item's properties after changing some w/o saving" );
					}

					data = Monitor( value, {
						recursive: true,
						warn: !noWarnUnsaved,
					} );

					wasSet = true;
				},
			},
			loaded: {
				get: () => wasSet,
			},
		} );
	}

	/**
	 * Fetches name of current model.
	 *
	 * @returns {string}
	 */
	static get name() {
		return "$$AbstractModel$$";
	}

	/**
	 * Tests if backend contains data of current item or not.
	 *
	 * @returns {Promise<boolean>} promises true if data exists and false otherwise
	 */
	get exists() {
		return this.adapter.has( this.dataKey );
	}

	/**
	 * Loads data of item from backend.
	 *
	 * @note This method is reading up-to-date data from backend on every
	 *       invocation. Thus make sure to cache the result if possible.
	 *
	 * @returns {Promise<object>} promises object containing data of item
	 */
	load() {
		return this.adapter.read( this.dataKey )
			.then( data => {
				this.properties = data;
			} );
	}

	/**
	 * Writes data of item to backend.
	 *
	 * @note This method is writing data to backend on every invocation.
	 *
	 * @returns {Promise<object>} promises object containing data of item
	 */
	save() {
		return this.validate()
			.then( isValid => {
				if ( isValid ) {
					return this.adapter.write( this.dataKey, this.properties )
						.then( result => {
							// clear marks on changed properties for having
							// saved them right before
							this.properties.$context.changed.clear();

							return result;
						} );
				}

				throw new Error( "saving invalid properties rejected" );
			} );
	}

	/**
	 * Validates current set of properties.
	 *
	 * @returns {Promise<boolean>} promises result of validation
	 */
	validate() {
		return Promise.resolve( true );
	}

	/**
	 * Fetches items matching set of processors
	 *
	 * @param {Object<string,function()>} processors maps names of properties into methods choosing items actually matching
	 * @param {boolean} matchAll marks if all properties have to match
	 * @param {int} offset number of matches to skip
	 * @param {int} limit maximum number of matches to retrieve
	 * @returns {Promise<Model[]>} promises list of matching items
	 */
	static find( processors, { matchAll = true, offset = 0, limit = 0 } = {} ) {
		return Promise.resolve( [] );
	}
}

module.exports = Model;
