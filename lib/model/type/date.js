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


const ModelType = require( "./base" );
const NumberUtilities = require( "../../utility/number" );

/**
 * Implements scalar type `date` for use with attributes of defined models.
 *
 * @name ModelTypeDate
 * @extends ModelType
 */
class ModelTypeDate extends ModelType {
	/** @inheritDoc */
	static get typeName() {
		return "date";
	}

	/** @inheritDoc */
	static get aliases() {
		return [ "datetime", "timestamp" ];
	}

	/** @inheritDoc */
	static checkDefinition( definition ) {
		const errors = super.checkDefinition( definition );
		if ( !errors.length ) {
			let { min, max } = definition;
			const { step } = definition;

			if ( min != null ) {
				switch ( typeof min ) {
					case "string" :
						if ( NumberUtilities.ptnFloat.test( min ) ) {
							min = parseFloat( min );
						}

					// falls through
					case "number" :
						definition.min = min = new Date( min );
						break;

					case "object" :
						if ( min instanceof Date ) {
							break;
						}

					// falls through
					default :
						definition.min = min = NaN;
				}

				if ( isNaN( min ) ) {
					errors.push( new TypeError( "invalid requirement on minimum timestamp" ) );
				}
			}

			if ( max != null ) {
				switch ( typeof max ) {
					case "string" :
						if ( NumberUtilities.ptnFloat.test( max ) ) {
							max = parseFloat( max );
						}

					// falls through
					case "number" :
						definition.max = max = new Date( max );
						break;

					case "object" :
						if ( max instanceof Date ) {
							break;
						}

					// falls through
					default :
						definition.max = max = NaN;
				}

				if ( isNaN( max ) ) {
					errors.push( new TypeError( "invalid requirement on maximum timestamp" ) );
				}
			}

			if ( min && max && min.getTime() > max.getTime() ) {
				definition.min = max;
				definition.max = min;
			}

			if ( step != null && ( !step || step < 0 || typeof step === "object" || !NumberUtilities.ptnFloat.test( step ) ) ) {
				errors.push( new TypeError( "invalid requirement on value stepping" ) );
			}
		}

		return errors;
	}

	/** @inheritDoc */
	static coerce( value, requirements = {} ) {
		if ( value == null || value === "" ) {
			value = null;
		} else {
			switch ( typeof value ) {
				case "string" :
					value = value.trim();
					if ( !value.length ) {
						value = null;
						break;
					}

					if ( global.hitchyPtnFloat.test( value ) ) {
						value = parseFloat( value );
					} else {
						value = Date.parse( value );
					}

				// falls through
				case "number" :
					if ( !isNaN( value ) ) {
						value = new Date( Math.trunc( value ) );

						if ( "time" in requirements && !requirements.time ) {
							value.setUTCHours( 0 );
							value.setUTCMinutes( 0 );
							value.setUTCSeconds( 0 );
						}
					}
					break;

				case "object" :
					if ( value instanceof Date ) {
						break;
					}

				// falls through
				default :
					value = NaN;
			}


			const { step } = requirements;

			if ( step > 0 && value instanceof Date ) {
				const ms = value.getTime();

				let { min = 0 } = requirements;
				min = min ? min.getTime() : 0;

				value = new Date( ( Math.round( ( ms - min ) / step ) * step ) + min );
			}
		}

		return value;
	}

	/** @inheritDoc */
	static isValid( name, value, requirements, errors ) {
		if ( requirements.required && ( value == null || isNaN( value ) ) ) {
			errors.push( new Error( `${name} is required` ) );
		}

		if ( value != null ) {
			let { min, max } = requirements;

			if ( !isNaN( min ) ) {
				min = new Date( min );
			}

			if ( min instanceof Date && ( isNaN( value ) || value.getTime() < min.getTime() ) ) {
				errors.push( new Error( `${name} is below required minimum` ) );
			}

			if ( !isNaN( max ) ) {
				max = new Date( max );
			}

			if ( max instanceof Date && ( isNaN( value ) || value > max ) ) {
				errors.push( new Error( `${name} is above required maximum` ) );
			}
		}
	}

	/** @inheritDoc */
	static serialize( value ) {
		if ( value instanceof Date ) {
			const year = value.getUTCFullYear();
			const month = ( "0" + String( value.getUTCMonth() + 1 ) ).slice( -2 );
			const day = ( "0" + String( value.getUTCDate() ) ).slice( -2 );
			const hours = ( "0" + String( value.getUTCHours() ) ).slice( -2 );
			const minutes = ( "0" + String( value.getUTCMinutes() ) ).slice( -2 );
			const seconds = ( "0" + String( value.getUTCSeconds() ) ).slice( -2 );

			value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
		} else {
			value = null;
		}

		return value;
	}

	/** @inheritDoc */
	static compare( value, reference, operation ) {
		let result;

		switch ( operation ) {
			case "eq" :
				result = ( value != null && reference != null && ( value.getTime() === reference.getTime() ) ) || ( value == null && reference == null );
				break;

			case "noteq" :
				result = Boolean( value != null ^ reference != null ) || ( value != null && value.getTime() !== reference.getTime() );
				break;

			case "lt" :
				result = value != null && reference != null && ( value.getTime() < reference.getTime() );
				break;

			case "lte" :
				result = value != null && reference != null && ( value.getTime() <= reference.getTime() );
				break;

			case "gt" :
				result = value != null && reference != null && ( value.getTime() > reference.getTime() );
				break;

			case "gte" :
				result = value != null && reference != null && ( value.getTime() >= reference.getTime() );
				break;

			case "null" :
				result = value == null;
				break;

			case "notnull" :
				result = value != null;
				break;

			case "not" :
				result = !value;
				break;

			default :
				result = false;
				break;
		}

		return result;
	}
}

module.exports = ModelTypeDate;
