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

const { join, basename } = require( "path" );

const { defaultAdapter } = require( "../defaults" );
const { Uuid, Monitor } = require( "../utility" );


/**
 * @typedef {object} ModelProperties
 * @property {{changed: Set<string>}} $context
 */

/**
 * @typedef {object} ModelSchema
 */


/**
 * @name Model
 * @property {string} uuid universally unique ID of item
 * @property {Adapter} adapter K/V-style backend driver used for storing data
 * @property {string} dataKey key addressing data of model item
 * @property {object} properties set of item's properties
 * @property {boolean} loaded marks if current set of data has been loaded before or not
 */
class Model {
	/**
	 * @param {string} uuid UUID of model item to be managed by instance, omit for starting new item
	 * @param {boolean} onUnsaved set true to omit model logging to stderr on replacing changed property w/o saving first
	 * @param {Adapter} adapter selects driver for backend to use for storing data
	 */
	constructor( uuid = null, { adapter = null, onUnsaved = "fail" } = {} ) {
		// normalize and validate some optionally provided UUID
		uuid = normalizeUuid( uuid );
		if ( uuid !== null ) {
			if ( !Uuid.isUUID( uuid ) ) {
				throw new TypeError( `invalid UUID: ${uuid}` );
			}
		}


		this._onConstruction( uuid, adapter );


		/**
		 * @type {ModelProperties}
		 */
		let data = Monitor( {}, {
			recursive: true,
			warn: true,
		} );


		let isLoading = null;

		Object.defineProperties( this, {
			/**
			 * Uniquely identifies current instance of model.
			 *
			 * @note UUID can be written only once unless it has been given
			 *       initially for loading some matching instance from storage.
			 *
			 * @name Model#uuid
			 * @type {?string}
			 */
			uuid: {
				get: () => uuid,
				set: newUuid => {
					newUuid = normalizeUuid( newUuid );
					if ( newUuid !== null ) {
						if ( uuid !== null ) {
							throw new Error( "re-assigning UUID rejected" );
						}

						if ( !Uuid.isUUID( newUuid ) ) {
							throw new TypeError( `invalid UUID: ${newUuid}` );
						}

						uuid = newUuid;
					}
				},
			},

			/**
			 * Marks if request for loading properties from storage has been
			 * issued before promising model instance with properties updated
			 * according to fetched record.
			 *
			 * @name Model#loaded
			 * @type {Promise<Model>}
			 * @readonly
			 */
			loaded: {
				get: () => isLoading,
				set: promise => {
					if ( isLoading ) {
						throw new Error( "must not promise loading multiple times" );
					}

					if ( !( promise instanceof Promise ) ) {
						throw new Error( "not a promise" );
					}

					isLoading = promise
						.then( record => {
							if ( uuid !== null ) {
								if ( !record || typeof record !== "object" ) {
									throw new TypeError( "invalid set of properties" );
								}

								if ( data.$context && data.$context.hasChanged ) {
									switch ( onUnsaved ) {
										case "ignore" :
											break;

										case "warn" :
											console.error( "WARNING: replacing an item's properties after changing some w/o saving" );
											break;

										case "fail" :
										default :
											throw new Error( "WARNING: replacing an item's properties after changing some w/o saving" );
									}
								}

								data = Monitor( record, {
									recursive: true,
									warn: onUnsaved === "warn",
									fail: onUnsaved === "fail",
								} );
							}

							return this;
						} );
				}
			},

			/**
			 * Marks if current model instance is new (thus still lacking UUID).
			 *
			 * @name Model#isNew
			 * @type {boolean}
			 * @readonly
			 */
			isNew: { get: () => uuid === null },

			/**
			 * Refers to adapter connecting instance of model to some storage
			 * for storing it persistently.
			 *
			 * @name Model#adapter
			 * @type {Adapter}
			 * @readonly
			 */
			adapter: { value: adapter || defaultAdapter },

			/**
			 * Fetches data key of current model usually to be used with some
			 * KV-based storage.
			 *
			 * @name Model#dataKey
			 * @type {string}
			 * @readonly
			 */
			dataKey: { value: join( "models", this.constructor.name, uuid === null ? "%u" : uuid ) },

			/**
			 * Provides properties of current instance of model.
			 *
			 * @name Model#properties
			 * @type {ModelProperties}
			 * @readonly
			 */
			properties: { get: () => data },
		} );


		if ( uuid === null ) {
			this.loaded = Promise.resolve();
		}


		/**
		 * Normalizes some optionally given UUID ensuring its null or some
		 * truthy value eligibly considered valid UUID.
		 *
		 * @param {*} uuid
		 * @returns {?string}
		 */
		function normalizeUuid( uuid ) {
			switch ( typeof uuid ) {
				case "undefined" :
					return null;

				case "string" :
					uuid = uuid.trim();
					if ( !uuid.length ) {
						return null;
					}
			}

			return uuid;
		}
	}

	/**
	 * Handles code specific to initializing new instance of model.
	 *
	 * @note This method is a hook to be used by derived classes to customize
	 *       instances on construction.
	 *
	 * @param {string} uuid UUID of model instance
	 * @param {Adapter} adapter
	 * @protected
	 * @abstract
	 */
	_onConstruction( uuid, adapter ) {}

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
		return !this.isNew && this.adapter.has( this.dataKey );
	}

	/**
	 * Loads data of item from backend.
	 *
	 * @note This method is reading up-to-date data from backend on every
	 *       invocation. Thus make sure to cache the result if possible.
	 *
	 * @returns {Promise<Model>} promises model instance with properties loaded from storage
	 */
	load() {
		if ( !this.loaded ) {
			this.loaded = this.adapter.read( this.dataKey );
		}

		return this.loaded;
	}

	/**
	 * Writes data of item to backend.
	 *
	 * @returns {Promise<Model>} promises instance of model with its properties saved to persistent storage
	 */
	save() {
		const isNew = this.isNew;
		const properties = this.properties;

		if ( !isNew ) {
			// item is addressing existing record in storage
			if ( !this.loaded ) {
				return Promise.reject( new Error( "saving unloaded item rejected" ) );
			}

			if ( !properties.$context.changed.size ) {
				// item hasn't been changed, so there is no actual need to save anything
				return Promise.resolve( this );
			}
		}


		let validated;

		if ( this.loaded ) {
			validated = this.loaded.then( () => this.validate() );
		} else {
			validated = this.validate();
		}

		return validated.then( validationErrors => {
			if ( !validationErrors || validationErrors.length < 1 ) {
				if ( isNew ) {
					return this.adapter.create( this.dataKey, properties )
						.then( uuid => {
							this.uuid = basename( uuid );

							// clear marks on changed properties for having
							// saved them right before
							this.properties.$context.commit();

							return this;
						} );
				}

				return this.adapter.write( this.dataKey, properties )
					.then( () => {
						// clear marks on changed properties for having
						// saved them right before
						this.properties.$context.commit();

						return this;
					} );
			}

			throw new Error( "saving invalid properties rejected" );
		} );
	}

	/**
	 * Validates current set of properties.
	 *
	 * @returns {Promise<Error[]>} promises list of validation errors
	 */
	validate() {
		return Promise.resolve( [] );
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
