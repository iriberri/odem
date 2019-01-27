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


const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { Model } = require( "../../" );


suite( "Models API", function() {
	suite( "exposes method for defining custom models which", function() {
		test( "is available", function() {
			Should.exist( Model.define );
			Model.define.should.be.Function();
		} );

		test( "requires valid provision of new model's name", function() {
			( () => Model.define() ).should.throw( TypeError );
			( () => Model.define( null ) ).should.throw( TypeError );
			( () => Model.define( undefined ) ).should.throw( TypeError );
			( () => Model.define( true ) ).should.throw( TypeError );
			( () => Model.define( false ) ).should.throw( TypeError );
			( () => Model.define( 1 ) ).should.throw( TypeError );
			( () => Model.define( 0.234 ) ).should.throw( TypeError );
			( () => Model.define( {} ) ).should.throw( TypeError );
			( () => Model.define( [] ) ).should.throw( TypeError );
			( () => Model.define( () => {} ) ).should.throw( TypeError ); // eslint-disable-line no-empty-function
			( () => Model.define( "" ) ).should.throw( TypeError );

			const model = Model.define( "sOmeThingVeRyaRBiTrarY" );

			model.name.should.equal( "sOmeThingVeRyaRBiTrarY" );
		} );

		test( "works with empty schema descriptor", function() {
			const Item = Model.define( "Item", {} );

			Item.should.not.equal( Model );
			Item.prototype.should.be.instanceOf( Model );
			Item.name.should.equal( "Item" );
		} );

		test( "takes existing model class for deriving new one from", function() {
			const Stuff = Model.define( "Stuff", {} );
			const Item = Model.define( "Item", {}, Stuff );

			Item.should.not.equal( Stuff );
			Item.should.not.equal( Model );
			Item.prototype.should.be.instanceof( Stuff );
			Item.prototype.should.be.instanceof( Model );
		} );

		test( "requires given model class for deriving new one from to inherit from AbstractModel", function() {
			function OldStyle() {} // eslint-disable-line no-empty-function, require-jsdoc
			class NewStyle {} // eslint-disable-line require-jsdoc

			( () => Model.define( "Item", {}, OldStyle ) ).should.throw();
			( () => Model.define( "Item", {}, NewStyle ) ).should.throw();
			( () => Model.define( "Item", {}, Array ) ).should.throw();
			( () => Model.define( "Item", {}, Date ) ).should.throw();
			( () => Model.define( "Item", {}, Map ) ).should.throw();
		} );

		test( "returns model exposing processed schema information", function() {
			const Item = Model.define( "Item" );

			Item.schema.should.be.Object().which.has.properties( "attributes", "computeds", "hooks" );
			Item.schema.attributes.should.be.empty();
			Item.schema.computeds.should.be.empty();
			Item.schema.hooks.should.be.empty();
		} );

		test( "accepts schema defining attributes of type `string`(implicitly)", function() {
			const Item = Model.define( "Item", {
				label: {},
				alias: {},
			} );

			Item.schema.should.be.Object().which.has.properties( "attributes", "computeds", "hooks" );
			Item.schema.attributes.should.not.be.empty();
			Item.schema.attributes.should.have.size( 2 );
			Item.schema.attributes.should.have.ownProperty( "label" ).which.has.property( "type" ).which.is.equal( "string" );
			Item.schema.attributes.should.have.ownProperty( "alias" ).which.has.property( "type" ).which.is.equal( "string" );
			Item.schema.computeds.should.be.empty();
			Item.schema.hooks.should.be.empty();
		} );
	} );
} );
