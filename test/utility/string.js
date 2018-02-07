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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const API = require( "../../lib/utility/string" );


suite( "Utility API for processing strings", function() {
	test( "is available", function() {
		Should.exist( API );
	} );

	test( "exposes methods for converting case formats", function() {
		API.should.be.an.Object().which.has.properties( "camelToSnake", "camelToKebap", "snakeToCamel", "snakeToKebap", "kebapToCamel", "kebapToSnake" );
	} );

	test( "converts camelCase string to snake_case", function() {
		API.camelToSnake( "" ).should.be.String().which.is.empty();
		API.camelToSnake( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.camelToSnake( "someCamelCase" ).should.be.String().which.is.equal( "some_camel_case" );
		API.camelToSnake( "SomeCamelCase" ).should.be.String().which.is.equal( "Some_camel_case" );
		API.camelToSnake( "ignores space but handles camelCase" ).should.be.String().which.is.equal( "ignores space but handles camel_case" );
	} );

	test( "converts camelCase string to kebap-case", function() {
		API.camelToKebap( "" ).should.be.String().which.is.empty();
		API.camelToKebap( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.camelToKebap( "someCamelCase" ).should.be.String().which.is.equal( "some-camel-case" );
		API.camelToKebap( "SomeCamelCase" ).should.be.String().which.is.equal( "Some-camel-case" );
		API.camelToKebap( "ignores space but handles camelCase" ).should.be.String().which.is.equal( "ignores space but handles camel-case" );
	} );

	test( "converts snake_case string to camelCase", function() {
		API.snakeToCamel( "" ).should.be.String().which.is.empty();
		API.snakeToCamel( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.snakeToCamel( "some_snake_case" ).should.be.String().which.is.equal( "someSnakeCase" );
		API.snakeToCamel( "Some_snake_case" ).should.be.String().which.is.equal( "SomeSnakeCase" );
		API.snakeToCamel( "ignores space but handles snake_case" ).should.be.String().which.is.equal( "ignores space but handles snakeCase" );
		API.snakeToCamel( "collapses__multiple_____________underscores" ).should.be.String().which.is.equal( "collapsesMultipleUnderscores" );
	} );

	test( "converts snake_case string to kebap-case", function() {
		API.snakeToKebap( "" ).should.be.String().which.is.empty();
		API.snakeToKebap( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.snakeToKebap( "some_snake_case" ).should.be.String().which.is.equal( "some-snake-case" );
		API.snakeToKebap( "Some_snake_case" ).should.be.String().which.is.equal( "Some-snake-case" );
		API.snakeToKebap( "ignores space but handles snake_case" ).should.be.String().which.is.equal( "ignores space but handles snake-case" );
		API.snakeToKebap( "collapses__multiple_____________underscores" ).should.be.String().which.is.equal( "collapses-multiple-underscores" );
	} );

	test( "converts kebap-case string to camelCase", function() {
		API.kebapToCamel( "" ).should.be.String().which.is.empty();
		API.kebapToCamel( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.kebapToCamel( "some-kebap-case" ).should.be.String().which.is.equal( "someKebapCase" );
		API.kebapToCamel( "Some-kebap-case" ).should.be.String().which.is.equal( "SomeKebapCase" );
		API.kebapToCamel( "ignores space but handles kebap-case" ).should.be.String().which.is.equal( "ignores space but handles kebapCase" );
		API.kebapToCamel( "collapses--multiple-------------underscores" ).should.be.String().which.is.equal( "collapsesMultipleUnderscores" );
	} );

	test( "converts kebap-case string to snake_case", function() {
		API.kebapToSnake( "" ).should.be.String().which.is.empty();
		API.kebapToSnake( "indifferent" ).should.be.String().which.is.equal( "indifferent" );
		API.kebapToSnake( "some-kebap-case" ).should.be.String().which.is.equal( "some_kebap_case" );
		API.kebapToSnake( "Some-kebap-case" ).should.be.String().which.is.equal( "Some_kebap_case" );
		API.kebapToSnake( "ignores space but handles kebap-case" ).should.be.String().which.is.equal( "ignores space but handles kebap_case" );
		API.kebapToSnake( "collapses--multiple-------------underscores" ).should.be.String().which.is.equal( "collapses_multiple_underscores" );
	} );
} );
