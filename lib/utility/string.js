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


const ptnCamel = /(\S)([A-Z])/g;
const ptnSnake = /(\S)_+(\S)/g;
const ptnKebap = /(\S)-+(\S)/g;


/**
 * Converts string from camelCase to snake_case.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function camelToSnake( string ) {
	return string.replace( ptnCamel, ( all, predecessor, match ) => predecessor + "_" + match.toLocaleLowerCase() );
}

/**
 * Converts string from camelCase to kebap-case.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function camelToKebap( string ) {
	return string.replace( ptnCamel, ( all, predecessor, match ) => predecessor + "-" + match.toLocaleLowerCase() );
}

/**
 * Converts string from snake_case to camelCase.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function snakeToCamel( string ) {
	return string.replace( ptnSnake, ( all, predecessor, match ) => predecessor + match.toLocaleUpperCase() );
}

/**
 * Converts string from snake_case to kebap-case.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function snakeToKebap( string ) {
	return string.replace( ptnSnake, ( all, predecessor, match ) => predecessor + "-" + match );
}

/**
 * Converts string from kebap-case to camelCase.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function kebapToCamel( string ) {
	return string.replace( ptnKebap, ( all, predecessor, match ) => predecessor + match.toLocaleUpperCase() );
}

/**
 * Converts string from kebap-case to PascalCase.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function kebapToPascal( string ) {
	const camel = kebapToCamel( string );

	return camel.slice( 0, 1 ).toUpperCase() + camel.slice( 1 );
}

/**
 * Converts string from kebap-case to snake_case.
 *
 * @param {string} string string to convert
 * @returns {string} converted string
 */
function kebapToSnake( string ) {
	return string.replace( ptnKebap, ( all, predecessor, match ) => predecessor + "_" + match );
}


module.exports = Object.seal( {
	camelToSnake,
	camelToKebap,
	snakeToCamel,
	snakeToKebap,
	kebapToCamel,
	kebapToPascal,
	kebapToSnake,

	/**
	 * Detects if some string contains valid keyword or not.
	 *
	 * @type {RegExp}
	 * @readonly
	 */
	ptnKeyword: /^[a-z][a-z0-9_]*$/i,
} );

global.hitchyPtnKeyword = module.exports.ptnKeyword;
