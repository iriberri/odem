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


const Model = require( "../../lib/model/base" );
const Compiler = require( "../../lib/model/compiler" );
const { Adapter, MemoryAdapter, FileAdapter } = require( "../../lib/adapter" );


suite( "Model compiler", function() {
	/**
	 * Creates some "class" imitating parts of `Model`.
	 *
	 * @param {object<string,object>} attributes attributes' definitions to be exposed in faked model's schema
	 * @param {object<string,function>} computeds computed attributes' definitions to be exposed in faked model's schema
	 * @param {object<string,function[]>} hooks hook definitions to be exposed in faked model's schema
	 * @returns {Function}
	 */
	function fakeModel( { attributes = {}, computeds = {}, hooks = {} } = {} ) {
		const fake = function FakeModel() {};

		Object.defineProperties( fake, {
			schema: { value: { attributes, computeds, hooks } },
		} );

		return fake;
	}

	/**
	 * Creates instance of some "class" imitating parts of `Model`.
	 *
	 * @param {object<string,*>} properties properties of instance of faked model
	 * @param {object<string,object>} attributes attributes' definitions to be exposed in faked model's schema
	 * @param {object<string,function>} computeds computed attributes' definitions to be exposed in faked model's schema
	 * @param {object<string,function[]>} hooks hook definitions to be exposed in faked model's schema
	 * @returns {Function}
	 */
	function fakeModelInstance( { properties = {}, attributes = {}, computeds = {}, hooks = {} } = {} ) {
		const Fake = fakeModel( { attributes, computeds, hooks } );
		const fake = new Fake();

		Object.defineProperties( fake, {
			properties: { value: properties },
		} );

		return fake;
	}


	test( "is available", function() {
		Should.exist( Compiler );
	} );

	suite( "basically exports compiler function which", function() {
		/**
		 * Does not inherit from basic model class.
		 */
		class CustomClass {}

		/**
		 * Inherits from basic model class.
		 */
		class CustomBaseClass extends Model {}



		test( "is available", function() {
			Compiler.should.be.Function();
		} );

		test( "requires at least one argument", function() {
			Compiler.should.have.length( 1 );
		} );

		test( "requires provision of valid name of model to define in first argument", function() {
			( () => Compiler() ).should.throw();
			( () => Compiler( undefined ) ).should.throw();
			( () => Compiler( null ) ).should.throw();
			( () => Compiler( false ) ).should.throw();
			( () => Compiler( true ) ).should.throw();
			( () => Compiler( 5 ) ).should.throw();
			( () => Compiler( -3.5 ) ).should.throw();
			( () => Compiler( 0 ) ).should.throw();
			( () => Compiler( [] ) ).should.throw();
			( () => Compiler( ["name"] ) ).should.throw();
			( () => Compiler( { name: "name" } ) ).should.throw();
			( () => Compiler( () => "name" ) ).should.throw();
			( () => Compiler( "" ) ).should.throw();

			( () => Compiler( "name" ) ).should.not.throw();
		} );

		test( "supports optional provision of schema definition object in second argument", function() {
			( () => Compiler( "name" ) ).should.not.throw();
			( () => Compiler( "name", undefined ) ).should.not.throw();

			( () => Compiler( "name", null ) ).should.throw();
			( () => Compiler( "name", false ) ).should.throw();
			( () => Compiler( "name", true ) ).should.throw();
			( () => Compiler( "name", 5 ) ).should.throw();
			( () => Compiler( "name", -3.5 ) ).should.throw();
			( () => Compiler( "name", 0 ) ).should.throw();
			( () => Compiler( "name", [] ) ).should.throw();
			( () => Compiler( "name", [{}] ) ).should.throw();
			( () => Compiler( "name", () => {} ) ).should.throw();
			( () => Compiler( "name", "" ) ).should.throw();
			( () => Compiler( "name", "schema" ) ).should.throw();

			( () => Compiler( "name", {} ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} } ) ).should.not.throw();
			( () => Compiler( "name", { prop: { type: "string" } } ) ).should.not.throw();
		} );

		test( "supports optional provision of base class derived from `Model` to become base class of defined Model implementation", function() {
			( () => Compiler( "name", { prop: {} } ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, undefined ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, null ) ).should.not.throw();

			( () => Compiler( "name", { prop: {} }, false ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, true ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, 5 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, -3.5 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, 0 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, [] ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, [CustomBaseClass] ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, () => {} ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, () => CustomBaseClass ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, {} ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, { base: CustomBaseClass } ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, "" ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, "CustomBaseClass" ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, CustomClass ) ).should.throw();

			( () => Compiler( "name", { prop: {} }, Model ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, CustomBaseClass ) ).should.not.throw();
		} );

		test( "supports optional provision of base class derived from `Model` to become base class of defined Model implementation", function() {
			( () => Compiler( "name", { prop: {} }, null ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, null, undefined ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, null, null ) ).should.not.throw();

			( () => Compiler( "name", { prop: {} }, null, false ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, true ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, 5 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, -3.5 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, 0 ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, [] ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, [CustomBaseClass] ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, () => {} ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, () => CustomBaseClass ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, {} ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, { base: CustomBaseClass } ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, "" ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, "CustomBaseClass" ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, CustomClass ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, CustomBaseClass ) ).should.throw();

			( () => Compiler( "name", { prop: {} }, null, Adapter ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, MemoryAdapter ) ).should.throw();
			( () => Compiler( "name", { prop: {} }, null, FileAdapter ) ).should.throw();

			( () => Compiler( "name", { prop: {} }, null, new Adapter() ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, null, new MemoryAdapter() ) ).should.not.throw();
			( () => Compiler( "name", { prop: {} }, null, new FileAdapter() ) ).should.not.throw();
		} );

		suite( "returns class that", function() {
			test( "is derived from `Model` (when invoked w/o schema)", function() {
				const Sub = Compiler( "mySub" );

				Sub.prototype.should.be.instanceOf( Model );
			} );

			test( "can be instantiated (when invoked w/o schema)", function() {
				const Sub = Compiler( "mySub" );

				const item = new Sub();

				item.should.be.instanceOf( Model );
			} );

			test( "can be used as base class in another invocation", function() {
				const Sub = Compiler( "mySub" );
				const SubSub = Compiler( "mySub", {}, Sub );

				const sub = new Sub();
				const subSub = new SubSub();

				sub.should.be.instanceOf( Model );
				subSub.should.be.instanceOf( Model );

				sub.should.be.instanceOf( Sub );
				subSub.should.be.instanceOf( Sub );

				sub.should.not.be.instanceOf( SubSub );
				subSub.should.be.instanceOf( SubSub );
			} );

			test( "is exposing attributes defined in provided schema as properties of every instance", function() {
				const Employee = Compiler( "employee", {
					name: {},
					age: {
						type: "int"
					},
					label: function() {
						return `${this.name} (Age: ${this.age})`;
					}
				} );

				const boss = new Employee();
				boss.name = "John Doe";
				boss.age = 45;

				boss.label.should.equal( "John Doe (Age: 45)" );
			} );

			test( "is statically exposing adapter provided on call for compilation", function() {
				const adapter = new MemoryAdapter();
				const Employee = Compiler( "employee", { name: {} }, null, adapter );

				Employee.adapter.should.be.equal( adapter );
			} );

			test( "is exposing adapter provided on call for compilation on every instance, too", function() {
				const adapter = new MemoryAdapter();
				const Employee = Compiler( "employee", { name: {} }, null, adapter );

				const boss = new Employee();

				boss.adapter.should.be.equal( adapter );
			} );
		} );
	} );

	test( "additionally exposes internally used functions for unit-testing", function() {
		Compiler.should.have.property( "_utility" ).which.is.an.Object();

		Compiler._utility.should.have.property( "splitSchemaElements" ).which.is.a.Function();
		Compiler._utility.should.have.property( "validateAttributes" ).which.is.a.Function();
		Compiler._utility.should.have.property( "compileSerializer" ).which.is.a.Function();
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

		test( "does not reject special attribute names", function() {
			( () => validateAttributes( "name", { prototype: {} } ) ).should.not.throw();
			( () => validateAttributes( "name", { constructor: {} } ) ).should.not.throw();
			( () => validateAttributes( "name", { super: {} } ) ).should.not.throw();

			( () => validateAttributes( "name", { exists: {} } ) ).should.not.throw();
			( () => validateAttributes( "name", { load: {} } ) ).should.not.throw();
			( () => validateAttributes( "name", { save: {} } ) ).should.not.throw();
			( () => validateAttributes( "name", { validate: {} } ) ).should.not.throw();
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

		test( "returns function not expecting any arguments on invocation", function() {
			const validator = compileValidator( {} );

			validator.should.be.Function().which.has.length( 0 );
		} );

		test( "returns function expecting to be bound to some model instance or similar on invocation", function() {
			const validator = compileValidator( {} );

			validator.should.throw();
			validator.bind( fakeModelInstance() ).should.not.throw();
		} );

		test( "returns empty function returning empty array on invocation", function() {
			const validator = compileValidator( {} );

			validator.call( fakeModelInstance() ).should.be.Array().which.is.empty();
		} );

		test( "returns non-empty function on non-empty definition which is throwing on invocation w/o context similar to Model instance and w/o attributes' definition", function() {
			const definition = { name: { type: "string" }, age: { type: "int" } };
			const validator = compileValidator( definition );

			validator.should.be.Function().which.has.length( 0 );
			validator.should.throw();

			validator.bind( fakeModelInstance() ).should.throw();
			validator.bind( fakeModelInstance( { attributes: definition } ) ).should.not.throw();
			validator.bind( fakeModelInstance( { attributes: definition } ) )().should.be.Array();
		} );
	} );

	suite( "contains internal method for compiling code coercing all attributes of model in a row which", function() {
		const { compileCoercion } = Compiler._utility;

		test( "requires provision of apparently valid and qualified definition of attributes in first argument", function() {
			( () => compileCoercion() ).should.throw();
			( () => compileCoercion( undefined ) ).should.throw();
			( () => compileCoercion( null ) ).should.throw();
			( () => compileCoercion( false ) ).should.throw();
			( () => compileCoercion( true ) ).should.throw();
			( () => compileCoercion( 0 ) ).should.throw();
			( () => compileCoercion( 4.5 ) ).should.throw();
			( () => compileCoercion( -3000 ) ).should.throw();
			( () => compileCoercion( [] ) ).should.throw();
			( () => compileCoercion( ["name"] ) ).should.throw();
			( () => compileCoercion( () => "name" ) ).should.throw();
			( () => compileCoercion( "" ) ).should.throw();
			( () => compileCoercion( "name" ) ).should.throw();
			( () => compileCoercion( { name: "name" } ) ).should.throw();
			( () => compileCoercion( { name: {} } ) ).should.throw(); // due to the lack of property `type`

			( () => compileCoercion( {} ) ).should.not.throw();
			( () => compileCoercion( { name: { type: "int" } } ) ).should.not.throw();
		} );

		test( "returns function not expecting any arguments on invocation", function() {
			const coercer = compileCoercion( {} );

			coercer.should.be.Function().which.has.length( 0 );
		} );

		test( "returns function expecting to be bound to some model instance or similar on invocation", function() {
			const coercer = compileCoercion( {} );

			coercer.should.throw();
			coercer.bind( fakeModelInstance() ).should.not.throw();
		} );

		test( "returns empty function not returning anything", function() {
			const coercer = compileCoercion( {} );

			Should( coercer.call( fakeModelInstance() ) ).be.undefined();
		} );

		test( "returns non-empty function on non-empty definition which is expecting attributes' definition as soon as there are matching properties", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" } };
			const mismatching = { label: "John", size: 42 };
			const matchingName = { name: "John" };
			const matchingAge = { age: 42 };
			const matchingBoth = { name: "John", age: 42 };
			const coercer = compileCoercion( attributes );

			coercer.should.be.Function().which.has.length( 0 );
			coercer.should.throw();

			coercer.bind( fakeModelInstance( {} ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: mismatching } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: mismatching, attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingName ) } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingName ), attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingAge ) } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingAge ), attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingBoth ) } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: Object.assign( {}, mismatching, matchingBoth ), attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: matchingName } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: matchingName, attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: matchingAge } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: matchingAge, attributes } ) ).should.not.throw();
			coercer.bind( fakeModelInstance( { properties: matchingBoth } ) ).should.throw();
			coercer.bind( fakeModelInstance( { properties: matchingBoth, attributes } ) ).should.not.throw();
		} );

		test( "returns non-empty function on non-empty definition not returning anything", function() {
			const definition = { name: { type: "string" }, age: { type: "int" } };
			const coercer = compileCoercion( definition );

			Should( coercer.call( fakeModelInstance( { properties: {}, attributes: definition } ) ) ).be.undefined();
		} );

		test( "returns non-empty function on non-empty definition adjusting properties provided as context", function() {
			let attributes = { name: { type: "string" } };
			let coercer = compileCoercion( attributes );

			coercer.should.be.Function().which.has.length( 0 );
			coercer.should.throw();

			let item = fakeModelInstance( { properties: { name: "John Doe", age: 42 }, attributes } );
			let coerced = coercer.bind( item, attributes )();
			Should.not.exist( coerced );
			item.properties.should.have.size( 2 );
			item.properties.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );
			item.properties.should.have.ownProperty( "age" ).which.is.equal( 42 );


			attributes = { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } };
			coercer = compileCoercion( attributes );

			item = fakeModelInstance( { properties: { name: "John Doe", age: 42, active: true }, attributes } );
			coerced = coercer.bind( item, attributes )();
			Should.not.exist( coerced );
			item.properties.should.have.size( 3 );
			item.properties.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );
			item.properties.should.have.ownProperty( "age" ).which.is.equal( 42 );
			item.properties.should.have.ownProperty( "active" ).which.is.equal( true );

			item = fakeModelInstance( { properties: { name: null, age: "42", active: 1 }, attributes } );
			coerced = coercer.bind( item, attributes )();
			Should.not.exist( coerced );
			item.properties.should.have.size( 3 );
			item.properties.should.have.ownProperty( "name" ).which.is.null();
			item.properties.should.have.ownProperty( "age" ).which.is.equal( 42 );
			item.properties.should.have.ownProperty( "active" ).which.is.equal( true );
		} );

		test( "returns non-empty function on non-empty definition adjusting defined properties in provided context, only", function() {
			let attributes = { name: { type: "string" } };
			let coercer = compileCoercion( attributes );

			coercer.should.be.Function().which.has.length( 0 );
			coercer.should.throw();

			let item = fakeModelInstance( { properties: { name: "John Doe", age: "42", active: 1 }, attributes } );
			let coerced = coercer.bind( item, attributes )();
			Should.not.exist( coerced );
			item.properties.should.have.size( 3 );
			item.properties.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );
			item.properties.should.have.ownProperty( "age" ).which.is.equal( "42" );
			item.properties.should.have.ownProperty( "active" ).which.is.equal( 1 );
		} );

		test( "returns non-empty function on non-empty definition setting all defined properties `null` if unset", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } };
			const coercer = compileCoercion( attributes );

			const item = fakeModelInstance( { attributes } );
			const coerced = coercer.bind( item, attributes )();
			Should.not.exist( coerced );
			item.properties.should.have.size( 3 );
			item.properties.should.have.ownProperty( "name" ).which.is.null();
			item.properties.should.have.ownProperty( "age" ).which.is.null();
			item.properties.should.have.ownProperty( "active" ).which.is.null();
		} );
	} );

	suite( "contains internal method for compiling code serializing all attributes of model in a row which", function() {
		const { compileSerializer } = Compiler._utility;

		test( "requires provision of apparently valid and qualified definition of attributes in first argument", function() {
			( () => compileSerializer() ).should.throw();
			( () => compileSerializer( undefined ) ).should.throw();
			( () => compileSerializer( null ) ).should.throw();
			( () => compileSerializer( false ) ).should.throw();
			( () => compileSerializer( true ) ).should.throw();
			( () => compileSerializer( 0 ) ).should.throw();
			( () => compileSerializer( 4.5 ) ).should.throw();
			( () => compileSerializer( -3000 ) ).should.throw();
			( () => compileSerializer( [] ) ).should.throw();
			( () => compileSerializer( ["name"] ) ).should.throw();
			( () => compileSerializer( () => "name" ) ).should.throw();
			( () => compileSerializer( "" ) ).should.throw();
			( () => compileSerializer( "name" ) ).should.throw();
			( () => compileSerializer( { name: "name" } ) ).should.throw();
			( () => compileSerializer( { name: {} } ) ).should.throw(); // due to the lack of property `type`

			( () => compileSerializer( {} ) ).should.not.throw();
			( () => compileSerializer( { name: { type: "int" } } ) ).should.not.throw();
		} );

		test( "returns function not expecting any arguments on invocation", function() {
			const serializer = compileSerializer( {} );

			serializer.should.be.Function().which.has.length( 0 );
		} );

		test( "returns empty function instantly invocable w/o any particular context", function() {
			const serializer = compileSerializer( {} );

			serializer.should.not.throw();
		} );

		test( "returns empty function returning empty object of serialized values on invocation", function() {
			const serializer = compileSerializer( {} );

			serializer().should.be.Object().which.is.empty();
		} );

		test( "returns non-empty function on non-empty definition which is throwing on invocation w/o context similar to Model instance", function() {
			const definition = { name: { type: "string" }, age: { type: "int" } };
			const serializer = compileSerializer( definition );

			serializer.should.be.Function().which.has.length( 0 );
			serializer.should.throw();

			serializer.bind( fakeModelInstance() ).should.not.throw();
			serializer.bind( fakeModelInstance() )().should.be.Object().which.has.size( 2 );
		} );

		test( "returns non-empty function on non-empty definition returning object with serialized value of every defined attribute", function() {
			let serializer = compileSerializer( { name: { type: "string" } } );

			serializer.should.be.Function().which.has.length( 0 );
			serializer.should.throw();

			let serialized = serializer.bind( fakeModelInstance( { properties: { name: "John Doe", age: 42 } } ) )();
			serialized.should.be.Object().which.has.size( 1 );
			serialized.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );


			serializer = compileSerializer( { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } } );

			serialized = serializer.bind( fakeModelInstance( { properties: { name: "John Doe", age: 42, active: true } } ) )();
			serialized.should.be.Object().which.has.size( 3 );
			serialized.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );
			serialized.should.have.ownProperty( "age" ).which.is.equal( 42 );
			serialized.should.have.ownProperty( "active" ).which.is.equal( 1 );
		} );

		test( "returns non-empty function on non-empty definition returning serialized form of all defined attributes including those w/o value", function() {
			const serializer = compileSerializer( { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } } );

			const serialized = serializer.bind( fakeModelInstance() )();
			serialized.should.be.Object().which.has.size( 3 );
			serialized.should.have.ownProperty( "name" ).which.is.null();
			serialized.should.have.ownProperty( "age" ).which.is.null();
			serialized.should.have.ownProperty( "active" ).which.is.null();
		} );
	} );

	suite( "contains internal method for compiling code deserializing all attributes of model in a row which", function() {
		const { compileDeserializer } = Compiler._utility;

		test( "requires provision of apparently valid and qualified definition of attributes in first argument", function() {
			( () => compileDeserializer() ).should.throw();
			( () => compileDeserializer( undefined ) ).should.throw();
			( () => compileDeserializer( null ) ).should.throw();
			( () => compileDeserializer( false ) ).should.throw();
			( () => compileDeserializer( true ) ).should.throw();
			( () => compileDeserializer( 0 ) ).should.throw();
			( () => compileDeserializer( 4.5 ) ).should.throw();
			( () => compileDeserializer( -3000 ) ).should.throw();
			( () => compileDeserializer( [] ) ).should.throw();
			( () => compileDeserializer( ["name"] ) ).should.throw();
			( () => compileDeserializer( () => "name" ) ).should.throw();
			( () => compileDeserializer( "" ) ).should.throw();
			( () => compileDeserializer( "name" ) ).should.throw();
			( () => compileDeserializer( { name: "name" } ) ).should.throw();
			( () => compileDeserializer( { name: {} } ) ).should.throw(); // due to the lack of property `type`

			( () => compileDeserializer( {} ) ).should.not.throw();
			( () => compileDeserializer( { name: { type: "int" } } ) ).should.not.throw();
		} );

		test( "returns function not expecting any arguments on invocation", function() {
			const deserializer = compileDeserializer( {} );

			deserializer.should.be.Function().which.has.length( 0 );
		} );

		test( "returns function expecting to be bound to some model instance or similar on invocation", function() {
			const deserializer = compileDeserializer( {} );

			deserializer.should.throw();
			deserializer.bind( fakeModelInstance() ).should.not.throw();
		} );

		test( "returns empty function returning empty object of serialized values on invocation", function() {
			const deserializer = compileDeserializer( {} );

			deserializer.call( fakeModelInstance() ).should.be.Object().which.is.empty();
		} );

		test( "returns non-empty function on non-empty definition which is throwing on invocation w/o context similar to Model instance", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" } };
			const deserializer = compileDeserializer( attributes );

			deserializer.should.be.Function().which.has.length( 0 );
			deserializer.should.throw();

			deserializer.bind( fakeModelInstance( { attributes } ) ).should.not.throw();
			deserializer.bind( fakeModelInstance( { attributes } ) )().should.be.Object().which.has.size( 2 );
		} );

		test( "returns non-empty function on non-empty definition returning object with deserialized value of every defined attribute", function() {
			let attributes = { name: { type: "string" } };
			let deserializer = compileDeserializer( attributes );

			deserializer.should.be.Function().which.has.length( 0 );
			deserializer.should.throw();

			let deserialized = deserializer.bind( fakeModelInstance( { properties: { name: "John Doe", age: 42 }, attributes } ) )();
			deserialized.should.be.Object().which.has.size( 1 );
			deserialized.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );


			attributes = { name: { type: "string" }, age: { type: "int" } };
			deserializer = compileDeserializer( attributes );

			deserialized = deserializer.bind( fakeModelInstance( { properties: { name: "John Doe", age: 42 }, attributes } ) )();
			deserialized.should.be.Object().which.has.size( 2 );
			deserialized.should.have.ownProperty( "name" ).which.is.equal( "John Doe" );
			deserialized.should.have.ownProperty( "age" ).which.is.equal( 42 );
		} );

		test( "returns function deserializing attribute's values coping w/ missing information in serialized data", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } };
			const deserializer = compileDeserializer( attributes );

			const deserialized = deserializer.bind( fakeModelInstance( { attributes } ) )();
			deserialized.should.be.Object().which.has.size( 3 );
			deserialized.should.have.ownProperty( "name" ).which.is.null();
			deserialized.should.have.ownProperty( "age" ).which.is.null();
			deserialized.should.have.ownProperty( "active" ).which.is.null();
		} );

		test( "returns function deserializing attribute's values coping w/ information in serialized data mismatching type of attribute", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" }, active: { type: "bool" } };
			const deserializer = compileDeserializer( attributes );

			const deserialized = deserializer.bind( fakeModelInstance( { properties: { name: 12345, age: "54321", active: "" }, attributes } ) )();
			deserialized.should.be.Object().which.has.size( 3 );
			deserialized.should.have.ownProperty( "name" ).which.is.equal( "12345" );
			deserialized.should.have.ownProperty( "age" ).which.is.equal( 54321 );
			deserialized.should.have.ownProperty( "active" ).which.is.false();
		} );
	} );

	suite( "contains internal method for compiling definition of getters and setters for conveniently accessing defined and computed attributes of model which", function() {
		const { compileGettersAndSetters } = Compiler._utility;

		test( "requires two arguments", function() {
			compileGettersAndSetters.should.be.a.Function().which.has.length( 2 );

			( () => compileGettersAndSetters() ).should.throw();
			( () => compileGettersAndSetters( {} ) ).should.throw();
			( () => compileGettersAndSetters( {}, {} ) ).should.not.throw();
		} );

		test( "requires both arguments to be suitable for object-like processing", function() {
			( () => compileGettersAndSetters( undefined, {} ) ).should.throw();
			( () => compileGettersAndSetters( null, {} ) ).should.throw();
			( () => compileGettersAndSetters( false, {} ) ).should.throw();
			( () => compileGettersAndSetters( true, {} ) ).should.throw();
			( () => compileGettersAndSetters( 0, {} ) ).should.throw();
			( () => compileGettersAndSetters( 4.5, {} ) ).should.throw();
			( () => compileGettersAndSetters( -3000, {} ) ).should.throw();
			( () => compileGettersAndSetters( [], {} ) ).should.throw();
			( () => compileGettersAndSetters( ["name"], {} ) ).should.throw();
			( () => compileGettersAndSetters( () => "name", {} ) ).should.throw();
			( () => compileGettersAndSetters( "", {} ) ).should.throw();
			( () => compileGettersAndSetters( "name", {} ) ).should.throw();

			( () => compileGettersAndSetters( {}, undefined ) ).should.throw();
			( () => compileGettersAndSetters( {}, null ) ).should.throw();
			( () => compileGettersAndSetters( {}, false ) ).should.throw();
			( () => compileGettersAndSetters( {}, true ) ).should.throw();
			( () => compileGettersAndSetters( {}, 0 ) ).should.throw();
			( () => compileGettersAndSetters( {}, 4.5 ) ).should.throw();
			( () => compileGettersAndSetters( {}, -3000 ) ).should.throw();
			( () => compileGettersAndSetters( {}, [] ) ).should.throw();
			( () => compileGettersAndSetters( {}, ["name"] ) ).should.throw();
			( () => compileGettersAndSetters( {}, () => "name" ) ).should.throw();
			( () => compileGettersAndSetters( {}, "" ) ).should.throw();
			( () => compileGettersAndSetters( {}, "name" ) ).should.throw();

			( () => compileGettersAndSetters( {}, {} ) ).should.not.throw();
			( () => compileGettersAndSetters( { name: "name" }, {} ) ).should.not.throw();
			( () => compileGettersAndSetters( { name: {} }, {} ) ).should.not.throw();
			( () => compileGettersAndSetters( {}, { name: "name" } ) ).should.not.throw();
			( () => compileGettersAndSetters( {}, { name: {} } ) ).should.not.throw();
		} );

		test( "returns an object", function() {
			const map = compileGettersAndSetters( {}, {} );

			map.should.be.Object();
		} );

		test( "returns empty object on providing empty sets of attributes and computeds", function() {
			const map = compileGettersAndSetters( {}, {} );

			map.should.be.Object().which.is.empty();
		} );

		test( "returns non-empty object listing entry for every attribute in provided definition", function() {
			const attributes = { name: { type: "string" }, age: { type: "int" } };
			const properties = { name: "Jane Doe", age: 23 };
			const map = compileGettersAndSetters( attributes, {} );

			map.should.be.Object().which.has.size( 2 );

			map.should.have.ownProperty( "name" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.name.get.should.be.Function().which.has.length( 0 );
			map.name.set.should.be.Function().which.has.length( 1 );

			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "Jane Doe" );
			map.name.set.bind( fakeModelInstance( { properties } ), "Jill Doe" ).should.not.throw();
			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "Jill Doe" );

			map.should.have.ownProperty( "age" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.age.get.should.be.Function().which.has.length( 0 );
			map.age.set.should.be.Function().which.has.length( 1 );

			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 23 );
			map.age.set.bind( fakeModelInstance( { properties } ), 42 ).should.not.throw();
			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 42 );
		} );

		test( "returns non-empty object listing entry for every computed attribute in provided definition", function() {
			const computeds = {
				name: function( value ) {
					if ( value === undefined ) {
						return this.properties.name.toUpperCase();
					}

					this.properties.name = value;
				},
				age: function( value ) {
					if ( value === undefined ) {
						return this.properties.age * 2;
					}

					this.properties.age = value;
				}
			};
			const properties = { name: "Jane Doe", age: 23 };
			const map = compileGettersAndSetters( {}, computeds );

			map.should.be.Object().which.has.size( 2 );

			map.should.have.ownProperty( "name" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.name.get.should.be.Function().which.has.length( 0 );
			map.name.set.should.be.Function().which.has.length( 1 );

			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "JANE DOE" );
			map.name.set.bind( fakeModelInstance( { properties } ), "Jill Doe" ).should.not.throw();
			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "JILL DOE" );

			map.should.have.ownProperty( "age" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.age.get.should.be.Function().which.has.length( 0 );
			map.age.set.should.be.Function().which.has.length( 1 );

			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 46 );
			map.age.set.bind( fakeModelInstance( { properties } ), 42 ).should.not.throw();
			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 84 );
		} );

		test( "prefers definition of getter/setter on attribute on clashing name w/ computed", function() {
			const attributes = { name: {}, age: {} };
			const computeds = { name: () => "John Doe", age: () => 42, altName: () => "John Doe", size: () => 180 };
			const properties = { name: "Jane Doe", age: 23 };
			const map = compileGettersAndSetters( attributes, computeds );

			map.should.be.Object().which.has.size( 4 );

			map.should.have.ownProperty( "name" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.name.get.should.be.Function().which.has.length( 0 );
			map.name.set.should.be.Function().which.has.length( 1 );

			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "Jane Doe" );
			map.name.set.bind( fakeModelInstance( { properties } ), "Jill Doe" ).should.not.throw();
			map.name.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "Jill Doe" );

			map.should.have.ownProperty( "altName" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.altName.get.should.be.Function().which.has.length( 0 );
			map.altName.set.should.be.Function().which.has.length( 1 );

			map.altName.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "John Doe" );
			map.altName.set.bind( fakeModelInstance( { properties } ), "Jill Doe" ).should.not.throw();
			map.altName.get.call( fakeModelInstance( { properties } ) ).should.be.equal( "John Doe" );

			map.should.have.ownProperty( "age" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.age.get.should.be.Function().which.has.length( 0 );
			map.age.set.should.be.Function().which.has.length( 1 );

			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 23 );
			map.age.set.bind( fakeModelInstance( { properties } ), 25 ).should.not.throw();
			map.age.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 25 );

			map.should.have.ownProperty( "size" ).which.is.an.Object().and.has.size( 2 ).and.has.properties( [ "get", "set" ] );
			map.size.get.should.be.Function().which.has.length( 0 );
			map.size.set.should.be.Function().which.has.length( 1 );

			map.size.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 180 );
			map.size.set.bind( fakeModelInstance( { properties } ), 170 ).should.not.throw();
			map.size.get.call( fakeModelInstance( { properties } ) ).should.be.equal( 180 );
		} );

		test( "does not define getter/setter for attributes with names basically used by implementation of Model", function() {
			compileGettersAndSetters( { prototype: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { constructor: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { super: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { exists: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { load: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { save: {} }, {} ).should.be.Object().which.has.size( 0 );
			compileGettersAndSetters( { validate: {} }, {} ).should.be.Object().which.has.size( 0 );
		} );
	} );
} );
