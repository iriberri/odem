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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { MemoryAdapter, Adapter } = require( "../../index" );


suite( "MemoryAdapter", function() {
	test( "is exposed in property `MemoryAdapter`", function() {
		Should( MemoryAdapter ).be.ok();
	} );

	test( "can be used to create instance", function() {
		( () => new MemoryAdapter() ).should.not.throw();
	} );

	test( "is derived from basic Adapter", function() {
		new MemoryAdapter().should.be.instanceOf( Adapter );
	} );

	test( "exposes instance methods of Adapter API", function() {
		const instance = new MemoryAdapter();

		instance.should.have.property( "create" ).which.is.a.Function().of.length( 2 );
		instance.should.have.property( "has" ).which.is.a.Function().of.length( 1 );
		instance.should.have.property( "read" ).which.is.a.Function().of.length( 1 );
		instance.should.have.property( "write" ).which.is.a.Function().of.length( 2 );
		instance.should.have.property( "remove" ).which.is.a.Function().of.length( 1 );
		instance.should.have.property( "begin" ).which.is.a.Function().of.length( 0 );
		instance.should.have.property( "rollBack" ).which.is.a.Function().of.length( 0 );
		instance.should.have.property( "commit" ).which.is.a.Function().of.length( 0 );
	} );

	test( "exposes class/static methods of Adapter API", function() {
		MemoryAdapter.should.have.property( "keyToPath" ).which.is.a.Function().of.length( 1 );
		MemoryAdapter.should.have.property( "pathToKey" ).which.is.a.Function().of.length( 1 );
	} );

	test( "returns promise on invoking create() which is resolved with key of created record", function() {
		const instance = new MemoryAdapter();

		const myData = { someProperty: "its value" };

		return instance.create( "model/%u", myData ).should.be.Promise().which.is.resolved()
			.then( key => {
				key.should.be.String().which.is.not.empty().and.startWith( "model/" ).and.not.endWith( "%u" );

				return instance.read( key ).should.be.Promise().which.is.resolvedWith( myData );
			} );
	} );

	test( "returns promise on invoking read() which is rejected on missing record and resolved with data on existing record", function() {
		const instance = new MemoryAdapter();

		const myData = { someProperty: "its value" };

		return instance.read( "model/some-id" ).should.be.Promise().which.is.rejected()
			.then( () => instance.write( "model/some-id", myData ) )
			.then( () => instance.read( "model/some-id" ).should.be.Promise().which.is.resolvedWith( myData ) );
	} );

	test( "promises provided fallback value on trying to read() missing record", function() {
		const instance = new MemoryAdapter();

		const myFallbackData = { someProperty: "its value" };

		return instance.read( "model/some-id" ).should.be.Promise().which.is.rejected()
			.then( () => instance.read( "model/some-id", { ifMissing: myFallbackData } ).should.be.Promise().which.is.resolvedWith( myFallbackData ) );
	} );

	test( "returns promise on invoking write() which is resolved with written data", function() {
		const instance = new MemoryAdapter();

		const myData = { someProperty: "its value" };

		return instance.write( "model/some-id", myData ).should.be.Promise().which.is.resolved()
			.then( result => {
				result.should.equal( myData );
			} );
	} );

	test( "returns promise on invoking has() which is resolved with information on having selected record or not", function() {
		const instance = new MemoryAdapter();

		return instance.has( "model/some-id" ).should.be.Promise().which.is.resolved()
			.then( exists => {
				Should( exists ).be.false();
			} )
			.then( () => instance.write( "model/some-id", {} ) )
			.then( () => instance.has( "model/some-id" ).should.be.Promise().which.is.resolved() )
			.then( exists => {
				Should( exists ).be.true();
			} );
	} );

	test( "returns promise on invoking remove() which is resolved with key of record no matter if record exists or not", function() {
		const instance = new MemoryAdapter();

		return instance.remove( "model/some-id" ).should.be.Promise().which.is.resolvedWith( "model/some-id" )
			.then( instance.write( "model/some-id", { someProperty: "its value" } ) )
			.then( instance.remove( "model/some-id" ).should.be.Promise().which.is.resolvedWith( "model/some-id" ) );
	} );

	test( "returns promise on invoking begin() which is rejected due to lack of support for transactions", function() {
		const instance = new MemoryAdapter();

		return instance.begin().should.be.Promise().which.is.rejected();
	} );

	test( "returns promise on invoking rollBack() which is rejected due to lack of support for transactions", function() {
		const instance = new MemoryAdapter();

		return instance.rollBack().should.be.Promise().which.is.rejected();
	} );

	test( "returns promise on invoking commit() which is rejected due to lack of support for transactions", function() {
		const instance = new MemoryAdapter();

		return instance.commit().should.be.Promise().which.is.rejected();
	} );

	test( "returns keys w/o UUID as given on request for mapping it into some path name", function() {
		[
			"",
			"a",
			"some/test",
		].forEach( key => MemoryAdapter.keyToPath( key ).replace( /\\/g, "/" ).should.be.String().which.is.equal( key ) );
	} );

	test( "returns keys w/ UUID as given on request for mapping it into some path name", function() {
		[
			"01234567-89ab-cdef-fedc-ba9876543210",
			"item/00000000-1111-2222-4444-888888888888",
		].forEach( key => MemoryAdapter.keyToPath( key ).replace( /\\/g, "/" ).should.be.String().which.is.equal( key ) );
	} );

	test( "returns path names not related to some UUID as given on request for mapping it into some key", function() {
		[
			"",
			"a",
			join( "some", "test" ),
		].forEach( key => MemoryAdapter.pathToKey( key ).should.be.String().which.is.equal( key ) );
	} );

	test( "returns path names related to some UUID as given on request for mapping it into some key", function() {
		[
			join( "0", "12", "34567-89ab-cdef-fedc-ba9876543210" ),
			join( "item", "0", "00", "00000-1111-2222-4444-888888888888" ),
		].forEach( key => MemoryAdapter.pathToKey( key ).should.be.String().which.is.equal( key ) );
	} );
} );
