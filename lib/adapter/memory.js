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

const { sep } = require( "path" );

const Adapter = require( "./base" );
const UuidV4 = require( "../utility/uuid" );


/**
 * Implements backend managing all data in files of local file system.
 *
 * @name MemoryAdapter
 * @extends Adapter
 * @property {object} config options customizing current adapter
 * @property {string} dataSource path name of folder containing all data files
 */
class MemoryAdapter extends Adapter {
	/**
	 * @param {object} config configuration of adapter
	 */
	constructor( config ) {
		super();

		config = Object.assign( {
			dataSource: "memory:///",
		}, config );

		Object.defineProperties( this, {
			config: { value: config },
			dataSource: { value: new Map() },
		} );
	}

	/** @inheritDoc */
	create( keyTemplate, data ) {
		return UuidV4()
			.then( uuid => {
				const key = this.constructor.keyToPath( keyTemplate.replace( /%u/g, uuid ) );

				this.dataSource.set( key, data );

				return key;
			} );
	}

	/** @inheritDoc */
	has( key ) {
		return Promise.resolve( this.dataSource.has( key ) );
	}

	/** @inheritDoc */
	list( parentKey ) {
		const matches = [];

		let trim = parentKey.length;
		let trimmed = false;
		while ( parentKey[trim - 1] === sep ) {
			trim--;
			trimmed = true;
		}

		if ( trimmed ) {
			parentKey = parentKey.substr( 0, trim ) + sep;
		}

		for ( let key of this.dataSource.keys() ) {
			if ( key.startsWith( parentKey ) ) {
				matches.push( key );
			}
		}

		return Promise.resolve( matches );
	}

	/** @inheritDoc */
	read( key, { ifMissing = null } = {} ) {
		const dataSource = this.dataSource;

		if ( dataSource.has( key ) ) {
			return Promise.resolve( dataSource.get( key ) );
		}

		if ( ifMissing ) {
			return Promise.resolve( ifMissing );
		}

		return Promise.reject( new Error( `no such record @${key}` ) );
	}

	/** @inheritDoc */
	write( key, data ) {
		this.dataSource.set( key, data );

		return Promise.resolve( data );
	}

	/** @inheritDoc */
	remove( key ) {
		this.dataSource.delete( key );

		return Promise.resolve( key );
	}
}

module.exports = MemoryAdapter;
