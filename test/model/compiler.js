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


const Compiler = require( "../../lib/model/compiler" );


suite( "Model compiler", function() {
	test( "is available", function() {
		Should.exist( Compiler );
	} );

	test( "basically exports compiler function", function() {
		Compiler.should.be.Function();
	} );

	test( "additionally exposes internally used functions for unit-testing", function() {
		Compiler.should.have.property( "_utility" ).which.is.an.Object();

		Compiler._utility.should.have.property( "splitSchemaElements" ).which.is.a.Function();
		Compiler._utility.should.have.property( "validateAttributes" ).which.is.a.Function();
		Compiler._utility.should.have.property( "compileValidator" ).which.is.a.Function();
	} );

	suite( "contains internal method for splitting schema elements which", function() {
		const { splitSchemaElements } = Compiler._utility;

		test( "validates proper provision of a model's name in first argument", function() {
			( () => splitSchemaElements() ).should.throw();
			( () => splitSchemaElements( undefined ) ).should.throw();
			( () => splitSchemaElements( null ) ).should.throw();
			( () => splitSchemaElements( false ) ).should.throw();
			( () => splitSchemaElements( true ) ).should.throw();
			( () => splitSchemaElements( 0 ) ).should.throw();
			( () => splitSchemaElements( 4.5 ) ).should.throw();
			( () => splitSchemaElements( -3000 ) ).should.throw();
			( () => splitSchemaElements( [] ) ).should.throw();
			( () => splitSchemaElements( ["name"] ) ).should.throw();
			( () => splitSchemaElements( {} ) ).should.throw();
			( () => splitSchemaElements( { name: "name" } ) ).should.throw();
			( () => splitSchemaElements( () => "name" ) ).should.throw();
			( () => splitSchemaElements( "" ) ).should.throw();

			( () => splitSchemaElements( "name" ) ).should.not.throw();
		} );

		test( "validates proper provision of a schema definition in second argument", function() {
			// okay due to 2nd arg defaulting to empty object:
			( () => splitSchemaElements( "name" ) ).should.not.throw();
			( () => splitSchemaElements( "name", undefined ) ).should.not.throw();

			// fail on providing anything but an object
			( () => splitSchemaElements( "name", null ) ).should.throw();
			( () => splitSchemaElements( "name", false ) ).should.throw();
			( () => splitSchemaElements( "name", true ) ).should.throw();
			( () => splitSchemaElements( "name", 0 ) ).should.throw();
			( () => splitSchemaElements( "name", 4.5 ) ).should.throw();
			( () => splitSchemaElements( "name", -3000 ) ).should.throw();
			( () => splitSchemaElements( "name", [] ) ).should.throw();
			( () => splitSchemaElements( "name", ["name"] ) ).should.throw();
			( () => splitSchemaElements( "name", () => "name" ) ).should.throw();
			( () => splitSchemaElements( "name", "" ) ).should.throw();
			( () => splitSchemaElements( "name", "name" ) ).should.throw();

			( () => splitSchemaElements( "name", {} ) ).should.not.throw();
			( () => splitSchemaElements( "name", { name: {} } ) ).should.not.throw();
		} );

		test( "accepts array for collecting errors while splitting in third argument", function() {
			( () => splitSchemaElements( "name", undefined, [] ) ).should.not.throw();
			( () => splitSchemaElements( "name", {}, [] ) ).should.not.throw();
			( () => splitSchemaElements( "name", { name: {} }, [] ) ).should.not.throw();
		} );

		test( "supports empty schema", function() {
			( () => splitSchemaElements( "name" ) ).should.not.throw();
			( () => splitSchemaElements( "name", undefined ) ).should.not.throw();
			( () => splitSchemaElements( "name", {} ) ).should.not.throw();
		} );

		test( "always returns separate sets mutually exclusively containing attributes, computed attributes and hooks of schema", function() {
			const empty = splitSchemaElements( "name" );

			empty.should.be.Object();
			empty.should.have.property( "attributes" ).which.is.an.Object().which.is.empty();
			empty.should.have.property( "computeds" ).which.is.an.Object().which.is.empty();
			empty.should.have.property( "hooks" ).which.is.an.Object().which.is.empty();
		} );

		test( "considers all schema elements of type (regular) object to be attribute definition", function() {
			const errors = [];
			const split = splitSchemaElements( "name", {
				someData: {},
			}, errors );

			split.should.be.Object();
			split.should.have.property( "attributes" ).which.is.an.Object().which.is.not.empty();
			split.should.have.property( "computeds" ).which.is.an.Object().which.is.empty();
			split.should.have.property( "hooks" ).which.is.an.Object().which.is.empty();

			split.attributes.should.have.property( "someData" ).which.is.an.Object();

			errors.should.be.empty();
		} );

		test( "considers all schema elements of type function to be computed properties", function() {
			const errors = [];
			const split = splitSchemaElements( "name", {
				someComputed: () => null,
			}, errors );

			split.should.be.Object();
			split.should.have.property( "attributes" ).which.is.an.Object().which.is.empty();
			split.should.have.property( "computeds" ).which.is.an.Object().which.is.not.empty();
			split.should.have.property( "hooks" ).which.is.an.Object().which.is.empty();

			split.computeds.should.have.property( "someComputed" ).which.is.a.Function();

			errors.should.be.empty();
		} );

		test( "considers all schema elements of type array to be lists of lifecycle hook handlers", function() {
			const errors = [];
			const split = splitSchemaElements( "name", {
				onSomeEvent: [() => null],
			}, errors );

			split.should.be.Object();
			split.should.have.property( "attributes" ).which.is.an.Object().which.is.empty();
			split.should.have.property( "computeds" ).which.is.an.Object().which.is.empty();
			split.should.have.property( "hooks" ).which.is.an.Object().which.is.not.empty();

			split.hooks.should.have.property( "onSomeEvent" ).which.is.an.Array().which.has.length( 1 );

			errors.should.be.empty();
		} );

		test( "collects errors on all invalid schema elements in optionally provided list", function() {
			[
				{ someInvalidElement: null },
				{ someInvalidElement: false },
				{ someInvalidElement: true },
				{ someInvalidElement: 0 },
				{ someInvalidElement: 1.5 },
				{ someInvalidElement: -4321 },
				{ someInvalidElement: "" },
				{ someInvalidElement: "string" },
			]
				.forEach( schema => {
					const errors = [];
					const split = splitSchemaElements( "name", schema, errors );

					split.should.be.Object();
					split.should.have.property( "attributes" ).which.is.an.Object().which.is.empty();
					split.should.have.property( "computeds" ).which.is.an.Object().which.is.empty();
					split.should.have.property( "hooks" ).which.is.an.Object().which.is.empty();

					errors.should.have.length( 1 );
				} );
		} );
	} );

	suite( "contains internal method for validating attribute definitions which", function() {
		const { validateAttributes } = Compiler._utility;

		test( "does not validate proper provision of a model's name in first argument", function() {
			( () => validateAttributes() ).should.not.throw();
			( () => validateAttributes( undefined ) ).should.not.throw();
			( () => validateAttributes( null ) ).should.not.throw();
			( () => validateAttributes( false ) ).should.not.throw();
			( () => validateAttributes( true ) ).should.not.throw();
			( () => validateAttributes( 0 ) ).should.not.throw();
			( () => validateAttributes( 4.5 ) ).should.not.throw();
			( () => validateAttributes( -3000 ) ).should.not.throw();
			( () => validateAttributes( [] ) ).should.not.throw();
			( () => validateAttributes( ["name"] ) ).should.not.throw();
			( () => validateAttributes( {} ) ).should.not.throw();
			( () => validateAttributes( { name: "name" } ) ).should.not.throw();
			( () => validateAttributes( () => "name" ) ).should.not.throw();
			( () => validateAttributes( "" ) ).should.not.throw();
			( () => validateAttributes( "name" ) ).should.not.throw();
		} );

		test( "requires provision of some object in second argument", function() {
			// okay due to 2nd arg defaulting to empty object:
			( () => validateAttributes( "name" ) ).should.not.throw();
			( () => validateAttributes( "name", undefined ) ).should.not.throw();

			// fail on providing anything but an object
			( () => validateAttributes( "name", null ) ).should.throw();
			( () => validateAttributes( "name", false ) ).should.throw();
			( () => validateAttributes( "name", true ) ).should.throw();
			( () => validateAttributes( "name", 0 ) ).should.throw();
			( () => validateAttributes( "name", 4.5 ) ).should.throw();
			( () => validateAttributes( "name", -3000 ) ).should.throw();
			( () => validateAttributes( "name", [] ) ).should.throw();
			( () => validateAttributes( "name", ["name"] ) ).should.throw();
			( () => validateAttributes( "name", () => "name" ) ).should.throw();
			( () => validateAttributes( "name", "" ) ).should.throw();
			( () => validateAttributes( "name", "name" ) ).should.throw();

			( () => validateAttributes( "name", {} ) ).should.not.throw();
			( () => validateAttributes( "name", { name: {} } ) ).should.not.throw();
		} );

		test( "adjusts provided definition of attribute w/o explicit selection of type to use 'string' by default", function() {
			const definition = {};

			validateAttributes( "name", { name: definition } );

			definition.should.be.Object().which.has.property( "type" ).which.is.equal( "string" );
		} );

		test( "returns related handler per defined attribute", function() {
			const definition = {};

			const handlers = validateAttributes( "name", { name: definition } );

			handlers.should.be.Object().which.has.size( 1 ).and.have.ownProperty( "name" ).which.is.not.equal( definition );
		} );

		test( "returns same handler for same type of attribute", function() {
			const definition = { name: { type: "string" }, label: {} };
			const handlers = validateAttributes( "name", definition );

			handlers.should.have.size( 2 );
			handlers.should.have.ownProperty( "name" );
			handlers.should.have.ownProperty( "label" ).which.is.equal( handlers.name );
			definition.name.should.not.equal( definition.label );
		} );

		test( "returns same handler for same type of attribute using different aliases", function() {
			const definition = { name: { type: "string" }, label: { type: "text" } };
			const handlers = validateAttributes( "name", definition );

			handlers.should.have.size( 2 );
			handlers.should.have.ownProperty( "name" );
			handlers.should.have.ownProperty( "label" ).which.is.equal( handlers.name );
			definition.name.should.not.equal( definition.label );
		} );

		test( "returns same handler for same type of attribute using different forms of same alias", function() {
			const definition = { name: { type: "string" }, label: { type: "STRING" } };
			const handlers = validateAttributes( "name", definition );

			handlers.should.have.size( 2 );
			handlers.should.have.ownProperty( "name" );
			handlers.should.have.ownProperty( "label" ).which.is.equal( handlers.name );
			definition.name.should.not.equal( definition.label );
		} );

		test( "returns different handler for different type of attribute", function() {
			const definition = { name: { type: "string" }, label: { type: "integer" } };
			const handlers = validateAttributes( "name", definition );

			handlers.should.have.size( 2 );
			handlers.should.have.ownProperty( "name" );
			handlers.should.have.ownProperty( "label" ).which.is.not.equal( handlers.name );
			definition.name.should.not.equal( definition.label );
		} );

		test( "returns same handler for same type of attribute selected by different aliases", function() {
			const definition = { name: { type: "int" }, label: { type: "integer" } };
			const handlers = validateAttributes( "name", definition );

			handlers.should.have.size( 2 );
			handlers.should.have.ownProperty( "name" );
			handlers.should.have.ownProperty( "label" ).which.is.equal( handlers.name );
			definition.name.should.not.equal( definition.label );
		} );
	} );

	suite( "contains internal method for compiling attribute validation code which", function() {
		const { compileValidator } = Compiler._utility;

		test( "requires provision of apparently valid and qualified definition of attributes in first argument", function() {
			( () => compileValidator() ).should.throw();
			( () => compileValidator( undefined ) ).should.throw();
			( () => compileValidator( null ) ).should.throw();
			( () => compileValidator( false ) ).should.throw();
			( () => compileValidator( true ) ).should.throw();
			( () => compileValidator( 0 ) ).should.throw();
			( () => compileValidator( 4.5 ) ).should.throw();
			( () => compileValidator( -3000 ) ).should.throw();
			( () => compileValidator( [] ) ).should.throw();
			( () => compileValidator( ["name"] ) ).should.throw();
			( () => compileValidator( () => "name" ) ).should.throw();
			( () => compileValidator( "" ) ).should.throw();
			( () => compileValidator( "name" ) ).should.throw();
			( () => compileValidator( { name: "name" } ) ).should.throw();
			( () => compileValidator( { name: {} } ) ).should.throw(); // due to the lack of property `type`

			( () => compileValidator( {} ) ).should.not.throw();
			( () => compileValidator( { name: { type: "int" } } ) ).should.not.throw();
		} );

		test( "returns a function (expecting valid and qualified definition of attributes in first argument)", function() {
			const validator = compileValidator( {} );

			validator.should.be.Function().which.has.length( 1 );
		} );

		test( "returns empty function instantly invocable w/o any particular arguments or context", function() {
			const validator = compileValidator( {} );

			validator.should.not.throw();
		} );

		test( "returns empty function returning empty array on invocation", function() {
			const validator = compileValidator( {} );

			validator().should.be.Array().which.is.empty();
		} );

		test( "returns non-empty function on non-empty definition which is throwing on invocation w/o context similar to Model instance and w/o attributes' definition", function() {
			const definition = { name: { type: "string" }, age: { type: "int" } };
			const validator = compileValidator( definition );

			validator.should.be.Function().which.has.length( 1 );
			validator.should.throw();

			validator.bind( { properties: {} } ).should.throw();
			validator.bind( { properties: {} }, definition ).should.not.throw();
			validator.bind( { properties: {} }, definition )().should.be.Array();
		} );
	} );
} );
