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

const { Monitor } = require( "../../lib/utility" );


suite( "Utility's Monitor", function() {
	test( "is a function", function() {
		Should( Monitor ).be.Function().which.is.length( 1 );
	} );

	test( "requires _object_ as first argument", function() {
		( () => Monitor() ).should.throw();
		( () => Monitor( undefined ) ).should.throw();
		( () => Monitor( null ) ).should.throw();
		( () => Monitor( false ) ).should.throw();
		( () => Monitor( true ) ).should.throw();
		( () => Monitor( 1 ) ).should.throw();
		( () => Monitor( -5.4 ) ).should.throw();
		( () => Monitor( undefined, {} ) ).should.throw();
		( () => Monitor( null, {} ) ).should.throw();
		( () => Monitor( false, {} ) ).should.throw();
		( () => Monitor( true, {} ) ).should.throw();
		( () => Monitor( 1, {} ) ).should.throw();
		( () => Monitor( -5.4, {} ) ).should.throw();

		( () => Monitor( {} ) ).should.not.throw();
		( () => Monitor( [] ) ).should.not.throw();
		( () => Monitor( function() {} ) ).should.not.throw();
		( () => Monitor( new Set() ) ).should.not.throw();
	} );

	suite( "returns", function() {
		let data;

		setup( function() {
			data = {
				someObject: { theObject: "set" },
				someFunction: function() {},
				someArray: [],
				someSet: new Set(),
				someInteger: 1000,
				someBoolean: false,
			};
		} );

		test( "same object as given", function() {
			const monitored = Monitor( data );

			monitored.should.be.Object().and.equal( data );
		} );

		test( "object exposing monitoring context as virtual property", function() {
			const monitored = Monitor( data );

			// it's a "virtual" property (thus can't be enumerated/tested)
			data.should.not.have.property( "$context" );
			monitored.should.not.have.property( "$context" );

			// is available for access in monitored version nonetheless
			Should( data.$context ).be.Undefined();
			monitored.$context.should.be.Object().which.is.ok().and.has.property( "changed" ).which.is.empty();
		} );

		test( "object NOT exposing monitoring context on properties with object-like values by default", function() {
			const monitored = Monitor( data );

			// it's a "virtual" property (thus can't be enumerated/tested)
			data.should.not.have.property( "$context" );
			monitored.should.not.have.property( "$context" );
			data.someObject.should.not.have.property( "$context" );
			monitored.someObject.should.not.have.property( "$context" );

			// is available for access in monitored version nonetheless
			Should( data.$context ).be.Undefined();
			monitored.$context.should.be.Object().which.is.ok().and.has.property( "changed" ).which.is.empty();
			Should( data.someObject.$context ).be.Undefined();
			Should( monitored.someObject.$context ).be.Undefined();
		} );

		test( "object exposing monitoring context on properties with object-like values on recursive monitoring", function() {
			const monitored = Monitor( data, { recursive: true } );

			// it's a "virtual" property (thus can't be enumerated/tested)
			data.should.not.have.property( "$context" );
			monitored.should.not.have.property( "$context" );
			data.someObject.should.not.have.property( "$context" );
			monitored.someObject.should.not.have.property( "$context" );

			// is available for access in monitored version nonetheless
			Should( data.$context ).be.Undefined();
			monitored.$context.should.be.Object().which.is.ok().and.has.property( "changed" ).which.is.empty();
			Should( data.someObject.$context ).be.Undefined();
			monitored.someObject.$context.should.be.Object().which.is.ok().and.has.property( "changed" ).which.is.empty();
		} );

		test( "object sharing same monitoring context with monitoring either property on recursive monitoring", function() {
			const monitored = Monitor( data, { recursive: true } );

			monitored.$context.should.equal( monitored.someObject.$context );
		} );

		suite( "monitored object", function() {
			test( "with adding shallow property via this object tracked in its monitoring context", function() {
				const monitored = Monitor( data );

				monitored.$context.changed.should.be.empty();
				data.firstAdded = null;
				monitored.$context.changed.should.be.empty();
				monitored.secondAdded = null;
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "firstAdded" ).should.be.false();
				monitored.$context.changed.has( "secondAdded" ).should.be.true();
			} );

			test( "with adjusting shallow property via this object tracked in its monitoring context", function() {
				const monitored = Monitor( data );

				monitored.$context.changed.should.be.empty();
				data.someInteger = 999;
				monitored.$context.changed.should.be.empty();
				monitored.someInteger = 998;
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someInteger" ).should.be.true();
			} );

			test( "with adjusting shallow property via this object using same value is NOT tracked in its monitoring context", function() {
				const monitored = Monitor( data );

				monitored.$context.changed.should.be.empty();
				data.someInteger = 1000;
				monitored.$context.changed.should.be.empty();
				monitored.someInteger = 1000;
				monitored.$context.changed.should.be.empty();
			} );


			test( "with adding deep property via this object tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someObject.firstAdded = null;
				monitored.$context.changed.should.be.empty();
				monitored.someObject.secondAdded = null;
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someObject" ).should.be.false();
				monitored.$context.changed.has( "firstAdded" ).should.be.false();
				monitored.$context.changed.has( "secondAdded" ).should.be.false();
				monitored.$context.changed.has( "someObject.firstAdded" ).should.be.false();
				monitored.$context.changed.has( "someObject.secondAdded" ).should.be.true();
			} );

			test( "with adjusting deep property via this object tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someObject.theObject = "changed";
				monitored.$context.changed.should.be.empty();
				monitored.someObject.theObject = "re-changed";
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someObject" ).should.be.false();
				monitored.$context.changed.has( "theObject" ).should.be.false();
				monitored.$context.changed.has( "someObject.theObject" ).should.be.true();
			} );

			test( "with adjusting deep property via this object using same value is NOT tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someObject.theObject = "set";
				monitored.$context.changed.should.be.empty();
				monitored.someObject.theObject = "set";
				monitored.$context.changed.should.be.empty();
			} );


			test( "with adding items to deep property array via this object is tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someArray.push( "foo" );
				monitored.$context.changed.should.be.empty();
				monitored.someArray.push( "foo" );
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someArray" ).should.be.false();
				monitored.$context.changed.has( "foo" ).should.be.false();
				monitored.$context.changed.has( "0" ).should.be.false();
				monitored.$context.changed.has( "1" ).should.be.false();
				monitored.$context.changed.has( "someArray.foo" ).should.be.false();
				monitored.$context.changed.has( "someArray.0" ).should.be.false();
				monitored.$context.changed.has( "someArray.1" ).should.be.true();
			} );

			test( "with removing items from deep property array via this object is tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someArray.push( "foo" );
				data.someArray.push( "foo" );
				monitored.$context.changed.should.be.empty();
				monitored.someArray.shift( "foo" );
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someArray" ).should.be.false();
				monitored.$context.changed.has( "foo" ).should.be.false();
				monitored.$context.changed.has( "1" ).should.be.false();
				monitored.$context.changed.has( "0" ).should.be.false();
				monitored.$context.changed.has( "length" ).should.be.false();
				monitored.$context.changed.has( "someArray.foo" ).should.be.false();
				monitored.$context.changed.has( "someArray.1" ).should.be.false();
				monitored.$context.changed.has( "someArray.0" ).should.be.false();
				monitored.$context.changed.has( "someArray.length" ).should.be.true();
			} );

			test( "with removing items alternative way from deep property array via this object is tracked in its monitoring context", function() {
				const monitored = Monitor( data, { recursive: true } );

				monitored.$context.changed.should.be.empty();
				data.someArray.push( "foo" );
				data.someArray.push( "foo" );
				monitored.$context.changed.should.be.empty();
				monitored.someArray.pop( "foo" );
				monitored.$context.changed.should.not.be.empty();
				monitored.$context.changed.has( "someArray" ).should.be.false();
				monitored.$context.changed.has( "foo" ).should.be.false();
				monitored.$context.changed.has( "1" ).should.be.false();
				monitored.$context.changed.has( "0" ).should.be.false();
				monitored.$context.changed.has( "length" ).should.be.false();
				monitored.$context.changed.has( "someArray.foo" ).should.be.false();
				monitored.$context.changed.has( "someArray.1" ).should.be.false();
				monitored.$context.changed.has( "someArray.0" ).should.be.false();
				monitored.$context.changed.has( "someArray.length" ).should.be.true();
			} );
		} );
	} );
} );
