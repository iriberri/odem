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

const { relative, resolve, join, dirname } = require( "path" );
const { write, close } = require( "fs" );

const Adapter = require( "./base" );
const { MkFile, Stat, MkDir, List, Read, Write, RmDir } = require( "file-essentials" );


/**
 * Implements backend managing all data in files of local file system.
 *
 * @name FileAdapter
 * @extends Adapter
 * @property {object} config options customizing current adapter
 * @property {string} dataSource path name of folder containing all data files
 */
class FileAdapter extends Adapter {
	/**
	 * @param {object} config configuration of adapter
	 */
	constructor( config ) {
		super();

		config = Object.assign( {
			dataSource: "/data",
		}, config );

		Object.defineProperties( this, {
			config: { value: config },
			dataSource: { value: config.dataSource },
		} );
	}

	/** @inheritDoc */
	create( keyTemplate, data ) {
		return MkFile( this.dataSource, {
			uuidToPath: uuid => this.constructor.keyToPath( keyTemplate.replace( /%u/g, uuid ) ).split( /[\\/]/ ),
		} )
			.then( ( { name, fd } ) => {
				return new Promise( ( resolve, reject ) => {
					write( fd, JSON.stringify( data ), 0, "utf8", error => {
						if ( error ) {
							close( fd );
							reject( error );
						} else {
							close( fd, error => {
								if ( error ) {
									reject( error );
								} else {
									resolve( relative( this.dataSource, name ) );
								}
							} );
						}
					} );
				} );
			} );
	}

	/** @inheritDoc */
	has( key ) {
		return Stat( resolve( this.dataSource, key ) ).then( s => Boolean( s ) );
	}

	/** @inheritDoc */
	list( parentKey ) {
		let path = this.constructor.keyToPath( parentKey );

		if ( path.match( /[\\/]\.\.?[\\/]/ ) ) {
			return Promise.reject( new Error( "invalid key: " + parentKey ) );
		}

		path = resolve( this.dataSource, path );

		return List( path, { noHidden: true } )
			.then( entries => {
				for ( let read = 0, length = entries.length; read < length; read++ ) {
					entries[read] = join( parentKey, entries[read] );
				}

				return entries;
			} );
	}

	/** @inheritDoc */
	read( key, { ifMissing = null } = {} ) {
		let path = this.constructor.keyToPath( key );

		if ( path.match( /[\\/]\.\.?[\\/]/ ) ) {
			return Promise.reject( new Error( "invalid key: " + key ) );
		}

		path = resolve( this.dataSource, path );

		const parent = dirname( path );

		return Stat( parent )
			.then( exists => {
				if ( exists && exists.isDirectory() ) {
					return Read( path )
						.then( content => JSON.parse( content.toString( "utf8" ) ) )
						.catch( error => {
							if ( error.code === "ENOENT" ) {
								console.log( ifMissing );
								if ( ifMissing ) {
									return ifMissing;
								}

								throw new Error( `no such record @${key}` );
							}

							throw error;
						} );
				} else {
					if ( ifMissing ) {
						return ifMissing;
					}

					throw new Error( `no such record @${key}` );
				}
			} );
	}

	/** @inheritDoc */
	write( key, data ) {
		const path = this.constructor.keyToPath( key );

		if ( path.match( /[\\/]\.\.?[\\/]/ ) ) {
			return Promise.reject( new Error( "invalid key: " + key ) );
		}

		const parent = dirname( path );
		let promise;

		switch ( parent ) {
			case "" :
			case "." :
			case "/" :
				promise = Promise.resolve();
				break;

			default :
				promise = Stat( parent )
					.then( exists => exists || MkDir( this.dataSource, parent ) );
		}

		return promise
			.then( () => Write( resolve( this.dataSource, path ), JSON.stringify( data ) ) )
			.then( () => data );
	}

	/** @inheritDoc */
	remove( key ) {
		const path = this.constructor.keyToPath( key );

		if ( path.match( /[\\/]\.\.?[\\/]/ ) ) {
			return Promise.reject( new Error( "invalid key: " + key ) );
		}

		return RmDir( resolve( this.dataSource, path ) ).then( () => key );
	}

	/** @inheritDoc */
	static keyToPath( key ) {
		return key.replace( /(^|[/\\])([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i, ( all, prefix, uuid ) => {
			return prefix + join( uuid[0], uuid.substr( 1, 2 ), uuid.substr( 3 ) );
		} );
	}

	/** @inheritDoc */
	static pathToKey( path ) {
		return path.replace( /(^|[/\\])([0-9a-f])([/\\])([0-9a-f]{2})\3([0-9a-f]{5}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, ( [ , prefix, first, , second, tail ] ) => {
			return prefix + first + second + tail;
		} );
	}
}

module.exports = FileAdapter;
