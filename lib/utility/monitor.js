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

/**
 * Wraps provided object in a Proxy to detect modifications of properties.
 *
 * @param {object} object data object to be monitored
 * @param {object} context explicit context to use instead of implicit one
 * @param {boolean} warn requests to log on stderr if property's recently changed value is replaced
 * @param {boolean} recursive requests to recursively monitor values of properties set
 * @param {string} prefix requests to prepend this string to all names of changed properties tracked in context
 * @param {boolean} justOwned set false to track change of all but owned properties
 * @returns {Proxy} wrapped data object
 */
function monitorData( object, { context = null, warn = true, recursive = false, prefix = "", justOwned = true } = {} ) {
	return new Proxy( object, {
		warn,
		recursive,
		prefix,
		justOwned,
		ctx: context || {
			changed: new Set(),
		},
		get: _get,
		set: _set,
	} );
}

/**
 * Implements trap for reading properties from wrapped object.
 *
 * This is used to expose context used to list changed properties under special
 * property named `$context`.
 *
 * @param {object} target
 * @param {string} name
 * @returns {*}
 * @private
 */
function _get( target, name ) {
	if ( name === "$context" ) {
		return this.ctx;
	}

	// pass the action
	let value = target[name];

	if ( this.recursive && ( !this.justOwned || target.hasOwnProperty( name ) || Array.isArray( value ) ) ) {
		// ensure to monitor the returned value, too
		switch ( typeof value ) {
			case "object" :
			case "function" :
				if ( value && !value.$context ) {
					value = monitorData( value, {
						recursive: true,
						warn: this.warn,
						prefix: this.prefix + name + ".",
						justOwned: this.justOwned,
						context: this.ctx,
					} );
				}
		}
	}

	return value;
}

/**
 * Implements trap for changing properties of wrapped object.
 *
 * This is used to track changed properties in special context of wrapper.
 *
 * @param {object} target wrapped object
 * @param {string} name name of property to change
 * @param {*} value new value of property to be changed
 * @returns {boolean} false to cause TypeError
 * @private
 */
function _set( target, name, value ) {
	if ( target[name] === value ) {
		return true;
	}

	if ( name !== "$context" ) {
		// track change
		const label = this.prefix + name;

		if ( !this.justOwned || target.hasOwnProperty( name ) || !( name in target ) ) {
			if ( this.warn && this.ctx.changed.has( label ) ) {
				console.error( `WARNING: replacing previously changed property ${label} w/o prior saving` );
			}

			this.ctx.changed.add( label );

			switch ( typeof value ) {
				case "object" :
				case "function" :
					if ( value && this.recursive ) {
						value = monitorData( value, {
							recursive: true,
							warn: this.warn,
							prefix: label + ".",
							justOwned: this.justOwned,
							context: this.ctx,
						} );
					}
			}
		}

		// pass actual action
		target[name] = value;

		return true;
	}

	// pass actual action w/o any extension
	target[name] = value;

	return false;
}


module.exports = monitorData;
