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
 * Extracts body of function.
 *
 * @param {function} fn function to extract body from
 * @returns {string} extract body as string
 */
function extractBody( fn ) {
	if ( typeof fn !== "function" ) {
		throw new TypeError( "not a function" );
	}

	let code = fn.toString();


	const ptnParentheses = /[)(]/g;
	const ptnAllButOpenBraces = /[^{]+/g;
	const ptnAllButCloseBraces = /[^}]+/g;
	const ptnAllButOpenBrackets = /[^[]+/g;
	const ptnAllButCloseBrackets = /[^\]]+/g;
	const ptnStripDefaultValue = /\s*=.+$/;

	let endOfArgsAt = -1;
	let depth = 0;
	let match;

	while ( endOfArgsAt < 0 && ( match = ptnParentheses.exec( code ) ) ) {
		switch ( match[0] ) {
			case "(" :
				depth++;
				break;

			case ")" :
				if ( depth-- === 1 ) {
					endOfArgsAt = match.index + 1;
				}
				break;
		}
	}


	const args = code
		.slice( code.indexOf( "(" ) + 1, code.lastIndexOf( ")" ) )
		.trim()
		.split( /\s*,\s*/ );

	for ( let i = 0, length = args.length; i < length; i++ ) {
		const arg = args[i];

		if ( ( arg.replace( ptnAllButOpenBraces, "" ).length !== arg.replace( ptnAllButCloseBraces, "" ) ) ||
		     ( arg.replace( ptnAllButOpenBrackets, "" ).length !== arg.replace( ptnAllButCloseBrackets, "" ) ) ) {
			throw new TypeError( "no support for extracting function w/ destructuring arguments" );
		}

		args[i] = arg.replace( ptnStripDefaultValue, "" );
	}


	return {
		args,
		body: code
			.slice( code.indexOf( "{", endOfArgsAt ), code.lastIndexOf( "}" ) )
			.trim(),
	};
}


module.exports = { extractBody };
