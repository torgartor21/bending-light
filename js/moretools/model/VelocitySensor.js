// Copyright (c) 2002 - 2014. University of Colorado Boulder

/**
 * VelocitySensor that has a position and measures velocity
 * @author Siddhartha Chinthapally (Actual Concepts) on 6/24/2014.
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Vector2 = require( 'DOT/Vector2' );

  /**
   * @param {Vector2} value Velocity as measured by the sensor
   * @constructor
   */
  function VelocitySensor( value ) {
    PropertySet.call( this, {
      position: new Vector2( -0.000014, -0.0000035 ), //position of the sensor
      value: value
    } );
    this.addDerivedProperty( 'isArrowVisible', [ 'value' ], function( value ) {
      return value.magnitude() > 0;
    } );
  }

  return inherit( PropertySet, VelocitySensor, {
    /**
     *
     * @param delta
     */
    translate: function( delta ) {
      this.positionProperty.set( this.position.plus( delta ) );
    },

    reset: function() {
      PropertySet.prototype.reset.call( this );
    }
  } );
} )
;