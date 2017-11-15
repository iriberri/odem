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

const { Model, Adapter } = require( "../../index" );


suite( "Abstract Model", function() {
	test( "is exposed in property `Adapter`", function() {
		Should( Model ).be.ok();
	} );

	test( "can be used to create instance", function() {
		( () => new Model( "01234567-89ab-cdef-fedc-ba9876543210" ) ).should.not.throw();
	} );

	test( "requires UUID on creating instance", function() {
		( () => new Model() ).should.throw();
	} );

	test( "exposes instance properties of Model API", function() {
		const uuid = "01234567-89ab-cdef-fedc-ba9876543210";
		const instance = new Model( uuid );

		instance.should.have.property( "uuid" ).which.is.a.String().and.equal( uuid );
		instance.should.have.property( "adapter" ).which.is.an.instanceOf( Adapter );
		instance.should.have.property( "dataKey" ).which.is.a.String().and.not.empty();
		instance.should.have.property( "properties" ).which.is.an.Object().and.ok();
		instance.should.have.property( "loaded" ).which.is.a.Boolean();
		instance.should.have.property( "exists" ).which.is.a.Promise().and.resolvedWith( false );
	} );

	test( "exposes instance methods of Model API", function() {
		const instance = new Model( "01234567-89ab-cdef-fedc-ba9876543210" );

		instance.should.have.property( "load" ).which.is.a.Function().of.length( 0 );
		instance.should.have.property( "save" ).which.is.a.Function().of.length( 0 );
		instance.should.have.property( "validate" ).which.is.a.Function().of.length( 0 );
	} );

	test( "exposes class/static properties of Model API", function() {
		Model.should.have.property( "name" ).which.is.a.String().and.equal( "$$AbstractModel$$" );
	} );

	test( "exposes class/static methods of Model API", function() {
		Model.should.have.property( "find" ).which.is.a.Function().of.length( 1 );
	} );

	test( "exposes context of monitoring properties for changes", function() {
		const instance = new Model( "01234567-89ab-cdef-fedc-ba9876543210" );

		instance.properties.$context.should.be.an.Object().which.is.ok().and.has.property( "changed" ).which.is.ok().and.empty();
	} );

	test( "marks properties not having been loaded initially Model#loaded", function() {
		const instance = new Model( "01234567-89ab-cdef-fdec-ba9876543210" );

		instance.loaded.should.be.Boolean().which.is.false();
	} );

	test( "returns promise on using Model#load() reject due to using UUID of a missing item", function() {
		const instance = new Model( "01234567-89ab-cdef-fdec-ba9876543210" );

		return instance.load().should.be.Promise().which.is.rejected();
	} );

	test( "does not mark properties as loaded if Model#load() failed", function() {
		const instance = new Model( "01234567-89ab-cdef-fdec-ba9876543210" );

		return instance.load().should.be.Promise().which.is.rejected()
			.then( () => {
				return instance.loaded.should.be.false();
			} );
	} );

	test( "does not mark properties as loaded if Model#load() failed", function() {
		const instance = new Model( "01234567-89ab-cdef-fdec-ba9876543210" );

		return instance.load().should.be.Promise().which.is.rejected()
			.then( () => {
				return instance.loaded.should.be.false();
			} );
	} );

	test( "detects change of properties tracking names of changed elements", function() {
		const instance = new Model( "01234567-89ab-cdef-fdec-ba9876543210" );

		return instance.load().should.be.Promise().which.is.rejected()
			.then( () => {
				return instance.loaded.should.be.false();
			} );
	} );
} );
