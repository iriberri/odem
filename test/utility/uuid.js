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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { UuidV4 } = require( "../../lib/utility" );


suite( "UUIDv4 generator", function() {
	test( "is exposed properly", function() {
		Should( UuidV4 ).be.ok();
	} );

	test( "is a function", function() {
		UuidV4.should.be.Function().which.has.length( 0 );
	} );

	test( "does not throw", function() {
		let result;

		( () => ( result = UuidV4() ) ).should.not.throw();

		return result;
	} );

	test( "returns a promise", function() {
		return UuidV4().should.be.Promise().which.is.resolved();
	} );

	test( "promises string containing UUIDv4 in commonly expected format", function() {
		return UuidV4()
			.then( result => {
				Should( result ).be.ok();

				result.should.be.String().and.match( /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i );
			} );
	} );

	test( "exposes static function isUUID() for testing whether some string is containing UUID or not.", function() {
		Should( UuidV4.isUUID ).be.ok();
		UuidV4.isUUID.should.be.Function().which.has.length( 1 );

		( () => UuidV4.isUUID() ).should.not.throw();

		UuidV4.isUUID().should.be.Boolean().which.is.false();
		UuidV4.isUUID( null ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( undefined ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( false ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( true ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( 0 ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( 0.0 ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( -1 ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( 1.0 ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( [] ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( {} ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( { uuid: "01234567-89ab-cdef-fedc-ba9876543210" } ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( () => {} ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( () => "01234567-89ab-cdef-fedc-ba9876543210" ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( new Set() ).should.be.Boolean().which.is.false();

		UuidV4.isUUID( "" ).should.be.Boolean().which.is.false();
		UuidV4.isUUID( "1234567-89ab-cdef-fedc-ba9876543210" ).should.be.Boolean().which.is.false();

		UuidV4.isUUID( "01234567-89ab-cdef-fedc-ba9876543210" ).should.be.Boolean().which.is.true();

		// due to coercion:
		UuidV4.isUUID( ["01234567-89ab-cdef-fedc-ba9876543210"] ).should.be.Boolean().which.is.true();
	} );

} );
