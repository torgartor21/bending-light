// Copyright 2002-2015, University of Colorado Boulder

/**
 * A Medium is a substance through which LightRay instances propagate.
 *
 * @author Chandrashekar Bemagoni (Actual Concepts)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {Shape} shape - shape of the medium
   * @param {Substance} substance - state of the medium
   * @param {Color} color - color of the medium
   * @constructor
   */
  function Medium( shape, substance, color ) {

    // immutable shape
    this.shape = shape; // @public
    this.substance = substance; // @public
    this.color = color; // @public, color is based on the index of refraction at red wavelength
  }

  return inherit( Object, Medium, {

    /**
     * Determines the index of refraction of medium
     * @public
     * @param {number} wavelength - wavelength of the medium
     * @returns {number}
     */
    getIndexOfRefraction: function( wavelength ) {
      return this.substance.dispersionFunction.getIndexOfRefraction( wavelength );
    },

    /**
     * Determines whether the medium is mystery or not
     * @public
     * @returns {boolean}
     */
    isMystery: function() {
      return this.substance.mystery;
    }
  } );
} );
